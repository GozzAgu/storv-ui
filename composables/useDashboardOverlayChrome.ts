/**
 * Shared shell tokens for Modal and SidePanel overlays.
 */
export function useDashboardOverlayChrome() {
 const backdropClass = 'bg-gray-900/40 dark:bg-black/55'

 const shellClass =
 'flex min-h-0 w-full flex-col overflow-hidden border-0 bg-white pb-[env(safe-area-inset-bottom,0)] text-gray-900 shadow-2xl shadow-gray-900/10 dark:!bg-dashboard-card dark:text-gray-100 dark:shadow-black/40'

 const headerClass =
 'flex shrink-0 items-start justify-between gap-3 border-b border-gray-100/90 bg-gray-50/50 px-4 py-3.5 dark:border-gray-800/80 dark:bg-white/[0.02] sm:px-5 sm:py-4'

 const bodyClass = 'min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain bg-white dark:!bg-dashboard-card'

 const footerClass =
 'flex shrink-0 flex-col items-stretch justify-end gap-2 border-t border-gray-100/90 bg-gray-50/60 px-4 py-3 dark:border-gray-800/80 dark:bg-white/[0.02] sm:flex-row sm:items-center sm:justify-end sm:gap-3 sm:px-5 sm:py-3.5'

 const closeButtonClass =
 'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-200/60 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/[0.06] dark:hover:text-gray-100'

 const titleClass = 'text-base font-semibold tracking-tight text-gray-900 dark:text-gray-50'
 const subtitleClass = 'mt-1 text-[13px] leading-snug text-gray-500 dark:text-gray-400'
 const eyebrowClass = 'text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400 dark:text-gray-500'

 const footerBtnOutlineClass =
 '!inline-flex !h-9 !min-h-9 !items-center !justify-center !rounded-lg !px-4 !py-0 !text-xs !font-medium'

 const footerBtnPrimaryClass = footerBtnOutlineClass

 return {
 backdropClass,
 shellClass,
 headerClass,
 bodyClass,
 footerClass,
 closeButtonClass,
 titleClass,
 subtitleClass,
 eyebrowClass,
 footerBtnOutlineClass,
 footerBtnPrimaryClass,
 }
}
