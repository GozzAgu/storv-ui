import { describe, expect, it } from 'vitest'
import type { InventoryFolder } from '~/stores/inventory'
import {
  expandFolderTemplatesToCopy,
  buildFolderDisplayRows,
  folderShowsSubcategoryHub,
  folderUsesSubcategoryHub,
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

  it('treats subcategory hubs as non-leaf only when opted in or populated', () => {
    const parentOnly = folder('vehicles', 'Vehicles', null)
    parentOnly.usesSubcategories = true
    const withHub = [...folders, parentOnly]
    expect(folderUsesSubcategoryHub(parentOnly, withHub)).toBe(true)
    expect(folderShowsSubcategoryHub(parentOnly, withHub)).toBe(true)
    expect(getLeafFolders(withHub).some((entry) => entry.id === parentOnly.id)).toBe(false)

    const flatParent = folder('supplies', 'Supplies', null)
    expect(folderUsesSubcategoryHub(flatParent, [flatParent])).toBe(false)
    expect(getLeafFolders([flatParent]).map((entry) => entry.name)).toEqual(['Supplies'])
  })

  it('builds nested display rows', () => {
    expect(buildFolderDisplayRows(folders).map((row) => [row.depth, row.folder.name])).toEqual([
      [0, 'Phones'],
      [1, 'iPhone'],
      [1, 'Samsung'],
      [0, 'Chairs'],
    ])
  })

  it('expands folder copy selection with parents and optional subfolders', () => {
    const selectedChild = expandFolderTemplatesToCopy(folders, ['iphone'], false).map(
      (entry) => entry.name
    )
    expect(selectedChild.sort()).toEqual(['Phones', 'iPhone'])

    const withSubfolders = expandFolderTemplatesToCopy(folders, ['iphone'], true).map(
      (entry) => entry.name
    )
    expect(withSubfolders.sort()).toEqual(['Phones', 'Samsung', 'iPhone'].sort())

    const selectedRoot = expandFolderTemplatesToCopy(folders, ['phones'], false).map(
      (entry) => entry.name
    )
    expect(selectedRoot).toEqual(['Phones'])

    const rootWithChildren = expandFolderTemplatesToCopy(folders, ['phones'], true).map(
      (entry) => entry.name
    )
    expect(rootWithChildren.sort()).toEqual(['Phones', 'Samsung', 'iPhone'].sort())
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
