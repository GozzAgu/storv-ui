/**
 * Shared bottom-sheet chrome - More menu, CRUD drawers, assistant (iOS native).
 */
export type DashboardNativeSheetVariant = 'menu' | 'crud' | 'assistant'

export function useDashboardNativeSheetChrome(variant: DashboardNativeSheetVariant = 'crud') {
  const backdropClass = 'native-bottom-nav__backdrop dash-overlay-backdrop'

  const sheetBaseClass = 'native-more-sheet dashboard-native-sheet'

  const sheetClass = computedSheetClass(variant)

  const sheetHeaderClass = 'native-more-sheet__header dashboard-native-sheet__header'
  const sheetHandleClass = 'native-more-sheet__handle'
  const sheetEyebrowClass = 'dash-overlay-eyebrow'
  const sheetTitleClass = 'dash-overlay-title native-more-sheet__title'
  const sheetSubtitleClass = 'dash-overlay-subtitle dashboard-native-sheet__subtitle'
  const sheetBodyClass = 'dashboard-native-sheet__body min-h-0 flex-1 overflow-y-auto overscroll-contain'
  const sheetFooterClass = 'native-more-sheet__footer dashboard-native-sheet__footer'

  const sheetListClass =
    'native-bottom-nav__sheet-list min-h-0 flex-1 overflow-y-auto overscroll-contain py-2'

  const sheetSectionLabelClass = 'native-more-sheet__section-label'
  const sheetRowLabelClass = 'native-more-sheet__row-label'
  const sheetBadgeClass =
    'native-more-sheet__badge shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300'

  const sheetRowClass = 'native-more-sheet__row'
  const sheetRowActiveClass = 'native-more-sheet__row native-more-sheet__row--active'
  const sheetRowInactiveClass = 'native-more-sheet__row text-gray-800 dark:text-gray-200'

  const sheetIconWrapClass = 'native-more-sheet__icon'
  const sheetIconWrapActiveClass = 'native-more-sheet__icon native-more-sheet__icon--active'

  const closeButtonClass = 'dashboard-native-sheet__close dash-overlay-close'

  return {
    backdropClass,
    sheetBaseClass,
    sheetClass,
    sheetHeaderClass,
    sheetHandleClass,
    sheetEyebrowClass,
    sheetTitleClass,
    sheetSubtitleClass,
    sheetBodyClass,
    sheetFooterClass,
    sheetListClass,
    sheetSectionLabelClass,
    sheetRowLabelClass,
    sheetBadgeClass,
    sheetRowClass,
    sheetRowActiveClass,
    sheetRowInactiveClass,
    sheetIconWrapClass,
    sheetIconWrapActiveClass,
    closeButtonClass,
  }
}

function computedSheetClass(variant: DashboardNativeSheetVariant): string {
  const base = 'native-more-sheet dashboard-native-sheet'
  if (variant === 'menu') return `${base} dashboard-native-sheet--menu`
  if (variant === 'assistant') return `${base} dashboard-native-sheet--assistant`
  return `${base} dashboard-native-sheet--crud`
}
