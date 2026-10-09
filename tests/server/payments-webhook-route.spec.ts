// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'

const m = vi.hoisted(() => ({
  status: vi.fn(),
  body: '',
  legacyEnabled: false,
  gateEnabled: true,
  ipAllowed: true,
  handleLinkCharge: vi.fn(),
  settlePaymentLink: vi.fn(),
  extract: vi.fn(),
  findAddOn: vi.fn(),
  findUser: vi.fn(),
  paystackRequest: vi.fn(),
}))

vi.mock('h3', () => ({
  defineEventHandler: (fn: unknown) => fn,
  readRawBody: async () => m.body,
  getHeader: () => 'sig',
  setResponseStatus: (_e: unknown, code: number) => m.status(code),
}))
vi.mock('~/server/utils/firebase-admin', () => ({ getAdminFirestore: () => ({ fake: 'db' }) }))
vi.mock('~/server/utils/payment-links', () => ({
  getPaystackSecret: () => 'sk_test_unit',
  isValidPaystackSignature: () => true,
  paystackRequest: m.paystackRequest,
}))
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

vi.stubGlobal('useRuntimeConfig', () => ({}))

const LINK_REF = `stvp_${'a'.repeat(20)}_${'0'.repeat(16)}`
const run = async (payload: unknown) => {
  m.body = JSON.stringify(payload)
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
