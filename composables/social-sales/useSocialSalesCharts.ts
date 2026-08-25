import { computed, type Ref } from 'vue'
import { apexTheme } from '~/utils/analytics-charts'
import { socialPlatformLabel } from '~/types/social-sales'
import type { SocialSalesAnalytics } from '~/composables/social-sales/useSocialSalesMetrics'

export function useSocialSalesCharts(
  analytics: Ref<SocialSalesAnalytics>,
  isDark: Ref<boolean>,
  formatCurrency: (n: number) => string
) {
  const theme = computed(() => apexTheme(isDark.value))

  const leadsByPlatformSeries = computed(() =>
    analytics.value.leadsByPlatform.map((row) => row.count)
  )

  const leadsByPlatformLabels = computed(() =>
    analytics.value.leadsByPlatform.map((row) => socialPlatformLabel(row.platform))
  )

  const leadsByPlatformOptions = computed(() => ({
    chart: { toolbar: { show: false }, fontFamily: 'inherit' },
    labels: leadsByPlatformLabels.value,
    legend: { position: 'bottom' as const, labels: { colors: theme.value.muted } },
    colors: ['#25D366', '#E1306C', '#4876c7', '#f59e0b', '#6b7280'],
    dataLabels: { enabled: true },
    theme: { mode: isDark.value ? ('dark' as const) : ('light' as const) },
  }))

  const revenueByPlatformSeries = computed(() => [
    {
      name: 'Revenue',
      data: analytics.value.revenueByPlatform.map((row) => row.revenue),
    },
  ])

  const revenueByPlatformOptions = computed(() => ({
    chart: { toolbar: { show: false }, fontFamily: 'inherit' },
    plotOptions: { bar: { borderRadius: 4, horizontal: true } },
    xaxis: {
      categories: analytics.value.revenueByPlatform.map((row) =>
        socialPlatformLabel(row.platform)
      ),
      labels: { style: { colors: theme.value.muted }, formatter: (v: string) => formatCurrency(Number(v)) },
    },
    yaxis: { labels: { style: { colors: theme.value.muted } } },
    grid: { borderColor: theme.value.grid },
    colors: ['#4876c7'],
    dataLabels: { enabled: false },
    theme: { mode: isDark.value ? ('dark' as const) : ('light' as const) },
  }))

  const conversionSeries = computed(() => [
    {
      name: 'Conversion %',
      data: analytics.value.monthlyConversion.map((row) => row.rate),
    },
  ])

  const conversionOptions = computed(() => ({
    chart: { toolbar: { show: false }, fontFamily: 'inherit' },
    stroke: { curve: 'smooth' as const, width: 2 },
    xaxis: {
      categories: analytics.value.monthlyConversion.map((row) => row.month),
      labels: { style: { colors: theme.value.muted } },
    },
    yaxis: {
      labels: {
        style: { colors: theme.value.muted },
        formatter: (v: number) => `${v}%`,
      },
      max: 100,
    },
    grid: { borderColor: theme.value.grid },
    colors: ['#10b981'],
    theme: { mode: isDark.value ? ('dark' as const) : ('light' as const) },
  }))

  return {
    leadsByPlatformSeries,
    leadsByPlatformOptions,
    revenueByPlatformSeries,
    revenueByPlatformOptions,
    conversionSeries,
    conversionOptions,
  }
}
