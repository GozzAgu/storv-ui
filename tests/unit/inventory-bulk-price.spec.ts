import { describe, expect, it } from 'vitest'
import {
  bulkPriceGroupKey,
  bulkPriceLockReason,
  describeBulkPriceSkips,
  groupItemsForBulkPrice,
  parseBulkPriceChange,
  planBulkPriceChange,
  planItemPriceChange,
} from '~/utils/inventory-bulk-price'

const acura = (id: string, extra: Record<string, unknown> = {}) => ({
  id,
  name: 'Acura',
  brand: 'MDX',
  serialNo: id,
  price: 15_000_000,
  unitCost: 8_000_000,
  ...extra,
})

describe('parseBulkPriceChange', () => {
  it('accepts a set unit price and a percentage cost change', () => {
    expect(
      parseBulkPriceChange({
        unitPrice: { mode: 'set', value: 16_500_000 },
        costPrice: { mode: 'percent', value: 5 },
      })
    ).toEqual({
      unitPrice: { mode: 'set', value: 16_500_000 },
      costPrice: { mode: 'percent', value: 5 },
    })
  })

  it('refuses nothing to change, bad modes, zero or negative unit prices and wild percentages', () => {
    expect(() => parseBulkPriceChange({})).toThrow(/Choose a new unit price/)
    expect(() => parseBulkPriceChange({ unitPrice: { mode: 'double', value: 2 } })).toThrow()
    expect(() => parseBulkPriceChange({ unitPrice: { mode: 'set', value: 0 } })).toThrow(
      /more than 0/
    )
    expect(() => parseBulkPriceChange({ unitPrice: { mode: 'set', value: -1 } })).toThrow()
    expect(() => parseBulkPriceChange({ unitPrice: { mode: 'set', value: '5' } })).toThrow(
      /Enter a number/
    )
    expect(() => parseBulkPriceChange({ unitPrice: { mode: 'percent', value: -95 } })).toThrow(
      /between/
    )
    expect(() => parseBulkPriceChange({ unitPrice: { mode: 'percent', value: 0 } })).toThrow()
  })

  it('allows a cost price of 0 (free stock) but not a unit price of 0', () => {
    expect(parseBulkPriceChange({ costPrice: { mode: 'set', value: 0 } }).costPrice?.value).toBe(0)
  })
})

describe('planItemPriceChange', () => {
  it('sets a new unit price and shows the margin effect', () => {
    const plan = planItemPriceChange(acura('1'), { unitPrice: { mode: 'set', value: 16_000_000 } })
    expect(plan.skipped).toBeNull()
    expect(plan.patch).toEqual({ price: 16_000_000 })
    expect(plan.before.marginPercent).toBeCloseTo(46.67, 1)
    expect(plan.after.marginPercent).toBe(50)
    expect(plan.priceChanged).toBe(true)
    expect(plan.costChanged).toBe(false)
  })

  it('adjusts cost by a percentage and rounds to kobo', () => {
    const plan = planItemPriceChange(acura('1', { unitCost: 1000.01 }), {
      costPrice: { mode: 'percent', value: 10 },
    })
    expect(plan.patch).toEqual({ unitCost: 1100.01 })
  })

  it('keeps an active discount percentage on the new price', () => {
    const plan = planItemPriceChange(
      acura('1', {
        price: 10_000,
        originalPrice: 10_000,
        discountedPrice: 9_000,
        discountPercentage: 10,
        discountAmount: 1_000,
      }),
      { unitPrice: { mode: 'set', value: 20_000 } }
    )
    expect(plan.patch).toEqual({
      price: 20_000,
      originalPrice: 20_000,
      discountedPrice: 18_000,
      discountAmount: 2_000,
    })
    expect(plan.after.sellPrice).toBe(18_000)
  })

  it('writes to the legacy price key the item already uses', () => {
    const plan = planItemPriceChange(
      { id: 'x', Price: '500' },
      { unitPrice: { mode: 'percent', value: 10 } }
    )
    expect(plan.patch).toEqual({ Price: 550 })
  })

  it('leaves sold, loaned and held items alone', () => {
    const change = { unitPrice: { mode: 'set' as const, value: 1 } }
    expect(planItemPriceChange(acura('1', { dateOut: '2026-10-19' }), change).skipped).toBe('sold')
    expect(planItemPriceChange(acura('1', { sellerLoanOutId: 'L1' }), change).skipped).toBe(
      'on_loan'
    )
    expect(planItemPriceChange(acura('1', { pendingSaleReceiptId: 'R1' }), change).skipped).toBe(
      'awaiting_payment'
    )
    expect(planItemPriceChange(acura('1', { dateOut: '2026-10-19' }), change).patch).toEqual({})
  })

  it('skips items already at the price, and percentage changes with nothing to adjust', () => {
    expect(
      planItemPriceChange(acura('1'), { unitPrice: { mode: 'set', value: 15_000_000 } }).skipped
    ).toBe('unchanged')
    expect(
      planItemPriceChange({ id: 'x', name: 'Cable' }, { unitPrice: { mode: 'percent', value: 5 } })
        .skipped
    ).toBe('no_price')
  })

  it('still changes the price when a cost percentage has no cost to work from', () => {
    const plan = planItemPriceChange(acura('1', { unitCost: undefined }), {
      unitPrice: { mode: 'set', value: 1 },
      costPrice: { mode: 'percent', value: 5 },
    })
    expect(plan.patch).toEqual({ price: 1 })
  })
})

describe('planBulkPriceChange', () => {
  it('counts what changes and why the rest was skipped', () => {
    const summary = planBulkPriceChange(
      [acura('1', { dateOut: '2026-10-19' }), acura('2'), acura('3'), acura('4', { sellerLoanOutId: 'L' })],
      { unitPrice: { mode: 'set', value: 16_000_000 } }
    )
    expect(summary.toUpdate.map((p) => p.id)).toEqual(['2', '3'])
    expect(summary.skippedByReason).toEqual({ sold: 1, on_loan: 1 })
    expect(summary.priceDelta).toBe(2_000_000)
    expect(describeBulkPriceSkips(summary.skippedByReason)).toBe('1 sold, 1 out on a stock loan')
  })
})

describe('grouping by name and product model', () => {
  it('matches regardless of case and spacing and keeps models apart', () => {
    const groups = groupItemsForBulkPrice([
      acura('1'),
      acura('2', { name: ' acura ', brand: 'mdx' }),
      acura('3', { brand: 'RDX' }),
    ])
    expect(groups.map((g) => [g.label, g.itemIds])).toEqual([
      ['Acura · MDX', ['1', '2']],
      ['Acura · RDX', ['3']],
    ])
    expect(bulkPriceGroupKey({ Name: 'Acura', model: 'MDX' })).toBe('acura|mdx')
  })

  it('treats empty-string lock fields as unlocked', () => {
    expect(bulkPriceLockReason({ dateOut: '', sellerLoanOutId: null })).toBeNull()
  })
})
