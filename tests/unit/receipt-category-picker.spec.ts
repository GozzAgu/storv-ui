import { describe, expect, it } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useInventoryStore, type InventoryFolder } from '~/stores/inventory'
import { useReceiptCategoryPicker } from '~/composables/useReceiptCategoryPicker'

function folder(id: string, name: string, parentId?: string | null): InventoryFolder {
  return {
    id,
    name,
    description: '',
    type: 'products',
    color: '#000',
    hasSerialNumbers: false,
    parentId: parentId ?? null,
    itemCount: parentId ? 2 : 0,
    totalValue: 0,
    lowStockCount: 0,
    storeId: 's1',
    createdAt: new Date(),
    createdBy: 'u1',
  }
}

describe('useReceiptCategoryPicker', () => {
  it('lists root categories first and subcategories on parent step', () => {
    setActivePinia(createPinia())
    const inventoryStore = useInventoryStore()
    inventoryStore.$patch({
      folders: [
        folder('toyota', 'Toyota'),
        folder('corolla', 'Corolla', 'toyota'),
        folder('chairs', 'Office Chairs'),
      ],
    })

    const picker = useReceiptCategoryPicker()
    expect(picker.parentCategoryRows.value.map((row) => row.folder.name)).toEqual([
      'Toyota',
      'Office Chairs',
    ])

    picker.onParentCategoryRowClick(picker.parentCategoryRows.value[0]!)
    expect(picker.selectedParentFolder.value?.name).toBe('Toyota')
    expect(picker.subcategoryFolders.value.map((f) => f.name)).toEqual(['Corolla'])
  })

  it('skips subcategory step for leaf root categories', () => {
    setActivePinia(createPinia())
    const inventoryStore = useInventoryStore()
    inventoryStore.$patch({
      folders: [folder('chairs', 'Office Chairs')],
    })

    const picker = useReceiptCategoryPicker()
    picker.onParentCategoryRowClick(picker.parentCategoryRows.value[0]!)
    expect(picker.nextStepFromParent()).toBe(2)
  })
})
