import type { Receipt } from '~/stores/receipts'

export interface ReceiptStatusBadge {
 label: string
 dotClass: string
 class: string
}

const badgeShell =
 'inline-flex items-center gap-1.5 whitespace-nowrap rounded-sm border px-2 py-0.5 text-[10px] font-medium leading-none'

export function getReceiptStatusBadge(status: Receipt['status']): ReceiptStatusBadge {
 switch (status) {
 case 'completed':
 return {
 label: 'Completed',
 dotClass: 'bg-emerald-500 dark:bg-emerald-400',
 class: `${badgeShell} border-emerald-200/90 bg-emerald-50/90 text-emerald-950 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-100`,
 }
 case 'pending':
 return {
 label: 'Pending',
 dotClass: 'bg-amber-500 dark:bg-amber-400',
 class: `${badgeShell} border-amber-200/90 bg-amber-50/90 text-amber-950 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100`,
 }
 case 'balance_due':
 return {
 label: 'Balance due',
 dotClass: 'bg-amber-500 dark:bg-amber-400',
 class: `${badgeShell} border-amber-200/90 bg-amber-50/90 text-amber-950 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100`,
 }
 case 'refunded':
 return {
 label: 'Refunded',
 dotClass: 'bg-rose-500 dark:bg-rose-400',
 class: `${badgeShell} border-rose-200/90 bg-rose-50/90 text-rose-950 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-100`,
 }
 case 'cancelled':
 return {
 label: 'Cancelled',
 dotClass: 'bg-slate-400 dark:bg-slate-500',
 class: `${badgeShell} border-slate-200/90 bg-slate-50/90 text-slate-700 dark:border-slate-500/30 dark:bg-slate-500/10 dark:text-slate-200`,
 }
 default:
 return {
 label: status,
 dotClass: 'bg-gray-400',
 class: `${badgeShell} border-gray-200/90 bg-gray-50/90 text-gray-700/40 dark:bg-gray-800/50 dark:text-gray-200`,
 }
 }
}
