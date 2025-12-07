<template>
  <div class="space-y-6">
    <!-- Tutorial Component -->
    <Tutorial :tutorial-steps="tutorialSteps" @complete="onTutorialComplete" />
    <!-- Welcome Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
    <div>
        <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100">Welcome back, {{ userName }}! 👋</h1>
        <p class="mt-1 text-gray-600 dark:text-gray-400">Here's what's happening with your inventory today.</p>
      </div>
      <div class="flex items-center gap-3">
        <NuxtLink
          to="/dashboard/inventory"
          class="px-4 py-2 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-primary-500/50 transition-all duration-200 flex items-center gap-2"
        >
          <PlusIcon class="w-5 h-5" />
          Add Product
        </NuxtLink>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card v-for="i in 4" :key="i" padding="md">
        <div class="animate-pulse">
          <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
          <div class="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
        </div>
      </Card>
    </div>

    <!-- Key Metrics Cards -->
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard
        label="Total Revenue"
        :value="formatCurrency(totalRevenue)"
        :subtext="revenueChangeText"
        :subtext-class="revenueChangeClass"
        :icon="CurrencyDollarIcon"
        icon-bg-class="bg-green-100 dark:bg-green-900/30"
        icon-class="text-green-600 dark:text-green-400"
      />
      <StatCard
        label="Active Customers"
        :value="totalCustomers.toString()"
        :subtext="`${newCustomersToday} new today`"
        :subtext-class="newCustomersToday > 0 ? 'text-blue-600 dark:text-blue-400 text-xs font-medium' : 'text-gray-500 dark:text-gray-400 text-xs'"
        :icon="UsersIcon"
        icon-bg-class="bg-blue-100 dark:bg-blue-900/30"
        icon-class="text-blue-600 dark:text-blue-400"
      />
      <StatCard
        label="Total Items"
        :value="totalInventoryItems.toString()"
        :subtext="lowStockCount > 0 ? `⚠ ${lowStockCount} Low Stock` : 'All items in stock'"
        :subtext-class="lowStockCount > 0 ? 'text-orange-600 dark:text-orange-400 text-xs font-medium' : 'text-gray-500 dark:text-gray-400 text-xs'"
        :icon="CubeIcon"
        icon-bg-class="bg-orange-100 dark:bg-orange-900/30"
        icon-class="text-orange-600 dark:text-orange-400"
      />
      <StatCard
        label="Orders Today"
        :value="todayReceiptsCount.toString()"
        :subtext="`$${formatCurrency(todaySales)} in sales`"
        :subtext-class="'text-primary-600 dark:text-primary-400 text-xs font-medium'"
        :icon="ShoppingCartIcon"
        icon-bg-class="bg-primary-100 dark:bg-primary-900/30"
        icon-class="text-primary-600 dark:text-primary-400"
      />
    </div>

    <!-- Charts Row -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Revenue Chart -->
      <Card class="lg:col-span-2">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Revenue Overview</h2>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Last 30 days performance</p>
          </div>
        </div>
        <div class="h-80 relative">
          <p v-if="dailyRevenueData.length === 0" class="text-sm text-gray-500 dark:text-gray-400 text-center py-12">No revenue data available yet</p>
          <ClientOnly>
            <apexchart
              v-if="dailyRevenueData.length > 0"
              type="area"
              height="320"
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

      <!-- Quick Stats -->
      <Card>
        <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">Quick Stats</h2>
        <div class="space-y-6">
        <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <CheckCircleIcon class="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
          <div>
                <p class="text-sm text-gray-600 dark:text-gray-400">Completed Orders</p>
                <p class="text-lg font-semibold text-gray-900 dark:text-gray-100">{{ completedReceiptsCount }}</p>
              </div>
            </div>
          </div>
          
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                <ClockIcon class="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p class="text-sm text-gray-600 dark:text-gray-400">Pending Orders</p>
                <p class="text-lg font-semibold text-gray-900 dark:text-gray-100">{{ pendingReceiptsCount }}</p>
          </div>
        </div>
      </div>

        <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <XCircleIcon class="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
          <div>
                <p class="text-sm text-gray-600 dark:text-gray-400">Refunded</p>
                <p class="text-lg font-semibold text-gray-900 dark:text-gray-100">{{ refundedReceiptsCount }}</p>
              </div>
            </div>
          </div>
          
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <BuildingOfficeIcon class="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p class="text-sm text-gray-600 dark:text-gray-400">Departments</p>
                <p class="text-lg font-semibold text-gray-900 dark:text-gray-100">{{ totalDepartments }}</p>
              </div>
            </div>
          </div>
        </div>
      </Card>
      </div>

    <!-- Bottom Row -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Recent Transactions -->
      <Card>
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Recent Transactions</h2>
          <NuxtLink to="/dashboard/receipts" class="text-sm text-primary-600 dark:text-primary-400 hover:underline">View All</NuxtLink>
        </div>
        <div class="space-y-4">
          <div v-if="recentTransactions.length === 0" class="text-center py-8">
            <p class="text-sm text-gray-500 dark:text-gray-400">No recent transactions</p>
          </div>
          <div v-for="transaction in recentTransactions" :key="transaction.id" class="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700 last:border-0">
            <div class="flex items-center gap-3">
              <div :class="['w-8 h-8 rounded-lg flex items-center justify-center', transaction.iconBg]">
                <component :is="transaction.icon" :class="['w-4 h-4', transaction.iconColor]" />
              </div>
              <div>
                <p class="text-sm font-medium text-gray-900 dark:text-gray-100">{{ transaction.description }}</p>
                <p class="text-xs text-gray-500 dark:text-gray-400">{{ transaction.time }}</p>
              </div>
            </div>
            <div class="text-right">
              <p :class="['text-sm font-semibold', transaction.amountClass]">{{ transaction.amount }}</p>
            </div>
          </div>
        </div>
      </Card>

      <!-- Top Selling Products -->
      <Card>
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Top Selling Products</h2>
          <NuxtLink to="/dashboard/inventory" class="text-sm text-primary-600 dark:text-primary-400 hover:underline">View All</NuxtLink>
    </div>
        <div class="space-y-4">
          <div v-if="topSellingItems.length === 0" class="text-center py-8">
            <p class="text-sm text-gray-500 dark:text-gray-400">No products sold yet</p>
          </div>
          <div v-for="(item, index) in topSellingItems.slice(0, 5)" :key="item.id" class="flex items-center gap-4">
            <div class="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-bold">
              {{ index + 1 }}
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{{ item.name }}</p>
              <p class="text-xs text-gray-500 dark:text-gray-400">{{ item.sales }} sales</p>
            </div>
            <div class="text-right">
              <p class="text-sm font-semibold text-gray-900 dark:text-gray-100">{{ formatCurrency(item.revenue) }}</p>
            </div>
          </div>
        </div>
      </Card>

      <!-- Inventory Status -->
      <Card>
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Inventory Status</h2>
        </div>
        <div class="space-y-6">
          <div>
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm text-gray-600 dark:text-gray-400">In Stock</span>
              <span class="text-sm font-semibold text-gray-900 dark:text-gray-100">{{ inStockCount }} ({{ inStockPercentage }}%)</span>
            </div>
            <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div class="bg-green-500 h-2 rounded-full" :style="`width: ${inStockPercentage}%`"></div>
            </div>
          </div>
          
          <div>
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm text-gray-600 dark:text-gray-400">Low Stock</span>
              <span class="text-sm font-semibold text-gray-900 dark:text-gray-100">{{ lowStockCount }} ({{ lowStockPercentage }}%)</span>
            </div>
            <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div class="bg-orange-500 h-2 rounded-full" :style="`width: ${lowStockPercentage}%`"></div>
        </div>
      </div>

          <div>
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm text-gray-600 dark:text-gray-400">Out of Stock</span>
              <span class="text-sm font-semibold text-gray-900 dark:text-gray-100">{{ outOfStockCount }} ({{ outOfStockPercentage }}%)</span>
            </div>
            <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div class="bg-red-500 h-2 rounded-full" :style="`width: ${outOfStockPercentage}%`"></div>
        </div>
      </div>

          <div class="pt-4 border-t border-gray-200 dark:border-gray-700">
            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-600 dark:text-gray-400">Total Items</span>
              <span class="text-lg font-bold text-gray-900 dark:text-gray-100">{{ totalInventoryItems }}</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
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
  PlusIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  ReceiptPercentIcon,
  HomeIcon,
  BuildingOfficeIcon,
  Cog6ToothIcon,
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
import type { Receipt } from '~/stores/receipts'
import type { InventoryItem } from '~/stores/inventory'

definePageMeta({
  layout: 'dashboard',
  middleware: 'auth'
})

const tutorialSteps = [
  {
    title: 'Welcome to Your Dashboard',
    description: 'This is your main dashboard where you can see all key metrics, revenue, and activity at a glance.',
    icon: HomeIcon
  },
  {
    title: 'Manage Your Inventory',
    description: 'Organize your products into folders and track stock levels. Click on Inventory in the sidebar to get started.',
    icon: CubeIcon
  },
  {
    title: 'Track Receipts & Returns',
    description: 'Record sales receipts and handle returns efficiently. Access these features from the sidebar navigation.',
    icon: ReceiptPercentIcon
  },
  {
    title: 'Manage Customers & Departments',
    description: 'Keep track of your customers and organize your team by departments.',
    icon: UsersIcon
  },
  {
    title: 'Configure Settings',
    description: 'Customize your store settings, preferences, and manage your account from the Settings page.',
    icon: Cog6ToothIcon
  }
]

const receiptsStore = useReceiptsStore()
const inventoryStore = useInventoryStore()
const departmentsStore = useDepartmentsStore()
const authStore = useAuthStore()
const userStore = useUserStore()

const isLoading = ref(true)

// User name for welcome message
const userName = computed(() => {
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
  return `$${formatCurrency(monthSales.value)} this month`
})
const revenueChangeClass = computed(() => {
  return totalRevenue.value > 0 ? 'text-green-600 dark:text-green-400 text-xs font-medium' : 'text-gray-500 dark:text-gray-400 text-xs'
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

const totalRevenue30Days = computed(() => {
  return dailyRevenueData.value.reduce((sum, day) => sum + day.revenue, 0)
})

// ApexCharts configuration
const chartSeries = computed(() => {
  if (dailyRevenueData.value.length === 0) return []
  
  return [{
    name: 'Daily Revenue',
    data: dailyRevenueData.value.map(day => day.revenue)
  }]
})

const themeStore = useThemeStore()
const chartOptions = computed(() => {
  const isDark = import.meta.client 
    ? (document.documentElement.classList.contains('dark') || themeStore.actualTheme === 'dark')
    : false
  
  return {
    chart: {
      type: 'area',
      height: 320,
      toolbar: {
        show: false
      },
      zoom: {
        enabled: false
      },
      sparkline: {
        enabled: false
      },
      fontFamily: 'inherit'
    },
    dataLabels: {
      enabled: false
    },
    stroke: {
      curve: 'smooth',
      width: 3,
      colors: ['#667eea']
    },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.4,
        opacityTo: 0.1,
        stops: [0, 90, 100],
        colorStops: [
          {
            offset: 0,
            color: '#667eea',
            opacity: 0.4
          },
          {
            offset: 100,
            color: '#667eea',
            opacity: 0.1
          }
        ]
      }
    },
    xaxis: {
      categories: dailyRevenueData.value.map(day => 
        day.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      ),
      labels: {
        style: {
          colors: isDark ? '#9CA3AF' : '#6B7280',
          fontSize: '12px'
        },
        rotate: -45,
        rotateAlways: false
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
          colors: isDark ? '#9CA3AF' : '#6B7280',
          fontSize: '12px'
        },
        formatter: (value: number) => {
          if (value >= 1000) {
            return `$${(value / 1000).toFixed(1)}k`
          }
          return `$${Math.round(value)}`
        }
      },
      title: {
        text: 'Revenue',
        style: {
          color: isDark ? '#9CA3AF' : '#6B7280',
          fontSize: '12px',
          fontWeight: 500
        }
      }
    },
    grid: {
      borderColor: isDark ? '#374151' : '#E5E7EB',
      strokeDashArray: 4,
      xaxis: {
        lines: {
          show: false
        }
      },
      yaxis: {
        lines: {
          show: true
        }
      },
      padding: {
        top: 0,
        right: 0,
        bottom: 0,
        left: 0
      }
    },
    tooltip: {
      theme: isDark ? 'dark' : 'light',
      y: {
        formatter: (value: number) => `$${formatCurrency(value)}`
      },
      x: {
        formatter: (value: string) => {
          const index = parseInt(value)
          if (dailyRevenueData.value[index]) {
            return dailyRevenueData.value[index].date.toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            })
          }
          return value
        }
      }
    },
    colors: ['#667eea'],
    legend: {
      show: false
    },
    markers: {
      size: 4,
      colors: ['#667eea'],
      strokeColors: '#fff',
      strokeWidth: 2,
      hover: {
        size: 6
      }
    }
  }
})

// Utility functions
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value).replace('$', '')
}

const formatCurrencyShort = (value: number) => {
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(1)}k`
  }
  return `$${Math.round(value)}`
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
    // Wait for auth
    if (authStore.loading) {
      let attempts = 0
      while (authStore.loading && attempts < 50) {
        await new Promise(resolve => setTimeout(resolve, 100))
        attempts++
      }
    }
    
    if (!authStore.currentUser) {
      isLoading.value = false
      return
    }
    
    // Fetch user data if not loaded
    if (!userStore.userData) {
      await userStore.fetchUserData(authStore.currentUser.uid)
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
  title: 'Dashboard - Storv',
})
</script>