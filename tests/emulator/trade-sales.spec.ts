// @vitest-environment node
import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { deleteApp, initializeApp, type App } from 'firebase-admin/app'
import { getFirestore, type Firestore } from 'firebase-admin/firestore'
import { resolvePaymentsAccess } from '~/server/utils/payments/access'
import { storeDocRef } from '~/server/utils/payments/audit-log'
import { hashLinkToken } from '~/server/utils/payments/link-token'
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
import { createTradeRequest, replyToTradeRequest } from '~/server/utils/trade/requests'
import {
  claimTradeSaleStock,
  createTradeSale,
  listTradeSales,
  payTradeSale,
  TRADE_SALES,
  tradeSaleReceipt,
  tradeSellBlocker,
} from '~/server/utils/trade/sales'

const ORIGIN = 'https://app.example.test'
const ENV = { PAYMENTS_V2_LINK_PLANS: 'all' } as NodeJS.ProcessEnv
const SUBACCOUNT = 'ACCT_trade1'

async function expectCode(promise: Promise<unknown>, code: string) {
  const err = await promise.then(
    () => null,
    (e: unknown) => e
  )
  expect(err instanceof TradeError || err instanceof PaymentServiceError).toBe(true)
  expect((err as TradeError).code).toBe(code)
}

describe.skipIf(!process.env.FIRESTORE_EMULATOR_HOST)('Trade partner sales (emulator)', () => {
  let app: App
  let db: Firestore

  beforeAll(() => {
    app = initializeApp({ projectId: 'storv-ui-test-trade' }, `trade-sales-${randomUUID()}`)
    db = getFirestore(app)
  })

  afterAll(async () => {
    await deleteApp(app)
  })

  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
  })

  const uniq = () => randomUUID().slice(0, 8)

  async function shop(name: string, opts: { payout?: boolean } = {}) {
    const scope: TradeScope = { ownerId: `owner-${randomUUID()}`, storeId: 's1' }
    await db.collection('users').doc(scope.ownerId).set({ subscription: 'storvv_micro' })
    await storeDocRef(db, scope.ownerId, scope.storeId).set({ ownerId: scope.ownerId, name })
    const handle = `${name.toLowerCase().replace(/\s+/g, '-')}-${uniq()}`
    await saveTradeProfile(db, scope, { handle, displayName: name })
    if (opts.payout !== false) {
      await db
        .collection(PAYOUTS_COLLECTION)
        .doc(tradeKey(scope))
        .set({ connected: true, subaccountCode: SUBACCOUNT })
    }
    return { scope, handle, uid: scope.ownerId }
  }

  /** Seller holds one phone (serial) for an unpaid ₦1,450,000 sale `r1`. */
  async function unpaidSale(scope: TradeScope, extra: Record<string, unknown> = {}) {
    const store = storeDocRef(db, scope.ownerId, scope.storeId)
    await store
      .collection('inventoryFolders')
      .doc('f1')
      .set({ name: 'Phones', hasSerialNumbers: true })
    await store
      .collection('inventoryItems')
      .doc('i1')
      .set({ name: 'iPhone 15', pendingSaleReceiptId: 'r1' })
    await store
      .collection('receipts')
      .doc('r1')
      .set({
        receiptNumber: 'REC-000001',
        total: 1_450_000,
        status: 'balance_due',
        paymentsV2: true,
        storeId: scope.storeId,
        customerName: 'Lagos Shop',
        itemIds: ['i1'],
        items: [
          {
            itemId: 'i1',
            folderId: 'f1',
            quantity: 1,
            price: 1_450_000,
            itemName: 'iPhone 15 Pro Max',
            serialNo: '356938035643809',
            brand: 'Apple',
          },
        ],
        payments: [],
        ...extra,
      })
  }

  /** Buyer asks, seller answers "have", and the seller has an unpaid sale ready. */
  async function deal() {
    const buyer = await shop('Lagos Shop')
    const seller = await shop('Ikeja Hub')
    const { connectionId } = await inviteTradePartner(db, buyer.scope, seller.handle)
    await respondToConnection(db, seller.scope, connectionId, 'accept')
    const { id: requestId } = await createTradeRequest(db, buyer.scope, buyer.uid, {
      item: 'iPhone 15 Pro Max',
    })
    await unpaidSale(seller.scope)
    const payments = await resolvePaymentsAccess(
      db,
      seller.uid,
      seller.scope.ownerId,
      seller.scope.storeId
    )
    return { buyer, seller, requestId, payments, connectionId }
  }

  const bill = (d: Awaited<ReturnType<typeof deal>>) =>
    createTradeSale(
      db,
      d.payments,
      d.seller.uid,
      { requestId: d.requestId, receiptId: 'r1' },
      { env: ENV, appOrigin: ORIGIN }
    )

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
        customer: { email: 'buyer@example.com' },
      }
    }) as unknown as PaystackCall
  }

  const checkoutDeps = (amountKobo: number) => ({
    paystack: paystackMock(amountKobo),
    appOrigin: ORIGIN,
    ipHash: 'h'.repeat(32),
  })

  async function notes(scope: TradeScope, type: string) {
    const snap = await storeDocRef(db, scope.ownerId, scope.storeId)
      .collection('notifications')
      .where('type', '==', type)
      .get()
    return snap.docs.map((x) => x.data())
  }

  /** Buyer pays in the app; the webhook then applies the charge. */
  async function payAndSettle(d: Awaited<ReturnType<typeof deal>>, saleId: string) {
    const sale = (await db.collection(TRADE_SALES).doc(saleId).get()).data()!
    await payTradeSale(
      db,
      d.buyer.scope,
      'buyer@example.com',
      saleId,
      checkoutDeps(sale.amountKobo)
    )
    const attempts = await db
      .collection(LINKS_COLLECTION)
      .doc(sale.linkId)
      .collection('attempts')
      .get()
    const res = await handleLinkCharge(db, attempts.docs[0]!.id, {
      paystack: paystackMock(sale.amountKobo),
      enabled: true,
    })
    expect(res.outcome).toBe('applied')
  }

  describe('billing a partner', () => {
    it('needs a "have" reply, an unpaid sale, and bills each sale once', async () => {
      const d = await deal()
      await expectCode(bill(d), 'REPLY_FIRST')
      await replyToTradeRequest(db, d.seller.scope, d.seller.uid, d.requestId, {
        status: 'have',
        priceKobo: 145_000_000,
        quantity: 1,
      })

      const outsider = await shop('Nosy Shop')
      await unpaidSale(outsider.scope)
      const outsiderAccess = await resolvePaymentsAccess(
        db,
        outsider.uid,
        outsider.scope.ownerId,
        's1'
      )
      await expectCode(
        createTradeSale(
          db,
          outsiderAccess,
          outsider.uid,
          { requestId: d.requestId, receiptId: 'r1' },
          { env: ENV, appOrigin: ORIGIN }
        ),
        'NOT_FOUND'
      )

      const made = await bill(d)
      expect(made.url).toMatch(`${ORIGIN}/pay/`)
      const stored = (await db.collection(TRADE_SALES).doc(made.id).get()).data()!
      expect(stored).toMatchObject({
        status: 'ready',
        buyerKey: tradeKey(d.buyer.scope),
        sellerKey: tradeKey(d.seller.scope),
        amountKobo: 145_000_000,
        tokenHash: hashLinkToken(made.url.slice(`${ORIGIN}/pay/`.length)),
        lines: [
          {
            name: 'iPhone 15 Pro Max',
            quantity: 1,
            unitPriceKobo: 145_000_000,
            brand: 'Apple',
            model: '',
            serial: '356938035643809',
          },
        ],
      })
      expect(JSON.stringify(stored)).not.toContain(made.url.slice(`${ORIGIN}/pay/`.length))
      await expectCode(bill(d), 'ALREADY_BILLED')

      const [note] = await notes(d.buyer.scope, 'trade_sale')
      expect(note).toMatchObject({
        source: 'trade',
        metadata: { requestId: d.requestId, saleId: made.id },
      })
      expect(note!.message).toContain('₦1,450,000')
    })

    it('refuses a paid sale, and frees the sale when the link cannot be made', async () => {
      const d = await deal()
      await replyToTradeRequest(db, d.seller.scope, d.seller.uid, d.requestId, { status: 'have' })
      await unpaidSale(d.seller.scope, { status: 'completed' })
      await expectCode(bill(d), 'NOT_BILLABLE')

      await unpaidSale(d.seller.scope)
      await db.collection(PAYOUTS_COLLECTION).doc(tradeKey(d.seller.scope)).delete()
      await expectCode(bill(d), 'PAYOUT_NOT_CONNECTED')
      await db
        .collection(PAYOUTS_COLLECTION)
        .doc(tradeKey(d.seller.scope))
        .set({ connected: true, subaccountCode: SUBACCOUNT })
      expect((await bill(d)).id).toBeTruthy()
    })

    it('stops once the partnership ends', async () => {
      const d = await deal()
      await replyToTradeRequest(db, d.seller.scope, d.seller.uid, d.requestId, { status: 'have' })
      await respondToConnection(db, d.buyer.scope, d.connectionId, 'remove')
      await expectCode(bill(d), 'NOT_FOUND')
    })
  })

  describe('paying and receiving', () => {
    it('only the buyer pays, with their own email, and both sides see the result', async () => {
      const d = await deal()
      await replyToTradeRequest(db, d.seller.scope, d.seller.uid, d.requestId, { status: 'have' })
      const { id } = await bill(d)

      expect((await listTradeSales(db, d.seller.scope)).map((s) => [s.direction, s.state])).toEqual(
        [['selling', 'awaiting_payment']]
      )
      const [mine] = await listTradeSales(db, d.buyer.scope)
      expect(mine).toMatchObject({
        id,
        direction: 'buying',
        state: 'awaiting_payment',
        stockAdded: false,
      })
      expect(mine!.partner.handle).toBe(d.seller.handle)

      await expectCode(
        payTradeSale(db, d.seller.scope, 'x@example.com', id, checkoutDeps(1)),
        'NOT_FOUND'
      )
      await expectCode(payTradeSale(db, d.buyer.scope, undefined, id, checkoutDeps(1)), 'NO_EMAIL')
      await expectCode(
        payTradeSale(db, d.buyer.scope, 'x@example.com', 'bad/id', checkoutDeps(1)),
        'NOT_FOUND'
      )
      await expectCode(tradeSaleReceipt(db, d.buyer.scope, id), 'NOT_PAID')

      await payAndSettle(d, id)

      expect((await listTradeSales(db, d.buyer.scope))[0]).toMatchObject({ state: 'paid' })
      expect((await listTradeSales(db, d.seller.scope))[0]).toMatchObject({ state: 'paid' })
      const receipt = (
        await storeDocRef(db, d.seller.scope.ownerId, 's1').collection('receipts').doc('r1').get()
      ).data()!
      expect(receipt.status).toBe('completed')

      const [paid] = await notes(d.buyer.scope, 'trade_paid')
      expect(paid).toMatchObject({ source: 'trade', metadata: { saleId: id } })

      const view = await tradeSaleReceipt(db, d.buyer.scope, id)
      expect(view).toMatchObject({
        receiptNumber: 'REC-000001',
        sellerName: 'Ikeja Hub',
        total: 1_450_000,
      })
      expect(view.items[0]).toMatchObject({ itemName: 'iPhone 15 Pro Max', quantity: 1 })
      await expectCode(tradeSaleReceipt(db, d.seller.scope, id), 'NOT_FOUND')
    })

    it('adding to inventory is claimed once, needs product permission, and can be released', async () => {
      const d = await deal()
      await replyToTradeRequest(db, d.seller.scope, d.seller.uid, d.requestId, { status: 'have' })
      const { id } = await bill(d)
      await expectCode(claimTradeSaleStock(db, d.buyer.scope, d.buyer.uid, id, 'claim'), 'NOT_PAID')
      await payAndSettle(d, id)

      const members = storeDocRef(db, d.buyer.scope.ownerId, 's1').collection('members')
      await members.doc('cashier').set({ status: 'active', role: 'staff' })
      await expectCode(claimTradeSaleStock(db, d.buyer.scope, 'cashier', id, 'claim'), 'NO_ACCESS')
      await expectCode(
        claimTradeSaleStock(db, d.seller.scope, d.seller.uid, id, 'claim'),
        'NOT_FOUND'
      )

      const { lines } = await claimTradeSaleStock(db, d.buyer.scope, d.buyer.uid, id, 'claim')
      expect(lines[0]).toMatchObject({ serial: '356938035643809', unitPriceKobo: 145_000_000 })
      await expectCode(
        claimTradeSaleStock(db, d.buyer.scope, d.buyer.uid, id, 'claim'),
        'ALREADY_ADDED'
      )
      expect((await listTradeSales(db, d.buyer.scope))[0]!.stockAdded).toBe(true)

      await claimTradeSaleStock(db, d.buyer.scope, d.buyer.uid, id, 'release')
      expect((await listTradeSales(db, d.buyer.scope))[0]!.stockAdded).toBe(false)
    })
  })

  it('explains why a store cannot bill partners yet', async () => {
    const ready = await shop('Ready Shop')
    const noPayout = await shop('No Payout', { payout: false })
    expect(await tradeSellBlocker(db, ready.scope, false, true)).toBe('no_access')
    expect(await tradeSellBlocker(db, ready.scope, true, false)).toBe('payments_off')
    expect(await tradeSellBlocker(db, noPayout.scope, true, true)).toBe('no_payout')
    expect(await tradeSellBlocker(db, ready.scope, true, true)).toBeNull()
  })
})
