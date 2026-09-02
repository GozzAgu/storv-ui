/**
 * Shared class tokens for dashboard data tables (shell, toolbar, pagination).
 */
export function useDashboardTableChrome() {
  const tableShellClass = 'data-table-shell dash-table-shell'
  const tableShellFlexClass = `${tableShellClass} flex min-h-0 flex-1 flex-col overflow-hidden`
  const tableSectionHeaderClass = 'dash-table-section-header'
  const tableToolbarClass = 'dash-table-toolbar'
  const tablePaginationClass = 'dash-table-pagination'
  const tableExpandClass = 'dash-table-expand'
  const tableExpandHeaderClass = 'dash-table-expand__header'
  const tableExpandBodyClass = `${tableShellClass} dash-table-expand__body flex min-h-0 flex-1 flex-col overflow-hidden`
  const tableExpandCloseClass = 'dash-table-expand__close'
  const tableExpandEyebrowClass = 'dash-table-expand__eyebrow'
  const tableExpandTitleClass = 'dash-table-expand__title'
  const tableExpandMetaClass = 'dash-table-expand__meta'
  const tableExpandFieldClass = 'dash-table-expand__field'

  return {
    tableShellClass,
    tableShellFlexClass,
    tableSectionHeaderClass,
    tableToolbarClass,
    tablePaginationClass,
    tableExpandClass,
    tableExpandHeaderClass,
    tableExpandBodyClass,
    tableExpandCloseClass,
    tableExpandEyebrowClass,
    tableExpandTitleClass,
    tableExpandMetaClass,
    tableExpandFieldClass,
  }
}
