/**
 * Layout tokens for Capacitor / iOS bottom tab bar and "More" sheet.
 */
export function useDashboardNativeNavChrome() {
  const barClass = 'native-tabbar pointer-events-auto'

  const tabClass =
    'group relative flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-1 py-1.5 transition-colors duration-150 active:opacity-70'

  const tabInactiveClass = 'text-gray-500 dark:text-gray-400'
  const tabActiveClass = 'text-[#143f8d] dark:text-[#9ab5e3]'

  const tabIndicatorClass =
    'absolute top-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-[#143f8d] dark:bg-[#9ab5e3]'

  const sheetBackdropClass =
    'native-bottom-nav__backdrop fixed inset-0 z-[58] dash-overlay-backdrop'

  const sheetClass = 'native-more-sheet'

  const sheetHeaderClass = 'native-more-sheet__header'
  const sheetHandleClass = 'native-more-sheet__handle'
  const sheetEyebrowClass = 'dash-overlay-eyebrow'
  const sheetTitleClass = 'dash-overlay-title !text-sm'
  const sheetListClass =
    'native-bottom-nav__sheet-list min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 py-2'
  const sheetFooterClass = 'native-more-sheet__footer'

  const sheetRowClass = 'native-more-sheet__row'
  const sheetRowActiveClass = 'native-more-sheet__row native-more-sheet__row--active'
  const sheetRowInactiveClass = 'native-more-sheet__row text-gray-800 dark:text-gray-200'

  const sheetIconWrapClass = 'native-more-sheet__icon'
  const sheetIconWrapActiveClass = 'native-more-sheet__icon native-more-sheet__icon--active'

  return {
    barClass,
    tabClass,
    tabInactiveClass,
    tabActiveClass,
    tabIndicatorClass,
    sheetBackdropClass,
    sheetClass,
    sheetHeaderClass,
    sheetHandleClass,
    sheetEyebrowClass,
    sheetTitleClass,
    sheetListClass,
    sheetFooterClass,
    sheetRowClass,
    sheetRowActiveClass,
    sheetRowInactiveClass,
    sheetIconWrapClass,
    sheetIconWrapActiveClass,
  }
}
