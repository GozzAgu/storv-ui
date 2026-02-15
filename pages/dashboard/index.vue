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
      <div class="hidden sm:flex items-center">
        <NuxtLink
          to="/dashboard/inventory"
          class="w-full sm:w-auto px-3 py-1.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-md font-semibold hover:from-primary-600 hover:to-primary-700 active:scale-95 transition-all duration-200 flex items-center justify-center gap-1.5 text-xs"
        >
          <PlusIcon class="w-4 h-4" />
          <span>Add Product</span>
        </NuxtLink>
      </div>
    </div>

    <!-- Loading State -->
    <template v-if="isLoading">
      <!-- Stats Cards Skeleton - Compact -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        <Card v-for="i in 4" :key="i" padding="sm" class="p-2.5">
          <div class="flex items-center justify-between">
            <div class="flex-1 min-w-0">
              <div class="h-2.5 bg-gray-200 dark:bg-gray-700 rounded-md w-2/3 mb-1.5 animate-pulse"></div>
              <div class="h-5 bg-gray-200 dark:bg-gray-700 rounded-md w-3/4 mb-1 animate-pulse"></div>
              <div class="h-2.5 bg-gray-200 dark:bg-gray-700 rounded-md w-1/2 animate-pulse"></div>
            </div>
            <div class="w-8 h-8 rounded-md bg-gray-200 dark:bg-gray-700 animate-pulse ml-2"></div>
        </div>
      </Card>
    </div>

      <!-- Charts Row Skeleton -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
        <!-- Revenue Chart Skeleton -->
        <Card class="lg:col-span-2">
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

        <!-- Quick Stats Skeleton -->
        <Card>
          <div class="h-4 sm:h-5 bg-gray-200 dark:bg-gray-700 rounded-md w-24 mb-4 animate-pulse"></div>
          <div class="space-y-3">
            <div v-for="i in 4" :key="i" class="flex items-center justify-between">
              <div class="flex items-center gap-2 flex-1">
                <div class="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
                <div class="flex-1">
                  <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded-md w-20 mb-1 animate-pulse"></div>
                  <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded-md w-12 animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
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
    <!-- Key Metrics Cards - Compact -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
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
        :subtext="`${formatCurrency(todaySales)} in sales`"
        :subtext-class="'text-primary-600 dark:text-primary-400 text-xs font-medium'"
        :icon="ShoppingCartIcon"
        icon-bg-class="bg-primary-100 dark:bg-primary-900/30"
        icon-class="text-primary-600 dark:text-primary-400"
      />
    </div>

    <!-- Charts Row -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-3">
      <!-- Revenue Chart -->
      <Card class="lg:col-span-2" padding="sm" extra-class="p-4">
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
                  ? 'bg-white dark:bg-gray-800 text-primary-600 dark:text-primary-400 shadow-sm'
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
                  ? 'bg-white dark:bg-gray-800 text-primary-600 dark:text-primary-400 shadow-sm'
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
                  ? 'bg-white dark:bg-gray-800 text-primary-600 dark:text-primary-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              ]"
            >
              Monthly
            </button>
          </div>
        </div>
        <div class="h-48 sm:h-64 lg:h-72 relative pb-4">
          <div v-if="chartData.length === 0" class="flex flex-col items-center justify-center py-12 text-center">
            <div class="w-14 h-14 mb-3 rounded-xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center">
              <ChartBarIcon class="w-7 h-7 text-green-600 dark:text-green-400" />
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

      <!-- Revenue Breakdown Pie Chart -->
      <Card padding="sm" extra-class="p-4 overflow-hidden">
        <div class="mb-2">
          <h2 class="text-[11px] font-semibold text-gray-900 dark:text-gray-100">Revenue Breakdown</h2>
          <p class="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">By product category</p>
        </div>
        <div class="h-48 sm:h-64 lg:h-72 relative overflow-hidden">
          <div v-if="pieChartData.length === 0" class="flex flex-col items-center justify-center py-12 text-center">
            <div class="w-14 h-14 mb-3 rounded-xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center">
              <Squares2X2Icon class="w-7 h-7 text-primary-600 dark:text-primary-400" />
            </div>
            <p class="text-sm font-medium text-gray-700 dark:text-gray-300">No breakdown data</p>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Sales will appear here by category</p>
          </div>
          <ClientOnly>
            <apexchart
              v-if="pieChartData.length > 0"
              type="donut"
              :height="isMobile ? 220 : 280"
              :options="pieChartOptions"
              :series="pieChartSeries"
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

    <!-- Bottom Row - fixed height cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
      <!-- Quick Stats -->
      <Card padding="sm" extra-class="p-4 h-[240px] flex flex-col">
        <h2 class="text-[11px] font-semibold text-gray-900 dark:text-gray-100 mb-2 flex-shrink-0">Quick Stats</h2>
        <div class="space-y-2 flex-1 min-h-0 overflow-y-auto">
          <div class="flex items-center gap-2">
            <div class="w-6 h-6 rounded-md bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
              <CheckCircleIcon class="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
            </div>
            <div class="min-w-0 flex-1">
              <p class="text-[10px] text-gray-600 dark:text-gray-400">Completed Orders</p>
              <p class="text-[10px] font-semibold text-gray-900 dark:text-gray-100">{{ completedReceiptsCount }}</p>
            </div>
          </div>
          
          <div class="flex items-center gap-2">
            <div class="w-6 h-6 rounded-md bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center flex-shrink-0">
              <ClockIcon class="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
            </div>
            <div class="min-w-0 flex-1">
              <p class="text-[10px] text-gray-600 dark:text-gray-400">Pending Orders</p>
              <p class="text-[10px] font-semibold text-gray-900 dark:text-gray-100">{{ pendingReceiptsCount }}</p>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <div class="w-6 h-6 rounded-md bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
              <XCircleIcon class="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
            </div>
            <div class="min-w-0 flex-1">
              <p class="text-[10px] text-gray-600 dark:text-gray-400">Refunded</p>
              <p class="text-[10px] font-semibold text-gray-900 dark:text-gray-100">{{ refundedReceiptsCount }}</p>
            </div>
          </div>
          
          <div class="flex items-center gap-2">
            <div class="w-6 h-6 rounded-md bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
              <BuildingOfficeIcon class="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            </div>
            <div class="min-w-0 flex-1">
              <p class="text-[10px] text-gray-600 dark:text-gray-400">Departments</p>
              <p class="text-[10px] font-semibold text-gray-900 dark:text-gray-100">{{ totalDepartments }}</p>
            </div>
          </div>
        </div>
      </Card>

      <!-- Recent Transactions -->
      <Card extra-class="h-[240px] flex flex-col p-4">
        <div class="flex items-center justify-between mb-2 flex-shrink-0">
          <h2 class="text-[11px] font-semibold text-gray-900 dark:text-gray-100">Recent Transactions</h2>
          <NuxtLink to="/dashboard/receipts" class="text-[9px] text-primary-600 dark:text-primary-400 hover:underline font-medium">View All</NuxtLink>
        </div>
        <div class="space-y-1.5 flex-1 min-h-0 overflow-y-auto">
          <div v-if="recentTransactions.length === 0" class="text-center py-6">
            <div class="w-10 h-10 mx-auto mb-2 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
              <ReceiptPercentIcon class="w-5 h-5 text-gray-400 dark:text-gray-500" />
            </div>
            <p class="text-xs text-gray-500 dark:text-gray-400">No recent transactions</p>
          </div>
          <div v-for="transaction in recentTransactions" :key="transaction.id" class="flex items-center justify-between py-1.5 border-b border-gray-200 dark:border-gray-700 last:border-0">
            <div class="flex items-center gap-2 flex-1 min-w-0">
              <div :class="['w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0', transaction.iconBg]">
                <component :is="transaction.icon" :class="['w-3.5 h-3.5', transaction.iconColor]" />
              </div>
              <div class="min-w-0 flex-1">
                <p class="text-[10px] font-medium text-gray-900 dark:text-gray-100 truncate">{{ transaction.description }}</p>
                <p class="text-[9px] text-gray-500 dark:text-gray-400">{{ transaction.time }}</p>
              </div>
            </div>
            <div class="text-right flex-shrink-0 ml-1.5">
              <p :class="['text-[10px] font-semibold', transaction.amountClass]">{{ transaction.amount }}</p>
            </div>
          </div>
        </div>
      </Card>

      <!-- Top Selling Products -->
      <Card extra-class="h-[240px] flex flex-col p-4">
        <div class="flex items-center justify-between mb-2 flex-shrink-0">
          <h2 class="text-[11px] font-semibold text-gray-900 dark:text-gray-100">Top Selling Products</h2>
          <NuxtLink to="/dashboard/inventory" class="text-[9px] text-primary-600 dark:text-primary-400 hover:underline font-medium">View All</NuxtLink>
        </div>
        <div class="space-y-2 flex-1 min-h-0 overflow-y-auto">
          <div v-if="topSellingItems.length === 0" class="text-center py-6">
            <div class="w-10 h-10 mx-auto mb-2 rounded-lg bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center">
              <CubeIcon class="w-5 h-5 text-primary-600 dark:text-primary-400" />
            </div>
            <p class="text-xs text-gray-500 dark:text-gray-400">No products sold yet</p>
          </div>
          <div v-for="(item, index) in topSellingItems.slice(0, 5)" :key="item.id" class="flex items-center gap-2">
            <div class="flex-shrink-0 w-7 h-7 rounded-md bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-bold text-[10px]">
              {{ index + 1 }}
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-[10px] font-medium text-gray-900 dark:text-gray-100 truncate">{{ item.name }}</p>
              <p class="text-[9px] text-gray-500 dark:text-gray-400">{{ item.sales }} sales</p>
            </div>
            <div class="text-right flex-shrink-0">
              <p class="text-[10px] font-semibold text-gray-900 dark:text-gray-100">{{ formatCurrency(item.revenue) }}</p>
            </div>
          </div>
        </div>
      </Card>

      <!-- Low Stock Items -->
      <Card v-if="lowStockItems.length > 0" extra-class="h-[240px] flex flex-col p-4">
        <div class="flex items-center justify-between mb-2 flex-shrink-0">
          <h2 class="text-[11px] font-semibold text-gray-900 dark:text-gray-100">Low Stock Items</h2>
          <NuxtLink to="/dashboard/inventory" class="text-[9px] text-primary-600 dark:text-primary-400 hover:underline font-medium">View All</NuxtLink>
        </div>
        <div class="space-y-2 flex-1 min-h-0 overflow-y-auto">
          <div v-for="item in lowStockItems.slice(0, 5)" :key="item.id" class="flex items-center gap-2">
            <div class="flex-shrink-0 w-7 h-7 rounded-md bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
              <ExclamationTriangleIcon class="w-4 h-4 text-orange-600 dark:text-orange-400" />
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-[10px] font-medium text-gray-900 dark:text-gray-100 truncate">
                {{ item.isSerialNumber ? item.name : item.name }}
              </p>
              <p class="text-[9px] text-gray-500 dark:text-gray-400">
                <span v-if="item.isSerialNumber">{{ item.quantity }} available</span>
                <span v-else>{{ item.folderName }}</span>
              </p>
            </div>
            <div class="text-right flex-shrink-0">
              <p class="text-[10px] font-semibold text-orange-600 dark:text-orange-400">
                <span v-if="item.isSerialNumber">{{ item.quantity }}</span>
                <span v-else>{{ item.quantity }}</span>
              </p>
              <p class="text-[8px] text-gray-500 dark:text-gray-400">
                <span v-if="item.isSerialNumber">items left</span>
                <span v-else>of {{ item.threshold }}</span>
              </p>
            </div>
          </div>
        </div>
      </Card>

      <!-- Inventory Status -->
      <Card extra-class="h-[240px] flex flex-col p-4">
        <div class="flex items-center justify-between mb-2 flex-shrink-0">
          <h2 class="text-[11px] font-semibold text-gray-900 dark:text-gray-100">Inventory Status</h2>
        </div>
        <div class="space-y-2.5 flex-1 min-h-0 overflow-y-auto">
          <div>
            <div class="flex items-center justify-between mb-1.5">
              <span class="text-[10px] text-gray-600 dark:text-gray-400">In Stock</span>
              <span class="text-[10px] font-semibold text-gray-900 dark:text-gray-100">{{ inStockCount }} ({{ inStockPercentage }}%)</span>
            </div>
            <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
              <div class="bg-green-500 h-1.5 rounded-full transition-all duration-300" :style="`width: ${inStockPercentage}%`"></div>
            </div>
          </div>
          
          <div>
            <div class="flex items-center justify-between mb-1.5">
              <span class="text-[10px] text-gray-600 dark:text-gray-400">Low Stock</span>
              <span class="text-[10px] font-semibold text-gray-900 dark:text-gray-100">{{ lowStockCount }} ({{ lowStockPercentage }}%)</span>
            </div>
            <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
              <div class="bg-orange-500 h-1.5 rounded-full transition-all duration-300" :style="`width: ${lowStockPercentage}%`"></div>
        </div>
      </div>

          <div>
            <div class="flex items-center justify-between mb-1.5">
              <span class="text-[10px] text-gray-600 dark:text-gray-400">Out of Stock</span>
              <span class="text-[10px] font-semibold text-gray-900 dark:text-gray-100">{{ outOfStockCount }} ({{ outOfStockPercentage }}%)</span>
            </div>
            <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
              <div class="bg-red-500 h-1.5 rounded-full transition-all duration-300" :style="`width: ${outOfStockPercentage}%`"></div>
        </div>
      </div>

          <div class="pt-2 border-t border-gray-200 dark:border-gray-700">
            <div class="flex items-center justify-between">
              <span class="text-[10px] text-gray-600 dark:text-gray-400">Total Items</span>
              <span class="text-[11px] font-bold text-gray-900 dark:text-gray-100">{{ totalInventoryItems }}</span>
            </div>
          </div>
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
  PlusIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  ReceiptPercentIcon,
  HomeIcon,
  BuildingOfficeIcon,
  Cog6ToothIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
  Squares2X2Icon,
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
  const isDark = import.meta.client 
    ? (document.documentElement.classList.contains('dark') || themeStore.actualTheme === 'dark')
    : false
  
  return {
    chart: {
      type: 'area',
      height: chartHeight.value,
      toolbar: {
        show: false
      },
      zoom: {
        enabled: false
      },
      sparkline: {
        enabled: false
      },
      fontFamily: 'inherit',
      background: 'transparent'
    },
    dataLabels: {
      enabled: false
    },
    stroke: {
      curve: 'smooth',
      width: 2,
      colors: ['#2563eb']
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
            color: '#2563eb',
            opacity: 0.4
          },
          {
            offset: 100,
            color: '#2563eb',
            opacity: 0.1
          }
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
          colors: isDark ? '#9CA3AF' : '#1F2937',
          fontSize: '12px'
        },
        rotate: chartView.value === 'monthly' ? 0 : -45,
        rotateAlways: false,
        offsetY: 8
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
        formatter: (value: number) => {
          const symbol = currencySymbol.value || '$'
          if (value >= 1000) {
            return `${symbol}${(value / 1000).toFixed(1)}k`
          }
          return `${symbol}${Math.round(value)}`
        }
      },
      title: {
        text: 'Revenue',
        style: {
          color: isDark ? '#9CA3AF' : '#1F2937',
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
        bottom: 20,
        left: 0
      }
    },
    tooltip: {
      theme: isDark ? 'dark' : 'light',
      y: {
        formatter: (value: number) => formatCurrency(value)
      },
      x: {
        formatter: (value: string) => {
          const index = parseInt(value)
          if (chartData.value[index]) {
            const item = chartData.value[index]
            if (chartView.value === 'weekly') {
              const week = item as { date: Date; revenue: number; dateKey: string; endDate: Date }
              return `Week: ${week.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${week.endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
            } else if (chartView.value === 'monthly') {
              return item.date.toLocaleDateString('en-US', {
                month: 'long',
                year: 'numeric'
              })
            } else {
              return item.date.toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })
            }
          }
          return value
        }
      }
    },
    theme: {
      mode: isDark ? 'dark' : 'light'
    },
    colors: ['#2563eb'],
    legend: {
      show: false
    },
    markers: {
      size: 4,
      colors: ['#2563eb'],
      strokeColors: '#fff',
      strokeWidth: 2,
      hover: {
        size: 6
      }
    }
  }
})

// Pie Chart Data - Revenue by Top Products
const pieChartData = computed(() => {
  const productRevenue = new Map<string, number>()
  
  receiptsStore.receipts.forEach(receipt => {
    if (receipt.status === 'completed' && receipt.items) {
      receipt.items.forEach((item: any) => {
        const existing = productRevenue.get(item.itemName) || 0
        productRevenue.set(item.itemName, existing + (item.price * item.quantity))
      })
    }
  })
  
  return Array.from(productRevenue.entries())
    .map(([name, revenue]) => ({ name, revenue }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5)
})

const pieChartSeries = computed(() => {
  return pieChartData.value.map(item => item.revenue)
})

const pieChartOptions = computed(() => {
  const isDark = import.meta.client 
    ? (document.documentElement.classList.contains('dark') || themeStore.actualTheme === 'dark')
    : false
  
  return {
    chart: {
      type: 'donut',
      background: 'transparent'
    },
    labels: pieChartData.value.map(item => item.name),
    colors: ['#2563eb', '#7c3aed', '#dc2626', '#ea580c', '#059669'],
    legend: {
      position: 'bottom',
      offsetY: 0,
      height: 40,
      labels: {
        colors: isDark ? '#9CA3AF' : '#1F2937',
        fontSize: '10px',
        useSeriesColors: false
      },
      itemMargin: {
        horizontal: 8,
        vertical: 4
      },
      formatter: function(seriesName: string, opts: any) {
        return seriesName.length > 10 ? seriesName.substring(0, 10) + '...' : seriesName
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
    },
    dataLabels: {
      enabled: true,
      formatter: (val: number) => `${val.toFixed(1)}%`,
      style: {
        fontSize: '11px',
        fontWeight: 500,
        colors: isDark ? ['#fff'] : ['#1F2937']
      }
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