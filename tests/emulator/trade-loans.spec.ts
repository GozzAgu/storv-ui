// @vitest-environment node
import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { deleteApp, initializeApp, type App } from 'firebase-admin/app'
import { getFirestore, type Firestore } from 'firebase-admin/firestore'
import { storeDocRef } from '~/server/utils/payments/audit-log'
import { handleLinkCharge } from '~/server/utils/payments/link-webhook'
import { LINKS_COLLECTION } from '~/server/utils/payments/links'
import { PAYOUTS_COLLECTION, type PaystackCall } from '~/server/utils/payments/payout'
import { PaymentServiceError } from '~/server/utils/payments/records'
import {
  inviteTradePartner,
  respondToConnection,
  saveTradeProfile,
  TradeError,
  tradeKey,
  type TradeScope,
} from '~/server/utils/trade/partners'
import { createTradeRequest } from '~/server/utils/trade/requests'
import {
  createTradeLoan,
  listTradeLoans,
  partnerLoanFlag,
  remindDueTradeLoans,
  returnTradeLoanItems,
  startTradeLoanPayment,
  TRADE_LOANS,
  tradeLendBlocker,
} from '~/server/utils/trade/loans'

const ORIGIN = 'https://app.example.test'
const ENV = { PAYMENTS_V2_LINK_PLANS: 'all' } as NodeJS.ProcessEnv
const SUBACCOUNT = 'ACCT_lender1'
const DAY = 24 * 60 * 60 * 1000

async function expectCode(promise: Promise<unknown>, code: string) {
  const err = await promise.then(
    () => null,
    (e: unknown) => e
  )
  expect(err instanceof TradeError || err instanceof PaymentServiceError).toBe(true)
  expect((err as TradeError).code).toBe(code)
}

/** A Lagos calendar date `days` from now. */
const lagosDate = (days: number) =>
  new Date(Date.now() + days * DAY + 60 * 60 * 1000).toISOString().slice(0, 10)

describe.skipIf(!process.env.FIRESTORE_EMULATOR_HOST)('Trade partner loans (emulator)', () => {
  let app: App
  let db: Firestore

  beforeAll(() => {
    app = initializeApp({ projectId: 'storv-ui-test-trade' }, `trade-loans-${randomUUID()}`)
    db = getFirestore(app)
  })

  afterAll(async () => {
    await deleteApp(app)
  })

  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
  })

  const uniq = () => randomUUID().slice(0, 8)

  async function shop(name: string, plan = 'storvv_micro') {
    const scope: TradeScope = { ownerId: `owner-${randomUUID()}`, storeId: 's1' }
    await db.collection('users').doc(scope.ownerId).set({ subscription: plan })
    await storeDocRef(db, scope.ownerId, scope.storeId).set({ ownerId: scope.ownerId, name })
    const handle = `${name.toLowerCase().replace(/\s+/g, '-')}-${uniq()}`
    await saveTradeProfile(db, scope, { handle, displayName: name })
    await db
      .collection(PAYOUTS_COLLECTION)
      .doc(tradeKey(scope))
      .set({ connected: true, subaccountCode: SUBACCOUNT })
    return { scope, handle, uid: scope.ownerId }
  }

  const store = (scope: TradeScope) => storeDocRef(db, scope.ownerId, scope.storeId)
  const item = (scope: TradeScope, id: string) => store(scope).collection('inventoryItems').doc(id)

  /** Lender (Enterprise) has two phones in a serial folder and one charger in a quantity folder. */
  async function stock(scope: TradeScope) {
    const folders = store(scope).collection('inventoryFolders')
    await folders.doc('phones').set({ name: 'Phones', hasSerialNumbers: true })
    await folders.doc('chargers').set({ name: 'Chargers', hasSerialNumbers: false })
    await item(scope, 'p1').set({ name: 'iPhone 15', serialNo: 'IMEI-1', folderId: 'phones' })
    await item(scope, 'p2').set({ name: 'iPhone 15', serialNo: 'IMEI-2', folderId: 'phones' })
    await item(scope, 'c1').set({ name: 'Charger', quantity: 20, folderId: 'chargers' })
  }

  async function partners() {
    const lender = await shop('Ikeja Hub', 'storvv_enterprise')
    const borrower = await shop('Lagos Shop')
    const { connectionId } = await inviteTradePartner(db, borrower.scope, lender.handle)
    await respondToConnection(db, lender.scope, connectionId, 'accept')
    await stock(lender.scope)
    return { lender, borrower, connectionId }
  }

  const PHONES = [
    { itemId: 'p1', folderId: 'phones', priceKobo: 145_000_000 },
    { itemId: 'p2', folderId: 'phones', priceKobo: 140_000_000 },
  ]

  const lend = (
    p: Awaited<ReturnType<typeof partners>>,
    over: Record<string, unknown> = {},
    actor = p.lender.uid
  ) =>
    createTradeLoan(db, p.lender.scope, actor, {
      to: p.borrower.handle,
      requestId: null,
      dueDate: lagosDate(7),
      lines: PHONES,
      ...over,
    })

  async function notes(scope: TradeScope, type: string) {
    const snap = await store(scope).collection('notifications').where('type', '==', type).get()
    return snap.docs.map((x) => x.data())
  }

  function paystackMock(amountKobo: number) {
    return vi.fn(async (path: string) => {
      if (path === '/transaction/initialize')
        return { authorization_url: 'https://checkout.paystack.com/x' }
      const ref = decodeURIComponent(/^\/transaction\/verify\/(.+)$/.exec(path)![1]!)
      return {
        id: 1,
        status: 'success',
        reference: ref,
        amount: amountKobo,
        currency: 'NGN',
        channel: 'card',
        paid_at: new Date().toISOString(),
        fees: 150,
        subaccount: { subaccount_code: SUBACCOUNT },
        customer: { email: 'borrower@example.com' },
      }
    }) as unknown as PaystackCall
  }

  const payDeps = (amountKobo: number) => ({
    env: ENV,
    paystack: paystackMock(amountKobo),
    appOrigin: ORIGIN,
    ipHash: 'h'.repeat(32),
  })

  describe('lending', () => {
    it('needs Enterprise, an active partner, and available serial items', async () => {
      const p = await partners()
      const micro = await shop('Small Shop')
      await stock(micro.scope)
      const { connectionId } = await inviteTradePartner(db, micro.scope, p.borrower.handle)
      await respondToConnection(db, p.borrower.scope, connectionId, 'accept')
      await expectCode(
        createTradeLoan(db, micro.scope, micro.uid, {
          to: p.borrower.handle,
          dueDate: lagosDate(7),
          lines: PHONES,
        }),
        'PLAN_REQUIRED'
      )
      expect(await tradeLendBlocker(db, micro.scope)).toBe('no_plan')
      expect(await tradeLendBlocker(db, p.lender.scope)).toBeNull()

      const stranger = await shop('Stranger')
      await expectCode(lend(p, { to: stranger.handle }), 'NOT_PARTNERS')
      await expectCode(lend(p, { dueDate: lagosDate(-1) }), 'INVALID_DUE_DATE')
      await expectCode(lend(p, { dueDate: lagosDate(120) }), 'INVALID_DUE_DATE')
      await expectCode(
        lend(p, { lines: [{ itemId: 'c1', folderId: 'chargers', priceKobo: 450_000 }] }),
        'NOT_SERIAL'
      )
      await item(p.lender.scope, 'p2').update({ dateOut: new Date() })
      await expectCode(lend(p), 'ITEM_UNAVAILABLE')
      await item(p.lender.scope, 'p2').update({ dateOut: null })
      await expectCode(lend(p, { lines: [{ ...PHONES[0], priceKobo: 0 }] }), 'INVALID_PRICE')
    })

    it('any active staff member can lend; both sides see the loan and the items are flagged', async () => {
      const p = await partners()
      await store(p.lender.scope)
        .collection('members')
        .doc('porter')
        .set({ status: 'active', role: 'staff' })
      const { id } = await lend(p, {}, 'porter')

      expect((await item(p.lender.scope, 'p1').get()).data()).toMatchObject({
        sellerLoanOutId: partnerLoanFlag(id),
        sellerLoanPartyName: 'Lagos Shop',
      })
      await expectCode(lend(p), 'ITEM_UNAVAILABLE')

      const [lent] = await listTradeLoans(db, p.lender.scope)
      const [borrowed] = await listTradeLoans(db, p.borrower.scope)
      expect(lent).toMatchObject({ id, direction: 'lent', settled: false, overdue: false })
      expect(lent!.partner.handle).toBe(p.borrower.handle)
      expect(borrowed).toMatchObject({
        id,
        direction: 'borrowed',
        outstandingKobo: 285_000_000,
      })
      expect(borrowed!.lines.map((l) => [l.name, l.serial, l.state])).toEqual([
        ['iPhone 15', 'IMEI-1', 'out'],
        ['iPhone 15', 'IMEI-2', 'out'],
      ])
      expect(borrowed!.events).toMatchObject([{ by: 'lender', action: 'lent' }])

      const [note] = await notes(p.borrower.scope, 'trade_loan')
      expect(note).toMatchObject({ source: 'trade', metadata: { loanId: id } })
      expect(await listTradeLoans(db, (await shop('Outsider')).scope)).toEqual([])
    })

    it('can answer a stock request, but only one the borrower sent to the lender', async () => {
      const p = await partners()
      const { id: requestId } = await createTradeRequest(db, p.borrower.scope, p.borrower.uid, {
        item: 'iPhone 15',
      })
      const { id } = await lend(p, { requestId })
      expect((await listTradeLoans(db, p.borrower.scope))[0]!.requestId).toBe(requestId)

      const other = await shop('Other Shop')
      const link = await inviteTradePartner(db, other.scope, p.lender.handle)
      await respondToConnection(db, p.lender.scope, link.connectionId, 'accept')
      const { id: notTheirs } = await createTradeRequest(db, other.scope, other.uid, {
        item: 'iPhone 15',
      })
      await expectCode(lend(p, { requestId: notTheirs }), 'NOT_FOUND')
      expect(id).toBeTruthy()
    })
  })

  describe('returns', () => {
    it('the borrower marks returned, the lender confirms, and stock is freed', async () => {
      const p = await partners()
      const { id } = await lend(p)
      const outsider = await shop('Outsider')
      await expectCode(
        returnTradeLoanItems(db, outsider.scope, outsider.uid, { loanId: id, lineIds: ['l1'] }),
        'NOT_FOUND'
      )
      await expectCode(
        returnTradeLoanItems(db, p.borrower.scope, p.borrower.uid, { loanId: id, lineIds: ['l9'] }),
        'INVALID_LINES'
      )

      await returnTradeLoanItems(db, p.borrower.scope, p.borrower.uid, {
        loanId: id,
        lineIds: ['l1'],
      })
      expect((await listTradeLoans(db, p.lender.scope))[0]!.lines[0]!.state).toBe('return_marked')
      expect(await notes(p.lender.scope, 'trade_loan')).toHaveLength(1)
      await expectCode(
        returnTradeLoanItems(db, p.borrower.scope, p.borrower.uid, { loanId: id, lineIds: ['l1'] }),
        'LINE_SETTLED'
      )
      // Still lent until the lender confirms.
      expect((await item(p.lender.scope, 'p1').get()).data()!.sellerLoanOutId).toBe(
        partnerLoanFlag(id)
      )

      await returnTradeLoanItems(db, p.lender.scope, p.lender.uid, {
        loanId: id,
        lineIds: ['l1', 'l2'],
      })
      for (const itemId of ['p1', 'p2']) {
        const data = (await item(p.lender.scope, itemId).get()).data()!
        expect(data.sellerLoanOutId).toBeUndefined()
        expect(data.dateOut).toBeUndefined()
      }
      const [loan] = await listTradeLoans(db, p.borrower.scope)
      expect(loan).toMatchObject({ settled: true, outstandingKobo: 0 })
      expect((await db.collection(TRADE_LOANS).doc(id).get()).data()!.status).toBe('settled')
      expect(loan!.events.map((e) => [e.by, e.action])).toEqual([
        ['lender', 'lent'],
        ['borrower', 'return_marked'],
        ['lender', 'returned'],
      ])
    })
  })

  describe('paying for sold items', () => {
    it('the borrower pays the lender; the lender’s items are sold and the lines settle', async () => {
      const p = await partners()
      const { id } = await lend(p)

      await expectCode(
        startTradeLoanPayment(
          db,
          p.lender.scope,
          p.lender.uid,
          'x@example.com',
          {
            loanId: id,
            lineIds: ['l1'],
          },
          payDeps(1)
        ),
        'NOT_FOUND'
      )
      await expectCode(
        startTradeLoanPayment(
          db,
          p.borrower.scope,
          p.borrower.uid,
          undefined,
          {
            loanId: id,
            lineIds: ['l1'],
          },
          payDeps(1)
        ),
        'NO_EMAIL'
      )

      const started = await startTradeLoanPayment(
        db,
        p.borrower.scope,
        p.borrower.uid,
        'borrower@example.com',
        { loanId: id, lineIds: ['l1'] },
        payDeps(145_000_000)
      )
      expect(started.authorizationUrl).toBe('https://checkout.paystack.com/x')

      const stored = (await db.collection(TRADE_LOANS).doc(id).get()).data()!
      const line = stored.lines[0]
      expect(line).toMatchObject({ state: 'out' })
      expect(line.payLinkId).toBeTruthy()
      expect(JSON.stringify(stored)).not.toContain('/pay/')
      const receipt = (
        await store(p.lender.scope).collection('receipts').doc(line.payReceiptId).get()
      ).data()!
      expect(receipt).toMatchObject({
        status: 'balance_due',
        paymentsV2: true,
        tradeLoanId: id,
        total: 1_450_000,
        customerName: 'Lagos Shop',
        createdBy: p.lender.scope.ownerId,
      })
      expect((await item(p.lender.scope, 'p1').get()).data()!.pendingSaleReceiptId).toBe(
        line.payReceiptId
      )
      expect((await listTradeLoans(db, p.borrower.scope))[0]!.lines[0]!.state).toBe('paying')

      // Resuming reuses the same link; returning is blocked while it is open.
      await startTradeLoanPayment(
        db,
        p.borrower.scope,
        p.borrower.uid,
        'borrower@example.com',
        {
          loanId: id,
          lineIds: ['l1'],
        },
        payDeps(145_000_000)
      )
      expect((await db.collection(TRADE_LOANS).doc(id).get()).data()!.payLinkIds).toHaveLength(1)
      await expectCode(
        returnTradeLoanItems(db, p.lender.scope, p.lender.uid, { loanId: id, lineIds: ['l1'] }),
        'PAYING'
      )

      const attempts = await db
        .collection(LINKS_COLLECTION)
        .doc(line.payLinkId)
        .collection('attempts')
        .get()
      const res = await handleLinkCharge(db, attempts.docs[0]!.id, {
        paystack: paystackMock(145_000_000),
        enabled: true,
      })
      expect(res.outcome).toBe('applied')

      const sold = (await item(p.lender.scope, 'p1').get()).data()!
      expect(sold.dateOut).toBeTruthy()
      expect(sold.sellerLoanOutId).toBeUndefined()
      expect(sold.pendingSaleReceiptId).toBeUndefined()
      expect((await item(p.lender.scope, 'p2').get()).data()!.sellerLoanOutId).toBe(
        partnerLoanFlag(id)
      )
      expect(
        (await store(p.lender.scope).collection('receipts').doc(line.payReceiptId).get()).data()!
          .status
      ).toBe('completed')
      expect(await notes(p.lender.scope, 'payment_link_problem')).toHaveLength(0)

      const [loan] = await listTradeLoans(db, p.lender.scope)
      expect(loan!.lines.map((l) => l.state)).toEqual(['paid', 'out'])
      expect(loan).toMatchObject({ settled: false, outstandingKobo: 140_000_000 })
      expect(loan!.events.at(-1)).toMatchObject({ by: 'system', action: 'paid', lineIds: ['l1'] })
      const lenderNote = (await notes(p.lender.scope, 'trade_loan')).find(
        (n) => n.title === 'Loan payment received'
      )
      expect(lenderNote!.message).toContain('₦1,450,000')
      expect(
        (await notes(p.borrower.scope, 'trade_loan')).some((n) => n.title === 'Payment sent')
      ).toBe(true)
      await expectCode(
        startTradeLoanPayment(
          db,
          p.borrower.scope,
          p.borrower.uid,
          'borrower@example.com',
          {
            loanId: id,
            lineIds: ['l1'],
          },
          payDeps(1)
        ),
        'LINE_SETTLED'
      )
    })

    it('undoes the sale and holds when the lender has no payout account', async () => {
      const p = await partners()
      const { id } = await lend(p)
      await db.collection(PAYOUTS_COLLECTION).doc(tradeKey(p.lender.scope)).delete()
      await expectCode(
        startTradeLoanPayment(
          db,
          p.borrower.scope,
          p.borrower.uid,
          'borrower@example.com',
          {
            loanId: id,
            lineIds: ['l1', 'l2'],
          },
          payDeps(1)
        ),
        'PAYOUT_NOT_CONNECTED'
      )
      const loan = (await db.collection(TRADE_LOANS).doc(id).get()).data()!
      expect(loan.lines.map((l: { payReceiptId: unknown }) => l.payReceiptId)).toEqual([null, null])
      expect((await store(p.lender.scope).collection('receipts').get()).size).toBe(0)
      expect((await item(p.lender.scope, 'p1').get()).data()!.pendingSaleReceiptId).toBeUndefined()
    })
  })

  describe('reminders', () => {
    it('remind both sides on the due date, then every 3 days, until settled', async () => {
      const p = await partners()
      const { id } = await lend(p, { dueDate: lagosDate(0) })
      const ref = db.collection(TRADE_LOANS).doc(id)
      const now = new Date()
      const due = (await remindDueTradeLoans(db, { now })).reminded
      expect(due).toBeGreaterThanOrEqual(1)
      const [lenderDue] = await notes(p.lender.scope, 'trade_loan_due')
      const [borrowerDue] = await notes(p.borrower.scope, 'trade_loan_due')
      expect(lenderDue).toMatchObject({ title: 'Loan due today', metadata: { loanId: id } })
      expect(borrowerDue!.message).toContain('₦2,850,000')

      await remindDueTradeLoans(db, { now: new Date(now.getTime() + DAY) })
      expect(await notes(p.borrower.scope, 'trade_loan_due')).toHaveLength(1)
      await remindDueTradeLoans(db, { now: new Date(now.getTime() + 3 * DAY) })
      const later = await notes(p.borrower.scope, 'trade_loan_due')
      expect(later).toHaveLength(2)
      expect(later.some((n) => n.title === 'Loan overdue')).toBe(true)
      expect(
        (await listTradeLoans(db, p.borrower.scope, now.getTime() + 3 * DAY))[0]!.overdue
      ).toBe(true)

      await returnTradeLoanItems(db, p.lender.scope, p.lender.uid, {
        loanId: id,
        lineIds: ['l1', 'l2'],
      })
      expect((await ref.get()).data()!.status).toBe('settled')
      await remindDueTradeLoans(db, { now: new Date(now.getTime() + 6 * DAY) })
      expect(await notes(p.borrower.scope, 'trade_loan_due')).toHaveLength(2)
    })
  })
})
