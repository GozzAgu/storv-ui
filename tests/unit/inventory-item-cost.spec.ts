import { describe, expect, it } from 'vitest'
import {
  getItemGrossProfit,
  getItemMarginPercent,
  getItemSellPrice,
  receiptGrossProfit,
  receiptLineCogs,
  resolveItemUnitCost,
  resolveReceiptLineUnitCost,
} from '~/utils/inventory-item-cost'
import type { InventoryItem } from '~/stores/inventory'
import type { Receipt } from '~/stores/receipts'

const baseItem = {
  id: 'i1',
  folderId: 'f1',
  storeId: 's1',
  createdAt: new Date(),
  createdBy: 'u1',
} as InventoryItem

describe('resolveItemUnitCost', () => {
  it('uses unitCost when set', () => {
    expect(resolveItemUnitCost({ ...baseItem, unitCost: 500, buybackPrice: 400 })).toBe(500)
  })

  it('falls back to buybackPrice for buyback items', () => {
    expect(resolveItemUnitCost({ ...baseItem, buyback: true, buybackPrice: 1200 })).toBe(1200)
  })
})

describe('getItemSellPrice', () => {
  it('prefers discounted price', () => {
    expect(getItemSellPrice({ ...baseItem, price: 1000, discountedPrice: 850 })).toBe(850)
  })
})

describe('getItemGrossProfit', () => {
  it('returns sell minus cost', () => {
    expect(getItemGrossProfit({ ...baseItem, price: 1000, unitCost: 650 })).toBe(350)
  })

  it('returns null without cost', () => {
    expect(getItemGrossProfit({ ...baseItem, price: 1000 })).toBeNull()
  })
})

describe('getItemMarginPercent', () => {
  it('computes margin from sell price', () => {
    expect(getItemMarginPercent({ ...baseItem, price: 200, unitCost: 150 })).toBe(25)
  })
})

describe('receipt profit', () => {
  const receipt: Receipt = {
    id: 'r1',
    receiptNumber: 'REC-1',
    customerName: 'A',
    customerEmail: 'a@b.com',
    date: new Date(),
    items: [
      { itemId: 'i1', quantity: 1, price: 1000, itemName: 'Phone', unitCost: 700 },
      { itemId: 'i2', quantity: 1, price: 500, itemName: 'Case' },
    ],
    itemsCount: 2,
    total: 1500,
    paymentMethod: 'cash',
    status: 'completed',
    folderId: 'f1',
    itemIds: ['i1', 'i2'],
    storeId: 's1',
    createdAt: new Date(),
    createdBy: 'u1',
  }

  it('sums line cogs with snapshot and lookup fallback', () => {
    expect(
      receiptLineCogs(receipt, (id) =>
        id === 'i2' ? ({ ...baseItem, id: 'i2', unitCost: 200 } as InventoryItem) : null
      )
    ).toBe(900)
  })

  it('computes gross profit', () => {
    expect(
      receiptGrossProfit(receipt, (id) =>
        id === 'i2' ? ({ ...baseItem, id: 'i2', unitCost: 200 } as InventoryItem) : null
      )
    ).toBe(600)
  })

  it('resolveReceiptLineUnitCost prefers line snapshot', () => {
    expect(
      resolveReceiptLineUnitCost(
        { itemId: 'i1', quantity: 1, price: 10, itemName: 'X', unitCost: 3 },
        { ...baseItem, unitCost: 99 }
      )
    ).toBe(3)
  })
})
