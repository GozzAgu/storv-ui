const badgeBase =
  'inline-flex max-w-full items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-semibold leading-tight'

/** @deprecated Role tiers no longer exist — see staffAccessBadgeClass/staffAccessLabel. Kept only
 *  for any leftover legacy staff.role display. */
export function staffRoleBadgeClass(role: string): string {
  switch (role) {
    case 'manager':
      return `${badgeBase} bg-gray-100 text-gray-800 dark:bg-white/10 dark:text-white`
    case 'intern':
      return `${badgeBase} bg-blue-50 text-blue-800 dark:bg-blue-500/15 dark:text-blue-200`
    default:
      return `${badgeBase} bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-gray-200`
  }
}

/** Roster badge for a staff member's permission-matrix summary (full / view-only / custom). */
export function staffAccessBadgeClass(summary: 'full' | 'view-only' | 'custom'): string {
  switch (summary) {
    case 'full':
      return `${badgeBase} bg-gray-100 text-gray-800 dark:bg-white/10 dark:text-white`
    case 'custom':
      return `${badgeBase} bg-gray-100 text-gray-700 ring-1 ring-inset ring-gray-300/70 dark:bg-white/[0.06] dark:text-gray-200 dark:ring-white/15`
    default:
      return `${badgeBase} bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-gray-200`
  }
}

export function staffAccessLabel(summary: 'full' | 'view-only' | 'custom'): string {
  if (summary === 'full') return 'Full access'
  if (summary === 'custom') return 'Custom'
  return 'View only'
}

export function staffStatusBadgeClass(status: string): string {
  switch (status) {
    case 'active':
      return `${badgeBase} bg-emerald-50 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-200`
    case 'on_leave':
      return `${badgeBase} bg-amber-50 text-amber-900 dark:bg-amber-500/15 dark:text-amber-100`
    default:
      return `${badgeBase} bg-red-50 text-red-800 dark:bg-red-500/15 dark:text-red-200`
  }
}

export function formatStaffStatusLabel(status: string): string {
  if (status === 'on_leave') return 'On leave'
  return status.charAt(0).toUpperCase() + status.slice(1)
}

export function sellerLoanStatusBadgeClass(status: string): string {
  switch (status) {
    case 'active':
      return `${badgeBase} bg-indigo-50 text-indigo-800 dark:bg-indigo-500/15 dark:text-indigo-200`
    case 'sold':
      return `${badgeBase} bg-emerald-50 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-200`
    default:
      return `${badgeBase} bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-gray-200`
  }
}

export function formatSellerLoanStatusLabel(status: string): string {
  if (status === 'active') return 'On loan'
  if (status === 'sold') return 'Sold'
  if (status === 'returned') return 'Returned'
  return status.charAt(0).toUpperCase() + status.slice(1)
}

export function salesLeadStatusBadgeClass(status: string): string {
  switch (status) {
    case 'new':
      return `${badgeBase} bg-sky-50 text-sky-800 dark:bg-sky-500/15 dark:text-sky-200`
    case 'contacted':
      return `${badgeBase} bg-indigo-50 text-indigo-800 dark:bg-indigo-500/15 dark:text-indigo-200`
    case 'negotiating':
      return `${badgeBase} bg-amber-50 text-amber-900 dark:bg-amber-500/15 dark:text-amber-100`
    case 'won':
      return `${badgeBase} bg-emerald-50 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-200`
    case 'lost':
      return `${badgeBase} bg-red-50 text-red-800 dark:bg-red-500/15 dark:text-red-200`
    default:
      return `${badgeBase} bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-gray-200`
  }
}
