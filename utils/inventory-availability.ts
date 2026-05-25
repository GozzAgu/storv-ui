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
 /** Secondary line (e.g. receipt number) — kept out of the pill label for a clean single-line badge */
 meta?: string
 dotClass: string
 class: string
}

const badgeShell =
 'inline-flex max-w-full items-center gap-1.5 whitespace-nowrap rounded-sm border px-2 py-0.5 text-[11px] font-medium leading-tight'

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

/** Reserved on an outstanding (balance-due) receipt — not sold until paid in full. */
export function isItemAwaitingPayment(item: InventoryItem): boolean {
 return !!getPendingSaleReceiptId(item) && !isItemSold(item)
}

export function availabilityBadgeForAwaitingPayment(receiptNumber?: string): InventoryAvailabilityBadge {
 const meta = receiptNumber?.trim() || undefined
 return {
 status: 'awaiting_payment',
 label: 'Awaiting payment',
 meta,
 dotClass: 'bg-amber-500 dark:bg-amber-400',
 class: `${badgeShell} border-amber-200/90 bg-amber-50/90 text-amber-950 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100`,
 }
}

export function availabilityBadgeForSold(): InventoryAvailabilityBadge {
 return {
 status: 'sold',
 label: 'Sold',
 dotClass: 'bg-orange-500 dark:bg-orange-400',
 class: `${badgeShell} border-orange-200/90 bg-orange-50/90 text-orange-950 dark:border-orange-500/30 dark:bg-orange-500/10 dark:text-orange-100`,
 }
}

export function availabilityBadgeForAvailable(): InventoryAvailabilityBadge {
 return {
 status: 'available',
 label: 'Available',
 dotClass: 'bg-emerald-500 dark:bg-emerald-400',
 class: `${badgeShell} border-emerald-200/90 bg-emerald-50/90 text-emerald-950 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-100`,
 }
}

export function availabilityBadgeForStockLoan(): InventoryAvailabilityBadge {
 return {
 status: 'with_seller',
 label: 'On stock loan',
 dotClass: 'bg-violet-500 dark:bg-violet-400',
 class: `${badgeShell} border-violet-200/90 bg-violet-50/90 text-violet-950 dark:border-violet-500/30 dark:bg-violet-500/10 dark:text-violet-100`,
 }
}

export function availabilityBadgeForReturned(): InventoryAvailabilityBadge {
 return {
 status: 'returned',
 label: 'Returned',
 dotClass: 'bg-slate-500 dark:bg-slate-400',
 class: `${badgeShell} border-slate-200/90 bg-slate-50/90 text-slate-800 dark:border-slate-500/30 dark:bg-slate-500/10 dark:text-slate-200`,
 }
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
