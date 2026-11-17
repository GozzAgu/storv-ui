import { describe, expect, it } from 'vitest'
import { canBulkEditPrices, parseBulkPriceRequest } from '~/server/utils/inventory/bulk-price'
import { BULK_PRICE_MAX_ITEMS } from '~/utils/inventory-bulk-price'
import { EMPTY_STAFF_PERMISSIONS, FULL_STAFF_PERMISSIONS } from '~/utils/staff-permissions'

const statusOf = (fn: () => unknown) => {
  try {
    fn()
  } catch (e) {
    return { status: (e as { statusCode?: number }).statusCode, message: (e as Error).message }
  }
  return null
}

describe('canBulkEditPrices', () => {
  it('allows the owner and products.edit holders only', () => {
    expect(canBulkEditPrices({ isOwner: true, permissions: EMPTY_STAFF_PERMISSIONS })).toBe(true)
    expect(canBulkEditPrices({ isOwner: false, permissions: FULL_STAFF_PERMISSIONS })).toBe(true)
    expect(canBulkEditPrices({ isOwner: false, permissions: EMPTY_STAFF_PERMISSIONS })).toBe(false)
    expect(
      canBulkEditPrices({
        isOwner: false,
        permissions: {
          ...FULL_STAFF_PERMISSIONS,
          products: { view: true, create: true, edit: false, delete: true },
        },
      })
    ).toBe(false)
  })
})

describe('parseBulkPriceRequest', () => {
  const base = { folderId: 'acura', itemIds: ['a', 'b', 'a'], unitPrice: { mode: 'set', value: 5 } }

  it('dedupes item ids and parses the change', () => {
    expect(parseBulkPriceRequest(base)).toEqual({
      folderId: 'acura',
      itemIds: ['a', 'b'],
      change: { unitPrice: { mode: 'set', value: 5 } },
    })
  })

  it('parses per-item prices from an import', () => {
    const req = parseBulkPriceRequest({
      folderId: 'acura',
      updates: [
        { itemId: 'a', unitPrice: 16_000_000 },
        { itemId: 'b', costPrice: 9_000_000 },
      ],
    })
    expect(req.itemIds).toEqual(['a', 'b'])
    expect(req.change).toBeUndefined()
    expect(req.perItem?.get('a')).toEqual({ unitPrice: { mode: 'set', value: 16_000_000 } })
    expect(req.perItem?.get('b')).toEqual({ costPrice: { mode: 'set', value: 9_000_000 } })
  })

  it('refuses mixed, repeated or empty per-item updates', () => {
    const one = [{ itemId: 'a', unitPrice: 1 }]
    expect(
      statusOf(() => parseBulkPriceRequest({ folderId: 'f', updates: one, itemIds: ['a'] }))?.status
    ).toBe(400)
    expect(
      statusOf(() => parseBulkPriceRequest({ folderId: 'f', updates: [...one, ...one] }))?.status
    ).toBe(400)
    expect(
      statusOf(() => parseBulkPriceRequest({ folderId: 'f', updates: [{ itemId: 'a' }] }))?.status
    ).toBe(400)
    expect(
      statusOf(() =>
        parseBulkPriceRequest({ folderId: 'f', updates: [{ itemId: 'a', unitPrice: 0 }] })
      )?.status
    ).toBe(400)
  })

  it('answers 400 for bad ids, empty or oversized selections and bad prices', () => {
    expect(statusOf(() => parseBulkPriceRequest({ ...base, folderId: '../x' }))?.status).toBe(400)
    expect(statusOf(() => parseBulkPriceRequest({ ...base, itemIds: [] }))?.status).toBe(400)
    expect(
      statusOf(() => parseBulkPriceRequest({ ...base, itemIds: ['ok', 'b/ad'] }))?.status
    ).toBe(400)
    const tooMany = Array.from({ length: BULK_PRICE_MAX_ITEMS + 1 }, (_, i) => `i${i}`)
    expect(statusOf(() => parseBulkPriceRequest({ ...base, itemIds: tooMany }))?.status).toBe(400)
    const badPrice = statusOf(() =>
      parseBulkPriceRequest({ ...base, unitPrice: { mode: 'set', value: 0 } })
    )
    expect(badPrice).toEqual({ status: 400, message: 'Unit price must be more than 0' })
  })
})
