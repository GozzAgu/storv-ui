<template>
  <SCard flush class="s-overview-chart" data-tutorial="analytics-preview">
    <template #header>
      <div>
        <h2 class="s-card__title">Revenue</h2>
        <p class="s-card__description">{{ subtitle }}</p>
      </div>
    </template>
    <template #actions>
      <STabs v-model="period" :tabs="periodTabs" label="Chart period" />
    </template>

    <div class="s-overview-chart__plot">
      <SEmptyState
        v-if="points.length === 0"
        title="No revenue yet"
        description="Completed sales will appear here."
      >
        <template #icon><ChartArea :size="20" :stroke-width="1.75" /></template>
      </SEmptyState>
      <ClientOnly v-else>
        <LazyApexChart type="area" :height="height" :options="options" :series="series" />
        <template #fallback>
          <div class="s-overview-chart__fallback">
            <SSkeleton :height="`${height}px`" />
          </div>
        </template>
      </ClientOnly>
    </div>
  </SCard>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { ChartArea } from '@lucide/vue'
import SCard from '~/components/s/SCard.vue'
import STabs from '~/components/s/STabs.vue'
import SEmptyState from '~/components/s/SEmptyState.vue'
import SSkeleton from '~/components/s/SSkeleton.vue'
import { useThemeStore } from '~/stores/theme'
import { DS_CHART_PALETTE_FALLBACK, readDsChartPalette, type DsChartPalette } from '~/utils/ds-apex-chart'
import { formatAxisCurrency } from '~/utils/format-compact-currency'

const LazyApexChart = defineAsyncComponent(
  () => import('~/components/charts/LazyApexChart.client.vue')
)

type RevenuePoint = { date: Date; revenue: number }
type Period = 'daily' | 'weekly' | 'monthly'

const props = defineProps<{
  daily: RevenuePoint[]
  weekly: RevenuePoint[]
  monthly: RevenuePoint[]
  currencySymbol: string
}>()

const period = ref<Period>('monthly')
const periodTabs = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
]

const subtitle = computed(() => {
  if (period.value === 'weekly') return 'Last 12 weeks, completed sales'
  if (period.value === 'monthly') return 'Last 12 months, completed sales'
  return 'Last 30 days, completed sales'
})

const points = computed(() => {
  if (period.value === 'weekly') return props.weekly
  if (period.value === 'monthly') return props.monthly.slice(-12)
  return props.daily
})

const series = computed(() => [
  { name: 'Revenue', data: points.value.map((point) => point.revenue) },
])

const categories = computed(() =>
  points.value.map((point, index) => {
    if (period.value === 'weekly') return `W${index + 1}`
    if (period.value === 'monthly') return point.date.toLocaleDateString('en-US', { month: 'short' })
    return point.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  })
)

const compact = ref(false)
let compactQuery: MediaQueryList | null = null
function syncCompact() {
  compact.value = compactQuery?.matches ?? false
}
const height = computed(() => (compact.value ? 200 : 260))

const palette = ref<DsChartPalette>(DS_CHART_PALETTE_FALLBACK)
function readPalette() {
  palette.value = readDsChartPalette(palette.value)
}

const themeStore = useThemeStore()
const isDark = computed(() => themeStore.actualTheme === 'dark')
watch(isDark, () => nextTick(readPalette), { flush: 'post' })

onMounted(() => {
  compactQuery = window.matchMedia('(max-width: 639px)')
  syncCompact()
  compactQuery.addEventListener('change', syncCompact)
  readPalette()
})

onBeforeUnmount(() => {
  compactQuery?.removeEventListener('change', syncCompact)
})

const options = computed(() => {
  const { accent: line, grid, muted: label, font } = palette.value
  const axisLabel = { colors: label, fontSize: '11px', fontWeight: 400 }
  return {
    chart: {
      type: 'area',
      height: height.value,
      toolbar: { show: false },
      zoom: { enabled: false },
      fontFamily: font,
      background: 'transparent',
      animations: { enabled: true, easing: 'easeout', speed: 250 },
    },
    dataLabels: { enabled: false },
    stroke: { curve: 'smooth', width: 2, colors: [line] },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 0,
        colorStops: [
          { offset: 0, color: line, opacity: 0.2 },
          { offset: 100, color: line, opacity: 0 },
        ],
      },
    },
    xaxis: {
      categories: categories.value,
      labels: { style: axisLabel, rotate: 0, hideOverlappingLabels: true, offsetY: 4 },
      tickAmount: period.value === 'daily' || compact.value ? 6 : undefined,
      tickPlacement: 'on',
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      labels: {
        style: axisLabel,
        formatter: (value: number) => formatAxisCurrency(value, props.currencySymbol),
      },
    },
    grid: {
      borderColor: grid,
      strokeDashArray: 0,
      xaxis: { lines: { show: false } },
      yaxis: { lines: { show: true } },
      padding: { top: 0, right: 16, bottom: 8, left: 16 },
    },
    tooltip: {
      theme: isDark.value ? 'dark' : 'light',
      y: {
        formatter: (value: number) =>
          `${props.currencySymbol}${Math.round(value).toLocaleString('en-US')}`,
      },
    },
    colors: [line],
    legend: { show: false },
    markers: { size: 0, hover: { size: 4 } },
  }
})
</script>
