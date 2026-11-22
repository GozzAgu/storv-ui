import { describe, expect, it } from 'vitest'
import { formatAxisMoney } from '~/utils/format-money'

describe('formatAxisMoney', () => {
  it('shortens large amounts for chart axes', () => {
    expect(formatAxisMoney(200_000_000, '₦')).toBe('₦200M')
    expect(formatAxisMoney(1_500_000_000, '₦')).toBe('₦1.5B')
    expect(formatAxisMoney(50_000, '₦')).toBe('₦50k')
    expect(formatAxisMoney(2_500, '₦')).toBe('₦2.5k')
    expect(formatAxisMoney(0, '₦')).toBe('₦0')
    expect(formatAxisMoney(-3_000_000, '$')).toBe('-$3M')
  })
})
