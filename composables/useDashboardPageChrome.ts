/**
 * Shared layout tokens for dashboard page headers and toolbars (32px controls, aligned rows).
 */
import { computed } from 'vue'
import { APP_CARD_CLASS, APP_FIELD_COMPACT_CLASS } from '~/utils/app-chrome'

export function useDashboardPageChrome() {
  const { isNativeApp } = useCapacitorNativeApp()
  const { isCapacitorIos } = useIsCapacitorIos()
  const native = computed(() => isNativeApp.value)

  /** Elevated surfaces (sections, panels) - no outer border */
  const dashboardCardClass = APP_CARD_CLASS

  const dashboardCardPaddedClass = 'dash-card dash-card--padded'

  const pageHeaderClass = 'dash-page-header'
  const toolbarDividerClass = 'dash-page-header__toolbar'

  const toolbarRowClass = 'flex flex-col gap-2.5 lg:flex-row lg:items-center lg:gap-3'

  const fieldClass = `${APP_FIELD_COMPACT_CLASS} bg-white dark:!bg-dashboard-card`

  const metaClass = isNativeApp.value
    ? 'inline-flex h-8 shrink-0 items-center rounded-lg border-0 bg-gray-50/80 px-2.5 text-xs font-medium tabular-nums text-gray-600 dark:bg-white/[0.04] dark:text-gray-400'
    : 'inline-flex h-8 shrink-0 items-center rounded-lg border-0 bg-gray-50/80 px-2.5 text-xs font-medium tabular-nums text-gray-600 dark:bg-white/[0.04] dark:text-gray-400'

  const headerBtnClass = computed(() =>
    isCapacitorIos.value
      ? '!inline-flex !h-8 !w-8 !min-h-8 !min-w-8 !items-center !justify-center !rounded-full !p-0 !text-xs shrink-0'
      : '!inline-flex !h-8 !min-h-8 !items-center !justify-center !rounded-full !px-3.5 !py-0 !text-xs shrink-0'
  )

  /** iOS header actions: icon-only (label stays for screen readers). */
  const headerBtnLabelClass = computed(() =>
    isCapacitorIos.value ? 'sr-only' : 'hidden sm:inline'
  )

  /** @deprecated Prefer `<DashboardBackButton />` for back navigation. */
  const iconBtnClass =
    'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100/90 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/[0.06] dark:hover:text-gray-100'

  const eyebrowClass = computed(() =>
    native.value ? 'dash-eyebrow' : 'dash-eyebrow'
  )

  const titleClass = computed(() =>
    native.value ? 'dash-page-title' : 'dash-page-title !text-lg sm:!text-xl'
  )

  const pageTitleClass = computed(() =>
    native.value ? 'dash-page-title' : 'dash-page-title'
  )

  const descriptionClass = computed(() =>
    native.value ? 'dash-page-meta mt-1.5' : 'dash-page-meta mt-1.5 max-w-2xl'
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
    toolbarDividerClass,
    toolbarRowClass,
    fieldClass,
    metaClass,
    headerBtnClass,
    headerBtnLabelClass,
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
