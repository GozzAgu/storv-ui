/**
 * Layout tokens for Capacitor / iOS bottom tab bar and "More" sheet.
 * Sheet chrome lives in useDashboardNativeSheetChrome.
 */
import { useDashboardNativeSheetChrome } from '~/composables/useDashboardNativeSheetChrome'

export function useDashboardNativeNavChrome() {
  const barClass = 'native-tabbar pointer-events-auto'

  const tabClass =
    'group relative flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-1 py-1.5 transition-colors duration-150 active:opacity-70'

  const tabInactiveClass = 'text-gray-500 dark:text-gray-400'
  const tabActiveClass = 'text-[#143f8d] dark:text-[#9ab5e3]'

  const tabIndicatorClass =
    'absolute top-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-[#143f8d] dark:bg-[#9ab5e3]'

  const sheet = useDashboardNativeSheetChrome('menu')

  return {
    barClass,
    tabClass,
    tabInactiveClass,
    tabActiveClass,
    tabIndicatorClass,
    sheetBackdropClass: sheet.backdropClass,
    sheetClass: sheet.sheetClass,
    sheetHeaderClass: sheet.sheetHeaderClass,
    sheetHandleClass: sheet.sheetHandleClass,
    sheetEyebrowClass: sheet.sheetEyebrowClass,
    sheetTitleClass: sheet.sheetTitleClass,
    sheetListClass: sheet.sheetListClass,
    sheetFooterClass: sheet.sheetFooterClass,
    sheetRowClass: sheet.sheetRowClass,
    sheetRowActiveClass: sheet.sheetRowActiveClass,
    sheetRowInactiveClass: sheet.sheetRowInactiveClass,
    sheetIconWrapClass: sheet.sheetIconWrapClass,
    sheetIconWrapActiveClass: sheet.sheetIconWrapActiveClass,
  }
}
