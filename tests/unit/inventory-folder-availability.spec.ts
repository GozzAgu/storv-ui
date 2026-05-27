import { describe, expect, it } from 'vitest'
import type { InventoryFolder, InventoryItem } from '~/stores/inventory'
import {
 computeFolderAvailabilityStats,
 computeFolderTotalValue,
 folderAvailabilityPercent,
 readInventoryUnitPrice,
} from '~/utils/inventory-folder-availability'

const serialFolder: Pick<InventoryFolder, 'hasSerialNumbers' | 'template'> = {
 hasSerialNumbers: true,
}

function item(partial: Partial<InventoryItem>): InventoryItem {
 return {
 id: partial.id ?? 'i1',
 folderId: 'f1',
 storeId: 's1',
 createdAt: new Date(),
 createdBy: 'u1',
 ...partial,
 } as InventoryItem
}

describe('inventory-folder-availability', () => {
 it('percent reflects available units vs sold and on loan', () => {
 const stats = computeFolderAvailabilityStats(
 [
 item({ id: 'a' }),
 item({ id: 'b', dateOut: new Date() }),
 item({ id: 'c', sellerLoanOutId: 'loan-1' }),
 item({ id: 'd', pendingSaleReceiptId: 'rec-1' }),
 ],
 serialFolder
 )
 expect(stats).toEqual({
 available: 1,
 sold: 1,
 onLoan: 1,
 awaitingPayment: 1,
 total: 4,
 })
 expect(folderAvailabilityPercent(stats)).toBe(25)
 })

 it('counts bulk quantity on quantity field', () => {
 const bulkFolder: Pick<InventoryFolder, 'hasSerialNumbers' | 'template'> = {
 hasSerialNumbers: false,
 template: {
 id: 't1',
 name: 'T',
 description: '',
 fields: [{ id: 'q', name: 'quantity', label: 'Qty', type: 'number', required: true }],
 },
 }
 const stats = computeFolderAvailabilityStats(
 [item({ id: 'b1', quantity: 10, dateOut: new Date() }), item({ id: 'b2', quantity: 6 })],
 bulkFolder
 )
 expect(stats.available).toBe(6)
 expect(stats.sold).toBe(10)
 expect(stats.total).toBe(16)
 expect(folderAvailabilityPercent(stats)).toBe(38)
 })

 it('sums available units × unit price for total value', () => {
 const bulkFolder: Pick<InventoryFolder, 'hasSerialNumbers' | 'template'> = {
 hasSerialNumbers: false,
 template: {
 id: 't1',
 name: 'T',
 description: '',
 fields: [{ id: 'q', name: 'quantity', label: 'Qty', type: 'number', required: true }],
 },
 }
 const bulkItem = item({
 id: 'b1',
 price: 100,
 quantity: 5,
 discountedPrice: 80,
 })
 expect(readInventoryUnitPrice(bulkItem)).toBe(80)
 const value = computeFolderTotalValue(
 [bulkItem, item({ id: 'b2', price: 50, quantity: 2, dateOut: new Date() })],
 bulkFolder
 )
 expect(value).toBe(400)
 })
})
