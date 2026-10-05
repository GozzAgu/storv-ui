<template>
  <div class="ds-root s-c s-page">
    <SPageHeader title="Reports">
      <template #description>
        Sales, products, customers and stock for this branch.
      </template>
      <template v-if="!needsStoreSelection && canUseSubscriptionFeature('analytics')" #actions>
        <SSelect
          :model-value="selectedPeriod"
          class="s-report__period"
          aria-label="Period"
          :options="webPeriodOptions"
          @update:model-value="onWebPeriodChange"
        />
        <SButton variant="secondary" :disabled="isExporting" @click="exportReport('pdf')">
          <template #leading><Download :size="16" :stroke-width="2" aria-hidden="true" /></template>
          PDF
        </SButton>
        <SButton variant="secondary" :disabled="isExporting" @click="exportReport('excel')">
          <template #leading><Download :size="16" :stroke-width="2" aria-hidden="true" /></template>
          Excel
        </SButton>
      </template>
    </SPageHeader>

    <SCard v-if="needsStoreSelection && !isLoading">
      <SEmptyState
        title="Choose a branch"
        :description="
          canManageBranches
            ? 'Reports are kept per branch. Pick one to see its numbers.'
            : 'Reports will show here once your branch is connected.'
        "
      >
        <template #icon><Store :size="24" :stroke-width="1.75" aria-hidden="true" /></template>
        <template v-if="canManageBranches" #actions>
          <InlineStorePicker />
        </template>
      </SEmptyState>
    </SCard>

    <PlanGate
      v-else-if="!canUseSubscriptionFeature('analytics')"
      feature="analytics"
      description="See period comparisons, best sellers, busy hours and exports for your store."
    />

    <div v-else-if="isLoading" class="s-page" role="status" aria-label="Loading reports">
      <div class="s-overview__stats">
        <SCard v-for="i in 4" :key="i"><SSkeleton :lines="2" height="20px" /></SCard>
      </div>
      <SCard><SSkeleton height="300px" /></SCard>
    </div>

    <template v-else>
      <STabs v-model="activeAnalyticsTab" :tabs="webAnalyticsTabs" label="Report sections" />

      <!-- Overview -->
      <template v-if="activeAnalyticsTab === 'overview'">
        <div class="s-overview__stats">
          <SStat
            v-for="card in heroKpiCards"
            :key="card.key"
            :label="card.label"
            :value="card.value"
            :delta="card.key === 'revenue' && Number.isFinite(revenueChange) && Math.round(revenueChange) !== 0 ? revenueChange : undefined"
            :hint="card.sparkline || card.progress != null ? undefined : card.secondary"
            :tone="kpiTone(card.tone)"
          >
            <template #icon><component :is="card.icon" :size="16" :stroke-width="2" /></template>
            <template v-if="card.sparkline && card.sparkline.length > 1" #visual>
              <SSparkline :values="card.sparkline" :label="`${card.label} trend, ${periodLabel.toLowerCase()}`" />
            </template>
            <template v-else-if="card.progress != null" #visual>
              <span class="s-report__meter-wrap" :class="`s-report__meter-wrap--${card.tone ?? 'default'}`">
                <span class="s-report__meter-label">{{ card.progressLabel }}</span>
                <span class="s-meter" role="img" :aria-label="card.progressLabel">
                  <span class="s-meter__fill" :style="{ width: `${Math.min(100, Math.max(0, card.progress))}%` }" />
                </span>
              </span>
            </template>
          </SStat>
        </div>

        <dl class="s-metrics s-report__metrics">
          <div v-for="card in secondaryKpiCards" :key="card.key" class="s-metrics__item">
            <dt class="s-metrics__label">{{ card.label }}</dt>
            <dd class="s-metrics__value" :class="kpiTone(card.tone) ? `s-metrics__value--${kpiTone(card.tone)}` : undefined">
              {{ card.value }}
            </dd>
          </div>
        </dl>

        <SCard title="Revenue" :description="periodLabel">
          <template #actions>
            <SButton variant="ghost" size="sm" @click="activeAnalyticsTab = 'revenue'">Details</SButton>
          </template>
          <p v-if="totalRevenue === 0" class="s-report__empty">No sales in this period yet.</p>
          <LazyApexChart
            v-else
            type="area"
            :height="240"
            :options="dsChart(overviewRevenueChartOptions)"
            :series="revenueChartSeries"
          />
        </SCard>

        <div class="s-report__donuts">
          <SCard title="Stock health">
            <template #actions>
              <NuxtLink :to="dashPath('/inventory')" class="s-link">Inventory</NuxtLink>
            </template>
            <p v-if="inventoryHealthSeries.every((v) => v === 0)" class="s-report__empty">No stock tracked yet.</p>
            <LazyApexChart v-else type="donut" :height="240" :options="inventoryHealthChartOptions" :series="inventoryHealthSeries" />
          </SCard>
          <SCard title="Payment methods">
            <p v-if="paymentMethodBreakdown.length === 0" class="s-report__empty">No completed sales in this period.</p>
            <LazyApexChart v-else type="donut" :height="240" :options="paymentMethodsChartOptions" :series="paymentMethodsChartSeries" />
          </SCard>
          <SCard title="Top products">
            <p v-if="topProductsChartSeries.length === 0" class="s-report__empty">No product sales in this period.</p>
            <LazyApexChart v-else type="donut" :height="240" :options="overviewTopProductsChartOptions" :series="topProductsChartSeries" />
          </SCard>
        </div>

        <nav class="s-report__tiles" aria-label="More reports">
          <NuxtLink
            v-for="insight in insightTiles"
            :key="insight.id"
            :to="insight.href!"
            class="s-report__tile"
            :aria-label="`${insight.title}: ${insight.value}. ${insight.linkLabel}`"
          >
            <span class="s-report__tile-icon" aria-hidden="true">
              <component :is="insight.icon" :size="16" :stroke-width="2" />
            </span>
            <span class="s-report__tile-main">
              <span class="s-report__tile-label">{{ insight.title }}</span>
              <span class="s-report__tile-value">{{ insight.value }}</span>
            </span>
            <ChevronRight class="s-report__tile-arrow" :size="16" :stroke-width="2" aria-hidden="true" />
          </NuxtLink>
        </nav>
      </template>

      <!-- Revenue -->
      <template v-else-if="activeAnalyticsTab === 'revenue'">
        <div class="s-report__split s-report__split--wide">
          <SCard title="Revenue" :description="`${periodLabel}`">
            <LazyApexChart type="line" :height="300" :options="dsChart(revenueChartOptions)" :series="revenueChartSeries" />
          </SCard>
          <SCard title="Top products" description="Share of revenue, top 5">
            <LazyApexChart type="donut" :height="300" :options="dsChart(topProductsChartOptions)" :series="topProductsChartSeries" />
          </SCard>
        </div>
        <SCard v-if="canViewProfitAndCost" title="Discounts" :description="`${periodLabel}`">
          <LazyApexChart type="line" :height="300" :options="dsChart(discountChartOptions)" :series="discountChartSeries" />
        </SCard>
      </template>

      <!-- Products & customers -->
      <div v-else-if="activeAnalyticsTab === 'products-customers'" class="s-report__split">
        <SCard title="Sales by category" :description="`Top 8 categories, ${periodLabel.toLowerCase()}`">
          <template #actions>
            <NuxtLink :to="dashPath('/inventory')" class="s-link">Inventory</NuxtLink>
          </template>
          <p v-if="topFoldersBySales.length === 0" class="s-report__empty">No category sales in this period.</p>
          <LazyApexChart
            v-else
            type="bar"
            :height="Math.max(240, topFoldersBySales.length * 40)"
            :options="dsChart(categorySalesChartOptions)"
            :series="categorySalesChartSeries"
          />
        </SCard>
        <SCard title="Top customers" :description="`By spend · ${repeatPurchaseRate.toFixed(0)}% bought again`">
          <p v-if="customerChartCustomers.length === 0" class="s-report__empty">
            No sales with a customer email in this period.
          </p>
          <LazyApexChart
            v-else
            type="bar"
            :height="Math.max(220, customerChartCustomers.length * 44)"
            :options="dsChart(customerChartOptions)"
            :series="customerChartSeries"
          />
        </SCard>
      </div>

      <!-- Payments & busy times -->
      <template v-else-if="activeAnalyticsTab === 'payments-traffic'">
        <div class="s-report__split">
          <SCard title="Busiest times">
            <dl class="s-report__peaks">
              <div class="s-report__peak">
                <dt class="s-report__peak-label">
                  <span class="s-report__tile-icon" aria-hidden="true"><CalendarDays :size="16" :stroke-width="2" /></span>
                  Best day
                </dt>
                <dd class="s-report__peak-value">{{ busiestDayName ?? EMPTY_CELL }}</dd>
                <dd class="s-report__peak-sub">{{ formatCurrency(peakDayRevenue) }}</dd>
              </div>
              <div class="s-report__peak">
                <dt class="s-report__peak-label">
                  <span class="s-report__tile-icon" aria-hidden="true"><Clock :size="16" :stroke-width="2" /></span>
                  Best hour
                </dt>
                <dd class="s-report__peak-value">{{ busiestHourLabel ?? EMPTY_CELL }}</dd>
                <dd class="s-report__peak-sub">{{ formatCurrency(peakHourRevenue) }}</dd>
              </div>
            </dl>
          </SCard>

          <SCard
            v-if="paymentMethodBreakdown.length > 0"
            title="Payment methods"
            description="Completed sales by how customers paid"
          >
            <ul class="s-report__bars">
              <li v-for="row in paymentMethodBreakdown.slice(0, 6)" :key="row.label">
                <div class="s-report__bar-head">
                  <span>{{ row.label }}</span>
                  <span class="s-report__bar-meta">{{ row.share }}% · {{ formatCurrency(row.revenue) }}</span>
                </div>
                <div class="s-report__bar-track">
                  <span class="s-report__bar-fill" :style="{ width: `${Math.max(row.share, 3)}%` }" />
                </div>
              </li>
            </ul>
          </SCard>

          <SCard v-if="!storefrontDashboardHidden" title="Storefront traffic">
            <template #actions>
              <NuxtLink :to="dashPath('/storefront')" class="s-link">Open storefront</NuxtLink>
            </template>
            <dl class="s-report__cells">
              <div><dt>Store views</dt><dd>{{ storefrontStore.analyticsSummary.storeViews }}</dd></div>
              <div><dt>Product views</dt><dd>{{ storefrontStore.analyticsSummary.productViews }}</dd></div>
              <div><dt>Views, last 7 days</dt><dd>{{ storefrontStore.viewsLast7Days }}</dd></div>
              <div><dt>Waiting requests</dt><dd>{{ storefrontStore.pendingInquiryCount }}</dd></div>
            </dl>
          </SCard>
        </div>

        <SCard title="Sales by hour" description="Revenue by hour of day. Hover a bar for the number of sales.">
          <LazyApexChart type="bar" :height="260" :options="dsChart(peakHoursChartOptions)" :series="peakHoursChartSeries" />
        </SCard>

        <div class="s-report__split">
          <SCard title="Sales by day of week">
            <LazyApexChart type="bar" :height="260" :options="dsChart(salesByDayChartOptions)" :series="salesByDayChartSeries" />
          </SCard>
          <SCard title="Day and hour" description="Darker squares had more revenue.">
            <LazyApexChart type="heatmap" :height="280" :options="dsChart(heatmapChartOptions)" :series="heatmapSeries" />
          </SCard>
        </div>
      </template>

      <!-- Top lists -->
      <template v-else-if="activeAnalyticsTab === 'reports'">
        <div class="s-report__split">
          <SCard title="Top products" flush>
            <p v-if="topProducts.length === 0" class="s-report__empty s-report__empty--pad">No product sales in this period.</p>
            <table v-else class="s-table">
              <thead>
                <tr>
                  <th scope="col">Product</th>
                  <th scope="col" class="s-table__num">Sold</th>
                  <th scope="col" class="s-table__num">Revenue</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="product in topProducts" :key="product.id">
                  <td><span class="s-table__primary">{{ product.name }}</span></td>
                  <td class="s-table__num">{{ product.quantity }}</td>
                  <td class="s-table__num">{{ formatCurrency(product.revenue) }}</td>
                </tr>
              </tbody>
            </table>
          </SCard>

          <SCard title="Top customers" flush>
            <p v-if="topCustomers.length === 0" class="s-report__empty s-report__empty--pad">No customers in this period.</p>
            <table v-else class="s-table">
              <thead>
                <tr>
                  <th scope="col">Customer</th>
                  <th scope="col" class="s-table__num">Sales</th>
                  <th scope="col" class="s-table__num">Spent</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="customer in topCustomers" :key="customer.email">
                  <td>
                    <span class="s-table__primary">{{ customer.name }}</span>
                    <span class="s-table__secondary">{{ customer.email }}</span>
                  </td>
                  <td class="s-table__num">{{ customer.orders }}</td>
                  <td class="s-table__num">{{ formatCurrency(customer.totalSpent) }}</td>
                </tr>
              </tbody>
            </table>
          </SCard>
        </div>

        <div class="s-report__split">
          <SCard title="Recent returns" flush>
            <p v-if="recentReturns.length === 0" class="s-report__empty s-report__empty--pad">No returns in this period.</p>
            <table v-else class="s-table">
              <thead>
                <tr>
                  <th scope="col">Sale</th>
                  <th scope="col">Reason</th>
                  <th scope="col" class="s-table__num">Refunded</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="ret in recentReturns" :key="ret.id">
                  <td>
                    <span class="s-table__primary">{{ ret.receiptNumber }}</span>
                    <span class="s-table__secondary">{{ formatReturnDate(ret.date) }}</span>
                  </td>
                  <td>{{ ret.reason }}</td>
                  <td class="s-table__num">−{{ formatCurrency(ret.amount) }}</td>
                </tr>
              </tbody>
            </table>
          </SCard>

          <SCard title="Low stock" flush>
            <template #actions>
              <SButton
                v-if="lowStockItems.length > 0"
                variant="ghost"
                size="sm"
                :loading="reorderExporting"
                @click="handleExportReorderList"
              >
                Export reorder list
              </SButton>
            </template>
            <ul v-if="lowStockItems.length > 0" class="s-list">
              <li v-for="item in lowStockItems" :key="item.id">
                <NuxtLink
                  :to="item.folderId ? dashPath(`/inventory/${item.folderId}`) : dashPath('/inventory')"
                  class="s-list__item s-list__item--interactive"
                >
                  <span class="s-list__main">
                    <span class="s-list__primary">{{ item.name }}</span>
                    <span class="s-list__secondary">
                      {{ item.folderName }}<template v-if="item.itemCount > 1"> · {{ item.itemCount }} items</template>
                    </span>
                  </span>
                  <span class="s-list__end">
                    <SBadge tone="warning" size="sm">{{ item.quantity }} of {{ item.threshold }}</SBadge>
                  </span>
                </NuxtLink>
              </li>
            </ul>
            <p v-else class="s-report__empty s-report__empty--pad">Everything is above its low-stock level.</p>
          </SCard>
        </div>

        <PaymentLinksSummaryCard v-if="canShowPaymentLinksFeature" card-class="s-card" :limit="6" />
      </template>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted, watch, defineAsyncComponent, type Component } from 'vue'
import { CalendarDays, ChevronRight, Clock, Download, Store } from '@lucide/vue'
import SBadge from '~/components/s/SBadge.vue'
import SButton from '~/components/s/SButton.vue'
import SCard from '~/components/s/SCard.vue'
import SEmptyState from '~/components/s/SEmptyState.vue'
import SPageHeader from '~/components/s/SPageHeader.vue'
import SSelect from '~/components/s/SSelect.vue'
import SSkeleton from '~/components/s/SSkeleton.vue'
import SSparkline from '~/components/s/SSparkline.vue'
import SStat from '~/components/s/SStat.vue'
import STabs from '~/components/s/STabs.vue'
import PlanGate from '~/components/subscription/PlanGate.vue'
import { useDashboardPageRefreshRegister } from '~/composables/useDashboardPageRefresh'
import { EMPTY_CELL } from '~/utils/ui-empty'
import {
  DS_CHART_PALETTE_FALLBACK,
  mergeDsApexChartTheme,
  readDsChartPalette,
  type DsChartPalette,
} from '~/utils/ds-apex-chart'


const LazyApexChart = defineAsyncComponent(
  () => import('~/components/charts/LazyApexChart.client.vue')
)
import {
  ArrowUturnLeftIcon,
  BanknotesIcon,
  ChartBarIcon,
  CheckCircleIcon,
  CubeIcon,
  ExclamationTriangleIcon,
  ReceiptPercentIcon,
  ShoppingBagIcon,
  TagIcon,
  UsersIcon,
} from '~/utils/app-icons'
import { useReceiptsStore } from '~/stores/receipts'
import { useInventoryStore } from '~/stores/inventory'
import { useCustomersStore } from '~/stores/customers'
import { useDepartmentsStore } from '~/stores/departments'
import { useCustomerBuybacksStore } from '~/stores/customerBuybacks'
import { useSellerLoanOutsStore } from '~/stores/sellerLoanOuts'
import { useStorefrontStore } from '~/stores/storefront'
import { isStorefrontDashboardHidden } from '~/utils/storefront-launch'
import { useCustomerAccountsStore } from '~/stores/customerAccounts'
import { useAuthStore } from '~/stores/auth'
import { useUserStore } from '~/stores/user'
import { useStoresStore } from '~/stores/stores'
import { useThemeStore } from '~/stores/theme'
import { usePreferences } from '~/composables/usePreferences'
import { useAppToast } from '~/composables/useAppToast'
import PaymentLinksSummaryCard from '~/components/payments/PaymentLinksSummaryCard.vue'
import InlineStorePicker from '~/components/dashboard/InlineStorePicker.vue'
import { useAnalyticsFeatureInsights } from '~/composables/useAnalyticsFeatureInsights'
import { usePermissions } from '~/composables/usePermissions'
import { useStaffStore } from '~/stores/staff'
import {
  truncateChartLabel,
  safeTurnoverPercent,
  apexTheme,
  createChartCurrencyAxisFormatter,
} from '~/utils/analytics-charts'
import { formatAxisCurrency } from '~/utils/format-compact-currency'
import type { InventoryItem } from '~/stores/inventory'
import {
  formatMarginPercent,
  receiptLineRevenue,
  sumReceiptCogs,
  sumReceiptGrossProfit,
} from '~/utils/inventory-item-cost'
import {
  sumReceiptDiscounts,
  countDiscountedReceipts,
  discountRatePercent,
} from '~/utils/receipt-discounts'
import {
  downloadAnalyticsCsv,
  downloadAnalyticsPdf,
  type AnalyticsReportSnapshot,
} from '~/utils/analytics-report-export'

const { canViewProfitAndCost, isStaff, isManager } = usePermissions()
const staffStore = useStaffStore()

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
const storefrontStore = useStorefrontStore()
const storefrontDashboardHidden = isStorefrontDashboardHidden()
const customerAccountsStore = useCustomerAccountsStore()
const userStore = useUserStore()
const storesStore = useStoresStore()
const themeStore = useThemeStore()
const chartIsDark = computed(() => themeStore.actualTheme === 'dark')
const { canUse: canUseSubscriptionFeature } = useSubscriptionFeatures()
const { canShowPaymentLinksFeature } = usePaymentLinksLaunch()
const { canManageBranches } = useBusinessCapabilities()

// State
const hasInitialAnalyticsData = receiptsStore.receipts.length > 0 || inventoryStore.folders.length > 0
const isLoading = ref(!hasInitialAnalyticsData)
const isExporting = ref(false)

const selectedPeriod = ref<'daily' | 'weekly' | 'monthly'>('monthly')

const activeAnalyticsTab = ref('overview')

const { dashPath } = useDashboardPaths()

const webPeriodOptions = [
  { value: 'daily', label: 'Last 30 days' },
  { value: 'weekly', label: 'Last 12 weeks' },
  { value: 'monthly', label: 'Last 12 months' },
]

function onWebPeriodChange(value: string | number | null | undefined) {
  if (value !== 'daily' && value !== 'weekly' && value !== 'monthly') return
  selectedPeriod.value = value
  loadAnalytics()
}

const webAnalyticsTabs = [
  { value: 'overview', label: 'Overview' },
  { value: 'revenue', label: 'Revenue' },
  { value: 'products-customers', label: 'Products & customers' },
  { value: 'payments-traffic', label: 'Payments & busy times' },
  { value: 'reports', label: 'Top lists' },
]

function kpiTone(tone: AnalyticsKpiCardData['tone']): 'success' | 'warning' | 'error' | undefined {
  if (tone === 'warning') return 'warning'
  if (tone === 'danger') return 'error'
  return undefined
}

const chartPalette = ref<DsChartPalette>(DS_CHART_PALETTE_FALLBACK)

function dsChart<T extends Record<string, unknown>>(options: T): T {
  return mergeDsApexChartTheme(options, chartPalette.value)
}

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
  inStockPercentage: featureInStockPercentage,
  soldPercentage: featureSoldPercentage,
  lowStockPercentage: featureLowStockPercentage,
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

const periodDiscounts = computed(() => sumReceiptDiscounts(completedReceiptsInPeriod.value))

const periodDiscountedReceiptCount = computed(() =>
  countDiscountedReceipts(completedReceiptsInPeriod.value)
)

const periodDiscountRatePercent = computed(() =>
  discountRatePercent(periodDiscounts.value, periodSalesRevenue.value)
)

/** Current vs. equal-length prior window, in discount-rate percentage points (not % change of $). */
const discountRateChange = computed(() => {
  const now = new Date()
  const cutoffDate = new Date()
  let priorCutoff = new Date()
  switch (selectedPeriod.value) {
    case 'daily':
      cutoffDate.setDate(now.getDate() - 30)
      priorCutoff.setDate(now.getDate() - 60)
      break
    case 'weekly':
      cutoffDate.setDate(now.getDate() - 84)
      priorCutoff.setDate(now.getDate() - 168)
      break
    case 'monthly':
      cutoffDate.setMonth(now.getMonth() - 12)
      priorCutoff.setMonth(now.getMonth() - 24)
      break
  }
  const priorReceipts = receipts.value.filter((r) => {
    if (r.status !== 'completed') return false
    const receiptDate = r.date?.toDate ? r.date.toDate() : new Date(r.date)
    return receiptDate >= priorCutoff && receiptDate < cutoffDate
  })
  const priorDiscounts = sumReceiptDiscounts(priorReceipts)
  const priorRevenue = priorReceipts.reduce((sum, receipt) => sum + receiptLineRevenue(receipt), 0)
  const priorRate = discountRatePercent(priorDiscounts, priorRevenue)
  const currentRate = periodDiscountRatePercent.value
  if (priorRate === null || currentRate === null) return NaN
  return currentRate - priorRate
})

const discountRateChangeBadge = computed(() => {
  const v = discountRateChange.value
  if (Number.isNaN(v)) return null
  const rounded = Math.round(v * 10) / 10
  if (rounded === 0) return null
  return rounded > 0 ? `+${rounded}pt` : `${rounded}pt`
})

/** Rising discount rate is the concerning direction - no arrow badge (up/green would be
 *  backwards here), just a warning tone + the change spelled out in the subtext, matching
 *  how COGS/gross-profit already skip the directional trend badge on this page. */
const discountTileTone = computed(() => {
  const v = discountRateChange.value
  return !Number.isNaN(v) && v > 0.5 ? 'warning' : 'default'
})

const discountSubtext = computed(() => {
  const count = periodDiscountedReceiptCount.value
  if (count === 0) return 'No discounted sales this period'
  const rate = periodDiscountRatePercent.value
  const ratePart = rate !== null ? ` · ${formatMarginPercent(rate)} of gross sales` : ''
  const badge = discountRateChangeBadge.value
  const changePart = badge ? ` · ${badge} vs last period` : ''
  return `${count} sale${count === 1 ? '' : 's'} discounted${ratePart}${changePart}`
})

interface AnalyticsKpiCardData {
  key: string
  icon: Component
  label: string
  value: string
  tone?: 'default' | 'accent' | 'success' | 'warning' | 'danger'
  secondary?: string
  trend?: { value: string; positive: boolean } | null
  sparkline?: number[] | null
  progress?: number | null
  progressLabel?: string
}

/** Visual KPI row: icon + real trend/sparkline/progress per metric, instead of bare numbers. */
const analyticsKpiCards = computed(() => {
  const cards: AnalyticsKpiCardData[] = [
    {
      key: 'revenue',
      icon: BanknotesIcon,
      label: 'Total revenue',
      value: formatCurrency(totalRevenue.value),
      tone: 'accent',
      trend: revenueChangeBadge.value
        ? { value: revenueChangeBadge.value, positive: revenueChangePositive.value === true }
        : null,
      // Real per-period revenue history - same series driving the Revenue trends chart.
      sparkline: revenueChartSeries.value[0]?.data ?? null,
    },
    {
      key: 'completed',
      icon: CheckCircleIcon,
      label: 'Completed',
      value: formatCurrency(totalPeriodSales.value),
      tone: 'success',
      secondary: `${completedReceiptsInPeriod.value.length} sale${completedReceiptsInPeriod.value.length === 1 ? '' : 's'}`,
    },
    {
      key: 'orders',
      icon: ShoppingBagIcon,
      label: 'Orders',
      value: String(totalOrders.value),
      secondary: `${itemsSoldInPeriod.value} item${itemsSoldInPeriod.value === 1 ? '' : 's'} sold`,
    },
    {
      key: 'aov',
      icon: ReceiptPercentIcon,
      label: 'Avg. order',
      value: formatCurrency(averageOrderValue.value),
      secondary: `Across ${totalOrders.value} order${totalOrders.value === 1 ? '' : 's'}`,
    },
    {
      key: 'customers',
      icon: UsersIcon,
      label: 'Customers',
      value: String(uniqueCustomersInPeriod.value),
      secondary:
        uniqueCustomersInPeriod.value > 0
          ? `${repeatPurchaseRate.value.toFixed(0)}% repeat`
          : undefined,
    },
    {
      key: 'low-stock',
      icon: ExclamationTriangleIcon,
      label: 'Low stock',
      value: String(lowStockCount.value),
      tone: lowStockCount.value > 0 ? 'warning' : 'default',
      secondary: `${featureLowStockPercentage.value}% of inventory lines`,
      progress: featureLowStockPercentage.value,
      progressLabel: `${featureLowStockPercentage.value}% of stock lines`,
    },
    {
      key: 'refunds',
      icon: ArrowUturnLeftIcon,
      label: 'Refunds',
      value: String(refundedCount.value),
      tone: refundedCount.value > 0 ? 'danger' : 'default',
      secondary: refundRateText.value,
    },
  ]

  if (canViewProfitAndCost.value) {
    const revenueForCogsShare = totalRevenue.value
    const cogsShare =
      revenueForCogsShare > 0 ? Math.round((periodCogs.value / revenueForCogsShare) * 100) : null
    cards.push(
      {
        key: 'profit',
        icon: ChartBarIcon,
        label: 'Gross profit',
        value: formatCurrency(periodGrossProfit.value),
        tone: periodGrossProfit.value >= 0 ? 'success' : 'danger',
        secondary: grossProfitSubtext.value,
        progress: grossProfitMarginPercent.value,
        progressLabel:
          grossProfitMarginPercent.value !== null
            ? `${formatMarginPercent(grossProfitMarginPercent.value)} margin`
            : undefined,
      },
      {
        key: 'cogs',
        icon: CubeIcon,
        label: 'COGS',
        value: formatCurrency(periodCogs.value),
        secondary: cogsShare != null ? `${cogsShare}% of revenue` : undefined,
      },
      {
        key: 'discounts',
        icon: TagIcon,
        label: 'Discounts',
        value: formatCurrency(periodDiscounts.value),
        tone: discountTileTone.value,
        secondary: discountSubtext.value,
        sparkline: discountChartSeries.value[0]?.data ?? null,
      }
    )
  }

  return cards
})

const HERO_KPI_KEYS = ['revenue', 'orders', 'profit', 'customers', 'low-stock']

/** Four headline tiles; profit replaces customers for roles that can see cost. */
const heroKpiCards = computed(() => {
  const keys = HERO_KPI_KEYS.filter((key) =>
    canViewProfitAndCost.value ? key !== 'customers' : key !== 'profit'
  )
  return keys
    .map((key) => analyticsKpiCards.value.find((card) => card.key === key))
    .filter((card): card is AnalyticsKpiCardData => Boolean(card))
})

const secondaryKpiCards = computed(() => {
  const hero = new Set(heroKpiCards.value.map((card) => card.key))
  return analyticsKpiCards.value.filter((card) => !hero.has(card.key))
})

const insightTiles = computed(() =>
  featureInsights.value
    .filter((insight) => insight.href && insight.linkLabel)
    .filter((insight) => !(storefrontDashboardHidden && insight.id === 'storefront'))
    .map((insight) => {
      const first = insight.metrics[0]
      const firstLabel = first?.value === '1' ? first.label.replace(/s$/, '') : first?.label
      return {
        ...insight,
        value: insight.highlight ?? (first ? `${first.value} ${firstLabel!.toLowerCase()}` : ''),
      }
    })
)

function compactCurrency(value: number) {
  return formatAxisCurrency(value, preferences.value.currencySymbol || '$')
}

const overviewRevenueChartOptions = computed(() => ({
  ...revenueChartOptions.value,
  chart: { ...revenueChartOptions.value.chart, type: 'area' },
  fill: {
    type: 'gradient',
    gradient: { shadeIntensity: 1, opacityFrom: 0.24, opacityTo: 0, stops: [0, 100] },
  },
  xaxis: {
    ...revenueChartOptions.value.xaxis,
    axisBorder: { show: false },
    axisTicks: { show: false },
    tickAmount: selectedPeriod.value === 'daily' ? 6 : undefined,
  },
  yaxis: {
    ...revenueChartOptions.value.yaxis,
    labels: { ...revenueChartOptions.value.yaxis.labels, formatter: compactCurrency },
  },
}))

function donutChartOptions(config: {
  labels: string[]
  colors: string[]
  totalLabel: string
  totalValue: string
  formatValue: (value: number) => string
  formatTooltip?: (value: number) => string
}) {
  const palette = chartPalette.value
  const isDark = chartIsDark.value
  const textColor = getComputedStyle(document.documentElement).getPropertyValue('--s-text').trim() || undefined
  return {
    chart: { type: 'donut', background: 'transparent', fontFamily: palette.font, foreColor: palette.muted },
    labels: config.labels,
    colors: config.colors,
    stroke: { width: 0 },
    dataLabels: { enabled: false },
    legend: {
      position: 'bottom',
      fontSize: '12px',
      markers: { size: 5, offsetX: -2 },
      itemMargin: { horizontal: 8, vertical: 2 },
    },
    plotOptions: {
      pie: {
        donut: {
          size: '72%',
          labels: {
            show: true,
            name: { fontSize: '11px', offsetY: 18 },
            value: {
              fontSize: '18px',
              fontWeight: 600,
              color: textColor,
              offsetY: -14,
              formatter: (val: string) => config.formatValue(Number(val)),
            },
            total: {
              show: true,
              label: config.totalLabel,
              fontSize: '11px',
              fontWeight: 500,
              color: palette.muted,
              formatter: () => config.totalValue,
            },
          },
        },
      },
    },
    tooltip: {
      theme: isDark ? 'dark' : 'light',
      y: { formatter: (val: number) => (config.formatTooltip ?? config.formatValue)(val) },
    },
    states: { hover: { filter: { type: 'none' } }, active: { filter: { type: 'none' } } },
  }
}

const inventoryHealthSeries = computed(() => [
  featureInStockPercentage.value,
  featureLowStockPercentage.value,
  featureSoldPercentage.value,
])

const inventoryHealthChartOptions = computed(() => {
  void displayCurrencyDeps.value
  const palette = chartPalette.value
  return donutChartOptions({
    labels: ['Available', 'Low stock', 'Sold'],
    colors: [palette.success, palette.warning, palette.muted],
    totalLabel: 'Stock value',
    totalValue: compactCurrency(featureInventoryTotalValue.value),
    formatValue: (val) => `${Math.round(val)}%`,
  })
})

const paymentMethodsChartSeries = computed(() =>
  paymentMethodBreakdown.value.slice(0, 5).map((row) => row.revenue)
)

const paymentMethodsChartOptions = computed(() => {
  void displayCurrencyDeps.value
  const palette = chartPalette.value
  const rows = paymentMethodBreakdown.value.slice(0, 5)
  return donutChartOptions({
    labels: rows.map((row) => row.label),
    colors: [palette.accent, palette.info, palette.success, palette.warning, palette.muted],
    totalLabel: `${completedReceiptsInPeriod.value.length} sales`,
    totalValue: compactCurrency(rows.reduce((sum, row) => sum + row.revenue, 0)),
    formatValue: compactCurrency,
    formatTooltip: (val) => formatCurrency(val),
  })
})

const overviewTopProductsChartOptions = computed(() => {
  void displayCurrencyDeps.value
  const palette = chartPalette.value
  return donutChartOptions({
    labels: topProducts.value.slice(0, 5).map((p) => truncateChartLabel(p.name, 18)),
    colors: [palette.accent, palette.info, palette.success, palette.warning, palette.muted],
    totalLabel: 'Top 5',
    totalValue: compactCurrency(topProductsChartSeries.value.reduce((sum, v) => sum + v, 0)),
    formatValue: compactCurrency,
    formatTooltip: (val) => formatCurrency(val),
  })
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
  const isDark = chartIsDark.value
  const theme = apexTheme(isDark)
  const axisFmt = chartCurrencyAxis.value
  return {
    chart: { type: 'bar', toolbar: { show: false }, background: 'transparent' },
    colors: [isDark ? '#e4e4e7' : '#111827'],
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
  const isDark = chartIsDark.value
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
  const isDark = chartIsDark.value
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
    { from: 0.01, to: max > 0 ? q1 : scaleMax, color: isDark ? '#52525b' : '#d4d4d8' },
    ...(max > 0
      ? [
          { from: q1, to: q2, color: isDark ? '#71717a' : '#a1a1aa' },
          { from: q2, to: q3, color: isDark ? '#a1a1aa' : '#71717a' },
          { from: q3, to: max + 1, color: isDark ? '#e4e4e7' : '#3f3f46' },
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
  const isDark = chartIsDark.value

  const base = {
    chart: {
      type: 'line',
      toolbar: { show: false },
      zoom: { enabled: false },
      background: 'transparent',
    },
    colors: [isDark ? '#e4e4e7' : '#111827'],
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

  return base
})

const discountChartSeries = computed(() => {
  const data: number[] = []

  const now = new Date()
  let periods = 12

  if (selectedPeriod.value === 'daily') {
    periods = 30
    for (let i = periods - 1; i >= 0; i--) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)
      const dayDiscount = sumReceiptDiscounts(
        completedReceiptsInPeriod.value.filter((r) => {
          const receiptDate = r.date?.toDate ? r.date.toDate() : new Date(r.date)
          return receiptDate.toDateString() === date.toDateString()
        })
      )
      data.push(dayDiscount)
    }
  } else if (selectedPeriod.value === 'weekly') {
    for (let i = periods - 1; i >= 0; i--) {
      const date = new Date(now)
      date.setDate(date.getDate() - i * 7)
      const weekStart = new Date(date)
      weekStart.setDate(weekStart.getDate() - 7)
      const weekDiscount = sumReceiptDiscounts(
        completedReceiptsInPeriod.value.filter((r) => {
          const receiptDate = r.date?.toDate ? r.date.toDate() : new Date(r.date)
          return receiptDate >= weekStart && receiptDate < date
        })
      )
      data.push(weekDiscount)
    }
  } else {
    for (let i = periods - 1; i >= 0; i--) {
      const date = new Date(now)
      date.setMonth(date.getMonth() - i)
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1)
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0)
      const monthDiscount = sumReceiptDiscounts(
        completedReceiptsInPeriod.value.filter((r) => {
          const receiptDate = r.date?.toDate ? r.date.toDate() : new Date(r.date)
          return receiptDate >= monthStart && receiptDate <= monthEnd
        })
      )
      data.push(monthDiscount)
    }
  }

  return [
    {
      name: 'Discounts',
      data: data,
    },
  ]
})

const discountChartOptions = computed(() => {
  void displayCurrencyDeps.value
  const isDark = chartIsDark.value

  const base = {
    chart: {
      type: 'line',
      toolbar: { show: false },
      zoom: { enabled: false },
      background: 'transparent',
    },
    colors: [isDark ? '#fbbf24' : '#b45309'],
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

  return base
})

const topProductsChartSeries = computed(() => {
  return topProducts.value.slice(0, 5).map((p) => p.revenue)
})

const topProductsChartOptions = computed(() => {
  void displayCurrencyDeps.value
  const isDark = chartIsDark.value

  return {
    chart: {
      type: 'donut',
      background: 'transparent',
    },
    labels: topProducts.value.slice(0, 5).map((p) => truncateChartLabel(p.name, 20)),
    colors: [isDark ? '#e4e4e7' : '#d4d0c8', isDark ? '#a1a1aa' : '#a8a29e', isDark ? '#ffffff' : '#57534e', isDark ? '#71717a' : '#78716c', '#34d399'],
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
  const isDark = chartIsDark.value
  const theme = apexTheme(isDark)
  const axisFmt = chartCurrencyAxis.value
  const folders = topFoldersBySales.value
  const categories = folders.map((f) => truncateChartLabel(f.name, 18))

  return {
    chart: { type: 'bar', toolbar: { show: false }, background: 'transparent' },
    colors: [isDark ? '#e4e4e7' : '#111827'],
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
  const isDark = chartIsDark.value
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
const loadAnalytics = async (options?: { force?: boolean }) => {
  const hasData = receiptsStore.receipts.length > 0 || inventoryStore.folders.length > 0
  if (!hasData) {
    isLoading.value = true
  }
  try {
    const tasks: Promise<unknown>[] = [
      receiptsStore.fetchReceipts(options),
      inventoryStore.fetchFolders(options),
      departmentsStore.fetchDepartments(options),
    ]

    if (userStore.userData) {
      tasks.push(buybacksStore.fetchCustomerBuybacks(options?.force === true))
    }
    if (canUseSubscriptionFeature('seller_loans')) {
      tasks.push(sellerLoansStore.fetchSellerLoanOuts(options?.force === true))
    }
    if (canUseSubscriptionFeature('customer_balance')) {
      tasks.push(customerAccountsStore.fetchAccountsForStore())
    }
    tasks.push(storefrontStore.fetchAnalytics(options))

    await Promise.all(tasks)
    receipts.value = receiptsStore.receipts

    const grouped = await inventoryStore.fetchFolderAvailabilityStats(options)
    inventoryItems.value = Object.values(grouped).flat()
    analyticsFolderItems.value = grouped
  } catch (error) {
    console.error('Error loading analytics:', error)
    toast.error('Failed to load analytics data')
  } finally {
    isLoading.value = false
  }
}

useDashboardPageRefreshRegister(async () => {
  await loadAnalytics({ force: true })
})

function buildAnalyticsSnapshot(): AnalyticsReportSnapshot {
  const storeName =
    storesStore.currentStore?.name ||
    userStore.userData?.storeDetails?.storeName ||
    ''
  const businessName =
    userStore.userData?.storeDetails?.storeName ||
    userStore.userData?.name ||
    storeName ||
    'Storvv'
  const companyLogoUrl =
    userStore.userData?.storeLogoUrl || storesStore.currentStore?.logoUrl || ''

  return {
    periodLabel: periodLabel.value,
    selectedPeriod: selectedPeriod.value,
    formatCurrency,
    formatReturnDate,
    totalRevenue: totalRevenue.value,
    totalSales: totalSales.value,
    totalOrders: totalOrders.value,
    averageOrderValue: averageOrderValue.value,
    lowStockCount: lowStockCount.value,
    repeatPurchaseRate: repeatPurchaseRate.value,
    refundedCount: refundedCount.value,
    refundAmount: refundAmount.value,
    refundRate: refundRate.value,
    topProducts: topProducts.value,
    topCustomers: topCustomers.value,
    recentReturns: recentReturns.value,
    businessName,
    companyLogoUrl: companyLogoUrl || undefined,
  }
}

const exportToExcel = async () => {
  downloadAnalyticsCsv(buildAnalyticsSnapshot())
  toast.success('Report exported to Excel successfully!')
}

const exportToPDF = async () => {
  try {
    await downloadAnalyticsPdf(buildAnalyticsSnapshot())
    toast.success('Report exported successfully!')
  } catch (error) {
    console.error('Error exporting report:', error)
    toast.error('Failed to export report')
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

watch(chartIsDark, () => nextTick(() => (chartPalette.value = readDsChartPalette())), { flush: 'post' })

onMounted(() => {
  chartPalette.value = readDsChartPalette()
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
    if (isStaff.value && !isManager.value) {
      await staffStore.fetchCurrentStaffMember().catch(() => null)
      if (isStaff.value && !isManager.value) {
        await navigateTo('/dashboard')
        return
      }
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

