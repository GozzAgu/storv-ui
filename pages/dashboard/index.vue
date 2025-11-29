<template>
  <div class="space-y-6">
    <!-- Tutorial Component -->
    <Tutorial :tutorial-steps="tutorialSteps" @complete="onTutorialComplete" />
    <!-- Welcome Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100">Welcome back, Chigozie! 👋</h1>
        <p class="mt-1 text-gray-600 dark:text-gray-400">Here's what's happening with your inventory today.</p>
      </div>
      <div class="flex items-center gap-3">
        <button class="px-4 py-2 bg-gradient-to-r from-primary-500 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-primary-500/50 transition-all duration-200 flex items-center gap-2">
          <PlusIcon class="w-5 h-5" />
          Add Product
        </button>
        <button class="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2">
          <ArrowDownTrayIcon class="w-5 h-5" />
          Export
        </button>
      </div>
    </div>

    <!-- Key Metrics Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard
        label="Total Revenue"
        value="$12,548.50"
        subtext="↗ 12.5% from last month"
        subtext-class="text-green-600 dark:text-green-400 text-xs font-medium"
        :icon="CurrencyDollarIcon"
        icon-bg-class="bg-green-100 dark:bg-green-900/30"
        icon-class="text-green-600 dark:text-green-400"
      />
      <StatCard
        label="Active Customers"
        value="1,234"
        subtext="↗ 8 new today"
        subtext-class="text-blue-600 dark:text-blue-400 text-xs font-medium"
        :icon="UsersIcon"
        icon-bg-class="bg-blue-100 dark:bg-blue-900/30"
        icon-class="text-blue-600 dark:text-blue-400"
      />
      <StatCard
        label="Total Items"
        value="8,456"
        subtext="⚠ 23 Low Stock"
        subtext-class="text-orange-600 dark:text-orange-400 text-xs font-medium"
        :icon="CubeIcon"
        icon-bg-class="bg-orange-100 dark:bg-orange-900/30"
        icon-class="text-orange-600 dark:text-orange-400"
      />
      <StatCard
        label="Orders Today"
        value="47"
        subtext="↗ 15% from yesterday"
        subtext-class="text-purple-600 dark:text-purple-400 text-xs font-medium"
        :icon="ShoppingCartIcon"
        icon-bg-class="bg-purple-100 dark:bg-purple-900/30"
        icon-class="text-purple-600 dark:text-purple-400"
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
          <select class="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
            <option>Last 30 days</option>
            <option>Last 7 days</option>
            <option>Last 90 days</option>
            <option>Last year</option>
          </select>
        </div>
        <!-- Simple Line Chart -->
        <div class="h-64 relative">
          <svg viewBox="0 0 400 200" class="w-full h-full">
            <defs>
              <linearGradient id="revenueGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style="stop-color:#667eea;stop-opacity:0.3" />
                <stop offset="100%" style="stop-color:#667eea;stop-opacity:0" />
              </linearGradient>
            </defs>
            <!-- Grid lines -->
            <line x1="40" y1="20" x2="40" y2="180" stroke="currentColor" stroke-width="1" class="text-gray-200 dark:text-gray-700" />
            <line x1="40" y1="180" x2="360" y2="180" stroke="currentColor" stroke-width="1" class="text-gray-200 dark:text-gray-700" />
            
            <!-- Area fill -->
            <path
              d="M 40,140 Q 100,120 160,110 T 280,85 T 360,70 L 360,180 L 40,180 Z"
              fill="url(#revenueGradient)"
            />
            
            <!-- Line -->
            <path
              d="M 40,140 Q 100,120 160,110 T 280,85 T 360,70"
              fill="none"
              stroke="#667eea"
              stroke-width="3"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            
            <!-- Data points -->
            <circle cx="40" cy="140" r="4" fill="#667eea" />
            <circle cx="100" cy="120" r="4" fill="#667eea" />
            <circle cx="160" cy="110" r="4" fill="#667eea" />
            <circle cx="220" cy="95" r="4" fill="#667eea" />
            <circle cx="280" cy="85" r="4" fill="#667eea" />
            <circle cx="340" cy="70" r="4" fill="#667eea" />
            <circle cx="360" cy="70" r="4" fill="#667eea" />
            
            <!-- Labels -->
            <text x="200" y="195" text-anchor="middle" class="text-xs fill-gray-500 dark:fill-gray-400">Days</text>
          </svg>
          <div class="absolute bottom-4 left-4 flex items-center gap-4">
            <div class="flex items-center gap-2">
              <div class="w-3 h-3 rounded-full bg-primary-500"></div>
              <span class="text-sm text-gray-600 dark:text-gray-400">Revenue</span>
            </div>
          </div>
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
                <p class="text-lg font-semibold text-gray-900 dark:text-gray-100">142</p>
              </div>
            </div>
            <span class="text-xs text-green-600 dark:text-green-400 font-medium">+8%</span>
          </div>
          
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                <ClockIcon class="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p class="text-sm text-gray-600 dark:text-gray-400">Pending Orders</p>
                <p class="text-lg font-semibold text-gray-900 dark:text-gray-100">23</p>
              </div>
            </div>
            <span class="text-xs text-orange-600 dark:text-orange-400 font-medium">-3%</span>
          </div>
          
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <XCircleIcon class="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p class="text-sm text-gray-600 dark:text-gray-400">Cancelled</p>
                <p class="text-lg font-semibold text-gray-900 dark:text-gray-100">5</p>
              </div>
            </div>
            <span class="text-xs text-red-600 dark:text-red-400 font-medium">-12%</span>
          </div>
          
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <ArrowPathIcon class="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p class="text-sm text-gray-600 dark:text-gray-400">Returns</p>
                <p class="text-lg font-semibold text-gray-900 dark:text-gray-100">12</p>
              </div>
            </div>
            <span class="text-xs text-blue-600 dark:text-blue-400 font-medium">-5%</span>
          </div>
        </div>
      </Card>
    </div>

    <!-- Bottom Row -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Top Selling Products -->
      <Card>
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Top Selling Products</h2>
          <button class="text-sm text-primary-600 dark:text-primary-400 hover:underline">View All</button>
        </div>
        <div class="space-y-4">
          <div v-for="(product, index) in topProducts" :key="index" class="flex items-center gap-4">
            <div class="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-white font-bold">
              {{ index + 1 }}
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{{ product.name }}</p>
              <p class="text-xs text-gray-500 dark:text-gray-400">{{ product.sales }} sales</p>
            </div>
            <div class="text-right">
              <p class="text-sm font-semibold text-gray-900 dark:text-gray-100">${{ product.revenue }}</p>
              <div class="flex items-center gap-1">
                <ArrowTrendingUpIcon class="w-3 h-3 text-green-500" />
                <span class="text-xs text-green-600 dark:text-green-400">{{ product.growth }}%</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <!-- Recent Transactions -->
      <Card>
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Recent Transactions</h2>
          <button class="text-sm text-primary-600 dark:text-primary-400 hover:underline">View All</button>
        </div>
        <div class="space-y-4">
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

      <!-- Inventory Distribution -->
      <Card>
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Inventory Status</h2>
        </div>
        <div class="space-y-6">
          <div>
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm text-gray-600 dark:text-gray-400">In Stock</span>
              <span class="text-sm font-semibold text-gray-900 dark:text-gray-100">7,234 (85%)</span>
            </div>
            <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div class="bg-green-500 h-2 rounded-full" style="width: 85%"></div>
            </div>
          </div>
          
          <div>
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm text-gray-600 dark:text-gray-400">Low Stock</span>
              <span class="text-sm font-semibold text-gray-900 dark:text-gray-100">892 (11%)</span>
            </div>
            <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div class="bg-orange-500 h-2 rounded-full" style="width: 11%"></div>
            </div>
          </div>
          
          <div>
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm text-gray-600 dark:text-gray-400">Out of Stock</span>
              <span class="text-sm font-semibold text-gray-900 dark:text-gray-100">330 (4%)</span>
            </div>
            <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div class="bg-red-500 h-2 rounded-full" style="width: 4%"></div>
            </div>
          </div>
          
          <div class="pt-4 border-t border-gray-200 dark:border-gray-700">
            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-600 dark:text-gray-400">Total Items</span>
              <span class="text-lg font-bold text-gray-900 dark:text-gray-100">8,456</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  CubeIcon,
  CurrencyDollarIcon,
  UsersIcon,
  ShoppingCartIcon,
  ArrowPathIcon,
  PlusIcon,
  ArrowDownTrayIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  ArrowTrendingUpIcon,
  ReceiptPercentIcon,
  HomeIcon,
  BuildingOfficeIcon,
  Cog6ToothIcon,
} from '@heroicons/vue/24/outline'

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
    description: 'Keep track of your customers and organize your team by departments with leave management.',
    icon: UsersIcon
  },
  {
    title: 'Configure Settings',
    description: 'Customize your store settings, preferences, and manage your account from the Settings page.',
    icon: Cog6ToothIcon
  }
]

const onTutorialComplete = () => {
  // Tutorial completed - no action needed
}

const topProducts = [
  { name: 'Wireless Headphones', sales: 234, revenue: '4,680', growth: 12 },
  { name: 'Smart Watch Pro', sales: 189, revenue: '9,450', growth: 8 },
  { name: 'USB-C Cable Pack', sales: 156, revenue: '780', growth: 15 },
  { name: 'Bluetooth Speaker', sales: 142, revenue: '4,260', growth: 5 },
  { name: 'Phone Case Set', sales: 128, revenue: '1,280', growth: 20 },
]

const recentTransactions = [
  {
    id: 1,
    description: 'Payment from Customer #1234',
    time: '2 minutes ago',
    amount: '+$450.00',
    amountClass: 'text-green-600 dark:text-green-400',
    icon: ReceiptPercentIcon,
    iconBg: 'bg-green-100 dark:bg-green-900/30',
    iconColor: 'text-green-600 dark:text-green-400',
  },
  {
    id: 2,
    description: 'Refund to Customer #1231',
    time: '15 minutes ago',
    amount: '-$125.50',
    amountClass: 'text-red-600 dark:text-red-400',
    icon: ArrowPathIcon,
    iconBg: 'bg-red-100 dark:bg-red-900/30',
    iconColor: 'text-red-600 dark:text-red-400',
  },
  {
    id: 3,
    description: 'Payment from Customer #1228',
    time: '1 hour ago',
    amount: '+$890.00',
    amountClass: 'text-green-600 dark:text-green-400',
    icon: ReceiptPercentIcon,
    iconBg: 'bg-green-100 dark:bg-green-900/30',
    iconColor: 'text-green-600 dark:text-green-400',
  },
  {
    id: 4,
    description: 'Payment from Customer #1225',
    time: '2 hours ago',
    amount: '+$234.50',
    amountClass: 'text-green-600 dark:text-green-400',
    icon: ReceiptPercentIcon,
    iconBg: 'bg-green-100 dark:bg-green-900/30',
    iconColor: 'text-green-600 dark:text-green-400',
  },
]

useHead({
  title: 'Dashboard - Storv',
})
</script>
