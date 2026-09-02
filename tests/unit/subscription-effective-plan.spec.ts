import { describe, expect, it } from 'vitest'
import { resolveEffectiveSubscriptionPlan } from '~/types/subscription'

describe('resolveEffectiveSubscriptionPlan', () => {
  it('returns stored plan for active subscriptions', () => {
    expect(
      resolveEffectiveSubscriptionPlan({
        subscription: 'storvv_medium',
        subscriptionStatus: 'active',
      })
    ).toBe('storvv_medium')
  })

  it('keeps paid plan during canceled grace period', () => {
    const future = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    expect(
      resolveEffectiveSubscriptionPlan({
        subscription: 'storvv_enterprise',
        subscriptionStatus: 'canceled',
        subscriptionCurrentPeriodEnd: future,
      })
    ).toBe('storvv_enterprise')
  })

  it('downgrades to micro after canceled period ends', () => {
    const past = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    expect(
      resolveEffectiveSubscriptionPlan({
        subscription: 'storvv_enterprise',
        subscriptionStatus: 'canceled',
        subscriptionCurrentPeriodEnd: past,
      })
    ).toBe('storvv_micro')
  })
})
