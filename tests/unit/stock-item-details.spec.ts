import { describe, expect, it } from 'vitest'
import {
  groupedItemNames,
  snapshotStockItemDetails,
  stockItemDetailChips,
} from '~/utils/stock-item-details'
import type { InventoryItem } from '~/stores/inventory'

const phone = {
  id: 'i1',
  folderId: 'f1',
  name: 'iPhone 13',
  serialNo: 'SN123',
  imei: '3591',
  brand: 'Apple',
  model: 'iPhone 13',
  color: 'Black',
  storage: '128GB',
  condition: 'UK used',
  price: 450000,
  costPrice: 380000,
  unitCost: 380000,
  quantity: 1,
  sellerLoanOutId: 'loan1',
  pendingSaleReceiptId: 'r1',
} as unknown as InventoryItem

describe('snapshotStockItemDetails', () => {
  it('keeps identifying details and never money or bookkeeping', () => {
    const details = snapshotStockItemDetails(phone)
    expect(details).toMatchObject({
      serialNo: 'SN123',
      imei: '3591',
      brand: 'Apple',
      color: 'Black',
      condition: 'UK used',
    })
    for (const key of [
      'price',
      'costPrice',
      'unitCost',
      'quantity',
      'name',
      'sellerLoanOutId',
      'pendingSaleReceiptId',
    ]) {
      expect(details).not.toHaveProperty(key)
    }
  })

  it('keeps identifiers first when the budget is tight', () => {
    const details = snapshotStockItemDetails(phone, { maxKeys: 2 })
    expect(Object.keys(details)).toEqual(['serialNo', 'imei'])
  })
})

describe('stockItemDetailChips', () => {
  it('labels and orders details, and filters money from old snapshots', () => {
    const chips = stockItemDetailChips({ color: 'Black', serialNo: 'SN1', sellingPrice: 10 })
    expect(chips.map((c) => `${c.label}: ${c.value}`)).toEqual(['SN: SN1', 'Color: Black'])
  })
})

describe('groupedItemNames', () => {
  it('lists every name and folds repeats into a count', () => {
    expect(
      groupedItemNames([
        { name: 'iPhone 13', quantity: 1 },
        { name: 'iPhone 13', quantity: 2 },
        { name: 'Galaxy S22' },
        'Pixel 8',
      ])
    ).toBe('iPhone 13 × 3, Galaxy S22, Pixel 8')
  })
})
