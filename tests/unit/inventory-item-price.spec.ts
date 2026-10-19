import { describe, expect, it } from 'vitest'
import { hasSaleUnitPrice, swapInNeedsPrice } from '~/utils/inventory-item-price'

describe('hasSaleUnitPrice', () => {
  it('is true for a product with a Unit Price', () => {
    expect(hasSaleUnitPrice({ price: 300_000 })).toBe(true)
    expect(hasSaleUnitPrice({ price: '300000' })).toBe(true)
  })

  it('is false for a swap-in taken without a Unit Price, or saved as 0', () => {
    expect(hasSaleUnitPrice({ name: 'Hiace Bus', unitCost: 1_200_000 })).toBe(false)
    expect(hasSaleUnitPrice({ price: '' })).toBe(false)
    expect(hasSaleUnitPrice({ price: null })).toBe(false)
    expect(hasSaleUnitPrice({ price: 0 })).toBe(false)
  })

  it('counts a discounted product as priced', () => {
    expect(hasSaleUnitPrice({ price: 0, originalPrice: 50_000, discountedPrice: 0 })).toBe(true)
  })
})

describe('swapInNeedsPrice', () => {
  it('flags an unsold swap-in with no Unit Price', () => {
    expect(swapInNeedsPrice({ swapIn: true, unitCost: 150_000 })).toBe(true)
  })

  it('ignores priced, sold and non-swap-in items', () => {
    expect(swapInNeedsPrice({ swapIn: true, price: 200_000 })).toBe(false)
    expect(swapInNeedsPrice({ swapIn: true, dateOut: '2026-10-01' })).toBe(false)
    expect(swapInNeedsPrice({ unitCost: 150_000 })).toBe(false)
  })
})
