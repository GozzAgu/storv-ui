const badgeBase =
  'inline-flex max-w-full items-center whitespace-nowrap rounded-sm border px-2 py-0.5 text-[11px] font-medium leading-tight ring-1 ring-inset'

export function staffRoleBadgeClass(role: string): string {
  switch (role) {
    case 'manager':
      return `${badgeBase} border-primary-200/80 bg-primary-50/90 text-primary-800 ring-primary-500/15 dark:border-primary-500/25 dark:bg-primary-500/10 dark:text-primary-200 dark:ring-primary-400/20`
    case 'intern':
      return `${badgeBase} border-blue-200/80 bg-blue-50/90 text-blue-800 ring-blue-500/15 dark:border-blue-500/25 dark:bg-blue-500/10 dark:text-blue-200 dark:ring-blue-400/20`
    default:
      return `${badgeBase} border-gray-200/80 bg-gray-50/90 text-gray-700 ring-gray-500/10 dark:border-gray-600/40 dark:bg-gray-500/10 dark:text-gray-200 dark:ring-gray-500/15`
  }
}

export function staffStatusBadgeClass(status: string): string {
  switch (status) {
    case 'active':
      return `${badgeBase} border-emerald-200/80 bg-emerald-50/90 text-emerald-800 ring-emerald-500/15 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-200 dark:ring-emerald-400/20`
    case 'on_leave':
      return `${badgeBase} border-amber-200/80 bg-amber-50/90 text-amber-900 ring-amber-500/15 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-100 dark:ring-amber-400/20`
    default:
      return `${badgeBase} border-red-200/80 bg-red-50/90 text-red-800 ring-red-500/15 dark:border-red-500/25 dark:bg-red-500/10 dark:text-red-200 dark:ring-red-400/20`
  }
}

export function formatStaffStatusLabel(status: string): string {
  if (status === 'on_leave') return 'On leave'
  return status.charAt(0).toUpperCase() + status.slice(1)
}
