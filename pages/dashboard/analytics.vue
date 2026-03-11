<template>
  <div class="space-y-3 pb-6 sm:pb-8">
    <!-- Page Header -->
    <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100">Analytics & Reports</h1>
        <p class="mt-0.5 text-[10px] sm:text-xs text-gray-600 dark:text-gray-400">Track your sales, inventory, and customer insights</p>
      </div>
      <div class="flex items-center gap-2">
        <select
          v-model="selectedPeriod"
          @change="loadAnalytics"
          class="px-3 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
        >
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
        </select>
        <div class="flex items-center gap-2">
          <button
            @click="exportReport('pdf')"
            :disabled="isExporting"
            class="px-3 py-1.5 text-xs font-medium bg-primary-600 hover:bg-primary-700 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            <ArrowDownTrayIcon class="w-4 h-4" />
            <span>{{ isExporting ? 'Exporting...' : 'Export PDF' }}</span>
          </button>
          <button
            @click="exportReport('excel')"
            :disabled="isExporting"
            class="px-3 py-1.5 text-xs font-medium bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            <ArrowDownTrayIcon class="w-4 h-4" />
            <span>{{ isExporting ? 'Exporting...' : 'Export Excel' }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <template v-if="isLoading">
      <div class="grid grid-cols-1 lg:grid-cols-5 gap-2.5">
        <Card v-for="i in 5" :key="i" padding="sm" class="p-3">
          <div class="h-16 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse"></div>
        </Card>
      </div>
    </template>

    <!-- Analytics Content -->
    <template v-else>
      <!-- Key Metrics Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
        <Card padding="sm" class="p-3">
          <div class="flex items-center justify-between">
            <div class="flex-1">
              <p class="text-[10px] text-gray-500 dark:text-gray-400 mb-1">Total Revenue</p>
              <p class="text-base font-bold text-gray-900 dark:text-gray-100">{{ formatCurrency(totalRevenue) }}</p>
              <p class="text-[10px] mt-1" :class="revenueChange >= 0 ? 'text-green-600' : 'text-red-600'">
                {{ revenueChange >= 0 ? '↑' : '↓' }} {{ Math.abs(revenueChange) }}% vs previous period
              </p>
            </div>
            <div class="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <CurrencyDollarIcon class="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </Card>

        <Card padding="sm" class="p-3">
          <div class="flex items-center justify-between">
            <div class="flex-1">
              <p class="text-[10px] text-gray-500 dark:text-gray-400 mb-1">Total Sales</p>
              <p class="text-base font-bold text-gray-900 dark:text-gray-100">{{ totalSales }}</p>
              <p class="text-[10px] mt-1 text-gray-500 dark:text-gray-400">
                {{ totalOrders }} orders
              </p>
            </div>
            <div class="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <ShoppingBagIcon class="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </Card>

        <Card padding="sm" class="p-3">
          <div class="flex items-center justify-between">
            <div class="flex-1">
              <p class="text-[10px] text-gray-500 dark:text-gray-400 mb-1">Avg. Order Value</p>
              <p class="text-base font-bold text-gray-900 dark:text-gray-100">{{ formatCurrency(averageOrderValue) }}</p>
              <p class="text-[10px] mt-1 text-gray-500 dark:text-gray-400">
                Per transaction
              </p>
            </div>
            <div class="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <ChartBarIcon class="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </Card>

        <Card padding="sm" class="p-3">
          <div class="flex items-center justify-between">
            <div class="flex-1">
              <p class="text-[10px] text-gray-500 dark:text-gray-400 mb-1">Low Stock Items</p>
              <p class="text-base font-bold text-gray-900 dark:text-gray-100">{{ lowStockCount }}</p>
              <p class="text-[10px] mt-1 text-gray-500 dark:text-gray-400">
                Need restocking
              </p>
            </div>
            <div class="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
              <ExclamationTriangleIcon class="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </Card>

        <Card padding="sm" class="p-3">
          <div class="flex items-center justify-between">
            <div class="flex-1">
              <p class="text-[10px] text-gray-500 dark:text-gray-400 mb-1">Refunds</p>
              <p class="text-base font-bold text-gray-900 dark:text-gray-100">{{ refundedCount }}</p>
              <p class="text-[10px] mt-1 text-red-600 dark:text-red-400">
                {{ formatCurrency(refundAmount) }} · {{ refundRateText }}
              </p>
            </div>
            <div class="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <ArrowPathIcon class="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
          </div>
        </Card>
      </div>

      <!-- Charts Row -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <!-- Revenue Trend Chart -->
        <Card class="lg:col-span-2" padding="sm" extra-class="p-4">
          <div class="flex items-center justify-between mb-4">
            <div>
              <h2 class="text-sm font-semibold text-gray-900 dark:text-gray-100">Revenue Trends</h2>
              <p class="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">{{ periodLabel }}</p>
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
        <Card padding="sm" extra-class="p-4">
          <div class="mb-4">
            <h2 class="text-sm font-semibold text-gray-900 dark:text-gray-100">Top Products</h2>
            <p class="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">By sales volume</p>
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
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <!-- Inventory Turnover -->
        <Card padding="sm" extra-class="p-4">
          <div class="mb-4">
            <h2 class="text-sm font-semibold text-gray-900 dark:text-gray-100">Inventory Turnover</h2>
            <p class="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">Sales vs Stock levels</p>
          </div>
          <apexchart
            type="bar"
            height="250"
            :options="inventoryTurnoverChartOptions"
            :series="inventoryTurnoverChartSeries"
          />
        </Card>

        <!-- Customer Insights -->
        <Card padding="sm" extra-class="p-4">
          <div class="mb-4">
            <h2 class="text-sm font-semibold text-gray-900 dark:text-gray-100">Customer Insights</h2>
            <p class="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">Top customers & repeat rate</p>
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
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <!-- Busiest day & hour -->
        <Card padding="sm" extra-class="p-4 overflow-hidden">
          <div class="flex items-start justify-between gap-3">
            <div class="flex items-start gap-2.5 min-w-0">
              <div class="w-9 h-9 rounded-xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center flex-shrink-0 ring-1 ring-primary-100 dark:ring-primary-900/30">
                <ClockIcon class="w-4 h-4 text-primary-600 dark:text-primary-400" />
              </div>
              <div class="min-w-0">
                <h2 class="text-sm font-semibold text-gray-900 dark:text-gray-100 leading-tight">Busiest time</h2>
                <p class="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">Peak day & hour in period</p>
              </div>
            </div>
            <span class="px-2 py-0.5 text-[10px] font-medium rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 flex-shrink-0">
              {{ selectedPeriod === 'daily' ? 'Today' : selectedPeriod === 'weekly' ? 'This week' : 'This month' }}
            </span>
          </div>

          <div class="mt-3 p-3 rounded-xl bg-gradient-to-br from-gray-50 to-white dark:from-gray-900/30 dark:to-gray-800/20 ring-1 ring-gray-200/60 dark:ring-gray-700/60">
            <p class="text-[10px] text-gray-500 dark:text-gray-400">Highest revenue occurs at</p>
            <p class="mt-0.5 text-base font-semibold tracking-tight text-gray-900 dark:text-gray-100">
              {{ busiestTimeSummary }}
            </p>
          </div>
        </Card>

        <!-- Sales by hour (peak hours) -->
        <Card padding="sm" extra-class="p-4 lg:col-span-2">
          <div class="mb-4">
            <h2 class="text-sm font-semibold text-gray-900 dark:text-gray-100">Sales by hour</h2>
            <p class="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">Peak hours (revenue)</p>
          </div>
          <apexchart
            type="bar"
            height="250"
            :options="peakHoursChartOptions"
            :series="peakHoursChartSeries"
          />
        </Card>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <!-- Sales by day of week -->
        <Card padding="sm" extra-class="p-4">
          <div class="mb-4">
            <h2 class="text-sm font-semibold text-gray-900 dark:text-gray-100">Sales by day of week</h2>
            <p class="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">Best and worst days</p>
          </div>
          <apexchart
            type="bar"
            height="250"
            :options="salesByDayChartOptions"
            :series="salesByDayChartSeries"
          />
        </Card>

        <!-- Traffic heatmap: day × hour -->
        <Card padding="sm" extra-class="p-4">
          <div class="mb-4">
            <h2 class="text-sm font-semibold text-gray-900 dark:text-gray-100">Traffic heatmap</h2>
            <p class="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">Revenue by day × hour</p>
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
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <!-- Top Products Table -->
        <Card padding="sm" extra-class="p-4">
          <h2 class="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">Top Selling Products</h2>
          <div class="overflow-x-auto">
            <table class="w-full text-xs">
              <thead>
                <tr class="border-b border-gray-200 dark:border-gray-700">
                  <th class="text-left py-2 px-2 font-semibold text-gray-700 dark:text-gray-300">Product</th>
                  <th class="text-right py-2 px-2 font-semibold text-gray-700 dark:text-gray-300">Quantity</th>
                  <th class="text-right py-2 px-2 font-semibold text-gray-700 dark:text-gray-300">Revenue</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(product, index) in topProducts"
                  :key="product.id"
                  class="border-b border-gray-100 dark:border-gray-800"
                >
                  <td class="py-2 px-2">
                    <div class="flex items-center gap-2">
                      <span class="w-5 h-5 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-[10px] font-bold text-primary-600 dark:text-primary-400">
                        {{ index + 1 }}
                      </span>
                      <span class="text-gray-900 dark:text-gray-100">{{ product.name }}</span>
                    </div>
                  </td>
                  <td class="py-2 px-2 text-right text-gray-700 dark:text-gray-300">{{ product.quantity }}</td>
                  <td class="py-2 px-2 text-right font-semibold text-gray-900 dark:text-gray-100">{{ formatCurrency(product.revenue) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>

        <!-- Top Customers Table -->
        <Card padding="sm" extra-class="p-4">
          <h2 class="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">Top Customers</h2>
          <div class="overflow-x-auto">
            <table class="w-full text-xs">
              <thead>
                <tr class="border-b border-gray-200 dark:border-gray-700">
                  <th class="text-left py-2 px-2 font-semibold text-gray-700 dark:text-gray-300">Customer</th>
                  <th class="text-right py-2 px-2 font-semibold text-gray-700 dark:text-gray-300">Orders</th>
                  <th class="text-right py-2 px-2 font-semibold text-gray-700 dark:text-gray-300">Total Spent</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(customer, index) in topCustomers"
                  :key="customer.email"
                  class="border-b border-gray-100 dark:border-gray-800"
                >
                  <td class="py-2 px-2">
                    <div class="flex items-center gap-2">
                      <span class="w-5 h-5 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-[10px] font-bold text-primary-600 dark:text-primary-400">
                        {{ index + 1 }}
                      </span>
                      <div>
                        <div class="text-gray-900 dark:text-gray-100 font-medium">{{ customer.name }}</div>
                        <div class="text-[10px] text-gray-500 dark:text-gray-400">{{ customer.email }}</div>
                      </div>
                    </div>
                  </td>
                  <td class="py-2 px-2 text-right text-gray-700 dark:text-gray-300">{{ customer.orders }}</td>
                  <td class="py-2 px-2 text-right font-semibold text-gray-900 dark:text-gray-100">{{ formatCurrency(customer.totalSpent) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>

        <!-- Recent Returns Table -->
        <Card padding="sm" extra-class="p-4">
          <h2 class="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">Recent Returns</h2>
          <div class="overflow-x-auto">
            <table class="w-full text-xs">
              <thead>
                <tr class="border-b border-gray-200 dark:border-gray-700">
                  <th class="text-left py-2 px-2 font-semibold text-gray-700 dark:text-gray-300">Receipt #</th>
                  <th class="text-left py-2 px-2 font-semibold text-gray-700 dark:text-gray-300">Date</th>
                  <th class="text-right py-2 px-2 font-semibold text-gray-700 dark:text-gray-300">Amount</th>
                  <th class="text-left py-2 px-2 font-semibold text-gray-700 dark:text-gray-300">Reason</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="ret in recentReturns"
                  :key="ret.id"
                  class="border-b border-gray-100 dark:border-gray-800"
                >
                  <td class="py-2 px-2 font-medium text-gray-900 dark:text-gray-100">{{ ret.receiptNumber }}</td>
                  <td class="py-2 px-2 text-gray-700 dark:text-gray-300">{{ formatReturnDate(ret.date) }}</td>
                  <td class="py-2 px-2 text-right font-semibold text-red-600 dark:text-red-400">-{{ formatCurrency(ret.amount) }}</td>
                  <td class="py-2 px-2 text-gray-600 dark:text-gray-400 max-w-[120px] truncate" :title="ret.reason">{{ ret.reason }}</td>
                </tr>
                <tr v-if="recentReturns.length === 0" class="border-b border-gray-100 dark:border-gray-800">
                  <td colspan="4" class="py-4 px-2 text-center text-gray-500 dark:text-gray-400">No returns in this period</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <!-- Low Stock Alerts -->
      <Card padding="none" extra-class="rounded-xl ring-1 ring-gray-200/60 dark:ring-gray-700/60 overflow-hidden">
        <div class="px-4 sm:px-5 py-4 border-b border-gray-200/80 dark:border-gray-700/80">
          <div class="flex items-center justify-between gap-3">
            <div class="flex items-center gap-3">
              <div class="flex items-center justify-center w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30">
                <ExclamationTriangleIcon class="w-5 h-5 text-amber-600 dark:text-amber-400" stroke-width="1.75" />
              </div>
              <div>
                <h2 class="text-sm font-semibold text-gray-900 dark:text-gray-100">Low stock alerts</h2>
                <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Items at or below restock threshold</p>
              </div>
            </div>
            <NuxtLink
              v-if="lowStockItems.length > 0"
              to="/dashboard/inventory"
              class="text-xs font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 whitespace-nowrap"
            >
              View inventory →
            </NuxtLink>
          </div>
        </div>
        <div class="divide-y divide-gray-200/80 dark:divide-gray-700/80">
          <template v-if="lowStockItems.length > 0">
            <NuxtLink
              v-for="item in lowStockItems"
              :key="item.id"
              :to="item.folderId ? `/dashboard/inventory/${item.folderId}` : '/dashboard/inventory'"
              class="flex items-center gap-4 px-4 sm:px-5 py-3.5 hover:bg-gray-50/80 dark:hover:bg-gray-800/50 transition-colors group"
            >
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-gray-900 dark:text-gray-100 truncate group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                  {{ item.name }}
                </p>
                <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {{ item.folderName }}
                  <span v-if="item.itemCount > 1" class="text-amber-600 dark:text-amber-400"> · {{ item.itemCount }} items</span>
                </p>
              </div>
              <div class="flex items-center gap-3 shrink-0">
                <span class="text-sm font-semibold text-amber-600 dark:text-amber-400">{{ item.quantity }} left</span>
                <span class="text-xs text-gray-400 dark:text-gray-500">/ {{ item.threshold }}</span>
              </div>
            </NuxtLink>
          </template>
          <div v-else class="px-4 sm:px-5 py-8 text-center">
            <div class="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-700/50 mb-3">
              <ExclamationTriangleIcon class="w-6 h-6 text-gray-400 dark:text-gray-500" stroke-width="1.5" />
            </div>
            <p class="text-sm font-medium text-gray-900 dark:text-gray-100">No low stock items</p>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">All items are above the restock threshold</p>
            <NuxtLink
              to="/dashboard/inventory"
              class="inline-block mt-3 text-xs font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
            >
              View inventory →
            </NuxtLink>
          </div>
        </div>
      </Card>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  ArrowDownTrayIcon,
  ArrowPathIcon,
  CurrencyDollarIcon,
  ShoppingBagIcon,
  ChartBarIcon,
  ClockIcon,
  ExclamationTriangleIcon,
} from '@heroicons/vue/24/outline'
import { useReceiptsStore } from '~/stores/receipts'
import { useInventoryStore } from '~/stores/inventory'
import { useCustomersStore } from '~/stores/customers'
import { useUserStore } from '~/stores/user'
import { usePreferences } from '~/composables/usePreferences'
import { useToast } from '~/composables/useToast'
import Card from '~/components/ui/Card.vue'
import jsPDF from 'jspdf'

definePageMeta({
  layout: 'dashboard'
})

useHead({
  title: 'Analytics & Reports - Storvv',
})

const { formatCurrency } = usePreferences()
const toast = useToast()

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

// State
const isLoading = ref(true)
const isExporting = ref(false)
const selectedPeriod = ref<'daily' | 'weekly' | 'monthly'>('monthly')

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
  if (!notes || !notes.trim()) return '—'
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

// Sales by hour (0–23): revenue and order count per hour
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

// Heatmap: day × hour, value = revenue. Rows = days (Sun–Sat), cols = hours.
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
  const isDark = import.meta.client ? document.documentElement.classList.contains('dark') : false
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
  const isDark = import.meta.client ? document.documentElement.classList.contains('dark') : false
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
  const isDark = import.meta.client ? document.documentElement.classList.contains('dark') : false
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
  const isDark = import.meta.client 
    ? document.documentElement.classList.contains('dark')
    : false
  
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
  const isDark = import.meta.client 
    ? document.documentElement.classList.contains('dark')
    : false
  
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
  const isDark = import.meta.client 
    ? document.documentElement.classList.contains('dark')
    : false
  
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
  const isDark = import.meta.client 
    ? document.documentElement.classList.contains('dark')
    : false
  
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
    await Promise.all([
      receiptsStore.fetchReceipts(),
      inventoryStore.fetchFolders()
    ])
    
    receipts.value = receiptsStore.receipts
    
    // Load all items from all folders
    const allItems: any[] = []
    for (const folder of inventoryStore.folders) {
      try {
        await inventoryStore.fetchItems(folder.id)
        const folderItems = inventoryStore.items[folder.id] || []
        allItems.push(...folderItems)
      } catch (error) {
        console.error(`Error loading items for folder ${folder.id}:`, error)
      }
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
        doc.text((ret.reason || '—').substring(0, 25), 150, yPos)
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
  loadAnalytics()
})
</script>
