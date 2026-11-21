/**
 * Stock removals: items taken out of inventory other than by a sale, transfer, loan, supplier
 * return or write-off — deleted, removed with their category, or counted down by an edit. Every
 * one keeps a copy of the item so nothing leaves stock without a trace.
 *
 * Stored at `users/{ownerId}/stores/{storeId}/stockRemovals/{id}`. Deletions are written by the
 * server (server/utils/stock-removals.ts) in the same step as the delete; count reductions are
 * written by the app in the same batch as the edit (create-only in the rules).
 */

export type StockRemovalKind = 'deleted' | 'category_deleted' | 'count_reduced'

export type DeleteReason = 'entered_by_mistake' | 'duplicate' | 'moved' | 'other'
export type CountReductionReason = 'count_corrected' | 'sold_offline' | 'used_internally' | 'other'
export type StockRemovalReason = DeleteReason | CountReductionReason | 'category_deleted'

export const DELETE_REASON_LABELS: Record<DeleteReason, string> = {
  entered_by_mistake: 'Entered by mistake',
  duplicate: 'Duplicate entry',
  moved: 'Moved to another category or record',
  other: 'Other',
}

export const COUNT_REDUCTION_REASON_LABELS: Record<CountReductionReason, string> = {
  count_corrected: 'Stock count corrected',
  sold_offline: 'Sold outside Storvv',
  used_internally: 'Used in the business',
  other: 'Other',
}

export const STOCK_REMOVAL_REASON_LABELS: Record<StockRemovalReason, string> = {
  ...DELETE_REASON_LABELS,
  ...COUNT_REDUCTION_REASON_LABELS,
  category_deleted: 'Category deleted',
}

export const STOCK_REMOVAL_KIND_LABELS: Record<StockRemovalKind, string> = {
  deleted: 'Deleted',
  category_deleted: 'Deleted with category',
  count_reduced: 'Count reduced',
}

export interface StockRemoval {
  id: string
  storeId: string
  kind: StockRemovalKind
  reason: StockRemovalReason
  note: string
  /** Units removed (1 for a serial unit; the drop for a count reduction). */
  quantity: number
  /** Count reductions: the stock before and after the edit. */
  before: number | null
  after: number | null
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
  restoredAt: string | null
  createdAt: string | null
  createdByName: string
}

/** Why products are being deleted, asked in the delete dialog. */
export interface DeleteWhy {
  reason: DeleteReason
  note?: string
}

/** Why an edit lowered a product's stock count, asked before saving. */
export interface CountReductionWhy {
  reason: CountReductionReason
  note?: string
}

/** A delete reason is complete when "Other" comes with a note. */
export function isDeleteWhyComplete(why: DeleteWhy): boolean {
  return why.reason !== 'other' || (why.note ?? '').trim().length >= 3
}
