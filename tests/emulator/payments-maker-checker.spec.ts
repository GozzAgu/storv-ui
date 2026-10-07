// @vitest-environment node
import { randomUUID } from 'node:crypto'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { deleteApp, initializeApp, type App } from 'firebase-admin/app'
import { getFirestore, type Firestore } from 'firebase-admin/firestore'
import { storeDocRef, verifyStoreAuditChain } from '~/server/utils/payments/audit-log'
import { resolvePaymentsAccess } from '~/server/utils/payments/access'
import { PaymentServiceError } from '~/server/utils/payments/records'
import { updatePaymentSettings } from '~/server/utils/payments/settings'
import {
  closeSale,
  decidePayment,
  lagosToday,
  listAwaiting,
  previewTillDay,
  recordManualPayments,
  refundPayment,
  setMemberPaymentPermissions,
  submitTillCount,
} from '~/server/utils/payments/service'
import {
  attachProof,
  proofReadUrl,
  runProofRetention,
  type ProofStorage,
} from '~/server/utils/payments/proofs'

const FULL_RECEIPTS = { view: true, create: true, edit: false, delete: false, refund: false }
const NO_RECEIPTS = { view: true, create: false, edit: false, delete: false, refund: false }
const CUSTOMER = 'Jane Secret'

describe.skipIf(!process.env.FIRESTORE_EMULATOR_HOST)(
  'Payments V2 maker and checker (emulator)',
  () => {
    let app: App
    let db: Firestore

    beforeAll(() => {
      app = initializeApp({ projectId: 'storv-ui-test-payments' }, `mc-${randomUUID()}`)
      db = getFirestore(app)
    })

    afterAll(async () => {
      await deleteApp(app)
    })

    afterEach(() => {
      vi.restoreAllMocks()
    })

    /** One store per test: owner, cashier, checker (confirm), viewer (view only, cannot record). */
    async function seed(opts: { total?: number; status?: string } = {}) {
      const ownerId = `owner-${randomUUID()}`
      const store = storeDocRef(db, ownerId, 's1')
      await store.set({ ownerId, name: 'Main' })
      const member = (uid: string, extra: Record<string, unknown>) =>
        store
          .collection('members')
          .doc(uid)
          .set({ authUid: uid, status: 'active', ...extra })
      await member('cashier', { permissions: { receipts: FULL_RECEIPTS } })
      await member('checker', {
        staffId: 'st-checker',
        departmentId: 'd1',
        permissions: {
          receipts: FULL_RECEIPTS,
          payments: { view: true, confirm: true, refund: false },
        },
      })
      await member('viewer', {
        permissions: {
          receipts: NO_RECEIPTS,
          payments: { view: true, confirm: false, refund: false },
        },
      })
      await member('gone', { status: 'removed', permissions: { receipts: FULL_RECEIPTS } })
      await store
        .collection('departments')
        .doc('d1')
        .collection('staff')
        .doc('st-checker')
        .set({ firstName: 'Ada', lastName: 'Checker' })
      await store
        .collection('receipts')
        .doc('r1')
        .set({
          receiptNumber: 'R-1',
          total: opts.total ?? 100,
          status: opts.status ?? 'completed',
          storeId: 's1',
          customerName: CUSTOMER,
          customerPhone: '+2348000000000',
          payments: [],
        })
      const as = (uid: string) => resolvePaymentsAccess(db, uid, ownerId, 's1')
      return { ownerId, store, as }
    }

    async function expectCode(promise: Promise<unknown>, code: string, status?: number) {
      const err = await promise.then(
        () => null,
        (e: unknown) => e
      )
      expect(err).toBeInstanceOf(PaymentServiceError)
      expect(err).toMatchObject({ code, ...(status ? { statusCode: status } : {}) })
    }

    const naira = (n: number) => n * 100
    const receipt = async (store: FirebaseFirestore.DocumentReference) =>
      (await store.collection('receipts').doc('r1').get()).data()!
    const notifications = async (store: FirebaseFirestore.DocumentReference) =>
      (await store.collection('notifications').get()).docs.map((d) => d.data())
    const expectChainOk = async (ownerId: string) =>
      expect((await verifyStoreAuditChain(db, ownerId, 's1')).ok).toBe(true)

    describe('access and IDOR', () => {
      it('resolves each role', async () => {
        const { as, ownerId } = await seed()
        expect(await as(ownerId)).toMatchObject({
          isOwner: true,
          canRecord: true,
          canConfirm: true,
          canView: true,
          canRefund: true,
        })
        const cashier = await as('cashier')
        expect(cashier).toMatchObject({
          isOwner: false,
          canRecord: true,
          canConfirm: false,
          canView: false,
        })
        const checker = await as('checker')
        expect(checker).toMatchObject({
          canRecord: true,
          canConfirm: true,
          canView: true,
          canRefund: false,
        })
        expect(checker.actor.name).toBe('Ada Checker')
        const viewer = await as('viewer')
        expect(viewer).toMatchObject({ canRecord: false, canConfirm: false, canView: true })
      })

      it('strangers, removed members and other stores get 404; malformed IDs get 400', async () => {
        const { ownerId, as } = await seed()
        await expectCode(as('stranger'), 'NOT_FOUND', 404)
        await expectCode(as('gone'), 'NOT_FOUND', 404)
        await expectCode(
          resolvePaymentsAccess(db, ownerId, ownerId, 'no-such-store'),
          'NOT_FOUND',
          404
        )
        await expectCode(resolvePaymentsAccess(db, ownerId, ownerId, 's1/../x'), 'INVALID_ID', 400)
        await expectCode(resolvePaymentsAccess(db, ownerId, 'a/b', 's1'), 'INVALID_ID', 400)
      })

      it('a store B user using store A record IDs gets 404 and nothing is written in A', async () => {
        const a = await seed()
        const b = await seed()
        const ownerB = await b.as(b.ownerId)
        await recordManualPayments(db, await a.as('cashier'), {
          receiptId: 'r1',
          tenders: [{ methodLabel: 'Bank Transfer', amountKobo: naira(10) }],
        })
        const paymentA = (await a.store.collection('payments').get()).docs[0]!.id
        const eventsBefore = (await a.store.collection('paymentEvents').get()).size

        await expectCode(
          decidePayment(db, ownerB, { paymentId: paymentA, decision: 'confirm' }),
          'NOT_FOUND',
          404
        )
        await expectCode(
          refundPayment(db, ownerB, { paymentId: paymentA, amountKobo: 100, reason: 'x' }),
          'NOT_FOUND',
          404
        )
        await expectCode(
          proofReadUrl(db, fakeStorage(), ownerB, { paymentId: paymentA }),
          'NOT_FOUND',
          404
        )
        await expectCode(resolvePaymentsAccess(db, b.ownerId, a.ownerId, 's1'), 'NOT_FOUND', 404)

        expect((await a.store.collection('paymentEvents').get()).size).toBe(eventsBefore)
        expect((await a.store.collection('payments').doc(paymentA).get()).data()?.status).toBe(
          'awaiting_confirmation'
        )
        expect((await b.store.collection('payments').get()).size).toBe(0)
      })
    })

    describe('record', () => {
      it('a cashier records split tenders in one go; kinds come from the label; confirmers are notified', async () => {
        const { store, as, ownerId } = await seed()
        const res = await recordManualPayments(db, await as('cashier'), {
          receiptId: 'r1',
          tenders: [
            { methodLabel: 'Cash', amountKobo: naira(30) },
            { methodLabel: 'Card (POS)', amountKobo: naira(30) },
            { methodLabel: 'OPay', amountKobo: naira(40) },
          ],
        })
        expect(res.payments.map((p) => p.status)).toEqual([
          'awaiting_confirmation',
          'awaiting_confirmation',
          'awaiting_confirmation',
        ])
        expect(res.summary).toMatchObject({
          status: 'awaiting_confirmation',
          awaitingKobo: naira(100),
        })
        const kinds = (await store.collection('payments').get()).docs
          .map((d) => d.data().kind)
          .sort()
        expect(kinds).toEqual(['cash', 'manual_transfer', 'pos'])

        const notes = await notifications(store)
        expect(notes).toHaveLength(1)
        expect(notes[0]).toMatchObject({ type: 'payment_awaiting_confirmation', read: false })
        expect(notes[0]!.recipientUids.sort()).toEqual([ownerId, 'checker'].sort())
        expect(JSON.stringify(notes)).not.toContain(CUSTOMER)
        await expectChainOk(ownerId)
      })

      it('the owner auto-confirms and nobody is asked to confirm', async () => {
        const { store, as, ownerId } = await seed()
        const res = await recordManualPayments(db, await as(ownerId), {
          receiptId: 'r1',
          tenders: [{ methodLabel: 'Bank Transfer', amountKobo: naira(100) }],
        })
        expect(res.payments[0]!.status).toBe('confirmed')
        expect(res.summary.status).toBe('paid')
        expect(await notifications(store)).toHaveLength(0)
      })

      it('members without sale rights cannot record; bad input is refused', async () => {
        const { as } = await seed()
        await expectCode(
          recordManualPayments(db, await as('viewer'), {
            receiptId: 'r1',
            tenders: [{ methodLabel: 'Cash', amountKobo: 100 }],
          }),
          'FORBIDDEN',
          403
        )
        const cashier = await as('cashier')
        await expectCode(
          recordManualPayments(db, cashier, {
            receiptId: 'r1',
            tenders: [{ methodLabel: 'Cash', amountKobo: 10.5 }],
          }),
          'INVALID_AMOUNT',
          400
        )
        await expectCode(
          recordManualPayments(db, cashier, {
            receiptId: 'r1',
            tenders: [{ methodLabel: '', amountKobo: 100 }],
          }),
          'INVALID_INPUT',
          400
        )
        await expectCode(
          recordManualPayments(db, cashier, {
            receiptId: 'r1',
            tenders: [{ methodLabel: 'Cash', amountKobo: naira(101) }],
          }),
          'OVERPAYMENT',
          409
        )
        await expectCode(
          recordManualPayments(db, cashier, { receiptId: '../r1', tenders: [] }),
          'INVALID_ID',
          400
        )
      })

      it('balance due: completes once fully recorded; a later rejection reopens V2 and alerts the owner', async () => {
        const { store, as, ownerId } = await seed({ status: 'balance_due' })
        const cashier = await as('cashier')
        const first = await recordManualPayments(db, cashier, {
          receiptId: 'r1',
          tenders: [{ methodLabel: 'Bank Transfer', amountKobo: naira(40) }],
        })
        expect(first.saleCompleted).toBe(false)
        expect(await receipt(store)).toMatchObject({
          status: 'balance_due',
          amountPaid: 40,
          balanceDue: 60,
        })

        const second = await recordManualPayments(db, cashier, {
          receiptId: 'r1',
          tenders: [{ methodLabel: 'Bank Transfer', amountKobo: naira(60) }],
        })
        expect(second.saleCompleted).toBe(true)
        const done = await receipt(store)
        expect(done).toMatchObject({ status: 'completed', amountPaid: 100, balanceDue: 0 })
        expect(done.payments).toHaveLength(2)

        await decidePayment(db, await as('checker'), {
          paymentId: second.payments[0]!.paymentId,
          decision: 'reject',
          reason: 'No transfer arrived',
        })
        const after = await receipt(store)
        expect(after.status).toBe('completed')
        expect(after.paymentSummary).toMatchObject({
          status: 'awaiting_confirmation',
          awaitingKobo: naira(40),
          confirmedKobo: 0,
          balanceKobo: naira(100),
        })
        const rejected = (await notifications(store)).filter((n) => n.type === 'payment_rejected')
        expect(rejected).toHaveLength(1)
        expect(rejected[0]!.recipientUids).toEqual([ownerId])
      })
    })

    describe('confirm and reject', () => {
      async function withAwaiting() {
        const ctx = await seed()
        const res = await recordManualPayments(db, await ctx.as('cashier'), {
          receiptId: 'r1',
          tenders: [{ methodLabel: 'Bank Transfer', amountKobo: naira(50) }],
        })
        return { ...ctx, paymentId: res.payments[0]!.paymentId }
      }

      it('matrix: cashier and viewer refused, checker and owner allowed', async () => {
        const { as, paymentId, ownerId } = await withAwaiting()
        await expectCode(
          decidePayment(db, await as('cashier'), { paymentId, decision: 'confirm' }),
          'FORBIDDEN',
          403
        )
        await expectCode(
          decidePayment(db, await as('viewer'), { paymentId, decision: 'confirm' }),
          'FORBIDDEN',
          403
        )
        const res = await decidePayment(db, await as('checker'), { paymentId, decision: 'confirm' })
        expect(res.items[0]!.status).toBe('confirmed')
        await expectCode(
          decidePayment(db, await as(ownerId), { paymentId, decision: 'confirm' }),
          'INVALID_TRANSITION',
          409
        )
      })

      it('a checker cannot confirm their own entry; reject needs a reason', async () => {
        const { as, store } = await seed()
        const checker = await as('checker')
        const own = await recordManualPayments(db, checker, {
          receiptId: 'r1',
          tenders: [{ methodLabel: 'Bank Transfer', amountKobo: naira(20) }],
        })
        const paymentId = own.payments[0]!.paymentId
        await expectCode(
          decidePayment(db, checker, { paymentId, decision: 'confirm' }),
          'SELF_CONFIRM',
          403
        )
        await expectCode(
          decidePayment(db, checker, { paymentId, decision: 'reject', reason: 'x' }),
          'SELF_CONFIRM',
          403
        )
        const other = await recordManualPayments(db, await as('cashier'), {
          receiptId: 'r1',
          tenders: [{ methodLabel: 'Bank Transfer', amountKobo: naira(20) }],
        })
        await expectCode(
          decidePayment(db, checker, {
            paymentId: other.payments[0]!.paymentId,
            decision: 'reject',
            reason: '  ',
          }),
          'INVALID_INPUT',
          400
        )
        expect((await store.collection('payments').doc(paymentId).get()).data()?.status).toBe(
          'awaiting_confirmation'
        )
      })

      it('end-of-day stores confirm cash only through the till count', async () => {
        const { as, ownerId } = await seed()
        await updatePaymentSettings(db, await as(ownerId), {
          cashConfirmation: 'end_of_day',
          tenderKinds: {},
        })
        const res = await recordManualPayments(db, await as('cashier'), {
          receiptId: 'r1',
          tenders: [{ methodLabel: 'Cash', amountKobo: naira(20) }],
        })
        await expectCode(
          decidePayment(db, await as('checker'), {
            paymentId: res.payments[0]!.paymentId,
            decision: 'confirm',
          }),
          'USE_TILL_COUNT',
          409
        )
      })

      it('the awaiting list is for confirmers, flags own entries and carries no customer data', async () => {
        const { as } = await seed()
        await recordManualPayments(db, await as('cashier'), {
          receiptId: 'r1',
          tenders: [{ methodLabel: 'Bank Transfer', amountKobo: naira(20) }],
        })
        await recordManualPayments(db, await as('checker'), {
          receiptId: 'r1',
          tenders: [{ methodLabel: 'Bank Transfer', amountKobo: naira(20) }],
        })
        await expectCode(listAwaiting(db, await as('cashier')), 'FORBIDDEN', 403)
        const list = await listAwaiting(db, await as('checker'))
        expect(list).toHaveLength(2)
        expect(list.filter((p) => p.isOwnEntry)).toHaveLength(1)
        expect(JSON.stringify(list)).not.toContain(CUSTOMER)
      })
    })

    describe('refunds and closing a sale', () => {
      it('refunds need the permission and a reason; a sale closes only once no money is held', async () => {
        const { as, store, ownerId } = await seed()
        const owner = await as(ownerId)
        const rec = await recordManualPayments(db, owner, {
          receiptId: 'r1',
          tenders: [{ methodLabel: 'Bank Transfer', amountKobo: naira(100) }],
        })
        const paymentId = rec.payments[0]!.paymentId
        await expectCode(
          refundPayment(db, await as('checker'), { paymentId, amountKobo: naira(10), reason: 'x' }),
          'FORBIDDEN',
          403
        )
        await expectCode(
          refundPayment(db, owner, { paymentId, amountKobo: naira(10), reason: '' }),
          'INVALID_INPUT',
          400
        )
        await expectCode(
          closeSale(db, owner, { receiptId: 'r1', action: 'refund', reason: 'Returned' }),
          'MONEY_HELD',
          409
        )

        const partial = await refundPayment(db, owner, {
          paymentId,
          amountKobo: naira(40),
          reason: 'Damaged item',
        })
        expect(partial.items[0]!.status).toBe('partially_refunded')
        const full = await refundPayment(db, owner, {
          paymentId,
          amountKobo: naira(60),
          reason: 'Returned rest',
        })
        expect(full.items[0]!.status).toBe('refunded')

        await expectCode(
          closeSale(db, await as('cashier'), { receiptId: 'r1', action: 'refund', reason: 'x' }),
          'FORBIDDEN',
          403
        )
        await expect(
          closeSale(db, owner, { receiptId: 'r1', action: 'refund', reason: 'Returned' })
        ).resolves.toEqual({
          status: 'refunded',
        })
        expect(await receipt(store)).toMatchObject({ status: 'refunded', refundReason: 'Returned' })
        await expectChainOk(ownerId)
      })
    })

    describe('permissions and settings', () => {
      it('only the owner grants payments permissions; every change is audited with the member', async () => {
        const { as, store, ownerId } = await seed()
        const owner = await as(ownerId)
        await expectCode(
          setMemberPaymentPermissions(db, await as('checker'), {
            memberUid: 'cashier',
            permissions: { view: true, confirm: true, refund: false },
          }),
          'FORBIDDEN',
          403
        )
        await expectCode(
          setMemberPaymentPermissions(db, owner, {
            memberUid: 'nobody',
            permissions: { view: true, confirm: true, refund: false },
          }),
          'NOT_FOUND',
          404
        )
        await expectCode(
          setMemberPaymentPermissions(db, owner, {
            memberUid: ownerId,
            permissions: { view: true, confirm: true, refund: true },
          }),
          'INVALID_INPUT',
          400
        )
        await expectCode(
          setMemberPaymentPermissions(db, owner, {
            memberUid: 'cashier',
            permissions: { view: 'yes' },
          }),
          'INVALID_INPUT',
          400
        )

        await setMemberPaymentPermissions(db, owner, {
          memberUid: 'cashier',
          permissions: { view: true, confirm: true, refund: false },
        })
        expect(
          (await store.collection('members').doc('cashier').get()).data()?.permissions
        ).toMatchObject({
          receipts: FULL_RECEIPTS,
          payments: { view: true, confirm: true, refund: false },
        })
        await setMemberPaymentPermissions(db, owner, {
          memberUid: 'cashier',
          permissions: { view: true, confirm: false, refund: false },
        })
        await setMemberPaymentPermissions(db, owner, {
          memberUid: 'cashier',
          permissions: { view: true, confirm: false, refund: false },
        })
        const events = (await store.collection('paymentEvents').orderBy('seq').get()).docs.map(
          (d) => d.data()
        )
        expect(events.map((e) => [e.type, e.reason, e.subjectUid])).toEqual([
          ['permission_granted', 'payments.view', 'cashier'],
          ['permission_granted', 'payments.confirm', 'cashier'],
          ['permission_revoked', 'payments.confirm', 'cashier'],
        ])
        await expectChainOk(ownerId)
      })

      it('only the owner changes settings; values are validated and audited', async () => {
        const { as, ownerId, store } = await seed()
        await expectCode(
          updatePaymentSettings(db, await as('checker'), {
            cashConfirmation: 'end_of_day',
            tenderKinds: {},
          }),
          'FORBIDDEN',
          403
        )
        await expectCode(
          updatePaymentSettings(db, await as(ownerId), {
            cashConfirmation: 'weekly',
            tenderKinds: {},
          }),
          'INVALID_SETTINGS',
          400
        )
        await expectCode(
          updatePaymentSettings(db, await as(ownerId), {
            cashConfirmation: 'each',
            tenderKinds: { OPay: 'paystack_link' },
          }),
          'INVALID_SETTINGS',
          400
        )
        await updatePaymentSettings(db, await as(ownerId), {
          cashConfirmation: 'each',
          tenderKinds: { Moniepoint: 'pos' },
        })
        const rec = await recordManualPayments(db, await as('cashier'), {
          receiptId: 'r1',
          tenders: [{ methodLabel: 'moniepoint', amountKobo: naira(10) }],
        })
        expect(
          (await store.collection('payments').doc(rec.payments[0]!.paymentId).get()).data()?.kind
        ).toBe('pos')
        const types = (await store.collection('paymentEvents').get()).docs.map((d) => d.data().type)
        expect(types).toContain('settings_changed')
      })
    })

    describe('till count', () => {
      async function tillStore() {
        const ctx = await seed({ total: 1000 })
        await updatePaymentSettings(db, await ctx.as(ctx.ownerId), {
          cashConfirmation: 'end_of_day',
          tenderKinds: {},
        })
        const cashier = await ctx.as('cashier')
        const ids: string[] = []
        for (const amount of [100, 200, 300]) {
          const r = await recordManualPayments(db, cashier, {
            receiptId: 'r1',
            tenders: [{ methodLabel: 'Cash', amountKobo: naira(amount) }],
          })
          ids.push(r.payments[0]!.paymentId)
        }
        const own = await recordManualPayments(db, await ctx.as('checker'), {
          receiptId: 'r1',
          tenders: [{ methodLabel: 'Cash', amountKobo: naira(50) }],
        })
        return { ...ctx, ids, ownId: own.payments[0]!.paymentId }
      }

      it('counts the day in one step, keeps the difference, and alerts the owner', async () => {
        const { as, store, ids, ownId, ownerId } = await tillStore()
        const checker = await as('checker')
        const today = lagosToday()

        const preview = await previewTillDay(db, checker, today)
        expect(preview.lines.map((l) => l.id).sort()).toEqual([...ids].sort())
        expect(preview.expectedKobo).toBe(naira(600))
        expect(preview.ownEntries.map((l) => l.id)).toEqual([ownId])

        await expectCode(
          submitTillCount(db, checker, {
            businessDate: today,
            countedKobo: naira(300),
            confirmIds: [ids[0], ids[1]],
            rejectIds: [],
          }),
          'TILL_COUNT_STALE',
          409
        )
        await expectCode(
          submitTillCount(db, checker, {
            businessDate: today,
            countedKobo: 0,
            confirmIds: [ids[0], ids[1], ids[2], ownId],
            rejectIds: [],
          }),
          'TILL_COUNT_STALE',
          409
        )
        await expectCode(
          submitTillCount(db, checker, {
            businessDate: today,
            countedKobo: 0,
            confirmIds: [ids[0], ids[1]],
            rejectIds: [ids[2]],
          }),
          'INVALID_INPUT',
          400
        )

        const count = await submitTillCount(db, checker, {
          businessDate: today,
          countedKobo: naira(295),
          confirmIds: [ids[0], ids[1]],
          rejectIds: [ids[2]],
          rejectReason: 'Not in the till',
        })
        expect(count).toMatchObject({
          expectedKobo: naira(600),
          confirmedKobo: naira(300),
          rejectedKobo: naira(300),
          differenceKobo: -naira(5),
          countedBy: 'checker',
        })
        const statuses = Object.fromEntries(
          (await store.collection('payments').get()).docs.map((d) => [d.id, d.data().status])
        )
        expect(statuses[ids[0]!]).toBe('confirmed')
        expect(statuses[ids[1]!]).toBe('confirmed')
        expect(statuses[ids[2]!]).toBe('rejected')
        expect(statuses[ownId]).toBe('awaiting_confirmation')
        expect((await store.collection('tillCounts').doc(count.id).get()).exists).toBe(true)

        const types = (await notifications(store)).map((n) => n.type)
        expect(types).toContain('till_count_difference')
        expect(types).toContain('payment_rejected')
        const audit = (await store.collection('paymentEvents').get()).docs.map((d) => d.data().type)
        expect(audit).toContain('till_counted')
        await expectChainOk(ownerId)
      })

      it('refuses cashiers, future days and stores that confirm cash one by one', async () => {
        const { as, ownerId } = await tillStore()
        await expectCode(previewTillDay(db, await as('cashier'), lagosToday()), 'FORBIDDEN', 403)
        await expectCode(
          submitTillCount(db, await as('checker'), {
            businessDate: '2999-01-01',
            countedKobo: 0,
            confirmIds: [],
            rejectIds: [],
          }),
          'INVALID_INPUT',
          400
        )
        await updatePaymentSettings(db, await as(ownerId), {
          cashConfirmation: 'each',
          tenderKinds: {},
        })
        await expectCode(
          submitTillCount(db, await as('checker'), {
            businessDate: lagosToday(),
            countedKobo: 0,
            confirmIds: [],
            rejectIds: [],
          }),
          'TILL_COUNT_OFF',
          409
        )
      })
    })

    describe('proofs', () => {
      it('recorder attaches once; signed URLs follow read rights; retention deletes after 12 months', async () => {
        const { as, store, ownerId } = await seed()
        const cashier = await as('cashier')
        const rec = await recordManualPayments(db, cashier, {
          receiptId: 'r1',
          tenders: [{ methodLabel: 'Bank Transfer', amountKobo: naira(50) }],
        })
        const paymentId = rec.payments[0]!.paymentId
        const storage = fakeStorage()
        const path = `paymentProofs/${ownerId}/s1/${paymentId}/proof.png`

        await expectCode(
          attachProof(db, storage, cashier, { paymentId, fileName: 'proof.png' }),
          'PROOF_MISSING',
          409
        )
        await expectCode(
          attachProof(db, storage, cashier, { paymentId, fileName: '../x.png' }),
          'INVALID_INPUT',
          400
        )
        storage.files.set(path, { size: 6 * 1024 * 1024, contentType: 'image/png' })
        await expectCode(
          attachProof(db, storage, cashier, { paymentId, fileName: 'proof.png' }),
          'PROOF_INVALID',
          400
        )
        storage.files.set(path, { size: 2048, contentType: 'image/png' })
        await expectCode(
          attachProof(db, storage, await as('checker'), { paymentId, fileName: 'proof.png' }),
          'FORBIDDEN',
          403
        )
        await expect(
          attachProof(db, storage, cashier, { paymentId, fileName: 'proof.png' })
        ).resolves.toEqual({
          proofPath: path,
        })
        await expectCode(
          attachProof(db, storage, cashier, { paymentId, fileName: 'proof.png' }),
          'PROOF_EXISTS',
          409
        )

        const now = new Date('2026-10-07T10:00:00Z')
        const url = await proofReadUrl(db, storage, cashier, { paymentId }, now)
        expect(url.expiresAt).toBe('2026-10-07T10:05:00.000Z')
        await expect(
          proofReadUrl(db, storage, await as('viewer'), { paymentId })
        ).resolves.toBeTruthy()
        await recordManualPayments(db, await as('checker'), {
          receiptId: 'r1',
          tenders: [{ methodLabel: 'Bank Transfer', amountKobo: naira(10) }],
        })
        await setMemberPaymentPermissions(db, await as(ownerId), {
          memberUid: 'checker',
          permissions: { view: false, confirm: true, refund: false },
        })
        await store
          .collection('members')
          .doc('other')
          .set({ authUid: 'other', status: 'active', permissions: { receipts: FULL_RECEIPTS } })
        await expectCode(
          proofReadUrl(db, storage, await as('other'), { paymentId }),
          'FORBIDDEN',
          403
        )

        await decidePayment(db, await as('checker'), { paymentId, decision: 'confirm' })
        const decided = (await store.collection('payments').doc(paymentId).get()).data()!
        const deleteAfter = new Date(decided.proofDeleteAfter as string)
        const months =
          (deleteAfter.getUTCFullYear() - new Date(decided.decidedAt).getUTCFullYear()) * 12 +
          deleteAfter.getUTCMonth() -
          new Date(decided.decidedAt).getUTCMonth()
        expect(months).toBe(12)

        const early = await runProofRetention(db, storage, new Date())
        expect(storage.files.has(path)).toBe(true)
        expect(early.failed).toBe(0)
        await runProofRetention(db, storage, new Date(deleteAfter.getTime() + 1000))
        expect(storage.files.has(path)).toBe(false)
        const after = (await store.collection('payments').doc(paymentId).get()).data()!
        expect(after.proofPath).toBeNull()
        expect(after.proofDeletedAt).toBeTruthy()
        await expectChainOk(ownerId)
      })
    })

    describe('logging', () => {
      it('never logs customer names, phone numbers or proof paths', async () => {
        const lines: string[] = []
        for (const level of ['log', 'info', 'warn', 'error'] as const) {
          vi.spyOn(console, level).mockImplementation((...args: unknown[]) => {
            lines.push(args.map((a) => (typeof a === 'string' ? a : JSON.stringify(a))).join(' '))
          })
        }
        const { as, ownerId } = await seed({ status: 'balance_due' })
        const rec = await recordManualPayments(db, await as('cashier'), {
          receiptId: 'r1',
          tenders: [{ methodLabel: 'Bank Transfer', amountKobo: naira(100) }],
        })
        await decidePayment(db, await as('checker'), {
          paymentId: rec.payments[0]!.paymentId,
          decision: 'reject',
          reason: 'Missing',
        })
        await updatePaymentSettings(db, await as(ownerId), {
          cashConfirmation: 'end_of_day',
          tenderKinds: {},
        })
        const output = lines.join('\n')
        expect(output).not.toContain(CUSTOMER)
        expect(output).not.toContain('+2348000000000')
        expect(output).not.toContain('paymentProofs/')
      })
    })
  }
)

function fakeStorage(): ProofStorage & {
  files: Map<string, { size: number; contentType: string }>
} {
  const files = new Map<string, { size: number; contentType: string }>()
  return {
    files,
    async stat(path) {
      const f = files.get(path)
      return f ? { exists: true, ...f } : { exists: false }
    },
    async signedReadUrl(path, expiresAt) {
      return `https://signed.example/${encodeURIComponent(path)}?exp=${expiresAt.getTime()}`
    },
    async remove(path) {
      files.delete(path)
    },
  }
}
