<template>
  <div class="w-full max-w-none space-y-5 pb-6 sm:space-y-6 sm:pb-8">
    <!-- Hero -->
    <DashboardPageHeader>
      <template #eyebrow>
        <p :class="eyebrowClass">Analytics</p>
      </template>
      <template #title>
        <h1 :class="pageTitleClass">Analytics & Reports</h1>
      </template>
      <template #description>
        <p :class="descriptionClass">
          Track your sales, inventory, and customer insights
        </p>
      </template>
      <template #actions>
        <div
          class="flex h-8 shrink-0 items-center rounded-lg border border-gray-200/90 bg-gray-50/50 p-0.5 dark:border-gray-700/80 dark:bg-white/[0.03]"
          role="group"
          aria-label="Analytics period"
        >
          <button
            v-for="period in analyticsPeriods"
            :key="period.value"
            type="button"
            class="rounded-md px-2.5 text-xs font-medium transition-colors"
            :class="
              selectedPeriod === period.value
                ? 'bg-white text-gray-900 shadow-sm dark:bg-white/10 dark:text-white'
                : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
            "
            @click="selectedPeriod = period.value; loadAnalytics()"
          >
            {{ period.label }}
          </button>
        </div>
        <button
          type="button"
          :disabled="isExporting"
          :class="[headerBtnClass, 'gap-1.5 !border !border-gray-200/90 !bg-white !font-medium !text-gray-800 hover:!bg-gray-50 dark:!border-gray-700/80 dark:!bg-dashboard-card dark:!text-gray-100']"
          @click="exportReport('pdf')"
        >
          <ArrowDownTrayIcon class="h-4 w-4 text-gray-500 dark:text-gray-400" />
          <span>{{ isExporting ? 'Exporting…' : 'Export PDF' }}</span>
        </button>
        <button
          type="button"
          :disabled="isExporting"
          :class="[headerBtnClass, 'gap-1.5 !border !border-emerald-200/90 !bg-emerald-50/90 !font-medium !text-emerald-800 hover:!bg-emerald-100/90 dark:!border-emerald-800/60 dark:!bg-emerald-950/40 dark:!text-emerald-300']"
          @click="exportReport('excel')"
        >
          <ArrowDownTrayIcon class="h-4 w-4 opacity-80" />
          <span>{{ isExporting ? 'Exporting…' : 'Export Excel' }}</span>
        </button>
      </template>
    </DashboardPageHeader>

    <!-- Loading State -->
    <template v-if="isLoading">
      <div class="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-5">
        <div
          v-for="i in 5"
          :key="i"
          class="rounded-sm bg-white p-3 dark:!bg-dashboard-card sm:p-3.5"
        >
          <div class="flex items-start justify-between gap-4">
            <div class="min-w-0 flex-1">
              <div class="mb-2 h-3 w-2/3 animate-pulse rounded bg-gray-200 dark:bg-white/10"></div>
              <div class="mb-1.5 h-7 w-3/4 animate-pulse rounded bg-gray-200 dark:bg-white/10 sm:h-8"></div>
              <div class="h-3 w-1/2 animate-pulse rounded bg-gray-200 dark:bg-white/10"></div>
            </div>
            <div class="h-11 w-11 shrink-0 animate-pulse rounded-sm bg-gray-200 dark:bg-white/10 sm:h-12 sm:w-12"></div>
          </div>
        </div>
      </div>
    </template>

    <!-- No store selected -->
    <template v-else-if="needsStoreSelection">
      <div
        class="rounded-sm bg-white/90 px-6 py-12 text-center dark:!bg-dashboard-card sm:px-10"
      >
        <div
          class="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-sm bg-gray-100 ring-1 ring-gray-200/80 dark:bg-gray-800/80 dark:ring-gray-700/60"
        >
          <BuildingStorefrontIcon class="h-7 w-7 text-gray-500 dark:text-gray-400" stroke-width="1.5" />
        </div>
        <p class="text-sm font-medium text-gray-900 dark:text-gray-100">Select a store to view analytics</p>
        <p class="mx-auto mt-1 max-w-sm text-xs text-gray-500 dark:text-gray-400">
          Choose a store from the selector in the top bar, or go to Settings to manage your stores.
        </p>
        <NuxtLink
          to="/dashboard/settings"
          class="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-gray-700 underline decoration-gray-300 underline-offset-2 transition hover:text-gray-900 dark:text-gray-300 dark:decoration-gray-600 dark:hover:text-white"
        >
          Go to Settings
        </NuxtLink>
      </div>
    </template>

    <!-- Analytics Content -->
    <template v-else>
      <!-- Key Metrics -->
      <div class="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-5">
        <StatCard
          label="Total revenue"
          :value="formatCurrency(totalRevenue)"
          subtext="vs previous period"
          :change="revenueChangeBadge"
          :change-positive="revenueChangePositive"
        />
        <StatCard
          label="Total sales"
          :value="totalSales.toString()"
          :subtext="`${totalOrders} orders`"
        />
        <StatCard
          label="Avg. order value"
          :value="formatCurrency(averageOrderValue)"
          subtext="Per transaction"
        />
        <StatCard
          label="Low stock items"
          :value="lowStockCount.toString()"
          :subtext="lowStockCount > 0 ? 'Need restocking' : 'All stocked'"
          :subtext-class="lowStockCount > 0 ? 'text-amber-600 dark:text-amber-400 text-xs font-medium' : 'text-gray-500 dark:text-gray-400 text-xs'"
        />
        <StatCard
          label="Refunds"
          :value="refundedCount.toString()"
          :subtext="`${formatCurrency(refundAmount)} · ${refundRateText}`"
          subtext-class="text-red-600 dark:text-red-400 text-xs"
        />
      </div>

      <!-- Charts Row -->
      <div class="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-3">
        <!-- Revenue Trend Chart -->
        <Card
          class="lg:col-span-2"
          padding="sm"
          extra-class="!p-4 rounded-sm bg-white/90 dark:!bg-dashboard-card"
        >
          <div class="mb-4 flex items-center justify-between">
            <div>
              <h2 class="text-xs font-semibold tracking-tight text-gray-900 dark:text-gray-50 sm:text-sm">
                Revenue Trends
              </h2>
              <p class="mt-0.5 text-[11px] text-gray-500 dark:text-gray-400">{{ periodLabel }}</p>
            </div>
          </div>
          <apexchart
            type="line"
            height="300"
            :options="revenueChartOptions"
            :series="revenueChartSeries"
          />
        </Card>

        <!-- Top Products Chart -->
        <Card
          padding="sm"
          extra-class="!p-4 rounded-sm bg-white/90 dark:!bg-dashboard-card"
        >
          <div class="mb-4">
            <h2 class="text-xs font-semibold tracking-tight text-gray-900 dark:text-gray-50 sm:text-sm">
              Top Products
            </h2>
            <p class="mt-0.5 text-[11px] text-gray-500 dark:text-gray-400">By sales volume</p>
          </div>
          <apexchart
            type="donut"
            height="300"
            :options="topProductsChartOptions"
            :series="topProductsChartSeries"
          />
        </Card>
      </div>

      <!-- Inventory & Customer Insights Row -->
      <div class="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-2">
        <!-- Inventory Turnover -->
        <Card
          padding="sm"
          extra-class="!p-4 rounded-sm bg-white/90 dark:!bg-dashboard-card"
        >
          <div class="mb-4">
            <h2 class="text-xs font-semibold tracking-tight text-gray-900 dark:text-gray-50 sm:text-sm">
              Inventory Turnover
            </h2>
            <p class="mt-0.5 text-[11px] text-gray-500 dark:text-gray-400">Sales vs Stock levels</p>
          </div>
          <apexchart
            type="bar"
            height="250"
            :options="inventoryTurnoverChartOptions"
            :series="inventoryTurnoverChartSeries"
          />
        </Card>

        <!-- Customer Insights -->
        <Card
          padding="sm"
          extra-class="!p-4 rounded-sm bg-white/90 dark:!bg-dashboard-card"
        >
          <div class="mb-4">
            <h2 class="text-xs font-semibold tracking-tight text-gray-900 dark:text-gray-50 sm:text-sm">
              Customer Insights
            </h2>
            <p class="mt-0.5 text-[11px] text-gray-500 dark:text-gray-400">Top customers & repeat rate</p>
          </div>
          <apexchart
            type="bar"
            height="250"
            :options="customerChartOptions"
            :series="customerChartSeries"
          />
        </Card>
      </div>

      <!-- Peak hours, Sales by day, Busiest time -->
      <div class="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-3">
        <!-- Busiest day & hour -->
        <Card
          padding="sm"
          extra-class="!p-4 overflow-hidden rounded-sm border border-gray-200/80 bg-white/90 dark:border-gray-800/70 dark:!bg-dashboard-card"
        >
          <div class="flex items-start justify-between gap-3">
            <div class="flex min-w-0 items-start gap-2.5">
              <div
                class="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-sm bg-gray-100 dark:bg-gray-800/80"
              >
                <ClockIcon class="h-4 w-4 text-gray-600 dark:text-gray-300" />
              </div>
              <div class="min-w-0">
                <h2 class="text-xs font-semibold leading-tight tracking-tight text-gray-900 dark:text-gray-50 sm:text-sm">
                  Busiest time
                </h2>
                <p class="mt-0.5 text-[11px] text-gray-500 dark:text-gray-400">Peak day & hour in period</p>
              </div>
            </div>
            <span
              class="flex-shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600 dark:bg-gray-800/80 dark:text-gray-300"
            >
              {{ selectedPeriod === 'daily' ? 'Today' : selectedPeriod === 'weekly' ? 'This week' : 'This month' }}
            </span>
          </div>

          <div
            class="mt-3 rounded-sm bg-gray-50/90 p-3 dark:!bg-dashboard-card"
          >
            <p class="text-[11px] text-gray-500 dark:text-gray-400">Highest revenue occurs at</p>
            <p class="mt-0.5 text-base font-semibold tracking-tight text-gray-900 dark:text-gray-100">
              {{ busiestTimeSummary }}
            </p>
          </div>
        </Card>

        <!-- Sales by hour (peak hours) -->
        <Card
          padding="sm"
          extra-class="!p-4 lg:col-span-2 rounded-sm bg-white/90 dark:!bg-dashboard-card"
        >
          <div class="mb-4">
            <h2 class="text-xs font-semibold tracking-tight text-gray-900 dark:text-gray-50 sm:text-sm">
              Sales by hour
            </h2>
            <p class="mt-0.5 text-[11px] text-gray-500 dark:text-gray-400">Peak hours (revenue)</p>
          </div>
          <apexchart
            type="bar"
            height="250"
            :options="peakHoursChartOptions"
            :series="peakHoursChartSeries"
          />
        </Card>
      </div>

      <div class="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-2">
        <!-- Sales by day of week -->
        <Card
          padding="sm"
          extra-class="!p-4 rounded-sm bg-white/90 dark:!bg-dashboard-card"
        >
          <div class="mb-4">
            <h2 class="text-xs font-semibold tracking-tight text-gray-900 dark:text-gray-50 sm:text-sm">
              Sales by day of week
            </h2>
            <p class="mt-0.5 text-[11px] text-gray-500 dark:text-gray-400">Best and worst days</p>
          </div>
          <apexchart
            type="bar"
            height="250"
            :options="salesByDayChartOptions"
            :series="salesByDayChartSeries"
          />
        </Card>

        <!-- Traffic heatmap: day × hour -->
        <Card
          padding="sm"
          extra-class="!p-4 rounded-sm bg-white/90 dark:!bg-dashboard-card"
        >
          <div class="mb-4">
            <h2 class="text-xs font-semibold tracking-tight text-gray-900 dark:text-gray-50 sm:text-sm">
              Traffic heatmap
            </h2>
            <p class="mt-0.5 text-[11px] text-gray-500 dark:text-gray-400">Revenue by day × hour</p>
          </div>
          <apexchart
            type="heatmap"
            height="280"
            :options="heatmapChartOptions"
            :series="heatmapSeries"
          />
        </Card>
      </div>

      <!-- Detailed Tables -->
      <div class="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-3">
        <!-- Top Products -->
        <div class="data-table-shell flex min-h-0 flex-col overflow-hidden">
          <DataTableToolbar>
            <template #heading>
              <div class="min-w-0">
                <p
                  class="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-400 dark:text-gray-500"
                >
                  Top products
                </p>
                <p class="mt-1 text-[11px] text-gray-500 dark:text-gray-400">{{ periodLabel }}</p>
              </div>
            </template>
          </DataTableToolbar>
          <div class="overflow-x-auto px-3 pb-3 sm:px-4">
            <table class="dashboard-table min-w-full">
              <thead>
                <tr class="border-b border-gray-200/80 dark:border-gray-800/70">
                  <th class="text-left py-1.5 pr-2 text-[11px] font-medium text-gray-500 dark:text-gray-400">Product</th>
                  <th class="text-right py-1.5 px-2 text-[11px] font-medium text-gray-500 dark:text-gray-400">Qty</th>
                  <th class="text-right py-1.5 pl-2 text-[11px] font-medium text-gray-500 dark:text-gray-400">Revenue</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(product, i) in topProducts" :key="product.id" class="border-b border-gray-100 dark:border-gray-800/80 last:border-0">
                  <td class="py-1.5 pr-2">
                    <span class="text-[10px] text-gray-400 dark:text-gray-500 w-4 inline-block">{{ i + 1 }}</span>
                    <span class="text-gray-900 dark:text-gray-100 truncate">{{ product.name }}</span>
                  </td>
                  <td class="py-1.5 px-2 text-right text-gray-700 dark:text-gray-300">{{ product.quantity }}</td>
                  <td class="py-1.5 pl-2 text-right" :class="tableMoneyClass()">{{ formatCurrency(product.revenue) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Top Customers -->
        <div class="data-table-shell flex min-h-0 flex-col overflow-hidden">
          <DataTableToolbar>
            <template #heading>
              <div class="min-w-0">
                <p
                  class="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-400 dark:text-gray-500"
                >
                  Top customers
                </p>
                <p class="mt-1 text-[11px] text-gray-500 dark:text-gray-400">{{ periodLabel }}</p>
              </div>
            </template>
          </DataTableToolbar>
          <div class="overflow-x-auto px-3 pb-3 sm:px-4">
            <table class="dashboard-table min-w-full">
              <thead>
                <tr class="border-b border-gray-200/80 dark:border-gray-800/70">
                  <th class="text-left py-1.5 pr-2 text-[11px] font-medium text-gray-500 dark:text-gray-400">Customer</th>
                  <th class="text-right py-1.5 px-2 text-[11px] font-medium text-gray-500 dark:text-gray-400">Orders</th>
                  <th class="text-right py-1.5 pl-2 text-[11px] font-medium text-gray-500 dark:text-gray-400">Spent</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(customer, i) in topCustomers" :key="customer.email" class="border-b border-gray-100 dark:border-gray-800/80 last:border-0">
                  <td class="py-1.5 pr-2">
                    <span class="text-[10px] text-gray-400 dark:text-gray-500 w-4 inline-block">{{ i + 1 }}</span>
                    <div>
                      <span class="text-gray-900 dark:text-gray-100 font-medium">{{ customer.name }}</span>
                      <span class="text-[10px] text-gray-500 dark:text-gray-400 block truncate max-w-[140px]">{{ customer.email }}</span>
                    </div>
                  </td>
                  <td class="py-1.5 px-2 text-right text-gray-700 dark:text-gray-300">{{ customer.orders }}</td>
                  <td class="py-1.5 pl-2 text-right" :class="tableMoneyClass()">{{ formatCurrency(customer.totalSpent) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Recent Returns -->
        <div class="data-table-shell flex min-h-0 flex-col overflow-hidden">
          <DataTableToolbar>
            <template #heading>
              <div class="min-w-0">
                <p
                  class="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-400 dark:text-gray-500"
                >
                  Recent returns
                </p>
                <p class="mt-1 text-[11px] text-gray-500 dark:text-gray-400">{{ periodLabel }}</p>
              </div>
            </template>
          </DataTableToolbar>
          <div class="overflow-x-auto px-3 pb-3 sm:px-4">
            <table class="dashboard-table min-w-full">
              <thead>
                <tr class="border-b border-gray-200/80 dark:border-gray-800/70">
                  <th class="text-left py-1.5 pr-2 text-[11px] font-medium text-gray-500 dark:text-gray-400">Receipt</th>
                  <th class="text-left py-1.5 px-2 text-[11px] font-medium text-gray-500 dark:text-gray-400">Date</th>
                  <th class="text-right py-1.5 px-2 text-[11px] font-medium text-gray-500 dark:text-gray-400">Amount</th>
                  <th class="text-left py-1.5 pl-2 text-[11px] font-medium text-gray-500 dark:text-gray-400">Reason</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="ret in recentReturns" :key="ret.id" class="border-b border-gray-100 dark:border-gray-800/80 last:border-0">
                  <td class="py-1.5 pr-2 font-medium text-gray-900 dark:text-gray-100">{{ ret.receiptNumber }}</td>
                  <td class="py-1.5 px-2 text-gray-700 dark:text-gray-300">{{ formatReturnDate(ret.date) }}</td>
                  <td class="py-1.5 px-2 text-right font-medium text-red-600 dark:text-red-400">-{{ formatCurrency(ret.amount) }}</td>
                  <td class="py-1.5 pl-2 text-gray-600 dark:text-gray-400 max-w-[100px] truncate" :title="ret.reason">{{ ret.reason }}</td>
                </tr>
                <tr v-if="recentReturns.length === 0">
                  <td colspan="4" class="py-3 text-center text-[11px] text-gray-500 dark:text-gray-400">No returns in this period</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Low stock -->
      <div class="data-table-shell flex min-h-0 flex-col overflow-hidden">
        <DataTableToolbar>
          <template #heading>
            <div class="min-w-0">
              <p
                class="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-400 dark:text-gray-500"
              >
                Low stock
              </p>
              <p class="mt-1 text-[11px] text-gray-500 dark:text-gray-400">Items at or below threshold</p>
            </div>
          </template>
          <template #actions>
            <NuxtLink
              to="/dashboard/inventory"
              class="text-[11px] font-medium text-gray-600 transition hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
            >
              View inventory →
            </NuxtLink>
          </template>
        </DataTableToolbar>
        <div class="space-y-1.5 px-3 pb-3 sm:px-4">
          <template v-if="lowStockItems.length > 0">
            <NuxtLink
              v-for="item in lowStockItems"
              :key="item.id"
              :to="item.folderId ? `/dashboard/inventory/${item.folderId}` : '/dashboard/inventory'"
              class="flex justify-between items-baseline gap-2 py-1 hover:opacity-80 transition-opacity"
            >
              <div class="min-w-0 flex-1">
                <p class="text-xs font-medium text-gray-900 dark:text-gray-100 truncate">{{ item.name }}</p>
                <p class="text-[10px] text-gray-500 dark:text-gray-400 truncate">{{ item.folderName }}<span v-if="item.itemCount > 1"> · {{ item.itemCount }} items</span></p>
              </div>
              <span class="text-xs font-semibold text-amber-600 dark:text-amber-400 flex-shrink-0">{{ item.quantity }}/{{ item.threshold }}</span>
            </NuxtLink>
          </template>
          <p v-else class="text-xs text-gray-500 dark:text-gray-400 py-1">All stocked</p>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  ArrowDownTrayIcon,
  BuildingStorefrontIcon,
  ClockIcon,
} from '@heroicons/vue/24/outline'
import { useReceiptsStore } from '~/stores/receipts'
import { useInventoryStore } from '~/stores/inventory'
import { useCustomersStore } from '~/stores/customers'
import { useAuthStore } from '~/stores/auth'
import { useUserStore } from '~/stores/user'
import { useThemeStore } from '~/stores/theme'
import { usePreferences } from '~/composables/usePreferences'
import { useAppToast } from '~/composables/useAppToast'
import Card from '~/components/ui/Card.vue'
import DataTableToolbar from '~/components/ui/DataTableToolbar.vue'
import StatCard from '~/components/ui/StatCard.vue'
import jsPDF from 'jspdf'
import { tableMoneyClass } from '~/utils/table-money-styles'

definePageMeta({
  layout: 'dashboard'
})

useHead({
  title: 'Analytics & Reports - Storvv',
})

const { formatCurrency, preferences, baseCurrency, initialize: initPreferences } = usePreferences()
const toast = useAppToast()

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
    minute: '2-digit'
  })
}
const receiptsStore = useReceiptsStore()
const inventoryStore = useInventoryStore()
const customersStore = useCustomersStore()
const userStore = useUserStore()
const themeStore = useThemeStore()
const { canUse: canUseSubscriptionFeature } = useSubscriptionFeatures()

// State
const isLoading = ref(true)
const isExporting = ref(false)
const { eyebrowClass, pageTitleClass, descriptionClass, headerBtnClass } = useDashboardPageChrome()

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
  
  return receipts.value.filter(r => {
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
    .filter(r => {
      const receiptDate = r.date?.toDate ? r.date.toDate() : new Date(r.date)
      return receiptDate >= currentPeriodStart
    })
    .reduce((sum, r) => sum + (r.total || 0), 0)
  
  const previousPeriodRevenue = receipts.value
    .filter(r => {
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
  const productMap = new Map<string, { name: string; quantity: number; revenue: number; id: string }>()
  
  filteredReceipts.value.forEach(receipt => {
    receipt.items?.forEach((item: any) => {
      const existing = productMap.get(item.itemName) || {
        name: item.itemName,
        quantity: 0,
        revenue: 0,
        id: item.itemId || item.itemName
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
  const customerMap = new Map<string, { name: string; email: string; orders: number; totalSpent: number }>()
  
  filteredReceipts.value.forEach(receipt => {
    if (receipt.customerEmail) {
      const existing = customerMap.get(receipt.customerEmail) || {
        name: receipt.customerName || 'Unknown',
        email: receipt.customerEmail,
        orders: 0,
        totalSpent: 0
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
  filteredReceipts.value.forEach(receipt => {
    if (receipt.customerEmail) {
      customerOrders.set(receipt.customerEmail, (customerOrders.get(receipt.customerEmail) || 0) + 1)
    }
  })
  
  const repeatCustomers = Array.from(customerOrders.values()).filter(count => count > 1).length
  const totalCustomers = customerOrders.size
  
  return totalCustomers > 0 ? (repeatCustomers / totalCustomers) * 100 : 0
})

const lowStockItems = computed(() => {
  // Get low stock threshold from user settings
  const lowStockThreshold = userStore.userData?.storeDetails?.settings?.inventory?.lowStockThreshold || 10
  
  // First, filter out sold items (items with dateOut) and get available items
  const availableItems = inventoryItems.value.filter(item => {
    // Check if item is sold (has dateOut)
    const dateOutValue = item.dateOut
    const isSold = dateOutValue !== null && dateOutValue !== undefined && dateOutValue !== ''
    return !isSold
  })
  
  // Group available items by brand and model first
  const groupedMap = new Map<string, {
    brand: string
    model: string
    totalQuantity: number
    threshold: number
    folderName: string
    itemIds: string[]
    folder: any
  }>()
  
  availableItems.forEach(item => {
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
        folder: folder
      })
    }
  })
  
  // Now filter to only show groups that are low stock
  const lowStockGroups = Array.from(groupedMap.values()).filter(group => {
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
    itemCount: group.itemIds.length
  }))
})

const lowStockCount = computed(() => lowStockItems.value.length)

// Refund metrics (period-filtered)
const refundedReceiptsInPeriod = computed(() =>
  filteredReceipts.value.filter(r => r.status === 'refunded')
)
const refundedCount = computed(() => refundedReceiptsInPeriod.value.length)
const refundAmount = computed(() =>
  refundedReceiptsInPeriod.value.reduce((sum, r) => sum + (r.total || 0), 0)
)
const completedCountInPeriod = computed(() =>
  filteredReceipts.value.filter(r => r.status === 'completed').length
)
const refundRate = computed(() => {
  const total = completedCountInPeriod.value + refundedCount.value
  return total > 0 ? (refundedCount.value / total) * 100 : 0
})
const refundRateText = computed(() => `${refundRate.value.toFixed(1)}% refund rate`)

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
    .map(r => {
      const d = r.updatedAt ? (r.updatedAt?.toDate ? r.updatedAt.toDate() : new Date(r.updatedAt)) : (r.date?.toDate ? r.date.toDate() : new Date(r.date))
      return {
        id: r.id,
        receiptNumber: r.receiptNumber,
        date: d,
        amount: r.total || 0,
        reason: getRefundReason(r)
      }
    })
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 10)
)

// Completed receipts only (for sales-by-time analytics)
const completedReceiptsInPeriod = computed(() =>
  filteredReceipts.value.filter(r => r.status === 'completed')
)

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const HOUR_LABELS = Array.from({ length: 24 }, (_, i) => {
  if (i === 0) return '12am'
  if (i === 12) return '12pm'
  return i < 12 ? `${i}am` : `${i - 12}pm`
})

// Sales by hour (0-23): revenue and order count per hour
const salesByHour = computed(() => {
  const byHour = Array.from({ length: 24 }, (_, hour) => ({ hour, revenue: 0, count: 0 }))
  completedReceiptsInPeriod.value.forEach(r => {
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
  completedReceiptsInPeriod.value.forEach(r => {
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
  completedReceiptsInPeriod.value.forEach(r => {
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
      data: row ? row.map((revenue, hour) => ({ x: HOUR_LABELS[hour], y: Math.round(revenue * 100) / 100 })) : []
    }
  })
})
const heatmapMaxRevenue = computed(() => {
  let max = 0
  heatmapSeries.value.forEach(s => {
    s.data?.forEach((d: { y: number }) => { if (d.y > max) max = d.y })
  })
  return max
})

const peakHoursChartSeries = computed(() => [{
  name: 'Revenue',
  data: salesByHour.value.map(s => s.revenue)
}])
const peakHoursChartOptions = computed(() => {
  void displayCurrencyDeps.value
  const isDark = themeStore.actualTheme === 'dark'
  const textColor = isDark ? '#E5E7EB' : '#1F2937'
  const mutedColor = isDark ? '#9CA3AF' : '#6B7280'
  const borderColor = isDark ? '#4B5563' : '#E5E7EB'
  return {
    chart: { type: 'bar', toolbar: { show: false }, background: 'transparent' },
    colors: [isDark ? '#60a5fa' : '#2563eb'],
    xaxis: {
      categories: HOUR_LABELS,
      labels: {
        style: { colors: mutedColor, fontSize: '10px' },
        rotate: -45,
        rotateAlways: false
      },
      axisBorder: { show: true, color: borderColor },
      axisTicks: { show: true, color: borderColor },
      title: { style: { color: textColor, fontSize: '12px' } }
    },
    yaxis: {
      labels: {
        style: { colors: mutedColor, fontSize: '12px' },
        formatter: (val: number) => formatCurrency(val)
      },
      axisBorder: { show: true, color: borderColor },
      axisTicks: { show: true, color: borderColor },
      title: { style: { color: textColor, fontSize: '12px' } }
    },
    grid: {
      borderColor,
      strokeDashArray: 4,
      xaxis: { lines: { show: true } },
      yaxis: { lines: { show: true } }
    },
    tooltip: {
      theme: isDark ? 'dark' : 'light',
      style: { fontSize: '12px' },
      y: { formatter: (val: number) => formatCurrency(val), title: { formatter: () => 'Revenue' } }
    },
    theme: { mode: isDark ? 'dark' : 'light' }
  }
})

const salesByDayChartSeries = computed(() => [{
  name: 'Revenue',
  data: salesByDayOfWeek.value.map(s => s.revenue)
}])
const salesByDayChartOptions = computed(() => {
  void displayCurrencyDeps.value
  const isDark = themeStore.actualTheme === 'dark'
  return {
    chart: { type: 'bar', toolbar: { show: false }, background: 'transparent' },
    colors: ['#059669'],
    xaxis: {
      categories: DAY_NAMES,
      labels: { style: { colors: isDark ? '#9CA3AF' : '#1F2937', fontSize: '12px' } },
      axisBorder: { show: true, color: isDark ? '#374151' : '#E5E7EB' },
      axisTicks: { show: true, color: isDark ? '#374151' : '#E5E7EB' }
    },
    yaxis: {
      labels: { style: { colors: isDark ? '#9CA3AF' : '#1F2937', fontSize: '12px' } },
      formatter: (val: number) => formatCurrency(val)
    },
    grid: { borderColor: isDark ? '#374151' : '#E5E7EB', strokeDashArray: 4 },
    tooltip: { theme: isDark ? 'dark' : 'light', y: { formatter: (val: number) => formatCurrency(val) } },
    theme: { mode: isDark ? 'dark' : 'light' }
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
    ...(max > 0 ? [
      { from: q1, to: q2, color: isDark ? '#1d4ed8' : '#60a5fa' },
      { from: q2, to: q3, color: isDark ? '#2563eb' : '#3b82f6' },
      { from: q3, to: max + 1, color: isDark ? '#3b82f6' : '#1d4ed8' }
    ] : [])
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
          ranges
        }
      }
    },
    xaxis: {
      categories: HOUR_LABELS,
      labels: {
        style: { colors: mutedColor, fontSize: '9px' },
        rotate: -45,
        rotateAlways: false
      },
      axisBorder: { show: true, color: borderColor },
      axisTicks: { show: true, color: borderColor }
    },
    yaxis: {
      labels: {
        style: { colors: mutedColor, fontSize: '11px' }
      },
      axisBorder: { show: true, color: borderColor },
      axisTicks: { show: true, color: borderColor }
    },
    dataLabels: { enabled: false },
    grid: {
      borderColor,
      strokeDashArray: 1,
      xaxis: { lines: { show: true } },
      yaxis: { lines: { show: true } }
    },
    tooltip: {
      theme: isDark ? 'dark' : 'light',
      style: { fontSize: '12px' },
      x: { formatter: (val: string) => val },
      y: {
        formatter: (val: number) => formatCurrency(val),
        title: { formatter: () => 'Revenue' }
      }
    },
    legend: {
      labels: { colors: textColor }
    },
    theme: { mode: isDark ? 'dark' : 'light' }
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
        .filter(r => {
          const receiptDate = r.date?.toDate ? r.date.toDate() : new Date(r.date)
          return receiptDate.toDateString() === date.toDateString()
        })
        .reduce((sum, r) => sum + (r.total || 0), 0)
      data.push(dayRevenue)
    }
  } else if (selectedPeriod.value === 'weekly') {
    for (let i = periods - 1; i >= 0; i--) {
      const date = new Date(now)
      date.setDate(date.getDate() - (i * 7))
      categories.push(`Week ${periods - i}`)
      
      const weekStart = new Date(date)
      weekStart.setDate(weekStart.getDate() - 7)
      const weekRevenue = filteredReceipts.value
        .filter(r => {
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
        .filter(r => {
          const receiptDate = r.date?.toDate ? r.date.toDate() : new Date(r.date)
          return receiptDate >= monthStart && receiptDate <= monthEnd
        })
        .reduce((sum, r) => sum + (r.total || 0), 0)
      data.push(monthRevenue)
    }
  }
  
  return [{
    name: 'Revenue',
    data: data
  }]
})

const revenueChartOptions = computed(() => {
  void displayCurrencyDeps.value
  const isDark = themeStore.actualTheme === 'dark'

  return {
    chart: {
      type: 'line',
      toolbar: { show: false },
      zoom: { enabled: false },
      background: 'transparent'
    },
    colors: ['#2563eb'],
    stroke: {
      curve: 'smooth',
      width: 2
    },
    xaxis: {
      categories: revenueChartSeries.value[0]?.data.map((_, i) => {
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
          fontSize: '12px'
        }
      },
      axisBorder: {
        show: true,
        color: isDark ? '#374151' : '#E5E7EB'
      },
      axisTicks: {
        show: true,
        color: isDark ? '#374151' : '#E5E7EB'
      }
    },
    yaxis: {
      labels: {
        style: {
          colors: isDark ? '#9CA3AF' : '#1F2937',
          fontSize: '12px'
        },
        formatter: (val: number) => formatCurrency(val)
      }
    },
    grid: {
      borderColor: isDark ? '#374151' : '#E5E7EB',
      strokeDashArray: 4
    },
    tooltip: {
      theme: isDark ? 'dark' : 'light',
      y: {
        formatter: (val: number) => formatCurrency(val)
      }
    },
    theme: {
      mode: isDark ? 'dark' : 'light'
    }
  }
})

const topProductsChartSeries = computed(() => {
  return topProducts.value.slice(0, 5).map(p => p.revenue)
})

const topProductsChartOptions = computed(() => {
  void displayCurrencyDeps.value
  const isDark = themeStore.actualTheme === 'dark'
  
  return {
    chart: {
      type: 'donut',
      background: 'transparent'
    },
    labels: topProducts.value.slice(0, 5).map(p => p.name),
    colors: ['#2563eb', '#7c3aed', '#dc2626', '#ea580c', '#059669'],
    legend: {
      position: 'bottom',
      labels: {
        colors: isDark ? '#9CA3AF' : '#1F2937'
      }
    },
    tooltip: {
      theme: isDark ? 'dark' : 'light',
      y: {
        formatter: (val: number) => formatCurrency(val)
      }
    },
    theme: {
      mode: isDark ? 'dark' : 'light'
    }
  }
})

const inventoryTurnoverChartSeries = computed(() => {
  const folders = inventoryStore.folders
  const turnoverData = folders.map(folder => {
    const folderItems = inventoryItems.value.filter(item => item.folderId === folder.id)
    const totalValue = folderItems.reduce((sum, item) => {
      const price = item.price || item.Price || 0
      const quantity = item.quantity || item.Quantity || 0
      return sum + (price * quantity)
    }, 0)
    
    const salesFromFolder = filteredReceipts.value
      .flatMap(r => r.items || [])
      .filter(item => {
        const folderItem = inventoryItems.value.find(i => i.id === item.itemId)
        return folderItem?.folderId === folder.id
      })
      .reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 0)), 0)
    
    return salesFromFolder > 0 ? (salesFromFolder / totalValue) * 100 : 0
  })
  
  return [{
    name: 'Turnover Rate (%)',
    data: turnoverData
  }]
})

const inventoryTurnoverChartOptions = computed(() => {
  const isDark = themeStore.actualTheme === 'dark'

  return {
    chart: {
      type: 'bar',
      toolbar: { show: false },
      background: 'transparent'
    },
    colors: ['#7c3aed'],
    xaxis: {
      categories: inventoryStore.folders.map(f => f.name),
      labels: {
        style: {
          colors: isDark ? '#9CA3AF' : '#1F2937',
          fontSize: '12px'
        }
      },
      axisBorder: {
        show: true,
        color: isDark ? '#374151' : '#E5E7EB'
      },
      axisTicks: {
        show: true,
        color: isDark ? '#374151' : '#E5E7EB'
      }
    },
    yaxis: {
      labels: {
        style: {
          colors: isDark ? '#9CA3AF' : '#1F2937',
          fontSize: '12px'
        }
      },
      title: {
        text: 'Turnover Rate (%)',
        style: {
          color: isDark ? '#9CA3AF' : '#1F2937',
          fontSize: '12px',
          fontWeight: 500
        }
      }
    },
    grid: {
      borderColor: isDark ? '#374151' : '#E5E7EB',
      strokeDashArray: 4
    },
    tooltip: {
      theme: isDark ? 'dark' : 'light'
    },
    theme: {
      mode: isDark ? 'dark' : 'light'
    }
  }
})

const customerChartSeries = computed(() => {
  return [{
    name: 'Total Spent',
    data: topCustomers.value.slice(0, 5).map(c => c.totalSpent)
  }]
})

const customerChartOptions = computed(() => {
  void displayCurrencyDeps.value
  const isDark = themeStore.actualTheme === 'dark'

  return {
    chart: {
      type: 'bar',
      toolbar: { show: false },
      background: 'transparent'
    },
    colors: ['#059669'],
    xaxis: {
      categories: topCustomers.value.slice(0, 5).map(c => c.name.split(' ')[0]),
      labels: {
        style: {
          colors: isDark ? '#9CA3AF' : '#1F2937',
          fontSize: '12px'
        }
      },
      axisBorder: {
        show: true,
        color: isDark ? '#374151' : '#E5E7EB'
      },
      axisTicks: {
        show: true,
        color: isDark ? '#374151' : '#E5E7EB'
      }
    },
    yaxis: {
      labels: {
        style: {
          colors: isDark ? '#9CA3AF' : '#1F2937',
          fontSize: '12px'
        },
        formatter: (val: number) => formatCurrency(val)
      }
    },
    grid: {
      borderColor: isDark ? '#374151' : '#E5E7EB',
      strokeDashArray: 4
    },
    tooltip: {
      theme: isDark ? 'dark' : 'light',
      y: {
        formatter: (val: number) => formatCurrency(val)
      }
    },
    theme: {
      mode: isDark ? 'dark' : 'light'
    }
  }
})

// Functions
const loadAnalytics = async () => {
  isLoading.value = true
  try {
    // Fetch receipts and folders in parallel
    await Promise.all([
      receiptsStore.fetchReceipts(),
      inventoryStore.fetchFolders()
    ])
    receipts.value = receiptsStore.receipts

    const folders = inventoryStore.folders
    const allItems: any[] = []
    if (folders.length > 0) {
      const results = await Promise.allSettled(
        folders.map(async (folder) => {
          const list = await inventoryStore.fetchItemsAllChunked(folder.id, { force: true })
          allItems.push(...list)
        })
      )
      results.forEach((result, i) => {
        if (result.status === 'rejected' && folders[i]) {
          console.error(`Error loading items for folder ${folders[i]!.id}:`, result.reason)
        }
      })
    }
    inventoryItems.value = allItems
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
  topProducts.value.slice(0, 10).forEach(p => {
    csvContent += `"${p.name}",${p.quantity},${p.revenue}\n`
  })
  csvContent += '\n'
  
  // Top Customers
  csvContent += 'Top Customers\n'
  csvContent += 'Customer Name,Email,Orders,Total Spent\n'
  topCustomers.value.slice(0, 10).forEach(c => {
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
      ['Repeat Purchase Rate', `${repeatPurchaseRate.value.toFixed(1)}%`]
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
    navigateTo('/dashboard/settings?upgrade=1')
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
      navigateTo('/dashboard/settings?upgrade=1')
      return
    }
    await loadAnalytics()
  })()
})
</script>
