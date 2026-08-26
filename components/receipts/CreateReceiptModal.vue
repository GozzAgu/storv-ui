<template>
  <SidePanel
    :model-value="props.modelValue"
    title="Create New Sale"
    subtitle="Pick category, subcategory, items, then sale details"
    size="lg"
    @update:model-value="(value: boolean) => emit('update:modelValue', value)"
  >
    <template #default>
      <div :class="[drawerFillClass, 'gap-4']">
        <DashboardDrawerStepper :steps="steps" :current-step="currentStep" />

        <SellScreenNoteBanner v-if="currentStep >= 2" />

        <!-- Step 1: Parent category -->
        <div v-if="currentStep === 0" :class="[drawerFillStepClass, 'gap-3']">
          <p :class="sectionLabelClass">Parent category</p>
          <DashboardDrawerSearch v-model="folderSearchQuery" placeholder="Search categories…" />

          <div v-if="loadingFolders" class="flex flex-1 flex-col items-center justify-center py-12">
            <div
              class="h-5 w-5 animate-spin rounded-full border-0 border-primary-500/30 border-t-primary-500"
            />
            <p class="mt-2 text-xs text-gray-500 dark:text-gray-400">Loading categories…</p>
          </div>
          <div v-else-if="parentCategoryRows.length === 0" :class="emptyStateClass">
            <FolderIcon class="mb-2 h-8 w-8 text-gray-400 dark:text-gray-500" stroke-width="1.5" />
            <p class="text-xs font-medium text-gray-800 dark:text-gray-200">
              {{ folderSearchQuery ? 'No categories found' : 'No categories yet' }}
            </p>
            <p class="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
              {{
                folderSearchQuery ? 'Try another search' : 'Create a category in Inventory first'
              }}
            </p>
          </div>
          <div v-else :class="pickListClass">
            <div :class="pickListScrollClass">
              <button
                v-for="row in parentCategoryRows"
                :key="`${row.depth}-${row.folder.id}`"
                type="button"
                :class="[
                  pickRowClass,
                  isParentRowSelected(row.folder) ? pickRowSelectedClass : '',
                  row.depth === 1 ? 'ml-3 border-l-2 border-primary-500/20 pl-2' : '',
                ]"
                @click="onParentCategoryRowClick(row)"
              >
                <div
                  :class="[
                    'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
                    getFolderColorClass(row.folder.color),
                  ]"
                >
                  <FolderIcon class="h-4 w-4 text-white" stroke-width="1.75" />
                </div>
                <div class="min-w-0 flex-1">
                  <p :class="pickRowTitleClass">
                    {{ row.folder.name }}
                    <span
                      v-if="row.depth === 1 && row.parentName"
                      class="font-normal text-gray-500 dark:text-gray-400"
                    >
                      · {{ row.parentName }}
                    </span>
                  </p>
                  <p :class="pickRowMetaClass">
                    {{ folderPickerMeta(row.folder) }}
                    <span
                      v-if="!isCategoryHub(row.folder) && selectedCountForFolder(row.folder.id) > 0"
                      class="text-primary-600 dark:text-primary-400"
                    >
                      · {{ selectedCountForFolder(row.folder.id) }} in this sale
                    </span>
                  </p>
                </div>
                <ChevronRightIcon
                  v-if="isCategoryHub(row.folder) && !isParentRowSelected(row.folder)"
                  class="h-4 w-4 shrink-0 text-gray-400"
                  stroke-width="2"
                />
                <CheckCircleIcon
                  v-if="isParentRowSelected(row.folder)"
                  class="h-4 w-4 shrink-0 text-primary-500"
                  stroke-width="2"
                />
              </button>
            </div>
          </div>
        </div>

        <!-- Step 2: Subcategory -->
        <div v-if="currentStep === 1" :class="[drawerFillStepClass, 'gap-3']">
          <div class="flex shrink-0 flex-wrap items-center gap-2">
            <p :class="sectionLabelClass">
              Subcategory · {{ selectedParentFolder?.name }}
            </p>
            <button
              type="button"
              class="text-[11px] font-medium text-gray-500 hover:text-gray-700 hover:underline dark:text-gray-400 dark:hover:text-gray-200"
              @click="goBackToParentCategories"
            >
              Change parent
            </button>
          </div>
          <DashboardDrawerSearch
            v-model="subcategorySearchQuery"
            placeholder="Search subcategories…"
          />
          <div v-if="subcategoryFolders.length === 0" :class="emptyStateClass">
            <FolderIcon class="mb-2 h-8 w-8 text-gray-400 dark:text-gray-500" stroke-width="1.5" />
            <p class="text-xs font-medium text-gray-800 dark:text-gray-200">
              {{ subcategorySearchQuery ? 'No subcategories found' : 'No subcategories yet' }}
            </p>
            <p class="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
              Add subcategories under this parent in Inventory
            </p>
          </div>
          <div v-else :class="pickListClass">
            <div :class="pickListScrollClass">
              <button
                v-for="folder in subcategoryFolders"
                :key="folder.id"
                type="button"
                :class="[
                  pickRowClass,
                  isSubcategoryRowSelected(folder) ? pickRowSelectedClass : '',
                ]"
                @click="onSubcategoryPick(folder)"
              >
                <div
                  :class="[
                    'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
                    getFolderColorClass(folder.color),
                  ]"
                >
                  <FolderIcon class="h-4 w-4 text-white" stroke-width="1.75" />
                </div>
                <div class="min-w-0 flex-1">
                  <p :class="pickRowTitleClass">{{ folder.name }}</p>
                  <p :class="pickRowMetaClass">
                    {{ folderPickerMeta(folder) }}
                    <span
                      v-if="selectedCountForFolder(folder.id) > 0"
                      class="text-primary-600 dark:text-primary-400"
                    >
                      · {{ selectedCountForFolder(folder.id) }} in this sale
                    </span>
                  </p>
                </div>
                <CheckCircleIcon
                  v-if="isSubcategoryRowSelected(folder)"
                  class="h-4 w-4 shrink-0 text-primary-500"
                  stroke-width="2"
                />
              </button>
            </div>
          </div>
        </div>

        <!-- Step 3: Select Items -->
        <div v-if="currentStep === 2" :class="[drawerFillStepClass, 'gap-3']">
          <div class="flex shrink-0 flex-wrap items-center justify-between gap-2">
            <p :class="sectionLabelClass">Items · {{ selectedFolder?.name }}</p>
            <div class="flex flex-wrap items-center gap-2">
              <button
                type="button"
                class="inline-flex items-center gap-1 text-[11px] font-medium text-primary-600 hover:underline dark:text-primary-400"
                @click="addFromAnotherCategory"
              >
                <PlusCircleIcon class="h-3.5 w-3.5" stroke-width="2" />
                Add from another category
              </button>
              <button
                type="button"
                class="text-[11px] font-medium text-gray-500 hover:text-gray-700 hover:underline dark:text-gray-400 dark:hover:text-gray-200"
                @click="loadItems"
              >
                Refresh list
              </button>
            </div>
          </div>
          <DashboardDrawerSearch
            v-model="itemSearchQuery"
            :placeholder="
              selectedFolder?.hasSerialNumbers ? 'Search name or serial…' : 'Search products…'
            "
          />
          <div
            v-if="loadingItems"
            class="flex min-h-0 flex-1 flex-col items-center justify-center py-8"
          >
            <div
              class="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-primary-500"
            ></div>
            <p class="mt-2 text-xs text-gray-500 dark:text-gray-400">Loading items...</p>
          </div>
          <div v-else-if="availableItems.length === 0" :class="emptyStateClass">
            <CubeIcon class="mb-2 h-8 w-8 text-gray-400 dark:text-gray-500" stroke-width="1.5" />
            <p class="text-xs font-medium text-gray-800 dark:text-gray-200">No items available</p>
            <p class="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
              This category has no items to add
            </p>
          </div>
          <div v-else :class="pickListClass">
            <div :class="pickListScrollClass">
              <div
                v-for="item in filteredAvailableItems"
                :key="item.id"
                :class="[
                  pickRowClass,
                  'cursor-pointer',
                  selectedItems.find((si) => si.id === item.id) ? pickRowSelectedClass : '',
                  itemIsOutOnSellerLoan(item) && !selectedItems.find((si) => si.id === item.id)
                    ? 'bg-primary-50/50 dark:bg-primary-950/15'
                    : '',
                ]"
                @click="onReceiptItemRowClick(item)"
              >
                <div class="flex w-full items-start gap-2.5">
                  <Checkbox
                    :model-value="selectedItems.find((si) => si.id === item.id) !== undefined"
                    @update:model-value="(checked) => toggleItemSelection(item, checked)"
                    @click.stop
                    size="sm"
                    class="mt-0.5"
                  />
                  <div class="min-w-0 flex-1">
                    <h4
                      class="text-xs font-medium text-gray-900 dark:text-gray-100"
                      :class="
                        itemIsOutOnSellerLoan(item) &&
                        'font-semibold text-primary-900 dark:text-primary-50'
                      "
                    >
                      {{ getItemDisplayName(item) }}
                    </h4>
                    <div class="flex items-center gap-3 mt-0.5 text-[10px] sm:text-xs flex-wrap">
                      <span
                        v-if="itemIsOutOnSellerLoan(item)"
                        class="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold tracking-wide text-primary-900 bg-white/95 shadow-sm shadow-primary-900/10 ring-1 ring-primary-400/45 dark:bg-primary-800/90 dark:text-primary-50 dark:ring-primary-400/55 dark:shadow-md dark:shadow-black/40"
                      >
                        On stock loan<span v-if="item.sellerLoanPartyName"
                          >&nbsp;· {{ item.sellerLoanPartyName }}</span
                        >
                      </span>
                      <span
                        v-if="
                          (selectedFolder?.hasSerialNumbers || hasSerialNumberInTemplate) &&
                          (getItemField(item, 'serialNo') || getItemField(item, 'serialNumber'))
                        "
                        class="text-gray-500 dark:text-gray-400"
                      >
                        Serial:
                        {{ getItemField(item, 'serialNo') || getItemField(item, 'serialNumber') }}
                      </span>
                      <span
                        v-if="getItemField(item, 'sku')"
                        class="text-gray-500 dark:text-gray-400"
                        >SKU: {{ getItemField(item, 'sku') }}</span
                      >
                      <span v-if="getItemField(item, 'price')">
                        <span
                          v-if="item.discountedPrice !== undefined && item.discountedPrice !== null"
                          class="flex items-center gap-1"
                        >
                          <span class="text-gray-400 dark:text-gray-500 line-through">
                            {{ formatCurrency(parseFloat(getItemField(item, 'price') || '0')) }}
                          </span>
                          <span class="text-green-600 dark:text-green-400 font-semibold">
                            {{ formatCurrency(item.discountedPrice) }}
                          </span>
                          <span class="text-red-600 dark:text-red-400">
                            ({{
                              item.discountPercentage
                                ? `-${item.discountPercentage}%`
                                : `-${formatCurrency(item.discountAmount || 0)}`
                            }})
                          </span>
                        </span>
                        <span v-else class="text-gray-500 dark:text-gray-400">
                          Price:
                          {{ formatCurrency(parseFloat(getItemField(item, 'price') || '0')) }}
                        </span>
                      </span>
                      <span
                        v-if="
                          !itemUsesSerialNumbers(item) && getItemAvailableStock(item) !== null
                        "
                        class="text-gray-500 dark:text-gray-400"
                      >
                        Stock: {{ getItemAvailableStock(item) }}
                      </span>
                    </div>
                  </div>
                </div>
                <div
                  v-if="
                    selectedItems.find((si) => si.id === item.id) &&
                    !itemUsesSerialNumbers(item)
                  "
                  class="mt-2 w-full border-t border-gray-100/90 pt-2 dark:border-gray-800/80"
                  @click.stop
                >
                  <label class="mb-1 block text-[10px] font-medium text-gray-600 dark:text-gray-400"
                    >Quantity</label
                  >
                  <input
                    type="number"
                    :value="getSelectedItemQuantity(item.id)"
                    :class="[
                      'h-8 w-20 rounded-lg bg-white px-2 text-xs dark:!bg-dashboard-card',
                      getSelectedItemQuantityError(item.id)
                        ? 'ring-2 ring-red-500/70 focus:ring-red-500/70 dark:ring-red-400/60'
                        : '',
                    ]"
                    min="1"
                    @input="
                      updateItemQuantity(
                        item.id,
                        parseInt(($event.target as HTMLInputElement).value) || 1
                      )
                    "
                  />
                  <p
                    v-if="getSelectedItemQuantityError(item.id)"
                    class="mt-1 text-[10px] font-medium text-red-600 dark:text-red-400"
                  >
                    {{ getSelectedItemQuantityError(item.id) }}
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div
            v-if="selectedItems.length > 0"
            class="shrink-0 rounded-lg bg-gray-50/80 px-3 py-2.5 dark:border-white/[0.06] dark:bg-white/[0.03]"
          >
            <p class="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Selected ({{ totalSelectedQuantity }})
            </p>
            <div class="space-y-2 mb-2">
              <div
                v-for="group in selectedItemsByFolder"
                :key="group.folderId"
                class="rounded-md border border-gray-200/80 bg-white/60 px-2 py-1.5 dark:border-white/[0.06] dark:bg-white/[0.02]"
              >
                <p class="text-[10px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  {{ group.folderName }}
                </p>
                <ul class="mt-1 space-y-0.5">
                  <li
                    v-for="si in group.lines"
                    :key="si.id"
                    class="flex items-center justify-between gap-2 text-[11px] text-gray-700 dark:text-gray-300"
                  >
                    <span
                      class="min-w-0 truncate"
                      :class="
                        getSelectedItemQuantityError(si.id)
                          ? 'text-red-600 dark:text-red-400'
                          : ''
                      "
                    >
                      {{ getItemDisplayName(si.item) }}
                      <span v-if="!itemUsesSerialNumbers(si.item) && si.quantity > 1">
                        × {{ si.quantity }}
                      </span>
                      <span
                        v-if="getSelectedItemQuantityError(si.id)"
                        class="block text-[10px] font-medium"
                      >
                        {{ getSelectedItemQuantityError(si.id) }}
                      </span>
                    </span>
                    <button
                      type="button"
                      class="shrink-0 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                      aria-label="Remove item"
                      @click.stop="removeSelectedItem(si.id)"
                    >
                      <XMarkIcon class="h-3.5 w-3.5" stroke-width="2" />
                    </button>
                  </li>
                </ul>
              </div>
            </div>
            <p class="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Total: {{ formatCurrency(itemsSubtotal) }}
            </p>
          </div>
        </div>

        <!-- Step 4: Sale Details -->
        <div v-if="currentStep === 3" class="space-y-3">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div class="relative">
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Customer Name *
              </label>
              <div class="relative">
                <input
                  v-model="receiptForm.customerName"
                  type="text"
                  required
                  @input="handleCustomerNameInput"
                  @focus="showCustomerSuggestions = true"
                  @blur="handleCustomerNameBlur"
                  class="app-field w-full px-3 py-2 text-xs rounded-sm dark:!bg-dashboard-card text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-primary-400/40"
                  placeholder="John Doe"
                />
                <MagnifyingGlassIcon
                  v-if="receiptForm.customerName && matchingCustomers.length > 0"
                  class="absolute right-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500"
                />
                <!-- Customer Suggestions Dropdown -->
                <div
                  v-if="
                    showCustomerSuggestions &&
                    receiptForm.customerName &&
                    matchingCustomers.length > 0
                  "
                  class="absolute z-50 w-full mt-1 bg-white dark:!bg-dashboard-card rounded-sm max-h-48 overflow-y-auto"
                >
                  <div
                    v-for="customer in matchingCustomers"
                    :key="customer.id"
                    @mousedown.prevent="selectCustomer(customer)"
                    class="px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors border-b border-gray-100 last:border-b-0"
                  >
                    <div class="flex items-center justify-between">
                      <div class="flex-1">
                        <p class="text-xs font-medium text-gray-900 dark:text-gray-100">
                          {{ customer.name }}
                        </p>
                        <div
                          class="flex items-center gap-2 mt-0.5 text-[10px] text-gray-500 dark:text-gray-400"
                        >
                          <span v-if="customer.email">{{ customer.email }}</span>
                          <span v-if="customer.phone">{{ customer.phone }}</span>
                        </div>
                      </div>
                      <div class="text-[10px] text-gray-400 dark:text-gray-500 ml-3">
                        {{ customer.totalOrders }} order{{ customer.totalOrders !== 1 ? 's' : '' }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Customer Email
              </label>
              <input
                v-model="receiptForm.customerEmail"
                type="email"
                class="app-field w-full px-3 py-2 text-xs rounded-sm dark:!bg-dashboard-card text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-primary-400/40"
                placeholder="john@example.com"
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Customer Phone
              </label>
              <input
                v-model="receiptForm.customerPhone"
                type="tel"
                class="app-field w-full px-3 py-2 text-xs rounded-sm dark:!bg-dashboard-card text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-primary-400/40"
                placeholder="+1 234 567 8900"
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Customer Address
              </label>
              <input
                v-model="receiptForm.customerAddress"
                type="text"
                class="app-field w-full px-3 py-2 text-xs rounded-sm dark:!bg-dashboard-card text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-primary-400/40"
                placeholder="123 Main St, City, State"
              />
            </div>
            <div>
              <div class="flex items-center justify-between mb-1.5">
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300">
                  Payment Method *
                </label>
                <Checkbox
                  v-if="paymentSettlement !== 'balance_due'"
                  v-model="useSplitPayment"
                  label="Split Payment"
                  size="sm"
                />
              </div>

              <!-- Single Payment Method -->
              <div v-if="!useSplitPayment">
                <PaymentMethodSelect v-model="receiptForm.paymentMethod" required />
              </div>

              <!-- Split Payment Methods -->
              <div v-else class="space-y-2">
                <div
                  v-for="(payment, index) in splitPayments"
                  :key="index"
                  class="flex items-center gap-2"
                >
                  <PaymentMethodSelect
                    v-model="payment.method"
                    required
                    select-class="app-field flex-1 px-3 py-2 text-xs rounded-sm dark:!bg-dashboard-card text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-primary-400/40"
                    placeholder="Select method"
                  />
                  <div class="relative w-28">
                    <span
                      class="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-xs text-gray-500 dark:text-gray-400"
                      >{{ currencySymbol }}</span
                    >
                    <input
                      v-model.number="payment.amount"
                      type="number"
                      step="0.01"
                      min="0"
                      :max="receiptTotal - splitPaymentsTotal + payment.amount"
                      required
                      class="w-full pl-6 pr-2.5 py-2 text-xs rounded-sm bg-white dark:!bg-dashboard-card text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-primary-400/60"
                      placeholder="0.00"
                    />
                  </div>
                  <button
                    v-if="splitPayments.length > 1"
                    @click="removeSplitPayment(index)"
                    type="button"
                    class="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-sm transition-colors"
                  >
                    <XMarkIcon class="w-4 h-4" />
                  </button>
                </div>
                <button
                  @click="addSplitPayment"
                  type="button"
                  class="inline-flex w-full items-center justify-center gap-1.5 px-3 py-1.5 text-xs text-primary-500 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-smborder-0-300 dark:border-primary-600 transition-colors"
                >
                  <PlusCircleIcon class="h-3.5 w-3.5 shrink-0 opacity-80" :stroke-width="1.75" />
                  Add payment method
                </button>
                <div
                  class="rounded-sm border p-2.5 space-y-1.5"
                  :class="{
                    'border-emerald-200/80 bg-emerald-50/90 dark:border-emerald-800/50 dark:bg-emerald-950/25':
                      splitPaymentBalanceUi.tone === 'ok',
                    'border-amber-200/80 bg-amber-50/90 dark:border-amber-800/50 dark:bg-amber-950/20':
                      splitPaymentBalanceUi.tone === 'short',
                    'border-red-200/80 bg-red-50/90 dark:border-red-800/50 dark:bg-red-950/20':
                      splitPaymentBalanceUi.tone === 'over',
                  }"
                >
                  <div class="flex justify-between items-start gap-2">
                    <span
                      class="text-[10px] font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400"
                      >Balance</span
                    >
                    <div class="text-right">
                      <p
                        class="text-xs font-semibold tabular-nums"
                        :class="{
                          'text-emerald-700 dark:text-emerald-300':
                            splitPaymentBalanceUi.tone === 'ok',
                          'text-amber-800 dark:text-amber-200':
                            splitPaymentBalanceUi.tone === 'short',
                          'text-red-700 dark:text-red-300': splitPaymentBalanceUi.tone === 'over',
                        }"
                      >
                        {{ splitPaymentBalanceUi.headline }}
                      </p>
                      <p
                        class="text-[10px] text-gray-600 dark:text-gray-400 mt-0.5 max-w-[14rem] ml-auto leading-snug"
                      >
                        {{ splitPaymentBalanceUi.sub }}
                      </p>
                    </div>
                  </div>
                  <p
                    class="text-[10px] text-gray-500 dark:text-gray-400 tabular-nums pt-1 border-t border-gray-200/80/60"
                  >
                    Allocated {{ formatCurrency(splitPaymentsTotal) }} of
                    {{ formatCurrency(receiptTotal) }}
                  </p>
                </div>
              </div>
            </div>
            <div class="sm:col-span-2">
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Payment *
              </label>
              <div class="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  :class="
                    paymentSettlement === 'paid_in_full'
                      ? settlementActiveClass
                      : settlementInactiveClass
                  "
                  @click="paymentSettlement = 'paid_in_full'"
                >
                  Paid in full
                </button>
                <button
                  type="button"
                  :class="
                    paymentSettlement === 'balance_due'
                      ? settlementActiveClass
                      : settlementInactiveClass
                  "
                  @click="paymentSettlement = 'balance_due'"
                >
                  Balance due
                </button>
              </div>
              <p class="mt-1 text-[10px] text-gray-500 dark:text-gray-400">
                {{
                  paymentSettlement === 'balance_due'
                    ? 'Stock stays reserved until paid off. Order appears under Outstanding.'
                    : 'Stock is marked sold when the sale is recorded.'
                }}
              </p>
              <div
                v-if="paymentSettlement === 'balance_due'"
                class="mt-3 rounded-sm border border-amber-200/70 bg-amber-50/50 p-3 dark:border-amber-900/40 dark:bg-amber-950/15"
              >
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Deposit collected today *
                </label>
                <input
                  v-model.number="depositAmount"
                  type="number"
                  min="0"
                  step="0.01"
                  :max="receiptTotal"
                  class="app-field w-full px-3 py-2 text-xs rounded-sm dark:!bg-dashboard-card tabular-nums dark:text-gray-100"
                />
                <p class="mt-1.5 text-[11px] text-gray-600 dark:text-gray-400 tabular-nums">
                  Balance remaining:
                  <span class="font-semibold text-amber-800 dark:text-amber-200">
                    {{ formatCurrency(Math.max(0, receiptTotal - (depositAmount || 0))) }}
                  </span>
                </p>
              </div>
            </div>
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Notes (Optional)
            </label>
            <textarea
              v-model="receiptForm.notes"
              rows="2"
              class="w-full px-3 py-2 text-xs rounded-sm bg-white dark:!bg-dashboard-card text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-primary-400/40 resize-none"
              placeholder="Additional notes..."
            ></textarea>
          </div>

          <!-- Swap-In Section (inventory write; super admin only) -->
          <div v-if="canUseSwapInReceipt" class="border-t border-gray-200 pt-3 mt-3">
            <Checkbox v-model="isSwapIn" label="This is a swap-in transaction" size="sm" />

            <div v-if="isSwapIn" class="space-y-4 mt-3 pt-3 border-t border-gray-200">
              <div>
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Select category for swapped-in device *
                </label>
                <div v-if="loadingFolders" class="text-center py-3">
                  <div
                    class="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-primary-500"
                  ></div>
                </div>
                <div
                  v-else-if="leafFolders.length === 0"
                  class="text-center py-4 px-3 border border-dashed border-gray-300 rounded-sm bg-gray-50/50 dark:bg-gray-800/50"
                >
                  <div
                    class="w-10 h-10 mx-auto mb-2 rounded-sm bg-gray-100 dark:bg-gray-700 flex items-center justify-center"
                  >
                    <FolderIcon class="w-5 h-5 text-gray-500 dark:text-gray-400" />
                  </div>
                  <p class="text-xs text-gray-500 dark:text-gray-400">
                    No inventory categories found
                  </p>
                </div>
                <select
                  v-else
                  v-model="swapInFolderId"
                  required
                  class="app-field w-full px-3 py-2 text-xs rounded-sm dark:!bg-dashboard-card text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-primary-400/40"
                >
                  <option value="">Select category for swapped-in device</option>
                  <option v-for="folder in leafFolders" :key="folder.id" :value="folder.id">
                    {{ folder.name }}
                  </option>
                </select>
              </div>

              <!-- Swapped-In Device Details (aligned with inventory product form) -->
              <div v-if="swapInFolderId && swapInFolder" class="space-y-3">
                <h4 class="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Swapped-In Device Details
                </h4>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div
                    v-for="field in swapInDisplayFields"
                    :key="field.id || field.name"
                    :class="
                      field.type === 'boolean' || field.type === 'date' ? 'sm:col-span-2' : ''
                    "
                  >
                    <label
                      class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                    >
                      {{ swapInFieldLabel(field) }}
                      <span v-if="field.required" class="text-red-500">*</span>
                    </label>
                    <!-- Text Input -->
                    <input
                      v-if="field.type === 'text'"
                      v-model="swapInItemForm[field.name]"
                      :required="field.required"
                      type="text"
                      :placeholder="swapInFieldPlaceholder(field)"
                      class="w-full px-3 py-2 text-xs rounded-sm bg-white dark:!bg-dashboard-card text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary-400/50"
                    />
                    <!-- Number Input -->
                    <input
                      v-else-if="field.type === 'number'"
                      v-model.number="swapInItemForm[field.name]"
                      :required="field.required"
                      type="number"
                      :placeholder="swapInFieldPlaceholder(field)"
                      class="w-full px-3 py-2 text-xs rounded-sm bg-white dark:!bg-dashboard-card text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary-400/50"
                    />
                    <!-- Currency Input -->
                    <div v-else-if="field.type === 'currency'" class="relative">
                      <span
                        class="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 dark:text-gray-400"
                        >{{ currencySymbol }}</span
                      >
                      <input
                        v-model.number="swapInItemForm[field.name]"
                        type="number"
                        step="0.01"
                        min="0"
                        :required="field.required"
                        class="w-full pl-7 pr-3 py-2 text-xs rounded-sm bg-white dark:!bg-dashboard-card text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary-400/50"
                        placeholder="0.00"
                      />
                    </div>
                    <!-- Date Input -->
                    <input
                      v-else-if="field.type === 'date'"
                      v-model="swapInItemForm[field.name]"
                      :required="field.required"
                      type="date"
                      class="app-field w-full px-3 py-2 text-xs rounded-sm dark:!bg-dashboard-card text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-primary-400/40"
                    />
                    <!-- Select Input -->
                    <select
                      v-else-if="field.type === 'select' && field.options"
                      v-model="swapInItemForm[field.name]"
                      :required="field.required"
                      class="app-field w-full px-3 py-2 text-xs rounded-sm dark:!bg-dashboard-card text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-primary-400/40"
                    >
                      <option value="">Select {{ swapInFieldLabel(field) }}</option>
                      <option v-for="option in field.options" :key="option" :value="option">
                        {{ option }}
                      </option>
                    </select>
                    <!-- Boolean Input -->
                    <Checkbox
                      v-else-if="field.type === 'boolean'"
                      v-model="swapInItemForm[field.name]"
                      :label="swapInFieldLabel(field)"
                      size="sm"
                    />
                  </div>
                </div>
                <p
                  v-if="swapInDisplayFields.length === 0"
                  class="text-xs text-gray-500 dark:text-gray-400"
                >
                  No template fields defined for this folder.
                </p>
              </div>
            </div>
          </div>
          <div class="p-3 rounded-sm">
            <div class="flex justify-between items-center mb-1.5">
              <span class="text-xs text-gray-600 dark:text-gray-400">Products</span>
              <span class="text-xs font-medium text-gray-900 dark:text-gray-100">{{
                totalSelectedQuantity
              }}</span>
            </div>
            <div class="flex justify-between items-center mb-1.5">
              <span class="text-xs text-gray-600 dark:text-gray-400">Subtotal (items)</span>
              <span class="text-xs font-medium text-gray-900 dark:text-gray-100">{{
                formatCurrency(itemsSubtotal)
              }}</span>
            </div>
            <div
              v-if="isSwapIn && swapInCreditAmount > 0"
              class="flex justify-between items-center mb-1.5"
            >
              <span class="text-xs text-gray-600 dark:text-gray-400">Swap credit (trade-in)</span>
              <span class="text-xs font-medium text-emerald-700 dark:text-emerald-400"
                >−{{ formatCurrency(swapInCreditAmount) }}</span
              >
            </div>
            <div class="flex justify-between items-center pt-1.5 border-t border-gray-200">
              <span class="text-sm font-semibold text-gray-900 dark:text-gray-100">{{
                isSwapIn ? 'Amount due' : 'Total'
              }}</span>
              <span class="text-base font-bold text-gray-900 dark:text-gray-100">{{
                formatCurrency(receiptTotal)
              }}</span>
            </div>
          </div>
        </div>
      </div>
    </template>

    <template #footer>
      <div
        class="flex w-full flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between"
      >
        <Button
          v-if="currentStep > 0"
          variant="outline"
          size="sm"
          :class="[footerBtnOutlineClass, 'w-full sm:w-auto']"
          @click="previousStep"
        >
          Back
        </Button>
        <div v-else class="hidden sm:block sm:min-w-[4rem]" />
        <div class="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <Button
            variant="outline"
            size="sm"
            :class="[footerBtnOutlineClass, 'w-full sm:w-auto']"
            @click="handleCancel"
          >
            Cancel
          </Button>
          <Button
            v-if="currentStep < 3"
            variant="primary"
            size="sm"
            :class="[footerBtnPrimaryClass, 'w-full sm:w-auto']"
            :disabled="!canProceed"
            @click="nextStep"
          >
            Next
          </Button>
          <Button
            v-else
            variant="primary"
            size="sm"
            :class="[footerBtnPrimaryClass, 'w-full sm:w-auto']"
            :disabled="!isFormValid || isCreating"
            @click="handleCreateReceipt"
          >
            {{ isCreating ? 'Creating…' : 'Create sale' }}
          </Button>
        </div>
      </div>
    </template>
  </SidePanel>

  <!-- Email Input Modal -->
  <Modal
    :model-value="showEmailModal"
    @update:model-value="showEmailModal = $event"
    size="sm"
    title="Send Receipt via Email"
  >
    <template #default>
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Email Address
          </label>
          <input
            v-model="emailToSend"
            type="email"
            placeholder="Enter email address"
            class="w-full px-3 py-2 rounded-sm bg-white dark:!bg-dashboard-card text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-primary-400"
            @keyup.enter="sendReceiptEmail(lastCreatedReceiptId, lastCreatedReceiptData)"
          />
        </div>
        <div class="flex gap-2 justify-end">
          <button @click="showEmailModal = false" class="btn-secondary">Cancel</button>
          <button
            @click="sendReceiptEmail(lastCreatedReceiptId, lastCreatedReceiptData)"
            :disabled="!emailToSend || !isValidEmail(emailToSend) || isSendingEmail"
            class="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-400 rounded-sm transition-colors"
          >
            {{ isSendingEmail ? 'Sending...' : 'Send' }}
          </button>
        </div>
      </div>
    </template>
  </Modal>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import {
  FolderIcon,
  CubeIcon,
  CheckCircleIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  EnvelopeIcon,
  PlusCircleIcon,
  ChevronRightIcon,
} from '~/utils/app-icons'
import Modal from '~/components/ui/Modal.vue'
import SidePanel from '~/components/ui/SidePanel.vue'
import DashboardDrawerStepper from '~/components/dashboard/DashboardDrawerStepper.vue'
import DashboardDrawerSearch from '~/components/dashboard/DashboardDrawerSearch.vue'
import SellScreenNoteBanner from '~/components/receipts/SellScreenNoteBanner.vue'
import PaymentMethodSelect from '~/components/receipts/PaymentMethodSelect.vue'
import Button from '~/components/ui/Button.vue'
import Checkbox from '~/components/ui/Checkbox.vue'
import { useInventoryStore, type InventoryFolder, type InventoryItem } from '~/stores/inventory'
import { useReceiptsStore, type ReceiptItem } from '~/stores/receipts'
import { useSellerLoanOutsStore } from '~/stores/sellerLoanOuts'
import { resolveItemUnitCost } from '~/utils/inventory-item-cost'
import { useCustomersStore } from '~/stores/customers'
import { useStoresStore } from '~/stores/stores'
import { useAuthStore } from '~/stores/auth'
import { useUserStore } from '~/stores/user'
import { useStaffStore } from '~/stores/staff'
import { usePreferences } from '~/composables/usePreferences'
import { getReceiptProductDetails } from '~/composables/useReceiptProductDetails'
import { computeBalanceDue, roundMoney } from '~/utils/receipt-balance'
import {
  getInventoryItemDisplayName as getItemDisplayName,
  getInventoryItemField as getItemField,
  getFolderColorClass,
} from '~/composables/useInventoryItemDisplay'
import {
  folderHasSerialNumbers,
  getSelectedFolderIds,
  groupSelectedSaleLinesByFolder,
} from '~/utils/receipt-multi-folder'
import { resolveBulkStockFieldAndValue } from '~/utils/inventory-bulk-quantity'

interface Props {
  modelValue: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'receipt-created': [receipt: any]
}>()

const inventoryStore = useInventoryStore()
const receiptsStore = useReceiptsStore()
const customersStore = useCustomersStore()
const storesStore = useStoresStore()
const authStore = useAuthStore()
const { authFetch } = useAuthenticatedFetch()
const userStore = useUserStore()
const staffStore = useStaffStore()
const { formatCurrency, preferences } = usePreferences()
const {
  sectionLabelClass,
  pickListClass,
  pickListScrollClass,
  pickRowClass,
  pickRowSelectedClass,
  pickRowTitleClass,
  pickRowMetaClass,
  emptyStateClass,
  drawerFillClass,
  drawerFillStepClass,
  footerBtnOutlineClass,
  footerBtnPrimaryClass,
} = useDashboardDrawerChrome()
const currencySymbol = computed(() => preferences.value.currencySymbol || '$')

// Swap-in creates inventory rows: super admin only (managers/staff cannot edit inventory structure).
const canUseSwapInReceipt = computed(() => userStore.isSuperAdmin)

const isSendingEmail = ref(false)
const showEmailModal = ref(false)
const emailToSend = ref('')
const lastCreatedReceiptId = ref('')
const lastCreatedReceiptData = ref<any>(null)

const steps = [
  { id: 'parent', label: 'Category' },
  { id: 'subcategory', label: 'Subcategory' },
  { id: 'items', label: 'Items' },
  { id: 'details', label: 'Sale details' },
]

const {
  selectedParentFolder,
  selectedFolder,
  folderSearchQuery,
  subcategorySearchQuery,
  skippedSubcategoryStep,
  parentCategoryRows,
  subcategoryFolders,
  isCategoryHub,
  folderPickerMeta,
  isParentRowSelected,
  isSubcategoryRowSelected,
  onParentCategoryRowClick,
  resetCategoryPicker,
  canProceedParentStep,
  canProceedSubcategoryStep,
  nextStepFromParent,
  previousStepFromItems,
} = useReceiptCategoryPicker()

const currentStep = ref(0)
const loadingFolders = ref(false)
const loadingItems = ref(false)
const isCreating = ref(false)
const selectedItems = ref<Array<{ id: string; quantity: number; item: InventoryItem }>>([])
const availableItems = ref<InventoryItem[]>([])
const itemSearchQuery = ref('')
const showCustomerSuggestions = ref(false)
const allCustomers = ref<
  Array<{
    id: string
    name: string
    email?: string
    phone?: string
    address?: string
    totalOrders: number
  }>
>([])

const receiptForm = ref({
  customerName: '',
  customerEmail: '',
  customerPhone: '',
  customerAddress: '',
  paymentMethod: '',
  notes: '',
})

/** paid_in_full = normal sale; balance_due = deposit now, stock held until paid off */
const paymentSettlement = ref<'paid_in_full' | 'balance_due'>('paid_in_full')
const depositAmount = ref(0)

const settlementActiveClass =
  'rounded-smborder-0-500/50 bg-primary-50 px-3 py-2 text-xs font-medium text-primary-800 dark:bg-primary-950/40 dark:text-primary-200'
const settlementInactiveClass =
  'rounded-sm bg-white px-3 py-2 text-xs font-medium text-gray-600 dark:!bg-dashboard-card dark:text-gray-400'

watch(paymentSettlement, (mode) => {
  if (mode === 'balance_due') {
    useSplitPayment.value = false
    if (isSwapIn.value) {
      isSwapIn.value = false
      swapInFolderId.value = ''
      swapInItemForm.value = {}
    }
  }
})

// Swap-in state
const isSwapIn = ref(false)
const swapInFolderId = ref<string>('')
const swapInItemForm = ref<Record<string, any>>({})

watch(canUseSwapInReceipt, (ok) => {
  if (!ok) {
    isSwapIn.value = false
    swapInFolderId.value = ''
    swapInItemForm.value = {}
  }
})

// Split payment state
const useSplitPayment = ref(false)
const splitPayments = ref<Array<{ method: string; amount: number }>>([{ method: '', amount: 0 }])

const leafFolders = computed(() => inventoryStore.leafFolders)

const matchingCustomers = computed(() => {
  if (!receiptForm.value.customerName || receiptForm.value.customerName.trim().length < 1) {
    return []
  }
  const query = receiptForm.value.customerName.toLowerCase().trim()
  return allCustomers.value
    .filter(
      (customer) =>
        customer.name.toLowerCase().includes(query) ||
        customer.email?.toLowerCase().includes(query) ||
        customer.phone?.includes(query)
    )
    .slice(0, 5) // Limit to 5 suggestions
})

const canProceed = computed(() => {
  if (currentStep.value === 0) {
    return canProceedParentStep()
  }
  if (currentStep.value === 1) {
    return canProceedSubcategoryStep()
  }
  if (currentStep.value === 2) {
    return selectedItems.value.length > 0 && !hasInvalidSelectedQuantities.value
  }
  return false
})

const hasSerialNumberInTemplate = computed(() => {
  if (!selectedFolder.value?.template?.fields) return false
  return selectedFolder.value.template.fields.some(
    (field) =>
      field.name.toLowerCase() === 'serialno' ||
      field.name.toLowerCase() === 'serialnumber' ||
      field.name.toLowerCase().includes('serial')
  )
})

/** Inventory currently on a stock loan (with borrower); may still be sold on a receipt to settle the loan. */
function itemIsOutOnSellerLoan(item: InventoryItem): boolean {
  const loan = item.sellerLoanOutId as unknown
  if (loan === undefined || loan === null) return false
  return `${loan}`.trim().length > 0
}

const filteredAvailableItems = computed(() => {
  let list: InventoryItem[]
  if (!itemSearchQuery.value.trim()) {
    list = [...availableItems.value]
  } else {
    const query = itemSearchQuery.value.toLowerCase()
    list = availableItems.value.filter((item) => {
      const itemName = getItemDisplayName(item).toLowerCase()
      if (itemName.includes(query)) return true

      if (selectedFolder.value?.hasSerialNumbers || hasSerialNumberInTemplate.value) {
        const serialNo =
          getItemField(item, 'serialNo') ||
          getItemField(item, 'serialNumber') ||
          getItemField(item, 'serial')
        if (serialNo && serialNo.toLowerCase().includes(query)) return true
      }

      const sku = getItemField(item, 'sku')
      if (sku && sku.toLowerCase().includes(query)) return true

      return false
    })
  }
  list.sort((a, b) => Number(itemIsOutOnSellerLoan(a)) - Number(itemIsOutOnSellerLoan(b)))
  return list
})

function onReceiptItemRowClick(item: InventoryItem) {
  toggleItemSelection(item)
}

// Swap-in folder
const swapInFolder = computed(() => {
  if (!swapInFolderId.value) return null
  return inventoryStore.folders.find((f) => f.id === swapInFolderId.value) || null
})

// Swap-in form: show only fields that appear as table columns in this folder's inventory table
// (same logic as inventory [id].vue: template fields excluding model, or default columns name/sku/price)
const defaultTableColumnFields: Array<{
  id?: string
  name: string
  label: string
  type: string
  required: boolean
  options?: string[]
}> = [
  { name: 'name', label: 'Product', type: 'text', required: true },
  { name: 'sku', label: 'SKU', type: 'text', required: false },
  { name: 'price', label: 'Price', type: 'currency', required: true },
]

const swapInDisplayFields = computed(() => {
  const folder = swapInFolder.value
  const templateFields = folder?.template?.fields
  if (templateFields && templateFields.length > 0) {
    return templateFields.filter((f: { name: string }) => f.name !== 'model')
  }
  return defaultTableColumnFields
})

function swapInFieldLabel(field: { name: string; label?: string }) {
  if (field.name === 'brand') return 'Product model'
  if (field.name === 'name') return 'Product'
  return field.label || field.name
}

function swapInFieldPlaceholder(field: {
  name: string
  label?: string
  placeholder?: string
  type?: string
}) {
  if (field.name === 'brand') return 'Enter product model'
  if (field.name === 'name') return 'Enter product'
  if (field.type === 'currency') return '0.00'
  return field.placeholder || `Enter ${swapInFieldLabel(field)}`
}

const isFormValid = computed(() => {
  const baseValid =
    receiptForm.value.customerName.trim() !== '' &&
    selectedItems.value.length > 0 &&
    !hasInvalidSelectedQuantities.value

  // Payment validation
  if (paymentSettlement.value === 'balance_due') {
    const deposit = roundMoney(Number(depositAmount.value) || 0)
    if (deposit <= 0 || deposit >= receiptTotal.value) return false
    if (!receiptForm.value.paymentMethod) return false
  } else if (useSplitPayment.value) {
    if (splitPayments.value.length === 0) return false
    if (splitPayments.value.some((p) => !p.method || p.amount <= 0)) return false
    if (Math.abs(splitPaymentsTotal.value - receiptTotal.value) > 0.01) return false
  } else {
    if (!receiptForm.value.paymentMethod) return false
  }

  // If swap-in is enabled, validate swap-in fields (only those we display, aligned with inventory)
  if (isSwapIn.value) {
    if (!swapInFolderId.value) return false
    if (!swapInFolder.value) return false
    const displayFields = swapInDisplayFields.value
    const requiredFields = displayFields.filter((f: { required?: boolean }) => f.required)
    for (const field of requiredFields) {
      const value = swapInItemForm.value[field.name]
      if (
        value === undefined ||
        value === null ||
        (typeof value === 'string' && value.trim() === '')
      ) {
        return false
      }
    }
  }

  return baseValid
})

const totalSelectedQuantity = computed(() => {
  return selectedItems.value.reduce((sum, si) => sum + si.quantity, 0)
})

const selectedItemsByFolder = computed(() => {
  const groups: Array<{
    folderId: string
    folderName: string
    lines: Array<{ id: string; quantity: number; item: InventoryItem }>
  }> = []
  const indexByFolder = new Map<string, number>()

  for (const line of selectedItems.value) {
    const folderId = line.item.folderId
    if (!folderId) continue
    let groupIndex = indexByFolder.get(folderId)
    if (groupIndex === undefined) {
      const folder = inventoryStore.getFolderById(folderId)
      groupIndex = groups.length
      indexByFolder.set(folderId, groupIndex)
      groups.push({
        folderId,
        folderName: folder?.name ?? 'Category',
        lines: [],
      })
    }
    groups[groupIndex]!.lines.push(line)
  }

  return groups
})

function itemUsesSerialNumbers(item: InventoryItem): boolean {
  const folder = inventoryStore.getFolderById(item.folderId)
  return folderHasSerialNumbers(folder)
}

function getItemStockFolder(item: InventoryItem) {
  return inventoryStore.getFolderById(item.folderId) ?? selectedFolder.value ?? undefined
}

function getItemAvailableStock(item: InventoryItem): number | null {
  if (itemUsesSerialNumbers(item)) return 1
  const resolved = resolveBulkStockFieldAndValue(
    item as Record<string, unknown>,
    getItemStockFolder(item)
  )
  if (resolved) return resolved.value
  const stockField = getItemField(item, 'stock')
  if (stockField) {
    const parsed = parseInt(stockField, 10)
    if (!Number.isNaN(parsed)) return parsed
  }
  return null
}

function getSelectedItemQuantityError(itemId: string): string | null {
  const selected = selectedItems.value.find((si) => si.id === itemId)
  if (!selected || itemUsesSerialNumbers(selected.item)) return null
  const available = getItemAvailableStock(selected.item)
  if (available === null) return null
  if (selected.quantity > available) {
    return `Only ${available} available`
  }
  return null
}

const hasInvalidSelectedQuantities = computed(() =>
  selectedItems.value.some((si) => getSelectedItemQuantityError(si.id) !== null)
)

function selectedCountForFolder(folderId: string): number {
  return selectedItems.value
    .filter((line) => line.item.folderId === folderId)
    .reduce((sum, line) => sum + line.quantity, 0)
}

function addFromAnotherCategory() {
  currentStep.value = 0
  selectedFolder.value = null
  selectedParentFolder.value = null
  skippedSubcategoryStep.value = false
  subcategorySearchQuery.value = ''
}

function goBackToParentCategories() {
  currentStep.value = 0
  selectedFolder.value = null
  subcategorySearchQuery.value = ''
}

async function onSubcategoryPick(folder: InventoryFolder) {
  await selectFolder(folder)
}

function removeSelectedItem(itemId: string) {
  const index = selectedItems.value.findIndex((line) => line.id === itemId)
  if (index > -1) selectedItems.value.splice(index, 1)
}

async function applySelectedItemsToInventory() {
  const grouped = groupSelectedSaleLinesByFolder(selectedItems.value)
  for (const [folderId, lines] of grouped) {
    let folder = inventoryStore.getFolderById(folderId)
    if (!folder) {
      folder = (await inventoryStore.fetchFolder(folderId)) ?? undefined
    }
    const hasSerialNumbers = folderHasSerialNumbers(folder)
    const saleLines = lines.map((line) => ({
      itemId: line.id,
      quantitySold: hasSerialNumbers ? 1 : line.quantity,
    }))
    await inventoryStore.applyReceiptSaleToInventory(folderId, saleLines, {
      hasSerialNumbers,
    })
  }
}

// Watch for modal opening to reset state
watch(
  () => props.modelValue,
  async (isOpen) => {
    if (isOpen) {
      resetForm()
      loadFolders()
      await loadCustomers()
    }
  }
)

// Watch for swap-in folder selection to initialize form (same fields as table columns)
watch(
  () => swapInFolderId.value,
  (folderId) => {
    if (!folderId) {
      swapInItemForm.value = {}
      return
    }
    const folder = swapInFolder.value
    const fields = swapInDisplayFields.value
    swapInItemForm.value = {}
    fields.forEach((field: { name: string; type?: string }) => {
      if (field.type === 'number' || field.type === 'currency') {
        swapInItemForm.value[field.name] = 0
      } else if (field.type === 'boolean') {
        swapInItemForm.value[field.name] = false
      } else if (field.type === 'date') {
        swapInItemForm.value[field.name] = new Date().toISOString().split('T')[0]
      } else {
        swapInItemForm.value[field.name] = ''
      }
    })
    const folderTitle = folder?.name?.trim()
    if (folderTitle && fields.some((f: { name: string }) => f.name === 'name')) {
      swapInItemForm.value.name = folderTitle
    }
  }
)

// Watch for swap-in toggle to reset form when disabled
watch(
  () => isSwapIn.value,
  (enabled) => {
    if (!enabled) {
      swapInFolderId.value = ''
      swapInItemForm.value = {}
    }
  }
)

// Load folders when component mounts or modal opens
onMounted(() => {
  if (props.modelValue) {
    loadFolders()
  }
})

const loadFolders = async () => {
  if (inventoryStore.folders.length === 0) {
    loadingFolders.value = true
    try {
      await inventoryStore.fetchFolders()
    } catch (error) {
      console.error('Error loading folders:', error)
    } finally {
      loadingFolders.value = false
    }
  }
}

const loadCustomers = async () => {
  try {
    // Ensure staff/manager → store owner id is resolved (same path as receipts/customers data)
    if (userStore.userData?.role === 'staff') {
      await staffStore.fetchCurrentStaffMember().catch(() => {})
    }
    await customersStore.fetchCustomers()

    allCustomers.value = customersStore.customers.map((customer) => ({
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
      totalOrders: customer.totalOrders,
    }))
  } catch (error) {
    console.error('Error loading customers:', error)
  }
}

const handleCustomerNameInput = () => {
  showCustomerSuggestions.value = true
}

const handleCustomerNameBlur = () => {
  // Delay hiding suggestions to allow click events to fire
  setTimeout(() => {
    showCustomerSuggestions.value = false
  }, 200)
}

const selectCustomer = (customer: {
  id: string
  name: string
  email?: string
  phone?: string
  address?: string
}) => {
  receiptForm.value.customerName = customer.name
  if (customer.email) {
    receiptForm.value.customerEmail = customer.email
  }
  if (customer.phone) {
    receiptForm.value.customerPhone = customer.phone
  }
  if (customer.address) {
    receiptForm.value.customerAddress = customer.address
  }
  showCustomerSuggestions.value = false
}

const selectFolder = async (folder: InventoryFolder) => {
  selectedFolder.value = folder
  await loadItems()
}

const loadItems = async () => {
  if (!selectedFolder.value) return

  loadingItems.value = true
  try {
    const items = await inventoryStore.fetchItemsAllChunked(selectedFolder.value.id, {
      force: true,
    })
    // Only show items that haven't been sold yet (no dateOut)
    availableItems.value = items.filter((item) => !item.dateOut && !item.pendingSaleReceiptId)

    // Only drop selections from the category being refreshed that are no longer available
    const currentFolderId = selectedFolder.value.id
    selectedItems.value = selectedItems.value.filter((line) => {
      if (line.item.folderId !== currentFolderId) return true
      return availableItems.value.some((item) => item.id === line.id)
    })
  } catch (error) {
    console.error('Error loading items:', error)
  } finally {
    loadingItems.value = false
  }
}

const toggleItemSelection = (item: InventoryItem, checked?: boolean) => {
  const hasSerialNumbers = itemUsesSerialNumbers(item)
  const defaultQuantity = hasSerialNumbers ? 1 : 1

  // If called from checkbox component, use the checked value; otherwise toggle
  if (checked !== undefined) {
    if (checked) {
      const index = selectedItems.value.findIndex((si) => si.id === item.id)
      if (index === -1) {
        selectedItems.value.push({
          id: item.id,
          quantity: defaultQuantity,
          item,
        })
      }
    } else {
      const index = selectedItems.value.findIndex((si) => si.id === item.id)
      if (index > -1) {
        selectedItems.value.splice(index, 1)
      }
    }
  } else {
    const index = selectedItems.value.findIndex((si) => si.id === item.id)
    if (index > -1) {
      selectedItems.value.splice(index, 1)
    } else {
      selectedItems.value.push({
        id: item.id,
        quantity: defaultQuantity,
        item,
      })
    }
  }
}

const getSelectedItemQuantity = (itemId: string) => {
  const selected = selectedItems.value.find((si) => si.id === itemId)
  return selected?.quantity || 1
}

const updateItemQuantity = (itemId: string, quantity: number) => {
  const selected = selectedItems.value.find((si) => si.id === itemId)
  if (selected) {
    if (itemUsesSerialNumbers(selected.item)) {
      selected.quantity = 1
      return
    }
    selected.quantity = Math.max(1, quantity)
  }
}

const getEffectivePrice = (item: InventoryItem): number => {
  // If item has a discount, use discounted price; otherwise use regular price
  if (item.discountedPrice !== undefined && item.discountedPrice !== null) {
    return item.discountedPrice
  }
  // Try to get price from item
  const priceField = getItemField(item, 'price')
  return parseFloat(priceField || '0')
}

const getOriginalPrice = (item: InventoryItem): number => {
  // If item has originalPrice stored (from discount), use it
  if (item.originalPrice !== undefined && item.originalPrice !== null) {
    return item.originalPrice
  }
  // Otherwise get from price field
  const priceField = getItemField(item, 'price')
  return parseFloat(priceField || '0')
}

/** Sum of sold line items (after per-item discounts) before swap credit */
const calculateItemsSubtotal = () => {
  return selectedItems.value.reduce((total, si) => {
    const price = getEffectivePrice(si.item)
    return total + price * si.quantity
  }, 0)
}

/** Value credited from swapped-in device (sum of currency fields on swap-in form) */
const getSwapInCredit = () => {
  if (!isSwapIn.value || !swapInFolder.value) return 0
  return swapInDisplayFields.value
    .filter((f: { type?: string }) => f.type === 'currency')
    .reduce((sum, f: { name: string }) => sum + (Number(swapInItemForm.value[f.name]) || 0), 0)
}

/** Amount the customer pays: items subtotal minus swap credit (not below zero) */
const calculateTotal = () => {
  const sub = calculateItemsSubtotal()
  if (!isSwapIn.value) return sub
  return Math.max(0, sub - getSwapInCredit())
}

const itemsSubtotal = computed(() => calculateItemsSubtotal())
const swapInCreditAmount = computed(() => getSwapInCredit())

const receiptTotal = computed(() => calculateTotal())

const splitPaymentsTotal = computed(() => {
  return splitPayments.value.reduce((sum, payment) => sum + (payment.amount || 0), 0)
})

const SPLIT_PAY_EPS = 0.01
/** Positive = still to allocate, negative = over, ~0 = balanced */
const splitPaymentRemaining = computed(() => {
  const left = receiptTotal.value - splitPaymentsTotal.value
  return Math.round(left * 100) / 100
})

const splitPaymentBalanceUi = computed(() => {
  const rem = splitPaymentRemaining.value
  if (Math.abs(rem) < SPLIT_PAY_EPS) {
    return {
      tone: 'ok' as const,
      headline: 'Balanced',
      sub: 'Payment lines match the receipt total.',
    }
  }
  if (rem > 0) {
    return {
      tone: 'short' as const,
      headline: `${formatCurrency(rem)} left`,
      sub: `Allocate the rest so the sum equals ${formatCurrency(receiptTotal.value)}.`,
    }
  }
  return {
    tone: 'over' as const,
    headline: `Over by ${formatCurrency(Math.abs(rem))}`,
    sub: 'Reduce an amount or remove a line so the total matches the receipt.',
  }
})

const addSplitPayment = () => {
  splitPayments.value.push({ method: '', amount: 0 })
}

const removeSplitPayment = (index: number) => {
  splitPayments.value.splice(index, 1)
  if (splitPayments.value.length === 0) {
    splitPayments.value.push({ method: '', amount: 0 })
  }
}

// formatCurrency is now imported from usePreferences for currency conversion
// getItemDisplayName, getItemField, getFolderColorClass from useInventoryItemDisplay

const nextStep = async () => {
  if (!canProceed.value) return
  if (currentStep.value === 0) {
    currentStep.value = nextStepFromParent()
    if (currentStep.value === 2 && selectedFolder.value) {
      await loadItems()
    }
    return
  }
  if (currentStep.value < steps.length - 1) {
    currentStep.value++
  }
}

const previousStep = () => {
  if (currentStep.value === 2) {
    currentStep.value = previousStepFromItems()
    return
  }
  if (currentStep.value > 0) {
    currentStep.value--
  }
}

const resetForm = () => {
  currentStep.value = 0
  resetCategoryPicker()
  selectedItems.value = []
  availableItems.value = []
  folderSearchQuery.value = ''
  itemSearchQuery.value = ''
  receiptForm.value = {
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    customerAddress: '',
    paymentMethod: '',
    notes: '',
  }
  paymentSettlement.value = 'paid_in_full'
  depositAmount.value = 0
  // Reset swap-in state
  isSwapIn.value = false
  swapInFolderId.value = ''
  swapInItemForm.value = {}
  // Reset split payment state
  useSplitPayment.value = false
  splitPayments.value = [{ method: '', amount: 0 }]
  // Reset customer suggestions
  showCustomerSuggestions.value = false
}

const handleCancel = () => {
  resetForm()
  emit('update:modelValue', false)
}

const handleCreateReceipt = async () => {
  if (!isFormValid.value || selectedItems.value.length === 0) return

  isCreating.value = true
  try {
    // Generate receipt number
    const receiptNumber = `REC-${Date.now().toString().slice(-6)}`

    const folderIds = getSelectedFolderIds(selectedItems.value)
    const primaryFolderId = folderIds[0] || selectedFolder.value?.id || ''
    const receiptHasSerialNumbers = selectedItems.value.some((line) =>
      itemUsesSerialNumbers(line.item)
    )

    // Create receipt items array
    const receiptItems: ReceiptItem[] = selectedItems.value.map((si) => {
      const lineSerial = itemUsesSerialNumbers(si.item)
      const effectivePrice = getEffectivePrice(si.item)
      const originalPrice = getOriginalPrice(si.item)
      const hasDiscount = si.item.discountedPrice !== undefined && si.item.discountedPrice !== null

      const itemQuantity = lineSerial ? 1 : si.quantity

      return {
        itemId: si.id,
        folderId: si.item.folderId,
        quantity: itemQuantity,
        price: effectivePrice, // Final price after discount
        itemName: getItemDisplayName(si.item),
        unitCost: resolveItemUnitCost(si.item),
        serialNo:
          getItemField(si.item, 'serialNo') ||
          getItemField(si.item, 'serialNumber') ||
          getItemField(si.item, 'serial'),
        brand: getItemField(si.item, 'brand'),
        model: getItemField(si.item, 'model'),
        sku: getItemField(si.item, 'sku'),
        productDetails: getReceiptProductDetails(si.item),
        // Include discount information if applicable
        ...(hasDiscount && {
          originalPrice: originalPrice,
          discountPercentage: si.item.discountPercentage,
          discountAmount: si.item.discountAmount,
          hasDiscount: true,
        }),
      }
    })

    const itemIds = selectedItems.value.map((si) => si.id)
    const isBalanceDue = paymentSettlement.value === 'balance_due'
    const total = calculateTotal()
    const deposit = roundMoney(Number(depositAmount.value) || 0)

    if (!isBalanceDue && itemIds.length > 0) {
      await applySelectedItemsToInventory()
      await useSellerLoanOutsStore()
        .fetchSellerLoanOuts(true)
        .catch(() => {})
    }

    // Handle swap-in: Create inventory item for swapped-in device
    let swapInItemId: string | undefined = undefined
    if (isSwapIn.value && swapInFolderId.value && swapInFolder.value) {
      try {
        // Prepare item data from form
        const swapInItemData: Record<string, any> = {
          ...swapInItemForm.value,
          swapIn: true, // Mark as swap-in item
          unitCost: swapInCreditAmount.value > 0 ? swapInCreditAmount.value : undefined,
        }

        // Create the swap-in inventory item
        swapInItemId = await inventoryStore.createItem(swapInFolderId.value, swapInItemData)
      } catch (error: any) {
        console.error('Error creating swap-in item:', error)
        throw new Error(`Failed to create swap-in item: ${error.message}`)
      }
    }

    // Get current store and user information
    const currentStore = storesStore.currentStore
    const currentStoreId = storesStore.currentStoreId
    if (!currentStoreId) {
      alert('No store selected. Please select a store first.')
      isCreating.value = false
      return
    }

    const storeBranchName = currentStore?.name || 'Unknown Store'

    // Get user name (staff member or super admin)
    let createdByUserName = 'Unknown User'
    if (userStore.userData?.role === 'staff') {
      // For staff, get their name from staff document
      const staffMember = await staffStore.fetchCurrentStaffMember()
      if (staffMember) {
        createdByUserName =
          `${staffMember.firstName} ${staffMember.lastName}`.trim() ||
          staffMember.email ||
          'Staff Member'
      }
    } else if (userStore.userData) {
      // For super admin, use their name or email
      createdByUserName = userStore.userData.name || userStore.userData.email || 'Super Admin'
    }

    // Create receipt in Firestore
    const receiptData: any = {
      receiptNumber,
      customerName: receiptForm.value.customerName,
      customerEmail: receiptForm.value.customerEmail || '',
      customerPhone: receiptForm.value.customerPhone || undefined,
      customerAddress: receiptForm.value.customerAddress || undefined,
      date: new Date(),
      items: receiptItems,
      itemsCount: totalSelectedQuantity.value,
      total,
      paymentMethod: useSplitPayment.value ? 'Split Payment' : receiptForm.value.paymentMethod,
      status: isBalanceDue ? 'balance_due' : 'completed',
      notes: receiptForm.value.notes || '',
      hasSerialNumbers: receiptHasSerialNumbers,
      ...(isBalanceDue && {
        amountPaid: deposit,
        balanceDue: computeBalanceDue(total, deposit),
        payments: [
          {
            amount: deposit,
            method: receiptForm.value.paymentMethod,
            paidAt: new Date(),
          },
        ],
      }),
      folderId: primaryFolderId,
      folderIds: folderIds.length > 0 ? folderIds : primaryFolderId ? [primaryFolderId] : [],
      itemIds,
      storeId: currentStoreId, // Store ID where receipt was created
      storeBranchName, // Store branch name
      storeLogoUrl: storesStore.currentStore?.logoUrl || userStore.userData?.storeLogoUrl || '', // Account logo - empty string if none (Firestore rejects undefined)
      createdByUserName, // User who created the receipt
    }

    // Add split payments if enabled
    if (useSplitPayment.value && splitPayments.value.length > 0) {
      receiptData.splitPayments = splitPayments.value.map((p) => ({
        method: p.method,
        amount: p.amount,
      }))
    }

    // Add swap-in fields if enabled
    if (isSwapIn.value && swapInFolderId.value && swapInItemId) {
      receiptData.isSwapIn = true
      receiptData.swapInFolderId = swapInFolderId.value
      receiptData.swapInItemId = swapInItemId
      receiptData.swapInCredit = getSwapInCredit()
    }

    // Create receipt first
    const receiptId = await receiptsStore.createReceipt(receiptData)

    if (isBalanceDue && itemIds.length > 0) {
      await inventoryStore.reserveInventoryForBalanceDue(receiptId, itemIds)
    }

    // Update swap-in item to link it to the receipt (if created)
    if (swapInItemId && swapInFolderId.value) {
      try {
        // Update the item to link it to the receipt
        await inventoryStore.updateItem(swapInFolderId.value, swapInItemId, {
          swapInReceiptId: receiptId,
        })
      } catch (error: any) {
        console.error('Error updating swap-in item with receipt ID:', error)
        // Don't fail receipt creation if swap-in update fails
      }
    }

    // Create or update customer automatically
    try {
      await customersStore.createOrUpdateCustomerFromReceipt(receiptId, {
        customerName: receiptForm.value.customerName,
        customerEmail: receiptForm.value.customerEmail || undefined,
        customerPhone: receiptForm.value.customerPhone || undefined,
        customerAddress: receiptForm.value.customerAddress || undefined,
        total: calculateTotal(),
        date: new Date(),
      })
    } catch (error: any) {
      console.error('Error creating/updating customer:', error)
      // Don't fail the receipt creation if customer creation fails
    }

    emit('receipt-created', { ...receiptData, id: receiptId })

    lastCreatedReceiptId.value = receiptId
    lastCreatedReceiptData.value = receiptData

    resetForm()
    emit('update:modelValue', false)
  } catch (error: any) {
    console.error('Error creating receipt:', error)
    alert(`Error creating receipt: ${error.message || 'Unknown error'}`)
  } finally {
    isCreating.value = false
  }
}

const isValidEmail = (email: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

const sendReceiptEmail = async (receiptId: string, receiptData: any) => {
  if (!emailToSend.value || !isValidEmail(emailToSend.value)) {
    alert('Please enter a valid email address')
    return
  }

  isSendingEmail.value = true
  try {
    // Note: For CreateReceiptModal, we send receiptData only
    // The server can generate PDF from receipt data if needed
    // For now, we'll rely on the HTML email body
    // To attach PDF, you would need to either:
    // 1. Open ViewReceiptModal to generate PDF from DOM
    // 2. Generate PDF on server side from receipt data
    const response = await authFetch<{ success: boolean; error?: string }>(
      '/api/receipts/send-email',
      {
        method: 'POST',
        body: {
          receiptId,
          receiptNumber: receiptData.receiptNumber,
          customerEmail: emailToSend.value,
          receiptData,
        },
      }
    )

    if (!response.success) {
      const errorMessage =
        'error' in response && response.error ? String(response.error) : 'Failed to send email'
      throw new Error(errorMessage)
    }

    alert('Receipt sent to email successfully!')
    showEmailModal.value = false
    emailToSend.value = ''
  } catch (error: any) {
    console.error('Error sending receipt email:', error)
    throw error
  } finally {
    isSendingEmail.value = false
  }
}
</script>
