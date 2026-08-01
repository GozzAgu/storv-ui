/**
 * Shared layout tokens for SidePanel / drawer flows (receipts, inventory, settings).
 */
import {
  APP_FIELD_ON_WHITE_CLASS,
  APP_FIELD_TEXTAREA_CLASS,
} from '~/utils/app-chrome'

export function useDashboardDrawerChrome() {
  const searchInputClass = `h-9 w-full pl-9 pr-3 ${APP_FIELD_ON_WHITE_CLASS} dark:!bg-dashboard-card`

  const drawerFillClass = 'dash-drawer-fill'
  const drawerFillFixedClass = 'dash-drawer-fill__fixed'
  const drawerFillScrollClass = 'dash-drawer-fill__scroll'
  const drawerFillStepClass = 'dash-drawer-fill-step'

  const pickListClass = 'dash-drawer-pick-list'
  const pickListScrollClass = 'dash-drawer-pick-scroll'
  const pickRowClass = 'dash-drawer-pick-row'
  const pickRowSelectedClass = 'dash-drawer-pick-row dash-drawer-pick-row--selected'

  const pickRowTitleClass = 'truncate text-xs font-medium text-gray-900 dark:text-gray-100'
  const pickRowMetaClass = 'text-[11px] text-gray-500 dark:text-gray-400'

  const emptyStateClass = 'dash-drawer-empty'

  const sectionLabelClass = 'dash-drawer-label'
  const drawerSectionClass = 'dash-drawer-section'
  const drawerLabelClass = 'dash-drawer-label'
  const drawerInputClass = APP_FIELD_ON_WHITE_CLASS
  const drawerTextareaClass = APP_FIELD_TEXTAREA_CLASS
  const drawerHintClass = 'dash-drawer-hint'

  const footerBtnOutlineClass =
    '!inline-flex !h-9 !min-h-9 !items-center !justify-center !rounded-full !px-4 !py-0 !text-xs !font-semibold'

  const footerBtnPrimaryClass = footerBtnOutlineClass

  /** Scroll pick lists with mouse wheel while hovered; at list edges, scroll passes to the modal. */
  function scrollPickListOnWheel(event: WheelEvent) {
    const el = event.currentTarget as HTMLElement | null
    if (!el || el.scrollHeight <= el.clientHeight) return

    const deltaY = event.deltaY
    const atTop = el.scrollTop <= 0
    const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 1

    if ((deltaY < 0 && atTop) || (deltaY > 0 && atBottom)) {
      return
    }

    event.preventDefault()
    el.scrollTop += deltaY
  }

  return {
    searchInputClass,
    drawerFillClass,
    drawerFillFixedClass,
    drawerFillScrollClass,
    drawerFillStepClass,
    pickListClass,
    pickListScrollClass,
    pickRowClass,
    pickRowSelectedClass,
    pickRowTitleClass,
    pickRowMetaClass,
    emptyStateClass,
    sectionLabelClass,
    drawerSectionClass,
    drawerLabelClass,
    drawerInputClass,
    drawerTextareaClass,
    drawerHintClass,
    footerBtnOutlineClass,
    footerBtnPrimaryClass,
    scrollPickListOnWheel,
  }
}
