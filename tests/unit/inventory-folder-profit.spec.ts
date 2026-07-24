import { describe, expect, it } from 'vitest'
import type { InventoryFolder, InventoryItem } from '~/stores/inventory'
import {
  computeFolderGrossProfitOnHand,
  createCostPriceTemplateField,
  ensureCostPriceTemplateField,
  removeCostPriceTemplateField,
  sumFolderGrossProfitOnHand,
  templateHasCostPriceField,
} from '~/utils/inventory-folder-profit'

const baseFolder: InventoryFolder = {
  id: 'f1',
  name: 'Chairs',
  description: '',
  color: '#000',
  hasSerialNumbers: false,
  storeId: 's1',
  itemCount: 0,
  totalValue: 0,
  lowStockCount: 0,
  createdAt: new Date(),
  createdBy: 'u1',
  trackProfit: true,
  template: {
    id: 'custom',
    name: 'Custom',
    description: '',
    fields: [
      { id: '1', name: 'name', label: 'Product', type: 'text', required: true },
      { id: '2', name: 'price', label: 'Unit price', type: 'currency', required: false },
      { id: '3', name: 'quantity', label: 'Quantity', type: 'number', required: true },
      { id: '4', name: 'unitCost', label: 'Cost price', type: 'currency', required: false },
    ],
  },
}

const baseItem: InventoryItem = {
  id: 'i1',
  folderId: 'f1',
  storeId: 's1',
  name: 'Chair',
  price: 10000,
  quantity: 5,
  unitCost: 7000,
  createdAt: new Date(),
  createdBy: 'u1',
}

describe('inventory-folder-profit template helpers', () => {
  it('adds and removes cost price template field', () => {
    const fields = [
      { id: '1', name: 'name', label: 'Product', type: 'text' as const, required: true },
    ]
    expect(templateHasCostPriceField(fields)).toBe(false)
    ensureCostPriceTemplateField(fields)
    expect(templateHasCostPriceField(fields)).toBe(true)
    expect(fields.some((f) => f.name === 'unitCost')).toBe(true)
    const trimmed = removeCostPriceTemplateField(fields)
    expect(trimmed.some((f) => f.name === 'unitCost')).toBe(false)
  })

  it('creates a locked cost price field definition', () => {
    const field = createCostPriceTemplateField()
    expect(field.name).toBe('unitCost')
    expect(field.label).toBe('Cost price')
    expect(field.type).toBe('currency')
  })
})

describe('computeFolderGrossProfitOnHand', () => {
  it('returns null when folder does not track profit', () => {
    expect(
      computeFolderGrossProfitOnHand([baseItem], { ...baseFolder, trackProfit: false })
    ).toBeNull()
  })

  it('sums gross profit on available units with cost recorded', () => {
    const stats = computeFolderGrossProfitOnHand([baseItem], baseFolder)
    expect(stats).toEqual({ grossProfitOnHand: 15000, unitsWithCost: 5 })
  })

  it('ignores sold units', () => {
    const sold = { ...baseItem, id: 'i2', dateOut: new Date(), quantity: 2 }
    const available = { ...baseItem, id: 'i3', quantity: 3 }
    const stats = computeFolderGrossProfitOnHand([sold, available], baseFolder)
    expect(stats?.grossProfitOnHand).toBe(9000)
    expect(stats?.unitsWithCost).toBe(3)
  })

  it('skips items without unit cost', () => {
    const noCost = { ...baseItem, unitCost: undefined }
    const stats = computeFolderGrossProfitOnHand([noCost], baseFolder)
    expect(stats).toEqual({ grossProfitOnHand: 0, unitsWithCost: 0 })
  })
})

describe('sumFolderGrossProfitOnHand', () => {
  it('aggregates folder profit map', () => {
    expect(
      sumFolderGrossProfitOnHand({
        f1: { grossProfitOnHand: 100, unitsWithCost: 1 },
        f2: { grossProfitOnHand: 250, unitsWithCost: 2 },
      })
    ).toBe(350)
  })
})
