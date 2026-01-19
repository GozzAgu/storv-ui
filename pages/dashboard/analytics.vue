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
      <div class="grid grid-cols-1 lg:grid-cols-4 gap-2.5">
        <Card v-for="i in 4" :key="i" padding="sm" class="p-3">
          <div class="h-16 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse"></div>
        </Card>
      </div>
    </template>

    <!-- Analytics Content -->
    <template v-else>
      <!-- Key Metrics Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        <Card padding="sm" class="p-3">
          <div class="flex items-center justify-between">
            <div class="flex-1">
              <p class="text-[10px] text-gray-500 dark:text-gray-400 mb-1">Total Revenue</p>
              <p class="text-lg font-bold text-gray-900 dark:text-gray-100">{{ formatCurrency(totalRevenue) }}</p>
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
              <p class="text-lg font-bold text-gray-900 dark:text-gray-100">{{ totalSales }}</p>
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
              <p class="text-lg font-bold text-gray-900 dark:text-gray-100">{{ formatCurrency(averageOrderValue) }}</p>
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
              <p class="text-lg font-bold text-gray-900 dark:text-gray-100">{{ lowStockCount }}</p>
              <p class="text-[10px] mt-1 text-gray-500 dark:text-gray-400">
                Need restocking
              </p>
            </div>
            <div class="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
              <ExclamationTriangleIcon class="w-5 h-5 text-orange-600 dark:text-orange-400" />
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

      <!-- Detailed Tables -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-3">
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
      </div>

      <!-- Low Stock Alerts -->
      <Card padding="sm" extra-class="p-4" v-if="lowStockItems.length > 0">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h2 class="text-sm font-semibold text-gray-900 dark:text-gray-100">Low Stock Alerts</h2>
            <p class="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">Items that need restocking</p>
          </div>
        </div>
        <div class="space-y-2">
          <div
            v-for="item in lowStockItems"
            :key="item.id"
            class="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg"
          >
            <div class="flex-1">
              <p class="text-xs font-medium text-gray-900 dark:text-gray-100">{{ item.name }}</p>
              <p class="text-[10px] text-gray-600 dark:text-gray-400 mt-0.5">
                {{ item.folderName }}
                <span v-if="item.itemCount > 1" class="ml-1 text-orange-600 dark:text-orange-400">
                  ({{ item.itemCount }} items)
                </span>
              </p>
            </div>
            <div class="text-right">
              <p class="text-xs font-semibold text-orange-600 dark:text-orange-400">{{ item.quantity }} left</p>
              <p class="text-[10px] text-gray-500 dark:text-gray-400">Threshold: {{ item.threshold }}</p>
            </div>
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
  CurrencyDollarIcon,
  ShoppingBagIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
} from '@heroicons/vue/24/outline'
import { useReceiptsStore } from '~/stores/receipts'
import { useInventoryStore } from '~/stores/inventory'
import { useCustomersStore } from '~/stores/customers'
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
const receiptsStore = useReceiptsStore()
const inventoryStore = useInventoryStore()
const customersStore = useCustomersStore()

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
    
    const threshold = item.lowStockThreshold || 10
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
        threshold: threshold,
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
    itemCount: group.itemIds.length
  }))
})

const lowStockCount = computed(() => lowStockItems.value.length)

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

const revenueChartOptions = computed(() => ({
  chart: {
    type: 'line',
    toolbar: { show: false },
    zoom: { enabled: false }
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
    }) || []
  },
  yaxis: {
    labels: {
      formatter: (val: number) => formatCurrency(val)
    }
  },
  tooltip: {
    y: {
      formatter: (val: number) => formatCurrency(val)
    }
  },
  theme: {
    mode: document.documentElement.classList.contains('dark') ? 'dark' : 'light'
  }
}))

const topProductsChartSeries = computed(() => {
  return topProducts.value.slice(0, 5).map(p => p.revenue)
})

const topProductsChartOptions = computed(() => ({
  chart: {
    type: 'donut'
  },
  labels: topProducts.value.slice(0, 5).map(p => p.name),
  colors: ['#2563eb', '#7c3aed', '#dc2626', '#ea580c', '#059669'],
  legend: {
    position: 'bottom'
  },
  tooltip: {
    y: {
      formatter: (val: number) => formatCurrency(val)
    }
  },
  theme: {
    mode: document.documentElement.classList.contains('dark') ? 'dark' : 'light'
  }
}))

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

const inventoryTurnoverChartOptions = computed(() => ({
  chart: {
    type: 'bar',
    toolbar: { show: false }
  },
  colors: ['#7c3aed'],
  xaxis: {
    categories: inventoryStore.folders.map(f => f.name)
  },
  yaxis: {
    title: {
      text: 'Turnover Rate (%)'
    }
  },
  theme: {
    mode: document.documentElement.classList.contains('dark') ? 'dark' : 'light'
  }
}))

const customerChartSeries = computed(() => {
  return [{
    name: 'Total Spent',
    data: topCustomers.value.slice(0, 5).map(c => c.totalSpent)
  }]
})

const customerChartOptions = computed(() => ({
  chart: {
    type: 'bar',
    toolbar: { show: false }
  },
  colors: ['#059669'],
  xaxis: {
    categories: topCustomers.value.slice(0, 5).map(c => c.name.split(' ')[0])
  },
  yaxis: {
    labels: {
      formatter: (val: number) => formatCurrency(val)
    }
  },
  tooltip: {
    y: {
      formatter: (val: number) => formatCurrency(val)
    }
  },
  theme: {
    mode: document.documentElement.classList.contains('dark') ? 'dark' : 'light'
  }
}))

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
