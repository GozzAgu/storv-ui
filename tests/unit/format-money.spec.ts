import { describe, expect, it } from 'vitest'
import { formatFullMoney, fullMoneyFractionDigits } from '~/utils/format-money'

describe('formatFullMoney', () => {
  it('never shortens large amounts', () => {
    expect(formatFullMoney(1_000_000, '₦')).toBe('₦1,000,000')
    expect(formatFullMoney(1_300_000_000, '₦')).toBe('₦1,300,000,000')
    expect(formatFullMoney(12_000, '₦')).toBe('₦12,000')
  })

  it('keeps kobo instead of rounding', () => {
    expect(formatFullMoney(1_250_000.5, '₦')).toBe('₦1,250,000.50')
    expect(formatFullMoney(-2_500.75, '$')).toBe('-$2,500.75')
    expect(formatFullMoney(0, '₦')).toBe('₦0')
  })
})

describe('fullMoneyFractionDigits', () => {
  it('shows decimals only when there is a fractional part', () => {
    expect(fullMoneyFractionDigits(5000)).toEqual({
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })
    expect(fullMoneyFractionDigits(5000.1)).toEqual({
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  })
})
