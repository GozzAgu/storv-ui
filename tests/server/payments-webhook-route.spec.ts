// @vitest-environment node
import { createHmac } from 'node:crypto'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const SECRET = vi.hoisted(() => 'sk_test_unit')
const m = vi.hoisted(() => ({
  status: vi.fn(),
  body: '',
  signature: '',
  legacyEnabled: false,
  gateEnabled: true,
  ipAllowed: true,
  handleLinkCharge: vi.fn(),
  settlePaymentLink: vi.fn(),
  extract: vi.fn(),
  findAddOn: vi.fn(),
  findUser: vi.fn(),
  paystackRequest: vi.fn(),
  emailReady: false,
  sendReceiptEmail: vi.fn(),
}))

vi.mock('h3', () => ({
  defineEventHandler: (fn: unknown) => fn,
  readRawBody: async () => m.body,
  getHeader: () => m.signature,
  setResponseStatus: (_e: unknown, code: number) => m.status(code),
}))
vi.mock('~/server/utils/firebase-admin', () => ({ getAdminFirestore: () => ({ fake: 'db' }) }))
vi.mock('~/server/utils/payment-links', async () => {
  const actual = await vi.importActual<typeof import('~/server/utils/payment-links')>(
    '~/server/utils/payment-links'
  )
  return {
    getPaystackSecret: () => SECRET,
    isValidPaystackSignature: actual.isValidPaystackSignature,
    paystackRequest: m.paystackRequest,
  }
})
vi.mock('~/server/utils/payment-link-settle', () => ({ settlePaymentLink: m.settlePaymentLink }))
vi.mock('~/server/utils/legacy-payment-links', () => ({
  legacyPaymentLinksEnabled: () => m.legacyEnabled,
}))
vi.mock('~/server/utils/payments/config', () => ({
  getPaymentsV2Gate: async () => ({ enabled: m.gateEnabled }),
}))
vi.mock('~/server/utils/payments/link-webhook', () => ({ handleLinkCharge: m.handleLinkCharge }))
vi.mock('~/server/utils/payments/webhook-guard', async () => {
  const { parseCheckoutReference } = await import('~/server/utils/payments/link-token')
  return {
    isLinkReference: (r: unknown) => parseCheckoutReference(r) !== null,
    webhookIpAllowed: () => m.ipAllowed,
  }
})
vi.mock('~/server/utils/paystack-subscription', () => ({
  applySubscriptionToUser: vi.fn(),
  cancelAutoRenewForUser: vi.fn(),
  extractSubscriptionFromChargePayload: m.extract,
  findUserIdByPaystackSubscriptionCode: m.findUser,
  maybeDowngradeExpiredSubscription: vi.fn(),
}))
vi.mock('~/server/utils/subscription-addons', () => ({
  attachSubscriptionFromWebhook: vi.fn(),
  cancelAllAddOns: vi.fn(),
  completeAddOnCheckout: vi.fn(),
  findAddOnBySubscriptionCode: m.findAddOn,
  updateAddOnFromWebhook: vi.fn(),
}))
vi.mock('~/server/utils/log-server-error', () => ({ logServerError: vi.fn() }))
vi.mock('~/server/utils/delivery-config', () => ({ isResendConfigured: () => m.emailReady }))
vi.mock('~/server/utils/receipt-delivery-email', () => ({ sendReceiptEmail: m.sendReceiptEmail }))
vi.mock('~/server/utils/staff-invite-email', () => ({ sendViaResend: vi.fn() }))

vi.stubGlobal('useRuntimeConfig', () => ({}))

const LINK_REF = `stvp_${'a'.repeat(20)}_${'0'.repeat(16)}`
const sign = (body: string, key = SECRET) => createHmac('sha512', key).update(body).digest('hex')
const run = async (payload: unknown, signature?: (body: string) => string) => {
  m.body = JSON.stringify(payload)
  m.signature = (signature ?? sign)(m.body)
  const handler = (await import('~/server/api/paystack/webhook.post')).default as unknown as (
    e: unknown
  ) => Promise<unknown>
  return handler({})
}

describe('Paystack webhook dispatch', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    m.legacyEnabled = false
    m.gateEnabled = true
    m.ipAllowed = true
    m.extract.mockReturnValue({})
    m.findAddOn.mockResolvedValue(null)
    m.findUser.mockResolvedValue(null)
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
  })

  it('sends a Storvv link reference to the V2 handler only, with its status', async () => {
    m.handleLinkCharge.mockResolvedValue({ httpStatus: 500, outcome: 'verify_unavailable' })
    const out = await run({ event: 'charge.success', data: { reference: LINK_REF, amount: 1 } })
    expect(m.handleLinkCharge).toHaveBeenCalledWith({ fake: 'db' }, LINK_REF, {
      enabled: true,
      paystack: expect.any(Function),
      sendPayerReceipt: undefined,
      alerts: {},
    })
    expect(m.status).toHaveBeenLastCalledWith(500)
    expect(out).toEqual({ received: false })
    expect(m.extract).not.toHaveBeenCalled()
    expect(m.settlePaymentLink).not.toHaveBeenCalled()
  })

  it('passes the gate state and the server secret key to verify', async () => {
    m.gateEnabled = false
    m.handleLinkCharge.mockImplementation(async (_db, _ref, deps) => {
      await deps.paystack('/transaction/verify/x', { method: 'GET' })
      return { httpStatus: 200, outcome: 'applied' }
    })
    await run({ event: 'charge.success', data: { reference: LINK_REF } })
    expect(m.handleLinkCharge.mock.calls[0]![2].enabled).toBe(false)
    expect(m.paystackRequest).toHaveBeenCalledWith('/transaction/verify/x', {
      method: 'GET',
      body: undefined,
      secretKey: 'sk_test_unit',
    })
    expect(m.status).toHaveBeenLastCalledWith(200)
  })

  it('wires the payer receipt and ops email only when email is configured', async () => {
    m.emailReady = true
    vi.stubEnv('PAYMENTS_ALERT_EMAIL', 'ops@example.test')
    m.handleLinkCharge.mockImplementation(async (_db, _ref, deps) => {
      await deps.sendPayerReceipt('payer@example.com', { receiptNumber: 'R-1' })
      return { httpStatus: 200, outcome: 'applied' }
    })
    await run({ event: 'charge.success', data: { reference: LINK_REF } })
    const deps = m.handleLinkCharge.mock.calls[0]![2]
    expect(deps.alerts).toEqual({ to: 'ops@example.test', sendEmail: expect.any(Function) })
    expect(m.sendReceiptEmail).toHaveBeenCalledWith(
      expect.objectContaining({ toEmail: 'payer@example.com', view: { receiptNumber: 'R-1' } })
    )
    vi.unstubAllEnvs()
    m.emailReady = false
  })

  it.each([
    ['no signature', () => ''],
    ['a signature made with another key', (b: string) => sign(b, 'sk_test_attacker')],
    ['a signature of a different body', () => sign('{"event":"charge.success"}')],
    ['a truncated signature', (b: string) => sign(b).slice(0, 64)],
  ])('rejects a forged webhook (%s) with 401 and touches nothing', async (_label, forge) => {
    const out = await run({ event: 'charge.success', data: { reference: LINK_REF } }, forge)
    expect(m.status).toHaveBeenLastCalledWith(401)
    expect(out).toEqual({ error: 'Invalid signature' })
    expect(m.handleLinkCharge).not.toHaveBeenCalled()
    expect(m.extract).not.toHaveBeenCalled()
  })

  it('a tampered body fails the signature even if the original was signed', async () => {
    const original = JSON.stringify({
      event: 'charge.success',
      data: { reference: LINK_REF, amount: 100 },
    })
    const out = await run(
      { event: 'charge.success', data: { reference: LINK_REF, amount: 1 } },
      () => sign(original)
    )
    expect(out).toEqual({ error: 'Invalid signature' })
    expect(m.handleLinkCharge).not.toHaveBeenCalled()
  })

  it('refuses link events from outside the IP allowlist without touching anything', async () => {
    m.ipAllowed = false
    await run({ event: 'charge.success', data: { reference: LINK_REF } })
    expect(m.status).toHaveBeenLastCalledWith(401)
    expect(m.handleLinkCharge).not.toHaveBeenCalled()
  })

  it('leaves subscription charges on the billing path', async () => {
    await run({ event: 'charge.success', data: { reference: 'sub_ref_1', amount: 500_00 } })
    expect(m.handleLinkCharge).not.toHaveBeenCalled()
    expect(m.extract).toHaveBeenCalledTimes(1)
  })

  it('ignores legacy token charges unless legacy links are enabled', async () => {
    const legacy = {
      event: 'charge.success',
      data: { reference: 'legacy_ref', amount: 100, metadata: { token: 'f'.repeat(40) } },
    }
    await run(legacy)
    expect(m.settlePaymentLink).not.toHaveBeenCalled()
    expect(m.extract).toHaveBeenCalledTimes(1)

    m.legacyEnabled = true
    await run(legacy)
    expect(m.settlePaymentLink).toHaveBeenCalledTimes(1)
  })
})
