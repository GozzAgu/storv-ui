import { describe, expect, it } from 'vitest'
import {
  canAllowlistStorefrontField,
  filterAllowlistedFieldIds,
  isHardDeniedStorefrontField,
  suggestDefaultPublicFieldIds,
} from '~/utils/storefront-fields'
import { isValidStorefrontSlug, slugifyStorefrontName } from '~/utils/storefront-slug'
import { buildStorefrontListing } from '~/utils/storefront-projection'
import type { InventoryFolder, InventoryItem } from '~/stores/inventory'
import type { StorefrontConfig } from '~/types/storefront'

describe('storefront-fields', () => {
  it('denies cost, serial, supplier, and notes fields', () => {
    expect(isHardDeniedStorefrontField('unitCost')).toBe(true)
    expect(isHardDeniedStorefrontField('serialNo')).toBe(true)
    expect(isHardDeniedStorefrontField('imei')).toBe(true)
    expect(isHardDeniedStorefrontField('supplier')).toBe(true)
    expect(isHardDeniedStorefrontField('notes', 'Internal notes')).toBe(true)
    expect(canAllowlistStorefrontField('color', 'Colour')).toBe(true)
    expect(canAllowlistStorefrontField('grade', 'Grade')).toBe(true)
    expect(canAllowlistStorefrontField('name', 'Product')).toBe(false)
    expect(canAllowlistStorefrontField('price', 'Price')).toBe(false)
  })

  it('filters allowlisted ids against denylist', () => {
    const fields = [
      { id: 'a', name: 'color', label: 'Colour' },
      { id: 'b', name: 'unitCost', label: 'Cost' },
      { id: 'c', name: 'serialNo', label: 'IMEI' },
    ]
    expect(filterAllowlistedFieldIds(['a', 'b', 'c'], fields)).toEqual(['a'])
  })

  it('suggests common retail fields', () => {
    const fields = [
      { id: '1', name: 'color', label: 'Colour' },
      { id: '2', name: 'supplier', label: 'Supplier' },
      { id: '3', name: 'grade', label: 'Grade' },
    ]
    expect(suggestDefaultPublicFieldIds(fields)).toEqual(['1', '3'])
  })
})

describe('storefront-slug', () => {
  it('slugifies and validates', () => {
    expect(slugifyStorefrontName('Lagos Gadget Hub!')).toBe('lagos-gadget-hub')
    expect(isValidStorefrontSlug('lagos-gadget-hub')).toBe(true)
    expect(isValidStorefrontSlug('Dashboard')).toBe(false)
    expect(isValidStorefrontSlug('a')).toBe(false)
  })
})

describe('storefront-projection', () => {
  const folder: InventoryFolder = {
    id: 'f1',
    name: 'Phones',
    description: '',
    color: '#000',
    hasSerialNumbers: true,
    itemCount: 1,
    totalValue: 0,
    lowStockCount: 0,
    storeId: 's1',
    createdAt: new Date(),
    createdBy: 'u1',
    template: {
      id: 't1',
      name: 'Phones',
      description: '',
      fields: [
        { id: 'n', name: 'name', label: 'Product', type: 'text', required: true },
        { id: 'p', name: 'price', label: 'Price', type: 'currency', required: true },
        { id: 'c', name: 'color', label: 'Colour', type: 'text', required: false },
        { id: 'cost', name: 'unitCost', label: 'Cost', type: 'currency', required: false },
        { id: 'ser', name: 'serialNo', label: 'IMEI', type: 'text', required: false },
      ],
    },
  }

  const item: InventoryItem = {
    id: 'i1',
    folderId: 'f1',
    storeId: 's1',
    name: 'iPhone 13',
    price: 450000,
    color: 'Blue',
    unitCost: 300000,
    serialNo: '356789',
    createdAt: new Date(),
    createdBy: 'u1',
  }

  const config: StorefrontConfig = {
    enabled: true,
    slug: 'demo-shop',
    displayName: 'Demo Shop',
    listAvailableOnly: true,
    folderPublish: {
      f1: { enabled: true, publicFieldIds: ['c', 'cost', 'ser'] },
    },
    itemOverrides: {},
  }

  it('projects only allowlisted safe attributes', () => {
    const listing = buildStorefrontListing({
      item,
      folder,
      folders: [folder],
      config,
      ownerUid: 'u1',
    })
    expect(listing).toBeTruthy()
    expect(listing!.title).toBe('iPhone 13')
    expect(listing!.price).toBe(450000)
    expect(listing!.availability).toBe('available')
    expect(listing!.attributes.map((a) => a.key)).toEqual(['color'])
    expect(JSON.stringify(listing)).not.toContain('300000')
    expect(JSON.stringify(listing)).not.toContain('356789')
  })

  it('marks sold items unavailable / unlist when listAvailableOnly', () => {
    const sold = { ...item, dateOut: new Date().toISOString() }
    const listing = buildStorefrontListing({
      item: sold,
      folder,
      folders: [folder],
      config,
      ownerUid: 'u1',
    })
    expect(listing!.isListed).toBe(false)
    expect(listing!.availability).toBe('unavailable')
  })
})
