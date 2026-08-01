import { describe, expect, it } from 'vitest'
import { createDemoSeedState } from '~/utils/demo-seed'
import { DEMO_STORE_LAGOS } from '~/utils/demo-mode'
import { getChildFolders, getRootFolders } from '~/utils/inventory-folder-tree'
import type { InventoryFolder } from '~/stores/inventory'

describe('demo-seed', () => {
  it('seeds Lagos with Phones parent hub and Smartphones subcategory', () => {
    const state = createDemoSeedState()
    expect(state.version).toBe(5)

    const lagos = state.stores.find((s) => s.id === DEMO_STORE_LAGOS)!
    const phones = lagos.folders.find((f) => f.id === 'folder_lagos_phones')!
    const smartphones = lagos.folders.find((f) => f.id === 'folder_lagos_smartphones')!

    expect(phones.parentId ?? null).toBeNull()
    expect(smartphones.parentId).toBe(phones.id)

    const phoneItems = lagos.items.filter((i) => i.folderId === phones.id)
    expect(phoneItems).toHaveLength(0)

    const smartphoneItems = lagos.items.filter((i) => i.folderId === smartphones.id)
    expect(smartphoneItems.length).toBeGreaterThan(0)

    const foldersAsInventory: InventoryFolder[] = lagos.folders.map((f) => ({
      id: f.id,
      name: f.name,
      description: '',
      type: 'products',
      color: '#143f8d',
      hasSerialNumbers: false,
      parentId: f.parentId ?? null,
      itemCount: lagos.items.filter((i) => i.folderId === f.id).length,
      totalValue: 0,
      lowStockCount: 0,
      storeId: lagos.id,
      createdAt: new Date(),
      createdBy: 'demo',
    }))

    const roots = getRootFolders(foldersAsInventory)
    expect(roots.some((f) => f.id === phones.id)).toBe(true)
    expect(roots.some((f) => f.id === smartphones.id)).toBe(false)

    const children = getChildFolders(foldersAsInventory, phones.id)
    expect(children).toHaveLength(1)
    expect(children[0]?.id).toBe(smartphones.id)
  })
})
