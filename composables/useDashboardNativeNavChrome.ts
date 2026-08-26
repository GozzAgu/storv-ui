/**
 * Layout tokens for Capacitor / iOS bottom tab bar and "More" sheet.
 * Sheet chrome lives in useDashboardNativeSheetChrome.
 */
import { useDashboardNativeSheetChrome } from '~/composables/useDashboardNativeSheetChrome'

export function useDashboardNativeNavChrome() {
  const barClass = 'native-tabbar pointer-events-auto'

  const tabClass =
    'native-tabbar__tab group relative z-[1] flex min-w-0 flex-1 flex-col items-center justify-center px-1 transition-[color,transform,opacity] duration-250 ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-[0.96] active:opacity-75'

  const tabInactiveClass = ''
  const tabActiveClass = ''

  const tabStripClass =
    'native-tabbar__strip relative flex items-stretch justify-around'

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
    sheetSectionLabelClass: sheet.sheetSectionLabelClass,
    sheetRowLabelClass: sheet.sheetRowLabelClass,
    sheetBadgeClass: sheet.sheetBadgeClass,
    sheetRowClass: sheet.sheetRowClass,
    sheetRowActiveClass: sheet.sheetRowActiveClass,
    sheetRowInactiveClass: sheet.sheetRowInactiveClass,
    sheetIconWrapClass: sheet.sheetIconWrapClass,
    sheetIconWrapActiveClass: sheet.sheetIconWrapActiveClass,
  }
}
