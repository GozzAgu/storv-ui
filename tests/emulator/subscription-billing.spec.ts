// @vitest-environment node
import { createHmac, randomUUID } from 'node:crypto'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { deleteApp, initializeApp, type App } from 'firebase-admin/app'
import { getFirestore, type Firestore } from 'firebase-admin/firestore'
import type { SubscriptionPlan } from '~/types/subscription'
import type { SubscriptionBillingCycle } from '~/types/subscription-billing'

const SECRET = 'sk_test_emulator'
const ORIGIN = 'https://app.example.test'
const DAY = 24 * 60 * 60 * 1000

const m = vi.hoisted(() => ({
  db: null as unknown as import('firebase-admin/firestore').Firestore,
  uid: '',
  body: {} as Record<string, unknown>,
  query: {} as Record<string, unknown>,
  raw: '',
  signature: '',
  status: 200,
}))

vi.mock('h3', async () => {
  const actual = await vi.importActual<typeof import('h3')>('h3')
  return {
    ...actual,
    defineEventHandler: (fn: unknown) => fn,
    readBody: async () => m.body,
    getQuery: () => m.query,
    readRawBody: async () => m.raw,
    getHeader: () => m.signature,
    setResponseStatus: (_e: unknown, code: number) => {
      m.status = code
    },
  }
})
vi.mock('~/server/utils/firebase-admin', () => ({ getAdminFirestore: () => m.db }))
vi.mock('~/server/utils/store-auth', () => ({
  requireAuth: async () => ({ uid: m.uid }),
  requireFreshTotp: async () => undefined,
}))
vi.mock('~/server/utils/delivery-config', () => ({ isResendConfigured: () => false }))
vi.mock('~/server/utils/receipt-delivery-email', () => ({ sendReceiptEmail: vi.fn() }))
vi.mock('~/server/utils/staff-invite-email', () => ({ sendViaResend: vi.fn() }))

/** Paystack plan codes and the amount (kobo) Paystack charges for each. */
const PAYSTACK_PLANS: Record<string, { amount: number; months: number }> = {
  PLN_medium_monthly: { amount: 1_000_000, months: 1 },
  PLN_medium_quarterly: { amount: 2_700_000, months: 3 },
  PLN_medium_yearly: { amount: 10_200_000, months: 12 },
  PLN_enterprise_monthly: { amount: 2_500_000, months: 1 },
  PLN_enterprise_quarterly: { amount: 6_750_000, months: 3 },
  PLN_enterprise_yearly: { amount: 25_500_000, months: 12 },
}

const CONFIG = {
  paystackSecretKey: SECRET,
  paystackPlanMicroAmount: 0,
  paystackPlanMediumAmount: 1_000_000,
  paystackPlanEnterpriseAmount: 2_500_000,
  paystackPlanMediumAmountQuarterly: 2_700_000,
  paystackPlanEnterpriseAmountQuarterly: 6_750_000,
  paystackPlanMediumAmountYearly: 10_200_000,
  paystackPlanEnterpriseAmountYearly: 25_500_000,
  paystackPlanCodeMediumMonthly: 'PLN_medium_monthly',
  paystackPlanCodeMediumQuarterly: 'PLN_medium_quarterly',
  paystackPlanCodeMediumYearly: 'PLN_medium_yearly',
  paystackPlanCodeEnterpriseMonthly: 'PLN_enterprise_monthly',
  paystackPlanCodeEnterpriseQuarterly: 'PLN_enterprise_quarterly',
  paystackPlanCodeEnterpriseYearly: 'PLN_enterprise_yearly',
}

type FakeTransaction = {
  reference: string
  amount: number
  plan: string
  metadata: Record<string, unknown>
  customer: string
  paid: boolean
}

/** In-memory Paystack: checkout, verify, subscriptions per customer, disable. */
const paystack = {
  transactions: new Map<string, FakeTransaction>(),
  subscriptions: new Map<
    string,
    {
      subscription_code: string
      email_token: string
      status: string
      next_payment_date: string
      plan: { plan_code: string }
    }[]
  >(),
  initialized: [] as Record<string, unknown>[],
  disabled: [] as { code: string; token: string }[],
  reset() {
    this.transactions.clear()
    this.subscriptions.clear()
    this.initialized = []
    this.disabled = []
  },
  /** The customer completes checkout; Paystack charges the plan amount and starts a subscription. */
  pay(reference: string, opts: { amount?: number } = {}) {
    const tx = this.transactions.get(reference)!
    const plan = PAYSTACK_PLANS[tx.plan]!
    tx.paid = true
    tx.amount = opts.amount ?? plan.amount
    const next = new Date()
    next.setMonth(next.getMonth() + plan.months)
    const sub = {
      subscription_code: `SUB_${randomUUID().slice(0, 8)}`,
      email_token: `tok_${randomUUID().slice(0, 8)}`,
      status: 'active',
      next_payment_date: next.toISOString(),
      plan: { plan_code: tx.plan },
    }
    this.subscriptions.set(tx.customer, [...(this.subscriptions.get(tx.customer) || []), sub])
    return sub
  },
}

async function fakeFetch(
  url: string,
  opts: { method?: string; body?: Record<string, unknown> } = {}
) {
  const path = url.replace('https://api.paystack.co', '')
  if (path === '/transaction/initialize') {
    const body = opts.body!
    paystack.initialized.push(body)
    const reference = String(body.reference)
    paystack.transactions.set(reference, {
      reference,
      amount: Number(body.amount),
      plan: String(body.plan),
      metadata: body.metadata as Record<string, unknown>,
      customer: `CUS_${String((body.metadata as { userId: string }).userId)}`,
      paid: false,
    })
    return {
      status: true,
      data: {
        authorization_url: `https://checkout.paystack.test/${reference}`,
        reference,
        access_code: 'ac',
      },
    }
  }
  if (path.startsWith('/transaction/verify/')) {
    const tx = paystack.transactions.get(decodeURIComponent(path.split('/').pop()!))
    if (!tx) return { status: false, message: 'Transaction reference not found' }
    return {
      status: true,
      data: {
        status: tx.paid ? 'success' : 'abandoned',
        reference: tx.reference,
        amount: tx.amount,
        currency: 'NGN',
        metadata: tx.metadata,
        customer: { customer_code: tx.customer },
      },
    }
  }
  if (path.startsWith('/subscription?customer=')) {
    const customer = decodeURIComponent(path.split('=')[1]!)
    return { status: true, data: paystack.subscriptions.get(customer) || [] }
  }
  if (path === '/subscription/disable') {
    paystack.disabled.push({ code: String(opts.body!.code), token: String(opts.body!.token) })
    return { status: true, data: {} }
  }
  throw new Error(`Unexpected Paystack call ${opts.method || 'GET'} ${path}`)
}

vi.stubGlobal('useRuntimeConfig', () => CONFIG)
vi.stubGlobal('getRequestURL', () => new URL(`${ORIGIN}/api/paystack/initialize`))
vi.stubGlobal('$fetch', fakeFetch)

type Handler = (event: unknown) => Promise<Record<string, unknown>>
const ROUTES = {
  'initialize.post': () => import('~/server/api/paystack/initialize.post'),
  'verify.get': () => import('~/server/api/paystack/verify.get'),
  'webhook.post': () => import('~/server/api/paystack/webhook.post'),
  'cancel-subscription.post': () => import('~/server/api/paystack/cancel-subscription.post'),
  'sync-subscription.post': () => import('~/server/api/paystack/sync-subscription.post'),
}
const route = async (name: keyof typeof ROUTES) =>
  (await ROUTES[name]()).default as unknown as Handler

const monthsFromNow = (iso: unknown) =>
  (new Date(String(iso)).getTime() - Date.now()) / (30.44 * DAY)

describe.skipIf(!process.env.FIRESTORE_EMULATOR_HOST)(
  'Storvv subscription billing (emulator)',
  () => {
    let app: App
    let db: Firestore

    beforeAll(() => {
      app = initializeApp({ projectId: 'storv-ui-test-billing' }, `billing-${randomUUID()}`)
      db = getFirestore(app)
      m.db = db
    })

    afterAll(async () => {
      await deleteApp(app)
    })

    beforeEach(() => {
      paystack.reset()
      m.status = 200
      vi.spyOn(console, 'warn').mockImplementation(() => undefined)
      vi.spyOn(console, 'error').mockImplementation(() => undefined)
    })

    async function newOwner() {
      const uid = `owner-${randomUUID()}`
      await db
        .collection('users')
        .doc(uid)
        .set({ subscription: 'storvv_micro', email: `${uid}@example.test` })
      m.uid = uid
      return uid
    }

    const user = async (uid: string) => (await db.collection('users').doc(uid).get()).data()!

    async function startCheckout(
      uid: string,
      planId: SubscriptionPlan,
      billingCycle: SubscriptionBillingCycle
    ) {
      m.uid = uid
      m.body = {
        planId,
        billingCycle,
        userId: uid,
        email: `${uid}@example.test`,
        totpCode: '123456',
      }
      return (await (
        await route('initialize.post')
      )({})) as { reference: string; authorization_url: string }
    }

    async function verify(uid: string, reference: string) {
      m.uid = uid
      m.query = { reference }
      return (await route('verify.get'))({})
    }

    async function subscribe(
      uid: string,
      planId: SubscriptionPlan,
      billingCycle: SubscriptionBillingCycle
    ) {
      const { reference } = await startCheckout(uid, planId, billingCycle)
      const sub = paystack.pay(reference)
      await verify(uid, reference)
      return { reference, sub }
    }

    async function webhook(payload: unknown, signWith = SECRET, fromIp = '52.31.139.75') {
      m.raw = JSON.stringify(payload)
      m.signature = createHmac('sha512', signWith).update(m.raw).digest('hex')
      m.status = 200
      const out = await (await route('webhook.post'))({
        node: { req: { socket: { remoteAddress: fromIp } } },
      })
      return { status: m.status, out }
    }

    /** A first-charge webhook as Paystack sends it for a checkout started through initialize. */
    function firstCharge(
      reference: string,
      overrides: { amount?: number; planCode?: string; metadata?: Record<string, unknown> } = {}
    ) {
      const tx = paystack.transactions.get(reference)!
      return {
        event: 'charge.success',
        data: {
          reference,
          amount: overrides.amount ?? PAYSTACK_PLANS[tx.plan]!.amount,
          currency: 'NGN',
          metadata: overrides.metadata ?? tx.metadata,
          plan: { plan_code: overrides.planCode ?? tx.plan },
          subscription: {
            subscription_code: `SUB_${randomUUID().slice(0, 8)}`,
            email_token: 'tok_first',
            next_payment_date: new Date(Date.now() + 31 * DAY).toISOString(),
          },
          customer: { customer_code: tx.customer },
        },
      }
    }

    describe('first payment', () => {
      it.each([
        ['storvv_medium', 'monthly', 'PLN_medium_monthly', 1_000_000, 1],
        ['storvv_medium', 'quarterly', 'PLN_medium_quarterly', 2_700_000, 3],
        ['storvv_medium', 'yearly', 'PLN_medium_yearly', 10_200_000, 12],
        ['storvv_enterprise', 'monthly', 'PLN_enterprise_monthly', 2_500_000, 1],
        ['storvv_enterprise', 'quarterly', 'PLN_enterprise_quarterly', 6_750_000, 3],
        ['storvv_enterprise', 'yearly', 'PLN_enterprise_yearly', 25_500_000, 12],
      ] as const)(
        '%s %s: checks out on %s for %i kobo and runs for %i month(s)',
        async (planId, cycle, planCode, amount, months) => {
          const uid = await newOwner()
          const { reference, authorization_url } = await startCheckout(uid, planId, cycle)

          expect(authorization_url).toContain(reference)
          expect(paystack.initialized[0]).toMatchObject({
            plan: planCode,
            amount,
            currency: 'NGN',
            callback_url: `${ORIGIN}/dashboard/settings?paystack_callback=1`,
            metadata: { userId: uid, planId, billingCycle: cycle },
          })
          const pending = await db.doc(`users/${uid}/pendingCheckouts/${reference}`).get()
          expect(pending.data()).toMatchObject({
            status: 'initialized',
            planId,
            billingCycle: cycle,
            amount,
          })

          const sub = paystack.pay(reference)
          const out = await verify(uid, reference)
          expect(out).toMatchObject({ success: true, paid: true, planId, alreadyProcessed: false })

          const u = await user(uid)
          expect(u).toMatchObject({
            subscription: planId,
            subscriptionBillingCycle: cycle,
            subscriptionStatus: 'active',
            paystackSubscriptionCode: sub.subscription_code,
            paystackSubscriptionEmailToken: sub.email_token,
            paystackCustomerCode: `CUS_${uid}`,
            lastPaystackReference: reference,
          })
          expect(monthsFromNow(u.subscriptionCurrentPeriodEnd)).toBeCloseTo(months, 0)
          expect((await pending.ref.get()).data()?.status).toBe('completed')
        }
      )

      it('does not upgrade before the customer has paid', async () => {
        const uid = await newOwner()
        const { reference } = await startCheckout(uid, 'storvv_medium', 'monthly')
        expect(await verify(uid, reference)).toMatchObject({ success: false, paid: false })
        expect((await user(uid)).subscription).toBe('storvv_micro')
      })

      it('applies a payment once when verify runs twice', async () => {
        const uid = await newOwner()
        const { reference } = await subscribe(uid, 'storvv_medium', 'yearly')
        expect(await verify(uid, reference)).toMatchObject({
          success: true,
          alreadyProcessed: true,
        })
      })

      it('leaves the account on Micro when Paystack charged a different amount than the server expects', async () => {
        const uid = await newOwner()
        const { reference } = await startCheckout(uid, 'storvv_medium', 'quarterly')
        paystack.pay(reference, { amount: 1_350_000 })
        expect(await verify(uid, reference)).toMatchObject({
          success: false,
          message: 'Payment amount does not match selected plan.',
        })
        expect((await user(uid)).subscription).toBe('storvv_micro')
      })

      it("refuses to verify another owner's payment", async () => {
        const payer = await newOwner()
        const { reference } = await startCheckout(payer, 'storvv_medium', 'monthly')
        paystack.pay(reference)
        const other = await newOwner()
        await expect(verify(other, reference)).rejects.toMatchObject({ statusCode: 403 })
        expect((await user(payer)).subscription).toBe('storvv_micro')
      })

      it('turns off the old Paystack subscription when the owner switches cycle', async () => {
        const uid = await newOwner()
        const { sub: monthly } = await subscribe(uid, 'storvv_medium', 'monthly')
        const { sub: yearly } = await subscribe(uid, 'storvv_medium', 'yearly')

        expect(paystack.disabled).toEqual([
          { code: monthly.subscription_code, token: monthly.email_token },
        ])
        const u = await user(uid)
        expect(u).toMatchObject({
          subscriptionBillingCycle: 'yearly',
          paystackSubscriptionCode: yearly.subscription_code,
        })
        expect(monthsFromNow(u.subscriptionCurrentPeriodEnd)).toBeCloseTo(12, 0)
      })
    })

    describe('renewals (webhook)', () => {
      it('extends the period on each renewal and keeps the cycle', async () => {
        const uid = await newOwner()
        const { sub } = await subscribe(uid, 'storvv_enterprise', 'quarterly')
        const next = new Date(Date.now() + 182 * DAY).toISOString()

        const res = await webhook({
          event: 'charge.success',
          data: {
            reference: `renewal_${randomUUID()}`,
            amount: 6_750_000,
            currency: 'NGN',
            subscription: { subscription_code: sub.subscription_code, next_payment_date: next },
            customer: { customer_code: `CUS_${uid}` },
          },
        })

        expect(res.status).toBe(200)
        expect(await user(uid)).toMatchObject({
          subscription: 'storvv_enterprise',
          subscriptionBillingCycle: 'quarterly',
          subscriptionStatus: 'active',
          subscriptionCurrentPeriodEnd: next,
        })
      })

      it('marks a failed renewal past due, then active again once paid', async () => {
        const uid = await newOwner()
        const { sub } = await subscribe(uid, 'storvv_medium', 'monthly')

        await webhook({
          event: 'invoice.payment_failed',
          data: { subscription: { subscription_code: sub.subscription_code } },
        })
        expect((await user(uid)).subscriptionStatus).toBe('past_due')

        await webhook({
          event: 'charge.success',
          data: {
            reference: `renewal_${randomUUID()}`,
            amount: 1_000_000,
            currency: 'NGN',
            subscription: {
              subscription_code: sub.subscription_code,
              next_payment_date: new Date(Date.now() + 31 * DAY).toISOString(),
            },
          },
        })
        expect(await user(uid)).toMatchObject({
          subscription: 'storvv_medium',
          subscriptionStatus: 'active',
        })
      })

      it('ignores a webhook with a bad signature', async () => {
        const uid = await newOwner()
        const { sub } = await subscribe(uid, 'storvv_medium', 'monthly')
        const before = await user(uid)

        const res = await webhook(
          { event: 'subscription.disable', data: { subscription_code: sub.subscription_code } },
          'sk_test_wrong'
        )

        expect(res.status).toBe(401)
        expect(await user(uid)).toEqual(before)
      })

      it('keeps the paid plan until the period ends when Paystack disables the subscription', async () => {
        const uid = await newOwner()
        const { sub } = await subscribe(uid, 'storvv_medium', 'yearly')

        await webhook({
          event: 'subscription.disable',
          data: { subscription_code: sub.subscription_code },
        })

        const u = await user(uid)
        expect(u).toMatchObject({ subscription: 'storvv_medium', subscriptionStatus: 'canceled' })
        expect(u.paystackSubscriptionCode).toBeUndefined()
        expect(monthsFromNow(u.subscriptionCurrentPeriodEnd)).toBeCloseTo(12, 0)
      })
    })

    describe('webhook plan checks', () => {
      it('applies the plan Paystack charged for, not the plan written in metadata', async () => {
        const uid = await newOwner()
        const { reference } = await startCheckout(uid, 'storvv_medium', 'monthly')
        paystack.pay(reference)

        const res = await webhook(
          firstCharge(reference, {
            metadata: { userId: uid, planId: 'storvv_enterprise', billingCycle: 'yearly' },
          })
        )

        expect(res.status).toBe(200)
        expect(await user(uid)).toMatchObject({
          subscription: 'storvv_medium',
          subscriptionBillingCycle: 'monthly',
        })
      })

      it('refuses a cheap plan charge that claims to be Enterprise', async () => {
        const uid = await newOwner()
        const { reference } = await startCheckout(uid, 'storvv_enterprise', 'yearly')

        await webhook(firstCharge(reference, { planCode: 'PLN_medium_monthly', amount: 1_000_000 }))

        const u = await user(uid)
        expect(u.subscription).toBe('storvv_micro')
        expect(u.subscriptionPaymentIssue).toMatchObject({ reference, problem: 'plan-mismatch' })
      })

      it('refuses a charge for the right plan at the wrong amount and tells the owner', async () => {
        const uid = await newOwner()
        const { reference } = await startCheckout(uid, 'storvv_enterprise', 'monthly')

        await webhook(firstCharge(reference, { amount: 100 }))

        const u = await user(uid)
        expect(u.subscription).toBe('storvv_micro')
        expect(u.subscriptionPaymentIssue).toMatchObject({
          reference,
          amountKobo: 100,
          problem: 'amount-mismatch',
        })
      })

      it('ignores a charge whose reference has no checkout started on Storvv', async () => {
        const uid = await newOwner()
        const res = await webhook({
          event: 'charge.success',
          data: {
            reference: `forged_${randomUUID()}`,
            amount: 25_500_000,
            currency: 'NGN',
            metadata: { userId: uid, planId: 'storvv_enterprise', billingCycle: 'yearly' },
            plan: { plan_code: 'PLN_enterprise_yearly' },
            subscription: { subscription_code: `SUB_${randomUUID().slice(0, 8)}` },
          },
        })

        expect(res.status).toBe(200)
        const u = await user(uid)
        expect(u.subscription).toBe('storvv_micro')
        expect(u.subscriptionPaymentIssue).toBeUndefined()
      })

      it('applies a renewal once even when Paystack or an attacker replays it', async () => {
        const uid = await newOwner()
        const { sub } = await subscribe(uid, 'storvv_medium', 'monthly')
        const renewal = (reference: string, next: string) => ({
          event: 'charge.success',
          data: {
            reference,
            amount: 1_000_000,
            currency: 'NGN',
            plan: { plan_code: 'PLN_medium_monthly' },
            subscription: { subscription_code: sub.subscription_code, next_payment_date: next },
          },
        })
        const first = `renewal_${randomUUID()}`
        const later = new Date(Date.now() + 62 * DAY).toISOString()

        await webhook(renewal(first, new Date(Date.now() + 31 * DAY).toISOString()))
        await webhook(renewal(`renewal_${randomUUID()}`, later))
        await webhook(renewal(first, new Date(Date.now() + 31 * DAY).toISOString()))

        expect((await user(uid)).subscriptionCurrentPeriodEnd).toBe(later)
      })

      it('clears the owner notice once a good charge applies', async () => {
        const uid = await newOwner()
        const { sub } = await subscribe(uid, 'storvv_medium', 'monthly')
        const charge = (amount: number) => ({
          event: 'charge.success',
          data: {
            reference: `renewal_${randomUUID()}`,
            amount,
            currency: 'NGN',
            subscription: {
              subscription_code: sub.subscription_code,
              next_payment_date: new Date(Date.now() + 31 * DAY).toISOString(),
            },
          },
        })

        await webhook(charge(500_000))
        expect((await user(uid)).subscriptionPaymentIssue).toMatchObject({
          problem: 'amount-mismatch',
        })
        await webhook(charge(1_000_000))
        expect((await user(uid)).subscriptionPaymentIssue).toBeUndefined()
      })

      it('refuses subscription events from outside the Paystack IP list when one is set', async () => {
        const uid = await newOwner()
        const { sub } = await subscribe(uid, 'storvv_medium', 'yearly')
        vi.stubEnv('PAYSTACK_WEBHOOK_IPS', '52.31.139.75,52.49.173.169,52.214.14.220')
        try {
          const blocked = await webhook(
            { event: 'subscription.disable', data: { subscription_code: sub.subscription_code } },
            SECRET,
            '203.0.113.9'
          )
          expect(blocked.status).toBe(401)
          expect((await user(uid)).subscriptionStatus).toBe('active')

          const allowed = await webhook(
            { event: 'subscription.disable', data: { subscription_code: sub.subscription_code } },
            SECRET,
            '52.49.173.169'
          )
          expect(allowed.status).toBe(200)
          expect((await user(uid)).subscriptionStatus).toBe('canceled')
        } finally {
          vi.unstubAllEnvs()
        }
      })
    })

    describe('cancelling', () => {
      it('stops auto-renew, keeps the plan until the period end, then drops to Micro', async () => {
        const uid = await newOwner()
        const { sub } = await subscribe(uid, 'storvv_enterprise', 'monthly')

        m.uid = uid
        m.body = { totpCode: '123456' }
        const out = await (await route('cancel-subscription.post'))({})
        expect(out).toMatchObject({
          success: true,
          subscriptionStatus: 'canceled',
          subscription: 'storvv_enterprise',
          paystackDisabled: true,
        })
        expect(paystack.disabled).toEqual([{ code: sub.subscription_code, token: sub.email_token }])

        const sync = await route('sync-subscription.post')
        expect(await sync({})).toMatchObject({
          downgraded: false,
          subscription: 'storvv_enterprise',
        })

        await db
          .collection('users')
          .doc(uid)
          .set(
            { subscriptionCurrentPeriodEnd: new Date(Date.now() - DAY).toISOString() },
            { merge: true }
          )
        expect(await sync({})).toMatchObject({ downgraded: true, subscription: 'storvv_micro' })
        expect((await user(uid)).subscriptionCurrentPeriodEnd).toBeUndefined()
      })

      it('refuses to cancel twice', async () => {
        const uid = await newOwner()
        await subscribe(uid, 'storvv_medium', 'monthly')
        m.uid = uid
        m.body = { totpCode: '123456' }
        const cancel = await route('cancel-subscription.post')
        await cancel({})
        await expect(cancel({})).rejects.toMatchObject({ statusCode: 409 })
      })
    })
  }
)
