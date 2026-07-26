import { useDashboardHomeChrome } from '~/composables/useDashboardHomeChrome'
import { useDashboardPageChrome } from '~/composables/useDashboardPageChrome'
import { useDashboardTableChrome } from '~/composables/useDashboardTableChrome'

/**
 * Grid-heavy dashboard pages - inventory categories, departments, similar directory views.
 */
export function useDashboardGridPagesChrome() {
  const home = useDashboardHomeChrome()
  const page = useDashboardPageChrome()
  const table = useDashboardTableChrome()

  const pageClass = 'dash-grid-page'
  const pageWithFooterClass =
    'dash-grid-page dashboard-page-with-footer flex min-h-[calc(100svh-4rem)] flex-1 flex-col pb-[calc(6.5rem+env(safe-area-inset-bottom,0px))] sm:pb-32'
  const kpiGridClass = 'dash-kpi-grid'
  const gridShellClass = 'dash-grid-shell'
  const gridClass = 'dash-grid'
  const gridFooterClass = 'dash-grid-footer'
  const toolbarTitleClass = 'dash-card__title'
  const toolbarDescClass = 'dash-card__desc'
  const menuBtnClass = 'dash-grid-menu-btn'
  const errorCardClass = 'dash-error-card'
  const viewToggleClass = 'dash-view-toggle'
  const viewToggleBtnClass = 'dash-view-toggle__btn'
  const viewToggleBtnActiveClass = 'dash-view-toggle__btn--active'

  return {
    ...home,
    ...page,
    ...table,
    pageClass,
    pageWithFooterClass,
    kpiGridClass,
    gridShellClass,
    gridClass,
    gridFooterClass,
    toolbarTitleClass,
    toolbarDescClass,
    menuBtnClass,
    errorCardClass,
    viewToggleClass,
    viewToggleBtnClass,
    viewToggleBtnActiveClass,
  }
}
