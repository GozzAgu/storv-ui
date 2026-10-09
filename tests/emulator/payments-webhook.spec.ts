// @vitest-environment node
import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { deleteApp, initializeApp, type App } from 'firebase-admin/app'
import { getFirestore, type Firestore } from 'firebase-admin/firestore'
import { storeDocRef, verifyStoreAuditChain } from '~/server/utils/payments/audit-log'
import { resolvePaymentsAccess } from '~/server/utils/payments/access'
import { hashLinkToken } from '~/server/utils/payments/link-token'
import { handleLinkCharge, PAYSTACK_EVENTS_COLLECTION } from '~/server/utils/payments/link-webhook'
import {
  createPaymentLink,
  expireDueLinks,
  LINKS_COLLECTION,
  revokePaymentLink,
  startCheckout,
} from '~/server/utils/payments/links'
import { PAYOUTS_COLLECTION, payoutDocId, type PaystackCall } from '~/server/utils/payments/payout'

const ORIGIN = 'https://app.example.test'
const ENV = { PAYMENTS_V2_LINK_PLANS: 'all' } as NodeJS.ProcessEnv
const SUBACCOUNT = 'ACCT_test1'

type VerifyOverride = Record<string, unknown> | ((ref: string) => unknown)

describe.skipIf(!process.env.FIRESTORE_EMULATOR_HOST)('Payments V2 webhook (emulator)', () => {
  let app: App
  let db: Firestore

  beforeAll(() => {
    app = initializeApp({ projectId: 'storv-ui-test-payments' }, `webhook-${randomUUID()}`)
    db = getFirestore(app)
  })

  afterAll(async () => {
    await deleteApp(app)
  })

  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
  })

  /** A balance-due sale holding one serial item (i1) and 2 of a bulk item (i2, 5 in stock). */
  async function seed(opts: { total?: number } = {}) {
    const ownerId = `owner-${randomUUID()}`
    await db.collection('users').doc(ownerId).set({ subscription: 'storvv_micro' })
    const store = storeDocRef(db, ownerId, 's1')
    await store.set({ ownerId, name: 'Main Shop' })
    await store
      .collection('members')
      .doc('cashier')
      .set({
        authUid: 'cashier',
        status: 'active',
        permissions: {
          receipts: { view: true, create: true, edit: false, delete: false, refund: false },
        },
      })
    await store
      .collection('inventoryFolders')
      .doc('f1')
      .set({ name: 'Phones', hasSerialNumbers: true })
    await store
      .collection('inventoryFolders')
      .doc('f2')
      .set({ name: 'Cases', template: { fields: [{ name: 'quantity' }] } })
    await store
      .collection('inventoryItems')
      .doc('i1')
      .set({ name: 'Phone', pendingSaleReceiptId: 'r1' })
    await store
      .collection('inventoryItems')
      .doc('i2')
      .set({ name: 'Case', quantity: 5, pendingSaleReceiptId: 'r1' })
    await store
      .collection('receipts')
      .doc('r1')
      .set({
        receiptNumber: 'R-1',
        total: opts.total ?? 100,
        status: 'balance_due',
        storeId: 's1',
        itemIds: ['i1', 'i2'],
        items: [
          { itemId: 'i1', folderId: 'f1', quantity: 1 },
          { itemId: 'i2', folderId: 'f2', quantity: 2 },
        ],
        payments: [],
      })
    await db
      .collection(PAYOUTS_COLLECTION)
      .doc(payoutDocId(ownerId, 's1'))
      .set({ ownerUserId: ownerId, storeId: 's1', connected: true, subaccountCode: SUBACCOUNT })
    const cashier = await resolvePaymentsAccess(db, 'cashier', ownerId, 's1')
    return { ownerId, store, cashier }
  }

  /** Paystack mock: initialize returns a URL; verify returns a matching success unless overridden. */
  function paystackMock(amountKobo: number, override?: VerifyOverride) {
    return vi.fn(async (path: string) => {
      if (path === '/transaction/initialize')
        return { authorization_url: 'https://checkout.paystack.com/x' }
      const m = /^\/transaction\/verify\/(.+)$/.exec(path)
      if (!m) throw new Error(`unexpected ${path}`)
      const ref = decodeURIComponent(m[1]!)
      if (typeof override === 'function') return override(ref)
      return {
        id: 4099260516,
        status: 'success',
        reference: ref,
        amount: amountKobo,
        currency: 'NGN',
        channel: 'card',
        paid_at: new Date().toISOString(),
        fees: 150,
        subaccount: { subaccount_code: SUBACCOUNT },
        ...override,
      }
    }) as unknown as PaystackCall & ReturnType<typeof vi.fn>
  }

  async function linkWithCheckout(s: Awaited<ReturnType<typeof seed>>, checkouts = 1) {
    const link = await createPaymentLink(
      db,
      s.cashier,
      { receiptId: 'r1' },
      { env: ENV, appOrigin: ORIGIN }
    )
    const hash = hashLinkToken(link.url.slice(`${ORIGIN}/pay/`.length))
    const refs: string[] = []
    for (let i = 0; i < checkouts; i++) {
      const out = await startCheckout(
        db,
        hash,
        { email: 'payer@example.com' },
        { paystack: paystackMock(link.amountKobo), appOrigin: ORIGIN, ipHash: 'h'.repeat(32) }
      )
      refs.push(out.reference)
    }
    return { link, refs }
  }

  const payment = async (s: { store: FirebaseFirestore.DocumentReference }, id: string) =>
    (await s.store.collection('payments').doc(id).get()).data()!
  const receipt = async (s: { store: FirebaseFirestore.DocumentReference }) =>
    (await s.store.collection('receipts').doc('r1').get()).data()!
  const item = async (s: { store: FirebaseFirestore.DocumentReference }, id: string) =>
    (await s.store.collection('inventoryItems').doc(id).get()).data()!
  const eventDoc = async (ref: string) =>
    (await db.collection(PAYSTACK_EVENTS_COLLECTION).doc(`charge.success_${ref}`).get()).data()
  const notifications = async (s: { store: FirebaseFirestore.DocumentReference }) =>
    (
      await s.store.collection('notifications').where('type', '==', 'payment_link_problem').get()
    ).docs.map((d) => d.data())
  const expectChainOk = async (ownerId: string) =>
    expect((await verifyStoreAuditChain(db, ownerId, 's1')).ok).toBe(true)

  it('verifies, confirms, completes the sale and commits held stock in one go', async () => {
    const s = await seed()
    const { link, refs } = await linkWithCheckout(s)
    const paystack = paystackMock(link.amountKobo)

    const res = await handleLinkCharge(db, refs[0], { paystack, enabled: true })
    expect(res).toEqual({ httpStatus: 200, outcome: 'applied' })
    expect(paystack).toHaveBeenCalledWith(`/transaction/verify/${refs[0]}`, { method: 'GET' })

    expect(await payment(s, link.paymentId)).toMatchObject({
      status: 'confirmed',
      reference: refs[0],
      flags: [],
    })
    expect(await receipt(s)).toMatchObject({ status: 'completed', balanceDue: 0, amountPaid: 100 })
    const i1 = await item(s, 'i1')
    expect(i1.dateOut).toBeTruthy()
    expect(i1.pendingSaleReceiptId).toBeUndefined()
    const i2 = await item(s, 'i2')
    expect(i2).toMatchObject({ quantity: 3 })
    expect(i2.pendingSaleReceiptId).toBeUndefined()
    expect(i2.dateOut).toBeUndefined()

    const linkDoc = (await db.collection(LINKS_COLLECTION).doc(link.linkId).get()).data()!
    expect(linkDoc).toMatchObject({ status: 'paid', paidReference: refs[0] })
    const attempt = (
      await db
        .collection(LINKS_COLLECTION)
        .doc(link.linkId)
        .collection('attempts')
        .doc(refs[0]!)
        .get()
    ).data()!
    expect(attempt).toMatchObject({
      status: 'paid',
      paystackTransactionId: '4099260516',
      channel: 'card',
      feesKobo: 150,
    })
    expect(await eventDoc(refs[0]!)).toMatchObject({
      state: 'processed',
      outcome: 'applied',
      deliveries: 1,
    })
    expect(await notifications(s)).toEqual([])
    await expectChainOk(s.ownerId)
  })

  it('a replayed event is skipped without calling Paystack again', async () => {
    const s = await seed()
    const { link, refs } = await linkWithCheckout(s)
    await handleLinkCharge(db, refs[0], { paystack: paystackMock(link.amountKobo), enabled: true })
    const again = paystackMock(link.amountKobo)
    expect(await handleLinkCharge(db, refs[0], { paystack: again, enabled: true })).toEqual({
      httpStatus: 200,
      outcome: 'already_processed',
    })
    expect(again).not.toHaveBeenCalled()
    expect(await item(s, 'i2')).toMatchObject({ quantity: 3 })
    expect(await eventDoc(refs[0]!)).toMatchObject({ state: 'processed', deliveries: 1 })
  })

  it('10 parallel deliveries of one event confirm once and commit stock once', async () => {
    const s = await seed()
    const { link, refs } = await linkWithCheckout(s)
    const results = await Promise.all(
      Array.from({ length: 10 }, () =>
        handleLinkCharge(db, refs[0], { paystack: paystackMock(link.amountKobo), enabled: true })
      )
    )
    expect(results.every((r) => r.httpStatus === 200)).toBe(true)
    expect(results.filter((r) => r.outcome === 'applied')).toHaveLength(1)
    const payments = await s.store.collection('payments').get()
    expect(payments.size).toBe(1)
    expect(await item(s, 'i2')).toMatchObject({ quantity: 3 })
    expect((await receipt(s)).payments).toHaveLength(1)
    const confirms = await s.store
      .collection('paymentEvents')
      .where('toStatus', '==', 'confirmed')
      .get()
    expect(confirms.size).toBe(1)
    await expectChainOk(s.ownerId)
  })

  it('keeps the event retryable (500) while Payments V2 is off', async () => {
    const s = await seed()
    const { link, refs } = await linkWithCheckout(s)
    const paystack = paystackMock(link.amountKobo)
    expect(await handleLinkCharge(db, refs[0], { paystack, enabled: false })).toEqual({
      httpStatus: 500,
      outcome: 'disabled',
    })
    expect(paystack).not.toHaveBeenCalled()
    expect(await payment(s, link.paymentId)).toMatchObject({ status: 'pending' })
    expect(await eventDoc(refs[0]!)).toMatchObject({
      state: 'failed_retryable',
      outcome: 'disabled',
    })

    expect(await handleLinkCharge(db, refs[0], { paystack, enabled: true })).toMatchObject({
      httpStatus: 200,
      outcome: 'applied',
    })
    expect(await eventDoc(refs[0]!)).toMatchObject({ state: 'processed', deliveries: 2 })
  })

  it('returns 500 and confirms nothing when Paystack verify is down', async () => {
    const s = await seed()
    const { link, refs } = await linkWithCheckout(s)
    const down = vi.fn(async () => {
      throw new Error('502')
    }) as unknown as PaystackCall
    expect(await handleLinkCharge(db, refs[0], { paystack: down, enabled: true })).toEqual({
      httpStatus: 500,
      outcome: 'verify_unavailable',
    })
    expect(await payment(s, link.paymentId)).toMatchObject({ status: 'pending' })
    expect(await eventDoc(refs[0]!)).toMatchObject({ state: 'failed_retryable' })
  })

  it.each([
    ['amount', { amount: 10_150 }, 'AMOUNT_MISMATCH'],
    ['subaccount shape', { subaccount: {} }, 'SUBACCOUNT_MISSING'],
    ['subaccount', { subaccount: { subaccount_code: 'ACCT_attacker' } }, 'SUBACCOUNT_MISMATCH'],
    ['currency', { currency: 'GHS' }, 'CURRENCY_MISMATCH'],
  ])('fails closed on a verify %s mismatch and alerts the owner', async (_label, over, code) => {
    const s = await seed()
    const { link, refs } = await linkWithCheckout(s)
    expect(
      await handleLinkCharge(db, refs[0], {
        paystack: paystackMock(link.amountKobo, over),
        enabled: true,
      })
    ).toEqual({ httpStatus: 200, outcome: 'verify_failed' })
    expect(await payment(s, link.paymentId)).toMatchObject({ status: 'pending' })
    expect(await receipt(s)).toMatchObject({ status: 'balance_due' })
    expect((await item(s, 'i2')).quantity).toBe(5)
    expect(await eventDoc(refs[0]!)).toMatchObject({
      state: 'failed_permanent',
      outcome: `verify_failed:${code}`,
    })
    const notes = await notifications(s)
    expect(notes).toHaveLength(1)
    expect(notes[0]!.userId).toBe(s.ownerId)
  })

  it('a verify that is still pending stays retryable; a failed charge marks the attempt failed', async () => {
    const s = await seed()
    const { link, refs } = await linkWithCheckout(s)
    expect(
      await handleLinkCharge(db, refs[0], {
        paystack: paystackMock(link.amountKobo, { status: 'ongoing' }),
        enabled: true,
      })
    ).toEqual({ httpStatus: 500, outcome: 'verify_failed' })
    expect(
      await handleLinkCharge(db, refs[0], {
        paystack: paystackMock(link.amountKobo, { status: 'failed' }),
        enabled: true,
      })
    ).toEqual({ httpStatus: 200, outcome: 'verify_failed' })
    const attempt = (
      await db
        .collection(LINKS_COLLECTION)
        .doc(link.linkId)
        .collection('attempts')
        .doc(refs[0]!)
        .get()
    ).data()!
    expect(attempt.status).toBe('failed')
    expect(await notifications(s)).toEqual([])
  })

  it('ignores references with no stored attempt (no Paystack call)', async () => {
    const s = await seed()
    const { link } = await linkWithCheckout(s)
    const forged = `stvp_${link.linkId}_${'f'.repeat(16)}`
    const paystack = paystackMock(link.amountKobo)
    expect(await handleLinkCharge(db, forged, { paystack, enabled: true })).toEqual({
      httpStatus: 200,
      outcome: 'unknown_reference',
    })
    expect(paystack).not.toHaveBeenCalled()
    expect(await payment(s, link.paymentId)).toMatchObject({ status: 'pending' })
  })

  it('a payment after expiry is confirmed, flagged and reported', async () => {
    const s = await seed()
    const { link, refs } = await linkWithCheckout(s)
    await expireDueLinks(db, { now: new Date(Date.parse(link.expiresAt) + 1000) })
    expect((await receipt(s)).status).toBe('cancelled')

    const res = await handleLinkCharge(db, refs[0], {
      paystack: paystackMock(link.amountKobo),
      enabled: true,
    })
    expect(res).toEqual({ httpStatus: 200, outcome: 'applied_late' })
    expect(await payment(s, link.paymentId)).toMatchObject({
      status: 'confirmed',
      flags: ['paid_after_expiry'],
    })
    expect((await receipt(s)).status).toBe('cancelled')
    expect((await item(s, 'i2')).quantity).toBe(5)
    const notes = await notifications(s)
    expect(notes).toHaveLength(1)
    expect(notes[0]!.message).toContain('after the link expired')
    await expectChainOk(s.ownerId)
  })

  it('a payment after revoke whose stock has since sold is flagged oversold', async () => {
    const s = await seed()
    const { link, refs } = await linkWithCheckout(s)
    await revokePaymentLink(db, s.cashier, { linkId: link.linkId, reason: 'customer left' })
    await s.store.collection('inventoryItems').doc('i1').update({ dateOut: new Date() })

    const res = await handleLinkCharge(db, refs[0], {
      paystack: paystackMock(link.amountKobo),
      enabled: true,
    })
    expect(res.outcome).toBe('applied_late')
    const p = await payment(s, link.paymentId)
    expect(p.status).toBe('confirmed')
    expect(p.flags).toEqual(expect.arrayContaining(['paid_after_revoke', 'oversold']))
    const notes = await notifications(s)
    expect(notes[0]!.message).toContain('after the link was revoked')
    expect(notes[0]!.message).toContain('already sold')
    await expectChainOk(s.ownerId)
  })

  it('stock sold elsewhere while held still confirms, completes and flags oversold', async () => {
    const s = await seed()
    const { link, refs } = await linkWithCheckout(s)
    await s.store.collection('inventoryItems').doc('i2').update({ quantity: 1 })

    const res = await handleLinkCharge(db, refs[0], {
      paystack: paystackMock(link.amountKobo),
      enabled: true,
    })
    expect(res.outcome).toBe('applied_late')
    expect((await payment(s, link.paymentId)).flags).toEqual(['oversold'])
    expect((await receipt(s)).status).toBe('completed')
    const i2 = await item(s, 'i2')
    expect(i2.quantity).toBe(1)
    expect(i2.pendingSaleReceiptId).toBeUndefined()
    expect((await item(s, 'i1')).dateOut).toBeTruthy()
  })

  it('a second paid checkout on the same link is recorded once as a flagged duplicate', async () => {
    const s = await seed()
    const { link, refs } = await linkWithCheckout(s, 2)
    const paystack = paystackMock(link.amountKobo)
    await handleLinkCharge(db, refs[0], { paystack, enabled: true })

    const dup = await handleLinkCharge(db, refs[1], { paystack, enabled: true })
    expect(dup).toEqual({ httpStatus: 200, outcome: 'applied_duplicate' })
    const again = await handleLinkCharge(db, refs[1], { paystack, enabled: true })
    expect(again.outcome).toBe('already_processed')

    const payments = (await s.store.collection('payments').get()).docs.map((d) => d.data())
    expect(payments).toHaveLength(2)
    const extra = payments.find((p) => p.reference === refs[1])!
    expect(extra.status).toBe('confirmed')
    expect(extra.flags).toEqual(expect.arrayContaining(['duplicate_payment', 'overpaid']))
    expect((await item(s, 'i2')).quantity).toBe(3)
    expect((await notifications(s))[0]!.message).toContain('paid twice')
    await expectChainOk(s.ownerId)
  })
})
