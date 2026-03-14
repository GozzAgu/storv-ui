<template>
  <div class="space-y-3 pb-6 sm:pb-8">
    <!-- Tutorial Component -->
    <Tutorial :tutorial-steps="tutorialSteps" @complete="onTutorialComplete" />
    <!-- Welcome Header - Compact -->
    <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div class="flex-1">
        <h1 class="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100 leading-tight" data-tutorial="dashboard">Welcome back, {{ userName }}! 👋</h1>
        <p class="mt-0.5 text-[10px] sm:text-xs text-gray-600 dark:text-gray-400">Here's what's happening with your inventory today.</p>
      </div>
    </div>

    <!-- Loading State -->
    <template v-if="isLoading">
      <!-- Stats Cards Skeleton -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div v-for="i in 4" :key="i" class="rounded-2xl bg-white dark:bg-gray-800/90 ring-1 ring-gray-200/80 dark:ring-gray-700/60 p-4 sm:p-5">
          <div class="flex items-start justify-between gap-4">
            <div class="flex-1 min-w-0">
              <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-2 animate-pulse"></div>
              <div class="h-7 sm:h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-1.5 animate-pulse"></div>
              <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2 animate-pulse"></div>
            </div>
            <div class="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-gray-200 dark:bg-gray-700 animate-pulse shrink-0"></div>
          </div>
        </div>
      </div>

      <!-- Charts Row Skeleton -->
      <div class="grid grid-cols-1 gap-3 sm:gap-4">
        <!-- Revenue Chart Skeleton -->
        <Card>
          <div class="flex items-center justify-between mb-3 sm:mb-4">
            <div>
              <div class="h-4 sm:h-5 bg-gray-200 dark:bg-gray-700 rounded-md w-32 mb-2 animate-pulse"></div>
              <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded-md w-24 animate-pulse"></div>
            </div>
            <div class="flex gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              <div class="h-7 w-16 bg-gray-200 dark:bg-gray-600 rounded-md animate-pulse"></div>
              <div class="h-7 w-16 bg-gray-200 dark:bg-gray-600 rounded-md animate-pulse"></div>
              <div class="h-7 w-16 bg-gray-200 dark:bg-gray-600 rounded-md animate-pulse"></div>
            </div>
          </div>
          <div class="h-48 sm:h-64 lg:h-72 bg-gray-100 dark:bg-gray-800 rounded-md animate-pulse"></div>
        </Card>
      </div>

      <!-- Bottom Row Skeleton -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
        <!-- Recent Transactions Skeleton -->
        <Card>
          <div class="flex items-center justify-between mb-4">
            <div class="h-4 sm:h-5 bg-gray-200 dark:bg-gray-700 rounded-md w-32 animate-pulse"></div>
            <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded-md w-16 animate-pulse"></div>
          </div>
          <div class="space-y-3">
            <div v-for="i in 3" :key="i" class="flex items-center justify-between py-2">
              <div class="flex items-center gap-3 flex-1">
                <div class="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
                <div class="flex-1">
                  <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded-md w-32 mb-2 animate-pulse"></div>
                  <div class="h-2.5 bg-gray-200 dark:bg-gray-700 rounded-md w-20 animate-pulse"></div>
                </div>
              </div>
              <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded-md w-16 animate-pulse"></div>
            </div>
          </div>
        </Card>

        <!-- Top Selling Products Skeleton -->
        <Card>
          <div class="flex items-center justify-between mb-4">
            <div class="h-4 sm:h-5 bg-gray-200 dark:bg-gray-700 rounded-md w-36 animate-pulse"></div>
            <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded-md w-16 animate-pulse"></div>
          </div>
          <div class="space-y-3">
            <div v-for="i in 3" :key="i" class="flex items-center justify-between">
              <div class="flex items-center gap-3 flex-1">
                <div class="w-10 h-10 rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
                <div class="flex-1">
                  <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded-md w-24 mb-1 animate-pulse"></div>
                  <div class="h-2.5 bg-gray-200 dark:bg-gray-700 rounded-md w-16 animate-pulse"></div>
                </div>
              </div>
              <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded-md w-20 animate-pulse"></div>
            </div>
          </div>
        </Card>

        <!-- Inventory Status Skeleton -->
        <Card>
          <div class="h-4 sm:h-5 bg-gray-200 dark:bg-gray-700 rounded-md w-28 mb-4 animate-pulse"></div>
          <div class="space-y-3">
            <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded-md w-20 animate-pulse"></div>
            <div class="h-2 bg-gray-200 dark:bg-gray-700 rounded-full w-full animate-pulse"></div>
            <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded-md w-16 animate-pulse"></div>
          </div>
        </Card>
      </div>
    </template>

    <!-- Actual Content (shown when not loading) -->
    <template v-else>
    <!-- Key Metrics Cards - Shopify style -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      <StatCard
        label="Total revenue"
        :value="formatCurrency(totalRevenue)"
        :subtext="revenueChangeText"
        :subtext-class="revenueChangeClass"
        :change="revenueChangePercent"
        :change-positive="revenueChangePositive"
        :sparkline-data="statCardRevenueSparkline"
      />
      <StatCard
        label="Active customers"
        :value="totalCustomers.toString()"
        :subtext="`${newCustomersToday} new today`"
        :subtext-class="newCustomersToday > 0 ? 'text-green-600 dark:text-green-400 text-xs font-medium' : 'text-gray-500 dark:text-gray-400 text-xs'"
      />
      <StatCard
        label="Total items"
        :value="totalInventoryItems.toString()"
        :subtext="lowStockCount > 0 ? `${lowStockCount} low stock` : 'All items in stock'"
        :subtext-class="lowStockCount > 0 ? 'text-amber-600 dark:text-amber-400 text-xs font-medium' : 'text-gray-500 dark:text-gray-400 text-xs'"
      />
      <StatCard
        label="Orders today"
        :value="todayReceiptsCount.toString()"
        :subtext="`${formatCurrency(todaySales)} in sales`"
        :subtext-class="'text-gray-500 dark:text-gray-400 text-xs'"
      />
    </div>

    <!-- Charts Row -->
    <div class="grid grid-cols-1 gap-3">
      <!-- Revenue Chart -->
      <Card padding="sm" extra-class="p-4">
        <div class="flex items-center justify-between mb-3 sm:mb-4">
          <div>
            <h2 class="text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-100">Revenue Overview</h2>
            <p class="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mt-0.5">{{ chartSubtitle }}</p>
          </div>
          <!-- View Selector -->
          <div class="flex items-center gap-0.5 sm:gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-0.5 sm:p-1">
            <button
              @click="chartView = 'daily'"
              :class="[
                'px-2 py-1 sm:px-3 sm:py-1.5 text-xs font-medium rounded-md transition-all',
                chartView === 'daily'
                  ? 'bg-white dark:bg-gray-800 text-primary-500 dark:text-primary-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              ]"
            >
              Daily
            </button>
            <button
              @click="chartView = 'weekly'"
              :class="[
                'px-2 py-1 sm:px-3 sm:py-1.5 text-xs font-medium rounded-md transition-all',
                chartView === 'weekly'
                  ? 'bg-white dark:bg-gray-800 text-primary-500 dark:text-primary-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              ]"
            >
              Weekly
            </button>
            <button
              @click="chartView = 'monthly'"
              :class="[
                'px-2 py-1 sm:px-3 sm:py-1.5 text-xs font-medium rounded-md transition-all',
                chartView === 'monthly'
                  ? 'bg-white dark:bg-gray-800 text-primary-500 dark:text-primary-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              ]"
            >
              Monthly
            </button>
          </div>
        </div>
        <div class="h-48 sm:h-64 lg:h-72 relative pb-8">
          <div v-if="chartData.length === 0" class="flex flex-col items-center justify-center py-12 text-center">
            <div class="w-14 h-14 mb-3 rounded-xl bg-green-500/10 dark:bg-green-500/15 ring-1 ring-green-500/20 flex items-center justify-center">
              <ChartBarIcon class="w-7 h-7 text-green-600 dark:text-green-400" stroke-width="1.5" />
            </div>
            <p class="text-sm font-medium text-gray-700 dark:text-gray-300">No revenue data yet</p>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Start making sales to see your revenue chart</p>
          </div>
          <ClientOnly>
            <apexchart
              v-if="chartData.length > 0"
              type="area"
              :height="chartHeight"
              :options="chartOptions"
              :series="chartSeries"
            />
            <template #fallback>
              <div class="flex items-center justify-center h-full">
                <div class="animate-pulse text-gray-400">Loading chart...</div>
              </div>
            </template>
          </ClientOnly>
      </div>
      </Card>
    </div>

    <!-- Bottom Row - clean compact cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
      <!-- Orders & departments -->
      <Card padding="sm" extra-class="p-3.5">
        <p class="text-[11px] text-gray-500 dark:text-gray-400 mb-3">Orders & departments</p>
        <div class="space-y-2.5">
          <div class="flex justify-between items-baseline">
            <span class="text-[11px] text-gray-500 dark:text-gray-400">Completed</span>
            <span class="text-sm font-semibold text-gray-900 dark:text-gray-100">{{ completedReceiptsCount }}</span>
          </div>
          <div class="flex justify-between items-baseline">
            <span class="text-[11px] text-gray-500 dark:text-gray-400">Pending</span>
            <span class="text-sm font-semibold text-gray-900 dark:text-gray-100">{{ pendingReceiptsCount }}</span>
          </div>
          <div class="flex justify-between items-baseline">
            <span class="text-[11px] text-gray-500 dark:text-gray-400">Refunded</span>
            <span class="text-sm font-semibold text-gray-900 dark:text-gray-100">{{ refundedReceiptsCount }}</span>
          </div>
          <div class="flex justify-between items-baseline pt-1 border-t border-gray-200/80 dark:border-gray-700/80">
            <span class="text-[11px] text-gray-500 dark:text-gray-400">Departments</span>
            <span class="text-sm font-semibold text-gray-900 dark:text-gray-100">{{ totalDepartments }}</span>
          </div>
        </div>
      </Card>

      <!-- Recent transactions -->
      <Card padding="sm" extra-class="p-3.5 flex flex-col min-h-[180px]">
        <div class="flex items-center justify-between mb-2">
          <p class="text-[11px] text-gray-500 dark:text-gray-400">Recent</p>
          <NuxtLink to="/dashboard/receipts" class="text-[10px] text-primary-500 dark:text-primary-400 hover:underline font-medium">View all</NuxtLink>
        </div>
        <div class="flex-1 min-h-0 overflow-y-auto space-y-2">
          <template v-if="recentTransactions.length === 0">
            <p class="text-xs text-gray-500 dark:text-gray-400 py-2">No transactions</p>
          </template>
          <template v-else>
            <div v-for="tx in recentTransactions" :key="tx.id" class="flex justify-between items-start gap-2 py-0.5">
              <div class="min-w-0 flex-1">
                <p class="text-xs font-medium text-gray-900 dark:text-gray-100 truncate">{{ tx.description }}</p>
                <p class="text-[10px] text-gray-500 dark:text-gray-400">{{ tx.time }}</p>
              </div>
              <p :class="['text-xs font-semibold flex-shrink-0', tx.amountClass]">{{ tx.amount }}</p>
            </div>
          </template>
        </div>
      </Card>

      <!-- Top products -->
      <Card padding="sm" extra-class="p-3.5 flex flex-col min-h-[180px]">
        <div class="flex items-center justify-between mb-2">
          <p class="text-[11px] text-gray-500 dark:text-gray-400">Top products</p>
          <NuxtLink to="/dashboard/inventory" class="text-[10px] text-primary-500 dark:text-primary-400 hover:underline font-medium">View all</NuxtLink>
        </div>
        <div class="flex-1 min-h-0 overflow-y-auto space-y-2">
          <template v-if="topSellingItems.length === 0">
            <p class="text-xs text-gray-500 dark:text-gray-400 py-2">No sales yet</p>
          </template>
          <template v-else>
            <div v-for="(item, i) in topSellingItems.slice(0, 5)" :key="item.id" class="flex justify-between items-baseline gap-2 py-0.5">
              <div class="min-w-0 flex-1 flex items-center gap-1.5">
                <span class="text-[10px] font-medium text-gray-400 dark:text-gray-500 w-4 flex-shrink-0">{{ i + 1 }}</span>
                <p class="text-xs font-medium text-gray-900 dark:text-gray-100 truncate">{{ item.name }}</p>
              </div>
              <div class="flex-shrink-0 text-right">
                <p class="text-xs font-semibold text-gray-900 dark:text-gray-100">{{ formatCurrency(item.revenue) }}</p>
                <p class="text-[10px] text-gray-500 dark:text-gray-400">{{ item.sales }} sold</p>
              </div>
            </div>
          </template>
        </div>
      </Card>

      <!-- Low stock -->
      <Card padding="sm" extra-class="p-3.5 flex flex-col min-h-[180px]">
        <div class="flex items-center justify-between mb-2">
          <p class="text-[11px] text-gray-500 dark:text-gray-400">Low stock</p>
          <NuxtLink to="/dashboard/inventory" class="text-[10px] text-primary-500 dark:text-primary-400 hover:underline font-medium">View all</NuxtLink>
        </div>
        <div class="flex-1 min-h-0 overflow-y-auto space-y-2">
          <template v-if="lowStockItems.length === 0">
            <p class="text-xs text-gray-500 dark:text-gray-400 py-2">All stocked</p>
          </template>
          <template v-else>
            <div v-for="item in lowStockItems.slice(0, 5)" :key="item.id" class="flex justify-between items-baseline gap-2 py-0.5">
              <p class="text-xs font-medium text-gray-900 dark:text-gray-100 truncate min-w-0">{{ item.name }}</p>
              <span class="text-xs font-semibold text-amber-600 dark:text-amber-400 flex-shrink-0">
                {{ item.quantity }}<span v-if="!item.isSerialNumber">/{{ item.threshold }}</span>
              </span>
            </div>
          </template>
        </div>
      </Card>

      <!-- Inventory status -->
      <Card padding="sm" extra-class="p-3.5">
        <p class="text-[11px] text-gray-500 dark:text-gray-400 mb-3">Inventory</p>
        <div class="flex gap-0.5 h-2 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
          <div class="bg-green-500 transition-all" :style="`width: ${inStockPercentage}%`" title="In stock" />
          <div class="bg-amber-500 transition-all" :style="`width: ${lowStockPercentage}%`" title="Low stock" />
          <div class="bg-red-500 transition-all" :style="`width: ${outOfStockPercentage}%`" title="Out of stock" />
        </div>
        <div class="flex justify-between mt-2 text-[10px] text-gray-500 dark:text-gray-400">
          <span>{{ inStockCount }} in stock</span>
          <span>{{ lowStockCount }} low</span>
          <span>{{ outOfStockCount }} out</span>
        </div>
        <div class="flex justify-between items-baseline mt-2 pt-2 border-t border-gray-200/80 dark:border-gray-700/80">
          <span class="text-[11px] text-gray-500 dark:text-gray-400">Total</span>
          <span class="text-sm font-semibold text-gray-900 dark:text-gray-100">{{ totalInventoryItems }}</span>
        </div>
      </Card>
    </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import {
  CubeIcon,
  CurrencyDollarIcon,
  UsersIcon,
  ShoppingCartIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  ReceiptPercentIcon,
  HomeIcon,
  BuildingOfficeIcon,
  Cog6ToothIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
} from '@heroicons/vue/24/outline'
import Card from '~/components/ui/Card.vue'
import StatCard from '~/components/ui/StatCard.vue'
import Tutorial from '~/components/Tutorial.vue'
import { useReceiptsStore } from '~/stores/receipts'
import { useInventoryStore } from '~/stores/inventory'
import { useDepartmentsStore } from '~/stores/departments'
import { useAuthStore } from '~/stores/auth'
import { useUserStore } from '~/stores/user'
import { useThemeStore } from '~/stores/theme'
import { usePreferences } from '~/composables/usePreferences'
import type { Receipt } from '~/stores/receipts'
import type { InventoryItem } from '~/stores/inventory'

definePageMeta({
  layout: 'dashboard',
  middleware: 'auth'
})

const tutorialSteps = [
  {
    title: 'Welcome to Your Dashboard! 👋',
    description: 'This is your command center. Here you can see your total revenue, active customers, inventory status, and recent transactions all in one place. The charts show your sales trends over time, helping you understand your business performance at a glance.',
    icon: HomeIcon,
    targetSelector: '[data-tutorial="dashboard"]'
  },
  {
    title: 'Manage Your Inventory',
    description: 'Click "Inventory" in the sidebar to organize your products. Create folders (like "Electronics" or "Clothing") to categorize items. Add products to each folder with details like name, price, and quantity. You can track which items are in stock, low stock, or sold out.',
    icon: CubeIcon,
    targetSelector: '[data-tutorial="inventory"]'
  },
  {
    title: 'Create and Track Receipts',
    description: 'Click "Receipts" to record sales. When a customer makes a purchase, create a new receipt, add the items sold, and the system automatically tracks revenue and updates inventory. You can also view all past receipts, handle returns, and send receipts via email.',
    icon: ReceiptPercentIcon,
    targetSelector: '[data-tutorial="receipts"]'
  },
  {
    title: 'View Analytics & Reports',
    description: 'Click "Analytics" to see detailed insights about your business. View sales trends, top-selling products, customer behavior, and inventory turnover. Export reports to PDF or Excel for your records or accounting needs.',
    icon: ChartBarIcon,
    targetSelector: '[data-tutorial="analytics"]'
  },
  {
    title: 'Configure Your Settings',
    description: 'Click "Settings" to customize your store preferences, manage departments, add staff members, and configure how your store operates. You can also update your profile and account information here.',
    icon: Cog6ToothIcon,
    targetSelector: '[data-tutorial="settings"]'
  }
]

const receiptsStore = useReceiptsStore()
const inventoryStore = useInventoryStore()
const departmentsStore = useDepartmentsStore()
const authStore = useAuthStore()
const userStore = useUserStore()

const isLoading = ref(true)
const chartView = ref<'daily' | 'weekly' | 'monthly'>('monthly')

// User name for welcome message
const userName = computed(() => {
  // During SSR, return a safe default to prevent hydration mismatch
  if (import.meta.server) {
    return 'User'
  }
  
  if (userStore.userData?.name) {
    return userStore.userData.name.split(' ')[0] || 'User'
  }
  if (authStore.currentUser?.displayName) {
    return authStore.currentUser.displayName.split(' ')[0] || 'User'
  }
  if (authStore.currentUser?.email) {
    return authStore.currentUser.email.split('@')[0]
  }
  return 'User'
})

// Revenue metrics
const totalRevenue = computed(() => receiptsStore.totalSales)
const todaySales = computed(() => receiptsStore.todaySales)
const monthSales = computed(() => receiptsStore.monthSales)
const revenueChangeText = computed(() => {
  if (totalRevenue.value === 0) return 'No sales yet'
  return `${formatCurrency(monthSales.value)} this month`
})
const revenueChangeClass = computed(() => {
  return totalRevenue.value > 0 ? 'text-green-600 dark:text-green-400 text-xs font-medium' : 'text-gray-500 dark:text-gray-400 text-xs'
})
// Percentage change: last 15 days vs previous 15 days (for Shopify-style trend)
const revenueChangePercent = computed(() => {
  const daily = dailyRevenueData.value
  if (!daily || daily.length < 30) return null
  const recent = daily.slice(-15).reduce((s, d) => s + d.revenue, 0)
  const previous = daily.slice(-30, -15).reduce((s, d) => s + d.revenue, 0)
  if (previous === 0) return recent > 0 ? '+100%' : null
  const pct = Math.round(((recent - previous) / previous) * 100)
  if (pct === 0) return null
  return pct > 0 ? `+${pct}%` : `${pct}%`
})
const revenueChangePositive = computed(() => {
  const p = revenueChangePercent.value
  if (!p || p === null) return null
  return p.startsWith('+')
})
// Sparkline data for revenue card (last 14 days)
const statCardRevenueSparkline = computed(() => {
  const daily = dailyRevenueData.value
  if (!daily || daily.length < 2) return []
  return daily.slice(-14).map(d => d.revenue)
})

// Customer metrics
const uniqueCustomers = computed(() => {
  const customersMap = new Map<string, { name: string; email: string; lastOrder: Date }>()
  receiptsStore.receipts.forEach(receipt => {
    if (receipt.customerEmail) {
      const existing = customersMap.get(receipt.customerEmail)
      const receiptDate = receipt.date?.toDate ? receipt.date.toDate() : new Date(receipt.date)
      if (!existing || receiptDate > existing.lastOrder) {
        customersMap.set(receipt.customerEmail, {
          name: receipt.customerName,
          email: receipt.customerEmail,
          lastOrder: receiptDate
        })
      }
    }
  })
  return Array.from(customersMap.values())
})
const totalCustomers = computed(() => uniqueCustomers.value.length)
const newCustomersToday = computed(() => {
  const today = new Date().toDateString()
  return uniqueCustomers.value.filter(c => c.lastOrder.toDateString() === today).length
})

// Inventory metrics
const totalInventoryItems = computed(() => inventoryStore.totalItems)
const lowStockCount = computed(() => inventoryStore.lowStockFolders.reduce((sum, folder) => sum + folder.lowStockCount, 0))

// Inventory status breakdown
// In stock = items without dateOut (available)
const inStockCount = computed(() => {
  let count = 0
  inventoryStore.folders.forEach(folder => {
    const items = inventoryStore.items[folder.id] || []
    items.forEach(item => {
      // Item is in stock if it doesn't have dateOut set (not sold)
      // Check for null, undefined, and empty string to be safe
      const dateOutValue = item.dateOut
      const hasDateOut = dateOutValue !== null && dateOutValue !== undefined && dateOutValue !== ''
      if (!hasDateOut) {
        count++
      }
    })
  })
  return count
})

// Low stock doesn't apply anymore since we track individual items, not quantities
// Set to 0 or keep for backward compatibility with UI
const lowStockItemsCount = computed(() => {
  return 0 // No low stock concept with individual item tracking
})

// Out of stock = items with dateOut set (sold)
const outOfStockCount = computed(() => {
  let count = 0
  inventoryStore.folders.forEach(folder => {
    const items = inventoryStore.items[folder.id] || []
    items.forEach(item => {
      // Item is out of stock if it has dateOut set (sold)
      // Check for null, undefined, and empty string to be safe
      const dateOutValue = item.dateOut
      const hasDateOut = dateOutValue !== null && dateOutValue !== undefined && dateOutValue !== ''
      if (hasDateOut) {
        count++
      }
    })
  })
  return count
})

const inStockPercentage = computed(() => {
  if (totalInventoryItems.value === 0) return 0
  return Math.round((inStockCount.value / totalInventoryItems.value) * 100)
})
const lowStockPercentage = computed(() => {
  if (totalInventoryItems.value === 0) return 0
  return Math.round((lowStockItemsCount.value / totalInventoryItems.value) * 100)
})
const outOfStockPercentage = computed(() => {
  if (totalInventoryItems.value === 0) return 0
  return Math.round((outOfStockCount.value / totalInventoryItems.value) * 100)
})

// Receipt metrics
const todayReceiptsCount = computed(() => {
  const today = new Date().toDateString()
  return receiptsStore.receipts.filter(r => {
    const receiptDate = r.date?.toDate ? r.date.toDate() : new Date(r.date)
    return receiptDate.toDateString() === today
  }).length
})

const completedReceiptsCount = computed(() => {
  return receiptsStore.receipts.filter(r => r.status === 'completed').length
})
const pendingReceiptsCount = computed(() => {
  return receiptsStore.receipts.filter(r => r.status === 'pending').length
})
const refundedReceiptsCount = computed(() => {
  return receiptsStore.receipts.filter(r => r.status === 'refunded').length
})

const totalDepartments = computed(() => departmentsStore.totalDepartments)

// Recent transactions
const recentTransactions = computed(() => {
  return receiptsStore.receipts
    .slice()
    .sort((a, b) => {
      const dateA = a.date?.toDate ? a.date.toDate() : new Date(a.date)
      const dateB = b.date?.toDate ? b.date.toDate() : new Date(b.date)
      return dateB.getTime() - dateA.getTime()
    })
    .slice(0, 5)
    .map(receipt => {
      const receiptDate = receipt.date?.toDate ? receipt.date.toDate() : new Date(receipt.date)
      const timeAgo = getTimeAgo(receiptDate)
      
      return {
        id: receipt.id,
        description: `Payment from ${receipt.customerName}`,
        time: timeAgo,
        amount: receipt.status === 'refunded' ? `-${formatCurrency(receipt.total)}` : `+${formatCurrency(receipt.total)}`,
        amountClass: receipt.status === 'refunded' ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400',
        icon: receipt.status === 'refunded' ? ArrowPathIcon : ReceiptPercentIcon,
        iconBg: receipt.status === 'refunded' ? 'bg-red-100 dark:bg-red-900/30' : 'bg-green-100 dark:bg-green-900/30',
        iconColor: receipt.status === 'refunded' ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400',
      }
    })
})

// Top selling products
const topSellingItems = computed(() => {
  const itemSales = new Map<string, { name: string; sales: number; revenue: number }>()
  
  receiptsStore.receipts.forEach(receipt => {
    if (receipt.status === 'completed' && receipt.items) {
      receipt.items.forEach(item => {
        const existing = itemSales.get(item.itemName) || { name: item.itemName, sales: 0, revenue: 0 }
        existing.sales += item.quantity
        existing.revenue += item.price * item.quantity
        itemSales.set(item.itemName, existing)
      })
    }
  })
  
  return Array.from(itemSales.values())
    .sort((a, b) => b.sales - a.sales)
    .map((item, index) => ({
      id: `item-${index}`,
      ...item
    }))
})

// Low stock items - get actual items that are low on stock
const lowStockItems = computed(() => {
  const lowStockItemsList: Array<{
    id: string
    name: string
    quantity: number
    folderName: string
    folderId: string
    threshold: number
    isSerialNumber: boolean
  }> = []

  // Get low stock threshold from user settings
  const userStore = useUserStore()
  const lowStockThreshold = userStore.userData?.storeDetails?.settings?.inventory?.lowStockThreshold || 10

  inventoryStore.folders.forEach(folder => {
    const items = inventoryStore.items[folder.id] || []
    
    // For serial number folders: check total available items
    if (folder.hasSerialNumbers) {
      // Count available (not sold) items
      let availableCount = 0
      items.forEach(item => {
        const dateOutValue = item.dateOut
        const hasDateOut = dateOutValue !== null && dateOutValue !== undefined && dateOutValue !== ''
        if (!hasDateOut) {
          availableCount++
        }
      })
      
      // Folder is low stock if available count is below threshold
      if (availableCount > 0 && availableCount <= lowStockThreshold) {
        lowStockItemsList.push({
          id: folder.id,
          name: folder.name,
          quantity: availableCount,
          folderName: folder.name,
          folderId: folder.id,
          threshold: lowStockThreshold,
          isSerialNumber: true
        })
      }
    } else {
      // For bulk items: check individual item quantities
      // Find quantity field name from template
      const quantityField = folder.template?.fields?.find(f => 
        f.name.toLowerCase() === 'quantity' ||
        f.name.toLowerCase() === 'qty'
      )?.name

      if (!quantityField) return // No quantity field, skip

      items.forEach(item => {
        // Skip sold items
        const dateOutValue = item.dateOut
        const hasDateOut = dateOutValue !== null && dateOutValue !== undefined && dateOutValue !== ''
        if (hasDateOut) return

        // Check if item has quantity field
        if (item[quantityField] !== undefined) {
          const quantity = typeof item[quantityField] === 'number' 
            ? item[quantityField] 
            : parseFloat(String(item[quantityField])) || 0
          
          // Item is low stock if quantity > 0 and <= threshold
          if (quantity > 0 && quantity <= lowStockThreshold) {
            // Get item name from template (usually 'name' field)
            const nameField = folder.template?.fields?.find(f => 
              f.name.toLowerCase() === 'name' ||
              f.name.toLowerCase() === 'item'
            )?.name || 'name'
            
            const itemName = item[nameField] || item.name || 'Unnamed Item'
            
            lowStockItemsList.push({
              id: item.id,
              name: String(itemName),
              quantity,
              folderName: folder.name,
              folderId: folder.id,
              threshold: lowStockThreshold,
              isSerialNumber: false
            })
          }
        }
      })
    }
  })

  // Sort by quantity (lowest first)
  return lowStockItemsList.sort((a, b) => a.quantity - b.quantity)
})

// Daily revenue data aggregation (last 30 days)
const dailyRevenueData = computed(() => {
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setHours(0, 0, 0, 0)
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  
  // Create a map for daily totals
  const dailyTotals = new Map<string, number>()
  
  // Initialize all days with 0
  for (let i = 0; i < 30; i++) {
    const date = new Date(thirtyDaysAgo)
    date.setDate(date.getDate() + i)
    const dateKey = date.toISOString().split('T')[0]
    if (dateKey) {
      dailyTotals.set(dateKey, 0)
    }
  }
  
  // Aggregate receipts by day
  receiptsStore.receipts.forEach(receipt => {
    if (receipt.status !== 'completed') return
    
    const receiptDate = receipt.date?.toDate ? receipt.date.toDate() : new Date(receipt.date)
    receiptDate.setHours(0, 0, 0, 0)
    
    if (receiptDate >= thirtyDaysAgo) {
      const dateKey = receiptDate.toISOString().split('T')[0]
      const currentTotal = dailyTotals.get(dateKey) || 0
      dailyTotals.set(dateKey, currentTotal + receipt.total)
    }
  })
  
  // Convert to array and sort by date
  return Array.from(dailyTotals.entries())
    .map(([date, revenue]) => ({
      date: new Date(date),
      revenue,
      dateKey: date
    }))
    .sort((a, b) => a.date.getTime() - b.date.getTime())
})

// Weekly revenue data aggregation (last 12 weeks)
const weeklyRevenueData = computed(() => {
  const twelveWeeksAgo = new Date()
  twelveWeeksAgo.setHours(0, 0, 0, 0)
  twelveWeeksAgo.setDate(twelveWeeksAgo.getDate() - (12 * 7))
  
  // Get Monday of the week for twelveWeeksAgo
  const dayOfWeek = twelveWeeksAgo.getDay()
  const diff = twelveWeeksAgo.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1) // Adjust to Monday
  const startOfWeek = new Date(twelveWeeksAgo.setDate(diff))
  startOfWeek.setHours(0, 0, 0, 0)
  
  const weeklyTotals = new Map<string, { revenue: number; startDate: Date; endDate: Date }>()
  
  // Initialize all weeks with 0
  for (let i = 0; i < 12; i++) {
    const weekStart = new Date(startOfWeek)
    weekStart.setDate(weekStart.getDate() + (i * 7))
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 6)
    
    const weekKey = `Week ${i + 1}`
    weeklyTotals.set(weekKey, {
      revenue: 0,
      startDate: new Date(weekStart),
      endDate: new Date(weekEnd)
    })
  }
  
  // Aggregate receipts by week
  receiptsStore.receipts.forEach(receipt => {
    if (receipt.status !== 'completed') return
    
    const receiptDate = receipt.date?.toDate ? receipt.date.toDate() : new Date(receipt.date)
    receiptDate.setHours(0, 0, 0, 0)
    
    if (receiptDate >= startOfWeek) {
      // Find which week this receipt belongs to
      const daysDiff = Math.floor((receiptDate.getTime() - startOfWeek.getTime()) / (1000 * 60 * 60 * 24))
      const weekIndex = Math.floor(daysDiff / 7)
      
      if (weekIndex >= 0 && weekIndex < 12) {
        const weekKey = `Week ${weekIndex + 1}`
        const weekData = weeklyTotals.get(weekKey)
        if (weekData) {
          weekData.revenue += receipt.total
        }
      }
    }
  })
  
  // Convert to array and sort by date
  return Array.from(weeklyTotals.values())
    .map((week, index) => ({
      date: week.startDate,
      revenue: week.revenue,
      dateKey: `Week ${index + 1}`,
      endDate: week.endDate
    }))
    .sort((a, b) => a.date.getTime() - b.date.getTime())
})

// Monthly revenue data aggregation (last 12 months)
const monthlyRevenueData = computed(() => {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  now.setDate(1) // First day of current month
  
  const monthlyTotals: Array<{ revenue: number; date: Date; dateKey: string }> = []
  
  // Initialize exactly 12 months (current month + 11 previous months)
  for (let i = 11; i >= 0; i--) {
    const monthDate = new Date(now)
    monthDate.setMonth(monthDate.getMonth() - i)
    const monthKey = monthDate.toLocaleDateString('en-US', { month: 'short' })
    
    monthlyTotals.push({
      revenue: 0,
      date: new Date(monthDate),
      dateKey: monthKey
    })
  }
  
  // Aggregate receipts by month
  receiptsStore.receipts.forEach(receipt => {
    if (receipt.status !== 'completed') return
    
    const receiptDate = receipt.date?.toDate ? receipt.date.toDate() : new Date(receipt.date)
    receiptDate.setHours(0, 0, 0, 0)
    receiptDate.setDate(1) // First day of the month
    
    // Find the matching month in our array
    const monthIndex = monthlyTotals.findIndex(month => {
      return month.date.getTime() === receiptDate.getTime()
    })
    
    if (monthIndex >= 0 && monthlyTotals[monthIndex]) {
      monthlyTotals[monthIndex].revenue += receipt.total
    }
  })
  
  return monthlyTotals
})

// Chart data based on selected view
const chartData = computed(() => {
  switch (chartView.value) {
    case 'weekly':
      return weeklyRevenueData.value
    case 'monthly':
      return monthlyRevenueData.value
    default:
      return dailyRevenueData.value
  }
})

// Chart subtitle based on view
const chartSubtitle = computed(() => {
  switch (chartView.value) {
    case 'weekly':
      return 'Last 12 weeks performance'
    case 'monthly':
      return 'Last 12 months performance'
    default:
      return 'Last 30 days performance'
  }
})

const totalRevenue30Days = computed(() => {
  return dailyRevenueData.value.reduce((sum, day) => sum + day.revenue, 0)
})

// ApexCharts configuration
const chartSeries = computed(() => {
  if (chartData.value.length === 0) return []
  
  const seriesName = chartView.value === 'weekly' 
    ? 'Weekly Revenue' 
    : chartView.value === 'monthly' 
      ? 'Monthly Revenue' 
      : 'Daily Revenue'
  
  // For monthly view, ensure we only show exactly 12 months
  let dataToUse = chartData.value
  if (chartView.value === 'monthly') {
    // Ensure we have exactly 12 months
    dataToUse = chartData.value.slice(-12) // Get last 12 months
  }
  
  return [{
    name: seriesName,
    data: dataToUse.map(item => item.revenue)
  }]
})

const themeStore = useThemeStore()

// Responsive chart height - use ref for reactive updates
const isMobile = ref(false)
if (import.meta.client) {
  isMobile.value = window.innerWidth < 640
  window.addEventListener('resize', () => {
    isMobile.value = window.innerWidth < 640
  })
}
const chartHeight = computed(() => isMobile.value ? 256 : 320)

const chartOptions = computed(() => {
  const isDark = themeStore.actualTheme === 'dark'
  const lineColor = isDark ? '#60A5FA' : '#2563EB'   // blue-400 / blue-600
  const gridColor = isDark ? 'rgba(75, 85, 99, 0.25)' : 'rgba(229, 231, 235, 0.8)'
  const labelColor = isDark ? '#9CA3AF' : '#6B7280'

  return {
    chart: {
      type: 'area',
      height: chartHeight.value,
      toolbar: { show: false },
      zoom: { enabled: false },
      fontFamily: 'inherit',
      background: 'transparent',
      animations: {
        enabled: true,
        easing: 'easeinout',
        speed: 600
      }
    },
    dataLabels: { enabled: false },
    stroke: {
      curve: 'smooth',
      width: 2,
      colors: [lineColor]
    },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 0,
        opacityFrom: 0.2,
        opacityTo: 0,
        stops: [0, 100],
        colorStops: [
          { offset: 0, color: lineColor, opacity: 0.22 },
          { offset: 100, color: lineColor, opacity: 0 }
        ]
      }
    },
    xaxis: {
      categories: (() => {
        const data = chartView.value === 'monthly' ? chartData.value.slice(-12) : chartData.value
        return data.map((item, index) => {
          if (chartView.value === 'weekly') {
            const week = item as { date: Date; revenue: number; dateKey: string; endDate: Date }
            return `Week ${index + 1}`
          } else if (chartView.value === 'monthly') {
            return item.date.toLocaleDateString('en-US', { month: 'short' })
          } else {
            return item.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          }
        })
      })(),
      labels: {
        style: {
          colors: labelColor,
          fontSize: '11px',
          fontWeight: 400
        },
        rotate: chartView.value === 'monthly' ? 0 : -45,
        rotateAlways: false,
        offsetY: 4
      },
      axisBorder: { show: false },
      axisTicks: { show: false },
      crosshairs: { show: false }
    },
    yaxis: {
      labels: {
        style: {
          colors: labelColor,
          fontSize: '11px',
          fontWeight: 400
        },
        formatter: (value: number) => {
          const symbol = currencySymbol.value || '$'
          if (value >= 1000) {
            return `${symbol}${(value / 1000).toFixed(1)}k`
          }
          return `${symbol}${Math.round(value)}`
        }
      },
      title: { text: undefined },
      axisBorder: { show: false },
      axisTicks: { show: false },
      crosshairs: { show: false }
    },
    grid: {
      borderColor: 'transparent',
      strokeDashArray: 0,
      xaxis: { lines: { show: false } },
      yaxis: {
        lines: {
          show: true,
          strokeDashArray: 0,
          color: gridColor
        }
      },
      padding: {
        top: 8,
        right: 4,
        bottom: 36,
        left: 4
      }
    },
    tooltip: {
      theme: isDark ? 'dark' : 'light',
      followCursor: true,
      style: { fontSize: '12px' },
      y: { formatter: (value: number) => formatCurrency(value) },
      x: {
        formatter: (value: string) => {
          const index = parseInt(value)
          if (chartData.value[index]) {
            const item = chartData.value[index]
            if (chartView.value === 'weekly') {
              const week = item as { date: Date; revenue: number; dateKey: string; endDate: Date }
              return `Week: ${week.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${week.endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
            } else if (chartView.value === 'monthly') {
              return item.date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
            } else {
              return item.date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
            }
          }
          return value
        }
      }
    },
    theme: { mode: isDark ? 'dark' : 'light' },
    colors: [lineColor],
    legend: { show: false },
    markers: {
      size: 0,
      strokeColors: lineColor,
      strokeWidth: 0,
      hover: { size: 4, strokeWidth: 0 }
    },
    states: {
      hover: { filter: { type: 'none' } },
      active: { filter: { type: 'none' } }
    }
  }
})

// Get currency formatting from preferences
const { formatCurrency: formatCurrencyFromPrefs, preferences } = usePreferences()
const currencySymbol = computed(() => preferences.value.currencySymbol || '$')

// Use the formatCurrency from preferences (which already includes the symbol)
const formatCurrency = formatCurrencyFromPrefs

const formatCurrencyShort = (value: number) => {
  const symbol = currencySymbol.value
  if (value >= 1000) {
    return `${symbol}${(value / 1000).toFixed(1)}k`
  }
  return `${symbol}${Math.round(value)}`
}

const getTimeAgo = (date: Date) => {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days} ${days === 1 ? 'day' : 'days'} ago`
  return date.toLocaleDateString()
}

const onTutorialComplete = () => {
  // Tutorial completed - no action needed
}

// Load all data
const loadDashboardData = async () => {
  isLoading.value = true
  try {
    // Wait for auth to be ready (especially important after cross-domain redirect)
    if (authStore.loading) {
      let attempts = 0
      const maxAttempts = 100 // Increased to 10 seconds
      while (authStore.loading && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 100))
        attempts++
      }
      if (authStore.loading) {
        console.warn('[Dashboard] Auth still loading after timeout')
      }
    }
    
    if (!authStore.currentUser) {
      console.warn('[Dashboard] No authenticated user after auth loaded')
      isLoading.value = false
      return
    }
    
    console.log('[Dashboard] Auth ready, user:', authStore.currentUser.uid)
    
    // Fetch user data if not loaded
    if (!userStore.userData || userStore.userData.uid !== authStore.currentUser.uid) {
      console.log('[Dashboard] Fetching user data for:', authStore.currentUser.uid)
      await userStore.fetchUserData(authStore.currentUser.uid)
      console.log('[Dashboard] User data fetched:', userStore.userData)
    } else {
      console.log('[Dashboard] User data already loaded:', userStore.userData)
    }
    
    // Fetch all stores in parallel
    await Promise.all([
      receiptsStore.fetchReceipts(),
      inventoryStore.fetchFolders(),
      departmentsStore.fetchDepartments(),
    ])
    
    // Load items for each folder
    if (inventoryStore.folders.length > 0) {
      await Promise.all(
        inventoryStore.folders.map(folder => inventoryStore.fetchItems(folder.id))
      )
    }
  } catch (error) {
    console.error('Error loading dashboard data:', error)
  } finally {
    isLoading.value = false
  }
}

onMounted(async () => {
  await loadDashboardData()
})

// Watch for auth changes
watch(() => authStore.currentUser, async (newUser) => {
  if (newUser && !isLoading.value) {
    await loadDashboardData()
  }
}, { immediate: false })

useHead({
  title: 'Dashboard - Storvv',
})
</script>