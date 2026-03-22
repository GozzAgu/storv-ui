<template>
  <ClientOnly>
    <div class="pb-24 sm:pb-20 min-h-screen w-full overflow-x-hidden">
      <!-- Initial loading skeleton -->
      <template v-if="isInitialLoading">
        <div class="rounded-2xl bg-gray-50 dark:bg-gray-800/80 overflow-hidden min-h-[360px] border border-gray-200/50 dark:border-gray-700/50">
          <div class="p-4 sm:p-6 border-b border-gray-200/60 dark:border-gray-700/60">
            <div class="flex flex-wrap gap-4">
              <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded-lg w-24 animate-pulse"></div>
              <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded-lg w-20 animate-pulse"></div>
              <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded-lg w-28 animate-pulse"></div>
              </div>
            <div class="flex gap-3 mt-4">
              <div class="h-10 flex-1 max-w-xs rounded-xl bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
              <div class="h-10 w-28 rounded-xl bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
              <div class="h-10 w-28 rounded-xl bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
            </div>
              </div>
          <div class="p-4 space-y-3">
            <div v-for="i in 6" :key="i" class="flex gap-4">
              <div class="h-4 flex-1 rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
              <div class="h-4 w-24 rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
              <div class="h-4 w-20 rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
            </div>
          </div>
          </div>
      </template>
    
    <template v-else>
    <!-- Hero header -->
    <div class="mb-4 sm:mb-6">
      <h1 class="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">Sales</h1>
      <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">Manage receipts, customers, and returns</p>
    </div>

    <!-- Tab Navigation - Modern segment style (ring indicator, no bg fill) -->
    <div class="inline-flex p-1 rounded-xl bg-gray-100/80 dark:bg-gray-800/50 ring-1 ring-gray-200/60 dark:ring-gray-700/50">
      <nav class="flex gap-0.5">
        <button
          @click="activeTab = 'receipts'"
          :class="[
            'px-4 py-2 text-xs font-medium rounded-lg transition-all duration-200',
            activeTab === 'receipts'
              ? 'text-primary-500 dark:text-primary-400 ring-1 ring-primary-400/50 dark:ring-primary-400/50'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          ]"
        >
          Receipts
        </button>
        <button
          @click="activeTab = 'customers'"
          :class="[
            'px-4 py-2 text-xs font-medium rounded-lg transition-all duration-200',
            activeTab === 'customers'
              ? 'text-primary-500 dark:text-primary-400 ring-1 ring-primary-400/50 dark:ring-primary-400/50'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          ]"
        >
          Customers
        </button>
      </nav>
    </div>

    <!-- Receipts Tab Content -->
    <template v-if="activeTab === 'receipts'">


    <!-- Receipts Table -->
    <div
      :class="[
        'transition-all duration-300 mt-6 sm:mt-8',
        isReceiptsFullscreen
          ? 'fixed inset-0 z-50 bg-white dark:bg-gray-900 overflow-auto'
          : 'relative'
      ]"
    >
      <!-- Fullscreen header -->
      <div v-if="isReceiptsFullscreen" class="sticky top-0 z-10 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-gray-200/80 dark:border-gray-700/80 px-4 py-3">
        <div class="flex items-center justify-between gap-3 mb-3">
          <div>
            <h2 class="text-base font-semibold text-gray-900 dark:text-gray-100">Receipts</h2>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {{ filteredReceipts.length }} receipts · {{ formatCurrency(totalSales) }} total sales
            </p>
          </div>
          <button
            @click="isReceiptsFullscreen = false"
            class="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title="Exit fullscreen"
          >
            <XMarkIcon class="w-4 h-4" />
          </button>
        </div>
        <div class="flex items-center gap-2 flex-wrap">
          <div class="relative flex-1 min-w-0 max-w-xs">
            <MagnifyingGlassIcon class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500 pointer-events-none" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search receipts..."
              class="w-full pl-9 pr-3 py-2 text-sm rounded-xl bg-gray-50 dark:bg-gray-800/80 border-0 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-400/30"
            />
          </div>
          <select
            v-model="statusFilter"
            class="px-3 py-2 text-sm rounded-xl bg-gray-50 dark:bg-gray-800/80 border-0 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-400/30 min-w-[120px]"
          >
            <option value="all">All Status</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="refunded">Refunded</option>
          </select>
          <select
            v-model="dateFilter"
            class="px-3 py-2 text-sm rounded-xl bg-gray-50 dark:bg-gray-800/80 border-0 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-400/30 min-w-[120px]"
          >
            <option value="all">All Dates</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
          <button
            @click="resetFilters"
            class="p-2 rounded-xl text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title="Reset filters"
          >
            <ArrowPathIcon class="w-5 h-5" />
          </button>
        </div>
      </div>

      <div
        :class="[
          isReceiptsFullscreen ? 'shadow-none' : 'rounded-xl bg-gray-50 dark:bg-gray-800/80 overflow-hidden border border-gray-200/50 dark:border-gray-700/50'
        ]"
      >
        <!-- Toolbar: stats + filters (desktop, hidden in fullscreen) -->
        <div v-if="!receiptsStore.loading && !isReceiptsFullscreen" class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-3 sm:px-5 py-3 border-b border-gray-200/60 dark:border-gray-700/60">
          <div class="flex items-center flex-wrap gap-3 sm:gap-5">
            <div class="flex items-center gap-1.5">
              <ReceiptPercentIcon class="w-4 h-4 text-blue-600 dark:text-blue-400" stroke-width="1.75" />
              <span class="text-xs text-gray-600 dark:text-gray-400">Receipts:</span>
              <span class="text-xs font-semibold text-gray-900 dark:text-gray-100">
                <span v-if="receiptsStore.loading">-</span>
                <span v-else>{{ receiptsStore.totalReceipts }}</span>
              </span>
            </div>
            <div class="flex items-center gap-1.5">
              <CurrencyDollarIcon class="w-4 h-4 text-green-600 dark:text-green-400" stroke-width="1.75" />
              <span class="text-xs text-gray-600 dark:text-gray-400">Sales:</span>
              <span class="text-xs font-semibold text-gray-900 dark:text-gray-100">{{ formatCurrency(totalSales) }}</span>
            </div>
            <div class="hidden sm:flex items-center gap-1.5">
              <CalendarIcon class="w-4 h-4 text-primary-500 dark:text-primary-400" stroke-width="1.75" />
              <span class="text-xs text-gray-600 dark:text-gray-400">Today:</span>
              <span class="text-xs font-semibold text-gray-900 dark:text-gray-100">
                <span v-if="receiptsStore.loading">-</span>
                <span v-else>{{ formatCurrency(todaySales) }}</span>
              </span>
            </div>
            <div class="hidden lg:flex items-center gap-1.5">
              <ChartBarIcon class="w-4 h-4 text-orange-600 dark:text-orange-400" stroke-width="1.75" />
              <span class="text-xs text-gray-600 dark:text-gray-400">Month:</span>
              <span class="text-xs font-semibold text-gray-900 dark:text-gray-100">
                <span v-if="receiptsStore.loading">-</span>
                <span v-else>{{ formatCurrency(monthSales) }}</span>
              </span>
            </div>
          </div>
          <div class="flex items-center gap-1.5 flex-shrink-0">
              <div class="relative">
              <MagnifyingGlassIcon class="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 dark:text-gray-500 pointer-events-none" />
                <input
                  v-model="searchQuery"
                  type="text"
                  placeholder="Search receipts..."
                class="pl-8 pr-2.5 py-1.5 text-xs rounded-lg bg-white dark:bg-gray-800 border-0 ring-1 ring-gray-200/80 dark:ring-gray-700/80 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-400/30 w-40 sm:w-48"
                />
              </div>
              <select
                v-model="statusFilter"
              class="px-2.5 py-1.5 text-xs rounded-lg bg-white dark:bg-gray-800 border-0 ring-1 ring-gray-200/80 dark:ring-gray-700/80 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-400/30 min-w-[100px]"
              >
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="refunded">Refunded</option>
              </select>
              <select
                v-model="dateFilter"
              class="px-2.5 py-1.5 text-xs rounded-lg bg-white dark:bg-gray-800 border-0 ring-1 ring-gray-200/80 dark:ring-gray-700/80 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-400/30 min-w-[100px]"
              >
                <option value="all">All Dates</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
              </select>
              <button
                @click="resetFilters"
              class="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-200/60 dark:hover:bg-gray-700/60 transition-colors"
                title="Reset filters"
              >
                <ArrowPathIcon class="w-4 h-4" />
              </button>
              <button
                @click="isReceiptsFullscreen = !isReceiptsFullscreen"
              class="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-200/60 dark:hover:bg-gray-700/60 transition-colors"
                :title="isReceiptsFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'"
              >
                <ArrowsPointingOutIcon v-if="!isReceiptsFullscreen" class="w-4 h-4" />
                <XMarkIcon v-else class="w-4 h-4" />
              </button>
            </div>
          </div>
        <!-- Bulk actions (receipts) -->
        <div v-if="canDeleteReceipts && selectedReceiptsForBulk.length > 0" class="flex flex-wrap items-center gap-2 px-3 sm:px-5 py-2 border-b border-gray-200/60 dark:border-gray-700/60 bg-gray-50/70 dark:bg-gray-900/10">
          <span class="text-xs font-medium text-gray-700 dark:text-gray-300">{{ selectedReceiptsForBulk.length }} selected</span>
          <Button
            variant="outline"
            size="sm"
            :icon="TrashIcon"
            class="!rounded-lg !px-2.5 !py-1.5 !text-xs !border-gray-200/80 dark:!border-gray-700/80 !text-gray-600 dark:!text-gray-300 hover:!text-red-600 dark:hover:!text-red-400 hover:!border-red-200/80 dark:hover:!border-red-800/50 hover:!bg-red-50/60 dark:hover:!bg-red-900/10"
            @click="openBulkDeleteReceiptsModal"
          >
            Delete
          </Button>
      </div>
      <!-- Table Loading Skeleton -->
      <div v-if="receiptsStore.loading" class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-gray-800/50">
            <tr>
              <th v-for="i in 6" :key="i" class="px-3 py-2">
                <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded-md w-20 animate-pulse"></div>
              </th>
            </tr>
          </thead>
          <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            <tr v-for="i in 5" :key="i">
              <td v-for="j in 6" :key="j" class="px-3 py-3">
                <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded-md w-full animate-pulse"></div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <!-- Standalone empty state (same styling as customers empty state, no button) -->
      <div
        v-else-if="sortedFilteredReceipts.length === 0"
        class="flex flex-col items-center justify-center py-10 px-4 sm:px-6 text-center min-w-0 w-full min-h-[calc(100svh-12rem)] sm:min-h-[calc(100svh-10rem)]"
      >
        <div class="w-12 h-12 flex-shrink-0 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-3">
          <ReceiptPercentIcon class="w-6 h-6 text-gray-400 dark:text-gray-500" stroke-width="1.5" />
        </div>
        <h3 class="text-sm font-semibold text-gray-900 dark:text-gray-100 break-words max-w-full">
          {{ searchQuery || statusFilter !== 'all' || dateFilter !== 'all' ? 'No receipts found' : 'No receipts yet' }}
        </h3>
        <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto break-words">
          {{ searchQuery || statusFilter !== 'all' || dateFilter !== 'all' ? 'Try adjusting your search or filters' : 'Create your first receipt to get started' }}
        </p>
      </div>
      <template v-else>
      <!-- Mobile: card list (no horizontal scroll) -->
      <div class="block sm:hidden space-y-3 px-1">
        <div
          v-for="receipt in paginatedReceipts"
          :key="receipt.id"
          class="rounded-xl bg-white dark:bg-gray-800 p-3 shadow-sm"
        >
          <div class="flex items-start justify-between gap-2">
            <div class="min-w-0 flex-1 flex items-start gap-2">
              <Checkbox
                v-if="canDeleteReceipts"
                :model-value="selectedReceiptsForBulk.some(r => r.id === receipt.id)"
                @update:model-value="(checked) => toggleReceiptSelection(receipt, checked)"
                size="sm"
                wrapper-class="justify-center pt-0.5"
                @click.stop
              />
              <div class="min-w-0 flex-1">
                <div class="flex flex-wrap items-center gap-1.5">
                  <span class="text-xs font-semibold text-gray-900 dark:text-gray-100">{{ receipt.receiptNumber }}</span>
                  <button
                    @click.stop="copyReceiptNumber(receipt.receiptNumber)"
                    class="p-0.5 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400"
                    title="Copy"
                    aria-label="Copy receipt number"
                  >
                    <ClipboardDocumentIcon class="w-3.5 h-3.5" stroke-width="1.5" />
                  </button>
                  <span
                    v-if="receipt.isSwapIn"
                    class="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                  >
                    Swap
                  </span>
                </div>
                <p class="text-[11px] text-gray-600 dark:text-gray-400 mt-0.5 truncate" :title="receipt.customerName">
                  {{ receipt.customerName }}
                  <span v-if="receipt.customerEmail" class="text-gray-400 dark:text-gray-500"> · {{ receipt.customerEmail }}</span>
                </p>
                <p class="text-[10px] text-gray-500 dark:text-gray-500 mt-0.5">{{ formatDate(receipt.date) }}</p>
                <div v-if="receipt.items && receipt.items.length > 0" class="mt-1.5 text-[10px] text-gray-700 dark:text-gray-300 line-clamp-2">
                  <template v-for="(item, idx) in receipt.items.slice(0, 2)" :key="idx">
                    <span v-if="idx > 0">, </span>{{ item.itemName }}<span v-if="item.quantity > 1"> × {{ item.quantity }}</span>
                  </template>
                  <span v-if="receipt.items.length > 2" class="text-gray-500 dark:text-gray-400"> +{{ receipt.items.length - 2 }} more</span>
                </div>
                <div v-else class="mt-1 text-[10px] text-gray-500 dark:text-gray-400">{{ receipt.itemsCount }} items</div>
                <div class="mt-2 flex items-center justify-between gap-2">
                  <span class="text-sm font-semibold text-gray-900 dark:text-gray-100">{{ formatCurrency(receipt.total) }}</span>
                  <span
                    :class="[
                      'inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-medium shrink-0',
                      receipt.status === 'completed'
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                        : receipt.status === 'pending'
                        ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300'
                        : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                    ]"
                  >
                    {{ receipt.status.charAt(0).toUpperCase() + receipt.status.slice(1) }}
                  </span>
                </div>
              </div>
            </div>
            <div class="relative shrink-0" @click.stop>
              <button
                type="button"
                @click="toggleReceiptMenu(receipt.id)"
                class="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700/80 dark:hover:text-gray-200"
                title="Actions"
                aria-label="Receipt actions"
                aria-haspopup="menu"
                :aria-expanded="openReceiptMenuId === receipt.id"
              >
                <EllipsisVerticalIcon class="w-4 h-4" stroke-width="2" />
              </button>
              <div
                v-if="openReceiptMenuId === receipt.id"
                class="absolute right-0 top-full z-[100] mt-1 min-w-[11rem] overflow-hidden rounded-lg bg-white py-1 shadow-lg ring-1 ring-gray-200/90 dark:bg-gray-800 dark:ring-gray-700/80"
                role="menu"
              >
                <button
                  type="button"
                  role="menuitem"
                  @click="handleViewReceiptTimeline(receipt); openReceiptMenuId = null"
                  class="flex w-full items-center gap-2.5 px-3 py-2 text-left text-xs text-gray-700 transition-colors hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-700/60"
                >
                  <ClockIcon class="h-4 w-4 shrink-0 text-gray-400 dark:text-gray-500" stroke-width="1.75" />
                  <span>History</span>
                </button>
                <button
                  type="button"
                  role="menuitem"
                  @click="handlePrintReceipt(receipt); openReceiptMenuId = null"
                  class="flex w-full items-center gap-2.5 px-3 py-2 text-left text-xs text-gray-700 transition-colors hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-700/60"
                >
                  <PrinterIcon class="h-4 w-4 shrink-0 text-gray-400 dark:text-gray-500" stroke-width="1.75" />
                  <span>Print</span>
                </button>
                <button
                  v-if="receipt.status === 'completed' && canEditReceipts"
                  type="button"
                  role="menuitem"
                  @click="handleRefundReceipt(receipt); openReceiptMenuId = null"
                  class="flex w-full items-center gap-2.5 px-3 py-2 text-left text-xs text-orange-600 transition-colors hover:bg-orange-50 dark:text-orange-400 dark:hover:bg-orange-950/30"
                >
                  <ArrowPathIcon class="h-4 w-4 shrink-0" stroke-width="1.75" />
                  <span>Refund</span>
                </button>
                <button
                  v-if="canDeleteReceipts"
                  type="button"
                  role="menuitem"
                  @click="handleDeleteReceipt(receipt); openReceiptMenuId = null"
                  class="flex w-full items-center gap-2.5 px-3 py-2 text-left text-xs text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
                >
                  <TrashIcon class="h-4 w-4 shrink-0" stroke-width="1.75" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <!-- Desktop: table -->
      <div class="hidden sm:block overflow-x-auto">
        <table class="min-w-full">
          <thead class="border-b border-gray-200 dark:border-gray-700">
            <tr>
              <th v-if="canDeleteReceipts" class="px-3 sm:px-4 py-2 text-center text-[10px] !font-bold uppercase tracking-wider text-gray-500 dark:text-gray-500 w-10">
                <Checkbox
                  :model-value="paginatedReceipts.length > 0 && selectedReceiptsForBulk.length === paginatedReceipts.length"
                  @update:model-value="toggleSelectAllReceipts"
                  size="sm"
                  wrapper-class="justify-center"
                />
              </th>
              <th
                :class="[
                  'px-3 sm:px-4 py-2 text-left text-[10px] !font-bold uppercase tracking-wider text-gray-500 dark:text-gray-500',
                  isColumnSortable('receiptNumber') && 'cursor-pointer hover:text-gray-900 dark:hover:text-gray-100'
                ]"
                @click="isColumnSortable('receiptNumber') && toggleSort('receiptNumber')"
              >
                <div class="flex items-center gap-1.5">
                  Receipt #
                  <template v-if="isColumnSortable('receiptNumber')">
                    <ChevronUpIcon
                      v-if="currentSort.key === 'receiptNumber' && currentSort.order === 'asc'"
                      class="w-3 h-3 text-primary-500 dark:text-primary-400"
                    />
                    <ChevronDownIcon
                      v-else-if="currentSort.key === 'receiptNumber' && currentSort.order === 'desc'"
                      class="w-3 h-3 text-primary-500 dark:text-primary-400"
                    />
                    <BarsArrowUpIcon v-else class="w-3 h-3 text-gray-400 dark:text-gray-500 opacity-50" />
                  </template>
                </div>
              </th>
              <th
                :class="[
                  'px-3 sm:px-4 py-2 text-left text-[10px] !font-bold uppercase tracking-wider text-gray-500 dark:text-gray-500',
                  isColumnSortable('customerName') && 'cursor-pointer hover:text-gray-900 dark:hover:text-gray-100'
                ]"
                @click="isColumnSortable('customerName') && toggleSort('customerName')"
              >
                <div class="flex items-center gap-1.5">
                  Customer
                  <template v-if="isColumnSortable('customerName')">
                    <ChevronUpIcon
                      v-if="currentSort.key === 'customerName' && currentSort.order === 'asc'"
                      class="w-3 h-3 text-primary-500 dark:text-primary-400"
                    />
                    <ChevronDownIcon
                      v-else-if="currentSort.key === 'customerName' && currentSort.order === 'desc'"
                      class="w-3 h-3 text-primary-500 dark:text-primary-400"
                    />
                    <BarsArrowUpIcon v-else class="w-3 h-3 text-gray-400 dark:text-gray-500 opacity-50" />
                  </template>
                </div>
              </th>
              <th
                :class="[
                  'px-3 sm:px-4 py-2 text-left text-[10px] !font-bold uppercase tracking-wider text-gray-500 dark:text-gray-500',
                  isColumnSortable('date') && 'cursor-pointer hover:text-gray-900 dark:hover:text-gray-100'
                ]"
                @click="isColumnSortable('date') && toggleSort('date')"
              >
                <div class="flex items-center gap-1.5">
                  Date
                  <template v-if="isColumnSortable('date')">
                    <ChevronUpIcon
                      v-if="currentSort.key === 'date' && currentSort.order === 'asc'"
                      class="w-3 h-3 text-primary-500 dark:text-primary-400"
                    />
                    <ChevronDownIcon
                      v-else-if="currentSort.key === 'date' && currentSort.order === 'desc'"
                      class="w-3 h-3 text-primary-500 dark:text-primary-400"
                    />
                    <BarsArrowUpIcon v-else class="w-3 h-3 text-gray-400 dark:text-gray-500 opacity-50" />
                  </template>
                </div>
              </th>
              <th
                :class="[
                  'px-3 sm:px-4 py-2 text-left text-[10px] !font-bold uppercase tracking-wider text-gray-500 dark:text-gray-500',
                  isColumnSortable('itemsCount') && 'cursor-pointer hover:text-gray-900 dark:hover:text-gray-100'
                ]"
                @click="isColumnSortable('itemsCount') && toggleSort('itemsCount')"
              >
                <div class="flex items-center gap-1.5">
                  Items
                  <template v-if="isColumnSortable('itemsCount')">
                    <ChevronUpIcon
                      v-if="currentSort.key === 'itemsCount' && currentSort.order === 'asc'"
                      class="w-3 h-3 text-primary-500 dark:text-primary-400"
                    />
                    <ChevronDownIcon
                      v-else-if="currentSort.key === 'itemsCount' && currentSort.order === 'desc'"
                      class="w-3 h-3 text-primary-500 dark:text-primary-400"
                    />
                    <BarsArrowUpIcon v-else class="w-3 h-3 text-gray-400 dark:text-gray-500 opacity-50" />
                  </template>
                </div>
              </th>
              <th
                :class="[
                  'px-3 sm:px-4 py-2 text-left text-[10px] !font-bold uppercase tracking-wider text-gray-500 dark:text-gray-500',
                  isColumnSortable('total') && 'cursor-pointer hover:text-gray-900 dark:hover:text-gray-100'
                ]"
                @click="isColumnSortable('total') && toggleSort('total')"
              >
                <div class="flex items-center gap-1.5">
                  Total
                  <template v-if="isColumnSortable('total')">
                    <ChevronUpIcon
                      v-if="currentSort.key === 'total' && currentSort.order === 'asc'"
                      class="w-3 h-3 text-primary-500 dark:text-primary-400"
                    />
                    <ChevronDownIcon
                      v-else-if="currentSort.key === 'total' && currentSort.order === 'desc'"
                      class="w-3 h-3 text-primary-500 dark:text-primary-400"
                    />
                    <BarsArrowUpIcon v-else class="w-3 h-3 text-gray-400 dark:text-gray-500 opacity-50" />
                  </template>
                </div>
              </th>
              <th
                :class="[
                  'px-3 sm:px-4 py-2 text-left text-[10px] !font-bold uppercase tracking-wider text-gray-500 dark:text-gray-500',
                  isColumnSortable('paymentMethod') && 'cursor-pointer hover:text-gray-900 dark:hover:text-gray-100'
                ]"
                @click="isColumnSortable('paymentMethod') && toggleSort('paymentMethod')"
              >
                <div class="flex items-center gap-1.5">
                  Payment
                  <template v-if="isColumnSortable('paymentMethod')">
                    <ChevronUpIcon
                      v-if="currentSort.key === 'paymentMethod' && currentSort.order === 'asc'"
                      class="w-3 h-3 text-primary-500 dark:text-primary-400"
                    />
                    <ChevronDownIcon
                      v-else-if="currentSort.key === 'paymentMethod' && currentSort.order === 'desc'"
                      class="w-3 h-3 text-primary-500 dark:text-primary-400"
                    />
                    <BarsArrowUpIcon v-else class="w-3 h-3 text-gray-400 dark:text-gray-500 opacity-50" />
                  </template>
                </div>
              </th>
              <th
                :class="[
                  'px-3 sm:px-4 py-2 text-left text-[10px] !font-bold uppercase tracking-wider text-gray-500 dark:text-gray-500',
                  isColumnSortable('status') && 'cursor-pointer hover:text-gray-900 dark:hover:text-gray-100'
                ]"
                @click="isColumnSortable('status') && toggleSort('status')"
              >
                <div class="flex items-center gap-1.5">
                  Status
                  <template v-if="isColumnSortable('status')">
                    <ChevronUpIcon
                      v-if="currentSort.key === 'status' && currentSort.order === 'asc'"
                      class="w-3 h-3 text-primary-500 dark:text-primary-400"
                    />
                    <ChevronDownIcon
                      v-else-if="currentSort.key === 'status' && currentSort.order === 'desc'"
                      class="w-3 h-3 text-primary-500 dark:text-primary-400"
                    />
                    <BarsArrowUpIcon v-else class="w-3 h-3 text-gray-400 dark:text-gray-500 opacity-50" />
                  </template>
                </div>
              </th>
              <th
                :class="[
                  'px-3 sm:px-4 py-2 text-left text-[10px] !font-bold uppercase tracking-wider text-gray-500 dark:text-gray-500',
                  isColumnSortable('createdBy') && 'cursor-pointer hover:text-gray-900 dark:hover:text-gray-100'
                ]"
                @click="isColumnSortable('createdBy') && toggleSort('createdBy')"
              >
                <div class="flex items-center gap-1.5">
                  Created By
                  <template v-if="isColumnSortable('createdBy')">
                    <ChevronUpIcon
                      v-if="currentSort.key === 'createdBy' && currentSort.order === 'asc'"
                      class="w-3 h-3 text-primary-500 dark:text-primary-400"
                    />
                    <ChevronDownIcon
                      v-else-if="currentSort.key === 'createdBy' && currentSort.order === 'desc'"
                      class="w-3 h-3 text-primary-500 dark:text-primary-400"
                    />
                    <BarsArrowUpIcon v-else class="w-3 h-3 text-gray-400 dark:text-gray-500 opacity-50" />
                  </template>
                </div>
              </th>
              <th class="w-12 px-3 py-2 text-right text-[10px] !font-bold uppercase tracking-wider text-gray-500 dark:text-gray-500 sm:w-[4.5rem] sm:px-4">
                Actions
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200/80 dark:divide-gray-700/80 bg-white dark:bg-gray-800/40">
            <tr
              v-for="receipt in paginatedReceipts"
              :key="receipt.id"
              class="hover:bg-gray-50/80 dark:hover:bg-gray-700/40 transition-colors"
            >
              <td v-if="canDeleteReceipts" class="px-3 sm:px-4 py-2 text-center w-10">
                <Checkbox
                  :model-value="selectedReceiptsForBulk.some(r => r.id === receipt.id)"
                  @update:model-value="(checked) => toggleReceiptSelection(receipt, checked)"
                  size="sm"
                  wrapper-class="justify-center"
                  @click.stop
                />
              </td>
              <td class="px-3 sm:px-4 py-2">
                <div class="flex items-center gap-1.5">
                  <div class="text-[10px] font-medium text-gray-900 dark:text-gray-100">
                    {{ receipt.receiptNumber }}
                  </div>
                  <button
                    @click.stop="copyReceiptNumber(receipt.receiptNumber)"
                    class="p-0.5 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                    title="Copy receipt number"
                  >
                    <ClipboardDocumentIcon class="w-3 h-3 stroke-1" stroke-width="1.5" />
                  </button>
                  <span
                    v-if="receipt.isSwapIn"
                    class="inline-flex items-center px-1 py-0.5 rounded text-[9px] font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                    title="Swap-in transaction"
                  >
                    Swap
                  </span>
                </div>
              </td>
              <td class="px-3 sm:px-4 py-2">
                <div class="text-[10px] text-gray-900 dark:text-gray-100">
                  {{ receipt.customerName }}
                </div>
                <div class="text-[9px] text-gray-500 dark:text-gray-400">
                  {{ receipt.customerEmail }}
                </div>
              </td>
              <td class="px-3 sm:px-4 py-2">
                <div class="text-[10px] text-gray-600 dark:text-gray-300">
                  {{ formatDate(receipt.date) }}
                </div>
              </td>
              <td class="px-3 sm:px-4 py-2">
                <div class="text-[10px] text-gray-900 dark:text-gray-100">
                  <div v-if="receipt.items && receipt.items.length > 0" class="space-y-0.5">
                    <div 
                      v-for="(item, idx) in receipt.items.slice(0, 3)" 
                      :key="idx"
                      class="text-[10px]"
                    >
                      {{ item.itemName }}<span v-if="item.quantity > 1" class="text-gray-500 dark:text-gray-400"> × {{ item.quantity }}</span>
                    </div>
                    <div v-if="receipt.items.length > 3" class="text-[9px] text-gray-500 dark:text-gray-400 italic">
                      and {{ receipt.items.length - 3 }} more product{{ receipt.items.length - 3 > 1 ? 's' : '' }}
                    </div>
                  </div>
                  <span v-else class="text-[9px] text-gray-500 dark:text-gray-400">
                  {{ receipt.itemsCount }} items
                </span>
                </div>
              </td>
              <td class="px-3 sm:px-4 py-2">
                <span class="text-[10px] font-semibold text-gray-900 dark:text-gray-100">
                  {{ formatCurrency(receipt.total) }}
                </span>
              </td>
              <td class="px-3 sm:px-4 py-2">
                <span class="text-[10px] text-gray-600 dark:text-gray-300">
                  {{ receipt.paymentMethod }}
                </span>
              </td>
              <td class="px-3 sm:px-4 py-2">
                <span
                  :class="[
                    'inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-medium',
                    receipt.status === 'completed'
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                      : receipt.status === 'pending'
                      ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300'
                      : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                  ]"
                >
                  {{ receipt.status.charAt(0).toUpperCase() + receipt.status.slice(1) }}
                </span>
              </td>
              <td class="px-3 sm:px-4 py-2">
                <div class="text-[10px] text-gray-600 dark:text-gray-300">
                  {{ receipt.createdByUserName || getCreatorName(receipt.actualCreator || receipt.createdBy) }}
                </div>
              </td>
              <td class="px-3 sm:px-4 py-2 text-right">
                <div class="relative inline-flex justify-end" @click.stop>
                  <button
                    type="button"
                    @click="toggleReceiptMenu(receipt.id)"
                    class="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700/80 dark:hover:text-gray-200"
                    title="Actions"
                    aria-label="Receipt actions"
                    aria-haspopup="menu"
                    :aria-expanded="openReceiptMenuId === receipt.id"
                  >
                    <EllipsisVerticalIcon class="w-4 h-4" stroke-width="2" />
                  </button>
                  <div
                    v-if="openReceiptMenuId === receipt.id"
                    class="absolute right-0 top-full z-[100] mt-1 min-w-[11rem] overflow-hidden rounded-lg bg-white py-1 text-left shadow-lg ring-1 ring-gray-200/90 dark:bg-gray-800 dark:ring-gray-700/80"
                    role="menu"
                  >
                    <button
                      type="button"
                      role="menuitem"
                      @click="handleViewReceiptTimeline(receipt); openReceiptMenuId = null"
                      class="flex w-full items-center gap-2.5 px-3 py-2 text-xs text-gray-700 transition-colors hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-700/60"
                    >
                      <ClockIcon class="h-4 w-4 shrink-0 text-gray-400 dark:text-gray-500" stroke-width="1.75" />
                      <span>History</span>
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      @click="handlePrintReceipt(receipt); openReceiptMenuId = null"
                      class="flex w-full items-center gap-2.5 px-3 py-2 text-xs text-gray-700 transition-colors hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-700/60"
                    >
                      <PrinterIcon class="h-4 w-4 shrink-0 text-gray-400 dark:text-gray-500" stroke-width="1.75" />
                      <span>Print</span>
                    </button>
                    <button
                      v-if="receipt.status === 'completed' && canEditReceipts"
                      type="button"
                      role="menuitem"
                      @click="handleRefundReceipt(receipt); openReceiptMenuId = null"
                      class="flex w-full items-center gap-2.5 px-3 py-2 text-xs text-orange-600 transition-colors hover:bg-orange-50 dark:text-orange-400 dark:hover:bg-orange-950/30"
                    >
                      <ArrowPathIcon class="h-4 w-4 shrink-0" stroke-width="1.75" />
                      <span>Refund</span>
                    </button>
                    <button
                      v-if="canDeleteReceipts"
                      type="button"
                      role="menuitem"
                      @click="handleDeleteReceipt(receipt); openReceiptMenuId = null"
                      class="flex w-full items-center gap-2.5 px-3 py-2 text-xs text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
                    >
                      <TrashIcon class="h-4 w-4 shrink-0" stroke-width="1.75" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      </template>
      </div>
    </div>

    <!-- Bottom bar: Pagination -->
    <div
      v-if="sortedFilteredReceipts.length > 0 && !isReceiptsFullscreen"
      class="fixed bottom-0 left-0 right-0 rounded-none bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-t border-gray-200/80 dark:border-gray-700/80 shadow-[0_-4px_20px_-4px_rgba(0,0,0,0.06)] dark:shadow-[0_-4px_20px_-4px_rgba(0,0,0,0.3)] z-30 transition-[left] duration-300 safe-area-inset-bottom"
      :class="sidebarCollapsed ? 'lg:left-[72px]' : 'lg:left-64'"
    >
      <div class="px-4 sm:px-6 py-1.5 rounded-none">
        <Pagination
          :current-page="currentPage"
          :items-per-page="itemsPerPage"
          :total="sortedFilteredReceipts.length"
          @page-change="handlePageChange"
        />
      </div>
    </div>

    <!-- Fullscreen pagination -->
    <div v-if="isReceiptsFullscreen && sortedFilteredReceipts.length > 0" class="sticky bottom-0 rounded-none bg-white dark:bg-gray-900 border-t border-gray-200/80 dark:border-gray-700/80 px-6 py-1.5 z-10">
      <Pagination
        :current-page="currentPage"
        :items-per-page="itemsPerPage"
        :total="sortedFilteredReceipts.length"
        @page-change="handlePageChange"
      />
    </div>

    <!-- FAB: New receipt (draggable — position saved on this device) -->
    <DraggableFabContainer
      v-if="!isInitialLoading && canCreate && (sortedFilteredReceipts.length > 0 || (sortedFilteredReceipts.length === 0 && !searchQuery && statusFilter === 'all' && dateFilter === 'all'))"
      storage-key="storv-fab:receipts"
      layout="row"
    >
      <div class="group relative flex items-center justify-end overflow-visible">
        <span
          class="pointer-events-none invisible absolute right-full top-1/2 z-50 mr-2 inline-flex min-w-max max-w-none -translate-y-1/2 items-center justify-center whitespace-nowrap rounded-lg bg-gray-900 px-2.5 py-1.5 text-xs font-medium text-white shadow-lg opacity-0 transition-all duration-200 group-hover:visible group-hover:opacity-100 dark:bg-gray-800"
        >
          {{ sortedFilteredReceipts.length === 0 ? 'Create first receipt' : 'New receipt' }}
        </span>
        <button
          type="button"
          @click="openCreateReceiptModal"
          class="group flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-500 shadow-lg transition-all duration-200 hover:scale-105 hover:bg-primary-600 hover:text-white hover:shadow-xl active:scale-95"
          aria-label="Create new receipt"
        >
          <PlusIcon class="h-5 w-5 stroke-white text-white" stroke-width="2.5" />
        </button>
      </div>
    </DraggableFabContainer>

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
      <!-- Bulk Delete Receipts Modal -->
      <Modal
        v-model="showBulkDeleteReceiptsModal"
        @update:model-value="(v: boolean) => { showBulkDeleteReceiptsModal = v; if (!v) bulkDeleteReceiptsConfirmed = false }"
        size="md"
      >
        <template #header>
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <TrashIcon class="w-4 h-4 text-red-600 dark:text-red-400" />
            </div>
            <div class="min-w-0">
              <h3 class="text-sm font-semibold text-gray-900 dark:text-gray-100">Delete selected receipts</h3>
              <p class="text-xs text-gray-500 dark:text-gray-400">{{ selectedReceiptsForBulk.length }} receipt{{ selectedReceiptsForBulk.length !== 1 ? 's' : '' }} selected</p>
            </div>
          </div>
        </template>
        <div class="space-y-3">
          <div class="p-3 bg-red-50 dark:bg-red-900/20 ring-1 ring-red-200/50 dark:ring-red-800/40 rounded-xl">
            <p class="text-xs text-red-800 dark:text-red-200">This will permanently delete the selected receipts. This action cannot be undone. Associated customer data may be affected.</p>
          </div>
          <div class="p-2.5 bg-gray-50 dark:bg-gray-700/40 rounded-xl">
            <Checkbox
              v-model="bulkDeleteReceiptsConfirmed"
              label="I understand that these receipts will be permanently deleted."
              size="sm"
              wrapper-class="items-start"
              label-class="text-xs text-gray-700 dark:text-gray-300"
            />
          </div>
        </div>
        <template #footer>
          <Button variant="outline" size="sm" @click="showBulkDeleteReceiptsModal = false; bulkDeleteReceiptsConfirmed = false" class="!rounded-lg">Cancel</Button>
          <Button
            variant="danger"
            size="sm"
            :disabled="!bulkDeleteReceiptsConfirmed || isBulkDeletingReceipts"
            :icon="TrashIcon"
            class="!rounded-lg"
            @click="handleConfirmBulkDeleteReceipts"
          >
            {{ isBulkDeletingReceipts ? 'Deleting...' : `Delete ${selectedReceiptsForBulk.length} receipt${selectedReceiptsForBulk.length !== 1 ? 's' : ''}` }}
          </Button>
        </template>
      </Modal>
      <DeleteReceiptModal
        v-model="showDeleteReceiptModal"
        :receipt="selectedReceipt"
        @confirmDelete="handleReceiptConfirmDelete"
      />

      <!-- Receipt Timeline Modal -->
      <ReceiptTimelineModal
        v-model="showTimelineModal"
        :receipt="selectedReceipt"
      />
    </template>

    <!-- Customers tab -->
    <template v-if="activeTab === 'customers'">
      <div class="mt-4 sm:mt-6 rounded-xl bg-gray-50 dark:bg-gray-800/80 overflow-hidden border border-gray-200/50 dark:border-gray-700/50">
        <div v-if="!receiptsStore.loading" class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-3 sm:px-5 py-3 border-b border-gray-200/60 dark:border-gray-700/60">
          <div class="flex items-center flex-wrap gap-3 sm:gap-5">
            <div class="flex items-center gap-1.5">
              <UsersIcon class="w-4 h-4 text-blue-600 dark:text-blue-400" stroke-width="1.75" />
                <span class="text-xs text-gray-600 dark:text-gray-400">Customers:</span>
              <span class="text-xs font-semibold text-gray-900 dark:text-gray-100">{{ uniqueCustomers.length }}</span>
              </div>
            <div class="flex items-center gap-1.5">
              <CurrencyDollarIcon class="w-4 h-4 text-green-600 dark:text-green-400" stroke-width="1.75" />
                <span class="text-xs text-gray-600 dark:text-gray-400">Revenue:</span>
              <span class="text-xs font-semibold text-gray-900 dark:text-gray-100">{{ formatCurrency(customersTotalRevenue) }}</span>
              </div>
            <div class="hidden sm:flex items-center gap-1.5">
              <ChartBarIcon class="w-4 h-4 text-primary-500 dark:text-primary-400" stroke-width="1.75" />
              <span class="text-xs text-gray-600 dark:text-gray-400">Avg. order:</span>
              <span class="text-xs font-semibold text-gray-900 dark:text-gray-100">{{ formatCurrency(customersAverageOrderValue) }}</span>
              </div>
          </div>
          <div class="flex items-center gap-1.5">
            <div class="relative flex-1 sm:flex-initial min-w-0 sm:min-w-[160px]">
              <MagnifyingGlassIcon class="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 dark:text-gray-500 pointer-events-none" />
                  <input
                    v-model="customersSearchQuery"
                    type="text"
                    placeholder="Search customers..."
                class="w-full pl-8 pr-2.5 py-1.5 text-xs rounded-lg bg-white dark:bg-gray-800 border-0 ring-1 ring-gray-200/80 dark:ring-gray-700/80 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-400/30"
                  />
                </div>
                <select
                  v-model="customersSortBy"
              class="px-2.5 py-1.5 text-xs rounded-lg bg-white dark:bg-gray-800 border-0 ring-1 ring-gray-200/80 dark:ring-gray-700/80 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-400/30 min-w-[100px]"
                >
                  <option value="name">Name</option>
                  <option value="orders">Orders</option>
                  <option value="spent">Total Spent</option>
                  <option value="lastOrder">Last Order</option>
                </select>
              </div>
            </div>
        <div v-if="receiptsStore.loading" class="p-8 text-center">
          <div class="inline-block animate-spin rounded-full h-6 w-6 border-2 border-primary-500/30 border-t-primary-600"></div>
          <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">Loading customers...</p>
          </div>
        <!-- Standalone empty state on mobile/desktop so it's never clipped by table scroll (typography matches receipts/folders empty states) -->
        <div
          v-else-if="filteredCustomers.length === 0"
          class="flex flex-col items-center justify-center py-10 px-4 sm:px-6 text-center min-w-0 w-full min-h-[calc(100svh-12rem)] sm:min-h-[calc(100svh-10rem)]"
        >
          <div class="w-12 h-12 flex-shrink-0 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-3">
            <UsersIcon class="w-6 h-6 text-gray-400 dark:text-gray-500" stroke-width="1.5" />
          </div>
          <h3 class="text-sm font-semibold text-gray-900 dark:text-gray-100 break-words max-w-full">
            {{ customersSearchQuery ? 'No customers found' : 'No customers yet' }}
          </h3>
          <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto break-words">
            {{ customersSearchQuery ? 'Try adjusting your search' : 'Customers will appear here once you create receipts' }}
          </p>
        </div>
        <div v-else class="overflow-x-auto">
          <table class="min-w-full">
            <thead class="bg-white/60 dark:bg-gray-800/60">
              <tr>
                <th class="px-3 sm:px-4 py-2 text-left text-[10px] !font-bold uppercase tracking-wider text-gray-500 dark:text-gray-500 min-w-[90px] sm:min-w-[100px]">
                  Receipts
                </th>
                <th class="px-3 sm:px-4 py-2 text-left text-[10px] !font-bold uppercase tracking-wider text-gray-500 dark:text-gray-500">Customer</th>
                <th class="px-3 sm:px-4 py-2 text-left text-[10px] !font-bold uppercase tracking-wider text-gray-500 dark:text-gray-500">Contact</th>
                <th class="px-3 sm:px-4 py-2 text-left text-[10px] !font-bold uppercase tracking-wider text-gray-500 dark:text-gray-500">Orders</th>
                <th class="px-3 sm:px-4 py-2 text-left text-[10px] !font-bold uppercase tracking-wider text-gray-500 dark:text-gray-500">Total Spent</th>
                <th class="px-3 sm:px-4 py-2 text-left text-[10px] !font-bold uppercase tracking-wider text-gray-500 dark:text-gray-500">Last Order</th>
                <th class="w-12 px-3 py-2 text-right text-[10px] !font-bold uppercase tracking-wider text-gray-500 dark:text-gray-500 sm:w-[4.5rem] sm:px-4">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200/80 dark:divide-gray-700/80 bg-white dark:bg-gray-800/40">
              <template v-for="customer in paginatedCustomers" :key="customer.id">
                <tr class="hover:bg-gray-50/80 dark:hover:bg-gray-700/40 transition-colors">
                  <td class="px-3 sm:px-4 py-2">
                    <button
                      @click="toggleCustomerExpanded(customer.id)"
                      type="button"
                      :title="expandedCustomers[customer.id] ? 'Collapse receipts' : 'Expand to view receipts'"
                      class="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-300 hover:bg-primary-200 dark:hover:bg-primary-800/50 border border-primary-200/80 dark:border-primary-600/60 transition-colors"
                    >
                      <ChevronRightIcon
                        :class="['w-4 h-4 shrink-0 transition-transform duration-200', expandedCustomers[customer.id] ? 'rotate-90' : '']"
                      />
                      <span>View</span>
                    </button>
                  </td>
                  <td class="px-3 sm:px-4 py-2">
                    <div class="flex items-center gap-2">
                      <span class="text-[10px] font-medium text-gray-900 dark:text-gray-100">{{ customer.name }}</span>
                    </div>
                  </td>
                  <td class="px-3 sm:px-4 py-2">
                    <div class="space-y-0.5">
                      <p v-if="customer.email" class="text-[10px] text-gray-600 dark:text-gray-300 truncate">{{ customer.email }}</p>
                      <p v-if="customer.phone" class="text-[10px] text-gray-600 dark:text-gray-300 truncate">{{ customer.phone }}</p>
                      <p v-if="!customer.email && !customer.phone" class="text-[10px] text-gray-400 dark:text-gray-500">-</p>
                    </div>
                  </td>
                  <td class="px-3 sm:px-4 py-2">
                    <span class="text-[10px] text-gray-600 dark:text-gray-300">{{ customer.receipts.length }}</span>
                  </td>
                  <td class="px-3 sm:px-4 py-2">
                    <span class="text-[10px] font-semibold text-gray-900 dark:text-gray-100">{{ formatCurrency(customer.totalSpent) }}</span>
                  </td>
                  <td class="px-3 sm:px-4 py-2">
                    <span class="text-[10px] text-gray-600 dark:text-gray-300">{{ formatDate(customer.lastOrderDate) }}</span>
                  </td>
                  <td class="px-3 sm:px-4 py-2 text-right">
                    <div class="relative inline-flex justify-end" @click.stop>
                      <button
                        type="button"
                        @click="toggleCustomerMenu(customer.id)"
                        class="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700/80 dark:hover:text-gray-200"
                        title="Actions"
                        aria-label="Customer actions"
                        aria-haspopup="menu"
                        :aria-expanded="openCustomerMenuId === customer.id"
                      >
                        <EllipsisVerticalIcon class="w-4 h-4" stroke-width="2" />
                      </button>
                      <div
                        v-if="openCustomerMenuId === customer.id"
                        class="absolute right-0 top-full z-[100] mt-1 min-w-[11rem] overflow-hidden rounded-lg bg-white py-1 text-left shadow-lg ring-1 ring-gray-200/90 dark:bg-gray-800 dark:ring-gray-700/80"
                        role="menu"
                      >
                        <button
                          type="button"
                          role="menuitem"
                          @click="viewCustomerReceipts(customer); openCustomerMenuId = null"
                          class="flex w-full items-center gap-2.5 px-3 py-2 text-xs text-gray-700 transition-colors hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-700/60"
                        >
                          <PrinterIcon class="h-4 w-4 shrink-0 text-gray-400 dark:text-gray-500" stroke-width="1.75" />
                          <span>View receipts</span>
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
                <tr v-if="expandedCustomers[customer.id]" class="bg-gray-50/80 dark:bg-gray-800/60">
                  <td colspan="7" class="px-4 sm:px-5 py-3">
                    <div class="space-y-2">
                      <h4 class="text-xs font-semibold text-gray-900 dark:text-gray-100">Purchased items</h4>
                      <div class="space-y-2">
                        <div
                          v-for="receipt in getCustomerReceipts(customer.id)"
                          :key="receipt.id"
                          class="bg-white dark:bg-gray-800 rounded-xl ring-1 ring-gray-200/80 dark:ring-gray-700/80 p-3"
                        >
                          <div class="flex items-center justify-between mb-1.5">
                            <div>
                              <p class="text-[10px] font-semibold text-gray-900 dark:text-gray-100">
                                Receipt #{{ receipt.receiptNumber }}
                              </p>
                              <p class="text-[9px] text-gray-500 dark:text-gray-400">
                                {{ formatDate(receipt.date) }} • {{ formatTime(receipt.date) }}
                              </p>
                            </div>
                            <div class="text-right">
                              <p class="text-[10px] font-semibold text-gray-900 dark:text-gray-100">
                                {{ formatCurrency(receipt.total) }}
                              </p>
                              <span
                                :class="[
                                  'inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-medium',
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
                          <div class="space-y-1">
                            <div
                              v-for="(item, index) in receipt.items"
                              :key="index"
                              class="flex items-center justify-between py-1 border-b border-gray-100 dark:border-gray-700 last:border-0"
                            >
                              <div class="flex-1">
                                <p class="text-[10px] text-gray-900 dark:text-gray-100">{{ item.itemName }}</p>
                                <p class="text-[9px] text-gray-500 dark:text-gray-400">
                                  Qty: {{ item.quantity }} • {{ formatCurrency(item.price) }}
                                  <span v-if="item.hasDiscount" class="text-green-600 dark:text-green-400">
                                    ({{ item.discountPercentage }}% off)
                                  </span>
                                </p>
                              </div>
                              <div class="text-right">
                                <p class="text-[10px] font-semibold text-gray-900 dark:text-gray-100">
                                  {{ formatCurrency(item.price * item.quantity) }}
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
            </tbody>
          </table>
        </div>
      </div>

      <div
        v-if="filteredCustomers.length > 0"
        class="fixed bottom-0 left-0 right-0 rounded-none bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-t border-gray-200/80 dark:border-gray-700/80 shadow-[0_-4px_20px_-4px_rgba(0,0,0,0.06)] dark:shadow-[0_-4px_20px_-4px_rgba(0,0,0,0.3)] z-30 transition-[left] duration-300 safe-area-inset-bottom"
        :class="sidebarCollapsed ? 'lg:left-[72px]' : 'lg:left-64'"
      >
        <div class="px-4 sm:px-6 py-1.5 rounded-none">
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
      <div class="pb-24 min-h-screen w-full flex items-center justify-center">
        <div class="text-center">
          <div class="inline-block animate-spin rounded-full h-8 w-8 border-2 border-primary-500/30 border-t-primary-600"></div>
          <p class="mt-3 text-sm text-gray-500 dark:text-gray-400">Loading receipts...</p>
          </div>
  </div>
    </template>
  </ClientOnly>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
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
  ClipboardDocumentIcon,
  ArrowsPointingOutIcon,
  EllipsisVerticalIcon,
} from '@heroicons/vue/24/outline'
import DraggableFabContainer from '~/components/ui/DraggableFabContainer.vue'
import Button from '~/components/ui/Button.vue'
import Pagination from '~/components/ui/Pagination.vue'
import Modal from '~/components/ui/Modal.vue'
import Checkbox from '~/components/ui/Checkbox.vue'
// @ts-ignore
import CreateReceiptModal from '~/components/receipts/CreateReceiptModal.vue'
// @ts-ignore
import ViewReceiptModal from '~/components/receipts/ViewReceiptModal.vue'
// @ts-ignore
import ReturnReceiptModal from '~/components/receipts/ReturnReceiptModal.vue'
// @ts-ignore
import DeleteReceiptModal from '~/components/receipts/DeleteReceiptModal.vue'
// @ts-ignore
import ReceiptTimelineModal from '~/components/receipts/ReceiptTimelineModal.vue'
import { useReceiptsStore, type Receipt } from '~/stores/receipts'
import { useRecentItems } from '~/composables/useRecentItems'
import { useAuthStore } from '~/stores/auth'
import { useStoresStore } from '~/stores/stores'
import { usePermissions } from '~/composables/usePermissions'
import { useUser } from '~/composables/useUser'
import { useFirestore } from '~/composables/useFirestore'
import { useStaffStore } from '~/stores/staff'
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore'
import { useCopy } from '~/composables/useCopy'
import { usePreferences } from '~/composables/usePreferences'
import { useToast } from '~/composables/useToast'

definePageMeta({
  layout: 'dashboard',
  ssr: false
})

useHead({
  title: 'Receipts - Storvv',
})

const receiptsStore = useReceiptsStore()
const storesStore = useStoresStore()
const toast = useToast()
const authStore = useAuthStore()
const { canManage, canCreate, canEditReceipts, canDeleteReceipts } = usePermissions()
const { getUserDocument } = useUser()
const { getFirestoreInstance } = useFirestore()
const staffStore = useStaffStore()
const { copyToClipboard } = useCopy()

// Copy functions
const copyReceiptNumber = (receiptNumber: string) => {
  copyToClipboard(receiptNumber, 'Receipt number')
}

const copyCustomerId = (customerId: string) => {
  copyToClipboard(customerId, 'Customer ID')
}

// Store creator names by UID
const creatorNames = ref<Record<string, string>>({})
const loadingCreators = ref(false)

// Tab management
const route = useRoute()
const router = useRouter()
const activeTab = ref<'receipts' | 'customers'>((route.query.tab as any) || 'receipts')
const isReceiptsFullscreen = ref(false)
const isCustomersFullscreen = ref(false)
const openReceiptMenuId = ref<string | null>(null)
const openCustomerMenuId = ref<string | null>(null)

const toggleReceiptMenu = (receiptId: string) => {
  openReceiptMenuId.value = openReceiptMenuId.value === receiptId ? null : receiptId
}

const toggleCustomerMenu = (customerId: string) => {
  openCustomerMenuId.value = openCustomerMenuId.value === customerId ? null : customerId
}

// Handle ESC key to exit fullscreen and close menus
const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Escape') {
    if (isReceiptsFullscreen.value) {
      isReceiptsFullscreen.value = false
    }
    if (isCustomersFullscreen.value) {
      isCustomersFullscreen.value = false
    }
    openReceiptMenuId.value = null
  }
}

// Close menus when clicking outside
onMounted(() => {
  if (import.meta.client) {
    document.addEventListener('click', (e) => {
      if (!(e.target as HTMLElement).closest('.relative')) {
        openReceiptMenuId.value = null
        openCustomerMenuId.value = null
      }
    })
  }
})

// Watch fullscreen state to lock/unlock body scroll
watch([isReceiptsFullscreen, isCustomersFullscreen], ([receiptsFullscreen, customersFullscreen]) => {
  if (import.meta.client) {
    if (receiptsFullscreen || customersFullscreen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
  }
})

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
const itemsPerPage = ref(100)
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
const customersItemsPerPage = ref(100)

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

// Reset to first page when filters change
watch([searchQuery, statusFilter, dateFilter, currentSort], () => {
  currentPage.value = 1
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

// Use formatCurrency from preferences (which includes the correct currency symbol)
const { formatCurrency } = usePreferences()

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
const showTimelineModal = ref(false)
const showDeleteReceiptModal = ref(false)

// Bulk delete receipts
const selectedReceiptsForBulk = ref<Receipt[]>([])
const showBulkDeleteReceiptsModal = ref(false)
const bulkDeleteReceiptsConfirmed = ref(false)
const isBulkDeletingReceipts = ref(false)
const toggleReceiptSelection = (receipt: Receipt, checked: boolean) => {
  const idx = selectedReceiptsForBulk.value.findIndex(r => r.id === receipt.id)
  if (checked && idx === -1) selectedReceiptsForBulk.value.push(receipt)
  else if (!checked && idx !== -1) selectedReceiptsForBulk.value.splice(idx, 1)
}
const toggleSelectAllReceipts = (checked: boolean) => {
  if (checked) selectedReceiptsForBulk.value = [...paginatedReceipts.value]
  else selectedReceiptsForBulk.value = []
}
const openBulkDeleteReceiptsModal = () => {
  bulkDeleteReceiptsConfirmed.value = false
  showBulkDeleteReceiptsModal.value = true
}
const handleConfirmBulkDeleteReceipts = async () => {
  if (!bulkDeleteReceiptsConfirmed.value || selectedReceiptsForBulk.value.length === 0) return
  isBulkDeletingReceipts.value = true
  const ids = selectedReceiptsForBulk.value.map(r => r.id)
  const count = ids.length
  try {
    for (const id of ids) {
      await receiptsStore.deleteReceipt(id)
    }
    selectedReceiptsForBulk.value = []
    showBulkDeleteReceiptsModal.value = false
    bulkDeleteReceiptsConfirmed.value = false
    await receiptsStore.fetchReceipts()
    await loadCreatorNames()
    toast.success(`${count} receipt${count !== 1 ? 's' : ''} deleted`)
  } catch (error: any) {
    toast.error(error.message || 'Failed to delete some receipts')
  } finally {
    isBulkDeletingReceipts.value = false
  }
}


const { addRecentItem } = useRecentItems()

const handleViewReceiptTimeline = (receipt: Receipt) => {
  selectedReceipt.value = receipt
  showTimelineModal.value = true
}

const handlePrintReceipt = (receipt: Receipt) => {
  selectedReceipt.value = receipt
  showViewReceiptModal.value = true
  
  // Track as recent item
  addRecentItem({
    id: receipt.id,
    type: 'receipt',
    name: `Receipt #${receipt.receiptNumber}`,
    path: `/dashboard/receipts?receipt=${receipt.id}`,
    metadata: {
      receiptNumber: receipt.receiptNumber,
    },
  })
  
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

const handleReceiptConfirmDelete = (receipt: Receipt) => {
  showDeleteReceiptModal.value = false
  selectedReceipt.value = null

  const removed = receiptsStore.removeReceiptOptimistically(receipt.id)
  if (!removed) return

  toast.deletedWithUndo(
    'Receipt deleted',
    () => {
      receiptsStore.restoreReceipt(receipt)
    },
    async () => {
      try {
        await receiptsStore.deleteReceipt(receipt.id)
        await loadCreatorNames()
      } catch (error: any) {
        toast.error(error.message || 'Failed to delete receipt')
      }
    },
    5000
  )
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
  // Add keyboard listener for ESC key
  if (import.meta.client) {
    window.addEventListener('keydown', handleKeyDown)
  }

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

// Cleanup keyboard listener and restore body overflow
onBeforeUnmount(() => {
  if (import.meta.client) {
    window.removeEventListener('keydown', handleKeyDown)
    document.body.style.overflow = ''
  }
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

