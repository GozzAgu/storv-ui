/**
 * Inspection holds: items a customer returned that need checking before anyone decides what
 * happens to them.
 *
 * A refund can mark lines "Needs checking". Those aren't put back on sale: a serial unit stays in
 * inventory flagged with `inspectionHoldId` (it can't be sold, loaned or transferred), and a bulk
 * line's units stay off the stock count. A manager then puts the item back on sale or returns it
 * to the supplier. Stored at `users/{ownerId}/stores/{storeId}/inspectionHolds/{holdId}`, written
 * only by the server (server/utils/inspection-holds.ts).
 */

export type InspectionHoldStatus = 'held' | 'restocked' | 'to_supplier' | 'written_off'

export interface InspectionHold {
  id: string
  storeId: string
  status: InspectionHoldStatus
  item: {
    inventoryItemId: string
    folderId: string
    folderName: string
    name: string
    details: Record<string, string | number | boolean>
    serial: boolean
    quantity: number
    unitCost: number | null
  }
  /** The sale it was returned from. */
  sale: {
    receiptId: string
    receiptNumber: string
    customerName: string
    customerPhone?: string
    soldAt: string | null
    amount: number
  }
  /** What the customer said (the refund reason). */
  complaint: string
  heldAt: string | null
  heldByName: string
  closedAt: string | null
  closedByName: string
  supplierReturnId: string | null
}

export type InspectionDecision =
  | { action: 'restock' }
  | {
      action: 'supplier'
      supplierName: string
      supplierReference?: string
      defect: string
      notes?: string
    }
