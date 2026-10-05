import type { InventoryItem } from '~/stores/inventory'

export type InventoryAvailabilityStatus =
  | 'available'
  | 'with_seller'
  | 'awaiting_payment'
  | 'sold'
  | 'returned'

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

export function availabilityBadgeForStockLoan(): InventoryAvailabilityBadge {
  return {
    status: 'with_seller',
    label: 'On stock loan',
  }
}

export function availabilityBadgeForReturned(): InventoryAvailabilityBadge {
  return {
    status: 'returned',
    label: 'Returned',
  }
}

/** Coarse status for an inventory item (used by storefront projection and badges). */
export function getInventoryAvailabilityStatus(
  item: InventoryItem
): InventoryAvailabilityStatus {
  if (isItemSold(item)) return 'sold'
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
      return 'warning'
    case 'returned':
      return 'accent'
    default:
      return 'neutral'
  }
}
