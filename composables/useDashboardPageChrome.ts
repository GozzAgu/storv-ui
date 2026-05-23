/**
 * Shared layout tokens for dashboard page headers and toolbars (32px controls, aligned rows).
 */
export function useDashboardPageChrome() {
  const pageHeaderClass =
    'relative rounded-xl border border-gray-200/70 bg-white px-4 py-3.5 dark:border-white/[0.06] dark:!bg-dashboard-card sm:px-5'

  const toolbarDividerClass =
    'mt-3.5 border-t border-gray-100/90 pt-3.5 dark:border-gray-800/80'

  const toolbarRowClass =
    'flex flex-col gap-2.5 xl:flex-row xl:items-center xl:gap-3'

  const fieldClass =
    'h-8 rounded-lg border border-gray-200/90 bg-white text-xs font-medium text-gray-800 shadow-sm shadow-gray-900/[0.02] transition-colors placeholder:font-normal placeholder:text-gray-400 focus:border-primary-400/50 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-gray-700/80 dark:!bg-dashboard-card dark:text-gray-200 dark:placeholder:text-gray-500 dark:shadow-none dark:focus:border-primary-500/40'

  const metaClass =
    'inline-flex h-8 shrink-0 items-center rounded-lg border border-gray-200/90 bg-gray-50/80 px-2.5 text-xs font-medium tabular-nums text-gray-600 dark:border-gray-700/80 dark:bg-white/[0.04] dark:text-gray-400'

  const headerBtnClass =
    '!inline-flex !h-8 !min-h-8 !items-center !justify-center !rounded-lg !px-3 !py-0 !text-xs shrink-0'

  const iconBtnClass =
    'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-gray-200/90 bg-white text-gray-600 shadow-sm shadow-gray-900/[0.02] transition-colors hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700/80 dark:!bg-dashboard-card dark:text-gray-400 dark:shadow-none dark:hover:bg-gray-800 dark:hover:text-gray-200'

  const eyebrowClass =
    'text-[10px] font-medium tracking-wide text-gray-400 dark:text-gray-500'

  const titleClass =
    'text-lg font-semibold tracking-tight text-gray-900 dark:text-gray-50 sm:text-xl'

  const pageTitleClass =
    'text-xl font-semibold tracking-tight text-gray-900 dark:text-gray-50 sm:text-2xl'

  const descriptionClass =
    'mt-1 max-w-xl text-xs leading-relaxed text-gray-500 dark:text-gray-400'

  const bulkActionsClass =
    'flex flex-wrap items-center gap-2 border-t border-gray-100/90 pt-2.5 dark:border-gray-800/80 xl:ml-auto xl:border-t-0 xl:border-l xl:pl-3 xl:pt-0 dark:xl:border-gray-700/80'

  /** Footer bar wrapping Pagination (matches Activity Logs). */
  const paginationBarClass =
    'shrink-0 border-t border-gray-200/80 bg-gray-50/90 px-3 py-2 dark:border-gray-700/80 dark:bg-white/[0.03] sm:px-5 sm:py-2.5'

  return {
    pageHeaderClass,
    toolbarDividerClass,
    toolbarRowClass,
    fieldClass,
    metaClass,
    headerBtnClass,
    iconBtnClass,
    eyebrowClass,
    titleClass,
    pageTitleClass,
    descriptionClass,
    bulkActionsClass,
    paginationBarClass,
  }
}
