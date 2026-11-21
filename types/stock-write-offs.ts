/**
 * Stock write-offs: damaged, lost, expired or otherwise unsellable stock recorded as a loss at
 * cost. Stored at `users/{ownerId}/stores/{storeId}/stockWriteOffs/{id}`, written only by the
 * server (server/utils/stock-write-offs.ts) in the same transaction as the stock change.
 */

export type WriteOffReason =
  | 'damaged'
  | 'lost_stolen'
  | 'expired'
  | 'customer_damage'
  | 'supplier_rejected'
  | 'other'

/** Where it was written off from. */
export type WriteOffSource = 'inventory' | 'inspection' | 'supplier_return'

export const WRITE_OFF_REASON_LABELS: Record<WriteOffReason, string> = {
  damaged: 'Damaged in store',
  lost_stolen: 'Lost or stolen',
  expired: 'Expired or obsolete',
  customer_damage: 'Damaged by customer',
  supplier_rejected: 'Supplier rejected the claim',
  other: 'Other',
}

export const WRITE_OFF_SOURCE_LABELS: Record<WriteOffSource, string> = {
  inventory: 'Inventory',
  inspection: 'Customer return',
  supplier_return: 'Rejected supplier return',
}

export interface StockWriteOff {
  id: string
  storeId: string
  source: WriteOffSource
  reason: WriteOffReason
  note: string
  quantity: number
  /** Unit cost × quantity; null when the item has no cost recorded. */
  costValue: number | null
  item: {
    inventoryItemId: string
    folderId: string
    folderName: string
    name: string
    details: Record<string, string | number | boolean>
    serial: boolean
    unitCost: number | null
  }
  customerReturn: { receiptNumber: string; customerName: string; complaint: string } | null
  supplierReturn: { returnId: string; supplierName: string; defect: string } | null
  createdAt: string | null
  createdByName: string
}

/** Body for POST /api/write-offs/create. */
export type CreateWriteOffBody =
  | { source: 'inventory'; itemId: string; quantity: number; reason: WriteOffReason; note?: string }
  | { source: 'inspection'; holdId: string; reason: WriteOffReason; note?: string }
  | { source: 'supplier_return'; returnId: string; reason: WriteOffReason; note?: string }
