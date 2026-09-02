import { describe, expect, it } from 'vitest'
import {
  billingCycleToPaystackInterval,
  computeSubscriptionPeriodEnd,
  getPaystackPlanCodeConfigKey,
} from '~/types/subscription-billing'

describe('subscription billing helpers', () => {
  it('maps billing cycles to Paystack intervals', () => {
    expect(billingCycleToPaystackInterval('monthly')).toBe('monthly')
    expect(billingCycleToPaystackInterval('quarterly')).toBe('quarterly')
    expect(billingCycleToPaystackInterval('yearly')).toBe('annually')
  })

  it('builds plan code config keys for paid tiers', () => {
    expect(getPaystackPlanCodeConfigKey('storvv_medium', 'monthly')).toBe(
      'paystackPlanCodeMediumMonthly'
    )
    expect(getPaystackPlanCodeConfigKey('storvv_enterprise', 'yearly')).toBe(
      'paystackPlanCodeEnterpriseYearly'
    )
    expect(getPaystackPlanCodeConfigKey('storvv_micro', 'monthly')).toBeNull()
  })

  it('computes period end from billing cycle', () => {
    const start = new Date('2026-01-15T12:00:00.000Z')
    const monthly = new Date(computeSubscriptionPeriodEnd(start, 'monthly'))
    expect(monthly.getUTCMonth()).toBe(1)

    const quarterly = new Date(computeSubscriptionPeriodEnd(start, 'quarterly'))
    expect(quarterly.getUTCMonth()).toBe(3)

    const yearly = new Date(computeSubscriptionPeriodEnd(start, 'yearly'))
    expect(yearly.getUTCFullYear()).toBe(2027)
  })
})
