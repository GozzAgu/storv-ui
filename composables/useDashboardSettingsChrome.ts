import { useDashboardPageChrome } from '~/composables/useDashboardPageChrome'
import { APP_FIELD_CLASS } from '~/utils/app-chrome'

/**
 * Shared layout tokens for Settings, Profile, and similar form-heavy dashboard pages.
 */
export function useDashboardSettingsChrome() {
 const chrome = useDashboardPageChrome()

 const panelClass = `overflow-hidden ${chrome.dashboardCardClass}`

 const panelBodyClass = 'px-4 py-4 sm:px-5 sm:py-5'
 const panelBodyCompactClass = 'px-4 py-3 sm:px-5 sm:py-4'
 const panelHeaderClass =
 'flex flex-wrap items-start justify-between gap-3 border-b border-gray-100/90 px-4 py-3.5 dark:border-gray-800/80 sm:px-5'

 const sectionTitleClass = 'text-sm font-semibold tracking-tight text-gray-900 dark:text-gray-50'
 const sectionSubtitleClass = 'mt-0.5 text-[11px] leading-relaxed text-gray-500 dark:text-gray-400'

 const labelClass = 'mb-1.5 block text-[11px] font-medium text-gray-600 dark:text-gray-400'

 const planBadgeClass =
 'inline-flex shrink-0 items-center rounded-full border-0 bg-gray-50/90 px-2.5 py-1 text-[10px] font-medium text-gray-700 dark:bg-white/[0.04] dark:text-gray-300'

 const editLinkClass =
 'inline-flex h-8 items-center rounded-lg px-3 text-xs font-medium text-primary-700 transition-colors hover:bg-primary-50 dark:text-primary-400 dark:hover:bg-primary-950/30'

 const cancelLinkClass =
 'inline-flex h-8 items-center rounded-lg px-3 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'

 const viewOnlyBadgeClass =
 'inline-flex h-8 items-center rounded-lg border-0 bg-gray-50/80 px-3 text-xs font-medium text-gray-500 dark:bg-white/[0.03] dark:text-gray-400'

  function inputClass(editing: boolean) {
    return editing
      ? `${APP_FIELD_CLASS} dark:!bg-dashboard-card/80`
      : `${APP_FIELD_CLASS} cursor-not-allowed opacity-80 dark:!bg-dashboard-card/60`
  }

  const settingRowClass =
    'flex flex-wrap items-center justify-between gap-3 border-b border-gray-100/90 py-3 last:border-0 dark:border-gray-800/70'

  /** List row icons (no background tile) */
  const settingRowIconClass = 'h-4 w-4 shrink-0 text-gray-500 dark:text-gray-400'

 /** Compact branch tile in Settings → Branches grid */
 const storeBranchCardClass =
 'group relative flex w-full min-w-0 flex-col rounded-lg bg-gray-50/80 p-2 text-left transition-colors hover:bg-gray-50/90 dark:bg-white/[0.03] dark:hover:bg-white/[0.05]'

 const storeBranchCardActiveClass =
 'bg-primary-50/50 dark:bg-primary-950/30'

 const profileStatBarClass =
 'mt-5 flex w-full items-stretch overflow-hidden rounded-lg bg-gray-50/80 dark:bg-white/[0.03]'

 return {
 ...chrome,
 panelClass,
 panelBodyClass,
 panelBodyCompactClass,
 panelHeaderClass,
 sectionTitleClass,
 sectionSubtitleClass,
 labelClass,
 planBadgeClass,
 editLinkClass,
 cancelLinkClass,
 viewOnlyBadgeClass,
 inputClass,
    settingRowClass,
    settingRowIconClass,
    storeBranchCardClass,
 storeBranchCardActiveClass,
 profileStatBarClass,
 }
}
