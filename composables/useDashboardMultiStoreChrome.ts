import { useDashboardHomeChrome } from '~/composables/useDashboardHomeChrome'
import { useDashboardPageChrome } from '~/composables/useDashboardPageChrome'
import { useDashboardSettingsChrome } from '~/composables/useDashboardSettingsChrome'
import { useDashboardTableChrome } from '~/composables/useDashboardTableChrome'
import { APP_FIELD_CLASS, APP_FIELD_TEXTAREA_CLASS } from '~/utils/app-chrome'

/**
 * Multi-Store Sync page — dashboard SaaS tokens for transfers, reports, and history.
 */
export function useDashboardMultiStoreChrome() {
  const home = useDashboardHomeChrome()
  const page = useDashboardPageChrome()
  const settings = useDashboardSettingsChrome()
  const table = useDashboardTableChrome()

  const pageClass = 'dash-multi-store'
  const kpiGridCompactClass = 'dash-kpi-grid dash-kpi-grid--compact'
  const tableEyebrowClass = 'dash-table-eyebrow'
  const tableMetaClass = 'dash-table-meta'
  const restrictedClass = 'dash-restricted-card'
  const restrictedIconClass = 'dash-restricted-card__icon'
  const restrictedTitleClass = 'dash-restricted-card__title'
  const restrictedDescClass = 'dash-restricted-card__desc'
  const transferListClass = 'dash-transfer-list'
  const transferCardClass = 'dash-transfer-card'
  const transferRouteClass = 'dash-transfer-card__route'
  const transferMetaClass = 'dash-transfer-card__meta'
  const transferItemClass = 'dash-transfer-card__item'
  const transferActionsClass = 'dash-transfer-card__actions'
  const transferCardActionRowClass = 'dash-transfer-card__action-row'
  const formNoteClass = 'dash-form-note'
  const formActionsClass = 'dash-form-actions'
  const fieldClass = APP_FIELD_CLASS
  const textareaClass = APP_FIELD_TEXTAREA_CLASS
  const exportBtnClass = 'dash-export-btn dash-export-btn--success'
  const itemsTableShellClass = 'dash-items-picker'

  const statusBadgeClass = (status: string) => {
    switch (status) {
      case 'pending_approval':
        return 'dash-status-badge dash-status-badge--pending'
      case 'in_transit':
        return 'dash-status-badge dash-status-badge--transit'
      case 'completed':
      case 'partial':
      case 'completed_partial':
        return 'dash-status-badge dash-status-badge--completed'
      case 'cancelled':
        return 'dash-status-badge dash-status-badge--cancelled'
      default:
        return 'dash-status-badge dash-status-badge--neutral'
    }
  }

  return {
    ...home,
    ...page,
    ...table,
    pageClass,
    kpiGridCompactClass,
    tableEyebrowClass,
    tableMetaClass,
    restrictedClass,
    restrictedIconClass,
    restrictedTitleClass,
    restrictedDescClass,
    transferListClass,
    transferCardClass,
    transferRouteClass,
    transferMetaClass,
    transferItemClass,
    transferActionsClass,
    transferCardActionRowClass,
    formNoteClass,
    formActionsClass,
    fieldClass,
    textareaClass,
    exportBtnClass,
    itemsTableShellClass,
    statusBadgeClass,
    panelClass: settings.panelClass,
    panelHeaderClass: settings.panelHeaderClass,
    panelBodyClass: settings.panelBodyClass,
    sectionTitleClass: settings.sectionTitleClass,
    sectionSubtitleClass: settings.sectionSubtitleClass,
    labelClass: settings.labelClass,
    inlineNoteClass: settings.inlineNoteClass,
  }
}
