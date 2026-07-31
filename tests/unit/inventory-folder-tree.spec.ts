import { describe, expect, it } from 'vitest'
import type { InventoryFolder } from '~/stores/inventory'
import {
  buildFolderDisplayRows,
  getLeafFolders,
  getRootFolders,
  inheritableFolderSettingsChanged,
  pickInheritableFolderUpdates,
  validateFolderParentId,
} from '~/utils/inventory-folder-tree'

function folder(id: string, name: string, parentId?: string | null): InventoryFolder {
  return {
    id,
    name,
    parentId: parentId ?? null,
    description: '',
    color: '#000',
    hasSerialNumbers: false,
    itemCount: 0,
    totalValue: 0,
    lowStockCount: 0,
    storeId: 'store-1',
    createdAt: new Date(),
    createdBy: 'user-1',
  }
}

describe('inventory-folder-tree', () => {
  const folders = [
    folder('phones', 'Phones'),
    folder('iphone', 'iPhone', 'phones'),
    folder('samsung', 'Samsung', 'phones'),
    folder('chairs', 'Chairs'),
  ]

  it('returns roots and leaf folders', () => {
    expect(getRootFolders(folders).map((entry) => entry.name)).toEqual(['Phones', 'Chairs'])
    expect(getLeafFolders(folders).map((entry) => entry.name)).toEqual([
      'iPhone',
      'Samsung',
      'Chairs',
    ])
  })

  it('builds nested display rows', () => {
    expect(buildFolderDisplayRows(folders).map((row) => [row.depth, row.folder.name])).toEqual([
      [0, 'Phones'],
      [1, 'iPhone'],
      [1, 'Samsung'],
      [0, 'Chairs'],
    ])
  })

  it('rejects nested parents beyond one level', () => {
    const nested = [...folders, folder('pro', 'Pro Max', 'iphone')]
    expect(() => validateFolderParentId(nested, 'iphone')).toThrow(
      'Subcategories cannot be nested further'
    )
  })

  it('rejects subcategories when parent already has products', () => {
    const withProducts = folders.map((entry) =>
      entry.id === 'phones' ? { ...entry, itemCount: 3 } : entry
    )
    expect(() => validateFolderParentId(withProducts, 'phones')).toThrow(
      'already has products'
    )
  })

  it('detects inheritable folder setting changes', () => {
    const parent = {
      ...folder('phones', 'Phones'),
      type: 'general',
      hasSerialNumbers: false,
      trackProfit: false,
      template: {
        id: 'custom',
        name: 'Custom Template',
        description: '',
        fields: [
          {
            id: '1',
            name: 'name',
            label: 'Name',
            type: 'text' as const,
            required: true,
          },
        ],
      },
      allowedDepartments: ['dept-a'],
    }

    const unchanged = pickInheritableFolderUpdates({
      type: 'general',
      color: '#000',
      hasSerialNumbers: false,
      trackProfit: false,
      template: parent.template!,
      allowedDepartments: ['dept-a'],
    })
    expect(inheritableFolderSettingsChanged(parent, unchanged)).toBe(false)

    expect(
      inheritableFolderSettingsChanged(parent, {
        ...unchanged,
        hasSerialNumbers: true,
      })
    ).toBe(true)
  })
})
