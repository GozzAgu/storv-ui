import { useDashboardPageChrome } from '~/composables/useDashboardPageChrome'
import { APP_FIELD_CLASS } from '~/utils/app-chrome'

/**
 * Shared layout tokens for Settings, Profile, and similar form-heavy dashboard pages.
 */
export function useDashboardSettingsChrome() {
  const chrome = useDashboardPageChrome()

  const pageClass = 'dash-page dash-page--unified'
  const pageStackClass = 'dash-page-stack'
  const profileGridClass = 'dash-page-grid dash-page-grid--profile'
  const profileSidebarClass = 'dash-page-grid--profile-sidebar lg:sticky lg:top-14 lg:self-start'
  const profileMainClass = 'dash-page-grid--profile-main dash-page-stack'

  const panelClass = 'dash-settings-panel'
  const panelBodyClass = 'dash-settings-panel__body'
  const panelBodyCompactClass = 'dash-settings-panel__body dash-settings-panel__body--compact'
  const panelHeaderClass = 'dash-settings-panel__header'
  const sectionTitleClass = 'dash-settings-panel__title'
  const sectionSubtitleClass = 'dash-settings-panel__subtitle'

  const labelClass = 'dash-field-label'
  const planBadgeClass = 'dash-plan-badge'
  const editLinkClass = 'dash-action-link'
  const cancelLinkClass = 'dash-action-link dash-action-link--cancel'
  const viewOnlyBadgeClass = 'dash-view-only-badge'
  const readonlyValueClass = 'dash-readonly-value'
  const inlineNoteClass = 'dash-inline-note'
  const inlineDividerClass = 'dash-inline-divider'

  function inputClass(editing: boolean) {
    return editing
      ? `${APP_FIELD_CLASS} dark:!bg-dashboard-card/80`
      : `${APP_FIELD_CLASS} cursor-not-allowed opacity-80 dark:!bg-dashboard-card/60`
  }

  const settingRowClass = 'dash-setting-row'
  const settingRowIconClass = 'dash-setting-row__icon'
  const settingRowTitleClass = 'dash-setting-row__title'
  const settingRowDescClass = 'dash-setting-row__desc'

  const storeBranchCardClass = 'dash-branch-card'
  const storeBranchCardActiveClass = 'dash-branch-card dash-branch-card--active'

  const profileCardClass = 'dash-profile-card'
  const profileCardBodyClass = 'dash-profile-card__body'
  const profileAvatarClass = 'dash-profile-card__avatar'
  const profileCardEyebrowClass = 'dash-profile-card__eyebrow'
  const profileCardNameClass = 'dash-profile-card__name'
  const profileCardMetaClass = 'dash-profile-card__meta'
  const profileRoleBadgeClass = 'dash-profile-role-badge'
  const profileStatBarClass = 'dash-profile-stats'
  const profileStatItemClass = 'dash-profile-stats__item'
  const profileStatValueClass = 'dash-profile-stats__value'
  const profileStatLabelClass = 'dash-profile-stats__label'
  const profileStatDividerClass = 'dash-profile-stats__divider'

  return {
    ...chrome,
    pageClass,
    pageStackClass,
    profileGridClass,
    profileSidebarClass,
    profileMainClass,
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
    readonlyValueClass,
    inlineNoteClass,
    inlineDividerClass,
    inputClass,
    settingRowClass,
    settingRowIconClass,
    settingRowTitleClass,
    settingRowDescClass,
    storeBranchCardClass,
    storeBranchCardActiveClass,
    profileCardClass,
    profileCardBodyClass,
    profileAvatarClass,
    profileCardEyebrowClass,
    profileCardNameClass,
    profileCardMetaClass,
    profileRoleBadgeClass,
    profileStatBarClass,
    profileStatItemClass,
    profileStatValueClass,
    profileStatLabelClass,
    profileStatDividerClass,
  }
}
