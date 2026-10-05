import { describe, expect, it } from 'vitest'
import {
  formatAxisCurrency,
  formatCompactCurrency,
  formatCompactCurrencySuffix,
  formatCompactUnit,
} from '~/utils/format-compact-currency'

describe('formatCompactCurrency', () => {
  it('formats millions and billions with lowercase suffixes', () => {
    expect(formatCompactCurrency(1_000_000, '₦')).toBe('₦1m')
    expect(formatCompactCurrency(4_000_000, '₦')).toBe('₦4m')
    expect(formatCompactCurrency(180_000_000, '₦')).toBe('₦180m')
    expect(formatCompactCurrency(1_500_000, '$')).toBe('$1.5m')
    expect(formatCompactCurrency(1_000_000_000, '₦')).toBe('₦1b')
    expect(formatCompactCurrency(1_300_000_000, '₦')).toBe('₦1.3b')
  })

  it('returns null below one million', () => {
    expect(formatCompactCurrency(999_999, '₦')).toBeNull()
    expect(formatCompactCurrencySuffix(500_000)).toBe('')
  })

  it('formats axis labels at every magnitude', () => {
    expect(formatAxisCurrency(0, '₦')).toBe('₦0')
    expect(formatAxisCurrency(850, '₦')).toBe('₦850')
    expect(formatAxisCurrency(12_000, '₦')).toBe('₦12k')
    expect(formatAxisCurrency(800_000, '₦')).toBe('₦800k')
    expect(formatAxisCurrency(1_200_000, '₦')).toBe('₦1.2m')
    expect(formatAxisCurrency(-2_500, '$')).toBe('-$2.5k')
  })

  it('formats compact units', () => {
    expect(formatCompactUnit(1)).toBe('1')
    expect(formatCompactUnit(1.3)).toBe('1.3')
    expect(formatCompactUnit(180)).toBe('180')
  })
})
