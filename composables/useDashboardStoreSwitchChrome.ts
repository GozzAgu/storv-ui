/**
 * Shared layout tokens for the dashboard store switcher dropdown.
 */
export function useDashboardStoreSwitchChrome() {
  const triggerClass = 'dash-store-trigger'
  const triggerIconClass = 'dash-store-trigger__icon'
  const triggerIconEmptyClass = 'dash-store-trigger__icon--empty'
  const triggerNameClass = 'dash-store-trigger__name'
  const triggerChevronClass = 'dash-store-trigger__chevron'
  const triggerSpinnerClass = 'dash-store-trigger__spinner'

  const panelClass = 'dash-store-panel'
  const panelSurfaceClass = 'dash-store-panel__surface'
  const panelHeaderClass = 'dash-store-panel__header'
  const panelSectionLabelClass = 'dash-store-section-label'
  const panelScrollClass = 'dash-store-panel__scroll'
  const panelFooterClass = 'dash-store-panel__footer'

  const rowClass = 'dash-store-row'
  const rowActiveClass = 'dash-store-row--active'
  const rowInactiveClass = 'dash-store-row--inactive'
  const rowIconClass = 'dash-store-row__icon'
  const rowNameClass = 'dash-store-row__name'

  const statusActiveClass = 'dash-store-status dash-store-status--active'
  const statusInactiveClass = 'dash-store-status dash-store-status--inactive'

  const footerLinkClass = 'dash-store-footer-link'
  const loadingClass = 'dash-store-loading'
  const emptyClass = 'dash-store-empty'

  return {
    triggerClass,
    triggerIconClass,
    triggerIconEmptyClass,
    triggerNameClass,
    triggerChevronClass,
    triggerSpinnerClass,
    panelClass,
    panelSurfaceClass,
    panelHeaderClass,
    panelSectionLabelClass,
    panelScrollClass,
    panelFooterClass,
    rowClass,
    rowActiveClass,
    rowInactiveClass,
    rowIconClass,
    rowNameClass,
    statusActiveClass,
    statusInactiveClass,
    footerLinkClass,
    loadingClass,
    emptyClass,
  }
}
