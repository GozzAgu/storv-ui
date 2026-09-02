import type { Component } from 'vue'

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
  /** Optional glyph - only rendered by consumers that opt in (e.g. the iOS metric tile). */
  icon?: Component
}
