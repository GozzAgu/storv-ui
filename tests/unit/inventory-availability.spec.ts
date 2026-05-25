import { describe, it, expect } from 'vitest'
import {
 isItemAwaitingPayment,
 availabilityBadgeForAwaitingPayment,
} from '~/utils/inventory-availability'
import type { InventoryItem } from '~/stores/inventory'

function item(partial: Partial<InventoryItem>): InventoryItem {
 return {
 id: 'i1',
 folderId: 'f1',
 storeId: 's1',
 createdAt: new Date(),
 createdBy: 'u1',
 ...partial,
 } as InventoryItem
}

describe('inventory-availability', () => {
 it('detects awaiting payment when reserved and not sold', () => {
 expect(
 isItemAwaitingPayment(
 item({ pendingSaleReceiptId: 'rec-1' })
 )
 ).toBe(true)
 expect(
 isItemAwaitingPayment(
 item({ pendingSaleReceiptId: 'rec-1', dateOut: new Date() })
 )
 ).toBe(false)
 })

 it('badge keeps receipt number in meta, not label', () => {
 const badge = availabilityBadgeForAwaitingPayment('REC-123')
 expect(badge.label).toBe('Awaiting payment')
 expect(badge.meta).toBe('REC-123')
 expect(badge.status).toBe('awaiting_payment')
 })
})
