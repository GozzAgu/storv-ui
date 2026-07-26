export type DashboardPageMetricTone =
  | 'default'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'

export interface DashboardPageMetric {
  key: string
  label: string
  value: string
  tone?: DashboardPageMetricTone
}
