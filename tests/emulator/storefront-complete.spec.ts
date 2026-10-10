// @vitest-environment node
import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { deleteApp, initializeApp, type App } from 'firebase-admin/app'
import { getFirestore, type Firestore } from 'firebase-admin/firestore'
import { settlePaymentLink } from '~/server/utils/payment-link-settle'
import { resolvePaymentsAccess } from '~/server/utils/payments/access'
import { recordManualPayments } from '~/server/utils/payments/service'
import { applyStorefrontInquiryStatus } from '~/server/utils/storefront-inquiry-status'

async function expectStatus(promise: Promise<unknown>, statusCode: number, message?: RegExp) {
  const err = (await promise.then(
    () => null,
    (e: unknown) => e
  )) as { statusCode?: number; message?: string } | null
  expect(err).not.toBeNull()
  expect(err!.statusCode).toBe(statusCode)
  if (message) expect(err!.message).toMatch(message)
}

describe.skipIf(!process.env.FIRESTORE_EMULATOR_HOST)('Storefront complete → sale (emulator)', () => {
  let app: App
  let db: Firestore

  beforeAll(() => {
    app = initializeApp({ projectId: 'storv-ui-test-sf' }, `storefront-${randomUUID()}`)
    db = getFirestore(app)
  })

  afterAll(async () => {
    await deleteApp(app)
  })

  async function seed(opts: {
    status?: string
    item?: Record<string, unknown>
    link?: Record<string, unknown> | null
  } = {}) {
    const ownerUserId = `owner-${randomUUID()}`
    const storeId = 's1'
    const slug = `shop-${randomUUID().slice(0, 8)}`
    const store = db.collection('users').doc(ownerUserId).collection('stores').doc(storeId)
    await store.set({ name: 'Shop' })
    await store.collection('inventoryFolders').doc('f1').set({ name: 'Phones', hasSerialNumbers: true })
    await store
      .collection('inventoryItems')
      .doc('i1')
      .set({ name: 'iPhone 13', price: 450000, folderId: 'f1', ...(opts.item || {}) })
    await db
      .collection('storefrontListings')
      .doc(slug)
      .collection('items')
      .doc('l1')
      .set({ title: 'iPhone 13', availability: 'reserved', reservationInquiryId: 'q1', sourceFolderId: 'f1' })
    const token = `tok-${randomUUID()}`
    if (opts.link !== null) {
      await db.collection('paymentLinks').doc(token).set({
        ownerUserId,
        storeId,
        amount: 45000000,
        status: 'unpaid',
        items: [{ itemId: 'i1', folderId: 'f1', quantity: 1, price: 450000 }],
        ...(opts.link || {}),
      })
    }
    await store.collection('storefrontInquiries').doc('q1').set({
      type: 'reserve',
      status: opts.status || 'confirmed',
      storefrontSlug: slug,
      listingId: 'l1',
      listingTitle: 'iPhone 13',
      listingPrice: 450000,
      sourceItemId: 'i1',
      sourceFolderId: 'f1',
      customerName: 'Ada',
      customerPhone: '08000000000',
      ...(opts.link !== null ? { paymentLinkToken: token, paymentLinkStatus: 'unpaid' } : {}),
    })
    const complete = (paymentMethod?: string) =>
      applyStorefrontInquiryStatus(db, {
        ownerUserId,
        storeId,
        inquiryId: 'q1',
        actorUid: ownerUserId,
        status: 'completed',
        paymentMethod,
        paymentsV2: true,
      })
    return { ownerUserId, storeId, store, token, slug, complete }
  }

  it('paid in person: creates the sale in Sales, marks stock sold, closes the request, cancels the open link', async () => {
    const s = await seed()
    await s.store.collection('inventoryItems').doc('i1').update({ pendingSaleReceiptId: `paylink:${s.token}` })

    const res = await s.complete('Cash')
    expect(res.paidInPerson).toBe(true)
    expect(res.saleTotal).toBe(450000)
    expect(res.receiptId).toBeTruthy()

    const receipt = (await s.store.collection('receipts').doc(res.receiptId!).get()).data()!
    expect(receipt).toMatchObject({
      status: 'completed',
      paymentMethod: 'Cash',
      paymentsV2: true,
      total: 450000,
      createdBy: s.ownerUserId,
      storeId: s.storeId,
      source: 'storefront_inquiry',
    })

    const item = (await s.store.collection('inventoryItems').doc('i1').get()).data()!
    expect(item.dateOut).toBeTruthy()
    expect(item.pendingSaleReceiptId).toBeUndefined()

    const inquiry = (await s.store.collection('storefrontInquiries').doc('q1').get()).data()!
    expect(inquiry).toMatchObject({
      status: 'completed',
      receiptId: res.receiptId,
      paidInPersonMethod: 'Cash',
    })

    const listing = (
      await db.collection('storefrontListings').doc(s.slug).collection('items').doc('l1').get()
    ).data()!
    expect(listing.availability).toBe('unavailable')

    const link = (await db.collection('paymentLinks').doc(s.token).get()).data()!
    expect(link.status).toBe('cancelled')
    expect(link.cancelReason).toBe('paid_in_person')

    // V2 tender, as the route records it after the sale is written.
    const access = await resolvePaymentsAccess(db, s.ownerUserId, s.ownerUserId, s.storeId)
    const recorded = await recordManualPayments(db, access, {
      receiptId: res.receiptId,
      tenders: [{ methodLabel: 'Cash', amountKobo: res.saleTotal * 100 }],
    })
    expect(recorded.payments).toHaveLength(1)

    // A late charge on the cancelled link never sells the item twice.
    const settle = await settlePaymentLink(db, s.token, {
      paidAmountKobo: 45000000,
      reference: 'late-ref',
    })
    expect(settle).toMatchObject({ settled: false, settleError: 'cancelled' })
    const after = (await db.collection('paymentLinks').doc(s.token).get()).data()!
    expect(after.status).toBe('cancelled')
    expect(after.chargedAfterCancel).toEqual({ reference: 'late-ref', amountKobo: 45000000 })
    const receipts = await s.store.collection('receipts').get()
    expect(receipts.size).toBe(1)
  })

  it('works with no payment link at all', async () => {
    const s = await seed({ link: null })
    const res = await s.complete('Bank transfer')
    expect(res.paidInPerson).toBe(true)
    const receipt = (await s.store.collection('receipts').doc(res.receiptId!).get()).data()!
    expect(receipt.paymentMethod).toBe('Bank transfer')
  })

  it('without a payment method and no paid link: refuses and changes nothing', async () => {
    const s = await seed()
    await expectStatus(s.complete(), 409, /how the customer paid/)
    const inquiry = (await s.store.collection('storefrontInquiries').doc('q1').get()).data()!
    expect(inquiry.status).toBe('confirmed')
    expect((await s.store.collection('receipts').get()).size).toBe(0)
  })

  it('paid link already settled: links the existing sale, no second sale', async () => {
    const s = await seed({ link: { status: 'paid', receiptId: 'r-existing', receiptNumber: 'INV-1' } })
    const res = await s.complete('Cash')
    expect(res.paidInPerson).toBe(false)
    expect(res.receiptId).toBe('r-existing')
    expect((await s.store.collection('receipts').get()).size).toBe(0)
    const inquiry = (await s.store.collection('storefrontInquiries').doc('q1').get()).data()!
    expect(inquiry).toMatchObject({ status: 'completed', receiptId: 'r-existing', paymentLinkStatus: 'paid' })
  })

  it('refuses items held by another sale or out on a stock loan', async () => {
    const held = await seed({ item: { pendingSaleReceiptId: 'paylink:someone-else' } })
    await expectStatus(held.complete('Cash'), 409, /held for another sale/)

    const loaned = await seed({ item: { sellerLoanOutId: 'loan-1' } })
    await expectStatus(loaned.complete('Cash'), 409, /stock loan/)

    const sold = await seed({ item: { dateOut: new Date() } })
    await expectStatus(sold.complete('Cash'), 409, /already marked sold/)

    const link = (await db.collection('paymentLinks').doc(held.token).get()).data()!
    expect(link.status).toBe('unpaid')
  })

  it('old completed requests without a sale still need a paid link (no in-person backfill)', async () => {
    const s = await seed({ status: 'completed' })
    await expectStatus(s.complete('Cash'), 409, /Only a paid payment link/)
  })

  it('pending requests must be confirmed first', async () => {
    const s = await seed({ status: 'pending' })
    await expectStatus(s.complete('Cash'), 409, /Cannot move inquiry from pending/)
  })
})
