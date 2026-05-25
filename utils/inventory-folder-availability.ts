import type { InventoryFolder, InventoryItem } from '~/stores/inventory'
import {
 isItemAwaitingPayment,
 isItemOnStockLoan,
 isItemSold,
} from '~/utils/inventory-availability'

export interface FolderAvailabilityStats {
 available: number
 sold: number
 onLoan: number
 awaitingPayment: number
 total: number
}

export function folderAvailabilityPercent(stats: FolderAvailabilityStats): number {
 if (stats.total <= 0) return 0
 return Math.round((stats.available / stats.total) * 100)
}

function quantityFieldName(folder: Pick<InventoryFolder, 'template'>): string | undefined {
 return folder.template?.fields?.find((f) => {
 const n = f.name.toLowerCase()
 return n === 'quantity' || n === 'qty' || n === 'stock'
 })?.name
}

const BULK_QUANTITY_KEYS = ['quantity', 'Quantity', 'qty', 'Qty', 'stock', 'Stock'] as const

function readQuantityValue(item: InventoryItem, key: string): number {
 const raw = item[key]
 const n = typeof raw === 'number' ? raw : parseFloat(String(raw ?? ''))
 return Number.isFinite(n) && n > 0 ? n : 0
}

function unitsForItem(
 item: InventoryItem,
 hasSerialNumbers: boolean,
 quantityField?: string
): number {
 if (hasSerialNumbers) return 1
 const keys = quantityField
 ? [quantityField, ...BULK_QUANTITY_KEYS.filter((k) => k !== quantityField)]
 : [...BULK_QUANTITY_KEYS]
 for (const key of keys) {
 const n = readQuantityValue(item, key)
 if (n > 0) return n
 }
 return 0
}

/** Count units by availability: available, sold, on stock loan, or awaiting payment. */
export function computeFolderAvailabilityStats(
 items: InventoryItem[],
 folder: Pick<InventoryFolder, 'hasSerialNumbers' | 'template'>
): FolderAvailabilityStats {
 const stats: FolderAvailabilityStats = {
 available: 0,
 sold: 0,
 onLoan: 0,
 awaitingPayment: 0,
 total: 0,
 }

 const qtyField = quantityFieldName(folder)

 for (const item of items) {
 const units = unitsForItem(item, folder.hasSerialNumbers, qtyField)
 if (units <= 0) continue

 stats.total += units

 if (isItemSold(item)) {
 stats.sold += units
 } else if (isItemOnStockLoan(item)) {
 stats.onLoan += units
 } else if (isItemAwaitingPayment(item)) {
 stats.awaitingPayment += units
 } else {
 stats.available += units
 }
 }

 return stats
}
