import { describe, it, expect } from 'vitest'
import {
 getInventoryItemField,
 getInventoryItemDisplayName,
 getFolderColorClass,
} from '~/composables/useInventoryItemDisplay'
import type { InventoryItem } from '~/stores/inventory'

function baseItem(overrides: Partial<InventoryItem> = {}): InventoryItem {
 return {
 id: 'item-id-12345678',
 folderId: 'f1',
 storeId: 's1',
 ...overrides,
 } as InventoryItem
}

describe('useInventoryItemDisplay', () => {
 it('getInventoryItemField resolves case-insensitive keys', () => {
 const item = baseItem({ Brand: 'Dell', model: 'XPS' } as Record<string, unknown>)
 expect(getInventoryItemField(item, 'brand')).toBe('Dell')
 expect(getInventoryItemField(item, 'MODEL')).toBe('XPS')
 })

 it('getInventoryItemDisplayName prefers brand and model', () => {
 const item = baseItem({ brand: 'Apple', model: 'MacBook' })
 expect(getInventoryItemDisplayName(item)).toBe('Apple MacBook')
 })

 it('getFolderColorClass falls back to gray', () => {
 expect(getFolderColorClass('blue')).toBe('bg-blue-500')
 expect(getFolderColorClass('unknown')).toBe('bg-gray-500')
 })
})
