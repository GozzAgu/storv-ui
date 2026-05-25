/**
 * Shared layout tokens for SidePanel / drawer flows (receipts, inventory, settings).
 */
import { APP_CARD_SM_CLASS, APP_FIELD_ON_WHITE_CLASS, APP_FIELD_TEXTAREA_CLASS } from '~/utils/app-chrome'

export function useDashboardDrawerChrome() {
 const searchInputClass = `h-9 w-full pl-9 pr-3 ${APP_FIELD_ON_WHITE_CLASS} dark:!bg-dashboard-card`

 const pickListClass = `overflow-hidden ${APP_CARD_SM_CLASS}`

 const pickListScrollClass = 'max-h-[min(52vh,28rem)] overflow-y-auto overscroll-contain divide-y divide-gray-100/90 dark:divide-gray-800/80'

 const pickRowClass =
 'flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-gray-50/90 dark:hover:bg-white/[0.03]'

 const pickRowSelectedClass =
 'bg-primary-50/80 ring-0 dark:bg-primary-950/25'

 const pickRowTitleClass = 'truncate text-xs font-medium text-gray-900 dark:text-gray-100'
 const pickRowMetaClass = 'text-[11px] text-gray-500 dark:text-gray-400'

 const emptyStateClass =
 'flex flex-col items-center justify-center rounded-lg border-0 bg-gray-50/50 px-4 py-10 text-center dark:bg-white/[0.02]'

 const sectionLabelClass = 'text-[11px] font-medium text-gray-600 dark:text-gray-400'

 const drawerSectionClass = 'px-3 py-3 sm:px-4'

 const drawerLabelClass = 'mb-1 block text-[11px] font-medium text-gray-600 dark:text-gray-400'

  const drawerInputClass = APP_FIELD_ON_WHITE_CLASS
  const drawerTextareaClass = APP_FIELD_TEXTAREA_CLASS

 const drawerHintClass = 'text-[11px] leading-snug text-gray-500 dark:text-gray-400'

 const footerBtnOutlineClass =
 '!inline-flex !h-9 !min-h-9 !items-center !justify-center !rounded-lg !px-4 !py-0 !text-xs !font-medium'

 const footerBtnPrimaryClass = footerBtnOutlineClass

 return {
 searchInputClass,
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
 }
}
