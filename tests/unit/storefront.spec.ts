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

  it('marks bulk items with zero quantity unavailable / unlist when listAvailableOnly', () => {
    const bulkFolder: InventoryFolder = {
      ...folder,
      hasSerialNumbers: false,
      template: {
        ...folder.template!,
        fields: [
          ...(folder.template!.fields ?? []),
          { id: 'q', name: 'quantity', label: 'Quantity', type: 'number', required: true },
        ],
      },
    }
    const outOfStock = { ...item, quantity: 0 }
    const listing = buildStorefrontListing({
      item: outOfStock,
      folder: bulkFolder,
      folders: [bulkFolder],
      config,
      ownerUid: 'u1',
    })
    expect(listing!.isListed).toBe(false)
    expect(listing!.availability).toBe('unavailable')

    const inStock = buildStorefrontListing({
      item: { ...item, quantity: 2 },
      folder: bulkFolder,
      folders: [bulkFolder],
      config,
      ownerUid: 'u1',
    })
    expect(inStock!.isListed).toBe(true)
    expect(inStock!.availability).toBe('available')
  })
})

describe('storefront-inquiry', () => {
  it('validates name, phone, type, and listing', async () => {
    const { validateInquiryPayload, isValidInquiryPhone, normalizeInquiryName } = await import(
      '~/utils/storefront-inquiry'
    )
    expect(normalizeInquiryName('  Ada  Lovelace ')).toBe('Ada Lovelace')
    expect(isValidInquiryPhone('+234 801 234 5678')).toBe(true)
    expect(isValidInquiryPhone('123')).toBe(false)

    expect(
      validateInquiryPayload({
        type: 'contact',
        customerName: 'A',
        customerPhone: '+2348012345678',
        listingId: 'i1',
      }).ok
    ).toBe(false)

    const ok = validateInquiryPayload({
      type: 'reserve',
      customerName: 'Ada',
      customerPhone: '+2348012345678',
      customerNote: 'Collect Saturday',
      listingId: 'item-1',
    })
    expect(ok.ok).toBe(true)
    if (ok.ok) {
      expect(ok.data.type).toBe('reserve')
      expect(ok.data.customerNote).toBe('Collect Saturday')
    }
  })
})

describe('storefront-media', () => {
  it('builds stable palettes without images', async () => {
    const { storefrontPlaceholderPalette } = await import('~/utils/storefront-media')
    const a = storefrontPlaceholderPalette('item-1::Opulent Dubai')
    const b = storefrontPlaceholderPalette('item-1::Opulent Dubai')
    const c = storefrontPlaceholderPalette('item-2::Rage Red Intense')
    expect(a).toEqual(b)
    expect(a.from).not.toBe(c.from)
  })

  it('prefers subcategory (leaf) over parent category path', async () => {
    const { storefrontCategoryLabel } = await import('~/utils/storefront-media')
    expect(storefrontCategoryLabel('Eau de Parfum', 'Fragrance / Eau de Parfum')).toBe(
      'Eau de Parfum'
    )
    expect(storefrontCategoryLabel('', 'Fragrance / Eau de Parfum')).toBe('Eau de Parfum')
    expect(storefrontCategoryLabel('Fragrance', 'Fragrance')).toBe('Fragrance')
    expect(storefrontCategoryLabel(null, null)).toBe('')
  })
})

describe('storefront-share', () => {
  it('applies UTM params and builds share copy', async () => {
    const {
      withStorefrontUtm,
      buildStorefrontShareMessage,
      isLinkPreviewBot,
      storefrontAbsoluteUrl,
    } = await import('~/utils/storefront-share')

    expect(withStorefrontUtm('/store/demo', { source: 'whatsapp', medium: 'social' })).toBe(
      '/store/demo?utm_source=whatsapp&utm_medium=social'
    )
    expect(
      storefrontAbsoluteUrl('https://storvv.com', '/store/demo', { source: 'qr' })
    ).toBe('https://storvv.com/store/demo?utm_source=qr')

    expect(
      buildStorefrontShareMessage({
        storeName: 'Lagos Gadgets',
        productTitle: 'iPhone 13',
        priceLabel: '₦450,000',
        url: 'https://storvv.com/store/demo/p/1',
      })
    ).toContain('iPhone 13')

    expect(isLinkPreviewBot('facebookexternalhit/1.1')).toBe(true)
    expect(isLinkPreviewBot('Mozilla/5.0 Chrome')).toBe(false)
  })
})

describe('payment-link-create helpers', () => {
  it('resolves sell price and name from inventory maps', async () => {
    const {
      resolvePaymentLinkItemName,
      resolvePaymentLinkItemPrice,
    } = await import('~/server/utils/payment-link-create')

    expect(resolvePaymentLinkItemPrice({ price: 120000 })).toBe(120000)
    expect(resolvePaymentLinkItemPrice({ Price: '99.5' })).toBe(99.5)
    expect(resolvePaymentLinkItemPrice({})).toBe(0)
    expect(resolvePaymentLinkItemName({ name: 'Rose EDT' })).toBe('Rose EDT')
    expect(resolvePaymentLinkItemName({})).toBe('Item')
  })
})

describe('storefront inquiry fulfill helpers', () => {
  it('builds SF receipt numbers', async () => {
    const { makeStorefrontInquiryReceiptNumber } = await import(
      '~/server/utils/storefront-inquiry-fulfill'
    )
    const n = makeStorefrontInquiryReceiptNumber()
    expect(n).toMatch(/^SF-[A-Z0-9]+$/)
    expect(n.length).toBeGreaterThan(5)
  })
})

describe('storefront receipt attribution', () => {
  it('detects storefront-sourced sales', async () => {
    const { isStorefrontSourcedReceipt } = await import('~/utils/storefront-receipt')
    expect(isStorefrontSourcedReceipt({ source: 'storefront' })).toBe(true)
    expect(isStorefrontSourcedReceipt({ source: 'storefront_inquiry' })).toBe(true)
    expect(isStorefrontSourcedReceipt({ paymentMethod: 'Storefront' })).toBe(true)
    expect(isStorefrontSourcedReceipt({ source: 'payment_link', paymentMethod: 'Paystack' })).toBe(
      false
    )
  })
})
