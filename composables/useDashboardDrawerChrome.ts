/**
 * Shared layout tokens for SidePanel / drawer flows (receipts, inventory, settings).
 */
export function useDashboardDrawerChrome() {
  const searchInputClass =
    'h-9 w-full rounded-lg border border-gray-200/90 bg-white pl-9 pr-3 text-xs text-gray-900 shadow-sm shadow-gray-900/[0.02] placeholder:text-gray-400 focus:border-primary-400/50 focus:outline-none focus:ring-2 focus:ring-primary-500/15 dark:border-gray-700/80 dark:!bg-dashboard-card dark:text-gray-100 dark:placeholder:text-gray-500 dark:shadow-none'

  const pickListClass =
    'overflow-hidden rounded-lg border border-gray-200/70 bg-white dark:border-white/[0.06] dark:!bg-dashboard-card'

  const pickListScrollClass = 'max-h-[min(52vh,28rem)] overflow-y-auto overscroll-contain divide-y divide-gray-100/90 dark:divide-gray-800/80'

  const pickRowClass =
    'flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-gray-50/90 dark:hover:bg-white/[0.03]'

  const pickRowSelectedClass =
    'bg-primary-50/80 ring-1 ring-inset ring-primary-500/25 dark:bg-primary-950/25 dark:ring-primary-500/30'

  const pickRowTitleClass = 'truncate text-xs font-medium text-gray-900 dark:text-gray-100'
  const pickRowMetaClass = 'text-[11px] text-gray-500 dark:text-gray-400'

  const emptyStateClass =
    'flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-200/90 bg-gray-50/50 px-4 py-10 text-center dark:border-gray-700/80 dark:bg-white/[0.02]'

  const sectionLabelClass = 'text-[11px] font-medium text-gray-600 dark:text-gray-400'

  const footerBtnOutlineClass =
    '!inline-flex !h-9 !min-h-9 !items-center !justify-center !rounded-lg !px-4 !py-0 !text-xs !font-medium'

  const footerBtnPrimaryClass = footerBtnOutlineClass

  return {
    searchInputClass,
    pickListClass,
    pickListScrollClass,
    pickRowClass,
    pickRowSelectedClass,
    pickRowTitleClass,
    pickRowMetaClass,
    emptyStateClass,
    sectionLabelClass,
    footerBtnOutlineClass,
    footerBtnPrimaryClass,
  }
}
