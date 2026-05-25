import { useDashboardPageChrome } from '~/composables/useDashboardPageChrome'

/**
 * Shared layout tokens for Settings, Profile, and similar form-heavy dashboard pages.
 */
export function useDashboardSettingsChrome() {
  const chrome = useDashboardPageChrome()

  const panelClass =
    'overflow-hidden rounded-xl border border-gray-200/70 bg-white dark:border-white/[0.06] dark:!bg-dashboard-card'

  const panelBodyClass = 'px-4 py-4 sm:px-5 sm:py-5'
  const panelBodyCompactClass = 'px-4 py-3 sm:px-5 sm:py-4'
  const panelHeaderClass =
    'flex flex-wrap items-start justify-between gap-3 border-b border-gray-100/90 px-4 py-3.5 dark:border-gray-800/80 sm:px-5'

  const sectionTitleClass = 'text-sm font-semibold tracking-tight text-gray-900 dark:text-gray-50'
  const sectionSubtitleClass = 'mt-0.5 text-[11px] leading-relaxed text-gray-500 dark:text-gray-400'

  const labelClass = 'mb-1.5 block text-[11px] font-medium text-gray-600 dark:text-gray-400'

  const planBadgeClass =
    'inline-flex shrink-0 items-center rounded-full border border-gray-200/80 bg-gray-50/90 px-2.5 py-1 text-[10px] font-medium text-gray-700 dark:border-gray-700/80 dark:bg-white/[0.04] dark:text-gray-300'

  const editLinkClass =
    'inline-flex h-8 items-center rounded-lg px-3 text-xs font-medium text-primary-700 transition-colors hover:bg-primary-50 dark:text-primary-400 dark:hover:bg-primary-950/30'

  const cancelLinkClass =
    'inline-flex h-8 items-center rounded-lg px-3 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'

  const viewOnlyBadgeClass =
    'inline-flex h-8 items-center rounded-lg border border-gray-200/80 bg-gray-50/80 px-3 text-xs font-medium text-gray-500 dark:border-gray-700/80 dark:bg-white/[0.03] dark:text-gray-400'

  const inputBaseClass =
    'w-full rounded-lg border px-3 py-2 text-xs transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500/20'

  function inputClass(editing: boolean) {
    return editing
      ? `${inputBaseClass} border-gray-200/90 bg-white text-gray-900 placeholder:text-gray-400 dark:border-gray-700/80 dark:!bg-dashboard-card dark:text-gray-100`
      : `${inputBaseClass} cursor-not-allowed border-gray-200/60 bg-gray-50/80 text-gray-500 dark:border-gray-700/60 dark:bg-white/[0.02] dark:text-gray-500`
  }

  const settingRowClass =
    'flex flex-wrap items-center justify-between gap-3 border-b border-gray-100/90 py-3 last:border-0 dark:border-gray-800/70'

  /** Compact branch tile in Settings → Branches grid */
  const storeBranchCardClass =
    'group relative flex w-full min-w-0 flex-col rounded-lg border border-gray-100/90 p-2 text-left transition-colors hover:border-gray-200/80 hover:bg-gray-50/60 dark:border-white/[0.06] dark:hover:border-white/[0.1] dark:hover:bg-white/[0.02]'

  const storeBranchCardActiveClass =
    'border-primary-500/30 bg-primary-50/40 ring-1 ring-inset ring-primary-500/10 dark:border-primary-500/35 dark:bg-primary-950/25 dark:ring-primary-500/15'

  const profileStatBarClass =
    'mt-5 flex w-full items-stretch overflow-hidden rounded-lg border border-gray-100/90 bg-gray-50/80 dark:border-white/[0.06] dark:bg-white/[0.03]'

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
    storeBranchCardClass,
    storeBranchCardActiveClass,
    profileStatBarClass,
  }
}
