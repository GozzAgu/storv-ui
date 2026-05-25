/**
 * Shared layout tokens for dashboard page headers and toolbars (32px controls, aligned rows).
 */
import { computed } from 'vue'
import {
  APP_CARD_CLASS,
  APP_FIELD_COMPACT_CLASS,
} from '~/utils/app-chrome'

export function useDashboardPageChrome() {
  const { isNativeApp } = useCapacitorNativeApp()
  const native = computed(() => isNativeApp.value)

  /** Elevated surfaces (sections, panels) — no outer border */
  const dashboardCardClass = APP_CARD_CLASS

  const dashboardCardPaddedClass =
    'rounded-xl border-0 bg-white px-4 py-3.5 dark:!bg-dashboard-card sm:px-5 sm:py-4'

  const pageHeaderClass =
    'relative rounded-xl border-0 bg-white px-4 py-3.5 dark:!bg-dashboard-card sm:px-5'

  const toolbarDividerClass =
    'mt-3.5 border-t border-gray-100/90 pt-3.5 dark:border-gray-800/80'

  const toolbarRowClass =
    'flex flex-col gap-2.5 xl:flex-row xl:items-center xl:gap-3'

  const fieldClass = `${APP_FIELD_COMPACT_CLASS} bg-white dark:!bg-dashboard-card`

  const metaClass = isNativeApp.value
    ? 'inline-flex h-8 shrink-0 items-center rounded-lg border-0 bg-gray-50/80 px-2.5 text-xs font-medium tabular-nums text-gray-600 dark:bg-white/[0.04] dark:text-gray-400'
    : 'inline-flex h-8 shrink-0 items-center rounded-lg border-0 bg-gray-50/80 px-2.5 text-xs font-medium tabular-nums text-gray-600 dark:bg-white/[0.04] dark:text-gray-400'

  const headerBtnClass =
    '!inline-flex !h-8 !min-h-8 !items-center !justify-center !rounded-lg !px-3 !py-0 !text-xs shrink-0'

  /** @deprecated Prefer `<DashboardBackButton />` for back navigation. */
  const iconBtnClass =
    'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100/90 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/[0.06] dark:hover:text-gray-100'

  const eyebrowClass = computed(() =>
    native.value
      ? 'text-xs font-medium tracking-wide text-gray-400 dark:text-gray-500'
      : 'text-[10px] font-medium tracking-wide text-gray-400 dark:text-gray-500'
  )

  const titleClass = computed(() =>
    native.value
      ? 'text-lg font-semibold tracking-tight text-gray-900 dark:text-gray-50'
      : 'text-lg font-semibold tracking-tight text-gray-900 dark:text-gray-50 sm:text-xl'
  )

  const pageTitleClass = computed(() =>
    native.value
      ? 'text-lg font-semibold tracking-tight text-gray-900 dark:text-gray-50'
      : 'text-xl font-semibold tracking-tight text-gray-900 dark:text-gray-50 sm:text-2xl'
  )

  const descriptionClass = computed(() =>
    native.value
      ? 'cap-native-description mt-1 max-w-xl text-xs leading-relaxed text-gray-500 dark:text-gray-400'
      : 'mt-1 max-w-xl text-xs leading-relaxed text-gray-500 dark:text-gray-400'
  )

  const bulkActionsClass =
    'flex flex-wrap items-center gap-2 border-t border-gray-100/90 pt-2.5 dark:border-gray-800/80 xl:ml-auto xl:border-t-0 xl:border-l xl:pl-3 xl:pt-0 dark:xl:border-gray-700/80'

  /** Footer bar wrapping Pagination (matches Activity Logs). */
  const paginationBarClass =
    'shrink-0 border-t border-gray-200/80 bg-gray-50/90 px-3 py-2 dark:bg-white/[0.03] sm:px-5 sm:py-2.5'

  return {
    dashboardCardClass,
    dashboardCardPaddedClass,
    pageHeaderClass,
    toolbarDividerClass,
    toolbarRowClass,
    fieldClass,
    metaClass,
    headerBtnClass,
    iconBtnClass,
    eyebrowClass,
    titleClass,
    pageTitleClass,
    descriptionClass,
    bulkActionsClass,
    paginationBarClass,
  }
}
