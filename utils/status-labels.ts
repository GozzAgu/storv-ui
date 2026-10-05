export function staffAccessLabel(summary: 'full' | 'view-only' | 'custom'): string {
  if (summary === 'full') return 'Full access'
  if (summary === 'custom') return 'Custom'
  return 'View only'
}

export function formatStaffStatusLabel(status: string): string {
  if (status === 'on_leave') return 'On leave'
  return status.charAt(0).toUpperCase() + status.slice(1)
}

export function formatSellerLoanStatusLabel(status: string): string {
  if (status === 'active') return 'On loan'
  if (status === 'sold') return 'Sold'
  if (status === 'returned') return 'Returned'
  return status.charAt(0).toUpperCase() + status.slice(1)
}
