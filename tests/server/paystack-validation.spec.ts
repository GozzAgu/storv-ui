import { describe, expect, it } from 'vitest'
import {
  getExpectedPlanAmount,
  getPlanAmountConfigKey,
  validatePaidAmountAndCurrency,
} from '~/server/utils/paystack-validation'

describe('paystack validation utils', () => {
  const config = {
    paystackPlanMediumAmount: 500000,
    paystackPlanMediumAmountQuarterly: 1350000,
    paystackPlanMediumAmountYearly: 5100000,
  }

  it('resolves expected monthly amount for plan', () => {
    const amount = getExpectedPlanAmount('storvv_medium', config, 'monthly')
    expect(amount).toBe(500000)
  })

  it('resolves explicit quarterly amount for plan', () => {
    const amount = getExpectedPlanAmount('storvv_medium', config, 'quarterly')
    expect(amount).toBe(1350000)
  })

  it('derives quarterly amount when env override is unset', () => {
    const amount = getExpectedPlanAmount('storvv_medium', {
      paystackPlanMediumAmount: 500000,
    }, 'quarterly')
    expect(amount).toBe(1350000)
  })

  it('derives yearly amount when env override is unset', () => {
    const amount = getExpectedPlanAmount('storvv_medium', {
      paystackPlanMediumAmount: 500000,
    }, 'yearly')
    expect(amount).toBe(5100000)
  })

  it('builds config keys per billing cycle', () => {
    expect(getPlanAmountConfigKey('storvv_medium', 'monthly')).toBe('paystackPlanMediumAmount')
    expect(getPlanAmountConfigKey('storvv_medium', 'quarterly')).toBe(
      'paystackPlanMediumAmountQuarterly'
    )
    expect(getPlanAmountConfigKey('storvv_enterprise', 'yearly')).toBe(
      'paystackPlanEnterpriseAmountYearly'
    )
  })

  it('throws when monthly amount config is invalid', () => {
    expect(() => getExpectedPlanAmount('storvv_enterprise', {})).toThrow()
  })

  it('fails on amount mismatch', () => {
    const result = validatePaidAmountAndCurrency(1000, 'NGN', 500000)
    expect(result.valid).toBe(false)
  })

  it('fails on currency mismatch', () => {
    const result = validatePaidAmountAndCurrency(500000, 'USD', 500000)
    expect(result.valid).toBe(false)
  })

  it('passes on valid amount and currency', () => {
    const result = validatePaidAmountAndCurrency(500000, 'NGN', 500000)
    expect(result.valid).toBe(true)
  })
})
