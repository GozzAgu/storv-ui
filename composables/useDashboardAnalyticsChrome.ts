import { useDashboardHomeChrome } from '~/composables/useDashboardHomeChrome'
import { useDashboardPageChrome } from '~/composables/useDashboardPageChrome'
import { useDashboardTableChrome } from '~/composables/useDashboardTableChrome'

/**
 * Analytics page - reuses dashboard home card/grid tokens with analytics-specific layout.
 */
export function useDashboardAnalyticsChrome() {
  const home = useDashboardHomeChrome()
  const page = useDashboardPageChrome()
  const table = useDashboardTableChrome()

  const pageClass = 'dash-analytics'
  const kpiGridWideClass = 'dash-kpi-grid dash-kpi-grid--wide'
  const summaryTextClass = 'dash-summary-text'
  const insightIconClass = 'dash-insight-icon'
  const insightHighlightClass = 'dash-insight-highlight'
  const tableEyebrowClass = 'dash-table-eyebrow'
  const tableMetaClass = 'dash-table-meta'
  const exportBtnSecondaryClass = 'dash-export-btn dash-export-btn--secondary'
  const exportBtnSuccessClass = 'dash-export-btn dash-export-btn--secondary'
  const metricCellsClass = 'dash-metric-cells'
  const metricCellClass = 'dash-metric-cell'

  return {
    ...home,
    ...page,
    ...table,
    pageClass,
    kpiGridWideClass,
    summaryTextClass,
    insightIconClass,
    insightHighlightClass,
    tableEyebrowClass,
    tableMetaClass,
    exportBtnSecondaryClass,
    exportBtnSuccessClass,
    metricCellsClass,
    metricCellClass,
  }
}
