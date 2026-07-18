import { describe, it, expect } from 'vitest'
import { formatDiscountPercent } from '~/utils/format-discount'

describe('formatDiscountPercent', () => {
  it('rounds noisy floats to one decimal', () => {
    expect(formatDiscountPercent(1.9817073170731707)).toBe('2')
    expect(formatDiscountPercent(12.34)).toBe('12.3')
  })

  it('returns null for invalid values', () => {
    expect(formatDiscountPercent(undefined)).toBeNull()
    expect(formatDiscountPercent(Number.NaN)).toBeNull()
  })
})
