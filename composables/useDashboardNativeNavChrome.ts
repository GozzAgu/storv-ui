/**
 * Layout tokens for Capacitor / iOS bottom tab bar and "More" sheet.
 * Sheet chrome lives in useDashboardNativeSheetChrome.
 */
import { useDashboardNativeSheetChrome } from '~/composables/useDashboardNativeSheetChrome'

export function useDashboardNativeNavChrome() {
  const barClass = 'native-tabbar pointer-events-auto'

  const tabClass =
    'native-tabbar__tab group relative z-[1] flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-1 py-1.5 transition-[color,transform,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-[0.94] active:opacity-80'

  const tabInactiveClass = 'text-gray-500 dark:text-gray-400'
  const tabActiveClass = 'text-[#143f8d] dark:text-[#9ab5e3]'

  const tabStripClass =
    'native-tabbar__strip relative flex h-[3.25rem] items-stretch justify-around px-1.5'

  const sheet = useDashboardNativeSheetChrome('menu')

  return {
    barClass,
    tabClass,
    tabInactiveClass,
    tabActiveClass,
    tabStripClass,
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
