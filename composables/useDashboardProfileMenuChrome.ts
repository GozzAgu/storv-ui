/**
 * Shared layout tokens for the header profile menu dropdown.
 */
export function useDashboardProfileMenuChrome() {
  const triggerClass =
    'group flex h-8 items-center rounded-lg font-medium text-gray-700 transition-colors hover:bg-gray-100/90 dark:text-gray-200 dark:hover:bg-white/[0.06]'

  const triggerCompactClass = 'h-8 w-8 shrink-0 justify-center p-0'
  const triggerDefaultClass =
    'min-w-0 max-w-[9rem] gap-1.5 pl-0.5 pr-1 sm:max-w-[11rem] md:max-w-[12rem]'

  const avatarClass =
    'relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-linear-to-br from-primary-400 via-primary-500 to-primary-700 font-bold text-white shadow-sm shadow-primary-900/15 ring-1 ring-white/20 dark:ring-white/10'

  const panelClass =
    'overflow-hidden rounded-xl border-0 bg-white/95 shadow-[0_8px_28px_-6px_rgb(15_23_42/0.14)] backdrop-blur-xl dark:!bg-[#12141c]/98 dark:shadow-[0_12px_36px_-8px_rgb(0_0_0/0.5)]'

  const panelHeaderClass =
    'border-0 bg-linear-to-br from-primary-50/80 via-white to-white px-3 py-2.5 dark:from-primary-950/35 dark:via-[#12141c] dark:to-[#12141c]'

  const panelHeaderNameClass =
    'truncate text-xs font-semibold leading-tight tracking-tight text-gray-900 dark:text-gray-50'

  const panelHeaderEmailClass =
    'truncate text-[10px] font-normal leading-snug text-gray-500 dark:text-gray-400'

  const metaBadgeClass =
    'inline-flex max-w-full items-center truncate rounded-md bg-white/80 px-1.5 py-0.5 text-[9px] font-medium text-gray-600 ring-1 ring-gray-900/[0.05] dark:bg-white/[0.06] dark:text-gray-300 dark:ring-white/[0.08]'

  const roleBadgeClass =
    'inline-flex shrink-0 items-center rounded-md bg-primary-500/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-primary-800 dark:bg-primary-400/15 dark:text-primary-200'

  const menuSectionLabelClass =
    'px-2.5 pb-0.5 pt-1.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-gray-400 dark:text-gray-500'

  const menuSectionClass = 'px-1.5 pb-1'

  const menuRowClass =
    'flex w-full items-center gap-2 rounded-md px-1.5 py-1.5 text-left text-xs font-medium leading-tight transition-colors duration-150'

  const menuRowInactiveClass =
    'text-gray-700 hover:bg-gray-100/90 active:bg-gray-100 dark:text-gray-200 dark:hover:bg-white/[0.05] dark:active:bg-white/[0.07]'

  const menuRowActiveClass =
    'bg-primary-50/90 text-primary-800 dark:bg-primary-500/10 dark:text-primary-200'

  const menuIconWrapClass =
    'flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-gray-100/90 text-gray-600 transition-colors dark:bg-white/[0.05] dark:text-gray-400'

  const menuIconWrapActiveClass =
    'bg-primary-100/90 text-primary-700 dark:bg-primary-500/15 dark:text-primary-300'

  const menuIconClass = 'h-4 w-4 shrink-0'

  const menuBadgeClass =
    'ml-auto flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold tabular-nums text-white'

  const menuFooterClass = 'px-1.5 py-1'

  const signOutRowClass =
    'group flex w-full items-center gap-2 rounded-md px-1.5 py-1.5 text-left text-xs font-medium text-gray-600 transition-colors duration-150 hover:bg-red-50/90 hover:text-red-700 active:bg-red-50 dark:text-gray-400 dark:hover:bg-red-500/10 dark:hover:text-red-400'

  const signOutIconWrapClass =
    'flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-gray-100/80 text-gray-500 transition-colors group-hover:bg-red-100/90 group-hover:text-red-600 dark:bg-white/[0.04] dark:group-hover:bg-red-500/15 dark:group-hover:text-red-400'

  return {
    triggerClass,
    triggerCompactClass,
    triggerDefaultClass,
    avatarClass,
    panelClass,
    panelHeaderClass,
    panelHeaderNameClass,
    panelHeaderEmailClass,
    metaBadgeClass,
    roleBadgeClass,
    menuSectionLabelClass,
    menuSectionClass,
    menuRowClass,
    menuRowInactiveClass,
    menuRowActiveClass,
    menuIconWrapClass,
    menuIconWrapActiveClass,
    menuIconClass,
    menuBadgeClass,
    menuFooterClass,
    signOutRowClass,
    signOutIconWrapClass,
  }
}
