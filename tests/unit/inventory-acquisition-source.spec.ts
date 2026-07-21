import { describe, expect, it } from 'vitest'
import {
  getInventorySourceBadge,
  inventorySourceBadgeForBuyback,
  inventorySourceBadgeForSwapIn,
} from '~/utils/inventory-acquisition-source'
import type { InventoryItem } from '~/stores/inventory'

const baseItem = {
  id: 'item-1',
  folderId: 'folder-1',
  storeId: 'store-1',
  createdAt: new Date(),
  createdBy: 'user-1',
} as InventoryItem

describe('getInventorySourceBadge', () => {
  it('returns swap-in badge with receipt number', () => {
    const badge = getInventorySourceBadge(
      { ...baseItem, swapIn: true, swapInReceiptId: 'r1' },
      { receiptNumber: 'RCPT-42' }
    )
    expect(badge?.source).toBe('swap_in')
    expect(badge?.label).toBe('Swap-in')
    expect(badge?.meta).toBe('RCPT-42')
  })

  it('returns buyback badge with paid amount', () => {
    const badge = getInventorySourceBadge(
      { ...baseItem, buyback: true, buybackId: 'bb-1', buybackPrice: 25000 },
      { formatPrice: (n) => `₦${n}` }
    )
    expect(badge?.source).toBe('buyback')
    expect(badge?.label).toBe('Buyback')
    expect(badge?.meta).toBe('₦25000')
  })

  it('prefers swap-in when both flags are set', () => {
    const badge = getInventorySourceBadge({
      ...baseItem,
      swapIn: true,
      buyback: true,
      buybackId: 'bb-1',
    })
    expect(badge?.source).toBe('swap_in')
  })

  it('returns null for regular stock', () => {
    expect(getInventorySourceBadge(baseItem)).toBeNull()
  })
})

describe('inventorySourceBadgeForSwapIn', () => {
  it('omits empty receipt meta', () => {
    expect(inventorySourceBadgeForSwapIn('  ').meta).toBeUndefined()
  })
})

describe('inventorySourceBadgeForBuyback', () => {
  it('supports paid label meta', () => {
    expect(inventorySourceBadgeForBuyback('₦1,000').meta).toBe('₦1,000')
  })
})
