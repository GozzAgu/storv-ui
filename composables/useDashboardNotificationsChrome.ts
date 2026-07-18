/**
 * Shared layout tokens for the dashboard notifications panel / dropdown.
 */
export function useDashboardNotificationsChrome() {
  const panelClass = 'dash-notify-panel'
  const panelDropdownClass = 'dash-notify-panel dash-notify-panel--dropdown'

  const headerClass = 'dash-notify-panel__header'
  const titleClass = 'dash-notify-panel__title'
  const headerActionClass = 'dash-notify-panel__action'
  const headerLinkClass = 'dash-notify-panel__link'

  const tabsClass = 'dash-notify-panel__tabs'
  const tabClass = 'dash-notify-tab'
  const tabActiveClass = 'dash-notify-tab--active'
  const tabBadgeClass = 'dash-notify-tab__badge'

  const bodyClass = 'dash-notify-panel__body'
  const listClass = 'dash-notify-list'
  const itemClass = 'dash-notify-item'
  const itemUnreadClass = 'dash-notify-item--unread'
  const itemAvatarClass = 'dash-notify-item__avatar'
  const itemContentClass = 'dash-notify-item__content'
  const itemTitleClass = 'dash-notify-item__title'
  const itemMessageClass = 'dash-notify-item__message'
  const itemTimeClass = 'dash-notify-item__time'
  const itemDotClass = 'dash-notify-item__dot'

  const emptyClass = 'dash-notify-empty'
  const emptyIconClass = 'dash-notify-empty__icon'
  const emptyTitleClass = 'dash-notify-empty__title'
  const emptyDescClass = 'dash-notify-empty__desc'

  const footerClass = 'dash-notify-panel__footer'
  const footerActionClass = 'dash-notify-panel__footer-action'

  const skeletonListClass = 'dash-notify-skeleton-list'
  const skeletonRowClass = 'dash-notify-skeleton-row'

  return {
    panelClass,
    panelDropdownClass,
    headerClass,
    titleClass,
    headerActionClass,
    headerLinkClass,
    tabsClass,
    tabClass,
    tabActiveClass,
    tabBadgeClass,
    bodyClass,
    listClass,
    itemClass,
    itemUnreadClass,
    itemAvatarClass,
    itemContentClass,
    itemTitleClass,
    itemMessageClass,
    itemTimeClass,
    itemDotClass,
    emptyClass,
    emptyIconClass,
    emptyTitleClass,
    emptyDescClass,
    footerClass,
    footerActionClass,
    skeletonListClass,
    skeletonRowClass,
  }
}
