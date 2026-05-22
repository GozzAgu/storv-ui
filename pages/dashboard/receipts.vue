<template>
  <ClientOnly>
    <div
      class="flex w-full max-w-none flex-col gap-5 pb-[calc(6.5rem+env(safe-area-inset-bottom,0px))] sm:gap-6 sm:pb-32 min-h-[calc(100svh-4.5rem)]"
    >
      <!-- Initial loading -->
      <template v-if="isInitialLoading">
        <div
          class="overflow-hidden rounded-sm bg-white dark:!bg-dashboard-card"
        >
          <div class="border-b border-gray-200/80 px-4 py-3 dark:border-gray-800">
            <div class="flex gap-8">
              <div class="h-4 w-20 animate-pulse rounded bg-gray-200 dark:bg-white/10"></div>
              <div class="h-4 w-24 animate-pulse rounded bg-gray-200 dark:bg-white/10"></div>
            </div>
          </div>
          <div class="border-b border-gray-100/90 px-4 py-3 dark:border-gray-800/80 sm:px-5">
            <div class="flex flex-wrap gap-2">
              <div class="h-9 flex-1 animate-pulse rounded-sm bg-gray-200 dark:bg-white/10 sm:max-w-xs"></div>
              <div class="h-9 w-24 animate-pulse rounded-sm bg-gray-200 dark:bg-white/10"></div>
            </div>
          </div>
          <div class="space-y-2.5 p-4 sm:p-5">
            <div v-for="i in 6" :key="i" class="flex gap-4">
              <div class="h-4 flex-1 animate-pulse rounded-sm bg-gray-200 dark:bg-white/10"></div>
              <div class="h-4 w-24 animate-pulse rounded-sm bg-gray-200 dark:bg-white/10"></div>
              <div class="h-4 w-20 animate-pulse rounded-sm bg-gray-200 dark:bg-white/10"></div>
            </div>
          </div>
        </div>
      </template>

      <template v-else>
        <div class="flex w-full min-h-0 flex-1 flex-col gap-5 sm:gap-6">
        <!-- Tabs -->
        <nav
          class="flex gap-8"
          aria-label="Sales views"
        >
      <button
        type="button"
        role="tab"
        :aria-selected="activeTab === 'receipts'"
        class="relative pb-2.5 text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/30 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-gray-900 rounded-t"
        :class="activeTab === 'receipts' ? 'text-gray-900 dark:text-gray-100 font-semibold' : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'"
        @click="activeTab = 'receipts'"
      >
        Receipts
        <span
          class="absolute bottom-0 left-0 right-0 h-0.5 rounded-full transition-opacity"
          :class="activeTab === 'receipts' ? 'bg-primary-500 opacity-100' : 'bg-transparent opacity-0'"
          aria-hidden="true"
        />
      </button>
      <button
        type="button"
        role="tab"
        :aria-selected="activeTab === 'outstanding'"
        class="relative pb-2.5 text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/30 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-gray-900 rounded-t"
        :class="activeTab === 'outstanding' ? 'text-gray-900 dark:text-gray-100 font-semibold' : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'"
        @click="activeTab = 'outstanding'"
      >
        Outstanding payments
        <span
          class="absolute bottom-0 left-0 right-0 h-0.5 rounded-full transition-opacity"
          :class="activeTab === 'outstanding' ? 'bg-primary-500 opacity-100' : 'bg-transparent opacity-0'"
          aria-hidden="true"
        />
      </button>
      <button
        type="button"
        role="tab"
        :aria-selected="activeTab === 'customers'"
        class="relative pb-2.5 text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/30 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-gray-900 rounded-t"
        :class="activeTab === 'customers' ? 'text-gray-900 dark:text-gray-100 font-semibold' : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'"
        @click="activeTab = 'customers'"
      >
        Customers
        <span
          class="absolute bottom-0 left-0 right-0 h-0.5 rounded-full transition-opacity"
          :class="activeTab === 'customers' ? 'bg-primary-500 opacity-100' : 'bg-transparent opacity-0'"
          aria-hidden="true"
        />
      </button>
    </nav>

    <!-- Receipts Tab Content -->
    <template v-if="activeTab === 'receipts'">
      <!-- Teleport fullscreen to body so position:fixed is not clipped by layout page transition (transform) -->
      <Teleport to="body" :disabled="!isReceiptsFullscreen">
      <!-- Receipts Table -->
      <div
        data-dashboard-teleport
        :class="[ 'transition-colors duration-200 ease-out', isReceiptsFullscreen ? 'fixed inset-0 z-[100] flex min-h-0 flex-col overflow-hidden bg-white dark:!bg-dashboard-card' : 'relative flex min-h-0 flex-1 flex-col', ]"
      >
      <!-- Fullscreen header -->
      <div
        v-if="isReceiptsFullscreen"
        class="shrink-0 border-b border-gray-200/80 bg-white/95 px-4 py-3 backdrop-blur-md dark:border-gray-800/80 dark:!bg-dashboard-card/95 sm:px-6 lg:px-8"
        style="padding-top: max(0.75rem, env(safe-area-inset-top, 0px))"
      >
        <div class="flex w-full flex-col gap-3 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
          <div class="flex min-w-0 items-start justify-between gap-3 lg:items-center">
            <div class="min-w-0">
              <p class="text-[10px] font-medium uppercase tracking-[0.14em] text-gray-400 dark:text-gray-500">
                Expanded view
              </p>
              <div class="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                <h2 class="text-base font-semibold tracking-tight text-gray-900 dark:text-gray-50 sm:text-lg">
                  Receipts
                </h2>
                <span class="text-xs tabular-nums text-gray-500 dark:text-gray-400">
                  {{ receipts.length }} in store · {{ formatCurrency(totalSales) }} completed · Today {{ formatCurrency(todaySales) }}
                  ({{ todayReceipts }}) · Month {{ formatCurrency(monthSales) }} ({{ monthReceipts }})
                </span>
              </div>
            </div>
            <button
              type="button"
              class="shrink-0 rounded-sm border border-transparent p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800/80 dark:hover:text-gray-100 lg:hidden"
              aria-label="Exit expanded view"
              @click="isReceiptsFullscreen = false"
            >
              <XMarkIcon class="h-5 w-5" />
            </button>
          </div>
          <div class="flex min-w-0 flex-1 flex-wrap items-center gap-2 lg:max-w-none lg:justify-end">
            <div class="relative min-w-0 w-full sm:max-w-[min(100%,20rem)] lg:w-56 lg:max-w-[16rem] lg:flex-initial">
              <MagnifyingGlassIcon
                class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500"
              />
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Search receipts..."
                class="w-full rounded-sm border border-gray-200/90 bg-white py-2 pl-10 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary-400/50 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-gray-700/80 dark:!bg-dashboard-card dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:border-primary-500/40"
              />
            </div>
            <div class="flex flex-wrap items-center gap-2">
              <select
                v-model="statusFilter"
                class="min-w-[7.5rem] cursor-pointer rounded-sm border border-gray-200/90 bg-white px-3 py-2 text-sm font-medium text-gray-800 focus:border-primary-400/50 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-gray-700/80 dark:!bg-dashboard-card dark:text-gray-200 dark:focus:border-primary-500/40"
              >
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="refunded">Refunded</option>
              </select>
              <select
                v-model="dateFilter"
                class="min-w-[7.5rem] cursor-pointer rounded-sm border border-gray-200/90 bg-white px-3 py-2 text-sm font-medium text-gray-800 focus:border-primary-400/50 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-gray-700/80 dark:!bg-dashboard-card dark:text-gray-200 dark:focus:border-primary-500/40"
              >
                <option value="all">All Dates</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
              </select>
              <button
                type="button"
                class="rounded-sm border border-gray-200/90 bg-white p-2 text-gray-500 transition-colors hover:bg-gray-50 dark:border-gray-700/80 dark:!bg-dashboard-card dark:text-gray-400 dark:hover:bg-gray-800"
                @click="resetFilters"
              >
                <ArrowPathIcon class="h-5 w-5" />
              </button>
              <button
                type="button"
                class="hidden rounded-sm border border-transparent p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800/80 dark:hover:text-gray-100 lg:inline-flex"
                aria-label="Exit expanded view"
                @click="isReceiptsFullscreen = false"
              >
                <XMarkIcon class="h-5 w-5" />
              </button>
              <Button
                v-if="canCreate"
                variant="primary"
                size="sm"
                :icon="PlusIcon"
                aria-label="New receipt"
                extra-class="!rounded-2xl ml-auto shrink-0 max-sm:!px-2 max-sm:!py-1.5"
                @click="openCreateReceiptModal"
              >
                <span class="hidden sm:inline">New receipt</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div
        :class="[ isReceiptsFullscreen ? 'flex min-h-0 flex-1 flex-col overflow-hidden' : 'data-table-shell flex min-h-[calc(100svh-20rem)] flex-1 flex-col border border-gray-200/60 !rounded-none shadow-none max-sm:!bg-transparent dark:border-gray-700/55 dark:max-sm:!bg-transparent sm:!rounded-2xl sm:shadow-sm sm:shadow-gray-950/[0.04] dark:sm:shadow-black/30', ]"
      >
        <!-- Toolbar: search + filters (left), primary action (right) -->
        <DataTableToolbar v-if="!receiptsStore.loading && !isReceiptsFullscreen">
          <template #heading>
            <div class="min-w-0 flex-1">
              <h2 class="text-[11px] font-semibold tracking-tight text-gray-900 dark:text-gray-50 sm:text-sm">
                Receipts
              </h2>
              <p class="mt-0.5 text-[10px] leading-snug text-gray-500 dark:text-gray-400 sm:text-[11px]">
                <span class="tabular-nums font-medium text-gray-600 dark:text-gray-300">{{ receipts.length }} in store</span>
                <span class="mx-1 text-gray-300 dark:text-gray-600">·</span>
                <span class="tabular-nums">{{ formatCurrency(totalSales) }} completed</span>
                <span class="mx-1 text-gray-300 dark:text-gray-600">·</span>
                <span class="tabular-nums">Today {{ formatCurrency(todaySales) }} ({{ todayReceipts }})</span>
                <span class="mx-1 text-gray-300 dark:text-gray-600">·</span>
                <span class="tabular-nums">Month {{ formatCurrency(monthSales) }} ({{ monthReceipts }})</span>
                <template v-if="sortedFilteredReceipts.length !== receipts.length">
                  <span class="mx-1 text-gray-300 dark:text-gray-600">·</span>
                  <span>{{ sortedFilteredReceipts.length }} shown</span>
                </template>
              </p>
            </div>
          </template>
          <template #filters>
            <div class="relative min-w-0 sm:min-w-0">
              <MagnifyingGlassIcon
                class="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400 dark:text-gray-500"
              />
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Search receipts..."
                class="w-full min-w-[9rem] rounded-sm border border-gray-200/90 bg-white py-1.5 pl-8 pr-2.5 text-xs text-gray-900 placeholder:text-gray-400 transition-colors focus:border-primary-400/50 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-gray-700/80 dark:!bg-dashboard-card dark:text-gray-100 dark:placeholder:text-gray-500 sm:w-48"
              />
            </div>
            <select
              v-model="statusFilter"
              class="min-w-[100px] cursor-pointer rounded-sm border border-gray-200/90 bg-white py-1.5 pl-2.5 pr-7 text-xs font-medium text-gray-800 transition-colors focus:border-primary-400/50 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-gray-700/80 dark:!bg-dashboard-card dark:text-gray-200 dark:focus:border-primary-500/40"
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="refunded">Refunded</option>
            </select>
            <select
              v-model="dateFilter"
              class="min-w-[100px] cursor-pointer rounded-sm border border-gray-200/90 bg-white py-1.5 pl-2.5 pr-7 text-xs font-medium text-gray-800 transition-colors focus:border-primary-400/50 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-gray-700/80 dark:!bg-dashboard-card dark:text-gray-200 dark:focus:border-primary-500/40"
            >
              <option value="all">All Dates</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
            <button
              type="button"
              class="rounded-sm p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-gray-800/80 dark:hover:text-gray-200"
              @click="resetFilters"
            >
              <ArrowPathIcon class="h-4 w-4" />
            </button>
            <button
              type="button"
              class="hidden rounded-sm p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-gray-800/80 dark:hover:text-gray-200 lg:inline-flex"
              @click="isReceiptsFullscreen = !isReceiptsFullscreen"
            >
              <ArrowsPointingOutIcon v-if="!isReceiptsFullscreen" class="h-4 w-4" />
              <XMarkIcon v-else class="h-4 w-4" />
            </button>
          </template>
          <template #actions>
            <Button
              v-if="canCreate"
              variant="primary"
              size="sm"
              :icon="PlusIcon"
              aria-label="New receipt"
              extra-class="!rounded-2xl shrink-0 max-sm:!px-2 max-sm:!py-1.5"
              @click="openCreateReceiptModal"
            >
              <span class="hidden sm:inline">New receipt</span>
            </Button>
          </template>
        </DataTableToolbar>
        <!-- Bulk actions (receipts) -->
        <div
          v-if="canDeleteReceipts && selectedReceiptsForBulk.length > 0"
          class="flex flex-wrap items-center gap-2 border-b border-gray-100/90 bg-gray-50/80 px-3 py-2 dark:border-gray-800/80 dark:!bg-dashboard-card/30 sm:px-5"
        >
          <span class="text-xs font-medium text-gray-700 dark:text-gray-300">{{ selectedReceiptsForBulk.length }} selected</span>
          <Button
            variant="outline"
            size="sm"
            :icon="TrashIcon"
            class="!rounded-2xl !px-2.5 !py-1.5 !text-xs !border-gray-200/80 dark:!border-gray-700/80 !text-gray-600 dark:!text-gray-300 hover:!text-red-600 dark:hover:!text-red-400 hover:!border-red-200/80 dark:hover:!border-red-800/50 hover:!bg-red-50/60 dark:hover:!bg-red-900/10"
            @click="openBulkDeleteReceiptsModal"
          >
            Delete
          </Button>
      </div>
      <!-- Table Loading Skeleton -->
      <div
        v-if="receiptsStore.loading"
        :class="isReceiptsFullscreen ? 'min-h-0 flex-1 overflow-y-auto px-4 pb-4 lg:px-8' : 'min-h-0 flex-1 overflow-x-auto'"
      >
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:!bg-dashboard-card/85">
            <tr>
              <th v-for="i in 6" :key="i" class="px-3 py-2">
                <div class="h-3 bg-gray-200 dark:bg-white/10 rounded-sm w-20 animate-pulse"></div>
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:!bg-dashboard-card">
            <tr v-for="i in 5" :key="i">
              <td v-for="j in 6" :key="j" class="px-3 py-3">
                <div class="h-4 bg-gray-200 dark:bg-white/10 rounded-sm w-full animate-pulse"></div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <!-- Standalone empty state (same styling as customers empty state, no button) -->
      <div
        v-else-if="sortedFilteredReceipts.length === 0"
        class="flex w-full min-w-0 flex-col items-center justify-center px-4 py-14 text-center sm:px-6"
        :class="isReceiptsFullscreen ? 'min-h-0 flex-1 justify-center' : 'min-h-[min(50vh,22rem)] sm:min-h-[min(45vh,20rem)]'"
      >
        <div
          class="mb-3 flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-sm bg-gray-100 ring-1 ring-gray-200/80 dark:bg-gray-800/80 dark:ring-gray-700/60"
        >
          <ReceiptPercentIcon class="h-7 w-7 text-gray-500 dark:text-gray-400" stroke-width="1.5" />
        </div>
        <h3 class="max-w-full break-words text-sm font-semibold tracking-tight text-gray-900 dark:text-gray-100">
          {{ searchQuery || statusFilter !== 'all' || dateFilter !== 'all' ? 'No receipts found' : 'No receipts yet' }}
        </h3>
        <p class="mx-auto mt-1 max-w-sm break-words text-xs text-gray-500 dark:text-gray-400">
          {{ searchQuery || statusFilter !== 'all' || dateFilter !== 'all' ? 'Try adjusting your search or filters' : 'Create your first receipt to get started' }}
        </p>
      </div>
      <template v-else>
      <div :class="isReceiptsFullscreen ? 'flex min-h-0 flex-1 flex-col overflow-hidden' : 'contents'">
      <!-- Mobile: card list (no horizontal scroll) -->
      <div
        class="space-y-2 sm:hidden"
        :class="isReceiptsFullscreen ? 'min-h-0 flex-1 overflow-y-auto px-4 pb-4 lg:px-8' : 'block px-0'"
      >
        <div
          v-for="receipt in paginatedReceipts"
          :key="receipt.id"
          :data-receipt-row="receipt.id"
          :data-receipt-flash="flashReceiptId === receipt.id ? '' : undefined"
          class="rounded-lg border border-gray-200/60 bg-white p-2.5 shadow-none dark:border-gray-700/55 dark:!bg-dashboard-card"
          :class="flashReceiptId === receipt.id ? '!ring-2 !ring-primary-500/25 ring-offset-2 ring-offset-white dark:bg-gray-800/75 dark:!ring-offset-gray-900' : ''"
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
                  <span class="text-[11px] font-semibold text-gray-900 dark:text-gray-100">{{ receipt.receiptNumber }}</span>
                  <button
                    @click.stop="copyReceiptNumber(receipt.receiptNumber)"
                    class="p-0.5 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400"
                    aria-label="Copy receipt number"
                  >
                    <ClipboardDocumentIcon class="w-3.5 h-3.5" stroke-width="1.5" />
                  </button>
                  <span
                    v-if="receipt.isSwapIn"
                    class="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide bg-sky-500/12 text-sky-800 ring-1 ring-inset ring-sky-500/18 dark:bg-sky-400/12 dark:text-sky-300 dark:ring-sky-400/25"
                  >
                    Swap
                  </span>
                </div>
                <p class="mt-0.5 text-[10px] leading-snug text-gray-600 dark:text-gray-400">
                  <span class="line-clamp-2">{{ receipt.customerName }}</span>
                  <span v-if="receipt.customerEmail" class="block truncate text-[9px] text-gray-500 dark:text-gray-500">{{ receipt.customerEmail }}</span>
                  <span v-if="receipt.customerPhone" class="block tabular-nums text-[9px] text-gray-500 dark:text-gray-500">{{ receipt.customerPhone }}</span>
                </p>
                <p class="mt-0.5 text-[9px] text-gray-500 dark:text-gray-500">{{ formatDate(receipt.date) }}</p>
                <div class="mt-1.5 rounded-lg border border-gray-200/70 bg-gray-50/90 px-2 py-1.5 dark:border-gray-700/60 dark:bg-gray-900/45">
                  <p class="text-[9px] font-medium text-gray-800 dark:text-gray-200">
                    {{ getReceiptLineItemsCount(receipt) }} item{{ getReceiptLineItemsCount(receipt) === 1 ? '' : 's' }}
                  </p>
                  <p v-if="getReceiptLineItemsPreview(receipt)" class="mt-0.5 line-clamp-2 text-[9px] leading-snug text-gray-600 dark:text-gray-400">
                    {{ getReceiptLineItemsPreview(receipt) }}
                  </p>
                  <button
                    type="button"
                    class="mt-1 inline-flex items-center gap-1 rounded-lg border border-transparent bg-gray-100/95 px-2 py-0.5 text-[11px] font-medium text-primary-700 transition-colors hover:border-primary-200/80 hover:bg-primary-50/90 dark:bg-gray-800/70 dark:text-primary-300 dark:hover:border-primary-500/35 dark:hover:bg-primary-500/10"
                    @click.stop="toggleReceiptLineItemsExpand(receipt.id)"
                  >
                    <ChevronDownIcon
                      class="h-3.5 w-3.5 shrink-0 transition-transform duration-200"
                      :class="expandedReceiptLineItems[receipt.id] ? 'rotate-180' : ''"
                      stroke-width="2"
                    />
                    {{ expandedReceiptLineItems[receipt.id] ? 'Hide' : 'Show' }} item details
                  </button>
                  <div v-if="expandedReceiptLineItems[receipt.id]" class="mt-2 border-t border-gray-200/70 pt-2 dark:border-gray-700/70">
                    <ReceiptTableLineItems
                      :items="receipt.items"
                      :items-count-fallback="receipt.itemsCount"
                      compact
                    />
                  </div>
                </div>
                <div class="mt-1.5 flex items-center justify-between gap-2">
                  <span class="text-xs font-semibold tabular-nums text-gray-900 dark:text-gray-100">{{ formatCurrency(receipt.total) }}</span>
                  <span
                    :class="[ 'inline-flex shrink-0 items-center rounded-full px-1.5 py-0.5 text-[9px] font-semibold tracking-wide ring-1 ring-inset', receipt.status === 'completed' ? 'bg-emerald-500/12 text-emerald-900 ring-emerald-500/20 dark:bg-emerald-400/14 dark:text-emerald-100 dark:ring-emerald-400/30' : receipt.status === 'pending' ? 'bg-amber-500/14 text-amber-950 ring-amber-500/22 dark:bg-amber-400/14 dark:text-amber-50 dark:ring-amber-400/28' : 'bg-rose-500/12 text-rose-950 ring-rose-500/22 dark:bg-rose-400/14 dark:text-rose-50 dark:ring-rose-400/28', ]"
                  >
                    {{ receipt.status.charAt(0).toUpperCase() + receipt.status.slice(1) }}
                  </span>
                </div>
              </div>
            </div>
            <div class="relative shrink-0" data-receipt-menu @click.stop>
              <button
                type="button"
                :data-receipt-actions-anchor="receipt.id"
                @click="toggleReceiptMenu(receipt.id)"
                class="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800/85 dark:hover:text-gray-100"
                aria-label="Receipt actions"
                aria-haspopup="menu"
                :aria-expanded="openReceiptMenuId === receipt.id"
              >
                <EllipsisVerticalIcon class="w-4 h-4" stroke-width="2" />
              </button>
            </div>
          </div>
        </div>
      </div>
      <!-- Desktop: table -->
      <div
        class="hidden sm:block"
        :class="isReceiptsFullscreen ? 'min-h-0 flex-1 overflow-auto px-4 pb-2 pt-2 lg:px-8' : 'overflow-x-auto px-0.5 pb-px'"
      >
        <table class="w-full min-w-full border-separate border-spacing-0">
          <thead
            class="border-b border-gray-200/45 bg-gray-50/80 backdrop-blur-[6px] dark:border-gray-800/50 dark:!bg-dashboard-card/75 supports-[backdrop-filter]:bg-gray-50/65 dark:supports-[backdrop-filter]:!bg-dashboard-card/65"
            :class="isReceiptsFullscreen ? 'sticky top-0 z-10 backdrop-blur-md bg-white/90 dark:!bg-dashboard-card/92 supports-[backdrop-filter]:bg-white/75 dark:supports-[backdrop-filter]:!bg-dashboard-card/80' : ''"
          >
            <tr>
              <th v-if="canDeleteReceipts" class="w-10 rounded-tl-2xl px-4 py-2 text-center text-[11px] font-medium text-gray-500 dark:text-gray-400 sm:px-5">
                <Checkbox
                  :model-value="paginatedReceipts.length > 0 && selectedReceiptsForBulk.length === paginatedReceipts.length"
                  @update:model-value="toggleSelectAllReceipts"
                  size="sm"
                  wrapper-class="justify-center"
                />
              </th>
              <th
                :class="[ 'px-4 py-2 text-left text-[11px] font-medium capitalize tracking-normal text-gray-500 dark:text-gray-400 sm:px-5', !canDeleteReceipts && 'rounded-tl-2xl', isColumnSortable('receiptNumber') && 'cursor-pointer hover:text-gray-900 dark:hover:text-gray-100' ]"
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
                :class="[ 'px-4 py-2 text-left text-[11px] font-medium capitalize tracking-normal text-gray-500 dark:text-gray-400 sm:px-5', isColumnSortable('customerName') && 'cursor-pointer hover:text-gray-900 dark:hover:text-gray-100' ]"
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
                :class="[ 'px-4 py-2 text-left text-[11px] font-medium capitalize tracking-normal text-gray-500 dark:text-gray-400 sm:px-5', isColumnSortable('date') && 'cursor-pointer hover:text-gray-900 dark:hover:text-gray-100' ]"
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
                :class="[ 'min-w-[10rem] max-w-[18rem] px-4 py-2 text-left text-[11px] font-medium capitalize tracking-normal text-gray-500 dark:text-gray-400 sm:px-5', isColumnSortable('itemsCount') && 'cursor-pointer hover:text-gray-900 dark:hover:text-gray-100' ]"
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
                :class="[ 'px-4 py-2 text-left text-[11px] font-medium capitalize tracking-normal text-gray-500 dark:text-gray-400 sm:px-5', isColumnSortable('total') && 'cursor-pointer hover:text-gray-900 dark:hover:text-gray-100' ]"
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
                :class="[ 'px-4 py-2 text-left text-[11px] font-medium capitalize tracking-normal text-gray-500 dark:text-gray-400 sm:px-5', isColumnSortable('paymentMethod') && 'cursor-pointer hover:text-gray-900 dark:hover:text-gray-100' ]"
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
                :class="[ 'px-4 py-2 text-left text-[11px] font-medium capitalize tracking-normal text-gray-500 dark:text-gray-400 sm:px-5', isColumnSortable('status') && 'cursor-pointer hover:text-gray-900 dark:hover:text-gray-100' ]"
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
                :class="[ 'px-4 py-2 text-left text-[11px] font-medium capitalize tracking-normal text-gray-500 dark:text-gray-400 sm:px-5', isColumnSortable('createdBy') && 'cursor-pointer hover:text-gray-900 dark:hover:text-gray-100' ]"
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
              <th
                class="w-12 rounded-tr-2xl px-4 py-2 text-right text-[11px] font-medium capitalize tracking-normal text-gray-500 dark:text-gray-400 sm:w-[4.5rem] sm:px-5"
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100/80 bg-white dark:divide-gray-800/55 dark:!bg-dashboard-card/40">
            <template v-for="receipt in paginatedReceipts" :key="receipt.id">
            <tr
              :data-receipt-row="receipt.id"
              :data-receipt-flash="flashReceiptId === receipt.id ? '' : undefined"
              class="transition-colors duration-200 ease-out hover:bg-gray-50/90 dark:hover:bg-gray-800/35"
              :class="flashReceiptId === receipt.id ? '!bg-primary-500/[0.08] hover:!bg-primary-500/[0.1] dark:!bg-primary-500/15 dark:hover:!bg-primary-500/[0.18]' : ''"
            >
              <td v-if="canDeleteReceipts" class="w-10 px-4 py-2 text-center align-middle sm:px-5">
                <Checkbox
                  :model-value="selectedReceiptsForBulk.some(r => r.id === receipt.id)"
                  @update:model-value="(checked) => toggleReceiptSelection(receipt, checked)"
                  size="sm"
                  wrapper-class="justify-center"
                  @click.stop
                />
              </td>
              <td class="px-4 py-2 align-middle sm:px-5">
                <div class="flex flex-wrap items-center gap-1.5">
                  <div class="text-sm font-medium tabular-nums tracking-tight text-gray-900 dark:text-gray-50">
                    {{ receipt.receiptNumber }}
                  </div>
                  <button
                    type="button"
                    @click.stop="copyReceiptNumber(receipt.receiptNumber)"
                    class="rounded-md p-0.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-primary-600 dark:hover:bg-gray-800/90 dark:hover:text-primary-400"
                  >
                    <ClipboardDocumentIcon class="w-3.5 h-3.5" stroke-width="1.5" />
                  </button>
                  <span
                    v-if="receipt.isSwapIn"
                    class="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide bg-sky-500/12 text-sky-800 ring-1 ring-inset ring-sky-500/18 dark:bg-sky-400/12 dark:text-sky-300 dark:ring-sky-400/25"
                    title="Swap-in transaction"
                  >
                    Swap
                  </span>
                </div>
              </td>
              <td class="px-4 py-2 align-middle sm:px-5">
                <div class="text-sm font-medium leading-snug text-gray-900 dark:text-gray-50">
                  {{ receipt.customerName }}
                </div>
                <div v-if="receipt.customerPhone" class="mt-0.5 text-xs text-gray-500 dark:text-gray-400 tabular-nums">
                  {{ receipt.customerPhone }}
                </div>
                <div v-else-if="receipt.customerEmail" class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                  {{ receipt.customerEmail }}
                </div>
              </td>
              <td class="px-4 py-2 align-middle sm:px-5">
                <div class="text-sm tabular-nums text-gray-600 dark:text-gray-300">
                  {{ formatDate(receipt.date) }}
                </div>
              </td>
              <td class="min-w-[10rem] max-w-[20rem] px-4 py-2 align-top sm:px-5">
                <div class="space-y-1">
                  <p class="text-sm font-medium tabular-nums text-gray-900 dark:text-gray-50">
                    {{ getReceiptLineItemsCount(receipt) }} item{{ getReceiptLineItemsCount(receipt) === 1 ? '' : 's' }}
                  </p>
                  <p
                    v-if="getReceiptLineItemsPreview(receipt)"
                    class="text-xs leading-relaxed text-gray-600 dark:text-gray-400 line-clamp-2"
                  >
                    {{ getReceiptLineItemsPreview(receipt) }}
                  </p>
                  <p v-else-if="getReceiptLineItemsCount(receipt) > 0" class="text-xs text-gray-500 dark:text-gray-500">-</p>
                  <button
                    type="button"
                    class="inline-flex items-center gap-1 rounded-lg border border-transparent bg-gray-100/95 px-2 py-0.5 text-xs font-medium text-primary-700 transition-colors hover:border-primary-200/80 hover:bg-primary-50/90 dark:bg-gray-800/70 dark:text-primary-300 dark:hover:border-primary-500/35 dark:hover:bg-primary-500/10"
                    :aria-expanded="!!expandedReceiptLineItems[receipt.id]"
                    @click.stop="toggleReceiptLineItemsExpand(receipt.id)"
                  >
                    <ChevronDownIcon
                      class="h-3.5 w-3.5 shrink-0 transition-transform duration-200"
                      :class="expandedReceiptLineItems[receipt.id] ? 'rotate-180' : ''"
                      stroke-width="2"
                    />
                    {{ expandedReceiptLineItems[receipt.id] ? 'Hide' : 'Show' }} line details
                  </button>
                </div>
              </td>
              <td class="px-4 py-2 align-middle sm:px-5">
                <span class="text-sm font-semibold tabular-nums tracking-tight text-gray-900 dark:text-gray-50">
                  {{ formatCurrency(receipt.total) }}
                </span>
              </td>
              <td class="px-4 py-2 align-middle sm:px-5">
                <span class="text-sm text-gray-700 dark:text-gray-300">
                  {{ receipt.paymentMethod }}
                </span>
              </td>
              <td class="px-4 py-2 align-middle sm:px-5">
                <span
                  :class="[ 'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide shadow-sm shadow-gray-950/[0.03] ring-1 ring-inset dark:shadow-transparent', receipt.status === 'completed' ? 'bg-emerald-500/[0.12] text-emerald-900 ring-emerald-500/[0.2] dark:bg-emerald-400/14 dark:text-emerald-100 dark:ring-emerald-400/30' : receipt.status === 'pending' ? 'bg-amber-500/[0.14] text-amber-950 ring-amber-500/22 dark:bg-amber-400/14 dark:text-amber-50 dark:ring-amber-400/28' : 'bg-rose-500/[0.12] text-rose-950 ring-rose-500/[0.22] dark:bg-rose-400/14 dark:text-rose-50 dark:ring-rose-400/28', ]"
                >
                  {{ receipt.status.charAt(0).toUpperCase() + receipt.status.slice(1) }}
                </span>
              </td>
              <td class="px-4 py-2 align-middle sm:px-5">
                <div class="text-sm text-gray-600 dark:text-gray-300">
                  {{ receipt.createdByUserName || getCreatorName(receipt.actualCreator || receipt.createdBy) }}
                </div>
              </td>
              <td class="px-4 py-2 text-right align-middle sm:px-5">
                <div class="relative inline-flex justify-end" data-receipt-menu @click.stop>
                  <button
                    type="button"
                    :data-receipt-actions-anchor="receipt.id"
                    @click="toggleReceiptMenu(receipt.id)"
                    class="inline-flex h-8 w-8 items-center justify-center rounded-xl text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800/85 dark:hover:text-gray-100"
                    aria-label="Receipt actions"
                    aria-haspopup="menu"
                    :aria-expanded="openReceiptMenuId === receipt.id"
                  >
                    <EllipsisVerticalIcon class="w-4 h-4" stroke-width="2" />
                  </button>
                </div>
              </td>
            </tr>
            <tr
              v-if="expandedReceiptLineItems[receipt.id]"
              class="bg-gradient-to-b from-gray-50/90 to-gray-50/35 dark:from-gray-950/55 dark:to-gray-950/20"
            >
              <td
                :colspan="receiptLineItemsDetailColspan"
                class="px-4 py-2 sm:px-5"
              >
                <div class="rounded-xl border border-gray-200/70 bg-white/95 px-3 py-2 shadow-sm shadow-gray-950/[0.03] backdrop-blur-[2px] dark:border-gray-700/65 dark:bg-gray-900/50 dark:shadow-black/35">
                  <div class="mb-2 flex items-center justify-between gap-2">
                    <p class="text-[11px] font-semibold tracking-wide text-gray-600 dark:text-gray-400">
                      Line item details
                    </p>
                    <span class="rounded-lg bg-gray-100/95 px-2 py-0.5 text-[10px] font-medium tabular-nums text-gray-700 ring-1 ring-gray-200/80 dark:bg-gray-800/90 dark:text-gray-200 dark:ring-gray-600/65">
                      {{ receipt.receiptNumber }}
                    </span>
                  </div>
                  <ReceiptTableLineItems
                    :items="receipt.items"
                    :items-count-fallback="receipt.itemsCount"
                  />
                </div>
              </td>
            </tr>
            </template>
          </tbody>
        </table>
      </div>
      </div>
      </template>

      <!-- Fullscreen: pagination pinned inside overlay (fills viewport with table + footer) -->
      <div
        v-if="isReceiptsFullscreen && sortedFilteredReceipts.length > 0"
        class="shrink-0 border-t border-gray-200/25 bg-gray-100/95 backdrop-blur-sm dark:border-white/[0.05] dark:bg-[#07080c]/95 dark:backdrop-blur-sm"
        style="padding-bottom: env(safe-area-inset-bottom, 0px)"
      >
        <div
          class="w-full min-w-0 max-w-full overflow-x-hidden px-3 py-1 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] sm:px-5 sm:py-1.5 lg:px-7"
        >
          <Pagination
            :current-page="currentPage"
            :items-per-page="itemsPerPage"
            :total="sortedFilteredReceipts.length"
            @page-change="handlePageChange"
          />
        </div>
      </div>
      </div>
    </div>
      </Teleport>

    <DashboardFixedFooter
      v-if="sortedFilteredReceipts.length > 0 && !isReceiptsFullscreen"
      :sidebar-collapsed="sidebarCollapsed"
    >
      <Pagination
        :current-page="currentPage"
        :items-per-page="itemsPerPage"
        :total="sortedFilteredReceipts.length"
        @page-change="handlePageChange"
      />
    </DashboardFixedFooter>

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
            <div class="w-8 h-8 rounded-sm bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <TrashIcon class="w-4 h-4 text-red-600 dark:text-red-400" />
            </div>
            <div class="min-w-0">
              <h3 class="text-sm font-semibold text-gray-900 dark:text-gray-100">Delete selected receipts</h3>
              <p class="text-xs text-gray-500 dark:text-gray-400">{{ selectedReceiptsForBulk.length }} receipt{{ selectedReceiptsForBulk.length !== 1 ? 's' : '' }} selected</p>
            </div>
          </div>
        </template>
        <div class="space-y-3">
          <div class="p-3 bg-red-50 dark:bg-red-900/20 ring-1 ring-red-200/50 dark:ring-red-800/40 rounded-sm">
            <p class="text-xs text-red-800 dark:text-red-200">This will permanently delete the selected receipts. This action cannot be undone. Associated customer data may be affected.</p>
          </div>
          <div class="rounded-sm bg-gray-50 p-2.5 dark:!bg-dashboard-card/35">
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
          <Button variant="outline" size="sm" @click="showBulkDeleteReceiptsModal = false; bulkDeleteReceiptsConfirmed = false" class="!rounded-2xl">Cancel</Button>
          <Button
            variant="danger"
            size="sm"
            :disabled="!bulkDeleteReceiptsConfirmed || isBulkDeletingReceipts"
            :icon="TrashIcon"
            class="!rounded-2xl"
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

    <!-- Outstanding payments tab -->
    <template v-if="activeTab === 'outstanding'">
      <div class="data-table-shell flex min-h-0 flex-1 flex-col">
        <DataTableToolbar v-if="!receiptsStore.loading">
          <template #heading>
            <div class="min-w-0 flex-1">
              <h2 class="text-xs font-semibold tracking-tight text-gray-900 dark:text-gray-50 sm:text-sm">
                Outstanding payments
              </h2>
              <p class="mt-0.5 text-[11px] text-gray-500 dark:text-gray-400">
                <span class="tabular-nums font-medium text-gray-600 dark:text-gray-300">{{ outstandingReceipts.length }} open</span>
                <span class="mx-1 text-gray-300 dark:text-gray-600">·</span>
                <span class="tabular-nums">{{ formatCurrency(outstandingTotalBalance) }} balance due</span>
              </p>
            </div>
          </template>
        </DataTableToolbar>
        <div
          v-if="outstandingReceipts.length === 0 && !receiptsStore.loading"
          class="flex flex-1 flex-col items-center justify-center px-4 py-16 text-center"
        >
          <p class="text-sm text-gray-500 dark:text-gray-400">No outstanding payments for this branch.</p>
        </div>
        <div v-else class="overflow-x-auto">
          <table class="w-full min-w-[640px] text-left text-xs">
            <thead class="border-b border-gray-200/80 text-[10px] font-medium uppercase tracking-wide text-gray-500 dark:border-gray-800 dark:text-gray-400">
              <tr>
                <th class="px-4 py-2.5 sm:px-5">Receipt</th>
                <th class="px-4 py-2.5">Customer</th>
                <th class="px-4 py-2.5 text-right">Total</th>
                <th class="px-4 py-2.5 text-right">Paid</th>
                <th class="px-4 py-2.5 text-right">Balance</th>
                <th class="px-4 py-2.5 sm:px-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 dark:divide-gray-800/80">
              <tr
                v-for="receipt in outstandingReceipts"
                :key="receipt.id"
                class="hover:bg-gray-50/80 dark:hover:bg-gray-800/30"
              >
                <td class="px-4 py-3 font-medium text-gray-900 dark:text-gray-100 sm:px-5">{{ receipt.receiptNumber }}</td>
                <td class="px-4 py-3 text-gray-700 dark:text-gray-300">{{ receipt.customerName }}</td>
                <td class="px-4 py-3 text-right tabular-nums">{{ formatCurrency(receipt.total) }}</td>
                <td class="px-4 py-3 text-right tabular-nums">{{ formatCurrency(outstandingAmountPaid(receipt)) }}</td>
                <td class="px-4 py-3 text-right tabular-nums font-medium text-amber-800 dark:text-amber-200">
                  {{ formatCurrency(outstandingBalanceDue(receipt)) }}
                </td>
                <td class="px-4 py-3 text-right sm:px-5">
                  <button
                    type="button"
                    class="rounded-sm bg-primary-600 px-3 py-1.5 text-[11px] font-medium text-white hover:bg-primary-500"
                    @click="openRecordPayment(receipt)"
                  >
                    Record payment
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <RecordPaymentModal
        v-model="showRecordPaymentModal"
        :receipt="receiptForPayment"
        @recorded="handlePaymentRecorded"
      />
    </template>

    <!-- Customers tab -->
    <template v-if="activeTab === 'customers'">
      <div
        class="data-table-shell"
      >
        <DataTableToolbar v-if="!receiptsStore.loading">
          <template #heading>
            <div class="min-w-0 flex-1">
              <h2 class="text-xs font-semibold tracking-tight text-gray-900 dark:text-gray-50 sm:text-sm">
                Customers
              </h2>
              <p class="mt-0.5 text-[11px] text-gray-500 dark:text-gray-400">
                <span class="tabular-nums font-medium text-gray-600 dark:text-gray-300">{{ uniqueCustomers.length }} customers</span>
                <span class="mx-1 text-gray-300 dark:text-gray-600">·</span>
                <span class="tabular-nums">{{ formatCurrency(customersTotalRevenue) }} lifetime revenue</span>
                <span class="mx-1 text-gray-300 dark:text-gray-600">·</span>
                <span class="tabular-nums">{{ formatCurrency(customersAverageOrderValue) }} avg order</span>
                <span class="mx-1 text-gray-300 dark:text-gray-600">·</span>
                <span class="tabular-nums">{{ customersTotalOrders }} orders</span>
                <template v-if="customersSearchQuery.trim() && filteredCustomers.length !== uniqueCustomers.length">
                  <span class="mx-1 text-gray-300 dark:text-gray-600">·</span>
                  <span>{{ filteredCustomers.length }} shown</span>
                </template>
                <template v-if="uniqueCustomers.length > 0">
                  <span class="mx-1 text-gray-300 dark:text-gray-600">·</span>
                  <span>Expand a row for receipts</span>
                </template>
              </p>
            </div>
          </template>
          <template #filters>
            <div class="relative min-w-0 flex-1 sm:min-w-[160px] sm:flex-initial">
              <MagnifyingGlassIcon
                class="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400 dark:text-gray-500"
              />
              <input
                v-model="customersSearchQuery"
                type="text"
                placeholder="Search customers..."
                class="w-full rounded-sm border border-gray-200/90 bg-white py-1.5 pl-8 pr-2.5 text-xs text-gray-900 placeholder:text-gray-400 transition-colors focus:border-primary-400/50 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-gray-700/80 dark:!bg-dashboard-card dark:text-gray-100 dark:placeholder:text-gray-500"
              />
            </div>
            <select
              v-model="customersSortBy"
              class="min-w-[100px] cursor-pointer rounded-sm border border-gray-200/90 bg-white py-1.5 pl-2.5 pr-7 text-xs font-medium text-gray-800 transition-colors focus:border-primary-400/50 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-gray-700/80 dark:!bg-dashboard-card dark:text-gray-200 dark:focus:border-primary-500/40"
            >
              <option value="name">Name</option>
              <option value="orders">Orders</option>
              <option value="spent">Total Spent</option>
              <option value="lastOrder">Last Order</option>
            </select>
          </template>
        </DataTableToolbar>
        <div v-if="receiptsStore.loading" class="px-4 py-12 sm:px-6">
          <div class="space-y-3">
            <div v-for="i in 5" :key="i" class="flex items-center gap-3">
              <div class="h-9 w-9 shrink-0 animate-pulse rounded-sm bg-gray-200 dark:bg-white/10"></div>
              <div class="min-w-0 flex-1 space-y-2">
                <div class="h-3 w-1/3 animate-pulse rounded bg-gray-200 dark:bg-white/10"></div>
                <div class="h-3 w-2/3 animate-pulse rounded bg-gray-200 dark:bg-white/10"></div>
              </div>
            </div>
          </div>
        </div>
        <div
          v-else-if="filteredCustomers.length === 0"
          class="flex min-h-[min(50vh,22rem)] w-full min-w-0 flex-col items-center justify-center px-4 py-14 text-center sm:min-h-[min(45vh,20rem)] sm:px-6"
        >
          <div
            class="mb-3 flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-sm bg-gray-100 ring-1 ring-gray-200/80 dark:bg-gray-800/80 dark:ring-gray-700/60"
          >
            <UsersIcon class="h-7 w-7 text-gray-500 dark:text-gray-400" stroke-width="1.5" />
          </div>
          <h3 class="max-w-full break-words text-sm font-semibold tracking-tight text-gray-900 dark:text-gray-100">
            {{ customersSearchQuery ? 'No customers found' : 'No customers yet' }}
          </h3>
          <p class="mx-auto mt-1 max-w-sm break-words text-xs text-gray-500 dark:text-gray-400">
            {{ customersSearchQuery ? 'Try adjusting your search' : 'Customers will appear here once you create receipts' }}
          </p>
        </div>
        <div v-else class="overflow-x-auto">
          <table class="min-w-full border-separate border-spacing-0">
            <thead class="border-b border-gray-200/90 bg-gray-50/95 dark:border-gray-800/80 dark:!bg-dashboard-card/90">
              <tr>
                <th class="min-w-[90px] px-3 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400 sm:min-w-[100px] sm:px-4">
                  Receipts
                </th>
                <th class="px-3 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400 sm:px-4">Customer</th>
                <th class="px-3 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400 sm:px-4">Contact</th>
                <th class="px-3 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400 sm:px-4">Orders</th>
                <th class="px-3 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400 sm:px-4">Total Spent</th>
                <th class="px-3 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400 sm:px-4">Last Order</th>
                <th class="w-12 px-3 py-3 text-right text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400 sm:w-[4.5rem] sm:px-4">Actions</th>
              </tr>
            </thead>
            <tbody class="bg-white dark:!bg-dashboard-card/35">
              <template v-for="customer in paginatedCustomers" :key="customer.id">
                <tr
                  class="border-b border-gray-100/90 transition-colors duration-300 even:bg-gray-50/40 hover:bg-gray-50/95 dark:border-gray-800/70 dark:even:bg-gray-900/25 dark:hover:bg-gray-900/70"
                >
                  <td class="px-3 py-2.5 align-middle sm:px-4">
                    <button
                      @click="toggleCustomerExpanded(customer.id)"
                      type="button"
                      :class="[ 'group inline-flex items-center gap-1 rounded-sm px-1 py-0.5 text-[11px] font-medium transition-colors', 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/35 focus-visible:ring-offset-1 focus-visible:ring-offset-white dark:focus-visible:ring-offset-gray-900', expandedCustomers[customer.id] ? 'text-primary-600 dark:text-primary-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100', ]"
                    >
                      <ChevronRightIcon
                        :class="[ 'w-3.5 h-3.5 shrink-0 transition-transform duration-200', expandedCustomers[customer.id] ? 'rotate-90' : '', !expandedCustomers[customer.id] && 'text-gray-400 group-hover:text-gray-600 dark:text-gray-500 dark:group-hover:text-gray-300', ]"
                      />
                      <span>{{ expandedCustomers[customer.id] ? 'Hide' : 'View' }}</span>
                    </button>
                  </td>
                  <td class="px-3 py-2.5 sm:px-4">
                    <div class="flex items-center gap-2">
                      <span class="text-[10px] font-medium text-gray-900 dark:text-gray-100">{{ customer.name }}</span>
                    </div>
                  </td>
                  <td class="px-3 py-2.5 sm:px-4">
                    <div class="space-y-0.5">
                      <p v-if="customer.email" class="text-[10px] text-gray-600 dark:text-gray-300 truncate">{{ customer.email }}</p>
                      <p v-if="customer.phone" class="text-[10px] text-gray-600 dark:text-gray-300 truncate">{{ customer.phone }}</p>
                      <p v-if="!customer.email && !customer.phone" class="text-[10px] text-gray-400 dark:text-gray-500">-</p>
                    </div>
                  </td>
                  <td class="px-3 py-2.5 sm:px-4">
                    <span class="text-[10px] text-gray-600 dark:text-gray-300">{{ customer.receipts.length }}</span>
                  </td>
                  <td class="px-3 py-2.5 sm:px-4">
                    <span class="text-[10px] font-semibold text-gray-900 dark:text-gray-100">{{ formatCurrency(customer.totalSpent) }}</span>
                  </td>
                  <td class="px-3 py-2.5 sm:px-4">
                    <span class="text-[10px] text-gray-600 dark:text-gray-300">{{ formatDate(customer.lastOrderDate) }}</span>
                  </td>
                  <td class="px-3 py-2.5 sm:px-4 text-right">
                    <div class="relative inline-flex justify-end" data-customer-menu @click.stop>
                      <button
                        type="button"
                        :data-customer-actions-anchor="customer.id"
                        @click="toggleCustomerMenu(customer.id)"
                        class="inline-flex h-8 w-8 items-center justify-center rounded-xl text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700/80 dark:hover:text-gray-200"
                        aria-label="Customer actions"
                        aria-haspopup="menu"
                        :aria-expanded="openCustomerMenuId === customer.id"
                      >
                        <EllipsisVerticalIcon class="w-4 h-4" stroke-width="2" />
                      </button>
                    </div>
                  </td>
                </tr>
                <tr v-if="expandedCustomers[customer.id]" class="bg-gray-50/80 dark:bg-gray-800/60">
                  <td colspan="7" class="px-3 py-2.5 sm:px-4">
                    <p class="text-[10px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
                      Purchased items
                    </p>
                    <div
                      class="rounded-sm bg-white/90 dark:!bg-dashboard-card/40 divide-y divide-gray-100 dark:divide-gray-700/80 overflow-hidden"
                    >
                      <button
                        v-for="receipt in getCustomerReceipts(customer.id)"
                        :key="receipt.id"
                        type="button"
                        class="w-full text-left px-2.5 py-1.5 sm:px-3 sm:py-2 transition-colors hover:bg-gray-50/90 dark:hover:bg-gray-800/55 focus:outline-none focus-visible:bg-gray-50/90 dark:focus-visible:bg-gray-800/55 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-400/35"
                        :aria-label="`Open receipt ${receipt.receiptNumber} in receipts list`"
                        @click="goToReceiptFromCustomer(receipt)"
                      >
                        <div class="flex flex-wrap items-center justify-between gap-x-3 gap-y-0.5">
                          <p class="text-[10px] leading-tight text-gray-600 dark:text-gray-300 min-w-0">
                            <span class="font-semibold text-gray-900 dark:text-gray-100">#{{ receipt.receiptNumber }}</span>
                            <span class="text-gray-300 dark:text-gray-600 mx-1">·</span>
                            <span>{{ formatDate(receipt.date) }}, {{ formatTime(receipt.date) }}</span>
                          </p>
                          <div class="flex items-center gap-2 shrink-0">
                            <span class="text-[10px] font-semibold tabular-nums text-gray-900 dark:text-gray-100">
                              {{ formatCurrency(receipt.total) }}
                            </span>
                            <span
                              :class="[ 'inline-flex items-center rounded px-1 py-px text-[8px] font-medium leading-none', receipt.status === 'completed' ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400' : receipt.status === 'pending' ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300' : 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300', ]"
                            >
                              {{ receipt.status.charAt(0).toUpperCase() + receipt.status.slice(1) }}
                            </span>
                          </div>
                        </div>
                        <ul
                          v-if="receipt.items?.length"
                          class="mt-1.5 space-y-0.5 border-t border-gray-200/70 pt-1.5 text-[10px] text-gray-600 dark:border-gray-700/70 dark:text-gray-400"
                        >
                          <li
                            v-for="(item, itemIdx) in receipt.items"
                            :key="itemIdx"
                            class="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0"
                          >
                            <span class="min-w-0 truncate text-gray-800 dark:text-gray-200">{{ item.itemName }}</span>
                            <span class="shrink-0 tabular-nums text-gray-600 dark:text-gray-400">
                              {{ item.quantity }}× {{ formatCurrency(item.price) }}
                              <span class="font-medium text-gray-900 dark:text-gray-100"> · {{ formatCurrency(item.price * item.quantity) }}</span>
                            </span>
                          </li>
                        </ul>
                        <p v-else class="mt-1 text-[10px] text-gray-500 dark:text-gray-500">
                          {{ receipt.itemsCount }} item{{ receipt.itemsCount === 1 ? '' : 's' }} · open in Receipts for full details
                        </p>
                      </button>
                    </div>
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>
      </div>

      <DashboardFixedFooter v-if="filteredCustomers.length > 0" :sidebar-collapsed="sidebarCollapsed">
        <Pagination
          :current-page="customersCurrentPage"
          :items-per-page="customersItemsPerPage"
          :total="filteredCustomers.length"
          @page-change="handleCustomersPageChange"
        />
      </DashboardFixedFooter>
    </template>

        </div>
    </template>
    </div>
    <template #fallback>
      <div class="flex min-h-[40vh] w-full max-w-none items-center justify-center px-4 pb-24">
        <div class="text-center">
          <div
            class="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-gray-200 border-t-primary-500 dark:border-gray-700 dark:border-t-primary-400"
          />
          <p class="mt-3 text-xs text-gray-500 dark:text-gray-400">Loading sales…</p>
        </div>
      </div>
    </template>
  </ClientOnly>

  <!-- Receipt / customer actions (teleported; not clipped by table/card overflow) -->
  <Teleport to="body">
    <div
      v-if="openReceiptMenuId && receiptForOpenMenu && receiptMenuFixedStyle"
      ref="receiptMenuPanelRef"
      data-receipt-menu
      class="frosted-glass fixed z-[1000] min-w-[11rem] overflow-hidden rounded-sm border border-gray-200/90 py-1 text-left dark:border-gray-700/80"
      role="menu"
      :style="receiptMenuFixedStyle"
    >
      <button
        type="button"
        role="menuitem"
        @click="handleViewReceiptTimeline(receiptForOpenMenu); openReceiptMenuId = null"
        class="flex w-full items-center gap-2.5 px-3 py-2 text-xs text-gray-700 transition-colors hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-800/85"
      >
        <ClockIcon class="h-4 w-4 shrink-0 text-gray-400 dark:text-gray-500" stroke-width="1.75" />
        <span>History</span>
      </button>
      <button
        type="button"
        role="menuitem"
        @click="handlePrintReceipt(receiptForOpenMenu); openReceiptMenuId = null"
        class="flex w-full items-center gap-2.5 px-3 py-2 text-xs text-gray-700 transition-colors hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-800/85"
      >
        <PrinterIcon class="h-4 w-4 shrink-0 text-gray-400 dark:text-gray-500" stroke-width="1.75" />
        <span>Print</span>
      </button>
      <button
        v-if="receiptForOpenMenu.status === 'completed' && canEditReceipts"
        type="button"
        role="menuitem"
        @click="handleRefundReceipt(receiptForOpenMenu); openReceiptMenuId = null"
        class="flex w-full items-center gap-2.5 px-3 py-2 text-xs text-orange-600 transition-colors hover:bg-orange-50 dark:text-orange-400 dark:hover:bg-orange-950/30"
      >
        <ArrowPathIcon class="h-4 w-4 shrink-0" stroke-width="1.75" />
        <span>Refund</span>
      </button>
      <button
        v-if="canDeleteReceipts"
        type="button"
        role="menuitem"
        @click="handleDeleteReceipt(receiptForOpenMenu); openReceiptMenuId = null"
        class="flex w-full items-center gap-2.5 px-3 py-2 text-xs text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
      >
        <TrashIcon class="h-4 w-4 shrink-0" stroke-width="1.75" />
        <span>Delete</span>
      </button>
    </div>
  </Teleport>
  <Teleport to="body">
    <div
      v-if="openCustomerMenuId && customerForOpenMenu && customerMenuFixedStyle"
      ref="customerMenuPanelRef"
      data-customer-menu
      class="frosted-glass fixed z-[1000] min-w-[11rem] overflow-hidden rounded-sm border border-gray-200/90 py-1 text-left dark:border-gray-700/80"
      role="menu"
      :style="customerMenuFixedStyle"
    >
      <button
        type="button"
        role="menuitem"
        @click="viewCustomerReceipts(customerForOpenMenu); openCustomerMenuId = null"
        class="flex w-full items-center gap-2.5 px-3 py-2 text-xs text-gray-700 transition-colors hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-800/85"
      >
        <PrinterIcon class="h-4 w-4 shrink-0 text-gray-400 dark:text-gray-500" stroke-width="1.75" />
        <span>View receipts</span>
      </button>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import {
  PlusIcon,
  ReceiptPercentIcon,
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
import Button from '~/components/ui/Button.vue'
import Pagination from '~/components/ui/Pagination.vue'
import DashboardFixedFooter from '~/components/ui/DashboardFixedFooter.vue'
import DataTableToolbar from '~/components/ui/DataTableToolbar.vue'
import Modal from '~/components/ui/Modal.vue'
import Checkbox from '~/components/ui/Checkbox.vue'
// @ts-ignore
import CreateReceiptModal from '~/components/receipts/CreateReceiptModal.vue'
// @ts-ignore
import ViewReceiptModal from '~/components/receipts/ViewReceiptModal.vue'
import ReceiptTableLineItems from '~/components/receipts/ReceiptTableLineItems.vue'
// @ts-ignore
import ReturnReceiptModal from '~/components/receipts/ReturnReceiptModal.vue'
// @ts-ignore
import DeleteReceiptModal from '~/components/receipts/DeleteReceiptModal.vue'
// @ts-ignore
import ReceiptTimelineModal from '~/components/receipts/ReceiptTimelineModal.vue'
// @ts-ignore
import RecordPaymentModal from '~/components/receipts/RecordPaymentModal.vue'
import { useReceiptsStore, type Receipt } from '~/stores/receipts'
import {
  isReceiptOutstanding,
  receiptAmountPaid,
  receiptBalanceDue,
} from '~/utils/receipt-outstanding'
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
import { useAppToast } from '~/composables/useAppToast'
import { getVisibleMenuAnchorElement, computeFixedAnchoredMenuStyle } from '~/utils/menuAnchor'

definePageMeta({
  layout: 'dashboard',
  ssr: false
})

useHead({
  title: 'Receipts - Storvv',
})

const receiptsStore = useReceiptsStore()
const storesStore = useStoresStore()
const toast = useAppToast()
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

const highlightFromRoute = computed(() => {
  const raw = route.query.highlight
  if (typeof raw === 'string' && raw.length > 0) return raw
  if (Array.isArray(raw) && typeof raw[0] === 'string') return raw[0]
  return null
})

const flashReceiptId = ref<string | null>(null)
let receiptHighlightClearTimer: ReturnType<typeof setTimeout> | null = null

function clearReceiptHighlightTimer() {
  if (receiptHighlightClearTimer) {
    clearTimeout(receiptHighlightClearTimer)
    receiptHighlightClearTimer = null
  }
}

function stripHighlightQuery() {
  if (route.query.highlight == null || route.query.highlight === '') return
  const q = { ...route.query }
  delete q.highlight
  void router.replace({ query: q })
}

function applyReceiptHighlight(receiptId: string) {
  clearReceiptHighlightTimer()
  flashReceiptId.value = receiptId
  if (import.meta.client) {
    const scrollToRow = () => {
      const el = document.querySelector<HTMLElement>(`[data-receipt-row="${receiptId}"]`)
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
    nextTick(() => {
      scrollToRow()
      requestAnimationFrame(scrollToRow)
    })
  }
  receiptHighlightClearTimer = setTimeout(() => {
    flashReceiptId.value = null
    receiptHighlightClearTimer = null
    stripHighlightQuery()
  }, 3500)
}

const activeTab = ref<'receipts' | 'outstanding' | 'customers'>((route.query.tab as any) || 'receipts')
const showRecordPaymentModal = ref(false)
const receiptForPayment = ref<Receipt | null>(null)

const outstandingReceipts = computed(() =>
  receiptsStore.receipts.filter((r) => r.status !== 'refunded' && isReceiptOutstanding(r)),
)
const outstandingTotalBalance = computed(() =>
  outstandingReceipts.value.reduce((sum, r) => sum + receiptBalanceDue(r), 0),
)
const outstandingAmountPaid = receiptAmountPaid
const outstandingBalanceDue = receiptBalanceDue

function openRecordPayment(receipt: Receipt) {
  receiptForPayment.value = receipt
  showRecordPaymentModal.value = true
}

function handlePaymentRecorded() {
  toast.success('Payment recorded')
  void receiptsStore.fetchReceipts({ force: true })
}
const isReceiptsFullscreen = ref(false)
const isCustomersFullscreen = ref(false)
const openReceiptMenuId = ref<string | null>(null)
const openCustomerMenuId = ref<string | null>(null)

const toggleReceiptMenu = (receiptId: string) => {
  if (openReceiptMenuId.value !== receiptId) openCustomerMenuId.value = null
  openReceiptMenuId.value = openReceiptMenuId.value === receiptId ? null : receiptId
}

const toggleCustomerMenu = (customerId: string) => {
  if (openCustomerMenuId.value !== customerId) openReceiptMenuId.value = null
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
    openCustomerMenuId.value = null
  }
}

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
  const q = { ...route.query, tab: newTab } as Record<string, string | string[] | null | undefined>
  if (newTab !== 'receipts') {
    delete q.highlight
    clearReceiptHighlightTimer()
    flashReceiptId.value = null
  }
  if (newTab === 'outstanding') {
    void receiptsStore.fetchReceipts({ force: true })
  }
  void router.replace({ query: q })
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

/** Expandable full line-item details (desktop secondary row + mobile accordion) */
const expandedReceiptLineItems = ref<Record<string, boolean>>({})
const receiptLineItemsDetailColspan = computed(() => (canDeleteReceipts.value ? 10 : 9))

const getReceiptLineItemsCount = (receipt: Receipt) => receipt.items?.length ?? receipt.itemsCount ?? 0

const getReceiptLineItemsPreview = (receipt: Receipt): string => {
  if (!receipt.items?.length) return ''
  const names = receipt.items.map((i) => i.itemName).filter(Boolean)
  if (names.length === 0) return ''
  const max = 3
  if (names.length <= max) return names.join(', ')
  return `${names.slice(0, max).join(', ')} · +${names.length - max} more`
}

const toggleReceiptLineItemsExpand = (receiptId: string) => {
  expandedReceiptLineItems.value = {
    ...expandedReceiptLineItems.value,
    [receiptId]: !expandedReceiptLineItems.value[receiptId],
  }
}

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

const customerForOpenMenu = computed(() => {
  const id = openCustomerMenuId.value
  if (!id) return null
  return filteredCustomers.value.find(c => c.id === id) ?? null
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

const customersTotalOrders = computed(() =>
  uniqueCustomers.value.reduce((sum, c) => sum + c.receipts.length, 0)
)

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

const receiptForOpenMenu = computed(() => {
  const id = openReceiptMenuId.value
  if (!id) return null
  return sortedFilteredReceipts.value.find(r => r.id === id) ?? null
})

const receiptMenuFixedStyle = ref<Record<string, string> | null>(null)
const customerMenuFixedStyle = ref<Record<string, string> | null>(null)
const receiptMenuPanelRef = ref<HTMLElement | null>(null)
const customerMenuPanelRef = ref<HTMLElement | null>(null)

function updateReceiptMenuPosition() {
  const id = openReceiptMenuId.value
  if (!id || !import.meta.client) {
    receiptMenuFixedStyle.value = null
    return
  }
  const el = getVisibleMenuAnchorElement('data-receipt-actions-anchor', id)
  if (!el) {
    receiptMenuFixedStyle.value = null
    return
  }
  const r = el.getBoundingClientRect()
  const menuWidth = receiptMenuPanelRef.value?.offsetWidth || 176
  const estimatedMenuHeight = receiptMenuPanelRef.value?.offsetHeight || 240
  receiptMenuFixedStyle.value = computeFixedAnchoredMenuStyle(r, {
    menuWidth,
    estimatedMenuHeight,
    margin: 4,
    viewportPadding: 8,
  })
}

function updateCustomerMenuPosition() {
  const id = openCustomerMenuId.value
  if (!id || !import.meta.client) {
    customerMenuFixedStyle.value = null
    return
  }
  const el = getVisibleMenuAnchorElement('data-customer-actions-anchor', id)
  if (!el) {
    customerMenuFixedStyle.value = null
    return
  }
  const r = el.getBoundingClientRect()
  const menuWidth = customerMenuPanelRef.value?.offsetWidth || 176
  const estimatedMenuHeight = customerMenuPanelRef.value?.offsetHeight || 52
  customerMenuFixedStyle.value = computeFixedAnchoredMenuStyle(r, {
    menuWidth,
    estimatedMenuHeight,
    margin: 4,
    viewportPadding: 8,
  })
}

function addReceiptMenuPositionListeners() {
  if (!import.meta.client) return
  window.addEventListener('scroll', updateReceiptMenuPosition, true)
  window.addEventListener('resize', updateReceiptMenuPosition)
}

function removeReceiptMenuPositionListeners() {
  if (!import.meta.client) return
  window.removeEventListener('scroll', updateReceiptMenuPosition, true)
  window.removeEventListener('resize', updateReceiptMenuPosition)
}

function addCustomerMenuPositionListeners() {
  if (!import.meta.client) return
  window.addEventListener('scroll', updateCustomerMenuPosition, true)
  window.addEventListener('resize', updateCustomerMenuPosition)
}

function removeCustomerMenuPositionListeners() {
  if (!import.meta.client) return
  window.removeEventListener('scroll', updateCustomerMenuPosition, true)
  window.removeEventListener('resize', updateCustomerMenuPosition)
}

let receiptMenuOutsideHandler: ((e: MouseEvent) => void) | null = null
let customerMenuOutsideHandler: ((e: MouseEvent) => void) | null = null

function removeReceiptMenuOutsideListener() {
  if (receiptMenuOutsideHandler && import.meta.client) {
    document.removeEventListener('click', receiptMenuOutsideHandler, true)
    receiptMenuOutsideHandler = null
  }
}

function removeCustomerMenuOutsideListener() {
  if (customerMenuOutsideHandler && import.meta.client) {
    document.removeEventListener('click', customerMenuOutsideHandler, true)
    customerMenuOutsideHandler = null
  }
}

watch(openReceiptMenuId, (id) => {
  removeReceiptMenuOutsideListener()
  removeReceiptMenuPositionListeners()
  receiptMenuFixedStyle.value = null
  if (!id || !import.meta.client) return

  nextTick(() => {
    updateReceiptMenuPosition()
    addReceiptMenuPositionListeners()
  })

  receiptMenuOutsideHandler = (e: MouseEvent) => {
    const t = e.target as HTMLElement | null
    if (t?.closest?.('[data-receipt-menu]')) return
    openReceiptMenuId.value = null
    removeReceiptMenuOutsideListener()
  }

  nextTick(() => {
    // second pass after DOM paints so we position using real panel size
    requestAnimationFrame(() => updateReceiptMenuPosition())
    setTimeout(() => {
      if (openReceiptMenuId.value && receiptMenuOutsideHandler) {
        document.addEventListener('click', receiptMenuOutsideHandler, true)
      }
    }, 0)
  })
})

watch(openCustomerMenuId, (id) => {
  removeCustomerMenuOutsideListener()
  removeCustomerMenuPositionListeners()
  customerMenuFixedStyle.value = null
  if (!id || !import.meta.client) return

  nextTick(() => {
    updateCustomerMenuPosition()
    addCustomerMenuPositionListeners()
  })

  customerMenuOutsideHandler = (e: MouseEvent) => {
    const t = e.target as HTMLElement | null
    if (t?.closest?.('[data-customer-menu]')) return
    openCustomerMenuId.value = null
    removeCustomerMenuOutsideListener()
  }

  nextTick(() => {
    requestAnimationFrame(() => updateCustomerMenuPosition())
    setTimeout(() => {
      if (openCustomerMenuId.value && customerMenuOutsideHandler) {
        document.addEventListener('click', customerMenuOutsideHandler, true)
      }
    }, 0)
  })
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

async function goToReceiptFromCustomer(receipt: Receipt) {
  activeTab.value = 'receipts'
  await nextTick()
  let idx = sortedFilteredReceipts.value.findIndex(r => r.id === receipt.id)
  if (idx === -1) {
    resetFilters()
    await nextTick()
    idx = sortedFilteredReceipts.value.findIndex(r => r.id === receipt.id)
  }
  if (idx === -1) {
    toast.error('Could not find this receipt in the list.')
    await router.replace({ query: { ...route.query, tab: 'receipts' } })
    return
  }
  await router.replace({ query: { ...route.query, tab: 'receipts', highlight: receipt.id } })
}

watch(
  [highlightFromRoute, isInitialLoading, activeTab],
  async () => {
    const id = highlightFromRoute.value
    if (!id || isInitialLoading.value || activeTab.value !== 'receipts') return
    await nextTick()
    let idx = sortedFilteredReceipts.value.findIndex(r => r.id === id)
    if (idx === -1) {
      resetFilters()
      await nextTick()
      idx = sortedFilteredReceipts.value.findIndex(r => r.id === id)
    }
    if (idx === -1) return
    const page = Math.floor(idx / itemsPerPage.value) + 1
    if (currentPage.value !== page) {
      currentPage.value = page
      await nextTick()
    }
    applyReceiptHighlight(id)
  },
  { flush: 'post' }
)

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
  openReceiptMenuId.value = null
  expandedReceiptLineItems.value = {}
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
  openCustomerMenuId.value = null
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
  clearReceiptHighlightTimer()
  if (import.meta.client) {
    window.removeEventListener('keydown', handleKeyDown)
    removeReceiptMenuOutsideListener()
    removeCustomerMenuOutsideListener()
    removeReceiptMenuPositionListeners()
    removeCustomerMenuPositionListeners()
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
    // console.log('[ReceiptsPage] Store changed, refetching receipts...')
    try {
      await receiptsStore.fetchReceipts()
      // console.log('[ReceiptsPage] Receipts refetched after store change:', receiptsStore.receipts.length)
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

<style>
/*
 * Receipt flash (dark): force a gray row tint so `dark:` utilities never lose to a light base bg.
 */
html.dark [data-receipt-flash] {
  background-color: rgb(16 185 129 / 0.12) !important;
}
</style>

