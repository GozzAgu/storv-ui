import { describe, expect, it } from 'vitest'
import { getExpectedPlanAmount, validatePaidAmountAndCurrency } from '~/server/utils/paystack-validation'

describe('paystack validation utils', () => {
 it('resolves expected amount for plan', () => {
 const amount = getExpectedPlanAmount('storvv_medium', {
 paystackPlanMediumAmount: 500000,
 })
 expect(amount).toBe(500000)
 })

 it('throws when amount config is invalid', () => {
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
