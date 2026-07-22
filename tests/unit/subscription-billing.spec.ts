import { describe, expect, it } from 'vitest'
import {
  deriveBillingAmount,
  deriveBillingListAmount,
  isSubscriptionBillingCycle,
} from '~/utils/subscription-billing'

describe('subscription billing utils', () => {
  it('validates billing cycle values', () => {
    expect(isSubscriptionBillingCycle('quarterly')).toBe(true)
    expect(isSubscriptionBillingCycle('monthly')).toBe(true)
    expect(isSubscriptionBillingCycle('weekly')).toBe(false)
  })

  it('derives quarterly and yearly display amounts from monthly', () => {
    expect(deriveBillingAmount(10000, 'monthly')).toBe(10000)
    expect(deriveBillingAmount(10000, 'quarterly')).toBe(27000)
    expect(deriveBillingAmount(10000, 'yearly')).toBe(102000)
  })

  it('derives list prices for strikethrough display', () => {
    expect(deriveBillingListAmount(10000, 'quarterly')).toBe(30000)
    expect(deriveBillingListAmount(10000, 'yearly')).toBe(120000)
  })
})
