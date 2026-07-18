/**
 * Shared layout tokens for dashboard sidenav (section labels, sub-links).
 */
export function useDashboardSidebarChrome() {
  const sectionLabelClass =
    'px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-500 dark:text-gray-400'

  const sublinkClass =
    'group flex w-full items-center gap-1.5 rounded-lg px-2 py-1.5 text-left text-[13px] text-gray-500 transition-colors hover:bg-gray-100/90 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.05] dark:hover:text-gray-100'

  return {
    sectionLabelClass,
    sublinkClass,
  }
}
