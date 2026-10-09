// @vitest-environment node
import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { deleteApp, initializeApp, type App } from 'firebase-admin/app'
import { getFirestore, type Firestore } from 'firebase-admin/firestore'
import { storeDocRef, verifyStoreAuditChain } from '~/server/utils/payments/audit-log'
import { resolvePaymentsAccess } from '~/server/utils/payments/access'
import { hashLinkToken, MAX_ACTIVE_TOKENS_PER_LINK } from '~/server/utils/payments/link-token'
import {
  createPaymentLink,
  expireDueLinks,
  issueLinkToken,
  LINK_TOKENS_COLLECTION,
  LINKS_COLLECTION,
  listReceiptLinks,
  MAX_ATTEMPTS_TOTAL,
  readPublicLink,
  readReturnStatus,
  revokeLinkToken,
  revokePaymentLink,
  startCheckout,
} from '~/server/utils/payments/links'
import {
  connectPayout,
  PAYOUTS_COLLECTION,
  payoutDocId,
  type PaystackCall,
} from '~/server/utils/payments/payout'
import { PaymentServiceError } from '~/server/utils/payments/records'

const FULL_RECEIPTS = { view: true, create: true, edit: false, delete: false, refund: false }
const NO_RECEIPTS = { view: true, create: false, edit: false, delete: false, refund: false }
const ORIGIN = 'https://app.example.test'
const ENV = { PAYMENTS_V2_LINK_PLANS: 'all' } as NodeJS.ProcessEnv
const CUSTOMER = 'Jane Secret'

const tokenFromUrl = (url: string) => url.slice(`${ORIGIN}/pay/`.length)

describe.skipIf(!process.env.FIRESTORE_EMULATOR_HOST)('Payments V2 links (emulator)', () => {
  let app: App
  let db: Firestore

  beforeAll(() => {
    app = initializeApp({ projectId: 'storv-ui-test-payments' }, `links-${randomUUID()}`)
    db = getFirestore(app)
  })

  afterAll(async () => {
    await deleteApp(app)
  })

  async function seed(
    opts: { status?: string; total?: number; payout?: boolean; plan?: string } = {}
  ) {
    const ownerId = `owner-${randomUUID()}`
    await db
      .collection('users')
      .doc(ownerId)
      .set({ subscription: opts.plan ?? 'storvv_micro' })
    const store = storeDocRef(db, ownerId, 's1')
    await store.set({ ownerId, name: 'Main Shop' })
    const member = (
      uid: string,
      receipts: Record<string, boolean>,
      payments?: Record<string, boolean>
    ) =>
      store
        .collection('members')
        .doc(uid)
        .set({
          authUid: uid,
          status: 'active',
          permissions: { receipts, ...(payments ? { payments } : {}) },
        })
    await member('cashier', FULL_RECEIPTS)
    await member('viewer', NO_RECEIPTS, { view: true, confirm: false, refund: false })
    await store
      .collection('inventoryItems')
      .doc('i1')
      .set({ name: 'Shoe', pendingSaleReceiptId: 'r1' })
    await store
      .collection('receipts')
      .doc('r1')
      .set({
        receiptNumber: 'R-1',
        total: opts.total ?? 100,
        status: opts.status ?? 'balance_due',
        storeId: 's1',
        customerName: CUSTOMER,
        customerPhone: '+2348000000000',
        itemIds: ['i1'],
        payments: [],
      })
    if (opts.payout !== false) {
      await db
        .collection(PAYOUTS_COLLECTION)
        .doc(payoutDocId(ownerId, 's1'))
        .set({ ownerUserId: ownerId, storeId: 's1', connected: true, subaccountCode: 'ACCT_test1' })
    }
    const as = (uid: string) => resolvePaymentsAccess(db, uid, ownerId, 's1')
    return { ownerId, store, as }
  }

  async function expectCode(promise: Promise<unknown>, code: string) {
    const err = await promise.then(
      () => null,
      (e: unknown) => e
    )
    expect(err).toBeInstanceOf(PaymentServiceError)
    expect(err).toMatchObject({ code })
  }

  const expectChainOk = async (ownerId: string) =>
    expect((await verifyStoreAuditChain(db, ownerId, 's1')).ok).toBe(true)

  function mockPaystack(url = 'https://checkout.paystack.com/abc123') {
    return vi.fn(
      async (path: string, _init: { method: string; body?: Record<string, unknown> }) => {
        if (path === '/transaction/initialize') return { authorization_url: url }
        throw new Error(`unexpected ${path}`)
      }
    ) as unknown as PaystackCall & ReturnType<typeof vi.fn>
  }

  describe('create', () => {
    it('creates a link for the balance, stores only the token hash, and keeps the chain intact', async () => {
      const { ownerId, as } = await seed()
      const link = await createPaymentLink(
        db,
        await as('cashier'),
        { receiptId: 'r1' },
        { env: ENV, appOrigin: ORIGIN }
      )
      const token = tokenFromUrl(link.url)
      expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/)
      expect(link).toMatchObject({ amountKobo: 10_000, linkSale: true })

      const tokenDoc = await db.collection(LINK_TOKENS_COLLECTION).doc(hashLinkToken(token)).get()
      expect(tokenDoc.exists).toBe(true)
      expect(JSON.stringify(tokenDoc.data())).not.toContain(token)
      const linkDoc = (await db.collection(LINKS_COLLECTION).doc(link.linkId).get()).data()!
      expect(JSON.stringify(linkDoc)).not.toContain(token)
      expect(linkDoc).toMatchObject({
        status: 'active',
        subaccountCode: 'ACCT_test1',
        storeName: 'Main Shop',
      })
      await expectChainOk(ownerId)
    })

    it('shows the public page only what a payer needs', async () => {
      const { as } = await seed()
      const link = await createPaymentLink(
        db,
        await as('cashier'),
        { receiptId: 'r1' },
        { env: ENV, appOrigin: ORIGIN }
      )
      const view = await readPublicLink(db, hashLinkToken(tokenFromUrl(link.url)))
      expect(view).toEqual({
        status: 'active',
        amountKobo: 10_000,
        currency: 'NGN',
        storeName: 'Main Shop',
        receiptNumber: 'R-1',
        expiresAt: link.expiresAt,
      })
      expect(JSON.stringify(view)).not.toContain(CUSTOMER)
    })

    it('refuses people without record permission, missing payout, plan gate and bad expiry', async () => {
      const { as, ownerId } = await seed()
      await expectCode(
        createPaymentLink(
          db,
          await as('viewer'),
          { receiptId: 'r1' },
          { env: ENV, appOrigin: ORIGIN }
        ),
        'FORBIDDEN'
      )
      await expectCode(
        createPaymentLink(
          db,
          await as(ownerId),
          { receiptId: 'r1' },
          {
            env: { PAYMENTS_V2_LINK_PLANS: 'storvv_enterprise' } as NodeJS.ProcessEnv,
            appOrigin: ORIGIN,
          }
        ),
        'PLAN_REQUIRED'
      )
      for (const expiresInHours of [0, 169, 1.5]) {
        await expectCode(
          createPaymentLink(
            db,
            await as(ownerId),
            { receiptId: 'r1', expiresInHours },
            { env: ENV, appOrigin: ORIGIN }
          ),
          'INVALID_EXPIRY'
        )
      }
      const noPayout = await seed({ payout: false })
      await expectCode(
        createPaymentLink(
          db,
          await noPayout.as(noPayout.ownerId),
          { receiptId: 'r1' },
          { env: ENV, appOrigin: ORIGIN }
        ),
        'PAYOUT_NOT_CONNECTED'
      )
    })

    it('never lets active links exceed what is owed', async () => {
      const { as } = await seed()
      const cashier = await as('cashier')
      await createPaymentLink(
        db,
        cashier,
        { receiptId: 'r1', amountKobo: 6_000 },
        { env: ENV, appOrigin: ORIGIN }
      )
      await expectCode(
        createPaymentLink(
          db,
          cashier,
          { receiptId: 'r1', amountKobo: 5_000 },
          { env: ENV, appOrigin: ORIGIN }
        ),
        'OVERPAYMENT'
      )
      const rest = await createPaymentLink(
        db,
        cashier,
        { receiptId: 'r1' },
        { env: ENV, appOrigin: ORIGIN }
      )
      expect(rest.amountKobo).toBe(4_000)
      await expectCode(
        createPaymentLink(db, cashier, { receiptId: 'r1' }, { env: ENV, appOrigin: ORIGIN }),
        'NOTHING_OUTSTANDING'
      )
    })
  })

  describe('tokens', () => {
    it('issues revocable copies, caps them, and treats unknown and revoked tokens alike', async () => {
      const { ownerId, as } = await seed()
      const cashier = await as('cashier')
      const link = await createPaymentLink(
        db,
        cashier,
        { receiptId: 'r1' },
        { env: ENV, appOrigin: ORIGIN }
      )
      const first = hashLinkToken(tokenFromUrl(link.url))
      const copy = await issueLinkToken(db, cashier, { linkId: link.linkId }, { appOrigin: ORIGIN })
      expect(copy.url).not.toBe(link.url)

      await revokeLinkToken(db, cashier, { linkId: link.linkId, tokenId: first })
      await expectCode(readPublicLink(db, first), 'NOT_FOUND')
      await expectCode(readPublicLink(db, hashLinkToken('x'.repeat(43))), 'NOT_FOUND')
      await expectCode(readPublicLink(db, null), 'NOT_FOUND')
      expect((await readPublicLink(db, hashLinkToken(tokenFromUrl(copy.url)))).status).toBe(
        'active'
      )

      for (let i = 1; i < MAX_ACTIVE_TOKENS_PER_LINK; i++) {
        await issueLinkToken(db, cashier, { linkId: link.linkId }, { appOrigin: ORIGIN })
      }
      await expectCode(
        issueLinkToken(db, cashier, { linkId: link.linkId }, { appOrigin: ORIGIN }),
        'TOO_MANY_TOKENS'
      )

      const listed = await listReceiptLinks(db, await as('viewer'), { receiptId: 'r1' })
      expect(listed[0]!.tokens.filter((t) => t.status === 'active')).toHaveLength(
        MAX_ACTIVE_TOKENS_PER_LINK
      )
      expect(JSON.stringify(listed)).not.toContain(tokenFromUrl(copy.url))
      await expectChainOk(ownerId)
    })

    it("hides another store's link", async () => {
      const a = await seed()
      const b = await seed()
      const link = await createPaymentLink(
        db,
        await a.as(a.ownerId),
        { receiptId: 'r1' },
        { env: ENV, appOrigin: ORIGIN }
      )
      await expectCode(
        issueLinkToken(db, await b.as(b.ownerId), { linkId: link.linkId }, { appOrigin: ORIGIN }),
        'NOT_FOUND'
      )
      await expectCode(
        revokePaymentLink(db, await b.as(b.ownerId), { linkId: link.linkId, reason: 'nope' }),
        'NOT_FOUND'
      )
    })
  })

  describe('revoke and expire', () => {
    it('revoking a link sale cancels the order, releases held stock and tells the owner', async () => {
      const { ownerId, store, as } = await seed()
      const cashier = await as('cashier')
      const link = await createPaymentLink(
        db,
        cashier,
        { receiptId: 'r1' },
        { env: ENV, appOrigin: ORIGIN }
      )
      await expectCode(
        revokePaymentLink(db, cashier, { linkId: link.linkId, reason: ' ' }),
        'REASON_REQUIRED'
      )

      const ended = await revokePaymentLink(db, cashier, {
        linkId: link.linkId,
        reason: 'customer changed mind',
      })
      expect(ended).toMatchObject({ status: 'revoked', saleCancelled: true })
      expect((await store.collection('receipts').doc('r1').get()).data()).toMatchObject({
        status: 'cancelled',
      })
      expect(
        (await store.collection('inventoryItems').doc('i1').get()).data()?.pendingSaleReceiptId
      ).toBeUndefined()
      await expectCode(readPublicLink(db, hashLinkToken(tokenFromUrl(link.url))), 'NOT_FOUND')
      const notes = (await store.collection('notifications').get()).docs.map((d) => d.data())
      expect(notes).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'payment_link_sale_cancelled',
            recipientUids: [ownerId],
          }),
        ])
      )
      await expectChainOk(ownerId)
    })

    it('revoking a link on a completed sale leaves the sale alone', async () => {
      const { store, as, ownerId } = await seed({ status: 'completed' })
      const link = await createPaymentLink(
        db,
        await as(ownerId),
        { receiptId: 'r1' },
        { env: ENV, appOrigin: ORIGIN }
      )
      expect(link.linkSale).toBe(false)
      const ended = await revokePaymentLink(db, await as(ownerId), {
        linkId: link.linkId,
        reason: 'sent by mistake',
      })
      expect(ended.saleCancelled).toBe(false)
      expect((await store.collection('receipts').doc('r1').get()).data()?.status).toBe('completed')
    })

    it('the cron expires only links that are due', async () => {
      const { as, ownerId } = await seed()
      const owner = await as(ownerId)
      const link = await createPaymentLink(
        db,
        owner,
        { receiptId: 'r1', expiresInHours: 1 },
        { env: ENV, appOrigin: ORIGIN }
      )
      const early = await expireDueLinks(db, { now: new Date(Date.now() + 30 * 60_000) })
      expect((await db.collection(LINKS_COLLECTION).doc(link.linkId).get()).data()?.status).toBe(
        'active'
      )
      expect(early.failed).toBe(0)

      const late = await expireDueLinks(db, { now: new Date(Date.now() + 2 * 3_600_000) })
      expect(late.failed).toBe(0)
      expect((await db.collection(LINKS_COLLECTION).doc(link.linkId).get()).data()?.status).toBe(
        'expired'
      )
      await expectChainOk(ownerId)
    })
  })

  describe('checkout (Paystack mocked)', () => {
    it('sends the link amount and subaccount, never the token, and keeps no email', async () => {
      const { as, ownerId } = await seed()
      const link = await createPaymentLink(
        db,
        await as(ownerId),
        { receiptId: 'r1' },
        { env: ENV, appOrigin: ORIGIN }
      )
      const token = tokenFromUrl(link.url)
      const paystack = mockPaystack()
      const out = await startCheckout(
        db,
        hashLinkToken(token),
        { email: 'Payer@Example.com' },
        {
          paystack,
          appOrigin: ORIGIN,
          ipHash: 'h'.repeat(32),
        }
      )
      expect(out.authorizationUrl).toBe('https://checkout.paystack.com/abc123')
      expect(out.reference).toMatch(new RegExp(`^stvp_${link.linkId}_[a-f0-9]{16}$`))

      const [path, init] = paystack.mock.calls[0]!
      expect(path).toBe('/transaction/initialize')
      expect(init.body).toMatchObject({
        email: 'payer@example.com',
        amount: 10_000,
        currency: 'NGN',
        subaccount: 'ACCT_test1',
        bearer: 'subaccount',
        reference: out.reference,
        callback_url: `${ORIGIN}/pay/return?ref=${out.reference}`,
      })
      expect(JSON.stringify(init.body)).not.toContain(token)

      const attempt = (
        await db
          .collection(LINKS_COLLECTION)
          .doc(link.linkId)
          .collection('attempts')
          .doc(out.reference)
          .get()
      ).data()!
      expect(attempt).toMatchObject({
        status: 'initialized',
        amountKobo: 10_000,
        ipHash: 'h'.repeat(32),
      })
      expect(JSON.stringify(attempt)).not.toContain('example.com')
      expect(await readReturnStatus(db, out.reference)).toEqual({
        status: 'pending',
        storeName: 'Main Shop',
      })
    })

    it('fails closed on a bad Paystack response, bad email, expiry and too many attempts', async () => {
      const { as, ownerId } = await seed()
      const link = await createPaymentLink(
        db,
        await as(ownerId),
        { receiptId: 'r1', expiresInHours: 1 },
        { env: ENV, appOrigin: ORIGIN }
      )
      const hash = hashLinkToken(tokenFromUrl(link.url))
      const deps = {
        paystack: mockPaystack('https://evil.example/checkout'),
        appOrigin: ORIGIN,
        ipHash: 'h',
      }

      await expectCode(startCheckout(db, hash, { email: 'not-an-email' }, deps), 'INVALID_EMAIL')
      await expectCode(startCheckout(db, hash, { email: 'a@b.co' }, deps), 'PAYSTACK_UNAVAILABLE')
      const attempts = await db
        .collection(LINKS_COLLECTION)
        .doc(link.linkId)
        .collection('attempts')
        .get()
      expect(attempts.docs.map((d) => d.data().status)).toEqual(['failed'])

      await expectCode(
        startCheckout(
          db,
          hash,
          { email: 'a@b.co' },
          { ...deps, paystack: mockPaystack(), now: new Date(Date.now() + 59 * 60_000) }
        ),
        'LINK_EXPIRED'
      )

      await db
        .collection(LINKS_COLLECTION)
        .doc(link.linkId)
        .update({ checkoutAttempts: MAX_ATTEMPTS_TOTAL })
      await expectCode(
        startCheckout(db, hash, { email: 'a@b.co' }, { ...deps, paystack: mockPaystack() }),
        'TOO_MANY_ATTEMPTS'
      )
      await expectCode(startCheckout(db, null, { email: 'a@b.co' }, deps), 'NOT_FOUND')
      await expectCode(readReturnStatus(db, 'stvp_nope'), 'NOT_FOUND')
    })
  })

  describe('payout account', () => {
    it('keeps only the last 4 digits, updates the subaccount in place and audits the change', async () => {
      const { ownerId } = await seed({ payout: false })
      const ref = db.collection(PAYOUTS_COLLECTION).doc(payoutDocId(ownerId, 's1'))
      await ref.set({
        ownerUserId: ownerId,
        storeId: 's1',
        connected: true,
        subaccountCode: 'ACCT_old',
        accountNumber: '0001112223',
      })
      const paystack = vi.fn(async (path: string) =>
        path.startsWith('/bank/resolve') ? { account_name: 'ADA OKORO' } : {}
      ) as unknown as PaystackCall & ReturnType<typeof vi.fn>

      const result = await connectPayout(db, paystack, {
        ownerId,
        storeId: 's1',
        actorUid: ownerId,
        bankCode: '058',
        bankName: 'GTBank',
        accountNumber: '0123456789',
        businessName: 'Main Shop',
      })
      expect(result).toMatchObject({ saved: true, replaced: true, previousLast4: '2223' })
      expect(paystack.mock.calls.map((c) => [c[0], c[1].method])).toEqual([
        ['/bank/resolve?account_number=0123456789&bank_code=058', 'GET'],
        ['/subaccount/ACCT_old', 'PUT'],
      ])
      const stored = (await ref.get()).data()!
      expect(stored).toMatchObject({
        accountNumberLast4: '6789',
        subaccountCode: 'ACCT_old',
        percentageCharge: 0,
      })
      expect(stored.accountNumber).toBeUndefined()
      expect(JSON.stringify(stored)).not.toContain('0123456789')
      await expectChainOk(ownerId)
    })

    it('changes nothing when Paystack refuses', async () => {
      const { ownerId } = await seed({ payout: false })
      const paystack = vi.fn(async (path: string) => {
        if (path.startsWith('/bank/resolve')) return { account_name: 'ADA OKORO' }
        throw new Error('paystack down')
      }) as unknown as PaystackCall
      await expectCode(
        connectPayout(db, paystack, {
          ownerId,
          storeId: 's1',
          actorUid: ownerId,
          bankCode: '058',
          bankName: 'GTBank',
          accountNumber: '0123456789',
          businessName: '',
        }),
        'PAYSTACK_UNAVAILABLE'
      )
      expect(
        (await db.collection(PAYOUTS_COLLECTION).doc(payoutDocId(ownerId, 's1')).get()).exists
      ).toBe(false)
    })
  })
})
