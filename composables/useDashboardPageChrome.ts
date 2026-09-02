/**
 * Shared layout tokens for dashboard page headers and toolbars (32px controls, aligned rows).
 */
import { computed } from 'vue'
import { buildIosTextClass } from '~/composables/useIosTypography'
import { APP_CARD_CLASS, APP_FIELD_COMPACT_CLASS } from '~/utils/app-chrome'

export function useDashboardPageChrome() {
  const { isNativeApp } = useCapacitorNativeApp()
  const { isCapacitorIos } = useIsCapacitorIos()
  const native = computed(() => isNativeApp.value)

  /** Elevated surfaces (sections, panels) - no outer border */
  const dashboardCardClass = APP_CARD_CLASS

  const dashboardCardPaddedClass = 'dash-card dash-card--padded'

  const pageHeaderClass = 'dash-page-header'
  const unifiedHeaderClass = 'dash-page-header dash-page-header--unified'
  const unifiedPageClass = 'dash-page--unified'
  const toolbarDividerClass = 'dash-page-header__toolbar'

  const toolbarRowClass = 'flex flex-col gap-2.5 lg:flex-row lg:items-center lg:gap-3'

  const fieldClass = `${APP_FIELD_COMPACT_CLASS} bg-white dark:!bg-dashboard-card`

  const metaClass = isNativeApp.value
    ? 'inline-flex h-8 shrink-0 items-center rounded-lg border-0 bg-gray-50/80 px-2.5 text-xs font-medium tabular-nums text-gray-600 dark:bg-white/[0.04] dark:text-gray-400'
    : 'inline-flex h-8 shrink-0 items-center rounded-lg border-0 bg-gray-50/80 px-2.5 text-xs font-medium tabular-nums text-gray-600 dark:bg-white/[0.04] dark:text-gray-400'

  /** Icon-only header actions (toolbar / page header). */
  const headerIconBtnClass = computed(() =>
    isCapacitorIos.value
      ? '!inline-flex !h-9 !w-9 !min-h-9 !min-w-9 !items-center !justify-center !rounded-full !p-0 !text-xs shrink-0'
      : '!inline-flex !h-8 !min-h-8 !items-center !justify-center !rounded-full !px-3.5 !py-0 !text-xs shrink-0'
  )

  /** Labeled header / panel / inline actions — sales-leads pill style on iOS. */
  const headerTextBtnClass = computed(() =>
    isCapacitorIos.value
      ? 'ios-action-btn ios-action-btn--sm'
      : '!inline-flex !h-8 !min-h-8 !items-center !justify-center !rounded-full !px-3.5 !py-0 !text-xs shrink-0'
  )

  /** Alias for inline dashboard actions (same as headerTextBtnClass). */
  const actionBtnClass = headerTextBtnClass

  /** @deprecated Prefer headerIconBtnClass or headerTextBtnClass explicitly. */
  const headerBtnClass = headerIconBtnClass

  const toolbarSelectClass = computed(() =>
    isCapacitorIos.value ? 'ios-toolbar-select' : ''
  )

  /** iOS header actions: icon-only (label stays for screen readers). */
  const headerBtnLabelClass = computed(() =>
    isCapacitorIos.value ? 'sr-only' : 'hidden sm:inline'
  )

  const segmentTabsClass = 'dash-segment-tabs'
  const segmentTabsBtnClass = 'dash-segment-tabs__btn'
  const segmentTabsBtnActiveClass = 'dash-segment-tabs__btn--active'

  /** @deprecated Prefer `<DashboardBackButton />` for back navigation. */
  const iconBtnClass = computed(() =>
    isCapacitorIos.value
      ? 'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100/90 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/[0.06] dark:hover:text-gray-100 [&_svg]:h-[1.125rem] [&_svg]:w-[1.125rem]'
      : 'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100/90 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/[0.06] dark:hover:text-gray-100'
  )

  const iosCaption = buildIosTextClass('caption', { secondary: true })
  const iosTitle = buildIosTextClass('title2')
  const iosMeta = buildIosTextClass('footnote', { secondary: true })

  const eyebrowClass = computed(() => `dash-eyebrow ${iosCaption}`)

  const pageTitleClass = computed(() => `dash-page-title ${iosTitle}`)

  /** @deprecated Use pageTitleClass */
  const titleClass = pageTitleClass

  const descriptionClass = computed(() =>
    native.value
      ? `dash-page-meta mt-1.5 ${iosMeta}`
      : `dash-page-meta mt-1.5 max-w-2xl ${iosMeta}`
  )

  const bulkActionsClass =
    'flex flex-wrap items-center gap-2 border-t border-gray-100/90 pt-2.5 dark:border-gray-800/80 lg:ml-auto lg:shrink-0 lg:border-t-0 lg:border-l lg:pl-3 lg:pt-0 dark:lg:border-gray-700/80'

  /** Footer bar wrapping Pagination (matches unified table shell). */
  const paginationBarClass = 'dash-table-pagination'

  /** Page root when pagination is pinned to the viewport bottom. */
  const pageWithFixedFooterClass =
    'dashboard-page-with-footer flex min-h-[calc(100svh-4rem)] w-full max-w-none flex-1 flex-col space-y-5 pb-[calc(6.5rem+env(safe-area-inset-bottom,0px))] sm:space-y-6 sm:pb-32'

  return {
    dashboardCardClass,
    dashboardCardPaddedClass,
    pageHeaderClass,
    unifiedHeaderClass,
    unifiedPageClass,
    toolbarDividerClass,
    toolbarRowClass,
    fieldClass,
    metaClass,
    headerBtnClass,
    headerIconBtnClass,
    headerTextBtnClass,
    actionBtnClass,
    toolbarSelectClass,
    headerBtnLabelClass,
    segmentTabsClass,
    segmentTabsBtnClass,
    segmentTabsBtnActiveClass,
    iconBtnClass,
    eyebrowClass,
    titleClass,
    pageTitleClass,
    descriptionClass,
    bulkActionsClass,
    paginationBarClass,
    pageWithFixedFooterClass,
  }
}
