<template>
  <ClientOnly>
    <div
      :class="[
        'dashboard-page-with-footer flex w-full max-w-none flex-col min-h-[calc(100svh-4.5rem)]',
        isCapacitorIos ? '' : 'gap-5 pb-[calc(6.5rem+env(safe-area-inset-bottom,0px))] sm:gap-6 sm:pb-32',
      ]"
    >
      <!-- Initial loading -->
      <template v-if="isInitialLoading">
        <div v-if="isCapacitorIos" class="ios-sales-shell">
          <div class="ios-page-nav-bar" aria-hidden="true">
            <span class="ios-page-nav-bar__spacer" />
            <div class="ios-skeleton ios-nav-title-skeleton" />
            <span class="ios-page-nav-bar__spacer" />
          </div>
          <IosQuickActionSkeleton :count="4" />
          <IosTransactionListSkeleton :count="8" />
        </div>
        <div v-else class="flex min-h-0 flex-1 flex-col gap-4 sm:gap-5">
          <nav :class="segmentTabsClass" aria-hidden="true">
            <span class="dash-skeleton dash-skeleton--select" />
            <span class="dash-skeleton dash-skeleton--select" />
            <span class="dash-skeleton dash-skeleton--select" />
          </nav>
          <DashTableSkeleton
            :columns="receiptsTableSkeletonColumns"
            :rows="8"
            leading="none"
            show-toolbar
            aria-label="Loading sales"
          />
        </div>
      </template>

      <template v-else>
        <!-- iOS: mockup-style transactions UI (no tables, no layout top nav) -->
        <div v-if="isCapacitorIos" class="ios-sales-shell" data-receipts-page>
          <IosPageNavBar :title="iosSalesNavTitle" />

          <IosQuickActionBar
            v-model="activeTab"
            role="tablist"
            aria-label="Sales views and actions"
            :options="salesQuickActionOptions"
          />

          <template v-if="activeTab === 'receipts'">
            <template v-if="receiptsStore.loading">
              <div class="ios-search-bar-host">
                <div class="ios-skeleton ios-search-skeleton" aria-hidden="true" />
              </div>
              <IosQuickActionSkeleton :count="4" />
              <IosTransactionListSkeleton :count="8" />
            </template>

            <template v-else>
              <div class="ios-sales-chrome">
                <div class="ios-search-bar-host ios-search-bar-host--sticky">
                  <IosSearchBar v-model="searchQuery" placeholder="Search sales…" />
                </div>
                <IosQuickActionBar
                  v-model="statusFilter"
                  aria-label="Filter by status"
                  :options="receiptStatusQuickActionOptions"
                />
              </div>

              <DashboardTableEmptyState
                v-if="sortedFilteredReceipts.length === 0"
              :icon="ReceiptPercentIcon"
              :title="
                searchQuery || statusFilter !== 'all' || dateFilter !== 'all'
                  ? 'No sales found'
                  : 'No sales yet'
              "
              :description="
                searchQuery || statusFilter !== 'all' || dateFilter !== 'all'
                  ? 'Try adjusting your search, status, or date filters.'
                  : 'Create your first sale to record revenue and track payments.'
              "
              />

              <template v-else>
                <div class="ios-receipt-transaction-list">
                  <IosReceiptTransactionRow
                    v-for="(receipt, index) in paginatedReceipts"
                    :key="receipt.id"
                    :title="receipt.customerName || 'Walk-in customer'"
                    :subtitle="getReceiptTransactionSubtitle(receipt)"
                    :amount="getReceiptTransactionAmount(receipt).text"
                    :amount-tone="getReceiptTransactionAmount(receipt).tone"
                    :date="formatReceiptTransactionDate(receipt.date)"
                    :variant="getReceiptTransactionVariant(receipt)"
                    :last="index === paginatedReceipts.length - 1"
                    show-menu
                    :menu-id="receipt.id"
                    @click="handleViewReceipt(receipt)"
                    @menu="toggleReceiptMenu(receipt.id)"
                  />
                </div>
                <DashboardTablePagination
                  :current-page="currentPage"
                  :items-per-page="itemsPerPage"
                  :total="sortedFilteredReceipts.length"
                  @page-change="handlePageChange"
                />
              </template>
            </template>
          </template>

          <template v-else-if="activeTab === 'outstanding'">
            <div v-if="!receiptsStore.loading" class="ios-sales-chrome">
              <div class="ios-search-bar-host ios-search-bar-host--sticky">
                <IosSearchBar
                  v-model="outstandingSearchQuery"
                  placeholder="Search customer or receipt #…"
                />
              </div>
            </div>

            <DashboardTableEmptyState
              v-if="filteredOutstandingReceipts.length === 0 && !receiptsStore.loading"
              :icon="ClockIcon"
              title="No outstanding payments"
              description="Create a sale with “Balance due” when a customer pays a deposit. It will appear here until paid in full."
            />

            <div v-else-if="!receiptsStore.loading" class="ios-receipt-transaction-list">
              <IosReceiptTransactionRow
                v-for="(row, index) in filteredOutstandingReceipts"
                :key="row.id"
                :title="row.customerName || 'Walk-in customer'"
                :subtitle="getOutstandingTransactionSubtitle(row)"
                :amount="getOutstandingTransactionAmount(row).text"
                :amount-tone="getOutstandingTransactionAmount(row).tone"
                :date="formatReceiptTransactionDate(row.date)"
                variant="pending"
                :last="index === filteredOutstandingReceipts.length - 1"
                show-menu
                :menu-id="row.id"
                @click="viewOutstandingReceipt(row)"
                @menu="toggleReceiptMenu(row.id)"
              />
            </div>
          </template>

          <template v-else-if="activeTab === 'customers'">
            <div v-if="!receiptsStore.loading" class="ios-sales-chrome">
              <div class="ios-search-bar-host ios-search-bar-host--sticky">
                <IosSearchBar v-model="customersSearchQuery" placeholder="Search customers…" />
              </div>
              <IosQuickActionBar
                v-model="customersSortBy"
                aria-label="Sort customers"
                :options="customerSortQuickActionOptions"
              />
            </div>

            <IosTransactionListSkeleton v-if="receiptsStore.loading" :count="6" />

            <DashboardTableEmptyState
              v-else-if="filteredCustomers.length === 0"
              :icon="UsersIcon"
              :title="customersSearchQuery ? 'No customers found' : 'No customers yet'"
              :description="
                customersSearchQuery
                  ? 'Try another name, phone number, or email.'
                  : 'Customers are created automatically when you add them on a sale.'
              "
            />

            <template v-else>
              <div class="ios-receipt-transaction-list">
                <div
                  v-for="(customer, customerIndex) in paginatedCustomers"
                  :key="customer.id"
                  class="ios-receipt-transaction-list__group"
                  :class="{ 'ios-receipt-transaction-list__group--last': customerIndex === paginatedCustomers.length - 1 }"
                >
                  <IosReceiptTransactionRow
                    :title="customer.name"
                    :subtitle="getCustomerTransactionSubtitle(customer)"
                    :amount="getCustomerTransactionAmount(customer).text"
                    :amount-tone="getCustomerTransactionAmount(customer).tone"
                    :date="formatReceiptTransactionDate(customer.lastOrderDate)"
                    :variant="getCustomerTransactionVariant(customer)"
                    show-menu
                    menu-kind="customer"
                    :menu-id="customer.id"
                    @click="toggleCustomerExpanded(customer.id)"
                    @menu="toggleCustomerMenu(customer.id)"
                  />
                  <div
                    v-if="expandedCustomers[customer.id]"
                    class="ios-receipt-transaction-list__nested"
                  >
                    <IosReceiptTransactionRow
                      v-for="(receipt, receiptIndex) in getCustomerReceipts(customer.id)"
                      :key="receipt.id"
                      nested
                      :title="receipt.receiptNumber"
                      :subtitle="getReceiptTransactionSubtitle(receipt)"
                      :amount="getReceiptTransactionAmount(receipt).text"
                      :amount-tone="getReceiptTransactionAmount(receipt).tone"
                      :date="formatReceiptTransactionDate(receipt.date)"
                      :variant="getReceiptTransactionVariant(receipt)"
                      :last="receiptIndex === getCustomerReceipts(customer.id).length - 1"
                      show-menu
                      :menu-id="receipt.id"
                      @click="goToReceiptFromCustomer(receipt)"
                      @menu="toggleReceiptMenu(receipt.id)"
                    />
                  </div>
                </div>
              </div>
              <DashboardTablePagination
                :current-page="customersCurrentPage"
                :items-per-page="customersItemsPerPage"
                :total="filteredCustomers.length"
                @page-change="handleCustomersPageChange"
              />
            </template>
          </template>

          <IosDrawer
            v-if="isCapacitorIos"
            v-model="showSalesMoreSheet"
            title="Sales options"
            subtitle="Views and filters"
            variant="menu"
            footer-variant="menu"
            body-padding="p-0"
            aria-label="Sales options"
          >
            <div class="ios-drawer-menu">
              <section class="ios-drawer-menu__section">
                <p class="ios-drawer-menu__section-label">Views</p>
                <div class="ios-drawer-menu__group">
                  <ul class="ios-drawer-menu__list">
                    <li v-if="canCreate">
                      <button
                        type="button"
                        class="ios-drawer-menu__row"
                        @click="selectSalesTabFromSheet('outstanding')"
                      >
                        <span class="ios-drawer-menu__label">Outstanding</span>
                        <span v-if="outstandingReceipts.length > 0" class="ios-drawer-menu__value">
                          {{ outstandingReceipts.length }}
                        </span>
                        <CheckIcon
                          v-if="activeTab === 'outstanding'"
                          class="ios-drawer-menu__check"
                          aria-hidden="true"
                        />
                      </button>
                    </li>
                    <li>
                      <button
                        type="button"
                        class="ios-drawer-menu__row"
                        @click="selectSalesTabFromSheet('customers')"
                      >
                        <span class="ios-drawer-menu__label">Customers</span>
                        <CheckIcon
                          v-if="activeTab === 'customers'"
                          class="ios-drawer-menu__check"
                          aria-hidden="true"
                        />
                      </button>
                    </li>
                  </ul>
                </div>
              </section>
              <section v-if="activeTab === 'receipts'" class="ios-drawer-menu__section">
                <p class="ios-drawer-menu__section-label">Date range</p>
                <div class="ios-drawer-menu__group">
                  <ul class="ios-drawer-menu__list">
                    <li v-for="option in receiptDateFilterOptions" :key="option.value">
                      <button
                        type="button"
                        class="ios-drawer-menu__row"
                        @click="selectReceiptDateFilter(option.value)"
                      >
                        <span class="ios-drawer-menu__label">{{ option.label }}</span>
                        <CheckIcon
                          v-if="dateFilter === option.value"
                          class="ios-drawer-menu__check"
                          aria-hidden="true"
                        />
                      </button>
                    </li>
                  </ul>
                </div>
              </section>
            </div>
          </IosDrawer>

          <CreateReceiptModal
            v-model="showCreateReceiptModal"
            @receipt-created="handleReceiptCreated"
          />
          <QuickSaleModal v-model="showQuickSaleModal" @sale-completed="handleQuickSaleCompleted" />
          <ViewReceiptModal v-model="showViewReceiptModal" :receipt="selectedReceipt" />
          <ReturnReceiptModal
            v-model="showReturnReceiptModal"
            :receipt="selectedReceipt"
            @returned="handleReceiptReturned"
          />
          <DeleteReceiptModal
            v-model="showDeleteReceiptModal"
            :receipt="selectedReceipt"
            @confirmDelete="handleReceiptConfirmDelete"
          />
          <ReceiptTimelineModal v-model="showTimelineModal" :receipt="selectedReceipt" />
        </div>

        <!-- Web / desktop -->
        <div v-else class="flex w-full min-h-0 flex-1 flex-col gap-4 sm:gap-5 dash-page--unified" data-receipts-page>
          <DashboardPageHeader class="dash-page-header--unified">
            <template #eyebrow>
              <p class="dash-eyebrow">Sales</p>
            </template>
            <template #title>
              <h1 :class="pageTitleClass">Sales</h1>
            </template>
            <template v-if="!receiptsStore.loading" #description>
              <DashboardPageMetrics :metrics="receiptsHeaderMetrics" aria-label="Sales summary" />
            </template>
            <template v-if="canCreate" #actions>
              <Button
                variant="outline"
                size="sm"
                :icon="QrCodeIcon"
                aria-label="Quick sale"
                :extra-class="headerBtnClass"
                @click="openQuickSaleModal"
              >
                <span :class="headerBtnLabelClass">Quick sale</span>
              </Button>
              <Button
                variant="primary"
                size="sm"
                :icon="ReceiptPercentIcon"
                aria-label="New sale"
                :extra-class="headerBtnClass"
                @click="openCreateReceiptModal"
              >
                <span :class="headerBtnLabelClass">New sale</span>
              </Button>
            </template>
          </DashboardPageHeader>

          <!-- Tabs -->
          <nav :class="segmentTabsClass" aria-label="Sales views" role="tablist">
            <button
              type="button"
              role="tab"
              :aria-selected="activeTab === 'receipts'"
              :class="[
                segmentTabsBtnClass,
                activeTab === 'receipts' ? segmentTabsBtnActiveClass : '',
              ]"
              @click="activeTab = 'receipts'"
            >
              Sales
            </button>
            <button
              type="button"
              role="tab"
              :aria-selected="activeTab === 'outstanding'"
              :class="[
                segmentTabsBtnClass,
                activeTab === 'outstanding' ? segmentTabsBtnActiveClass : '',
              ]"
              @click="activeTab = 'outstanding'"
            >
              <span class="inline-flex items-center justify-center gap-1.5">
                Outstanding
                <span
                  v-if="outstandingReceipts.length > 0"
                  class="min-w-[1.125rem] rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-amber-900 dark:bg-amber-950/50 dark:text-amber-200"
                >
                  {{ outstandingReceipts.length }}
                </span>
              </span>
            </button>
            <button
              type="button"
              role="tab"
              :aria-selected="activeTab === 'customers'"
              :class="[
                segmentTabsBtnClass,
                activeTab === 'customers' ? segmentTabsBtnActiveClass : '',
              ]"
              @click="activeTab = 'customers'"
            >
              Customers
            </button>
          </nav>

          <!-- Receipts Tab Content -->
          <template v-if="activeTab === 'receipts'">
            <!-- Teleport fullscreen to body so position:fixed is not clipped by layout page transition (transform) -->
            <Teleport to="body" :disabled="!isReceiptsFullscreen">
              <!-- Receipts Table -->
              <div
                data-dashboard-teleport
                :class="[
                  'transition-colors duration-200 ease-out',
                  isReceiptsFullscreen
                    ? `${tableExpandClass} fixed inset-0 z-[100] flex min-h-0 flex-col overflow-hidden`
                    : 'relative flex min-h-0 flex-1 flex-col',
                ]"
              >
                <!-- Fullscreen header -->
                <div
                  v-if="isReceiptsFullscreen"
                  :class="tableExpandHeaderClass"
                  style="padding-top: max(1rem, env(safe-area-inset-top, 0px))"
                >
                  <div
                    class="flex w-full flex-col gap-3 lg:flex-row lg:items-center lg:justify-between lg:gap-6"
                  >
                    <div class="flex min-w-0 items-start justify-between gap-3 lg:items-center">
                      <div class="min-w-0">
                        <p :class="tableExpandEyebrowClass">
                          Expanded view
                        </p>
                        <div class="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                          <h2 :class="tableExpandTitleClass">
                            Sales
                          </h2>
                          <span :class="tableExpandMetaClass">
                            {{ receipts.length }} in store ·
                            {{ formatCurrency(totalSales) }} completed · Today
                            {{ formatCurrency(todaySales) }} ({{ todayReceipts }}) · Month
                            {{ formatCurrency(monthSales) }} ({{ monthReceipts }})
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        class="inline-flex lg:hidden"
                        :class="tableExpandCloseClass"
                        aria-label="Exit expanded view"
                        @click="isReceiptsFullscreen = false"
                      >
                        <XMarkIcon class="h-5 w-5" />
                      </button>
                    </div>
                    <div
                      class="flex min-w-0 flex-1 flex-wrap items-center gap-2 lg:max-w-none lg:justify-end"
                    >
                      <div
                        class="relative min-w-0 w-full sm:max-w-[min(100%,20rem)] lg:w-56 lg:max-w-[16rem] lg:flex-initial"
                      >
                        <MagnifyingGlassIcon
                          class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500"
                        />
                        <input
                          v-model="searchQuery"
                          type="text"
                          placeholder="Search sales..."
                          class="w-full py-2 pl-10 pr-3 text-sm"
                          :class="tableExpandFieldClass"
                        />
                      </div>
                      <div class="flex flex-wrap items-center gap-2">
                        <select
                          v-model="statusFilter"
                          class="min-w-[7.5rem] cursor-pointer px-3 py-2 text-sm font-medium"
                          :class="tableExpandFieldClass"
                        >
                          <option value="all">All Status</option>
                          <option value="completed">Completed</option>
                          <option value="pending">Pending</option>
                          <option value="refunded">Refunded</option>
                        </select>
                        <select
                          v-model="dateFilter"
                          class="min-w-[7.5rem] cursor-pointer px-3 py-2 text-sm font-medium"
                          :class="tableExpandFieldClass"
                        >
                          <option value="all">All Dates</option>
                          <option value="today">Today</option>
                          <option value="week">This Week</option>
                          <option value="month">This Month</option>
                        </select>
                        <button
                          type="button"
                          class="hidden lg:inline-flex"
                          :class="tableExpandCloseClass"
                          aria-label="Exit expanded view"
                          @click="isReceiptsFullscreen = false"
                        >
                          <XMarkIcon class="h-5 w-5" />
                        </button>
                        <Button
                          v-if="canCreate && !isCapacitorIos"
                          variant="outline"
                          size="sm"
                          :icon="QrCodeIcon"
                          aria-label="Quick sale"
                          extra-class="!rounded-2xl shrink-0 max-sm:!px-2 max-sm:!py-1.5"
                          @click="openQuickSaleModal"
                        >
                          <span :class="headerBtnLabelClass">Quick sale</span>
                        </Button>
                        <Button
                          v-if="canCreate && !isCapacitorIos"
                          variant="primary"
                          size="sm"
                          :icon="ReceiptPercentIcon"
                          aria-label="New sale"
                          extra-class="!rounded-2xl ml-auto shrink-0 max-sm:!px-2 max-sm:!py-1.5"
                          @click="openCreateReceiptModal"
                        >
                          <span :class="headerBtnLabelClass">New sale</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  :class="[
                    isReceiptsFullscreen
                      ? tableExpandBodyClass
                      : tableShellFlexClass,
                  ]"
                >
                  <!-- Toolbar: search + filters (left), primary action (right) -->
                  <DataTableToolbar
                    v-if="!receiptsStore.loading && !isReceiptsFullscreen && !isCapacitorIos"
                    native-table-key="receipts-main"
                  >
                    <template #filters>
                      <DashboardToolbarSearch
                        v-model="searchQuery"
                        placeholder="Search sales…"
                        :wide="false"
                        input-class="sm:w-48"
                      />
                      <DashboardToolbarSelect
                        v-model="statusFilter"
                        min-width-class="min-w-[6.5rem]"
                      >
                        <option value="all">All Status</option>
                        <option value="completed">Completed</option>
                        <option value="pending">Pending</option>
                        <option value="refunded">Refunded</option>
                      </DashboardToolbarSelect>
                      <DashboardToolbarSelect v-model="dateFilter" min-width-class="min-w-[6.5rem]">
                        <option value="all">All Dates</option>
                        <option value="today">Today</option>
                        <option value="week">This Week</option>
                        <option value="month">This Month</option>
                      </DashboardToolbarSelect>
                      <DashboardToolbarIconButton
                        class="hidden lg:inline-flex"
                        :aria-label="isReceiptsFullscreen ? 'Exit expanded view' : 'Expand table'"
                        @click="isReceiptsFullscreen = !isReceiptsFullscreen"
                      >
                        <ArrowsPointingOutIcon v-if="!isReceiptsFullscreen" class="h-4 w-4" />
                        <XMarkIcon v-else class="h-4 w-4" />
                      </DashboardToolbarIconButton>
                    </template>
                    <template #actions>
                      <Button
                        v-if="canCreate && !isCapacitorIos"
                        variant="outline"
                        size="sm"
                        :icon="QrCodeIcon"
                        aria-label="Quick sale"
                        :extra-class="headerBtnClass"
                        @click="openQuickSaleModal"
                      >
                        <span :class="headerBtnLabelClass">Quick sale</span>
                      </Button>
                      <Button
                        v-if="canCreate && !isCapacitorIos"
                        variant="primary"
                        size="sm"
                        :icon="ReceiptPercentIcon"
                        aria-label="New sale"
                        :extra-class="headerBtnClass"
                        @click="openCreateReceiptModal"
                      >
                        <span :class="headerBtnLabelClass">New sale</span>
                      </Button>
                    </template>
                  </DataTableToolbar>
                  <!-- Bulk actions (receipts) -->
                  <div
                    v-if="canDeleteReceipts && selectedReceiptsForBulk.length > 0"
                    class="dash-table-bulk-bar"
                  >
                    <span class="text-xs font-medium text-gray-700 dark:text-gray-300"
                      >{{ selectedReceiptsForBulk.length }} selected</span
                    >
                    <Button
                      variant="outline"
                      size="sm"
                      :icon="TrashIcon"
                      class="!rounded-2xl !px-2.5 !py-1.5 !text-xs-gray-200/80 dark:!border-gray-700/80 !text-gray-600 dark:!text-gray-300 hover:!text-red-600 dark:hover:!text-red-400 hover:!border-red-200/80 dark:hover:!border-red-800/50 hover:!bg-red-50/60 dark:hover:!bg-red-900/10"
                      @click="openBulkDeleteReceiptsModal"
                    >
                      Delete
                    </Button>
                  </div>
                  <!-- Table Loading Skeleton -->
                  <div
                    v-if="receiptsStore.loading"
                    :class="
                      isReceiptsFullscreen
                        ? 'min-h-0 flex-1 overflow-y-auto px-4 pb-4 lg:px-8'
                        : 'min-h-0 flex-1 overflow-x-auto'
                    "
                  >
                    <div class="receipts-mobile-list space-y-2 px-3 py-3 sm:hidden">
                      <DashListCardSkeleton :count="6" />
                    </div>
                    <div class="hidden sm:block">
                      <DashTableSkeleton
                        :columns="receiptsTableSkeletonColumns"
                        :rows="8"
                        leading="none"
                        show-toolbar
                        flush
                        aria-label="Loading sales"
                      />
                    </div>
                  </div>
                  <!-- Standalone empty state (same styling as customers empty state, no button) -->
                  <DashboardTableEmptyState
                    v-else-if="sortedFilteredReceipts.length === 0"
                    :icon="ReceiptPercentIcon"
                    :title="
                      searchQuery || statusFilter !== 'all' || dateFilter !== 'all'
                        ? 'No sales found'
                        : 'No sales yet'
                    "
                    :description="
                      searchQuery || statusFilter !== 'all' || dateFilter !== 'all'
                        ? 'Try adjusting your search, status, or date filters.'
                        : 'Create your first sale to record revenue and track payments.'
                    "
                    :tips="
                      searchQuery || statusFilter !== 'all' || dateFilter !== 'all'
                        ? [
                            'Clear filters to see every sale for this store',
                            'Receipt numbers and customer names are searchable',
                          ]
                        : [
                            'Add line items from inventory categories',
                            'Use Outstanding for deposits and balance due',
                          ]
                    "
                    :extra-class="isReceiptsFullscreen ? 'min-h-0 flex-1' : ''"
                  >
                    <Button
                      v-if="
                        canCreate &&
                        !isCapacitorIos &&
                        !searchQuery &&
                        statusFilter === 'all' &&
                        dateFilter === 'all'
                      "
                      variant="primary"
                      size="sm"
                      extra-class="!text-xs !py-1.5 !px-3"
                      @click="openCreateReceiptModal"
                    >
                      Create sale
                    </Button>
                  </DashboardTableEmptyState>
                  <template v-else>
                    <div
                      :class="
                        isReceiptsFullscreen
                          ? 'flex min-h-0 flex-1 flex-col overflow-hidden'
                          : 'contents'
                      "
                    >
                      <!-- Mobile: card list (web only; iOS uses dedicated shell above) -->
                      <div
                        class="receipts-mobile-list space-y-2 sm:hidden"
                        :class="
                          isReceiptsFullscreen
                            ? 'min-h-0 flex-1 overflow-y-auto px-4 pb-4 lg:px-8'
                            : 'block px-0'
                        "
                      >
                        <div
                          v-for="receipt in paginatedReceipts"
                          :key="receipt.id"
                        >
                          <div
                            :data-receipt-row="receipt.id"
                            :data-receipt-flash="flashReceiptId === receipt.id ? '' : undefined"
                            class="rounded-lg bg-white p-2.5 shadow-none dark:!bg-dashboard-card"
                            :class="
                              flashReceiptId === receipt.id
                                ? '!ring-2 !ring-primary-500/25 ring-offset-2 ring-offset-white dark:bg-gray-800/75 dark:!ring-offset-gray-900'
                                : ''
                            "
                          >
                          <div class="flex items-start justify-between gap-2">
                            <div class="min-w-0 flex-1 flex items-start gap-2">
                              <Checkbox
                                v-if="canDeleteReceipts"
                                :model-value="
                                  selectedReceiptsForBulk.some((r) => r.id === receipt.id)
                                "
                                @update:model-value="
                                  (checked) => toggleReceiptSelection(receipt, checked)
                                "
                                size="sm"
                                wrapper-class="justify-center pt-0.5"
                                @click.stop
                              />
                              <div class="min-w-0 flex-1">
                                <div class="flex flex-wrap items-center gap-1.5">
                                  <span
                                    class="text-[11px] font-semibold text-gray-900 dark:text-gray-100"
                                    >{{ receipt.receiptNumber }}</span
                                  >
                                  <button
                                    @click.stop="copyReceiptNumber(receipt.receiptNumber)"
                                    class="p-0.5 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400"
                                    aria-label="Copy receipt number"
                                  >
                                    <ClipboardDocumentIcon class="w-3.5 h-3.5" stroke-width="1.5" />
                                  </button>
                                  <span
                                    v-if="receipt.isSwapIn"
                                    class="inline-flex items-center rounded-full bg-sky-50 px-2 py-0.5 text-[9px] font-semibold text-sky-800 dark:bg-sky-500/15 dark:text-sky-200"
                                  >
                                    Swap
                                  </span>
                                </div>
                                <p
                                  class="mt-0.5 text-[10px] leading-snug text-gray-600 dark:text-gray-400"
                                >
                                  <span class="line-clamp-2">{{ receipt.customerName }}</span>
                                  <span
                                    v-if="receipt.customerEmail"
                                    class="block truncate text-[9px] text-gray-500 dark:text-gray-500"
                                    >{{ receipt.customerEmail }}</span
                                  >
                                  <span
                                    v-if="receipt.customerPhone"
                                    class="block tabular-nums text-[9px] text-gray-500 dark:text-gray-500"
                                    >{{ receipt.customerPhone }}</span
                                  >
                                </p>
                                <p class="mt-0.5 text-[9px] text-gray-500 dark:text-gray-500">
                                  {{ formatDate(receipt.date) }}
                                </p>
                                <p
                                  v-if="getReceiptLineItemsPreview(receipt)"
                                  class="mt-1 line-clamp-2 text-[10px] text-gray-600 dark:text-gray-400"
                                >
                                  {{ getReceiptLineItemsPreview(receipt) }}
                                </p>
                                <ReceiptLineItemsToggle
                                  v-if="getReceiptLineItemsCount(receipt) > 0"
                                  :expanded="!!expandedReceiptLineItems[receipt.id]"
                                  :item-count="getReceiptLineItemsCount(receipt)"
                                  @toggle="toggleReceiptLineItemsExpand(receipt.id)"
                                />
                                <ReceiptLineItemsDetailPanel
                                  v-if="expandedReceiptLineItems[receipt.id]"
                                  compact
                                  :item-count="getReceiptLineItemsCount(receipt)"
                                >
                                  <ReceiptTableLineItems
                                    :items="receipt.items"
                                    :items-count-fallback="receipt.itemsCount"
                                    compact
                                  />
                                </ReceiptLineItemsDetailPanel>
                                <div class="mt-1.5 flex items-center justify-between gap-2">
                                  <div class="min-w-0">
                                    <span class="text-xs" :class="tableMoneyClass()">{{
                                      formatCurrency(receipt.total)
                                    }}</span>
                                    <ReceiptProfitHint :receipt="receipt" class="mt-0.5" />
                                  </div>
                                  <ReceiptStatusBadge :badge="receiptStatusBadge(receipt)" />
                                </div>
                              </div>
                            </div>
                            <div class="relative shrink-0" @click.stop>
                              <button
                                type="button"
                                :data-receipt-actions-anchor="receipt.id"
                                @click="toggleReceiptMenu(receipt.id)"
                                class="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800/85 dark:hover:text-gray-100"
                                aria-label="Sale actions"
                                aria-haspopup="menu"
                                :aria-expanded="openReceiptMenuId === receipt.id"
                              >
                                <EllipsisVerticalIcon class="w-4 h-4" stroke-width="2" />
                              </button>
                            </div>
                          </div>
                          </div>
                        </div>
                      </div>
                      <!-- Desktop / iOS native card table -->
                      <div
                        class="receipts-table-wrap hidden min-h-0 flex-1 flex-col sm:flex"
                        :class="isReceiptsFullscreen ? 'overflow-auto px-4 pb-2 pt-2 lg:px-8' : ''"
                      >
                        <div class="min-h-0 flex-1 overflow-x-auto">
                          <table class="dashboard-table min-w-full">
                            <thead :class="isReceiptsFullscreen ? 'sticky top-0 z-10' : ''">
                              <tr>
                                <th
                                  v-if="canDeleteReceipts"
                                  class="w-10 px-3 py-2.5 text-center text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400 sm:px-4"
                                >
                                  <Checkbox
                                    :model-value="
                                      paginatedReceipts.length > 0 &&
                                      selectedReceiptsForBulk.length === paginatedReceipts.length
                                    "
                                    @update:model-value="toggleSelectAllReceipts"
                                    size="sm"
                                    wrapper-class="justify-center"
                                  />
                                </th>
                                <th
                                  :class="[
                                    'px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400 sm:px-4',
                                    isColumnSortable('receiptNumber') &&
                                      'cursor-pointer hover:text-gray-900 dark:hover:text-gray-100',
                                  ]"
                                  @click="
                                    isColumnSortable('receiptNumber') && toggleSort('receiptNumber')
                                  "
                                >
                                  <div class="flex items-center gap-1.5">
                                    Sale #
                                    <template v-if="isColumnSortable('receiptNumber')">
                                      <ChevronUpIcon
                                        v-if="
                                          currentSort.key === 'receiptNumber' &&
                                          currentSort.order === 'asc'
                                        "
                                        class="w-3 h-3 text-primary-500 dark:text-primary-400"
                                      />
                                      <ChevronDownIcon
                                        v-else-if="
                                          currentSort.key === 'receiptNumber' &&
                                          currentSort.order === 'desc'
                                        "
                                        class="w-3 h-3 text-primary-500 dark:text-primary-400"
                                      />
                                      <BarsArrowUpIcon
                                        v-else
                                        class="w-3 h-3 text-gray-400 dark:text-gray-500 opacity-50"
                                      />
                                    </template>
                                  </div>
                                </th>
                                <th
                                  :class="[
                                    'px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400 sm:px-4',
                                    isColumnSortable('customerName') &&
                                      'cursor-pointer hover:text-gray-900 dark:hover:text-gray-100',
                                  ]"
                                  @click="
                                    isColumnSortable('customerName') && toggleSort('customerName')
                                  "
                                >
                                  <div class="flex items-center gap-1.5">
                                    Customer
                                    <template v-if="isColumnSortable('customerName')">
                                      <ChevronUpIcon
                                        v-if="
                                          currentSort.key === 'customerName' &&
                                          currentSort.order === 'asc'
                                        "
                                        class="w-3 h-3 text-primary-500 dark:text-primary-400"
                                      />
                                      <ChevronDownIcon
                                        v-else-if="
                                          currentSort.key === 'customerName' &&
                                          currentSort.order === 'desc'
                                        "
                                        class="w-3 h-3 text-primary-500 dark:text-primary-400"
                                      />
                                      <BarsArrowUpIcon
                                        v-else
                                        class="w-3 h-3 text-gray-400 dark:text-gray-500 opacity-50"
                                      />
                                    </template>
                                  </div>
                                </th>
                                <th
                                  :class="[
                                    'px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400 sm:px-4',
                                    isColumnSortable('date') &&
                                      'cursor-pointer hover:text-gray-900 dark:hover:text-gray-100',
                                  ]"
                                  @click="isColumnSortable('date') && toggleSort('date')"
                                >
                                  <div class="flex items-center gap-1.5">
                                    Date
                                    <template v-if="isColumnSortable('date')">
                                      <ChevronUpIcon
                                        v-if="
                                          currentSort.key === 'date' && currentSort.order === 'asc'
                                        "
                                        class="w-3 h-3 text-primary-500 dark:text-primary-400"
                                      />
                                      <ChevronDownIcon
                                        v-else-if="
                                          currentSort.key === 'date' && currentSort.order === 'desc'
                                        "
                                        class="w-3 h-3 text-primary-500 dark:text-primary-400"
                                      />
                                      <BarsArrowUpIcon
                                        v-else
                                        class="w-3 h-3 text-gray-400 dark:text-gray-500 opacity-50"
                                      />
                                    </template>
                                  </div>
                                </th>
                                <th
                                  :class="[
                                    'min-w-[9rem] max-w-[16rem] px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400 sm:px-4',
                                    isColumnSortable('itemsCount') &&
                                      'cursor-pointer hover:text-gray-900 dark:hover:text-gray-100',
                                  ]"
                                  @click="
                                    isColumnSortable('itemsCount') && toggleSort('itemsCount')
                                  "
                                >
                                  <div class="flex items-center gap-1.5">
                                    Items
                                    <template v-if="isColumnSortable('itemsCount')">
                                      <ChevronUpIcon
                                        v-if="
                                          currentSort.key === 'itemsCount' &&
                                          currentSort.order === 'asc'
                                        "
                                        class="w-3 h-3 text-primary-500 dark:text-primary-400"
                                      />
                                      <ChevronDownIcon
                                        v-else-if="
                                          currentSort.key === 'itemsCount' &&
                                          currentSort.order === 'desc'
                                        "
                                        class="w-3 h-3 text-primary-500 dark:text-primary-400"
                                      />
                                      <BarsArrowUpIcon
                                        v-else
                                        class="w-3 h-3 text-gray-400 dark:text-gray-500 opacity-50"
                                      />
                                    </template>
                                  </div>
                                </th>
                                <th
                                  :class="[
                                    'px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400 sm:px-4',
                                    isColumnSortable('total') &&
                                      'cursor-pointer hover:text-gray-900 dark:hover:text-gray-100',
                                  ]"
                                  @click="isColumnSortable('total') && toggleSort('total')"
                                >
                                  <div class="flex items-center gap-1.5">
                                    Total
                                    <template v-if="isColumnSortable('total')">
                                      <ChevronUpIcon
                                        v-if="
                                          currentSort.key === 'total' && currentSort.order === 'asc'
                                        "
                                        class="w-3 h-3 text-primary-500 dark:text-primary-400"
                                      />
                                      <ChevronDownIcon
                                        v-else-if="
                                          currentSort.key === 'total' &&
                                          currentSort.order === 'desc'
                                        "
                                        class="w-3 h-3 text-primary-500 dark:text-primary-400"
                                      />
                                      <BarsArrowUpIcon
                                        v-else
                                        class="w-3 h-3 text-gray-400 dark:text-gray-500 opacity-50"
                                      />
                                    </template>
                                  </div>
                                </th>
                                <th
                                  :class="[
                                    'px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400 sm:px-4',
                                    isColumnSortable('paymentMethod') &&
                                      'cursor-pointer hover:text-gray-900 dark:hover:text-gray-100',
                                  ]"
                                  @click="
                                    isColumnSortable('paymentMethod') && toggleSort('paymentMethod')
                                  "
                                >
                                  <div class="flex items-center gap-1.5">
                                    Payment
                                    <template v-if="isColumnSortable('paymentMethod')">
                                      <ChevronUpIcon
                                        v-if="
                                          currentSort.key === 'paymentMethod' &&
                                          currentSort.order === 'asc'
                                        "
                                        class="w-3 h-3 text-primary-500 dark:text-primary-400"
                                      />
                                      <ChevronDownIcon
                                        v-else-if="
                                          currentSort.key === 'paymentMethod' &&
                                          currentSort.order === 'desc'
                                        "
                                        class="w-3 h-3 text-primary-500 dark:text-primary-400"
                                      />
                                      <BarsArrowUpIcon
                                        v-else
                                        class="w-3 h-3 text-gray-400 dark:text-gray-500 opacity-50"
                                      />
                                    </template>
                                  </div>
                                </th>
                                <th
                                  :class="[
                                    'px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400 sm:px-4',
                                    isColumnSortable('status') &&
                                      'cursor-pointer hover:text-gray-900 dark:hover:text-gray-100',
                                  ]"
                                  @click="isColumnSortable('status') && toggleSort('status')"
                                >
                                  <div class="flex items-center gap-1.5">
                                    Status
                                    <template v-if="isColumnSortable('status')">
                                      <ChevronUpIcon
                                        v-if="
                                          currentSort.key === 'status' &&
                                          currentSort.order === 'asc'
                                        "
                                        class="w-3 h-3 text-primary-500 dark:text-primary-400"
                                      />
                                      <ChevronDownIcon
                                        v-else-if="
                                          currentSort.key === 'status' &&
                                          currentSort.order === 'desc'
                                        "
                                        class="w-3 h-3 text-primary-500 dark:text-primary-400"
                                      />
                                      <BarsArrowUpIcon
                                        v-else
                                        class="w-3 h-3 text-gray-400 dark:text-gray-500 opacity-50"
                                      />
                                    </template>
                                  </div>
                                </th>
                                <th
                                  :class="[
                                    'px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400 sm:px-4',
                                    isColumnSortable('createdBy') &&
                                      'cursor-pointer hover:text-gray-900 dark:hover:text-gray-100',
                                  ]"
                                  @click="isColumnSortable('createdBy') && toggleSort('createdBy')"
                                >
                                  <div class="flex items-center gap-1.5">
                                    Created By
                                    <template v-if="isColumnSortable('createdBy')">
                                      <ChevronUpIcon
                                        v-if="
                                          currentSort.key === 'createdBy' &&
                                          currentSort.order === 'asc'
                                        "
                                        class="w-3 h-3 text-primary-500 dark:text-primary-400"
                                      />
                                      <ChevronDownIcon
                                        v-else-if="
                                          currentSort.key === 'createdBy' &&
                                          currentSort.order === 'desc'
                                        "
                                        class="w-3 h-3 text-primary-500 dark:text-primary-400"
                                      />
                                      <BarsArrowUpIcon
                                        v-else
                                        class="w-3 h-3 text-gray-400 dark:text-gray-500 opacity-50"
                                      />
                                    </template>
                                  </div>
                                </th>
                                <th
                                  class="w-12 px-3 py-2.5 text-right text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400 sm:w-[4.5rem] sm:px-4"
                                >
                                  Actions
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              <template v-for="receipt in paginatedReceipts" :key="receipt.id">
                                <tr
                                  :data-receipt-row="receipt.id"
                                  :data-receipt-flash="
                                    flashReceiptId === receipt.id ? '' : undefined
                                  "
                                  :class="[
                                    flashReceiptId === receipt.id
                                      ? '!bg-primary-500/[0.06] dark:!bg-primary-500/12'
                                      : '',
                                    expandedReceiptLineItems[receipt.id]
                                      ? 'bg-gray-50/50 dark:bg-white/[0.02]'
                                      : '',
                                  ]"
                                >
                                  <td
                                    v-if="canDeleteReceipts"
                                    class="w-10 px-3 py-2.5 text-center align-middle sm:px-4"
                                  >
                                    <Checkbox
                                      :model-value="
                                        selectedReceiptsForBulk.some((r) => r.id === receipt.id)
                                      "
                                      @update:model-value="
                                        (checked) => toggleReceiptSelection(receipt, checked)
                                      "
                                      size="sm"
                                      wrapper-class="justify-center"
                                      @click.stop
                                    />
                                  </td>
                                  <td class="px-3 py-2.5 align-middle sm:px-4">
                                    <div class="flex flex-wrap items-center gap-1.5">
                                      <span
                                        class="text-xs font-semibold tabular-nums text-gray-900 dark:text-gray-50"
                                      >
                                        {{ receipt.receiptNumber }}
                                      </span>
                                      <button
                                        type="button"
                                        @click.stop="copyReceiptNumber(receipt.receiptNumber)"
                                        class="rounded-sm p-0.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-primary-600 dark:hover:bg-gray-800/90 dark:hover:text-primary-400"
                                        aria-label="Copy receipt number"
                                      >
                                        <ClipboardDocumentIcon
                                          class="w-3.5 h-3.5"
                                          stroke-width="1.5"
                                        />
                                      </button>
                                      <span
                                        v-if="receipt.isSwapIn"
                                        class="inline-flex items-center rounded-full bg-sky-50 px-2 py-0.5 text-[9px] font-semibold text-sky-800 dark:bg-sky-500/15 dark:text-sky-200"
                                        title="Swap-in transaction"
                                      >
                                        Swap
                                      </span>
                                    </div>
                                  </td>
                                  <td class="max-w-[12rem] px-3 py-2.5 align-middle sm:px-4">
                                    <p
                                      class="truncate text-xs font-medium text-gray-900 dark:text-gray-50"
                                    >
                                      {{ receipt.customerName }}
                                    </p>
                                    <p
                                      v-if="receipt.customerPhone || receipt.customerEmail"
                                      class="mt-0.5 truncate text-[11px] tabular-nums text-gray-500 dark:text-gray-400"
                                    >
                                      {{ receipt.customerPhone || receipt.customerEmail }}
                                    </p>
                                  </td>
                                  <td class="whitespace-nowrap px-3 py-2.5 align-middle sm:px-4">
                                    <span
                                      class="text-xs tabular-nums text-gray-600 dark:text-gray-300"
                                    >
                                      {{ formatDate(receipt.date) }}
                                    </span>
                                  </td>
                                  <td
                                    class="min-w-[9rem] max-w-[16rem] px-3 py-2.5 align-middle sm:px-4"
                                  >
                                    <p
                                      v-if="getReceiptLineItemsPreview(receipt)"
                                      class="truncate text-xs text-gray-800 dark:text-gray-200"
                                    >
                                      {{ getReceiptLineItemsPreview(receipt) }}
                                    </p>
                                    <p v-else class="text-xs text-gray-500">{{ EMPTY_CELL }}</p>
                                    <ReceiptLineItemsToggle
                                      v-if="getReceiptLineItemsCount(receipt) > 0"
                                      :expanded="!!expandedReceiptLineItems[receipt.id]"
                                      :item-count="getReceiptLineItemsCount(receipt)"
                                      @toggle="toggleReceiptLineItemsExpand(receipt.id)"
                                    />
                                  </td>
                                  <td class="whitespace-nowrap px-3 py-2.5 align-middle sm:px-4">
                                    <span class="text-xs" :class="tableMoneyClass()">
                                      {{ formatCurrency(receipt.total) }}
                                    </span>
                                    <ReceiptProfitHint :receipt="receipt" class="mt-0.5" />
                                  </td>
                                  <td class="whitespace-nowrap px-3 py-2.5 align-middle sm:px-4">
                                    <span class="text-xs text-gray-700 dark:text-gray-300">
                                      {{ formatPaymentMethod(receipt.paymentMethod) }}
                                    </span>
                                  </td>
                                  <td class="px-3 py-2.5 align-middle sm:px-4">
                                    <ReceiptStatusBadge :badge="receiptStatusBadge(receipt)" />
                                  </td>
                                  <td class="max-w-[10rem] px-3 py-2.5 align-middle sm:px-4">
                                    <p class="truncate text-xs text-gray-600 dark:text-gray-300">
                                      {{
                                        receipt.createdByUserName ||
                                        getCreatorName(receipt.actualCreator || receipt.createdBy)
                                      }}
                                    </p>
                                  </td>
                                  <td class="px-4 py-2 text-right align-middle sm:px-5">
                                    <div
                                      class="relative inline-flex justify-end"
                                      @click.stop
                                    >
                                      <button
                                        type="button"
                                        :data-receipt-actions-anchor="receipt.id"
                                        @click="toggleReceiptMenu(receipt.id)"
                                        class="inline-flex h-8 w-8 items-center justify-center rounded-xl text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800/85 dark:hover:text-gray-100"
                                        aria-label="Sale actions"
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
                                  class="bg-gray-50/40 dark:bg-white/[0.015]"
                                >
                                  <td
                                    :colspan="receiptLineItemsDetailColspan"
                                    class="border-t-0 px-3 pb-3 pt-0 sm:px-4"
                                  >
                                    <div
                                      class="border-l-2 border-primary-400/70 pl-3 dark:border-primary-500/50"
                                    >
                                      <ReceiptLineItemsDetailPanel
                                        :item-count="getReceiptLineItemsCount(receipt)"
                                      >
                                        <ReceiptTableLineItems
                                          :items="receipt.items"
                                          :items-count-fallback="receipt.itemsCount"
                                        />
                                      </ReceiptLineItemsDetailPanel>
                                    </div>
                                  </td>
                                </tr>
                              </template>
                            </tbody>
                          </table>
                        </div>
                        <DashboardTablePagination
                          v-if="sortedFilteredReceipts.length > 0 && !isReceiptsFullscreen"
                          :current-page="currentPage"
                          :items-per-page="itemsPerPage"
                          :total="sortedFilteredReceipts.length"
                          @page-change="handlePageChange"
                        />
                      </div>
                    </div>
                  </template>

                  <!-- Fullscreen: pagination pinned inside overlay -->
                  <DashboardTablePagination
                    v-if="isReceiptsFullscreen && sortedFilteredReceipts.length > 0"
                    :pin-to-viewport="false"
                    class="shrink-0"
                    style="padding-bottom: env(safe-area-inset-bottom, 0px)"
                    :current-page="currentPage"
                    :items-per-page="itemsPerPage"
                    :total="sortedFilteredReceipts.length"
                    @page-change="handlePageChange"
                  />
                </div>
              </div>
            </Teleport>

            <!-- Create Receipt Modal -->
            <CreateReceiptModal
              v-model="showCreateReceiptModal"
              @receipt-created="handleReceiptCreated"
            />

            <QuickSaleModal v-model="showQuickSaleModal" @sale-completed="handleQuickSaleCompleted" />

            <!-- View Receipt Modal -->
            <ViewReceiptModal v-model="showViewReceiptModal" :receipt="selectedReceipt" />

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
                  <div
                    class="w-8 h-8 rounded-sm bg-red-100 dark:bg-red-900/30 flex items-center justify-center"
                  >
                    <TrashIcon class="w-4 h-4 text-red-600 dark:text-red-400" />
                  </div>
                  <div class="min-w-0">
                    <h3 class="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      Delete selected sales
                    </h3>
                    <p class="text-xs text-gray-500 dark:text-gray-400">
                      {{ selectedReceiptsForBulk.length }} sale{{
                        selectedReceiptsForBulk.length !== 1 ? 's' : ''
                      }}
                      selected
                    </p>
                  </div>
                </div>
              </template>
              <div class="space-y-3">
                <div
                  class="p-3 bg-red-50 dark:bg-red-900/20 ring-1 ring-red-200/50 dark:ring-red-800/40 rounded-sm"
                >
                  <p class="text-xs text-red-800 dark:text-red-200">
                    This will permanently delete the selected sales. This action cannot be
                    undone. Associated customer data may be affected.
                  </p>
                </div>
                <div class="rounded-sm bg-gray-50 p-2.5 dark:!bg-dashboard-card/35">
                  <Checkbox
                    v-model="bulkDeleteReceiptsConfirmed"
                    label="I understand that these sales will be permanently deleted."
                    size="sm"
                    wrapper-class="items-start"
                    label-class="text-xs text-gray-700 dark:text-gray-300"
                  />
                </div>
              </div>
              <template #footer>
                <IosDrawerActions
                  primary-variant="danger"
                  :primary-icon="TrashIcon"
                  :primary-label="
                    isBulkDeletingReceipts
                      ? 'Deleting...'
                      : `Delete ${selectedReceiptsForBulk.length} sale${
                          selectedReceiptsForBulk.length !== 1 ? 's' : ''
                        }`
                  "
                  :primary-disabled="!bulkDeleteReceiptsConfirmed || isBulkDeletingReceipts"
                  @cancel="
                    () => {
                      showBulkDeleteReceiptsModal = false
                      bulkDeleteReceiptsConfirmed = false
                    }
                  "
                  @primary="handleConfirmBulkDeleteReceipts"
                />
              </template>
            </Modal>
            <DeleteReceiptModal
              v-model="showDeleteReceiptModal"
              :receipt="selectedReceipt"
              @confirmDelete="handleReceiptConfirmDelete"
            />

            <!-- Receipt Timeline Modal -->
            <ReceiptTimelineModal v-model="showTimelineModal" :receipt="selectedReceipt" />
          </template>

          <!-- Outstanding (balance due) tab -->
          <template v-else-if="activeTab === 'outstanding'">
            <div :class="tableShellFlexClass">
              <DataTableToolbar
                v-if="!receiptsStore.loading"
                native-table-key="receipts-outstanding"
              >
                <template #filters>
                  <DashboardToolbarSearch
                    v-model="outstandingSearchQuery"
                    placeholder="Search customer or receipt #…"
                    wrapper-class="sm:max-w-xs"
                  />
                </template>
              </DataTableToolbar>

              <DashTableSkeleton
                v-if="receiptsStore.loading"
                :columns="outstandingTableSkeletonColumns"
                :rows="8"
                leading="none"
                show-toolbar
                flush
                aria-label="Loading outstanding payments"
              />

              <DashboardTableEmptyState
                v-else-if="filteredOutstandingReceipts.length === 0"
                :icon="ClockIcon"
                title="No outstanding payments"
                description="Create a sale with “Balance due” when a customer pays a deposit. It will appear here until paid in full."
                :tips="[
                  'Record partial payments from the Actions menu on each row',
                  'The balance clears automatically when paid in full',
                ]"
              />

              <div v-else class="outstanding-table-wrap min-h-0 flex-1 overflow-x-auto">
                <table class="dashboard-table min-w-full">
                  <thead>
                    <tr>
                      <th class="text-left">Sale</th>
                      <th class="text-left">Customer</th>
                      <th class="hidden text-left md:table-cell">Items</th>
                      <th class="text-right">Total</th>
                      <th class="text-right">Paid</th>
                      <th class="text-right">Balance</th>
                      <th class="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="row in filteredOutstandingReceipts" :key="row.id">
                      <td class="px-3 py-3 text-xs font-medium text-gray-900 dark:text-gray-100">
                        {{ row.receiptNumber }}
                        <p class="mt-0.5 text-[10px] font-normal text-gray-500">
                          {{ formatDate(row.date) }}
                        </p>
                      </td>
                      <td class="px-3 py-3 text-xs text-gray-700 dark:text-gray-300">
                        <p class="font-medium text-gray-900 dark:text-gray-100">
                          {{ row.customerName }}
                        </p>
                        <p v-if="row.customerPhone" class="text-[10px] text-gray-500">
                          {{ row.customerPhone }}
                        </p>
                        <p v-if="row.customerEmail" class="text-[10px] text-gray-500">
                          {{ row.customerEmail }}
                        </p>
                      </td>
                      <td
                        class="hidden px-3 py-3 text-xs text-gray-600 dark:text-gray-400 md:table-cell"
                      >
                        {{ getReceiptLineItemsPreview(row) || EMPTY_CELL }}
                      </td>
                      <td class="px-3 py-3 text-right text-xs" :class="tableMoneyClass()">
                        {{ formatCurrency(row.total) }}
                      </td>
                      <td class="px-3 py-3 text-right text-xs" :class="tableMoneyClass()">
                        {{ formatCurrency(outstandingAmountPaid(row)) }}
                      </td>
                      <td class="px-3 py-3 text-right text-xs" :class="tableMoneyOwedClass()">
                        {{ formatCurrency(outstandingBalanceDue(row)) }}
                      </td>
                      <td class="px-3 py-3">
                        <div class="flex flex-wrap justify-end gap-1.5">
                          <button
                            type="button"
                            class="btn-primary btn-primary-sm"
                            @click="openRecordPayment(row)"
                          >
                            Record payment
                          </button>
                          <button
                            type="button"
                            class="rounded-sm bg-white px-3 py-1 text-[11px] font-semibold text-gray-700 hover:bg-gray-50 dark:bg-gray-900/40 dark:text-gray-300 dark:hover:bg-gray-800"
                            @click="viewOutstandingReceipt(row)"
                          >
                            View
                          </button>
                          <button
                            v-if="canEditReceipts"
                            type="button"
                            class="rounded-sm border border-red-200/80 bg-white px-3 py-1 text-[11px] font-semibold text-red-700 hover:bg-red-50 dark:border-red-900/40 dark:bg-gray-900/40 dark:text-red-300 dark:hover:bg-red-950/30"
                            @click="cancelOutstandingReceipt(row)"
                          >
                            Cancel
                          </button>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </template>

          <!-- Customers tab -->
          <template v-else-if="activeTab === 'customers'">
            <div :class="tableShellFlexClass">
              <DataTableToolbar
                v-if="!receiptsStore.loading"
                native-table-key="receipts-customers"
              >
                <template #filters>
                  <DashboardToolbarSearch
                    v-model="customersSearchQuery"
                    placeholder="Search customers…"
                    wrapper-class="sm:max-w-xs"
                  />
                  <DashboardToolbarSelect
                    v-model="customersSortBy"
                    min-width-class="min-w-[6.5rem]"
                  >
                    <option value="name">Name</option>
                    <option value="orders">Orders</option>
                    <option value="spent">Total Spent</option>
                    <option value="lastOrder">Last Order</option>
                  </DashboardToolbarSelect>
                </template>
              </DataTableToolbar>
              <DashTableSkeleton
                v-if="receiptsStore.loading"
                :columns="customersTableSkeletonColumns"
                :rows="8"
                leading="none"
                show-toolbar
                flush
                aria-label="Loading customers"
              />
              <DashboardTableEmptyState
                v-else-if="filteredCustomers.length === 0"
                :icon="UsersIcon"
                :title="customersSearchQuery ? 'No customers found' : 'No customers yet'"
                :description="
                  customersSearchQuery
                    ? 'Try another name, phone number, or email.'
                    : 'Customers are created automatically when you add them on a sale.'
                "
                :tips="
                  customersSearchQuery
                    ? [
                        'Search matches name, phone, and email fields',
                        'Clear search to see your full customer list',
                      ]
                    : [
                        'Each sale links to a customer profile',
                        'Expand a row to see order history and totals',
                      ]
                "
              />
              <div v-else class="flex min-h-0 flex-1 flex-col">
                <div class="customers-table-wrap min-h-0 flex-1 overflow-x-auto">
                  <table class="dashboard-table min-w-full">
                    <thead>
                      <tr>
                        <th
                          class="min-w-[90px] px-3 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400 sm:min-w-[100px] sm:px-4"
                        >
                          Sales
                        </th>
                        <th
                          class="px-3 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400 sm:px-4"
                        >
                          Customer
                        </th>
                        <th
                          class="px-3 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400 sm:px-4"
                        >
                          Contact
                        </th>
                        <th
                          class="px-3 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400 sm:px-4"
                        >
                          Orders
                        </th>
                        <th
                          class="px-3 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400 sm:px-4"
                        >
                          Total Spent
                        </th>
                        <th
                          v-if="hasBalanceFeature"
                          class="px-3 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400 sm:px-4"
                        >
                          Balance
                        </th>
                        <th
                          class="px-3 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400 sm:px-4"
                        >
                          Last Order
                        </th>
                        <th
                          class="w-12 px-3 py-3 text-right text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400 sm:w-[4.5rem] sm:px-4"
                        >
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <template v-for="customer in paginatedCustomers" :key="customer.id">
                        <tr
                          :class="
                            expandedCustomers[customer.id]
                              ? 'bg-gray-50/50 dark:bg-white/[0.02]'
                              : ''
                          "
                        >
                          <td class="px-3 py-2.5 align-middle sm:px-4">
                            <ReceiptLineItemsToggle
                              v-if="getCustomerReceipts(customer.id).length > 0"
                              :expanded="!!expandedCustomers[customer.id]"
                              :item-count="getCustomerReceipts(customer.id).length"
                              noun="sale"
                              hide-text="Hide orders"
                              no-top-margin
                              @toggle="toggleCustomerExpanded(customer.id)"
                            />
                            <span v-else class="text-[10px] text-gray-400 dark:text-gray-500">-</span>
                          </td>
                          <td class="px-3 py-2.5 sm:px-4">
                            <div class="flex items-center gap-2">
                              <span
                                class="text-[10px] font-medium text-gray-900 dark:text-gray-100"
                                >{{ customer.name }}</span
                              >
                            </div>
                          </td>
                          <td class="px-3 py-2.5 sm:px-4">
                            <div class="space-y-0.5">
                              <p
                                v-if="customer.email"
                                class="text-[10px] text-gray-600 dark:text-gray-300 truncate"
                              >
                                {{ customer.email }}
                              </p>
                              <p
                                v-if="customer.phone"
                                class="text-[10px] text-gray-600 dark:text-gray-300 truncate"
                              >
                                {{ customer.phone }}
                              </p>
                              <p
                                v-if="!customer.email && !customer.phone"
                                class="text-[10px] text-gray-400 dark:text-gray-500"
                              >
                                -
                              </p>
                            </div>
                          </td>
                          <td class="px-3 py-2.5 sm:px-4">
                            <span class="text-[10px] text-gray-600 dark:text-gray-300">{{
                              customer.receipts.length
                            }}</span>
                          </td>
                          <td class="px-3 py-2.5 sm:px-4">
                            <span class="text-[10px]" :class="tableMoneyClass()">{{
                              formatCurrency(customer.totalSpent)
                            }}</span>
                          </td>
                          <td v-if="hasBalanceFeature" class="px-3 py-2.5 sm:px-4">
                            <span
                              v-if="getCustomerBalance(customer) > 0"
                              :class="tableMoneyOwedClass() + ' text-[10px]'"
                            >
                              {{ formatCurrency(getCustomerBalance(customer)) }}
                            </span>
                            <span v-else class="text-[10px] text-gray-400 dark:text-gray-500">{{
                              EMPTY_CELL
                            }}</span>
                          </td>
                          <td class="px-3 py-2.5 sm:px-4">
                            <span class="text-[10px] text-gray-600 dark:text-gray-300">{{
                              formatDate(customer.lastOrderDate)
                            }}</span>
                          </td>
                          <td class="px-3 py-2.5 sm:px-4 text-right">
                            <div
                              class="relative inline-flex justify-end"
                              @click.stop
                            >
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
                        <tr
                          v-if="expandedCustomers[customer.id]"
                          class="bg-gray-50/40 dark:bg-white/[0.015]"
                        >
                          <td :colspan="hasBalanceFeature ? 8 : 7" class="border-t-0 px-3 pb-3 pt-0 sm:px-4">
                            <div
                              class="border-l-2 border-primary-400/70 pl-3 dark:border-primary-500/50"
                            >
                              <ReceiptLineItemsDetailPanel
                                title="Order history"
                                count-noun="sale"
                                :item-count="getCustomerReceipts(customer.id).length"
                              >
                                <div class="space-y-2">
                                  <article
                                    v-for="receipt in getCustomerReceipts(customer.id)"
                                    :key="receipt.id"
                                    class="overflow-hidden rounded-md border border-gray-200/80 bg-white dark:border-gray-700/50 dark:bg-gray-900/40"
                                  >
                                    <button
                                      type="button"
                                      class="flex w-full flex-wrap items-center justify-between gap-x-3 gap-y-1 border-b border-gray-100 px-3 py-2 text-left transition-colors hover:bg-gray-50/90 dark:border-gray-800/80 dark:hover:bg-white/[0.03] focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-400/35"
                                      :aria-label="`Open sale ${receipt.receiptNumber} in sales list`"
                                      @click="goToReceiptFromCustomer(receipt)"
                                    >
                                      <div class="min-w-0">
                                        <p class="text-xs font-semibold tabular-nums text-gray-900 dark:text-gray-50">
                                          #{{ receipt.receiptNumber }}
                                        </p>
                                        <p class="mt-0.5 text-[10px] tabular-nums text-gray-500 dark:text-gray-400">
                                          {{ formatDate(receipt.date) }}, {{ formatTime(receipt.date) }}
                                        </p>
                                      </div>
                                      <div class="flex shrink-0 items-center gap-2">
                                        <span class="text-xs" :class="tableMoneyClass()">
                                          {{ formatCurrency(receipt.total) }}
                                        </span>
                                        <ReceiptStatusBadge :badge="receiptStatusBadge(receipt)" />
                                      </div>
                                    </button>
                                    <div class="px-1 py-1">
                                      <ReceiptTableLineItems
                                        v-if="receipt.items?.length"
                                        :items="receipt.items"
                                        :items-count-fallback="receipt.itemsCount"
                                        compact
                                      />
                                      <p
                                        v-else
                                        class="px-2 py-2 text-[11px] text-gray-500 dark:text-gray-400"
                                      >
                                        {{ receipt.itemsCount }} item{{
                                          receipt.itemsCount === 1 ? '' : 's'
                                        }}
                                        · open in Sales for full details
                                      </p>
                                    </div>
                                  </article>
                                </div>
                              </ReceiptLineItemsDetailPanel>
                            </div>
                          </td>
                        </tr>
                      </template>
                    </tbody>
                  </table>
                </div>
                <DashboardTablePagination
                  v-if="filteredCustomers.length > 0"
                  :current-page="customersCurrentPage"
                  :items-per-page="customersItemsPerPage"
                  :total="filteredCustomers.length"
                  @page-change="handleCustomersPageChange"
                />
              </div>
            </div>
          </template>
        </div>
      </template>
    </div>
    <template #fallback>
      <div class="flex min-h-[40vh] w-full max-w-none items-center justify-center px-4 pb-24">
        <div class="text-center">
          <div
            class="mx-auto h-10 w-10 animate-spin rounded-full border-0 border-gray-200 border-t-primary-500 dark:border-t-primary-400"
          />
          <p class="mt-3 text-xs text-gray-500 dark:text-gray-400">Loading sales…</p>
        </div>
      </div>
    </template>
  </ClientOnly>

  <!-- Receipt / customer actions (teleported; not clipped by table/card overflow) -->
  <IosContextMenu
    ref="receiptMenuPanelRef"
    :open="Boolean(openReceiptMenuId && receiptForOpenMenu && receiptMenuFixedStyle)"
    :style="receiptMenuFixedStyle"
    menu-id="receipt"
  >
    <IosContextMenuItem
      label="History"
      :icon="ClockIcon"
      @click="
        () => {
          handleViewReceiptTimeline(receiptForOpenMenu!)
          openReceiptMenuId = null
        }
      "
    />
    <IosContextMenuItem
      label="View sale"
      :icon="EyeIcon"
      @click="
        () => {
          handleViewReceipt(receiptForOpenMenu!)
          openReceiptMenuId = null
        }
      "
    />
    <IosContextMenuItem
      v-if="receiptForOpenMenu?.status === 'completed' && canEditReceipts"
      label="Refund"
      :icon="ArrowPathIcon"
      @click="
        () => {
          handleRefundReceipt(receiptForOpenMenu!)
          openReceiptMenuId = null
        }
      "
    />
    <IosContextMenuItem
      v-if="canDeleteReceipts"
      label="Delete"
      :icon="TrashIcon"
      danger
      @click="
        () => {
          handleDeleteReceipt(receiptForOpenMenu!)
          openReceiptMenuId = null
        }
      "
    />
  </IosContextMenu>
  <IosContextMenu
    ref="customerMenuPanelRef"
    :open="Boolean(openCustomerMenuId && customerForOpenMenu && customerMenuFixedStyle)"
    :style="customerMenuFixedStyle"
    menu-id="customer"
  >
    <IosContextMenuItem
      label="View sales"
      :icon="PrinterIcon"
      @click="
        () => {
          viewCustomerReceipts(customerForOpenMenu!)
          openCustomerMenuId = null
        }
      "
    />
    <IosContextMenuItem
      v-if="hasBalanceFeature"
      label="Manage balance"
      @click="
        () => {
          openCustomerBalance(customerForOpenMenu!)
          openCustomerMenuId = null
        }
      "
    />
    <IosContextMenuItem
      v-if="hasWhatsAppFeature && (customerForOpenMenu?.phone || customerForOpenMenu?.email)"
      label="WhatsApp payment reminder"
      @click="
        () => {
          openCustomerPaymentReminder(customerForOpenMenu!)
          openCustomerMenuId = null
        }
      "
    />
  </IosContextMenu>

  <CustomerBalanceModal
    v-if="customerBalanceTarget"
    v-model="showCustomerBalanceModal"
    :customer-name="customerBalanceTarget.name"
    :email="customerBalanceTarget.email"
    :phone="customerBalanceTarget.phone"
    @saved="onCustomerBalanceSaved"
  />

  <SendWhatsAppModal
    v-model="showCustomerWhatsAppModal"
    mode="payment_reminder"
    :phone="customerWhatsAppTarget?.phone || ''"
    :email="customerWhatsAppTarget?.email || ''"
    :template-vars="customerWhatsAppVars"
    :store-name="userStore.userData?.storeDetails?.storeName || storesStore.currentStore?.name"
  />

  <BalanceDuePaymentModal
    v-model="showBalancePaymentModal"
    :receipt="balancePaymentReceipt"
    @completed="onBalancePaymentCompleted"
  />
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import {
  ReceiptPercentIcon,
  PlusIcon,
  FunnelIcon,
  ArrowUturnLeftIcon,
  CurrencyDollarIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  ArrowDownTrayIcon,
  PrinterIcon,
  EyeIcon,
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
  ArrowTopRightOnSquareIcon,
  EllipsisVerticalIcon,
  QrCodeIcon,
  CheckIcon,
} from '~/utils/app-icons'
import Button from '~/components/ui/Button.vue'
import IosDrawerActions from '~/components/ios/IosDrawerActions.vue'
import IosQuickActionSkeleton from '~/components/ios/IosQuickActionSkeleton.vue'
import IosTransactionListSkeleton from '~/components/ios/IosTransactionListSkeleton.vue'
import DataTableToolbar from '~/components/ui/DataTableToolbar.vue'
import Modal from '~/components/ui/Modal.vue'
import Checkbox from '~/components/ui/Checkbox.vue'
// @ts-ignore
import CreateReceiptModal from '~/components/receipts/CreateReceiptModal.vue'
import IosQuickActionBar, {
  type IosQuickActionOption,
} from '~/components/ios/IosQuickActionBar.vue'
import IosDrawer from '~/components/ios/IosDrawer.vue'
import IosContextMenu from '~/components/ios/IosContextMenu.vue'
import IosContextMenuItem from '~/components/ios/IosContextMenuItem.vue'
import IosSearchBar from '~/components/ios/IosSearchBar.vue'
import IosSwipeActions, { type IosSwipeAction } from '~/components/ios/IosSwipeActions.vue'
import IosPageNavBar from '~/components/ios/IosPageNavBar.vue'
import IosReceiptTransactionRow from '~/components/ios/IosReceiptTransactionRow.vue'
import type {
  ReceiptTransactionAmountTone,
  ReceiptTransactionVariant,
} from '~/components/ios/IosReceiptTransactionRow.vue'
// @ts-ignore
import QuickSaleModal from '~/components/receipts/QuickSaleModal.vue'
// @ts-ignore
import ViewReceiptModal from '~/components/receipts/ViewReceiptModal.vue'
import ReceiptTableLineItems from '~/components/receipts/ReceiptTableLineItems.vue'
import ReceiptLineItemsToggle from '~/components/receipts/ReceiptLineItemsToggle.vue'
import ReceiptLineItemsDetailPanel from '~/components/receipts/ReceiptLineItemsDetailPanel.vue'
import { getReceiptStatusBadge } from '~/utils/receipt-status'
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
import { useAppToast } from '~/composables/useAppToast'
import {
  getVisibleMenuAnchorElement,
  computeFixedAnchoredMenuStyle,
  isInsideAnchoredMenu,
} from '~/utils/menuAnchor'
import { scheduleNativeIdleWork } from '~/utils/capacitor-native-perf'
import { EMPTY_CELL } from '~/utils/ui-empty'
import { getCustomerContactKey } from '~/utils/customer-key'
import { useCustomerAccountsStore } from '~/stores/customerAccounts'
import SendWhatsAppModal from '~/components/whatsapp/SendWhatsAppModal.vue'
import CustomerBalanceModal from '~/components/whatsapp/CustomerBalanceModal.vue'
import BalanceDuePaymentModal from '~/components/receipts/BalanceDuePaymentModal.vue'
import { receiptAmountPaid, receiptBalanceDue } from '~/utils/receipt-balance'
import { tableMoneyClass, tableMoneyOwedClass } from '~/utils/table-money-styles'

definePageMeta({
  layout: 'dashboard',
  ssr: false,
})

useHead({
  title: 'Sales - Storvv',
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
const customerAccountsStore = useCustomerAccountsStore()
const { hasFeature: hasWhatsAppFeature, hasBalanceFeature } = useWhatsAppMessaging()
const userStore = useUserStore()

const showCustomerBalanceModal = ref(false)
const showCustomerWhatsAppModal = ref(false)
const customerBalanceTarget = ref<CustomerDisplay | null>(null)
const customerWhatsAppTarget = ref<CustomerDisplay | null>(null)

const customerWhatsAppVars = computed(() => {
  const c = customerWhatsAppTarget.value
  if (!c) return {}
  const balance = getCustomerBalance(c)
  return {
    customerName: c.name,
    storeName:
      userStore.userData?.storeDetails?.storeName || storesStore.currentStore?.name || 'Store',
    balanceDue: formatCurrency(balance),
  }
})

function getCustomerBalance(customer: CustomerDisplay): number {
  return customerAccountsStore.getBalanceForContactKey(customer.contactKey)
}

function openCustomerBalance(customer: CustomerDisplay) {
  customerBalanceTarget.value = customer
  showCustomerBalanceModal.value = true
}

function openCustomerPaymentReminder(customer: CustomerDisplay) {
  if (!customer.phone && !customer.email) {
    toast.error('Add a phone number or email on sales for this customer first.')
    return
  }
  customerWhatsAppTarget.value = customer
  showCustomerWhatsAppModal.value = true
}

function onCustomerBalanceSaved() {
  void customerAccountsStore.fetchAccountsForStore()
}

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

const activeTab = ref<'receipts' | 'outstanding' | 'customers'>(
  (['receipts', 'outstanding', 'customers'].includes(String(route.query.tab))
    ? route.query.tab
    : 'receipts') as 'receipts' | 'outstanding' | 'customers'
)
const outstandingSearchQuery = ref('')
const showBalancePaymentModal = ref(false)
const balancePaymentReceipt = ref<Receipt | null>(null)
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
watch(
  [isReceiptsFullscreen, isCustomersFullscreen],
  ([receiptsFullscreen, customersFullscreen]) => {
    if (import.meta.client) {
      if (receiptsFullscreen || customersFullscreen) {
        document.body.style.overflow = 'hidden'
      } else {
        document.body.style.overflow = ''
      }
    }
  }
)

// Watch for tab changes and update URL
watch(activeTab, (newTab) => {
  const q = { ...route.query, tab: newTab } as Record<string, string | string[] | null | undefined>
  if (newTab !== 'receipts') {
    delete q.highlight
    clearReceiptHighlightTimer()
    flashReceiptId.value = null
  }
  void router.replace({ query: q })
  if (newTab === 'customers' && hasBalanceFeature.value) {
    void customerAccountsStore.fetchAccountsForStore()
  }
})

// Initialize loading state synchronously on client
const isInitialLoading = ref(true)
const {
  headerBtnClass,
  headerBtnLabelClass,
  pageTitleClass,
  segmentTabsClass,
  segmentTabsBtnClass,
  segmentTabsBtnActiveClass,
} = useDashboardPageChrome()
const { isCapacitorIos } = useIsCapacitorIos()

const iosSalesNavTitle = computed(() => {
  switch (activeTab.value) {
    case 'outstanding':
      return 'Outstanding'
    case 'customers':
      return 'Customers'
    default:
      return 'Transactions'
  }
})

const { tableShellFlexClass, tableExpandClass, tableExpandHeaderClass, tableExpandBodyClass, tableExpandCloseClass, tableExpandEyebrowClass, tableExpandTitleClass, tableExpandMetaClass, tableExpandFieldClass } = useDashboardTableChrome()

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
/** Expandable full line-item details (desktop secondary row + mobile accordion) */
const expandedReceiptLineItems = ref<Record<string, boolean>>({})
const receiptLineItemsDetailColspan = computed(() => (canDeleteReceipts.value ? 10 : 9))

const getReceiptLineItemsCount = (receipt: Receipt) =>
  receipt.items?.length ?? receipt.itemsCount ?? 0

const receiptStatusBadge = (receipt: Receipt) => getReceiptStatusBadge(receipt.status)

const formatPaymentMethod = (method: string | undefined) => {
  if (!method?.trim()) return EMPTY_CELL
  const m = method.trim()
  return m.charAt(0).toUpperCase() + m.slice(1)
}

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
  { key: 'receiptNumber', label: 'Sale #' },
  { key: 'customerName', label: 'Customer' },
  { key: 'date', label: 'Date' },
  { key: 'itemsCount', label: 'Items' },
  { key: 'total', label: 'Total' },
  { key: 'paymentMethod', label: 'Payment' },
  { key: 'status', label: 'Status' },
  { key: 'createdBy', label: 'Created By' },
]

const receiptsTableSkeletonColumns = computed(() => {
  const columns: Array<{
    id?: string
    label: string
    class?: string
    bone?: string
    lines?: 1 | 2
  }> = []
  if (canDeleteReceipts.value) {
    columns.push({ id: 'select', label: '', class: 'w-10 text-center', bone: '1rem' })
  }
  columns.push(
    { label: 'Sale #', bone: '4.5rem' },
    { label: 'Customer', lines: 2 },
    { label: 'Date', bone: '4.5rem' },
    { label: 'Items', bone: '7rem' },
    { label: 'Total', bone: '4rem' },
    { label: 'Payment', bone: '4.5rem' },
    { label: 'Status', class: 'dashboard-table__col-status', bone: '4.5rem' },
    { label: 'Created By', bone: '5.5rem' },
    { label: 'Actions', class: 'w-12 text-right', bone: '1.5rem' }
  )
  return columns
})

const outstandingTableSkeletonColumns = [
  { label: 'Sale', lines: 2 as const },
  { label: 'Customer', lines: 2 as const },
  { label: 'Items', class: 'hidden md:table-cell', bone: '7rem' },
  { label: 'Total', class: 'text-right', bone: '4rem' },
  { label: 'Paid', class: 'text-right', bone: '4rem' },
  { label: 'Balance', class: 'text-right', bone: '4rem' },
  { label: 'Actions', class: 'text-right', bone: '4.5rem' },
]

const customersTableSkeletonColumns = computed(() => {
  const columns: Array<{
    label: string
    class?: string
    bone?: string
    lines?: 1 | 2
  }> = [
    { label: 'Sales', bone: '3.25rem' },
    { label: 'Customer', bone: '7rem' },
    { label: 'Contact', lines: 2 },
    { label: 'Orders', bone: '2.5rem' },
    { label: 'Total Spent', bone: '4.5rem' },
  ]
  if (hasBalanceFeature.value) {
    columns.push({ label: 'Balance', bone: '4rem' })
  }
  columns.push(
    { label: 'Last Order', bone: '5rem' },
    { label: 'Actions', class: 'w-12 text-right', bone: '1.5rem' }
  )
  return columns
})

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
  contactKey: string
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

  receiptsStore.receipts.forEach((receipt) => {
    // Use email or phone as the key to identify unique customers
    const receiptWithPhone = receipt as Receipt & {
      customerPhone?: string
      customerAddress?: string
    }
    const key =
      receipt.customerEmail?.toLowerCase().trim() ||
      receiptWithPhone.customerPhone?.trim() ||
      receipt.customerName.toLowerCase().trim() ||
      ''

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
        contactKey: getCustomerContactKey({
          email: receipt.customerEmail,
          phone: receiptWithPhone.customerPhone,
          name: receipt.customerName,
        }),
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
    result = result.filter(
      (customer) =>
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
  return filteredCustomers.value.find((c) => c.id === id) ?? null
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
  const customer = uniqueCustomers.value.find((c) => c.id === customerId)
  if (!customer) return []

  return receiptsStore.receipts
    .filter((r) => customer.receipts.includes(r.id))
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

// Filter receipts by current store for all computed properties
const currentStoreId = computed(() => storesStore.currentStoreId)

// Filter receipts by current store
const receipts = computed(() => {
  const storeId = currentStoreId.value
  if (!storeId) return []
  return receiptsStore.receipts.filter((receipt) => receipt.storeId === storeId)
})

const totalSales = computed(() => {
  const storeId = currentStoreId.value
  if (!storeId) return 0
  return receipts.value.filter((r) => r.status === 'completed').reduce((sum, r) => sum + r.total, 0)
})

const todaySales = computed(() => {
  const today = new Date().toDateString()
  const storeId = currentStoreId.value
  if (!storeId) return 0
  return receipts.value
    .filter((r) => r.status === 'completed' && new Date(r.date).toDateString() === today)
    .reduce((sum, r) => sum + r.total, 0)
})

const todayReceipts = computed(() => {
  const today = new Date().toDateString()
  return receipts.value.filter((r) => new Date(r.date).toDateString() === today).length
})

const monthSales = computed(() => {
  const now = new Date()
  return receipts.value
    .filter((r) => {
      const receiptDate = new Date(r.date)
      return (
        r.status === 'completed' &&
        receiptDate.getMonth() === now.getMonth() &&
        receiptDate.getFullYear() === now.getFullYear()
      )
    })
    .reduce((sum, r) => sum + r.total, 0)
})

const monthReceipts = computed(() => {
  const now = new Date()
  return receipts.value.filter((r) => {
    const receiptDate = new Date(r.date)
    return (
      receiptDate.getMonth() === now.getMonth() && receiptDate.getFullYear() === now.getFullYear()
    )
  }).length
})

const outstandingReceipts = computed(() =>
  receipts.value
    .filter((r) => r.status === 'balance_due')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
)

const salesTabOptions = computed(() => [
  { value: 'receipts', label: 'Sales' },
  {
    value: 'outstanding',
    label: 'Outstanding',
    badge: outstandingReceipts.value.length || undefined,
  },
  { value: 'customers', label: 'Customers' },
])

const showSalesMoreSheet = ref(false)

const salesQuickActionOptions = computed((): IosQuickActionOption[] => {
  if (canCreate.value) {
    return [
      {
        value: 'new',
        label: 'New sale',
        icon: PlusIcon,
        trailing: 'add',
        action: openCreateReceiptModal,
      },
      {
        value: 'quick',
        label: 'Quick sale',
        icon: QrCodeIcon,
        action: openQuickSaleModal,
      },
      { value: 'receipts', label: 'Sales', icon: ReceiptPercentIcon },
      {
        value: 'more',
        label: 'More',
        icon: EllipsisVerticalIcon,
        trailing: 'more',
        action: () => {
          showSalesMoreSheet.value = true
        },
      },
    ]
  }

  return [
    { value: 'receipts', label: 'Sales', icon: ReceiptPercentIcon },
    {
      value: 'outstanding',
      label: 'Outstanding',
      icon: ClockIcon,
      badge: outstandingReceipts.value.length || undefined,
    },
    { value: 'customers', label: 'Customers', icon: UsersIcon },
    {
      value: 'more',
      label: 'More',
      icon: EllipsisVerticalIcon,
      trailing: 'more',
      action: () => {
        showSalesMoreSheet.value = true
      },
    },
  ]
})

const receiptStatusQuickActionOptions: IosQuickActionOption[] = [
  { value: 'all', label: 'All', icon: FunnelIcon },
  { value: 'completed', label: 'Completed', icon: CheckCircleIcon },
  { value: 'pending', label: 'Pending', icon: ClockIcon },
  { value: 'refunded', label: 'Refunded', icon: ArrowUturnLeftIcon },
]

const receiptStatusFilterOptions = [
  { value: 'all', label: 'All' },
  { value: 'completed', label: 'Completed' },
  { value: 'pending', label: 'Pending' },
  { value: 'refunded', label: 'Refunded' },
]

const receiptDateFilterOptions = [
  { value: 'all', label: 'All dates' },
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
]

const customerSortQuickActionOptions: IosQuickActionOption[] = [
  { value: 'name', label: 'Name', icon: UserCircleIcon },
  { value: 'orders', label: 'Orders', icon: ClipboardDocumentIcon },
  { value: 'spent', label: 'Spent', icon: CurrencyDollarIcon },
  { value: 'lastOrder', label: 'Recent', icon: ClockIcon },
]

const customerSortFilterOptions = [
  { value: 'name', label: 'Name' },
  { value: 'orders', label: 'Orders' },
  { value: 'spent', label: 'Spent' },
  { value: 'lastOrder', label: 'Recent' },
]

const filteredOutstandingReceipts = computed(() => {
  const q = outstandingSearchQuery.value.trim().toLowerCase()
  if (!q) return outstandingReceipts.value
  return outstandingReceipts.value.filter(
    (r) =>
      r.receiptNumber.toLowerCase().includes(q) ||
      r.customerName.toLowerCase().includes(q) ||
      (r.customerEmail || '').toLowerCase().includes(q) ||
      (r.customerPhone || '').includes(q)
  )
})

function outstandingAmountPaid(receipt: Receipt) {
  return receiptAmountPaid(receipt)
}

function outstandingBalanceDue(receipt: Receipt) {
  return receiptBalanceDue(receipt)
}

function openRecordPayment(receipt: Receipt) {
  balancePaymentReceipt.value = receipt
  showBalancePaymentModal.value = true
}

function viewOutstandingReceipt(receipt: Receipt) {
  selectedReceipt.value = receipt
  showViewReceiptModal.value = true
}

async function cancelOutstandingReceipt(receipt: Receipt) {
  if (
    !confirm(
      `Cancel ${receipt.receiptNumber}? Reserved stock will be released. This cannot be undone.`
    )
  ) {
    return
  }
  try {
    await receiptsStore.cancelBalanceDueReceipt(receipt.id)
    toast.success('Order cancelled and stock released.')
  } catch (e: unknown) {
    toast.error(e instanceof Error ? e.message : 'Could not cancel order')
  }
}

async function onBalancePaymentCompleted(receiptId: string) {
  await receiptsStore.fetchReceipts({ force: true })
  const completed = receiptsStore.receipts.find((r) => r.id === receiptId)
  if (completed?.status === 'completed') {
    activeTab.value = 'receipts'
    flashReceiptId.value = receiptId
  }
}

const filteredReceipts = computed(() => {
  let result = receipts.value.filter((r) => r.status !== 'balance_due')

  // Search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(
      (r) =>
        r.receiptNumber.toLowerCase().includes(query) ||
        r.customerName.toLowerCase().includes(query) ||
        r.customerEmail.toLowerCase().includes(query)
    )
  }

  // Status filter
  if (statusFilter.value !== 'all') {
    result = result.filter((r) => r.status === statusFilter.value)
  }

  // Date filter
  if (dateFilter.value !== 'all') {
    const now = new Date()
    result = result.filter((r) => {
      const receiptDate = new Date(r.date)
      switch (dateFilter.value) {
        case 'today':
          return receiptDate.toDateString() === now.toDateString()
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          return receiptDate >= weekAgo
        case 'month':
          return (
            receiptDate.getMonth() === now.getMonth() &&
            receiptDate.getFullYear() === now.getFullYear()
          )
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

    return currentSort.value.order === 'asc' ? aNum - bNum : bNum - aNum
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
  return sortedFilteredReceipts.value.find((r) => r.id === id) ?? null
})

const receiptsHeaderMetrics = computed(() => {
  if (activeTab.value === 'customers') {
    const total = uniqueCustomers.value.length
    const shown = filteredCustomers.value.length
    return [
      {
        key: 'customers',
        label: shown !== total ? 'Customers shown' : 'Customers',
        value: shown !== total ? `${shown} / ${total}` : String(total),
      },
      {
        key: 'revenue',
        label: 'Revenue',
        value: formatCurrency(customersTotalRevenue.value),
      },
      {
        key: 'orders',
        label: 'Orders',
        value: String(customersTotalOrders.value),
      },
      {
        key: 'aov',
        label: 'Avg. order',
        value: formatCurrency(customersAverageOrderValue.value),
      },
    ]
  }

  if (activeTab.value === 'outstanding') {
    const rows = filteredOutstandingReceipts.value
    const balanceTotal = rows.reduce((sum, row) => sum + outstandingBalanceDue(row), 0)
    return [
      {
        key: 'open',
        label: 'Open balances',
        value: String(rows.length),
        tone: rows.length > 0 ? ('warning' as const) : undefined,
      },
      {
        key: 'due',
        label: 'Balance due',
        value: formatCurrency(balanceTotal),
        tone: balanceTotal > 0 ? ('warning' as const) : undefined,
      },
    ]
  }

  const inStore = receipts.value.length
  const shown = sortedFilteredReceipts.value.length

  return [
    {
      key: 'in-store',
      label: shown !== inStore ? 'Receipts shown' : 'In store',
      value: shown !== inStore ? `${shown} / ${inStore}` : String(inStore),
    },
    {
      key: 'completed',
      label: 'Completed',
      value: formatCurrency(totalSales.value),
    },
    {
      key: 'today',
      label: 'Today',
      value: formatCurrency(todaySales.value),
    },
    {
      key: 'month',
      label: 'This month',
      value: formatCurrency(monthSales.value),
    },
    {
      key: 'outstanding',
      label: 'Outstanding',
      value: String(outstandingReceipts.value.length),
      tone: outstandingReceipts.value.length > 0 ? ('warning' as const) : undefined,
    },
  ]
})

const receiptMenuFixedStyle = ref<Record<string, string> | null>(null)
const customerMenuFixedStyle = ref<Record<string, string> | null>(null)
/** IosContextMenu exposes its rendered card as `panel` so we can measure it */
type ContextMenuHandle = { panel: HTMLElement | null } | null
const receiptMenuPanelRef = ref<ContextMenuHandle>(null)
const customerMenuPanelRef = ref<ContextMenuHandle>(null)

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
  const estimatedMenuHeight = receiptMenuPanelRef.value?.panel?.offsetHeight || 240
  receiptMenuFixedStyle.value = computeFixedAnchoredMenuStyle(r, {
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
  const estimatedMenuHeight = customerMenuPanelRef.value?.panel?.offsetHeight || 52
  customerMenuFixedStyle.value = computeFixedAnchoredMenuStyle(r, {
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
    if (isInsideAnchoredMenu(t)) return
    if (t?.closest?.('[data-receipt-actions-anchor]')) return
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
    if (isInsideAnchoredMenu(t)) return
    if (t?.closest?.('[data-customer-actions-anchor]')) return
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
  return sortableColumns.some((col) => col.key === key)
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

function formatReceiptTransactionDate(date: string | Date) {
  const dateObj = date instanceof Date ? date : new Date(date)
  const day = String(dateObj.getDate()).padStart(2, '0')
  const month = String(dateObj.getMonth() + 1).padStart(2, '0')
  const year = dateObj.getFullYear()
  return `${day}.${month}.${year}`
}

function getReceiptTransactionSubtitle(receipt: Receipt): string {
  const parts: string[] = []
  if (receipt.paymentMethod?.trim()) parts.push(receipt.paymentMethod.trim())
  parts.push(receipt.receiptNumber)
  return parts.join(' · ')
}

function getReceiptTransactionVariant(receipt: Receipt): ReceiptTransactionVariant {
  switch (receipt.status) {
    case 'completed':
      return 'credit'
    case 'refunded':
      return 'debit'
    case 'cancelled':
      return 'cancelled'
    default:
      return 'pending'
  }
}

function getReceiptTransactionAmount(receipt: Receipt): {
  text: string
  tone: ReceiptTransactionAmountTone
} {
  const formatted = formatCurrency(receipt.total)
  if (receipt.status === 'refunded') {
    return { text: `- ${formatted}`, tone: 'negative' }
  }
  if (receipt.status === 'completed') {
    return { text: `+ ${formatted}`, tone: 'positive' }
  }
  return { text: formatted, tone: 'neutral' }
}

function getOutstandingTransactionSubtitle(receipt: Receipt): string {
  const paid = formatCurrency(outstandingAmountPaid(receipt))
  return `${receipt.receiptNumber} · ${paid} paid`
}

function getOutstandingTransactionAmount(receipt: Receipt): {
  text: string
  tone: ReceiptTransactionAmountTone
} {
  return {
    text: formatCurrency(outstandingBalanceDue(receipt)),
    tone: 'warning',
  }
}

function getCustomerTransactionSubtitle(customer: CustomerDisplay): string {
  const parts: string[] = []
  if (customer.email?.trim()) parts.push(customer.email.trim())
  else if (customer.phone?.trim()) parts.push(customer.phone.trim())
  const orderLabel = `${customer.receipts.length} order${customer.receipts.length === 1 ? '' : 's'}`
  parts.push(orderLabel)
  if (hasBalanceFeature.value && getCustomerBalance(customer) > 0) {
    parts.push(`${formatCurrency(getCustomerBalance(customer))} owed`)
  }
  return parts.join(' · ')
}

function getCustomerTransactionVariant(customer: CustomerDisplay): ReceiptTransactionVariant {
  if (hasBalanceFeature.value && getCustomerBalance(customer) > 0) return 'pending'
  return 'customer'
}

function getCustomerTransactionAmount(customer: CustomerDisplay): {
  text: string
  tone: ReceiptTransactionAmountTone
} {
  return {
    text: `+ ${formatCurrency(customer.totalSpent)}`,
    tone: 'positive',
  }
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
  let idx = sortedFilteredReceipts.value.findIndex((r) => r.id === receipt.id)
  if (idx === -1) {
    resetFilters()
    await nextTick()
    idx = sortedFilteredReceipts.value.findIndex((r) => r.id === receipt.id)
  }
  if (idx === -1) {
    toast.error('Could not find this sale in the list.')
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
    let idx = sortedFilteredReceipts.value.findIndex((r) => r.id === id)
    if (idx === -1) {
      resetFilters()
      await nextTick()
      idx = sortedFilteredReceipts.value.findIndex((r) => r.id === id)
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
const showQuickSaleModal = ref(false)

const openCreateReceiptModal = () => {
  showCreateReceiptModal.value = true
}

const openQuickSaleModal = () => {
  showQuickSaleModal.value = true
}

function selectSalesTabFromSheet(tab: 'receipts' | 'outstanding' | 'customers') {
  activeTab.value = tab
  showSalesMoreSheet.value = false
}

function selectReceiptDateFilter(value: string) {
  dateFilter.value = value
  showSalesMoreSheet.value = false
}

const handleQuickSaleCompleted = async () => {
  showQuickSaleModal.value = false
  await receiptsStore.fetchReceipts()
  await loadCreatorNames()
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
  const idx = selectedReceiptsForBulk.value.findIndex((r) => r.id === receipt.id)
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
  const ids = selectedReceiptsForBulk.value.map((r) => r.id)
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
    toast.success(`${count} sale${count !== 1 ? 's' : ''} deleted`)
  } catch (error: any) {
    toast.error(error.message || 'Failed to delete some sales')
  } finally {
    isBulkDeletingReceipts.value = false
  }
}

const { addRecentItem } = useRecentItems()

const handleViewReceiptTimeline = (receipt: Receipt) => {
  selectedReceipt.value = receipt
  showTimelineModal.value = true
}

const handleViewReceipt = (receipt: Receipt) => {
  selectedReceipt.value = receipt
  showViewReceiptModal.value = true

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
        toast.error(error.message || 'Failed to delete sale')
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
  const { isDemoModeActive } = await import('~/utils/demo-mode')
  if (isDemoModeActive()) {
    const uniqueCreatorUids = [
      ...new Set(
        receipts.value.map((r) => (r as any).actualCreator || r.createdBy).filter(Boolean)
      ),
    ]
    for (const uid of uniqueCreatorUids) {
      creatorNames.value[uid] = 'Demo User'
    }
    loadingCreators.value = false
    return
  }

  const db = getFirestoreInstance()
  if (!db) {
    loadingCreators.value = false
    return
  }

  try {
    // Get unique creator UIDs from receipts (use actualCreator if available, otherwise createdBy)
    const uniqueCreatorUids = [
      ...new Set(
        receipts.value.map((r) => (r as any).actualCreator || r.createdBy).filter(Boolean)
      ),
    ]

    // Fetch names for all unique creators
    await Promise.all(
      uniqueCreatorUids.map(async (uid) => {
        if (creatorNames.value[uid]) return // Already loaded

        try {
          // First try to get from users collection (super admin)
          const userData = await getUserDocument(uid)
          if (userData?.name) {
            creatorNames.value[uid] = userData.name
            return
          }

          // Try to get from staff store cache first (faster if already loaded)
          const cachedStaff = staffStore.staff.find((s) => s.authUid === uid)
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
            console.warn(
              `Could not fetch from legacy staff collection for ${uid}:`,
              legacyError.message
            )
          }

          // If still not found, search hierarchical structure
          try {
            const { getStoresCollection, getDepartmentsCollection, getStaffCollection } =
              await import('~/composables/useFirestorePaths')

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
                  const departmentsRef = getDepartmentsCollection(
                    db,
                    potentialSuperadminId,
                    storeId
                  )
                  const departmentsSnapshot = await getDocs(departmentsRef)

                  for (const deptDoc of departmentsSnapshot.docs) {
                    const departmentId = deptDoc.id
                    try {
                      const staffRef = getStaffCollection(
                        db,
                        potentialSuperadminId,
                        storeId,
                        departmentId
                      )
                      const staffSnapshot = await getDocs(staffRef)

                      for (const staffDoc of staffSnapshot.docs) {
                        const staffData = staffDoc.data()
                        if (staffData.authUid === uid) {
                          // Found the staff member!
                          const fullName = `${staffData.firstName || ''} ${
                            staffData.lastName || ''
                          }`.trim()
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
            console.warn(
              `Could not search hierarchical structure for ${uid}:`,
              hierarchicalError.message
            )
          }

          // If still not found, use UID as fallback
          creatorNames.value[uid] = 'Unknown User'
        } catch (error: any) {
          console.warn(`Failed to fetch creator name for ${uid}:`, error.message)
          creatorNames.value[uid] = 'Unknown User'
        }
      })
    )
  } catch (error: any) {
    console.error('Error loading creator names:', error)
  } finally {
    loadingCreators.value = false
  }
}

async function reloadReceiptsPage() {
  if (!authStore.currentUser) return
  await receiptsStore.fetchReceipts({ force: true })
  await loadCreatorNames()
}

useIosPullToRefreshRegister(reloadReceiptsPage)

function receiptSwipeActions(receipt: Receipt): IosSwipeAction[] {
  const actions: IosSwipeAction[] = [
    {
      id: 'view',
      label: 'View sale',
      shortLabel: 'View',
      tone: 'primary',
      icon: EyeIcon,
      onSelect: () => handleViewReceipt(receipt),
    },
    {
      id: 'share',
      label: 'Share sale',
      shortLabel: 'Share',
      icon: ArrowDownTrayIcon,
      onSelect: () => handleViewReceipt(receipt),
    },
  ]
  if (receipt.status === 'completed' && canEditReceipts.value) {
    actions.push({
      id: 'refund',
      label: 'Refund sale',
      shortLabel: 'Refund',
      tone: 'danger',
      icon: ArrowPathIcon,
      onSelect: () => handleRefundReceipt(receipt),
    })
  }
  return actions
}

function outstandingSwipeActions(receipt: Receipt): IosSwipeAction[] {
  const actions: IosSwipeAction[] = [
    {
      id: 'pay',
      label: 'Record payment',
      shortLabel: 'Pay',
      tone: 'primary',
      icon: CheckCircleIcon,
      onSelect: () => openRecordPayment(receipt),
    },
    {
      id: 'view',
      label: 'View sale',
      shortLabel: 'View',
      icon: EyeIcon,
      onSelect: () => viewOutstandingReceipt(receipt),
    },
  ]
  if (canEditReceipts.value) {
    actions.push({
      id: 'cancel',
      label: 'Cancel order',
      shortLabel: 'Cancel',
      tone: 'danger',
      icon: XMarkIcon,
      onSelect: () => cancelOutstandingReceipt(receipt),
    })
  }
  return actions
}

function customerSwipeActions(customer: CustomerDisplay): IosSwipeAction[] {
  const actions: IosSwipeAction[] = [
    {
      id: 'sales',
      label: 'View sales',
      shortLabel: 'Sales',
      tone: 'primary',
      icon: ReceiptPercentIcon,
      onSelect: () => viewCustomerReceipts(customer),
    },
  ]
  if (hasBalanceFeature.value) {
    actions.push({
      id: 'balance',
      label: 'Manage balance',
      shortLabel: 'Balance',
      icon: UserCircleIcon,
      onSelect: () => openCustomerBalance(customer),
    })
  }
  if (hasWhatsAppFeature.value && (customer.phone || customer.email)) {
    actions.push({
      id: 'whatsapp',
      label: 'Payment reminder',
      shortLabel: 'WhatsApp',
      icon: ArrowTopRightOnSquareIcon,
      onSelect: () => openCustomerPaymentReminder(customer),
    })
  }
  return actions
}

// Load receipts on mount
onMounted(async () => {
  // Add keyboard listener for ESC key
  if (import.meta.client) {
    window.addEventListener('keydown', handleKeyDown)
  }

  // Only run on client
  if (import.meta.server) return

  // Set initial loading state (skip skeleton when native already has warm receipts)
  isInitialLoading.value = !(
    isCapacitorIos.value &&
    receiptsStore.receipts.length > 0 &&
    !receiptsStore.loading
  )

  // Wait for auth to finish loading before loading receipts
  if (authStore.loading) {
    let resolved = false
    await new Promise((resolve) => {
      const unwatch = watch(
        () => authStore.loading,
        (val) => {
          if (!val && !resolved) {
            resolved = true
            unwatch()
            resolve(true)
          }
        }
      )

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
      if (isCapacitorIos.value) {
        scheduleNativeIdleWork(() => {
          void loadCreatorNames()
        }, 500)
      } else {
        await loadCreatorNames()
      }
    } catch (error: any) {
      console.error('Error loading receipts:', error.message || error)
    }
  }

  if (!isCapacitorIos.value) {
    await new Promise((resolve) => setTimeout(resolve, 300))
  }
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
watch(
  () => authStore.currentUser,
  async (user) => {
    if (user && receiptsStore.receipts.length === 0) {
      try {
        await receiptsStore.fetchReceipts()
        // Load creator names after receipts are loaded
        await loadCreatorNames()
      } catch (error: any) {
        console.error('Error loading receipts:', error.message || error)
      }
    }
  },
  { immediate: false }
)

// Watch for receipts changes and load creator names
// Watch for store changes and refetch receipts
watch(
  () => storesStore.currentStoreId,
  async (newStoreId, oldStoreId) => {
    if (newStoreId && newStoreId !== oldStoreId && authStore.currentUser) {
      // console.log('[ReceiptsPage] Store changed, refetching receipts...')
      try {
        await receiptsStore.fetchReceipts()
        // console.log('[ReceiptsPage] Receipts refetched after store change:', receiptsStore.receipts.length)
      } catch (error: any) {
        console.error(
          '[ReceiptsPage] Error refetching receipts after store change:',
          error.message || error
        )
      }
    }
  },
  { immediate: false }
)

watch(
  () => receiptsStore.receipts,
  async (newReceipts) => {
    if (newReceipts && newReceipts.length > 0) {
      await loadCreatorNames()
    }
  },
  { immediate: false }
)
</script>

<style>
/*
 * Receipt flash (dark): force a gray row tint so `dark:` utilities never lose to a light base bg.
 */
html.dark [data-receipt-flash] {
  background-color: rgb(16 185 129 / 0.12) !important;
}
</style>
