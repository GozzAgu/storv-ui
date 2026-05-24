/**
 * Shared layout tokens for the header profile menu dropdown.
 */
export function useDashboardProfileMenuChrome() {
  const triggerClass =
    'group flex items-center rounded-lg border border-gray-200/90 bg-white font-medium text-gray-800 transition-colors hover:bg-gray-50 dark:border-gray-700/80 dark:!bg-dashboard-card dark:text-gray-100 dark:hover:bg-white/[0.04]'

  const triggerCompactClass = 'h-9 w-9 shrink-0 justify-center p-0'
  const triggerDefaultClass =
    'min-w-0 max-w-[11rem] gap-2 py-1 pl-1 pr-1.5 sm:max-w-[14rem] sm:pr-2 md:max-w-[17rem] md:pr-2.5'

  const avatarClass =
    'relative flex shrink-0 items-center justify-center overflow-hidden rounded-lg bg-linear-to-br from-primary-400 via-primary-500 to-primary-700 font-bold text-white'

  const panelClass =
    'overflow-hidden rounded-xl border border-gray-200/90 bg-white shadow-lg shadow-gray-900/8 dark:border-gray-800/90 dark:!bg-dashboard-card dark:shadow-black/35'

  const panelHeaderClass =
    'border-b border-gray-100/90 bg-gray-50/50 px-3 py-3 dark:border-gray-800/80 dark:bg-white/[0.02]'

  const menuRowClass =
    'flex items-center gap-2.5 px-3 py-2.5 text-xs font-medium transition-colors hover:bg-gray-50/90 active:bg-gray-100/80 dark:hover:bg-white/[0.04] dark:active:bg-white/[0.06]'

  const menuRowInactiveClass = 'text-gray-800 dark:text-gray-200'
  const menuRowActiveClass = 'bg-primary-50/80 text-primary-700 dark:bg-primary-950/25 dark:text-primary-300'

  const menuIconClass = 'h-4 w-4 shrink-0 text-gray-500 dark:text-gray-400'
  const menuIconActiveClass = 'text-primary-600 dark:text-primary-400'

  const signOutRowClass =
    'flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-xs font-medium text-red-600 transition-colors hover:bg-red-50/80 active:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10 dark:active:bg-red-500/15'

  return {
    triggerClass,
    triggerCompactClass,
    triggerDefaultClass,
    avatarClass,
    panelClass,
    panelHeaderClass,
    menuRowClass,
    menuRowInactiveClass,
    menuRowActiveClass,
    menuIconClass,
    menuIconActiveClass,
    signOutRowClass,
  }
}
