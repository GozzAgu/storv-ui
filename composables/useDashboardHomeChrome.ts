/**
 * Dashboard home page - semantic class names aligned with dashboard-shell SaaS tokens.
 */
export function useDashboardHomeChrome() {
  const pageClass = 'dash-home'
  const cardClass = 'dash-card'
  const cardPaddedClass = 'dash-card dash-card--padded'
  const cardFlushClass = 'dash-card dash-card--flush'

  const pageHeaderClass = 'dash-page-header'
  const eyebrowClass = 'dash-eyebrow'
  const pageTitleClass = 'dash-page-title'
  const pageMetaClass = 'dash-page-meta'
  const linkClass = 'dash-link'

  const cardHeaderClass = 'dash-card__header'
  const cardTitleClass = 'dash-card__title'
  const cardDescClass = 'dash-card__desc'
  const cardLinkClass = 'dash-card__link'

  const kpiGridClass = 'dash-kpi-grid'
  const chartsGridClass = 'dash-charts-grid'
  const splitGridClass = 'dash-split-grid'
  const tripleGridClass = 'dash-triple-grid'

  const alertListClass = 'dash-alerts'
  const progressClass = 'dash-progress'
  const progressLegendClass = 'dash-progress__legend'

  const segmentGroupClass = 'dash-segment'
  const segmentBtnClass = 'dash-segment__btn'
  const segmentBtnActiveClass = 'dash-segment__btn--active'

  const listClass = 'dash-list'
  const listRowClass = 'dash-list__row'

  const metricGridClass = 'dash-metric-grid'
  const metricRowClass = 'dash-metric-row'

  const barListClass = 'dash-bar-list'
  const barRowClass = 'dash-bar-row'
  const barTrackClass = 'dash-bar'
  const barFillClass = 'dash-bar__fill'

  const numClass = 'dash-num'
  const emptyClass = 'dash-empty'
  const stateCardClass = 'dash-state-card'

  const alertClass = (level: 'critical' | 'warning' | 'info') => {
    if (level === 'critical') return 'dash-alert dash-alert--critical'
    if (level === 'warning') return 'dash-alert dash-alert--warning'
    return 'dash-alert dash-alert--info'
  }

  return {
    pageClass,
    cardClass,
    cardPaddedClass,
    cardFlushClass,
    pageHeaderClass,
    eyebrowClass,
    pageTitleClass,
    pageMetaClass,
    linkClass,
    cardHeaderClass,
    cardTitleClass,
    cardDescClass,
    cardLinkClass,
    kpiGridClass,
    chartsGridClass,
    splitGridClass,
    tripleGridClass,
    alertListClass,
    progressClass,
    progressLegendClass,
    segmentGroupClass,
    segmentBtnClass,
    segmentBtnActiveClass,
    listClass,
    listRowClass,
    metricGridClass,
    metricRowClass,
    barListClass,
    barRowClass,
    barTrackClass,
    barFillClass,
    numClass,
    emptyClass,
    stateCardClass,
    alertClass,
  }
}
