import { buildIosTextClass } from '~/composables/useIosTypography'

/**
 * Dashboard home page - semantic class names aligned with dashboard-shell SaaS tokens.
 * iOS typography utilities are inert on web (scoped in ios-typography.css).
 */
export function useDashboardHomeChrome() {
  const pageClass = 'dash-home dash-page--unified'
  const cardClass = 'dash-card'
  const cardPaddedClass = 'dash-card dash-card--padded'
  const cardFlushClass = 'dash-card dash-card--flush'

  const pageHeaderClass = 'dash-page-header dash-page-header--unified'
  const eyebrowClass = `dash-eyebrow ${buildIosTextClass('caption', { secondary: true })}`
  const pageTitleClass = `dash-page-title ${buildIosTextClass('large-title')}`
  const pageMetaClass = `dash-page-meta ${buildIosTextClass('footnote', { secondary: true })}`
  const linkClass = 'dash-link'

  const cardHeaderClass = 'dash-card__header'
  const cardTitleClass = `dash-card__title ${buildIosTextClass('headline')}`
  const cardDescClass = `dash-card__desc ${buildIosTextClass('footnote', { secondary: true })}`
  const cardLinkClass = `dash-card__link ${buildIosTextClass('subheadline')}`

  const kpiGridClass = 'dash-kpi-grid'
  const chartsGridClass = 'dash-charts-grid'
  const splitGridClass = 'dash-split-grid'
  const tripleGridClass = 'dash-triple-grid'

  const alertListClass = 'dash-alerts'
  const progressClass = 'dash-progress'
  const progressLegendClass = 'dash-progress__legend'

  const segmentGroupClass = 'dash-segment-tabs'
  const segmentBtnClass = 'dash-segment-tabs__btn'
  const segmentBtnActiveClass = 'dash-segment-tabs__btn--active'

  const listClass = 'dash-list'
  const listRowClass = 'dash-list__row'

  const metricGridClass = 'dash-metric-grid'
  const metricRowClass = 'dash-metric-row'

  const barListClass = 'dash-bar-list'
  const barRowClass = 'dash-bar-row'
  const barTrackClass = 'dash-bar'
  const barFillClass = 'dash-bar__fill'

  const numClass = `dash-num ${buildIosTextClass('body-emphasized', { tabular: true })}`
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
