import { describe, expect, it } from 'vitest'
import { collectLowStockRows, suggestedReorderQuantity } from '~/utils/low-stock-items'
import type { InventoryFolder, InventoryItem } from '~/stores/inventory'

describe('low-stock-items', () => {
  it('suggests at least 1 unit to reorder', () => {
    expect(suggestedReorderQuantity(2, 10)).toBeGreaterThanOrEqual(1)
  })

  it('collects pooled quantity rows below threshold', () => {
    const folder: InventoryFolder = {
      id: 'f1',
      name: 'Accessories',
      description: '',
      type: '',
      color: '#000',
      hasSerialNumbers: false,
      template: {
        id: 't1',
        name: 'Default',
        description: '',
        fields: [
          { id: 'name', name: 'name', label: 'Name', type: 'text', required: true },
          { id: 'qty', name: 'quantity', label: 'Quantity', type: 'number', required: true },
        ],
      },
      itemCount: 1,
      totalValue: 0,
      lowStockCount: 1,
      storeId: 's1',
      createdAt: new Date(),
      createdBy: 'u1',
    }
    const items: InventoryItem[] = [
      {
        id: 'i1',
        folderId: 'f1',
        name: 'USB-C cable',
        quantity: 3,
        storeId: 's1',
        createdAt: new Date(),
        createdBy: 'u1',
      } as InventoryItem,
    ]
    const rows = collectLowStockRows([folder], { f1: items }, 10)
    expect(rows).toHaveLength(1)
    expect(rows[0]?.productName).toBe('USB-C cable')
    expect(rows[0]?.suggestedReorderQty).toBeGreaterThan(0)
  })
})
