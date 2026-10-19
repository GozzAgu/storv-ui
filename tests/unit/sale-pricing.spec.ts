import { describe, expect, it } from 'vitest'
import type { InventoryItem } from '~/stores/inventory'
import {
  SalePricingError,
  computeSaleTotals,
  discountNeedsApproval,
  priceSaleLine,
  saleUnitPrice,
  splitPaymentsMatch,
} from '~/utils/sale-pricing'

const item = (fields: Record<string, unknown>) =>
  ({ id: 'i1', folderId: 'f1', ...fields } as unknown as InventoryItem)

describe('saleUnitPrice', () => {
  it('uses the standing discount, then the Unit Price', () => {
    expect(saleUnitPrice(item({ price: 1000, discountedPrice: 800 }))).toBe(800)
    expect(saleUnitPrice(item({ Price: '1500' }))).toBe(1500)
    expect(saleUnitPrice(item({ unitCost: 900 }))).toBe(0)
  })
})

describe('priceSaleLine', () => {
  it('prices from the inventory row, not the client', () => {
    const line = priceSaleLine({
      item: item({ price: 900_000 }),
      quantity: 1,
      serial: true,
      discountPerUnit: 0,
    })
    expect(line).toMatchObject({ finalPrice: 900_000, lineTotal: 900_000, needsApproval: false })
  })

  it('refuses a product with no Unit Price', () => {
    expect(() =>
      priceSaleLine({ item: item({ unitCost: 5 }), quantity: 1, serial: false, discountPerUnit: 0 })
    ).toThrow(SalePricingError)
  })

  it('forces serial rows to one unit and rejects bad quantities', () => {
    expect(
      priceSaleLine({ item: item({ price: 10 }), quantity: 5, serial: true, discountPerUnit: 0 })
        .quantity
    ).toBe(1)
    expect(() =>
      priceSaleLine({ item: item({ price: 10 }), quantity: 0, serial: false, discountPerUnit: 0 })
    ).toThrow(SalePricingError)
  })

  it('caps the discount at the price and flags big discounts for approval', () => {
    expect(() =>
      priceSaleLine({
        item: item({ price: 100 }),
        quantity: 1,
        serial: false,
        discountPerUnit: 101,
      })
    ).toThrow(SalePricingError)
    const line = priceSaleLine({
      item: item({ price: 100 }),
      quantity: 2,
      serial: false,
      discountPerUnit: 20,
    })
    expect(line).toMatchObject({ finalPrice: 80, lineTotal: 160, needsApproval: true })
  })
})

describe('discountNeedsApproval', () => {
  it('allows up to 10% without approval', () => {
    expect(discountNeedsApproval(1000, 100)).toBe(false)
    expect(discountNeedsApproval(1000, 101)).toBe(true)
    expect(discountNeedsApproval(1000, 0)).toBe(false)
  })
})

describe('computeSaleTotals', () => {
  it('never credits a trade-in for more than the items are worth', () => {
    expect(computeSaleTotals([{ lineTotal: 300 }], 500)).toEqual({
      subtotal: 300,
      swapInCredit: 300,
      commission: 0,
      total: 0,
    })
  })

  it('adds commission on top', () => {
    expect(computeSaleTotals([{ lineTotal: 100 }, { lineTotal: 50 }], 20, 10).total).toBe(140)
  })
})

describe('splitPaymentsMatch', () => {
  it('requires the tenders to add up to the amount due', () => {
    expect(splitPaymentsMatch([{ amount: 60 }, { amount: 40 }], 100)).toBe(true)
    expect(splitPaymentsMatch([{ amount: 60 }], 100)).toBe(false)
  })
})
