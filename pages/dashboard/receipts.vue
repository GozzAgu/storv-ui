<template>
  <ClientOnly>
    <div class="space-y-4 sm:space-y-6 pb-24 sm:pb-20 min-h-screen w-full">
      <!-- Loading State -->
      <div v-if="isInitialLoading">
        <Card padding="none">
          <div class="p-8 sm:p-12 text-center">
            <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">Loading receipts...</p>
          </div>
        </Card>
      </div>
    
    <!-- Actual Content -->
    <template v-else>
    <!-- Page Header - Mobile Optimized -->
      <div>
      <h1 class="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 leading-tight">Sales</h1>
      <p class="mt-1.5 text-sm sm:text-base text-gray-600 dark:text-gray-400">Manage receipts, customers, and returns</p>
    </div>

    <!-- Tab Navigation - Mobile Optimized -->
    <Card padding="none" class="overflow-hidden">
      <div class="border-b border-gray-200 dark:border-gray-700">
        <nav class="flex -mb-px">
          <button
            @click="activeTab = 'receipts'"
            :class="[
              'flex-1 px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium border-b-2 transition-colors touch-manipulation active:bg-gray-50 dark:active:bg-gray-800/50',
              activeTab === 'receipts'
                ? 'border-primary-600 text-primary-600 dark:text-primary-400 dark:border-primary-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            ]"
          >
            <div class="flex items-center justify-center gap-1.5 sm:gap-2">
              <ReceiptPercentIcon class="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Receipts</span>
            </div>
          </button>
          <button
            @click="activeTab = 'customers'"
            :class="[
              'flex-1 px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium border-b-2 transition-colors touch-manipulation active:bg-gray-50 dark:active:bg-gray-800/50',
              activeTab === 'customers'
                ? 'border-primary-600 text-primary-600 dark:text-primary-400 dark:border-primary-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            ]"
          >
            <div class="flex items-center justify-center gap-1.5 sm:gap-2">
              <UsersIcon class="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Customers</span>
            </div>
          </button>
        </nav>
      </div>
    </Card>

    <!-- Receipts Tab Content -->
    <template v-if="activeTab === 'receipts'">

    <!-- Stats Cards - Mobile Optimized -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:hidden">
      <Card padding="sm" extra-class="border-l-4 border-l-blue-500 sm:p-4">
        <div class="flex items-center justify-between">
          <div class="flex-1 min-w-0">
            <p class="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 truncate">Total Receipts</p>
            <p class="mt-1.5 sm:mt-2 text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100 min-h-[2rem] sm:min-h-[2.5rem] leading-tight">
              <span v-if="receiptsStore.loading">-</span>
              <span v-else>{{ receipts.length }}</span>
            </p>
            <p class="mt-1 text-xs text-gray-500 dark:text-gray-500 truncate">All time</p>
          </div>
          <div class="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0 ml-2">
            <ReceiptPercentIcon class="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" />
          </div>
    </div>
      </Card>

      <Card padding="sm" extra-class="border-l-4 border-l-green-500 sm:p-4">
        <div class="flex items-center justify-between">
          <div class="flex-1 min-w-0">
            <p class="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 truncate">Total Sales</p>
            <p class="mt-1.5 sm:mt-2 text-lg sm:text-xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100 leading-tight">
              ${{ formatCurrency(totalSales) }}
            </p>
            <p class="mt-1 text-xs text-gray-500 dark:text-gray-500 truncate">All time revenue</p>
          </div>
          <div class="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0 ml-2">
            <CurrencyDollarIcon class="w-5 h-5 sm:w-6 sm:h-6 text-green-600 dark:text-green-400" />
          </div>
        </div>
      </Card>

      <Card padding="sm" extra-class="border-l-4 border-l-primary-500 sm:p-4">
        <div class="flex items-center justify-between">
          <div class="flex-1 min-w-0">
            <p class="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 truncate">Today's Sales</p>
            <p class="mt-1.5 sm:mt-2 text-lg sm:text-xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100 min-h-[2rem] sm:min-h-[2.5rem] leading-tight">
              <span v-if="receiptsStore.loading">-</span>
              <span v-else>${{ formatCurrency(todaySales) }}</span>
            </p>
            <p class="mt-1 text-xs text-gray-500 dark:text-gray-500 min-h-[1rem] truncate">
              <span v-if="receiptsStore.loading">-</span>
              <span v-else>{{ todayReceipts }} receipts</span>
            </p>
          </div>
          <div class="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0 ml-2">
            <CalendarIcon class="w-5 h-5 sm:w-6 sm:h-6 text-primary-600 dark:text-primary-400" />
          </div>
        </div>
      </Card>

      <Card padding="sm" extra-class="border-l-4 border-l-orange-500 sm:p-4">
        <div class="flex items-center justify-between">
          <div class="flex-1 min-w-0">
            <p class="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 truncate">This Month</p>
            <p class="mt-1.5 sm:mt-2 text-lg sm:text-xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100 min-h-[2rem] sm:min-h-[2.5rem] leading-tight">
              <span v-if="receiptsStore.loading">-</span>
              <span v-else>${{ formatCurrency(monthSales) }}</span>
            </p>
            <p class="mt-1 text-xs text-gray-500 dark:text-gray-500 min-h-[1rem] truncate">
              <span v-if="receiptsStore.loading">-</span>
              <span v-else>{{ monthReceipts }} receipts</span>
            </p>
          </div>
          <div class="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center flex-shrink-0 ml-2">
            <ChartBarIcon class="w-5 h-5 sm:w-6 sm:h-6 text-orange-600 dark:text-orange-400" />
          </div>
        </div>
      </Card>
    </div>

    <!-- Receipts Table -->
    <Card padding="none">
      <!-- Header with Stats and Filters -->
      <div v-if="!receiptsStore.loading" class="border-b border-gray-200 dark:border-gray-700">
        <!-- Stats - Mobile Optimized -->
        <div class="px-4 sm:px-6 py-3 sm:py-4 bg-gray-50 dark:bg-gray-800/50">
          <div class="flex items-center flex-wrap gap-3 sm:gap-4 lg:gap-6">
            <div class="flex items-center gap-1.5 sm:gap-2">
              <ReceiptPercentIcon class="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
              <span class="text-xs text-gray-600 dark:text-gray-400">Receipts:</span>
              <span class="text-sm font-semibold text-gray-900 dark:text-gray-100">
                <span v-if="receiptsStore.loading">-</span>
                <span v-else>{{ receiptsStore.totalReceipts }}</span>
              </span>
            </div>
            <div class="flex items-center gap-1.5 sm:gap-2">
              <CurrencyDollarIcon class="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
              <span class="text-xs text-gray-600 dark:text-gray-400">Sales:</span>
              <span class="text-sm font-semibold text-gray-900 dark:text-gray-100">${{ formatCurrency(totalSales) }}</span>
            </div>
            <div class="hidden sm:flex items-center gap-2">
              <CalendarIcon class="w-4 h-4 text-primary-600 dark:text-primary-400" />
              <span class="text-xs text-gray-600 dark:text-gray-400">Today:</span>
              <span class="text-sm font-semibold text-gray-900 dark:text-gray-100">
                <span v-if="receiptsStore.loading">-</span>
                <span v-else>${{ formatCurrency(todaySales) }}</span>
              </span>
            </div>
            <div class="hidden lg:flex items-center gap-2">
              <ChartBarIcon class="w-4 h-4 text-orange-600 dark:text-orange-400" />
              <span class="text-xs text-gray-600 dark:text-gray-400">Month:</span>
              <span class="text-sm font-semibold text-gray-900 dark:text-gray-100">
                <span v-if="receiptsStore.loading">-</span>
                <span v-else>${{ formatCurrency(monthSales) }}</span>
              </span>
            </div>
          </div>
        </div>
        <!-- Filters - Mobile Optimized with Card-like Design -->
        <div class="px-4 sm:px-6 py-3 sm:py-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 lg:bg-gray-50 lg:dark:bg-gray-800/50 lg:border-t-0">
          <div class="space-y-3 sm:space-y-0 sm:flex sm:flex-row sm:items-center sm:gap-3">
            <!-- Search Input -->
            <div class="relative flex-1 sm:flex-initial">
              <MagnifyingGlassIcon class="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 sm:w-4 sm:h-4 text-gray-400 dark:text-gray-500" />
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Search receipts..."
                class="w-full sm:w-48 pl-10 sm:pl-9 pr-3 py-2.5 sm:py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-xl sm:rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
              />
            </div>
            <!-- Filter Row -->
            <div class="flex items-center gap-2 sm:gap-3">
              <select
                v-model="statusFilter"
                class="flex-1 sm:flex-initial px-3 py-2.5 sm:py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-xl sm:rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 min-w-0 sm:min-w-[120px]"
              >
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="refunded">Refunded</option>
              </select>
              <select
                v-model="dateFilter"
                class="flex-1 sm:flex-initial px-3 py-2.5 sm:py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-xl sm:rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 min-w-0 sm:min-w-[120px]"
              >
                <option value="all">All Dates</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
              </select>
              <button
                @click="resetFilters"
                class="px-3 sm:px-2 py-2.5 sm:py-1.5 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 active:bg-gray-300 dark:active:bg-gray-500 rounded-xl sm:rounded-lg transition-colors flex items-center justify-center gap-1.5 sm:gap-0 flex-shrink-0 touch-manipulation sm:p-1.5"
                title="Reset filters"
              >
                <ArrowPathIcon class="w-4 h-4 flex-shrink-0" />
                <span class="sm:hidden">Reset</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      <div v-if="receiptsStore.loading" class="text-center py-12">
        <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">Loading receipts...</p>
      </div>
      <div v-else class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-gray-800/50">
            <tr>
              <th
                :class="[
                  'px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300',
                  isColumnSortable('receiptNumber') && 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700'
                ]"
                @click="isColumnSortable('receiptNumber') && toggleSort('receiptNumber')"
              >
                <div class="flex items-center gap-2">
                  Receipt #
                  <template v-if="isColumnSortable('receiptNumber')">
                    <ChevronUpIcon
                      v-if="currentSort.key === 'receiptNumber' && currentSort.order === 'asc'"
                      class="w-4 h-4 text-primary-600 dark:text-primary-400"
                    />
                    <ChevronDownIcon
                      v-else-if="currentSort.key === 'receiptNumber' && currentSort.order === 'desc'"
                      class="w-4 h-4 text-primary-600 dark:text-primary-400"
                    />
                    <BarsArrowUpIcon v-else class="w-4 h-4 text-gray-400 dark:text-gray-500 opacity-50" />
                  </template>
                </div>
              </th>
              <th
                :class="[
                  'px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300',
                  isColumnSortable('customerName') && 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700'
                ]"
                @click="isColumnSortable('customerName') && toggleSort('customerName')"
              >
                <div class="flex items-center gap-2">
                  Customer
                  <template v-if="isColumnSortable('customerName')">
                    <ChevronUpIcon
                      v-if="currentSort.key === 'customerName' && currentSort.order === 'asc'"
                      class="w-4 h-4 text-primary-600 dark:text-primary-400"
                    />
                    <ChevronDownIcon
                      v-else-if="currentSort.key === 'customerName' && currentSort.order === 'desc'"
                      class="w-4 h-4 text-primary-600 dark:text-primary-400"
                    />
                    <BarsArrowUpIcon v-else class="w-4 h-4 text-gray-400 dark:text-gray-500 opacity-50" />
                  </template>
                </div>
              </th>
              <th
                :class="[
                  'px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300',
                  isColumnSortable('date') && 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700'
                ]"
                @click="isColumnSortable('date') && toggleSort('date')"
              >
                <div class="flex items-center gap-2">
                  Date
                  <template v-if="isColumnSortable('date')">
                    <ChevronUpIcon
                      v-if="currentSort.key === 'date' && currentSort.order === 'asc'"
                      class="w-4 h-4 text-primary-600 dark:text-primary-400"
                    />
                    <ChevronDownIcon
                      v-else-if="currentSort.key === 'date' && currentSort.order === 'desc'"
                      class="w-4 h-4 text-primary-600 dark:text-primary-400"
                    />
                    <BarsArrowUpIcon v-else class="w-4 h-4 text-gray-400 dark:text-gray-500 opacity-50" />
                  </template>
                </div>
              </th>
              <th
                :class="[
                  'px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300',
                  isColumnSortable('itemsCount') && 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700'
                ]"
                @click="isColumnSortable('itemsCount') && toggleSort('itemsCount')"
              >
                <div class="flex items-center gap-2">
                  Items
                  <template v-if="isColumnSortable('itemsCount')">
                    <ChevronUpIcon
                      v-if="currentSort.key === 'itemsCount' && currentSort.order === 'asc'"
                      class="w-4 h-4 text-primary-600 dark:text-primary-400"
                    />
                    <ChevronDownIcon
                      v-else-if="currentSort.key === 'itemsCount' && currentSort.order === 'desc'"
                      class="w-4 h-4 text-primary-600 dark:text-primary-400"
                    />
                    <BarsArrowUpIcon v-else class="w-4 h-4 text-gray-400 dark:text-gray-500 opacity-50" />
                  </template>
                </div>
              </th>
              <th
                :class="[
                  'px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300',
                  isColumnSortable('total') && 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700'
                ]"
                @click="isColumnSortable('total') && toggleSort('total')"
              >
                <div class="flex items-center gap-2">
                  Total
                  <template v-if="isColumnSortable('total')">
                    <ChevronUpIcon
                      v-if="currentSort.key === 'total' && currentSort.order === 'asc'"
                      class="w-4 h-4 text-primary-600 dark:text-primary-400"
                    />
                    <ChevronDownIcon
                      v-else-if="currentSort.key === 'total' && currentSort.order === 'desc'"
                      class="w-4 h-4 text-primary-600 dark:text-primary-400"
                    />
                    <BarsArrowUpIcon v-else class="w-4 h-4 text-gray-400 dark:text-gray-500 opacity-50" />
                  </template>
                </div>
              </th>
              <th
                :class="[
                  'px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300',
                  isColumnSortable('paymentMethod') && 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700'
                ]"
                @click="isColumnSortable('paymentMethod') && toggleSort('paymentMethod')"
              >
                <div class="flex items-center gap-2">
                  Payment
                  <template v-if="isColumnSortable('paymentMethod')">
                    <ChevronUpIcon
                      v-if="currentSort.key === 'paymentMethod' && currentSort.order === 'asc'"
                      class="w-4 h-4 text-primary-600 dark:text-primary-400"
                    />
                    <ChevronDownIcon
                      v-else-if="currentSort.key === 'paymentMethod' && currentSort.order === 'desc'"
                      class="w-4 h-4 text-primary-600 dark:text-primary-400"
                    />
                    <BarsArrowUpIcon v-else class="w-4 h-4 text-gray-400 dark:text-gray-500 opacity-50" />
                  </template>
                </div>
              </th>
              <th
                :class="[
                  'px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300',
                  isColumnSortable('status') && 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700'
                ]"
                @click="isColumnSortable('status') && toggleSort('status')"
              >
                <div class="flex items-center gap-2">
                  Status
                  <template v-if="isColumnSortable('status')">
                    <ChevronUpIcon
                      v-if="currentSort.key === 'status' && currentSort.order === 'asc'"
                      class="w-4 h-4 text-primary-600 dark:text-primary-400"
                    />
                    <ChevronDownIcon
                      v-else-if="currentSort.key === 'status' && currentSort.order === 'desc'"
                      class="w-4 h-4 text-primary-600 dark:text-primary-400"
                    />
                    <BarsArrowUpIcon v-else class="w-4 h-4 text-gray-400 dark:text-gray-500 opacity-50" />
                  </template>
                </div>
              </th>
              <th
                :class="[
                  'px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300',
                  isColumnSortable('createdBy') && 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700'
                ]"
                @click="isColumnSortable('createdBy') && toggleSort('createdBy')"
              >
                <div class="flex items-center gap-2">
                  Created By
                  <template v-if="isColumnSortable('createdBy')">
                    <ChevronUpIcon
                      v-if="currentSort.key === 'createdBy' && currentSort.order === 'asc'"
                      class="w-4 h-4 text-primary-600 dark:text-primary-400"
                    />
                    <ChevronDownIcon
                      v-else-if="currentSort.key === 'createdBy' && currentSort.order === 'desc'"
                      class="w-4 h-4 text-primary-600 dark:text-primary-400"
                    />
                    <BarsArrowUpIcon v-else class="w-4 h-4 text-gray-400 dark:text-gray-500 opacity-50" />
                  </template>
                </div>
              </th>
              <th class="px-3 sm:px-3 py-2 text-right text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 min-w-[160px]">
                Actions
              </th>
            </tr>
          </thead>
          <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            <tr
              v-for="receipt in paginatedReceipts"
              :key="receipt.id"
              class="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <td class="px-3 py-2 whitespace-nowrap">
                <div class="flex items-center gap-2">
                  <div class="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {{ receipt.receiptNumber }}
                  </div>
                  <span
                    v-if="receipt.isSwapIn"
                    class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                    title="Swap-in transaction"
                  >
                    Swap
                  </span>
                </div>
              </td>
              <td class="px-3 py-2 whitespace-nowrap">
                <div class="text-sm text-gray-900 dark:text-gray-100">
                  {{ receipt.customerName }}
                </div>
                <div class="text-xs text-gray-500 dark:text-gray-400">
                  {{ receipt.customerEmail }}
                </div>
              </td>
              <td class="px-3 py-2 whitespace-nowrap">
                <div class="text-sm text-gray-900 dark:text-gray-100">
                  {{ formatDate(receipt.date) }}
                </div>
                <div class="text-xs text-gray-500 dark:text-gray-400">
                  {{ formatTime(receipt.date) }}
                </div>
              </td>
              <td class="px-3 py-2">
                <div class="text-sm text-gray-900 dark:text-gray-100">
                  <div v-if="receipt.items && receipt.items.length > 0" class="space-y-1">
                    <div 
                      v-for="(item, idx) in receipt.items.slice(0, 3)" 
                      :key="idx"
                      class="text-sm"
                    >
                      {{ item.itemName }}<span v-if="item.quantity > 1" class="text-gray-500 dark:text-gray-400"> × {{ item.quantity }}</span>
                    </div>
                    <div v-if="receipt.items.length > 3" class="text-xs text-gray-500 dark:text-gray-400 italic">
                      and {{ receipt.items.length - 3 }} more item{{ receipt.items.length - 3 > 1 ? 's' : '' }}
                    </div>
                  </div>
                  <span v-else class="text-gray-500 dark:text-gray-400">
                  {{ receipt.itemsCount }} items
                </span>
                </div>
              </td>
              <td class="px-3 py-2 whitespace-nowrap">
                <span class="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  ${{ formatCurrency(receipt.total) }}
                </span>
              </td>
              <td class="px-3 py-2 whitespace-nowrap">
                <span class="text-sm text-gray-600 dark:text-gray-300">
                  {{ receipt.paymentMethod }}
                </span>
              </td>
              <td class="px-3 py-2 whitespace-nowrap">
                <span
                  :class="[
                    'inline-flex items-center px-3 py-1 rounded-full text-xs font-medium',
                    receipt.status === 'completed'
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                      : receipt.status === 'pending'
                      ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
                      : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                  ]"
                >
                  {{ receipt.status.charAt(0).toUpperCase() + receipt.status.slice(1) }}
                </span>
              </td>
              <td class="px-3 py-2 whitespace-nowrap">
                <div class="text-sm text-gray-900 dark:text-gray-100">
                  {{ receipt.createdByUserName || getCreatorName(receipt.actualCreator || receipt.createdBy) }}
                </div>
              </td>
              <td class="px-3 py-2 whitespace-nowrap text-right min-w-[160px]">
                <div class="flex items-center justify-end gap-1.5 sm:gap-2 flex-shrink-0">
                  <button
                    @click="handlePrintReceipt(receipt)"
                    class="flex-shrink-0 p-2 sm:p-1.5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 active:bg-gray-200 dark:active:bg-gray-600 rounded-lg transition-colors touch-manipulation"
                    title="View/Print"
                  >
                    <PrinterIcon class="w-5 h-5 flex-shrink-0" />
                  </button>
                  <button
                    v-if="receipt.status === 'completed' && canManage"
                    @click="handleRefundReceipt(receipt)"
                    class="flex-shrink-0 p-2 sm:p-1.5 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 active:bg-orange-100 dark:active:bg-orange-900/30 rounded-lg transition-colors touch-manipulation"
                    title="Refund"
                  >
                    <ArrowPathIcon class="w-5 h-5 flex-shrink-0" />
                  </button>
                  <button
                    v-if="canManage"
                    @click="handleDeleteReceipt(receipt)"
                    class="flex-shrink-0 p-2 sm:p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 active:bg-red-100 dark:active:bg-red-900/30 rounded-lg transition-colors touch-manipulation"
                    title="Delete"
                  >
                    <TrashIcon class="w-5 h-5 flex-shrink-0" />
                  </button>
                </div>
              </td>
            </tr>
            <!-- Empty State - Mobile Optimized -->
            <tr v-if="sortedFilteredReceipts.length === 0" class="bg-white dark:bg-gray-800">
              <td colspan="9" class="px-4 sm:px-6 py-8 sm:py-12">
                <div class="text-center">
                  <div class="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mx-auto mb-3 sm:mb-4">
                    <ReceiptPercentIcon class="w-7 h-7 sm:w-8 sm:h-8 text-gray-400 dark:text-gray-500" />
                  </div>
                  <h3 class="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    {{ searchQuery || statusFilter !== 'all' || dateFilter !== 'all' ? 'No receipts found' : 'No receipts yet' }}
                  </h3>
                  <p class="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-5 sm:mb-6 px-4">
                    {{ searchQuery || statusFilter !== 'all' || dateFilter !== 'all' ? 'Try adjusting your filters' : 'Create your first receipt to get started' }}
                  </p>
                  <Button
                    v-if="!searchQuery && statusFilter === 'all' && dateFilter === 'all'"
                    variant="primary"
                    :icon="PlusIcon"
                    @click="openCreateReceiptModal"
                    class="w-full sm:w-auto"
                  >
                    Create First Receipt
                  </Button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </Card>

    <!-- Fixed Pagination - Mobile Optimized -->
    <div
      v-if="sortedFilteredReceipts.length > 0"
      class="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg z-30 transition-all duration-300 safe-area-inset-bottom"
      :class="sidebarCollapsed ? 'lg:left-20' : 'lg:left-72'"
    >
      <div class="px-4 sm:px-6">
        <Pagination
          :current-page="currentPage"
          :items-per-page="itemsPerPage"
          :total="sortedFilteredReceipts.length"
          @page-change="handlePageChange"
        />
      </div>
    </div>

    <!-- Floating Action Button - Mobile Optimized -->
    <button
      v-if="!isInitialLoading && sortedFilteredReceipts.length > 0 && canCreate"
      @click="openCreateReceiptModal"
      class="fixed bottom-20 sm:bottom-24 right-4 sm:right-6 w-14 h-14 sm:w-11 sm:h-11 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-full shadow-xl hover:shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 z-40 touch-manipulation"
      title="Create new receipt"
    >
      <PlusIcon class="w-6 h-6 sm:w-5 sm:h-5" />
    </button>

      <!-- Create Receipt Modal -->
      <CreateReceiptModal
        v-model="showCreateReceiptModal"
        @receipt-created="handleReceiptCreated"
      />

      <!-- View Receipt Modal -->
      <ViewReceiptModal
        v-model="showViewReceiptModal"
        :receipt="selectedReceipt"
      />

      <!-- Return Receipt Modal -->
      <ReturnReceiptModal
        v-model="showReturnReceiptModal"
        :receipt="selectedReceipt"
        @returned="handleReceiptReturned"
      />

      <!-- Delete Receipt Modal -->
      <DeleteReceiptModal
        v-model="showDeleteReceiptModal"
        :receipt="selectedReceipt"
        @deleted="handleReceiptDeleted"
      />
    </template>

    <!-- Customers Tab Content -->
    <template v-if="activeTab === 'customers'">
      <!-- Customers Table -->
      <Card padding="none">
        <!-- Header with Stats and Filters -->
        <div v-if="!receiptsStore.loading" class="border-b border-gray-200 dark:border-gray-700">
          <!-- Stats - Mobile Optimized -->
          <div class="px-4 sm:px-6 py-3 sm:py-4 bg-gray-50 dark:bg-gray-800/50">
            <div class="flex items-center flex-wrap gap-3 sm:gap-4 lg:gap-6">
              <div class="flex items-center gap-1.5 sm:gap-2">
                <UsersIcon class="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                <span class="text-xs text-gray-600 dark:text-gray-400">Customers:</span>
                <span class="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {{ uniqueCustomers.length }}
                </span>
              </div>
              <div class="flex items-center gap-1.5 sm:gap-2">
                <CurrencyDollarIcon class="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                <span class="text-xs text-gray-600 dark:text-gray-400">Revenue:</span>
                <span class="text-sm font-semibold text-gray-900 dark:text-gray-100">${{ formatCurrency(customersTotalRevenue) }}</span>
              </div>
              <div class="hidden sm:flex items-center gap-2">
                <ChartBarIcon class="w-4 h-4 text-primary-600 dark:text-primary-400" />
                <span class="text-xs text-gray-600 dark:text-gray-400">Avg. Order:</span>
                <span class="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  ${{ formatCurrency(customersAverageOrderValue) }}
                </span>
              </div>
            </div>
          </div>
          <!-- Filters - Mobile Optimized with Card-like Design -->
          <div class="px-4 sm:px-6 py-3 sm:py-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 lg:bg-gray-50 lg:dark:bg-gray-800/50 lg:border-t-0">
            <div class="space-y-3 sm:space-y-0 sm:flex sm:flex-row sm:items-center sm:gap-3">
              <!-- Search Input -->
              <div class="relative flex-1 sm:flex-initial">
                <MagnifyingGlassIcon class="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 sm:w-4 sm:h-4 text-gray-400 dark:text-gray-500" />
                <input
                  v-model="customersSearchQuery"
                  type="text"
                  placeholder="Search customers..."
                  class="w-full sm:w-48 pl-10 sm:pl-9 pr-3 py-2.5 sm:py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-xl sm:rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                />
              </div>
              <!-- Sort Select -->
              <select
                v-model="customersSortBy"
                class="flex-1 sm:flex-initial px-3 py-2.5 sm:py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-xl sm:rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 min-w-0 sm:min-w-[160px]"
              >
                <option value="name">Sort by Name</option>
                <option value="orders">Sort by Orders</option>
                <option value="spent">Sort by Total Spent</option>
                <option value="lastOrder">Sort by Last Order</option>
              </select>
            </div>
          </div>
        </div>
        <div v-if="receiptsStore.loading" class="text-center py-12">
          <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">Loading customers...</p>
        </div>
        <div v-else class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead class="bg-gray-50 dark:bg-gray-800/50">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 w-12"></th>
                <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">Customer</th>
                <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">Contact</th>
                <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">Orders</th>
                <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">Total Spent</th>
                <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">Last Order</th>
                <th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              <template v-for="customer in paginatedCustomers" :key="customer.id">
                <tr class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <td class="px-4 py-3">
                    <button
                      @click="toggleCustomerExpanded(customer.id)"
                      class="p-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      <ChevronRightIcon
                        :class="['w-5 h-5 transition-transform', expandedCustomers[customer.id] ? 'rotate-90' : '']"
                      />
                    </button>
                  </td>
                  <td class="px-4 py-3">
                    <div class="flex items-center gap-3">
                      <div class="w-10 h-10 rounded-full bg-gradient-to-r from-primary-500 to-primary-600 flex items-center justify-center text-white font-semibold">
                        {{ customer.name.charAt(0).toUpperCase() }}
                      </div>
                      <div>
                        <p class="text-sm font-semibold text-gray-900 dark:text-gray-100">{{ customer.name }}</p>
                        <p class="text-xs text-gray-500 dark:text-gray-400">{{ customer.receipts.length }} receipt{{ customer.receipts.length !== 1 ? 's' : '' }}</p>
                      </div>
                    </div>
                  </td>
                  <td class="px-4 py-3">
                    <div class="space-y-1">
                      <p v-if="customer.email" class="text-sm text-gray-900 dark:text-gray-100">{{ customer.email }}</p>
                      <p v-if="customer.phone" class="text-sm text-gray-600 dark:text-gray-400">{{ customer.phone }}</p>
                      <p v-if="!customer.email && !customer.phone" class="text-xs text-gray-400 dark:text-gray-500 italic">No contact info</p>
                    </div>
                  </td>
                  <td class="px-4 py-3">
                    <span class="text-sm font-medium text-gray-900 dark:text-gray-100">{{ customer.receipts.length }}</span>
                  </td>
                  <td class="px-4 py-3">
                    <span class="text-sm font-semibold text-gray-900 dark:text-gray-100">${{ formatCurrency(customer.totalSpent) }}</span>
                  </td>
                  <td class="px-4 py-3">
                    <span class="text-sm text-gray-600 dark:text-gray-400">{{ formatDate(customer.lastOrderDate) }}</span>
                  </td>
                  <td class="px-4 py-3 text-right">
                    <button
                      @click="viewCustomerReceipts(customer)"
                      class="px-3 sm:px-3 py-2 sm:py-1.5 text-xs font-medium text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 active:bg-primary-100 dark:active:bg-primary-900/30 rounded-lg transition-colors touch-manipulation"
                    >
                      View Receipts
                    </button>
                  </td>
                </tr>
                <!-- Expanded Row: Purchased Items -->
                <tr v-if="expandedCustomers[customer.id]" class="bg-gray-50 dark:bg-gray-900/50">
                  <td colspan="7" class="px-4 py-4">
                    <div class="space-y-4">
                      <h4 class="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Purchased Items</h4>
                      <div class="space-y-3">
                        <div
                          v-for="receipt in getCustomerReceipts(customer.id)"
                          :key="receipt.id"
                          class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4"
                        >
                          <div class="flex items-center justify-between mb-3">
                            <div>
                              <p class="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                Receipt #{{ receipt.receiptNumber }}
                              </p>
                              <p class="text-xs text-gray-500 dark:text-gray-400">
                                {{ formatDate(receipt.date) }} • {{ formatTime(receipt.date) }}
                              </p>
                            </div>
                            <div class="text-right">
                              <p class="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                ${{ formatCurrency(receipt.total) }}
                              </p>
                              <span
                                :class="[
                                  'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                                  receipt.status === 'completed'
                                    ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                                    : receipt.status === 'pending'
                                    ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
                                    : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                                ]"
                              >
                                {{ receipt.status.charAt(0).toUpperCase() + receipt.status.slice(1) }}
                              </span>
                            </div>
                          </div>
                          <div class="space-y-2">
                            <div
                              v-for="(item, index) in receipt.items"
                              :key="index"
                              class="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0"
                            >
                              <div class="flex-1">
                                <p class="text-sm text-gray-900 dark:text-gray-100">{{ item.itemName }}</p>
                                <p class="text-xs text-gray-500 dark:text-gray-400">
                                  Quantity: {{ item.quantity }} • Price: ${{ formatCurrency(item.price) }}
                                  <span v-if="item.hasDiscount" class="text-green-600 dark:text-green-400">
                                    ({{ item.discountPercentage }}% off)
                                  </span>
                                </p>
                              </div>
                              <div class="text-right">
                                <p class="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                  ${{ formatCurrency(item.price * item.quantity) }}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              </template>
              <!-- Empty State - Mobile Optimized -->
              <tr v-if="filteredCustomers.length === 0" class="bg-white dark:bg-gray-800">
                <td colspan="7" class="px-4 sm:px-6 py-8 sm:py-12">
                  <div class="text-center">
                    <div class="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mx-auto mb-3 sm:mb-4">
                      <UsersIcon class="w-7 h-7 sm:w-8 sm:h-8 text-gray-400 dark:text-gray-500" />
                    </div>
                    <h3 class="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                      {{ customersSearchQuery ? 'No customers found' : 'No customers yet' }}
                    </h3>
                    <p class="text-xs sm:text-sm text-gray-500 dark:text-gray-400 px-4">
                      {{ customersSearchQuery ? 'Try adjusting your search' : 'Customers will appear here once receipts are created' }}
                    </p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      <!-- Pagination - Mobile Optimized -->
      <div
        v-if="filteredCustomers.length > 0"
        class="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg z-30 transition-all duration-300 safe-area-inset-bottom"
        :class="sidebarCollapsed ? 'lg:left-20' : 'lg:left-72'"
      >
        <div class="px-4 sm:px-6">
          <Pagination
            :current-page="customersCurrentPage"
            :items-per-page="customersItemsPerPage"
            :total="filteredCustomers.length"
            @page-change="handleCustomersPageChange"
          />
        </div>
      </div>
    </template>

    </template>
    </div>
    <template #fallback>
      <div class="space-y-6 pb-24 min-h-screen w-full">
        <Card padding="none">
          <div class="p-12 text-center">
            <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">Loading receipts...</p>
          </div>
        </Card>
  </div>
    </template>
  </ClientOnly>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import {
  PlusIcon,
  ReceiptPercentIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  ChartBarIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  PrinterIcon,
  UsersIcon,
  UserCircleIcon,
  ClockIcon,
  CheckCircleIcon,
  XMarkIcon,
  PencilSquareIcon,
  TrashIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  BarsArrowUpIcon,
} from '@heroicons/vue/24/outline'
import Card from '~/components/ui/Card.vue'
import Button from '~/components/ui/Button.vue'
import Pagination from '~/components/ui/Pagination.vue'
// @ts-ignore
import CreateReceiptModal from '~/components/receipts/CreateReceiptModal.vue'
// @ts-ignore
import ViewReceiptModal from '~/components/receipts/ViewReceiptModal.vue'
// @ts-ignore
import ReturnReceiptModal from '~/components/receipts/ReturnReceiptModal.vue'
// @ts-ignore
import DeleteReceiptModal from '~/components/receipts/DeleteReceiptModal.vue'
import { useReceiptsStore, type Receipt } from '~/stores/receipts'
import { useAuthStore } from '~/stores/auth'
import { useStoresStore } from '~/stores/stores'
import { usePermissions } from '~/composables/usePermissions'
import { useUser } from '~/composables/useUser'
import { useFirestore } from '~/composables/useFirestore'
import { useStaffStore } from '~/stores/staff'
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore'

definePageMeta({
  layout: 'dashboard',
  ssr: false
})

useHead({
  title: 'Receipts - Storv',
})

const receiptsStore = useReceiptsStore()
const storesStore = useStoresStore()
const authStore = useAuthStore()
const { canManage, canCreate } = usePermissions()
const { getUserDocument } = useUser()
const { getFirestoreInstance } = useFirestore()
const staffStore = useStaffStore()

// Store creator names by UID
const creatorNames = ref<Record<string, string>>({})
const loadingCreators = ref(false)

// Tab management
const route = useRoute()
const router = useRouter()
const activeTab = ref<'receipts' | 'customers'>((route.query.tab as any) || 'receipts')

// Watch for tab changes and update URL
watch(activeTab, (newTab) => {
  router.replace({ query: { ...route.query, tab: newTab } })
})

// Initialize loading state synchronously on client
const isInitialLoading = ref(true)
const searchQuery = ref('')
const statusFilter = ref('all')
const dateFilter = ref('all')
// Load pagination state from localStorage
const getInitialPage = (): number => {
  if (import.meta.client) {
    try {
      const saved = localStorage.getItem('receipts-page')
      return saved ? parseInt(saved, 10) : 1
    } catch (e) {
      return 1
    }
  }
  return 1
}
const currentPage = ref(getInitialPage())
const itemsPerPage = ref(20)
const sidebarCollapsed = ref(false)

// Sorting state
const currentSort = ref<{ key: string; order: 'asc' | 'desc' }>({ key: 'date', order: 'desc' })

// Define sortable columns
const sortableColumns = [
  { key: 'receiptNumber', label: 'Receipt #' },
  { key: 'customerName', label: 'Customer' },
  { key: 'date', label: 'Date' },
  { key: 'itemsCount', label: 'Items' },
  { key: 'total', label: 'Total' },
  { key: 'paymentMethod', label: 'Payment' },
  { key: 'status', label: 'Status' },
  { key: 'createdBy', label: 'Created By' },
]

// Customers tab state
const customersSearchQuery = ref('')
const customersSortBy = ref('name')
const expandedCustomers = ref<Record<string, boolean>>({})
const getCustomersInitialPage = (): number => {
  if (import.meta.client) {
    try {
      const saved = localStorage.getItem('receipts-customers-page')
      return saved ? parseInt(saved, 10) : 1
    } catch (e) {
      return 1
    }
  }
  return 1
}
const customersCurrentPage = ref(getCustomersInitialPage())
const customersItemsPerPage = ref(20)

// Customer interface for display
interface CustomerDisplay {
  id: string
  name: string
  email?: string
  phone?: string
  address?: string
  receipts: string[]
  totalSpent: number
  lastOrderDate: Date
  firstOrderDate: Date
}

// Extract unique customers from receipts based on email or phone
const uniqueCustomers = computed(() => {
  const customerMap = new Map<string, CustomerDisplay>()
  
  receiptsStore.receipts.forEach(receipt => {
    // Use email or phone as the key to identify unique customers
    const receiptWithPhone = receipt as Receipt & { customerPhone?: string; customerAddress?: string }
    const key = (receipt.customerEmail?.toLowerCase().trim() || receiptWithPhone.customerPhone?.trim() || receipt.customerName.toLowerCase().trim()) || ''
    
    if (!key) return // Skip receipts without any identifier
    
    if (customerMap.has(key)) {
      // Update existing customer
      const existing = customerMap.get(key)!
      existing.receipts.push(receipt.id)
      existing.totalSpent += receipt.total
      const receiptDate = receipt.date?.toDate ? receipt.date.toDate() : new Date(receipt.date)
      if (receiptDate > existing.lastOrderDate) {
        existing.lastOrderDate = receiptDate
      }
      if (receiptDate < existing.firstOrderDate) {
        existing.firstOrderDate = receiptDate
      }
      // Update contact info if available
      if (receipt.customerEmail && !existing.email) {
        existing.email = receipt.customerEmail
      }
      if (receiptWithPhone.customerPhone && !existing.phone) {
        existing.phone = receiptWithPhone.customerPhone
      }
      if (receiptWithPhone.customerAddress && !existing.address) {
        existing.address = receiptWithPhone.customerAddress
      }
    } else {
      // Create new customer
      const receiptDate = receipt.date?.toDate ? receipt.date.toDate() : new Date(receipt.date)
      customerMap.set(key, {
        id: key,
        name: receipt.customerName,
        email: receipt.customerEmail,
        phone: receiptWithPhone.customerPhone,
        address: receiptWithPhone.customerAddress,
        receipts: [receipt.id],
        totalSpent: receipt.total,
        lastOrderDate: receiptDate,
        firstOrderDate: receiptDate,
      })
    }
  })
  
  return Array.from(customerMap.values())
})

// Filter customers
const filteredCustomers = computed(() => {
  let result = [...uniqueCustomers.value]
  
  // Search filter
  if (customersSearchQuery.value) {
    const query = customersSearchQuery.value.toLowerCase()
    result = result.filter(customer =>
      customer.name.toLowerCase().includes(query) ||
      customer.email?.toLowerCase().includes(query) ||
      customer.phone?.toLowerCase().includes(query)
    )
  }
  
  // Sort
  result.sort((a, b) => {
    switch (customersSortBy.value) {
      case 'name':
        return a.name.localeCompare(b.name)
      case 'orders':
        return b.receipts.length - a.receipts.length
      case 'spent':
        return b.totalSpent - a.totalSpent
      case 'lastOrder':
        return b.lastOrderDate.getTime() - a.lastOrderDate.getTime()
      default:
        return 0
    }
  })
  
  return result
})

// Paginated customers
const paginatedCustomers = computed(() => {
  const start = (customersCurrentPage.value - 1) * customersItemsPerPage.value
  const end = start + customersItemsPerPage.value
  return filteredCustomers.value.slice(start, end)
})

// Customer statistics
const customersTotalRevenue = computed(() => {
  return uniqueCustomers.value.reduce((sum, c) => sum + c.totalSpent, 0)
})

const customersAverageOrderValue = computed(() => {
  const totalOrders = uniqueCustomers.value.reduce((sum, c) => sum + c.receipts.length, 0)
  return totalOrders > 0 ? customersTotalRevenue.value / totalOrders : 0
})

// Get receipts for a customer
const getCustomerReceipts = (customerId: string) => {
  const customer = uniqueCustomers.value.find(c => c.id === customerId)
  if (!customer) return []
  
  return receiptsStore.receipts
    .filter(r => customer.receipts.includes(r.id))
    .sort((a, b) => {
      const dateA = a.date?.toDate ? a.date.toDate() : new Date(a.date)
      const dateB = b.date?.toDate ? b.date.toDate() : new Date(b.date)
      return dateB.getTime() - dateA.getTime()
    })
}

// Toggle customer expanded state
const toggleCustomerExpanded = (customerId: string) => {
  expandedCustomers.value[customerId] = !expandedCustomers.value[customerId]
}

// View customer receipts (filter receipts tab)
const viewCustomerReceipts = (customer: CustomerDisplay) => {
  activeTab.value = 'receipts'
  // Set search query to customer name or email
  searchQuery.value = customer.email || customer.name
  // Trigger search
  setTimeout(() => {
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, 100)
}

// Handle customers page change
const handleCustomersPageChange = (page: number) => {
  customersCurrentPage.value = page
  if (import.meta.client) {
    try {
      localStorage.setItem('receipts-customers-page', page.toString())
    } catch (e) {
      // Ignore localStorage errors
    }
  }
  window.scrollTo({ top: 0, behavior: 'smooth' })
}


// Load sidebar state from localStorage
if (import.meta.client) {
  try {
    const savedState = localStorage.getItem('sidebarCollapsed')
    if (savedState !== null) {
      sidebarCollapsed.value = savedState === 'true'
    }
  } catch (e) {
    // Ignore localStorage errors
  }
}

// Watch for sidebar state changes
if (import.meta.client) {
  window.addEventListener('storage', (e) => {
    if (e.key === 'sidebarCollapsed' && e.newValue !== null) {
      sidebarCollapsed.value = e.newValue === 'true'
    }
  })
  // Also check periodically for changes (since storage event doesn't fire on same window)
  setInterval(() => {
    try {
      const savedState = localStorage.getItem('sidebarCollapsed')
      if (savedState !== null) {
        const newValue = savedState === 'true'
        if (newValue !== sidebarCollapsed.value) {
          sidebarCollapsed.value = newValue
        }
      }
    } catch (e) {
      // Ignore
    }
  }, 100)
}

// Filter receipts by current store for all computed properties
const currentStoreId = computed(() => storesStore.currentStoreId)

// Filter receipts by current store
const receipts = computed(() => {
  const storeId = currentStoreId.value
  if (!storeId) return []
  return receiptsStore.receipts.filter(receipt => receipt.storeId === storeId)
})

const totalSales = computed(() => {
  const storeId = currentStoreId.value
  if (!storeId) return 0
  return receipts.value
    .filter(r => r.status === 'completed')
    .reduce((sum, r) => sum + r.total, 0)
})

const todaySales = computed(() => {
  const today = new Date().toDateString()
  const storeId = currentStoreId.value
  if (!storeId) return 0
  return receipts.value
    .filter(r => r.status === 'completed' && new Date(r.date).toDateString() === today)
    .reduce((sum, r) => sum + r.total, 0)
})

const todayReceipts = computed(() => {
  const today = new Date().toDateString()
  return receipts.value.filter(r => new Date(r.date).toDateString() === today).length
})

const monthSales = computed(() => {
  const now = new Date()
  return receipts.value
    .filter(r => {
      const receiptDate = new Date(r.date)
      return r.status === 'completed' &&
        receiptDate.getMonth() === now.getMonth() &&
        receiptDate.getFullYear() === now.getFullYear()
    })
    .reduce((sum, r) => sum + r.total, 0)
})

const monthReceipts = computed(() => {
  const now = new Date()
  return receipts.value.filter(r => {
    const receiptDate = new Date(r.date)
    return receiptDate.getMonth() === now.getMonth() &&
      receiptDate.getFullYear() === now.getFullYear()
  }).length
})

const filteredReceipts = computed(() => {
  let result = [...receipts.value]

  // Search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(r =>
      r.receiptNumber.toLowerCase().includes(query) ||
      r.customerName.toLowerCase().includes(query) ||
      r.customerEmail.toLowerCase().includes(query)
    )
  }

  // Status filter
  if (statusFilter.value !== 'all') {
    result = result.filter(r => r.status === statusFilter.value)
  }

  // Date filter
  if (dateFilter.value !== 'all') {
    const now = new Date()
    result = result.filter(r => {
      const receiptDate = new Date(r.date)
      switch (dateFilter.value) {
        case 'today':
          return receiptDate.toDateString() === now.toDateString()
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          return receiptDate >= weekAgo
        case 'month':
          return receiptDate.getMonth() === now.getMonth() &&
            receiptDate.getFullYear() === now.getFullYear()
        default:
          return true
      }
    })
  }

  return result
})

const sortedFilteredReceipts = computed(() => {
  const result = [...filteredReceipts.value]
  
  result.sort((a, b) => {
    let aValue: any
    let bValue: any
    
    switch (currentSort.value.key) {
      case 'receiptNumber':
        aValue = a.receiptNumber
        bValue = b.receiptNumber
        break
      case 'customerName':
        aValue = a.customerName
        bValue = b.customerName
        break
      case 'date':
        aValue = new Date(a.date).getTime()
        bValue = new Date(b.date).getTime()
        break
      case 'itemsCount':
        aValue = a.itemsCount
        bValue = b.itemsCount
        break
      case 'total':
        aValue = a.total
        bValue = b.total
        break
      case 'paymentMethod':
        aValue = a.paymentMethod
        bValue = b.paymentMethod
        break
      case 'status':
        // Custom sort order for status
        const statusOrder = ['completed', 'pending', 'refunded']
        aValue = statusOrder.indexOf(a.status)
        bValue = statusOrder.indexOf(b.status)
        break
      case 'createdBy':
        aValue = a.createdByUserName || getCreatorName(a.actualCreator || a.createdBy)
        bValue = b.createdByUserName || getCreatorName(b.actualCreator || b.createdBy)
        break
      default:
        return 0
    }
    
    // Handle undefined/null values
    if (aValue === undefined || aValue === null) return 1
    if (bValue === undefined || bValue === null) return -1
    
    // String comparison
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return currentSort.value.order === 'asc'
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue)
    }
    
    // Numeric comparison
    const aNum = typeof aValue === 'number' ? aValue : parseFloat(aValue) || 0
    const bNum = typeof bValue === 'number' ? bValue : parseFloat(bValue) || 0
    
    return currentSort.value.order === 'asc'
      ? aNum - bNum
      : bNum - aNum
  })
  
  return result
})

const paginatedReceipts = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return sortedFilteredReceipts.value.slice(start, end)
})

const toggleSort = (key: string) => {
  if (currentSort.value.key === key) {
    currentSort.value.order = currentSort.value.order === 'asc' ? 'desc' : 'asc'
  } else {
    currentSort.value.key = key
    currentSort.value.order = 'asc'
  }
}

const isColumnSortable = (key: string) => {
  return sortableColumns.some(col => col.key === key)
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

const formatDate = (date: string | Date) => {
  const dateObj = date instanceof Date ? date : new Date(date)
  return dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

const formatTime = (date: string | Date) => {
  const dateObj = date instanceof Date ? date : new Date(date)
  return dateObj.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

const resetFilters = () => {
  searchQuery.value = ''
  statusFilter.value = 'all'
  dateFilter.value = 'all'
  currentPage.value = 1
  // Clear pagination from localStorage when filters are reset
  if (import.meta.client) {
    try {
      localStorage.setItem('receipts-page', '1')
    } catch (e) {
      // Ignore localStorage errors
    }
  }
}

const handlePageChange = (page: number) => {
  currentPage.value = page
  // Save to localStorage
  if (import.meta.client) {
    try {
      localStorage.setItem('receipts-page', page.toString())
    } catch (e) {
      // Ignore localStorage errors
    }
  }
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// Watch for page changes to persist
watch(currentPage, (newPage) => {
  if (import.meta.client && activeTab.value === 'receipts') {
    try {
      localStorage.setItem('receipts-page', newPage.toString())
    } catch (e) {
      // Ignore localStorage errors
    }
  }
})

// Watch for customers tab page changes
watch(customersCurrentPage, (newPage) => {
  if (import.meta.client && activeTab.value === 'customers') {
    try {
      localStorage.setItem('receipts-customers-page', newPage.toString())
    } catch (e) {
      // Ignore localStorage errors
    }
  }
})


const showCreateReceiptModal = ref(false)

const openCreateReceiptModal = () => {
  showCreateReceiptModal.value = true
}

const handleReceiptCreated = async (receipt: Receipt) => {
  // Receipt is already added to store by the modal, but we need to refresh to ensure it appears
  showCreateReceiptModal.value = false
  // Refresh receipts list to ensure staff-created receipts appear
  await receiptsStore.fetchReceipts()
  // Reload creator names after receipts are refreshed
  await loadCreatorNames()
}

const selectedReceipt = ref<Receipt | null>(null)
const showViewReceiptModal = ref(false)
const showReturnReceiptModal = ref(false)
const showDeleteReceiptModal = ref(false)


const handlePrintReceipt = (receipt: Receipt) => {
  selectedReceipt.value = receipt
  showViewReceiptModal.value = true
  // Small delay to allow modal to open, then trigger print
  setTimeout(() => {
    const printBtn = document.querySelector('[data-print-pdf]') as HTMLButtonElement
    if (printBtn) {
      printBtn.click()
    }
  }, 300)
}

const handleRefundReceipt = (receipt: Receipt) => {
  selectedReceipt.value = receipt
  showReturnReceiptModal.value = true
}

const handleReceiptReturned = async (receipt: Receipt) => {
  showReturnReceiptModal.value = false
  selectedReceipt.value = null
  // Refresh receipts list
  await receiptsStore.fetchReceipts()
}

const handleDeleteReceipt = (receipt: Receipt) => {
  selectedReceipt.value = receipt
  showDeleteReceiptModal.value = true
}

const handleReceiptDeleted = async (receipt: Receipt) => {
  showDeleteReceiptModal.value = false
  selectedReceipt.value = null
  // Refresh receipts list
  await receiptsStore.fetchReceipts()
  // Reload creator names
  await loadCreatorNames()
}

// Function to fetch creator name for a given UID
const getCreatorName = (uid: string): string => {
  if (!uid) return 'Unknown'
  return creatorNames.value[uid] || 'Loading...'
}

// Load creator names for all unique creator UIDs in receipts
const loadCreatorNames = async () => {
  if (loadingCreators.value || receipts.value.length === 0) return
  
  loadingCreators.value = true
  const db = getFirestoreInstance()
  if (!db) {
    loadingCreators.value = false
    return
  }

  try {
    // Get unique creator UIDs from receipts (use actualCreator if available, otherwise createdBy)
    const uniqueCreatorUids = [...new Set(receipts.value.map(r => (r as any).actualCreator || r.createdBy).filter(Boolean))]
    
    // Fetch names for all unique creators
    await Promise.all(uniqueCreatorUids.map(async (uid) => {
      if (creatorNames.value[uid]) return // Already loaded
      
      try {
        // First try to get from users collection (super admin)
        const userData = await getUserDocument(uid)
        if (userData?.name) {
          creatorNames.value[uid] = userData.name
          return
        }
        
        // Try to get from staff store cache first (faster if already loaded)
        const cachedStaff = staffStore.staff.find(s => s.authUid === uid)
        if (cachedStaff) {
          const fullName = `${cachedStaff.firstName || ''} ${cachedStaff.lastName || ''}`.trim()
          if (fullName) {
            creatorNames.value[uid] = fullName
            return
          }
        }
        
        // If not found in cache, try legacy staff collection (for migration)
        try {
          const staffRef = collection(db, 'staff')
          const staffQuery = query(staffRef, where('authUid', '==', uid))
          const staffSnapshot = await getDocs(staffQuery)
          
          if (!staffSnapshot.empty && staffSnapshot.docs.length > 0) {
            const staffDoc = staffSnapshot.docs[0]
            if (staffDoc) {
              const staffData = staffDoc.data()
              const fullName = `${staffData.firstName || ''} ${staffData.lastName || ''}`.trim()
              if (fullName) {
                creatorNames.value[uid] = fullName
                return
              }
            }
          }
        } catch (legacyError: any) {
          console.warn(`Could not fetch from legacy staff collection for ${uid}:`, legacyError.message)
        }
        
        // If still not found, search hierarchical structure
        try {
          const { getStoresCollection, getDepartmentsCollection, getStaffCollection } = await import('~/composables/useFirestorePaths')
          
          // Get all superadmin users from top-level users collection
          const usersRef = collection(db, 'users')
          const usersSnapshot = await getDocs(usersRef)
          
          for (const userDoc of usersSnapshot.docs) {
            const potentialSuperadminId = userDoc.id
            const userData = userDoc.data()
            
            // Only search superadmins
            if (userData.role !== 'superAdmin') continue
            
            try {
              const storesRef = getStoresCollection(db, potentialSuperadminId)
              const storesSnapshot = await getDocs(storesRef)
              
              for (const storeDoc of storesSnapshot.docs) {
                const storeId = storeDoc.id
                const departmentsRef = getDepartmentsCollection(db, potentialSuperadminId, storeId)
                const departmentsSnapshot = await getDocs(departmentsRef)
                
                for (const deptDoc of departmentsSnapshot.docs) {
                  const departmentId = deptDoc.id
                  try {
                    const staffRef = getStaffCollection(db, potentialSuperadminId, storeId, departmentId)
                    const staffSnapshot = await getDocs(staffRef)
                    
                    for (const staffDoc of staffSnapshot.docs) {
                      const staffData = staffDoc.data()
                      if (staffData.authUid === uid) {
                        // Found the staff member!
                        const fullName = `${staffData.firstName || ''} ${staffData.lastName || ''}`.trim()
                        if (fullName) {
                          creatorNames.value[uid] = fullName
                          return
                        }
                        // If no name, try email
                        if (staffData.email) {
                          creatorNames.value[uid] = staffData.email
                          return
                        }
                      }
                    }
                  } catch (e) {
                    continue
                  }
                }
              }
            } catch (e) {
              continue
            }
          }
        } catch (hierarchicalError: any) {
          console.warn(`Could not search hierarchical structure for ${uid}:`, hierarchicalError.message)
        }
        
        // If still not found, use UID as fallback
        creatorNames.value[uid] = 'Unknown User'
      } catch (error: any) {
        console.warn(`Failed to fetch creator name for ${uid}:`, error.message)
        creatorNames.value[uid] = 'Unknown User'
      }
    }))
  } catch (error: any) {
    console.error('Error loading creator names:', error)
  } finally {
    loadingCreators.value = false
  }
}

// Load receipts on mount
onMounted(async () => {
  // Only run on client
  if (import.meta.server) return
  
  // Set initial loading state
  isInitialLoading.value = true
  
  // Wait for auth to finish loading before loading receipts
  if (authStore.loading) {
    let resolved = false
    await new Promise((resolve) => {
      const unwatch = watch(() => authStore.loading, (val) => {
        if (!val && !resolved) {
          resolved = true
          unwatch()
          resolve(true)
        }
      })
      
      // Timeout after 5 seconds
      setTimeout(() => {
        if (!resolved) {
          resolved = true
          unwatch()
          resolve(true)
        }
      }, 5000)
    })
  }
  
  // Only load receipts if user is authenticated
  if (authStore.currentUser) {
    try {
      await receiptsStore.fetchReceipts()
      // Load creator names after receipts are loaded
      await loadCreatorNames()
    } catch (error: any) {
      console.error('Error loading receipts:', error.message || error)
    }
  }
  
  // Hide initial loading state after a minimum time to prevent flash
  await new Promise(resolve => setTimeout(resolve, 300))
  isInitialLoading.value = false
})

// Watch for auth state changes
watch(() => authStore.currentUser, async (user) => {
  if (user && receiptsStore.receipts.length === 0) {
    try {
      await receiptsStore.fetchReceipts()
      // Load creator names after receipts are loaded
      await loadCreatorNames()
    } catch (error: any) {
      console.error('Error loading receipts:', error.message || error)
    }
  }
}, { immediate: false })

// Watch for receipts changes and load creator names
// Watch for store changes and refetch receipts
watch(() => storesStore.currentStoreId, async (newStoreId, oldStoreId) => {
  if (newStoreId && newStoreId !== oldStoreId && authStore.currentUser) {
    console.log('[ReceiptsPage] Store changed, refetching receipts...')
    try {
      await receiptsStore.fetchReceipts()
      console.log('[ReceiptsPage] Receipts refetched after store change:', receiptsStore.receipts.length)
    } catch (error: any) {
      console.error('[ReceiptsPage] Error refetching receipts after store change:', error.message || error)
    }
  }
}, { immediate: false })

watch(() => receiptsStore.receipts, async (newReceipts) => {
  if (newReceipts && newReceipts.length > 0) {
    await loadCreatorNames()
  }
}, { immediate: false })
</script>

