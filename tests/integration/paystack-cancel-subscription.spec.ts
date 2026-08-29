import { describe, expect, it, vi } from 'vitest'
import { cancelPaystackSubscription } from '~/utils/paystack-cancel-subscription'

describe('cancelPaystackSubscription', () => {
  it('returns ok when API succeeds', async () => {
    const fetcher = vi.fn().mockResolvedValue({
      success: true,
      subscriptionStatus: 'canceled',
      subscription: 'storvv_medium',
      subscriptionCurrentPeriodEnd: '2026-09-01T00:00:00.000Z',
    })
    const result = await cancelPaystackSubscription({ totpCode: '123456' }, fetcher)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.subscriptionStatus).toBe('canceled')
    }
    expect(fetcher).toHaveBeenCalledWith(
      '/api/paystack/cancel-subscription',
      expect.objectContaining({
        method: 'POST',
        body: { totpCode: '123456' },
      })
    )
  })

  it('maps API failure to message', async () => {
    const fetcher = vi.fn().mockResolvedValue({
      success: false,
      message: 'Already canceled',
    })
    const result = await cancelPaystackSubscription({}, fetcher)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.message).toBe('Already canceled')
    }
  })
})
