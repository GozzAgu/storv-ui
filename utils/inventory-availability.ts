import type { InventoryItem } from '~/stores/inventory'

export type InventoryAvailabilityStatus =
  | 'available'
  | 'with_seller'
  | 'awaiting_payment'
  | 'sold'
  | 'returned'
  | 'on_inspection'

export interface InventoryAvailabilityBadge {
  status: InventoryAvailabilityStatus
  label: string
  /** Secondary line (e.g. receipt number) - kept out of the pill label for a clean single-line badge */
  meta?: string
}

export function getPendingSaleReceiptId(item: InventoryItem): string | null {
  const id = item.pendingSaleReceiptId
  if (id == null) return null
  const s = String(id).trim()
  return s || null
}

export function isItemSold(item: InventoryItem): boolean {
  const dateOutValue = item.dateOut
  return dateOutValue !== null && dateOutValue !== undefined && dateOutValue !== ''
}

export function isItemOnStockLoan(item: InventoryItem): boolean {
  const id = item.sellerLoanOutId
  return id != null && String(id).trim() !== ''
}

/** Lent to a trade partner. Only the partner loan settles it, so it cannot be sold here. */
export function isItemOnPartnerLoan(item: InventoryItem): boolean {
  return isItemOnStockLoan(item) && String(item.sellerLoanOutId).startsWith('trade~')
}

/** Reserved on an outstanding (balance-due) receipt - not sold until paid in full. */
export function isItemAwaitingPayment(item: InventoryItem): boolean {
  return !!getPendingSaleReceiptId(item) && !isItemSold(item)
}

export function availabilityBadgeForAwaitingPayment(
  receiptNumber?: string
): InventoryAvailabilityBadge {
  const meta = receiptNumber?.trim() || undefined
  return {
    status: 'awaiting_payment',
    label: 'Awaiting payment',
    meta,
  }
}

export function availabilityBadgeForSold(): InventoryAvailabilityBadge {
  return {
    status: 'sold',
    label: 'Sold',
  }
}

export function availabilityBadgeForAvailable(): InventoryAvailabilityBadge {
  return {
    status: 'available',
    label: 'Available',
  }
}

/** Set aside for a stock loan that an admin has not approved yet: don't hand it over. */
export function isItemStockLoanPending(item: InventoryItem): boolean {
  return isItemOnStockLoan(item) && item.sellerLoanPending === true
}

export function availabilityBadgeForStockLoan(pending = false): InventoryAvailabilityBadge {
  return {
    status: 'with_seller',
    label: pending ? 'Loan awaiting approval' : 'On stock loan',
  }
}

/** A customer returned it and it waits for inspection: not sellable until someone decides. */
export function isItemOnInspection(item: InventoryItem): boolean {
  return typeof item.inspectionHoldId === 'string' && item.inspectionHoldId !== ''
}

export function availabilityBadgeForInspection(): InventoryAvailabilityBadge {
  return {
    status: 'on_inspection',
    label: 'Held for inspection',
  }
}

export function availabilityBadgeForReturned(): InventoryAvailabilityBadge {
  return {
    status: 'returned',
    label: 'Returned',
  }
}

/** Coarse status for an inventory item (used by storefront projection and badges). */
export function getInventoryAvailabilityStatus(item: InventoryItem): InventoryAvailabilityStatus {
  if (isItemSold(item)) return 'sold'
  if (isItemOnInspection(item)) return 'on_inspection'
  if (isItemOnStockLoan(item)) return 'with_seller'
  if (isItemAwaitingPayment(item)) return 'awaiting_payment'
  return 'available'
}

/** Sort order for availability column (available first when ascending). */
export function formatAvailabilityLabel(badge: InventoryAvailabilityBadge): string {
  return badge.meta ? `${badge.label} · ${badge.meta}` : badge.label
}

export const AVAILABILITY_SORT_ORDER: InventoryAvailabilityStatus[] = [
  'available',
  'with_seller',
  'awaiting_payment',
  'sold',
  'returned',
]

/** Badge tone for an availability status in the design-system components. */
export function inventoryAvailabilityTone(
  status: InventoryAvailabilityStatus
): 'success' | 'info' | 'warning' | 'neutral' | 'accent' {
  switch (status) {
    case 'available':
      return 'success'
    case 'with_seller':
      return 'info'
    case 'awaiting_payment':
    case 'on_inspection':
      return 'warning'
    case 'returned':
      return 'accent'
    default:
      return 'neutral'
  }
}

/**
 * Free to lend to a reseller: not sold, not already lent (to a reseller or a partner shop), not
 * reserved on an unpaid sale and not held for inspection. Matches what Inventory lets you tick.
 */
export function isItemLendable(item: InventoryItem): boolean {
  return (
    !isItemSold(item) &&
    !isItemOnStockLoan(item) &&
    !isItemAwaitingPayment(item) &&
    !isItemOnInspection(item)
  )
}
