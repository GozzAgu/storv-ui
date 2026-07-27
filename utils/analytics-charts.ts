/** Shared ApexCharts helpers for analytics dashboards. */

export function truncateChartLabel(text: string, maxLen = 16): string {
  const t = String(text ?? '').trim()
  if (t.length <= maxLen) return t
  return `${t.slice(0, maxLen - 1)}…`
}

/** Avoid Infinity when dividing by zero stock value. */
export function safeTurnoverPercent(sales: number, stockValue: number, cap = 999): number {
  if (!Number.isFinite(sales) || sales <= 0) return 0
  if (!Number.isFinite(stockValue) || stockValue <= 0) return Math.min(cap, 100)
  return Math.min(cap, Math.round((sales / stockValue) * 1000) / 10)
}

export function apexTheme(isDark: boolean) {
  return {
    text: isDark ? '#F3F4F6' : '#111827',
    muted: isDark ? '#9CA3AF' : '#6B7280',
    border: isDark ? '#374151' : '#E5E7EB',
    grid: isDark ? '#1f2937' : '#F3F4F6',
  }
}

/** Compact currency labels for chart axes (avoids ₦300,000,000.00 clutter). */
export function createChartCurrencyAxisFormatter(
  formatCurrency: (amount: number) => string,
  _currencyCode: string,
  _locale = 'en-US'
) {
  return (val: number) => {
    if (!Number.isFinite(val)) return '-'
    return formatCurrency(val)
  }
}

export function sparseCategoryLabels(labels: string[], everyNth: number): string[] {
  return labels.map((label, i) => (i % everyNth === 0 ? label : ''))
}
