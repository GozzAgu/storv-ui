/**
 * Layout tokens for Capacitor / iOS bottom tab bar and "More" sheet.
 */
export function useDashboardNativeNavChrome() {
  const barClass =
    'pointer-events-auto border-t border-gray-200/90 bg-white/[0.98] backdrop-blur-xl dark:border-gray-800/90 dark:!bg-[#07080c]/[0.98]'

  const tabClass =
    'group relative flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-1 pt-2 pb-1.5 transition-colors duration-150 active:opacity-70'

  const tabInactiveClass = 'text-gray-500 dark:text-gray-400'
  const tabActiveClass = 'text-primary-600 dark:text-primary-400'

  const tabIndicatorClass =
    'absolute top-1 left-1/2 h-0.5 w-5 -translate-x-1/2 rounded-full bg-primary-500 dark:bg-primary-400'

  const sheetClass =
    'fixed inset-x-0 bottom-0 z-[59] flex max-h-[min(72dvh,520px)] flex-col overflow-hidden rounded-t-2xl border border-gray-200/90 bg-white shadow-[0_-8px_40px_rgb(15_23_42/0.12)] dark:border-gray-800/90 dark:!bg-dashboard-card dark:shadow-[0_-12px_48px_rgb(0_0_0/0.45)]'

  const sheetRowClass =
    'flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors active:bg-gray-100/90 dark:active:bg-white/[0.04]'

  const sheetRowActiveClass =
    'bg-primary-50/90 text-primary-700 dark:bg-primary-950/30 dark:text-primary-300'

  const sheetRowInactiveClass = 'text-gray-800 dark:text-gray-200'

  const sheetIconWrapClass =
    'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100/90 text-gray-600 dark:bg-white/[0.05] dark:text-gray-300'

  const sheetIconWrapActiveClass =
    'bg-primary-500/12 text-primary-600 dark:bg-primary-500/15 dark:text-primary-400'

  return {
    barClass,
    tabClass,
    tabInactiveClass,
    tabActiveClass,
    tabIndicatorClass,
    sheetClass,
    sheetRowClass,
    sheetRowActiveClass,
    sheetRowInactiveClass,
    sheetIconWrapClass,
    sheetIconWrapActiveClass,
  }
}
