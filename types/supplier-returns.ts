/**
 * Supplier returns: defective stock going back to the supplier it was bought from.
 *
 * Logged from inventory for stock that came in defective (or turned out faulty before it sold).
 * Customer returns are separate: they are refunds on a sale and go back into stock.
 *
 * Stored at `users/{ownerId}/stores/{storeId}/supplierReturns/{returnId}` and written only by the
 * server (server/utils/supplier-returns.ts). A return keeps a snapshot of the item and of where it
 * came from, because logging it takes the unit out of stock.
 */

export type SupplierReturnStatus = 'ready' | 'with_supplier' | 'resolved' | 'rejected'

export type SupplierReturnOutcome = 'refund' | 'replacement' | 'credit_note' | 'repaired'

/** How the unit entered this branch's stock. */
export type SupplierReturnOriginKind = 'stock' | 'transfer' | 'buyback' | 'swap_in'

export interface SupplierReturnOrigin {
  kind: SupplierReturnOriginKind
  /** When it entered stock here (for transfers, the date it was received at this branch). */
  addedAt: string | null
  addedByName: string | null
  /** Transfers: the branch it came from and when it was first stocked there. */
  fromBranchName?: string | null
  originalAddedAt?: string | null
  transferId?: string
  /** Trade-ins and swap-ins: who it was bought from, and on which record. */
  customerName?: string | null
  buybackId?: string
  swapInReceiptId?: string
}

export interface SupplierReturnItem {
  inventoryItemId: string
  folderId: string
  folderName: string
  name: string
  /** Identifiers and attributes (SN, IMEI, colour…), never money. */
  details: Record<string, string | number | boolean>
  serial: boolean
  quantity: number
  /** Acquisition cost per unit, when known. */
  unitCost: number | null
  /** What happened to the inventory row: a serial unit is deleted, a bulk row loses the units. */
  inventoryAction: 'removed' | 'reduced'
}

export interface SupplierReturnEvent {
  status: SupplierReturnStatus
  at: string
  byName: string
  note?: string
}

export interface SupplierReturn {
  id: string
  storeId: string
  status: SupplierReturnStatus
  item: SupplierReturnItem
  origin: SupplierReturnOrigin
  /** Set when the item reached the supplier through a customer return and inspection. */
  customerReturn: {
    receiptId: string
    receiptNumber: string
    customerName: string
    complaint: string
    returnedAt: string | null
  } | null
  /** What is wrong with it. */
  defect: string
  supplierName: string
  supplierReference: string
  outcome: SupplierReturnOutcome | null
  notes: string
  /** Unit cost × quantity, when the cost is known. */
  costValue: number | null
  history: SupplierReturnEvent[]
  /** Set when a rejected return was written off as a loss. */
  writeOffId: string | null
  /** Set when a repaired or replacement unit went back into inventory. */
  restockedAt: string | null
  restockedItemId: string | null
  createdAt: string | null
  createdByName: string
  sentAt: string | null
  closedAt: string | null
}

export const SUPPLIER_RETURN_STATUS_LABELS: Record<SupplierReturnStatus, string> = {
  ready: 'Ready to send',
  with_supplier: 'With supplier',
  resolved: 'Resolved',
  rejected: 'Rejected',
}

export const SUPPLIER_RETURN_OUTCOME_LABELS: Record<SupplierReturnOutcome, string> = {
  refund: 'Refunded',
  replacement: 'Replaced',
  credit_note: 'Credit note',
  repaired: 'Repaired',
}

/** Outcomes where the stock comes back and goes on sale again. */
export const RESTOCK_OUTCOMES: readonly SupplierReturnOutcome[] = ['repaired', 'replacement']

export const SUPPLIER_RETURN_ORIGIN_LABELS: Record<SupplierReturnOriginKind, string> = {
  stock: 'Added to stock',
  transfer: 'Transferred in',
  buyback: 'Bought from a customer (trade-in)',
  swap_in: 'Swapped in on a sale',
}

/** Body for POST /api/supplier-returns/create. */
export interface CreateSupplierReturnBody {
  itemId: string
  /** Units going back; always 1 for a serial-numbered unit. */
  quantity: number
  supplierName: string
  supplierReference?: string
  defect: string
  notes?: string
}

export type SupplierReturnAction =
  | { action: 'send'; supplierName?: string; supplierReference?: string; note?: string }
  /** Repaired or replaced: the unit goes back into stock (a replacement needs its new serial). */
  | { action: 'resolve'; outcome: SupplierReturnOutcome; note?: string; newSerial?: string }
  | { action: 'restock'; newSerial?: string }
  | { action: 'reject'; note?: string }
  | { action: 'edit'; supplierName?: string; supplierReference?: string; notes?: string }
