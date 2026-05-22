import type { InventoryItem } from '~/stores/inventory'

/** Receipt id stored on inventory while payment is still open. */
export function isInventoryItemOutstanding(item: InventoryItem | Record<string, unknown>): boolean {
  const id = item.outstandingReceiptId
  if (id == null || `${id}`.trim() === '') return false
  const dateOut = item.dateOut
  const hasDateOut = dateOut != null && dateOut !== ''
  return !hasDateOut
}

/** Sold (finalized): dateOut set and not an open outstanding hold. */
export function isInventoryItemSold(item: InventoryItem | Record<string, unknown>): boolean {
  const dateOut = item.dateOut
  const hasDateOut = dateOut != null && dateOut !== ''
  if (!hasDateOut) return false
  return !isInventoryItemOutstanding(item)
}

/** Block new sales / edits (outstanding holds stock like a soft lock). */
export function isInventoryItemHeldForSale(item: InventoryItem | Record<string, unknown>): boolean {
  return isInventoryItemSold(item) || isInventoryItemOutstanding(item)
}
