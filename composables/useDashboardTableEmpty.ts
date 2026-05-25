/**
 * Shared layout for empty states inside dashboard data tables.
 */
export function useDashboardTableEmpty() {
 const tableEmptyShellClass =
 'flex min-h-[min(50vh,22rem)] w-full min-w-0 flex-1 flex-col items-center justify-center sm:min-h-[min(45vh,20rem)]'

 return { tableEmptyShellClass }
}
