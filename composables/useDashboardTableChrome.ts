/**
 * Shared class tokens for dashboard data tables (shell, toolbar, pagination).
 */
export function useDashboardTableChrome() {
  const tableShellClass = 'data-table-shell dash-table-shell'
  const tableShellFlexClass = `${tableShellClass} flex min-h-0 flex-1 flex-col overflow-hidden`
  const tableSectionHeaderClass = 'dash-table-section-header'
  const tableToolbarClass = 'dash-table-toolbar'
  const tablePaginationClass = 'dash-table-pagination'

  return {
    tableShellClass,
    tableShellFlexClass,
    tableSectionHeaderClass,
    tableToolbarClass,
    tablePaginationClass,
  }
}
