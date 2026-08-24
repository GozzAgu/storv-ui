<template>
  <div :class="pageClass">
    <DashboardPageHeader class="dash-page-header--unified">
      <template #eyebrow>
        <p :class="eyebrowClass">Analytics</p>
      </template>
      <template #title>
        <h1 :class="pageTitleClass">Analytics & Reports</h1>
      </template>
      <template #actions>
        <div :class="segmentGroupClass" role="group" aria-label="Analytics period">
          <button
            v-for="period in analyticsPeriods"
            :key="period.value"
            type="button"
            :class="[segmentBtnClass, selectedPeriod === period.value ? segmentBtnActiveClass : '']"
            @click="
              () => {
                selectedPeriod = period.value
                loadAnalytics()
              }
            "
          >
            {{ period.label }}
          </button>
        </div>
        <button
          type="button"
          :disabled="isExporting"
          :class="exportBtnSecondaryClass"
          @click="exportReport('pdf')"
        >
          <ArrowDownTrayIcon class="h-4 w-4 opacity-70" />
          <span>{{ isExporting ? 'Exporting…' : 'Export PDF' }}</span>
        </button>
        <button
          type="button"
          :disabled="isExporting"
          :class="exportBtnSuccessClass"
          @click="exportReport('excel')"
        >
          <ArrowDownTrayIcon class="h-4 w-4 opacity-80" />
          <span>{{ isExporting ? 'Exporting…' : 'Export Excel' }}</span>
        </button>
      </template>
    </DashboardPageHeader>

    <template v-if="isLoading">
      <div :class="kpiGridWideClass">
        <div v-for="i in 6" :key="i" class="dash-skeleton dash-skeleton--kpi" />
      </div>
      <div :class="chartsGridClass">
        <div class="dash-skeleton dash-skeleton--panel dash-charts-grid__main" />
        <div class="dash-skeleton dash-skeleton--panel dash-charts-grid__side" />
      </div>
      <div :class="splitGridClass">
        <div v-for="i in 2" :key="`panel-${i}`" class="dash-skeleton dash-skeleton--panel" />
      </div>
    </template>

    <template v-else-if="needsStoreSelection">
      <div :class="stateCardClass">
        <BuildingStorefrontIcon
          class="mx-auto mb-3 h-8 w-8 text-[#4876c7] dark:text-[#9ab5e3]"
          stroke-width="1.5"
        />
        <p :class="['dash-state-card__title', pageTitleClass, '!text-sm']">
          Select a store to view analytics
        </p>
        <p :class="['dash-state-card__desc', cardDescClass]">
          Choose a branch below or from the store selector in the top bar. Charts and reports are
          scoped to the active store.
        </p>
        <InlineStorePicker />
        <NuxtLink to="/dashboard/settings" :class="[linkClass, 'mt-4 inline-block']">
          Manage stores in Settings
        </NuxtLink>
      </div>
    </template>

    <PlanUpgradePrompt
      v-else-if="!canUseSubscriptionFeature('analytics')"
      feature="analytics"
      title="Analytics is on Medium and Enterprise"
      description="Upgrade to unlock period comparisons, exports, and product-level charts for your store."
      :title-class="pageTitleClass"
      :desc-class="cardDescClass"
    />

    <template v-else>
      <section class="dash-analytics-kpi-panel">
        <header class="dash-analytics-kpi-panel__intro">
          <p class="dash-analytics-kpi-panel__eyebrow">{{ periodLabel }}</p>
          <p v-if="analyticsSummary" class="dash-analytics-kpi-panel__summary">
            {{ analyticsSummary }}
          </p>
        </header>
        <DashboardPageMetrics
          metrics-class="dash-page-metrics--analytics"
          :metrics="analyticsHeaderMetrics"
          aria-label="Analytics summary"
        />
      </section>

      <section :class="[cardPaddedClass, 'dash-inventory-health']">
        <div :class="[cardHeaderClass, 'dash-card__header--compact dash-inventory-health__header']">
          <div>
            <p :class="eyebrowClass">Inventory health</p>
            <p :class="cardDescClass">
              <span :class="numClass">{{ featureInStockCount }}</span> available units ·
              <span :class="numClass">{{ featureOutOfStockCount }}</span> sold ·
              <span :class="numClass">{{ featureLowStockItems.length }}</span> low-stock lines
            </p>
          </div>
          <NuxtLink to="/dashboard/inventory" :class="cardLinkClass">Open inventory</NuxtLink>
        </div>
        <div class="dash-inventory-health__footer">
          <div :class="[progressClass, 'dash-progress--slim']">
            <div
              class="dash-progress__segment--available transition-all"
              :style="{ width: `${featureInStockPercentage}%` }"
            />
            <div
              class="dash-progress__segment--low transition-all"
              :style="{ width: `${featureLowStockPercentage}%` }"
            />
            <div
              class="dash-progress__segment--sold transition-all"
              :style="{ width: `${featureSoldPercentage}%` }"
            />
          </div>
          <div :class="[progressLegendClass, 'dash-progress__legend--compact']">
            <span :class="numClass">{{ featureInStockPercentage }}% available</span>
            <span :class="numClass">{{ featureSoldPercentage }}% sold through</span>
            <span :class="numClass">{{ formatCurrency(featureInventoryTotalValue) }} on hand (book)</span>
          </div>
        </div>
      </section>

      <section>
        <div :class="[cardHeaderClass, 'dash-card__header--compact mb-3 px-0.5']">
          <div>
            <p :class="eyebrowClass">Feature insights</p>
            <p :class="cardDescClass">
              Snapshot across sales, inventory, customers, and add-on features ·
              {{ periodLabel.toLowerCase() }}
            </p>
          </div>
        </div>
        <div :class="featureInsightsGridClass">
          <AnalyticsFeatureInsightCard
            v-for="insight in featureInsights"
            :key="insight.id"
            :insight="insight"
            :card-class="cardPaddedClass"
            :card-header-class="cardHeaderClass"
            :card-title-class="cardTitleClass"
            :card-desc-class="cardDescClass"
            :card-link-class="cardLinkClass"
            :insight-icon-class="insightIconClass"
            :insight-highlight-class="insightHighlightClass"
            :metric-cells-class="metricCellsClass"
            :metric-cell-class="metricCellClass"
            :num-class="numClass"
          />
        </div>
      </section>

      <div :class="chartsGridClass">
        <section :class="[cardFlushClass, 'dash-charts-grid__main overflow-hidden']">
          <div
            :class="[
              cardHeaderClass,
              'dash-card__header--compact !mb-0 border-b px-4 py-3 sm:flex-row sm:items-center',
            ]"
          >
            <div>
              <h2 :class="cardTitleClass">Revenue trends</h2>
              <p :class="cardDescClass">{{ periodLabel }}</p>
            </div>
          </div>
          <div :class="['dash-chart-wrap dash-chart-wrap--tall']">
            <LazyApexChart
              type="line"
              height="300"
              :options="revenueChartOptions"
              :series="revenueChartSeries"
            />
          </div>
        </section>

        <section :class="[cardPaddedClass, 'dash-charts-grid__side flex flex-col']">
          <h2 :class="cardTitleClass">Top products</h2>
          <p :class="cardDescClass">Share of revenue (top 5)</p>
          <div class="mt-2 flex-1">
            <LazyApexChart
              type="donut"
              height="300"
              :options="topProductsChartOptions"
              :series="topProductsChartSeries"
            />
          </div>
        </section>
      </div>

      <div :class="splitGridClass">
        <section :class="cardPaddedClass">
          <div :class="[cardHeaderClass, 'dash-card__header--compact']">
            <div>
              <h2 :class="cardTitleClass">Sales by category</h2>
              <p :class="cardDescClass">
                Top folders in {{ periodLabel.toLowerCase() }} (max 8)
              </p>
            </div>
            <NuxtLink to="/dashboard/inventory" :class="cardLinkClass">Inventory</NuxtLink>
          </div>
          <div v-if="topFoldersBySales.length === 0" :class="emptyClass">
            No category sales in this period.
          </div>
          <LazyApexChart
            v-else
            type="bar"
            :height="Math.max(240, topFoldersBySales.length * 40)"
            :options="categorySalesChartOptions"
            :series="categorySalesChartSeries"
          />
        </section>

        <section :class="cardPaddedClass">
          <div :class="[cardHeaderClass, 'dash-card__header--compact']">
            <div>
              <h2 :class="cardTitleClass">Top customers</h2>
              <p :class="cardDescClass">
                By spend · {{ repeatPurchaseRate.toFixed(0) }}% repeat purchase rate
              </p>
            </div>
          </div>
          <div v-if="customerChartCustomers.length === 0" :class="emptyClass">
            No customer emails on sales in this period.
          </div>
          <LazyApexChart
            v-else
            type="bar"
            :height="Math.max(220, customerChartCustomers.length * 44)"
            :options="customerChartOptions"
            :series="customerChartSeries"
          />
        </section>
      </div>

      <section v-if="paymentMethodBreakdown.length > 0" :class="cardPaddedClass">
        <div :class="[cardHeaderClass, 'dash-card__header--compact']">
          <div>
            <h2 :class="cardTitleClass">Payment methods</h2>
            <p :class="cardDescClass">Completed sales by tender type</p>
          </div>
        </div>
        <ul :class="barListClass">
          <li v-for="row in paymentMethodBreakdown.slice(0, 6)" :key="row.label">
            <div :class="['dash-bar-row__head', numClass]">
              <span :class="['dash-bar-row__label', cardTitleClass, '!text-xs']">{{ row.label }}</span>
              <span :class="['dash-bar-row__meta', numClass]">
                {{ row.share }}% · {{ formatCurrency(row.revenue) }}
              </span>
            </div>
            <div :class="barTrackClass">
              <div :class="barFillClass" :style="{ width: `${Math.max(row.share, 3)}%` }" />
            </div>
          </li>
        </ul>
      </section>

      <div :class="tripleGridClass">
        <section :class="cardPaddedClass">
          <div class="flex items-start gap-2.5">
            <div :class="insightIconClass">
              <ClockIcon class="h-4 w-4" stroke-width="1.75" />
            </div>
            <div class="min-w-0">
              <h2 :class="cardTitleClass">Peak hours</h2>
              <p :class="cardDescClass">{{ periodLabel }}</p>
            </div>
          </div>
          <p :class="[insightHighlightClass, numClass]">{{ busiestTimeSummary }}</p>
          <dl :class="metricCellsClass">
            <div :class="metricCellClass">
              <dt>Best day</dt>
              <dd :class="numClass">{{ busiestDayName ?? '-' }}</dd>
              <dd :class="numClass">{{ formatCurrency(peakDayRevenue) }}</dd>
            </div>
            <div :class="metricCellClass">
              <dt>Best hour</dt>
              <dd :class="numClass">{{ busiestHourLabel ?? '-' }}</dd>
              <dd :class="numClass">{{ formatCurrency(peakHourRevenue) }}</dd>
            </div>
          </dl>
        </section>

        <section :class="[cardPaddedClass, 'dash-triple-grid__wide']">
          <div :class="[cardHeaderClass, 'dash-card__header--compact']">
            <div>
              <h2 :class="cardTitleClass">Sales by hour</h2>
              <p :class="cardDescClass">Revenue by hour of day · hover for order count</p>
            </div>
          </div>
          <LazyApexChart
            type="bar"
            height="260"
            :options="peakHoursChartOptions"
            :series="peakHoursChartSeries"
          />
        </section>
      </div>

      <div :class="splitGridClass">
        <section :class="cardPaddedClass">
          <div :class="[cardHeaderClass, 'dash-card__header--compact']">
            <div>
              <h2 :class="cardTitleClass">Sales by day of week</h2>
              <p :class="cardDescClass">Best and worst days</p>
            </div>
          </div>
          <LazyApexChart
            type="bar"
            height="250"
            :options="salesByDayChartOptions"
            :series="salesByDayChartSeries"
          />
        </section>

        <section :class="cardPaddedClass">
          <div :class="[cardHeaderClass, 'dash-card__header--compact']">
            <div>
              <h2 :class="cardTitleClass">Traffic heatmap</h2>
              <p :class="cardDescClass">Revenue by day × hour</p>
            </div>
          </div>
          <LazyApexChart
            type="heatmap"
            height="280"
            :options="heatmapChartOptions"
            :series="heatmapSeries"
          />
        </section>
      </div>

      <PaymentLinksSummaryCard
        v-if="canUseSubscriptionFeature('payment_links')"
        card-class="dash-card dash-card--padded"
        :limit="6"
      />

      <div :class="tripleGridClass">
        <div :class="[tableShellClass, 'flex min-h-0 flex-col overflow-hidden']">
          <DataTableToolbar native-table-key="analytics-top-products">
            <template #heading>
              <div class="min-w-0">
                <p :class="tableEyebrowClass">Top products</p>
                <p :class="tableMetaClass">{{ periodLabel }}</p>
              </div>
            </template>
          </DataTableToolbar>
          <div class="overflow-x-auto px-3 pb-3 sm:px-4">
            <table class="dashboard-table min-w-full">
              <thead>
                <tr>
                  <th class="text-left">Product</th>
                  <th class="text-right">Qty</th>
                  <th class="text-right">Revenue</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(product, i) in topProducts" :key="product.id">
                  <td class="py-1.5 pr-2">
                    <span :class="['inline-block w-4 text-[10px]', numClass]">{{ i + 1 }}</span>
                    <span class="truncate">{{ product.name }}</span>
                  </td>
                  <td class="py-1.5 px-2 text-right" :class="numClass">{{ product.quantity }}</td>
                  <td class="py-1.5 pl-2 text-right" :class="tableMoneyClass()">
                    {{ formatCurrency(product.revenue) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div :class="[tableShellClass, 'flex min-h-0 flex-col overflow-hidden']">
          <DataTableToolbar native-table-key="analytics-top-customers">
            <template #heading>
              <div class="min-w-0">
                <p :class="tableEyebrowClass">Top customers</p>
                <p :class="tableMetaClass">{{ periodLabel }}</p>
              </div>
            </template>
          </DataTableToolbar>
          <div class="overflow-x-auto px-3 pb-3 sm:px-4">
            <table class="dashboard-table min-w-full">
              <thead>
                <tr>
                  <th class="text-left">Customer</th>
                  <th class="text-right">Orders</th>
                  <th class="text-right">Spent</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(customer, i) in topCustomers" :key="customer.email">
                  <td class="py-1.5 pr-2">
                    <span :class="['inline-block w-4 text-[10px]', numClass]">{{ i + 1 }}</span>
                    <div>
                      <span class="font-medium">{{ customer.name }}</span>
                      <span :class="['block max-w-[140px] truncate text-[10px]', tableMetaClass]">
                        {{ customer.email }}
                      </span>
                    </div>
                  </td>
                  <td class="py-1.5 px-2 text-right" :class="numClass">{{ customer.orders }}</td>
                  <td class="py-1.5 pl-2 text-right" :class="tableMoneyClass()">
                    {{ formatCurrency(customer.totalSpent) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div :class="[tableShellClass, 'flex min-h-0 flex-col overflow-hidden']">
          <DataTableToolbar native-table-key="analytics-recent-returns">
            <template #heading>
              <div class="min-w-0">
                <p :class="tableEyebrowClass">Recent returns</p>
                <p :class="tableMetaClass">{{ periodLabel }}</p>
              </div>
            </template>
          </DataTableToolbar>
          <div class="overflow-x-auto px-3 pb-3 sm:px-4">
            <table class="dashboard-table min-w-full">
              <thead>
                <tr>
                  <th class="text-left">Sale</th>
                  <th class="text-left">Date</th>
                  <th class="text-right">Amount</th>
                  <th class="text-left">Reason</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="ret in recentReturns" :key="ret.id">
                  <td class="py-1.5 pr-2 font-medium">{{ ret.receiptNumber }}</td>
                  <td class="py-1.5 px-2" :class="numClass">{{ formatReturnDate(ret.date) }}</td>
                  <td class="py-1.5 px-2 text-right font-medium text-red-600 dark:text-red-400">
                    -{{ formatCurrency(ret.amount) }}
                  </td>
                  <td class="max-w-[100px] truncate py-1.5 pl-2">
                    {{ ret.reason }}
                  </td>
                </tr>
                <tr v-if="recentReturns.length === 0">
                  <td colspan="4" :class="['py-3 text-center', emptyClass]">
                    No returns in this period
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div :class="[tableShellClass, 'flex min-h-0 flex-col overflow-hidden']">
        <DataTableToolbar native-table-key="analytics-low-stock">
          <template #heading>
            <div class="min-w-0">
              <p :class="tableEyebrowClass">Low stock</p>
              <p :class="tableMetaClass">Items at or below threshold</p>
            </div>
          </template>
          <template #actions>
            <div class="flex items-center gap-3">
              <button
                v-if="lowStockItems.length > 0"
                type="button"
                :class="cardLinkClass"
                :disabled="reorderExporting"
                @click="handleExportReorderList"
              >
                {{ reorderExporting ? 'Exporting…' : 'Export reorder list' }}
              </button>
              <NuxtLink to="/dashboard/inventory" :class="cardLinkClass">View inventory</NuxtLink>
            </div>
          </template>
        </DataTableToolbar>
        <div class="px-3 pb-3 sm:px-4">
          <ul v-if="lowStockItems.length > 0" :class="listClass">
            <li v-for="item in lowStockItems" :key="item.id">
              <NuxtLink
                :to="item.folderId ? `/dashboard/inventory/${item.folderId}` : '/dashboard/inventory'"
                :class="listRowClass"
              >
                <div class="min-w-0 flex-1">
                  <p :class="['dash-list__primary', 'truncate']">{{ item.name }}</p>
                  <p :class="['dash-list__secondary', numClass]">
                    {{ item.folderName
                    }}<span v-if="item.itemCount > 1"> · {{ item.itemCount }} items</span>
                  </p>
                </div>
                <span :class="['dash-list__value text-amber-600 dark:text-amber-400', numClass]">
                  {{ item.quantity }}/{{ item.threshold }}
                </span>
              </NuxtLink>
            </li>
          </ul>
          <p v-else :class="emptyClass">All stocked</p>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, defineAsyncComponent } from 'vue'

const LazyApexChart = defineAsyncComponent(
  () => import('~/components/charts/LazyApexChart.client.vue')
)
import {
  ArrowDownTrayIcon,
  BuildingStorefrontIcon,
  ClockIcon,
} from '~/utils/app-icons'
import { useReceiptsStore } from '~/stores/receipts'
import { useInventoryStore } from '~/stores/inventory'
import { useCustomersStore } from '~/stores/customers'
import { useDepartmentsStore } from '~/stores/departments'
import { useCustomerBuybacksStore } from '~/stores/customerBuybacks'
import { useSellerLoanOutsStore } from '~/stores/sellerLoanOuts'
import { useCustomerAccountsStore } from '~/stores/customerAccounts'
import { useAuthStore } from '~/stores/auth'
import { useUserStore } from '~/stores/user'
import { useThemeStore } from '~/stores/theme'
import { usePreferences } from '~/composables/usePreferences'
import { useAppToast } from '~/composables/useAppToast'
import DataTableToolbar from '~/components/ui/DataTableToolbar.vue'
import PaymentLinksSummaryCard from '~/components/payments/PaymentLinksSummaryCard.vue'
import InlineStorePicker from '~/components/dashboard/InlineStorePicker.vue'
import PlanUpgradePrompt from '~/components/subscription/PlanUpgradePrompt.vue'
import AnalyticsFeatureInsightCard from '~/components/analytics/AnalyticsFeatureInsightCard.vue'
import { useAnalyticsFeatureInsights } from '~/composables/useAnalyticsFeatureInsights'
import { tableMoneyClass } from '~/utils/table-money-styles'
import {
  truncateChartLabel,
  safeTurnoverPercent,
  apexTheme,
  createChartCurrencyAxisFormatter,
} from '~/utils/analytics-charts'
import type { InventoryItem } from '~/stores/inventory'
import {
  formatMarginPercent,
  receiptLineRevenue,
  sumReceiptCogs,
  sumReceiptGrossProfit,
} from '~/utils/inventory-item-cost'

const { canViewProfitAndCost } = usePermissions()

definePageMeta({
  layout: 'dashboard',
})

useHead({
  title: 'Analytics & Reports - Storvv',
})

const { formatCurrency, preferences, baseCurrency, initialize: initPreferences } = usePreferences()

const chartLocale = computed(() =>
  preferences.value.region === 'NG'
    ? 'en-NG'
    : preferences.value.language === 'fr'
    ? 'fr-FR'
    : 'en-US'
)

const chartCurrencyAxis = computed(() =>
  createChartCurrencyAxisFormatter(
    formatCurrency,
    preferences.value.currency || 'USD',
    chartLocale.value
  )
)
const toast = useAppToast()
const { exporting: reorderExporting, exportReorderListExcel } = useReorderListExport()

async function handleExportReorderList() {
  try {
    const { count } = await exportReorderListExcel()
    toast.success(`Reorder list exported (${count} ${count === 1 ? 'line' : 'lines'})`)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Export failed'
    toast.error(message)
  }
}

/** ApexCharts stores formatters built in computed runs; read prefs during eval so options refresh when profile currency/base changes */
const displayCurrencyDeps = computed(
  () => `${preferences.value.currency}|${preferences.value.region}|${baseCurrency.value}`
)

function formatReturnDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
const receiptsStore = useReceiptsStore()
const inventoryStore = useInventoryStore()
const customersStore = useCustomersStore()
const departmentsStore = useDepartmentsStore()
const buybacksStore = useCustomerBuybacksStore()
const sellerLoansStore = useSellerLoanOutsStore()
const customerAccountsStore = useCustomerAccountsStore()
const userStore = useUserStore()
const themeStore = useThemeStore()
const { canUse: canUseSubscriptionFeature } = useSubscriptionFeatures()

// State
const isLoading = ref(true)
const isExporting = ref(false)
const {
  pageClass,
  eyebrowClass,
  pageTitleClass,
  descriptionClass,
  linkClass,
  cardPaddedClass,
  cardFlushClass,
  cardHeaderClass,
  cardTitleClass,
  cardDescClass,
  cardLinkClass,
  kpiGridWideClass,
  chartsGridClass,
  splitGridClass,
  tripleGridClass,
  segmentGroupClass,
  segmentBtnClass,
  segmentBtnActiveClass,
  metricGridClass,
  metricRowClass,
  barListClass,
  barTrackClass,
  barFillClass,
  listClass,
  listRowClass,
  numClass,
  emptyClass,
  stateCardClass,
  insightIconClass,
  insightHighlightClass,
  tableShellClass,
  tableEyebrowClass,
  tableMetaClass,
  exportBtnSecondaryClass,
  exportBtnSuccessClass,
  metricCellsClass,
  metricCellClass,
  featureInsightsGridClass,
  progressClass,
  progressLegendClass,
} = useDashboardAnalyticsChrome()

const analyticsPeriods = [
  { value: 'daily' as const, label: 'Daily' },
  { value: 'weekly' as const, label: 'Weekly' },
  { value: 'monthly' as const, label: 'Monthly' },
]

const selectedPeriod = ref<'daily' | 'weekly' | 'monthly'>('monthly')

const needsStoreSelection = computed(() => {
  const msg = (receiptsStore.error || inventoryStore.error || '').toLowerCase()
  return msg.includes('no store selected') || msg.includes('select a store')
})

// Analytics Data
const receipts = ref<any[]>([])
const inventoryItems = ref<any[]>([])
const customers = ref<any[]>([])
const analyticsFolderItems = ref<Record<string, InventoryItem[]>>({})

const {
  featureInsights,
  inStockCount: featureInStockCount,
  outOfStockCount: featureOutOfStockCount,
  inStockPercentage: featureInStockPercentage,
  soldPercentage: featureSoldPercentage,
  lowStockPercentage: featureLowStockPercentage,
  lowStockItems: featureLowStockItems,
  inventoryTotalValue: featureInventoryTotalValue,
} = useAnalyticsFeatureInsights(selectedPeriod, analyticsFolderItems)

// Computed Metrics
const periodLabel = computed(() => {
  const now = new Date()
  switch (selectedPeriod.value) {
    case 'daily':
      return `Last 30 days`
    case 'weekly':
      return `Last 12 weeks`
    case 'monthly':
      return `Last 12 months`
    default:
      return ''
  }
})

const filteredReceipts = computed(() => {
  const now = new Date()
  const cutoffDate = new Date()

  switch (selectedPeriod.value) {
    case 'daily':
      cutoffDate.setDate(now.getDate() - 30)
      break
    case 'weekly':
      cutoffDate.setDate(now.getDate() - 84) // 12 weeks
      break
    case 'monthly':
      cutoffDate.setMonth(now.getMonth() - 12)
      break
  }

  return receipts.value.filter((r) => {
    const receiptDate = r.date?.toDate ? r.date.toDate() : new Date(r.date)
    return receiptDate >= cutoffDate && receiptDate <= now
  })
})

const totalRevenue = computed(() => {
  return filteredReceipts.value.reduce((sum, r) => sum + (r.total || 0), 0)
})

const totalSales = computed(() => {
  return filteredReceipts.value.reduce((sum, r) => sum + (r.itemsCount || 0), 0)
})

const totalOrders = computed(() => {
  return filteredReceipts.value.length
})

const averageOrderValue = computed(() => {
  return totalOrders.value > 0 ? totalRevenue.value / totalOrders.value : 0
})

const revenueChange = computed(() => {
  // Calculate previous period revenue for comparison
  const now = new Date()
  const currentPeriodStart = new Date()
  const previousPeriodStart = new Date()
  const previousPeriodEnd = new Date()

  switch (selectedPeriod.value) {
    case 'daily':
      currentPeriodStart.setDate(now.getDate() - 30)
      previousPeriodEnd.setDate(now.getDate() - 30)
      previousPeriodStart.setDate(now.getDate() - 60)
      break
    case 'weekly':
      currentPeriodStart.setDate(now.getDate() - 84)
      previousPeriodEnd.setDate(now.getDate() - 84)
      previousPeriodStart.setDate(now.getDate() - 168)
      break
    case 'monthly':
      currentPeriodStart.setMonth(now.getMonth() - 12)
      previousPeriodEnd.setMonth(now.getMonth() - 12)
      previousPeriodStart.setMonth(now.getMonth() - 24)
      break
  }

  const currentPeriodRevenue = filteredReceipts.value
    .filter((r) => {
      const receiptDate = r.date?.toDate ? r.date.toDate() : new Date(r.date)
      return receiptDate >= currentPeriodStart
    })
    .reduce((sum, r) => sum + (r.total || 0), 0)

  const previousPeriodRevenue = receipts.value
    .filter((r) => {
      const receiptDate = r.date?.toDate ? r.date.toDate() : new Date(r.date)
      return receiptDate >= previousPeriodStart && receiptDate < previousPeriodEnd
    })
    .reduce((sum, r) => sum + (r.total || 0), 0)

  if (previousPeriodRevenue === 0) return 0
  return ((currentPeriodRevenue - previousPeriodRevenue) / previousPeriodRevenue) * 100
})

const revenueChangeBadge = computed(() => {
  const v = revenueChange.value
  if (Number.isNaN(v)) return null
  const rounded = Math.round(v)
  if (rounded === 0) return null
  return rounded > 0 ? `+${rounded}%` : `${rounded}%`
})

const revenueChangePositive = computed(() => {
  const b = revenueChangeBadge.value
  if (b === null) return null
  return b.startsWith('+')
})

const topProducts = computed(() => {
  const productMap = new Map<
    string,
    { name: string; quantity: number; revenue: number; id: string }
  >()

  filteredReceipts.value.forEach((receipt) => {
    receipt.items?.forEach((item: any) => {
      const existing = productMap.get(item.itemName) || {
        name: item.itemName,
        quantity: 0,
        revenue: 0,
        id: item.itemId || item.itemName,
      }
      existing.quantity += item.quantity || 0
      existing.revenue += (item.price || 0) * (item.quantity || 0)
      productMap.set(item.itemName, existing)
    })
  })

  return Array.from(productMap.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10)
})

const topCustomers = computed(() => {
  const customerMap = new Map<
    string,
    { name: string; email: string; orders: number; totalSpent: number }
  >()

  filteredReceipts.value.forEach((receipt) => {
    if (receipt.customerEmail) {
      const existing = customerMap.get(receipt.customerEmail) || {
        name: receipt.customerName || 'Unknown',
        email: receipt.customerEmail,
        orders: 0,
        totalSpent: 0,
      }
      existing.orders += 1
      existing.totalSpent += receipt.total || 0
      customerMap.set(receipt.customerEmail, existing)
    }
  })

  return Array.from(customerMap.values())
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .slice(0, 10)
})

const repeatPurchaseRate = computed(() => {
  const customerOrders = new Map<string, number>()
  filteredReceipts.value.forEach((receipt) => {
    if (receipt.customerEmail) {
      customerOrders.set(
        receipt.customerEmail,
        (customerOrders.get(receipt.customerEmail) || 0) + 1
      )
    }
  })

  const repeatCustomers = Array.from(customerOrders.values()).filter((count) => count > 1).length
  const totalCustomers = customerOrders.size

  return totalCustomers > 0 ? (repeatCustomers / totalCustomers) * 100 : 0
})

const lowStockItems = computed(() => {
  // Get low stock threshold from user settings
  const lowStockThreshold =
    userStore.userData?.storeDetails?.settings?.inventory?.lowStockThreshold || 10

  // First, filter out sold items (items with dateOut) and get available items
  const availableItems = inventoryItems.value.filter((item) => {
    // Check if item is sold (has dateOut)
    const dateOutValue = item.dateOut
    const isSold = dateOutValue !== null && dateOutValue !== undefined && dateOutValue !== ''
    return !isSold
  })

  // Group available items by brand and model first
  const groupedMap = new Map<
    string,
    {
      brand: string
      model: string
      totalQuantity: number
      threshold: number
      folderName: string
      itemIds: string[]
      folder: any
    }
  >()

  availableItems.forEach((item) => {
    const brand = item.brand || item.Brand || ''
    const model = item.model || item.Model || ''
    const key = `${brand}|||${model}`
    const folder = inventoryStore.getFolderById(item.folderId)

    // Calculate quantity based on folder type
    let quantity = 0
    if (folder?.hasSerialNumbers) {
      // Serial number items: each unsold item counts as 1
      quantity = 1
    } else {
      // Bulk items: use quantity field (only for unsold items)
      quantity = item.quantity || item.Quantity || 0
    }

    const folderName = folder?.name || 'Unknown'

    if (groupedMap.has(key)) {
      const existing = groupedMap.get(key)!
      existing.totalQuantity += quantity
      existing.itemIds.push(item.id)
    } else {
      groupedMap.set(key, {
        brand: brand || 'Unknown Brand',
        model: model || 'Unknown Model',
        totalQuantity: quantity,
        threshold: lowStockThreshold,
        folderName: folderName,
        itemIds: [item.id],
        folder: folder,
      })
    }
  })

  // Now filter to only show groups that are low stock
  const lowStockGroups = Array.from(groupedMap.values()).filter((group) => {
    return group.totalQuantity <= group.threshold
  })

  // Convert to array and format
  return lowStockGroups.map((group, index) => ({
    id: `group-${index}`,
    name: `${group.brand} ${group.model}`.trim() || 'Unknown',
    brand: group.brand,
    model: group.model,
    quantity: group.totalQuantity,
    threshold: group.threshold,
    folderName: group.folderName,
    folderId: group.folder?.id,
    itemCount: group.itemIds.length,
  }))
})

const lowStockCount = computed(() => lowStockItems.value.length)

// Refund metrics (period-filtered)
const refundedReceiptsInPeriod = computed(() =>
  filteredReceipts.value.filter((r) => r.status === 'refunded')
)
const refundedCount = computed(() => refundedReceiptsInPeriod.value.length)
const refundAmount = computed(() =>
  refundedReceiptsInPeriod.value.reduce((sum, r) => sum + (r.total || 0), 0)
)
const completedCountInPeriod = computed(
  () => filteredReceipts.value.filter((r) => r.status === 'completed').length
)
const refundRate = computed(() => {
  const total = completedCountInPeriod.value + refundedCount.value
  return total > 0 ? (refundedCount.value / total) * 100 : 0
})
const refundRateText = computed(() => `${refundRate.value.toFixed(1)}% refund rate`)

const uniqueCustomersInPeriod = computed(() => {
  const keys = new Set<string>()
  filteredReceipts.value.forEach((r) => {
    const key = r.customerEmail?.trim() || r.customerPhone?.trim()
    if (key) keys.add(key)
  })
  return keys.size
})

const itemsSoldInPeriod = computed(() => {
  let count = 0
  completedReceiptsInPeriod.value.forEach((r) => {
    if (r.items?.length) {
      r.items.forEach((item: { quantity?: number }) => {
        count += item.quantity || 0
      })
    } else {
      count += r.itemsCount || 0
    }
  })
  return count
})

const paymentMethodBreakdown = computed(() => {
  const map = new Map<string, { label: string; count: number; revenue: number }>()
  completedReceiptsInPeriod.value.forEach((r) => {
    const raw = (r.paymentMethod || 'other').trim().toLowerCase()
    const label = raw ? raw.charAt(0).toUpperCase() + raw.slice(1) : 'Other'
    const row = map.get(raw) || { label, count: 0, revenue: 0 }
    row.count += 1
    row.revenue += r.total || 0
    map.set(raw, row)
  })
  const total = completedReceiptsInPeriod.value.length || 1
  return Array.from(map.values())
    .sort((a, b) => b.revenue - a.revenue)
    .map((row) => ({
      ...row,
      share: Math.round((row.count / total) * 100),
    }))
})

const topFoldersBySales = computed(() => {
  const rows = inventoryStore.folders.map((folder) => {
    const folderItems = inventoryItems.value.filter((item) => item.folderId === folder.id)
    const stockValue = folderItems.reduce((sum, item) => {
      const price = Number(item.price ?? item.Price ?? 0) || 0
      const qty = folder.hasSerialNumbers
        ? item.dateOut
          ? 0
          : 1
        : Number(item.quantity ?? item.Quantity ?? 0) || 0
      return sum + price * qty
    }, 0)

    const sales = filteredReceipts.value
      .flatMap((r) => r.items || [])
      .filter((line) => {
        const inv = inventoryItems.value.find((i) => i.id === line.itemId)
        return inv?.folderId === folder.id
      })
      .reduce((sum, line) => sum + (line.price || 0) * (line.quantity || 0), 0)

    return {
      id: folder.id,
      name: folder.name,
      sales,
      stockValue,
      turnover: safeTurnoverPercent(sales, stockValue),
      unitsSold: filteredReceipts.value
        .flatMap((r) => r.items || [])
        .filter((line) => {
          const inv = inventoryItems.value.find((i) => i.id === line.itemId)
          return inv?.folderId === folder.id
        })
        .reduce((sum, line) => sum + (line.quantity || 0), 0),
    }
  })

  return rows
    .filter((r) => r.sales > 0 || r.stockValue > 0)
    .sort((a, b) => b.sales - a.sales)
    .slice(0, 8)
})

const totalPeriodSales = computed(() =>
  completedReceiptsInPeriod.value.reduce((s, r) => s + (r.total || 0), 0)
)

const peakHourRevenue = computed(() => {
  const idx = busiestHourIndex.value
  if (idx == null) return 0
  return salesByHour.value[idx]?.revenue ?? 0
})

const peakDayRevenue = computed(() => {
  const idx = busiestDayIndex.value
  if (idx == null) return 0
  return salesByDayOfWeek.value[idx]?.revenue ?? 0
})

const analyticsSummary = computed(() => {
  const parts: string[] = []
  parts.push(
    `${completedReceiptsInPeriod.value.length} completed sale${
      completedReceiptsInPeriod.value.length === 1 ? '' : 's'
    } in ${periodLabel.value.toLowerCase()}.`
  )
  if (uniqueCustomersInPeriod.value > 0) {
    parts.push(
      `${uniqueCustomersInPeriod.value} unique customer${
        uniqueCustomersInPeriod.value === 1 ? '' : 's'
      }; repeat rate ${repeatPurchaseRate.value.toFixed(0)}%.`
    )
  }
  if (busiestTimeSummary.value !== 'No sales in period') {
    parts.push(`Peak traffic: ${busiestTimeSummary.value}.`)
  }
  if (lowStockCount.value > 0) {
    parts.push(
      `${lowStockCount.value} low-stock group${
        lowStockCount.value === 1 ? '' : 's'
      } need attention.`
    )
  }
  return parts.join(' ')
})

// Recent returns for table (receipt number, date, amount, reason)
function getRefundReason(receipt: { refundReason?: string; notes?: string }): string {
  if (receipt.refundReason && receipt.refundReason.trim()) return receipt.refundReason.trim()
  const notes = receipt.notes
  if (!notes || !notes.trim()) return '-'
  const prefix = 'Returned: '
  return notes.startsWith(prefix) ? notes.slice(prefix.length).trim() : notes
}
const recentReturns = computed(() =>
  refundedReceiptsInPeriod.value
    .map((r) => {
      const d = r.updatedAt
        ? r.updatedAt?.toDate
          ? r.updatedAt.toDate()
          : new Date(r.updatedAt)
        : r.date?.toDate
        ? r.date.toDate()
        : new Date(r.date)
      return {
        id: r.id,
        receiptNumber: r.receiptNumber,
        date: d,
        amount: r.total || 0,
        reason: getRefundReason(r),
      }
    })
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 10)
)

// Completed receipts only (for sales-by-time analytics)
const completedReceiptsInPeriod = computed(() =>
  filteredReceipts.value.filter((r) => r.status === 'completed')
)

function lookupInventoryItem(itemId: string): InventoryItem | null {
  for (const list of Object.values(inventoryStore.items)) {
    const hit = list.find((i) => i.id === itemId)
    if (hit) return hit
  }
  return null
}

const periodSalesRevenue = computed(() =>
  completedReceiptsInPeriod.value.reduce((sum, receipt) => sum + receiptLineRevenue(receipt), 0)
)

const periodCogs = computed(() =>
  sumReceiptCogs(completedReceiptsInPeriod.value, lookupInventoryItem)
)

const periodGrossProfit = computed(() =>
  sumReceiptGrossProfit(completedReceiptsInPeriod.value, lookupInventoryItem)
)

const grossProfitMarginPercent = computed(() => {
  if (periodSalesRevenue.value <= 0) return null
  return (periodGrossProfit.value / periodSalesRevenue.value) * 100
})

const grossProfitSubtext = computed(() => {
  const margin = grossProfitMarginPercent.value
  if (margin === null) return 'Add unit costs on inventory items'
  return `${formatMarginPercent(margin)} gross margin on line revenue`
})

const analyticsHeaderMetrics = computed(() => {
  const metrics = [
    {
      key: 'revenue',
      label: 'Total revenue',
      value: formatCurrency(totalRevenue.value),
    },
    {
      key: 'completed',
      label: 'Completed',
      value: formatCurrency(totalPeriodSales.value),
    },
    {
      key: 'orders',
      label: 'Orders',
      value: String(totalOrders.value),
    },
    {
      key: 'aov',
      label: 'Avg. order',
      value: formatCurrency(averageOrderValue.value),
    },
    {
      key: 'customers',
      label: 'Customers',
      value: String(uniqueCustomersInPeriod.value),
    },
    {
      key: 'low-stock',
      label: 'Low stock',
      value: String(lowStockCount.value),
      tone: lowStockCount.value > 0 ? ('warning' as const) : undefined,
    },
    {
      key: 'refunds',
      label: 'Refunds',
      value: String(refundedCount.value),
      tone: refundedCount.value > 0 ? ('danger' as const) : undefined,
    },
  ]

  if (canViewProfitAndCost.value) {
    metrics.push(
      {
        key: 'profit',
        label: 'Gross profit',
        value: formatCurrency(periodGrossProfit.value),
        tone: periodGrossProfit.value >= 0 ? ('success' as const) : ('danger' as const),
      },
      {
        key: 'cogs',
        label: 'COGS',
        value: formatCurrency(periodCogs.value),
      }
    )
  }

  return metrics
})

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const HOUR_LABELS = Array.from({ length: 24 }, (_, i) => {
  if (i === 0) return '12am'
  if (i === 12) return '12pm'
  return i < 12 ? `${i}am` : `${i - 12}pm`
})

// Sales by hour (0-23): revenue and order count per hour
const salesByHour = computed(() => {
  const byHour = Array.from({ length: 24 }, (_, hour) => ({ hour, revenue: 0, count: 0 }))
  completedReceiptsInPeriod.value.forEach((r) => {
    const d = r.date?.toDate ? r.date.toDate() : new Date(r.date)
    const h = d.getHours()
    const slot = byHour[h]
    if (slot) {
      slot.revenue += r.total || 0
      slot.count += 1
    }
  })
  return byHour
})

// Sales by day of week (0=Sun … 6=Sat)
const salesByDayOfWeek = computed(() => {
  const byDay = DAY_NAMES.map((name, i) => ({ dayIndex: i, dayName: name, revenue: 0, count: 0 }))
  completedReceiptsInPeriod.value.forEach((r) => {
    const d = r.date?.toDate ? r.date.toDate() : new Date(r.date)
    const dayIndex = d.getDay()
    const slot = byDay[dayIndex]
    if (slot) {
      slot.revenue += r.total || 0
      slot.count += 1
    }
  })
  return byDay
})

// Busiest hour and day in the period (by revenue)
const busiestHourIndex = computed(() => {
  let max = -1
  let best = 0
  salesByHour.value.forEach((s, i) => {
    if (s.revenue > max) {
      max = s.revenue
      best = i
    }
  })
  return max > 0 ? best : null
})
const busiestDayIndex = computed(() => {
  let max = -1
  let best = 0
  salesByDayOfWeek.value.forEach((s, i) => {
    if (s.revenue > max) {
      max = s.revenue
      best = i
    }
  })
  return max > 0 ? best : null
})
const busiestHourLabel = computed(() =>
  busiestHourIndex.value != null ? HOUR_LABELS[busiestHourIndex.value] : null
)
const busiestDayName = computed(() =>
  busiestDayIndex.value != null ? DAY_NAMES[busiestDayIndex.value] : null
)
const busiestTimeSummary = computed(() => {
  if (busiestDayName.value == null || busiestHourLabel.value == null) return 'No sales in period'
  return `${busiestDayName.value}, ${busiestHourLabel.value}`
})

// Heatmap: day × hour, value = revenue. Rows = days (Sun-Sat), cols = hours.
const heatmapSeries = computed(() => {
  const dayHourRevenue: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0))
  completedReceiptsInPeriod.value.forEach((r) => {
    const d = r.date?.toDate ? r.date.toDate() : new Date(r.date)
    const dayIndex = d.getDay()
    const hour = d.getHours()
    const row = dayHourRevenue[dayIndex]
    if (row && row[hour] !== undefined) row[hour] += r.total || 0
  })
  return DAY_NAMES.map((name, dayIndex) => {
    const row = dayHourRevenue[dayIndex]
    return {
      name,
      data: row
        ? row.map((revenue, hour) => ({ x: HOUR_LABELS[hour], y: Math.round(revenue * 100) / 100 }))
        : [],
    }
  })
})
const heatmapMaxRevenue = computed(() => {
  let max = 0
  heatmapSeries.value.forEach((s) => {
    s.data?.forEach((d: { y: number }) => {
      if (d.y > max) max = d.y
    })
  })
  return max
})

const peakHoursChartSeries = computed(() => [
  {
    name: 'Revenue',
    data: salesByHour.value.map((s) => s.revenue),
  },
])
const peakHoursChartOptions = computed(() => {
  void displayCurrencyDeps.value
  const isDark = themeStore.actualTheme === 'dark'
  const theme = apexTheme(isDark)
  const axisFmt = chartCurrencyAxis.value
  return {
    chart: { type: 'bar', toolbar: { show: false }, background: 'transparent' },
    colors: [isDark ? '#9ab5e3' : '#4876c7'],
    plotOptions: {
      bar: { borderRadius: 3, columnWidth: '70%', dataLabels: { position: 'top' } },
    },
    dataLabels: { enabled: false },
    xaxis: {
      categories: HOUR_LABELS,
      tickAmount: 12,
      labels: {
        style: { colors: theme.muted, fontSize: '10px' },
        rotate: 0,
        hideOverlappingLabels: true,
        formatter: (_val: string, _ts: number, opts?: { i?: number }) => {
          const i = opts?.i ?? 0
          return i % 3 === 0 ? HOUR_LABELS[i] ?? '' : ''
        },
      },
      axisBorder: { show: true, color: theme.border },
      axisTicks: { show: false },
    },
    yaxis: {
      labels: {
        style: { colors: theme.muted, fontSize: '11px' },
        formatter: (val: number) => axisFmt(val),
      },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    grid: {
      borderColor: theme.grid,
      strokeDashArray: 4,
      padding: { left: 8, right: 8 },
    },
    tooltip: {
      theme: isDark ? 'dark' : 'light',
      x: {
        formatter: (_: string, opts?: { dataPointIndex?: number }) => {
          const i = opts?.dataPointIndex ?? 0
          const slot = salesByHour.value[i]
          return slot
            ? `${HOUR_LABELS[i]} · ${slot.count} order${slot.count === 1 ? '' : 's'}`
            : HOUR_LABELS[i]
        },
      },
      y: { formatter: (val: number) => formatCurrency(val) },
    },
    theme: { mode: isDark ? 'dark' : 'light' },
  }
})

const salesByDayChartSeries = computed(() => [
  {
    name: 'Revenue',
    data: salesByDayOfWeek.value.map((s) => s.revenue),
  },
])
const salesByDayChartOptions = computed(() => {
  void displayCurrencyDeps.value
  const isDark = themeStore.actualTheme === 'dark'
  const theme = apexTheme(isDark)
  const axisFmt = chartCurrencyAxis.value
  return {
    chart: { type: 'bar', toolbar: { show: false }, background: 'transparent' },
    colors: [isDark ? '#34d399' : '#059669'],
    plotOptions: { bar: { borderRadius: 4, columnWidth: '50%' } },
    dataLabels: { enabled: false },
    xaxis: {
      categories: DAY_NAMES,
      labels: { style: { colors: theme.muted, fontSize: '11px' } },
      axisBorder: { show: true, color: theme.border },
      axisTicks: { show: false },
    },
    yaxis: {
      labels: {
        style: { colors: theme.muted, fontSize: '11px' },
        formatter: (val: number) => axisFmt(val),
      },
    },
    grid: { borderColor: theme.grid, strokeDashArray: 4 },
    tooltip: {
      theme: isDark ? 'dark' : 'light',
      y: {
        formatter: (val: number, opts?: { dataPointIndex?: number }) => {
          const i = opts?.dataPointIndex ?? 0
          const slot = salesByDayOfWeek.value[i]
          return `${formatCurrency(val)} (${slot?.count ?? 0} orders)`
        },
      },
    },
    theme: { mode: isDark ? 'dark' : 'light' },
  }
})

const heatmapChartOptions = computed(() => {
  void displayCurrencyDeps.value
  const isDark = themeStore.actualTheme === 'dark'
  const textColor = isDark ? '#E5E7EB' : '#1F2937'
  const mutedColor = isDark ? '#9CA3AF' : '#6B7280'
  const borderColor = isDark ? '#4B5563' : '#D1D5DB'
  const max = heatmapMaxRevenue.value
  const scaleMax = max > 0 ? max : 1
  const q1 = max * 0.25
  const q2 = max * 0.5
  const q3 = max * 0.75
  const ranges = [
    { from: 0, to: 0, color: isDark ? '#374151' : '#E5E7EB' },
    { from: 0.01, to: max > 0 ? q1 : scaleMax, color: isDark ? '#1e3a5f' : '#93c5fd' },
    ...(max > 0
      ? [
          { from: q1, to: q2, color: isDark ? '#1d4ed8' : '#60a5fa' },
          { from: q2, to: q3, color: isDark ? '#2563eb' : '#3b82f6' },
          { from: q3, to: max + 1, color: isDark ? '#3b82f6' : '#1d4ed8' },
        ]
      : []),
  ]
  return {
    chart: { type: 'heatmap', toolbar: { show: false }, background: 'transparent' },
    plotOptions: {
      heatmap: {
        shadeIntensity: 0.5,
        radius: 0,
        useFillColorAsStroke: true,
        stroke: { width: 1, colors: [borderColor] },
        colorScale: {
          min: 0,
          max: scaleMax,
          inverseColors: false,
          ranges,
        },
      },
    },
    xaxis: {
      categories: HOUR_LABELS,
      labels: {
        style: { colors: mutedColor, fontSize: '9px' },
        rotate: 0,
        hideOverlappingLabels: true,
        formatter: (_val: string, _ts: number, opts?: { i?: number }) => {
          const i = opts?.i ?? 0
          return i % 4 === 0 ? HOUR_LABELS[i] ?? '' : ''
        },
      },
      axisBorder: { show: true, color: borderColor },
      axisTicks: { show: true, color: borderColor },
    },
    yaxis: {
      labels: {
        style: { colors: mutedColor, fontSize: '11px' },
      },
      axisBorder: { show: true, color: borderColor },
      axisTicks: { show: true, color: borderColor },
    },
    dataLabels: { enabled: false },
    grid: {
      borderColor,
      strokeDashArray: 1,
      xaxis: { lines: { show: true } },
      yaxis: { lines: { show: true } },
    },
    tooltip: {
      theme: isDark ? 'dark' : 'light',
      style: { fontSize: '12px' },
      x: { formatter: (val: string) => val },
      y: {
        formatter: (val: number) => formatCurrency(val),
        title: { formatter: () => 'Revenue' },
      },
    },
    legend: {
      labels: { colors: textColor },
    },
    theme: { mode: isDark ? 'dark' : 'light' },
  }
})

// Chart Data
const revenueChartSeries = computed(() => {
  const data: number[] = []
  const categories: string[] = []

  const now = new Date()
  let periods = 12

  if (selectedPeriod.value === 'daily') {
    periods = 30
    for (let i = periods - 1; i >= 0; i--) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)
      categories.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }))

      const dayRevenue = filteredReceipts.value
        .filter((r) => {
          const receiptDate = r.date?.toDate ? r.date.toDate() : new Date(r.date)
          return receiptDate.toDateString() === date.toDateString()
        })
        .reduce((sum, r) => sum + (r.total || 0), 0)
      data.push(dayRevenue)
    }
  } else if (selectedPeriod.value === 'weekly') {
    for (let i = periods - 1; i >= 0; i--) {
      const date = new Date(now)
      date.setDate(date.getDate() - i * 7)
      categories.push(`Week ${periods - i}`)

      const weekStart = new Date(date)
      weekStart.setDate(weekStart.getDate() - 7)
      const weekRevenue = filteredReceipts.value
        .filter((r) => {
          const receiptDate = r.date?.toDate ? r.date.toDate() : new Date(r.date)
          return receiptDate >= weekStart && receiptDate < date
        })
        .reduce((sum, r) => sum + (r.total || 0), 0)
      data.push(weekRevenue)
    }
  } else {
    for (let i = periods - 1; i >= 0; i--) {
      const date = new Date(now)
      date.setMonth(date.getMonth() - i)
      categories.push(date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }))

      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1)
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0)
      const monthRevenue = filteredReceipts.value
        .filter((r) => {
          const receiptDate = r.date?.toDate ? r.date.toDate() : new Date(r.date)
          return receiptDate >= monthStart && receiptDate <= monthEnd
        })
        .reduce((sum, r) => sum + (r.total || 0), 0)
      data.push(monthRevenue)
    }
  }

  return [
    {
      name: 'Revenue',
      data: data,
    },
  ]
})

const revenueChartOptions = computed(() => {
  void displayCurrencyDeps.value
  const isDark = themeStore.actualTheme === 'dark'

  return {
    chart: {
      type: 'line',
      toolbar: { show: false },
      zoom: { enabled: false },
      background: 'transparent',
    },
    colors: [isDark ? '#9ab5e3' : '#4876c7'],
    stroke: {
      curve: 'smooth',
      width: 2,
    },
    xaxis: {
      categories:
        revenueChartSeries.value[0]?.data.map((_, i) => {
          if (selectedPeriod.value === 'daily') {
            const date = new Date()
            date.setDate(date.getDate() - (29 - i))
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          } else if (selectedPeriod.value === 'weekly') {
            return `Week ${i + 1}`
          } else {
            const date = new Date()
            date.setMonth(date.getMonth() - (11 - i))
            return date.toLocaleDateString('en-US', { month: 'short' })
          }
        }) || [],
      labels: {
        style: {
          colors: isDark ? '#9CA3AF' : '#1F2937',
          fontSize: '12px',
        },
      },
      axisBorder: {
        show: true,
        color: isDark ? '#374151' : '#E5E7EB',
      },
      axisTicks: {
        show: true,
        color: isDark ? '#374151' : '#E5E7EB',
      },
    },
    yaxis: {
      labels: {
        style: {
          colors: isDark ? '#9CA3AF' : '#1F2937',
          fontSize: '11px',
        },
        formatter: (val: number) => chartCurrencyAxis.value(val),
      },
    },
    grid: {
      borderColor: isDark ? '#374151' : '#E5E7EB',
      strokeDashArray: 4,
    },
    dataLabels: { enabled: false },
    tooltip: {
      theme: isDark ? 'dark' : 'light',
      y: {
        formatter: (val: number) => formatCurrency(val),
      },
    },
    theme: {
      mode: isDark ? 'dark' : 'light',
    },
  }
})

const topProductsChartSeries = computed(() => {
  return topProducts.value.slice(0, 5).map((p) => p.revenue)
})

const topProductsChartOptions = computed(() => {
  void displayCurrencyDeps.value
  const isDark = themeStore.actualTheme === 'dark'

  return {
    chart: {
      type: 'donut',
      background: 'transparent',
    },
    labels: topProducts.value.slice(0, 5).map((p) => truncateChartLabel(p.name, 20)),
    colors: ['#4876c7', '#6e94d6', '#143f8d', '#9ab5e3', '#34d399'],
    legend: {
      position: 'bottom',
      labels: {
        colors: isDark ? '#9CA3AF' : '#1F2937',
      },
    },
    tooltip: {
      theme: isDark ? 'dark' : 'light',
      y: {
        formatter: (val: number) => formatCurrency(val),
      },
    },
    theme: {
      mode: isDark ? 'dark' : 'light',
    },
  }
})

const categorySalesChartSeries = computed(() => [
  {
    name: 'Sales',
    data: topFoldersBySales.value.map((f) => f.sales),
  },
])

const categorySalesChartOptions = computed(() => {
  void displayCurrencyDeps.value
  const isDark = themeStore.actualTheme === 'dark'
  const theme = apexTheme(isDark)
  const axisFmt = chartCurrencyAxis.value
  const folders = topFoldersBySales.value
  const categories = folders.map((f) => truncateChartLabel(f.name, 18))

  return {
    chart: { type: 'bar', toolbar: { show: false }, background: 'transparent' },
    colors: [isDark ? '#9ab5e3' : '#4876c7'],
    plotOptions: {
      bar: {
        horizontal: true,
        borderRadius: 4,
        barHeight: '72%',
        dataLabels: { position: 'center' },
      },
    },
    dataLabels: { enabled: false },
    xaxis: {
      categories,
      labels: {
        style: { colors: theme.muted, fontSize: '11px' },
      },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      labels: {
        style: { colors: theme.muted, fontSize: '11px' },
        formatter: (val: number) => axisFmt(val),
      },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    grid: {
      borderColor: theme.grid,
      strokeDashArray: 4,
      padding: { left: 4, right: 16 },
    },
    tooltip: {
      theme: isDark ? 'dark' : 'light',
      y: {
        formatter: (val: number) => formatCurrency(val),
        title: {
          formatter: (_seriesName: string, opts?: { dataPointIndex?: number }) => {
            const f = folders[opts?.dataPointIndex ?? 0]
            if (!f) return 'Category'
            return `${f.name} · ${f.unitsSold} units · ${f.turnover}% turnover`
          },
        },
      },
    },
    theme: { mode: isDark ? 'dark' : 'light' },
  }
})

const customerChartCustomers = computed(() => topCustomers.value.slice(0, 5))

const customerChartSeries = computed(() => [
  {
    name: 'Total spent',
    data: customerChartCustomers.value.map((c) => c.totalSpent),
  },
])

const customerChartOptions = computed(() => {
  void displayCurrencyDeps.value
  const isDark = themeStore.actualTheme === 'dark'
  const theme = apexTheme(isDark)
  const axisFmt = chartCurrencyAxis.value
  const customers = customerChartCustomers.value
  const categories = customers.map((c) => truncateChartLabel(c.name, 14))

  return {
    chart: { type: 'bar', toolbar: { show: false }, background: 'transparent' },
    colors: [isDark ? '#34d399' : '#059669'],
    plotOptions: {
      bar: {
        horizontal: true,
        borderRadius: 4,
        barHeight: '68%',
      },
    },
    dataLabels: { enabled: false },
    xaxis: {
      categories,
      labels: {
        style: { colors: theme.muted, fontSize: '11px' },
      },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      labels: {
        style: { colors: theme.muted, fontSize: '11px' },
        formatter: (val: number) => axisFmt(val),
      },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    grid: {
      borderColor: theme.grid,
      strokeDashArray: 4,
      padding: { left: 4, right: 16 },
    },
    tooltip: {
      theme: isDark ? 'dark' : 'light',
      y: {
        formatter: (_val: number, opts?: { dataPointIndex?: number }) => {
          const c = customers[opts?.dataPointIndex ?? 0]
          if (!c) return ''
          return `${formatCurrency(c.totalSpent)} · ${c.orders} order${c.orders === 1 ? '' : 's'}`
        },
      },
    },
    theme: { mode: isDark ? 'dark' : 'light' },
  }
})

// Functions
const loadAnalytics = async () => {
  isLoading.value = true
  try {
    const tasks: Promise<unknown>[] = [
      receiptsStore.fetchReceipts(),
      inventoryStore.fetchFolders(),
      departmentsStore.fetchDepartments(),
    ]

    if (userStore.isSuperAdmin) {
      tasks.push(buybacksStore.fetchCustomerBuybacks(true))
    }
    if (canUseSubscriptionFeature('seller_loans')) {
      tasks.push(sellerLoansStore.fetchSellerLoanOuts(true))
    }
    if (canUseSubscriptionFeature('customer_balance')) {
      tasks.push(customerAccountsStore.fetchAccountsForStore())
    }

    await Promise.all(tasks)
    receipts.value = receiptsStore.receipts

    const grouped = await inventoryStore.fetchFolderAvailabilityStats()
    inventoryItems.value = Object.values(grouped).flat()
    analyticsFolderItems.value = grouped
  } catch (error) {
    console.error('Error loading analytics:', error)
    toast.error('Failed to load analytics data')
  } finally {
    isLoading.value = false
  }
}

const exportReport = async (format: 'pdf' | 'excel' = 'pdf') => {
  isExporting.value = true
  try {
    if (format === 'excel') {
      await exportToExcel()
    } else {
      await exportToPDF()
    }
  } catch (error) {
    console.error('Error exporting report:', error)
    toast.error('Failed to export report')
  } finally {
    isExporting.value = false
  }
}

const exportToExcel = async () => {
  // Create CSV content
  let csvContent = 'Analytics & Sales Report\n'
  csvContent += `Period: ${periodLabel.value}\n`
  csvContent += `Generated: ${new Date().toLocaleDateString()}\n\n`

  // Key Metrics
  csvContent += 'Key Metrics\n'
  csvContent += 'Metric,Value\n'
  csvContent += `Total Revenue,${totalRevenue.value}\n`
  csvContent += `Total Sales,${totalSales.value}\n`
  csvContent += `Total Orders,${totalOrders.value}\n`
  csvContent += `Average Order Value,${averageOrderValue.value}\n`
  csvContent += `Low Stock Items,${lowStockCount.value}\n`
  csvContent += `Repeat Purchase Rate,${repeatPurchaseRate.value.toFixed(1)}%\n\n`

  // Top Products
  csvContent += 'Top Products\n'
  csvContent += 'Product,Quantity,Revenue\n'
  topProducts.value.slice(0, 10).forEach((p) => {
    csvContent += `"${p.name}",${p.quantity},${p.revenue}\n`
  })
  csvContent += '\n'

  // Top Customers
  csvContent += 'Top Customers\n'
  csvContent += 'Customer Name,Email,Orders,Total Spent\n'
  topCustomers.value.slice(0, 10).forEach((c) => {
    csvContent += `"${c.name}","${c.email}",${c.orders},${c.totalSpent}\n`
  })

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', `analytics-report-${selectedPeriod.value}-${Date.now()}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  toast.success('Report exported to Excel successfully!')
}

const exportToPDF = async () => {
  try {
    const { default: jsPDF } = await import('jspdf')
    const doc = new jsPDF()

    // Title
    doc.setFontSize(18)
    doc.text('Analytics & Sales Report', 14, 20)
    doc.setFontSize(10)
    doc.text(`Period: ${periodLabel.value}`, 14, 28)
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 34)

    let yPos = 44

    // Key Metrics
    doc.setFontSize(14)
    doc.text('Key Metrics', 14, yPos)
    yPos += 8

    doc.setFontSize(10)
    const metrics = [
      ['Total Revenue', formatCurrency(totalRevenue.value)],
      ['Total Sales', totalSales.value.toString()],
      ['Total Orders', totalOrders.value.toString()],
      ['Average Order Value', formatCurrency(averageOrderValue.value)],
      ['Low Stock Items', lowStockCount.value.toString()],
      ['Refunded Count', refundedCount.value.toString()],
      ['Refund Amount', formatCurrency(refundAmount.value)],
      ['Refund Rate', `${refundRate.value.toFixed(1)}%`],
      ['Repeat Purchase Rate', `${repeatPurchaseRate.value.toFixed(1)}%`],
    ]

    metrics.forEach(([label, value]) => {
      doc.text(`${label}: ${value}`, 20, yPos)
      yPos += 6
    })

    yPos += 4

    // Top Products
    if (topProducts.value.length > 0) {
      doc.setFontSize(14)
      doc.text('Top Products', 14, yPos)
      yPos += 8

      // Top Products Table
      doc.setFontSize(12)
      doc.text('Product', 20, yPos)
      doc.text('Quantity', 100, yPos)
      doc.text('Revenue', 150, yPos)
      yPos += 6
      doc.setFontSize(10)

      topProducts.value.slice(0, 10).forEach((p, index) => {
        if (yPos > 280) {
          doc.addPage()
          yPos = 20
        }
        doc.text(p.name.substring(0, 30), 20, yPos)
        doc.text(p.quantity.toString(), 100, yPos)
        doc.text(formatCurrency(p.revenue), 150, yPos)
        yPos += 6
      })

      yPos += 4
    }

    // Top Customers
    if (topCustomers.value.length > 0) {
      doc.setFontSize(14)
      doc.text('Top Customers', 14, yPos)
      yPos += 8

      // Top Customers Table
      doc.setFontSize(12)
      doc.text('Customer', 20, yPos)
      doc.text('Orders', 100, yPos)
      doc.text('Total Spent', 150, yPos)
      yPos += 6
      doc.setFontSize(10)

      topCustomers.value.slice(0, 10).forEach((c, index) => {
        if (yPos > 280) {
          doc.addPage()
          yPos = 20
        }
        doc.text(c.name.substring(0, 30), 20, yPos)
        doc.text(c.orders.toString(), 100, yPos)
        doc.text(formatCurrency(c.totalSpent), 150, yPos)
        yPos += 6
      })

      yPos += 4
    }

    // Recent Returns
    if (recentReturns.value.length > 0) {
      doc.setFontSize(14)
      doc.text('Recent Returns', 14, yPos)
      yPos += 8

      doc.setFontSize(12)
      doc.text('Receipt #', 20, yPos)
      doc.text('Date', 60, yPos)
      doc.text('Amount', 110, yPos)
      doc.text('Reason', 150, yPos)
      yPos += 6
      doc.setFontSize(10)

      recentReturns.value.forEach((ret) => {
        if (yPos > 280) {
          doc.addPage()
          yPos = 20
        }
        doc.text(ret.receiptNumber, 20, yPos)
        doc.text(formatReturnDate(ret.date), 60, yPos)
        doc.text('-' + formatCurrency(ret.amount), 110, yPos)
        doc.text((ret.reason || '-').substring(0, 25), 150, yPos)
        yPos += 6
      })
    }

    // Save PDF
    doc.save(`analytics-report-${selectedPeriod.value}-${Date.now()}.pdf`)
    toast.success('Report exported successfully!')
  } catch (error) {
    console.error('Error exporting report:', error)
    toast.error('Failed to export report')
  } finally {
    isExporting.value = false
  }
}

onMounted(() => {
  const authStore = useAuthStore()
  if (!authStore.currentUser) {
    navigateTo('/signin')
    return
  }
  // Run in background so the page (loading skeleton) shows immediately
  const uid = authStore.currentUser.uid
  ;(async () => {
    if (!userStore.userData) {
      await userStore.fetchUserData(uid)
    }
    await initPreferences()
    if (!canUseSubscriptionFeature('analytics')) {
      isLoading.value = false
      return
    }
    await loadAnalytics()
  })()
})
</script>
