<template>
  <SDialog
      placement="right"
    :open="props.modelValue"
    title="New sale"
    size="md"
    @update:open="(value: boolean) => emit('update:modelValue', value)"
  >
    <template #default>
      <div :class="[drawerFillClass, 's-new-sale']">
        <nav aria-label="Sale progress">
          <ol class="s-steps">
            <li
              v-for="(step, index) in steps"
              :key="step.id"
              class="s-steps__item"
              :class="{
                's-steps__item--done': index < currentStep,
                's-steps__item--current': index === currentStep,
              }"
              :aria-current="index === currentStep ? 'step' : undefined"
            >
              <span class="s-steps__marker" aria-hidden="true">
                <CheckIcon v-if="index < currentStep" :size="12" :stroke-width="3" />
                <template v-else>{{ index + 1 }}</template>
              </span>
              <span class="s-steps__label">{{ step.label }}</span>
              <span v-if="index < currentStep" class="ds-sr-only">(done)</span>
            </li>
          </ol>
        </nav>

        <div
          v-if="prefillItemMatchFailed"
          :class="drawerCalloutClass"
          role="status"
        >
          No matching in-stock product. Pick a category and items manually.
        </div>

        <SellScreenNoteBanner v-if="currentStep >= 2" />

        <!-- Step 1: Parent category -->
        <div
          v-if="currentStep === 0"
          :class="drawerFillStepClass"
        >
          <p :class="sectionLabelClass">Parent category</p>
          <SSearch v-model="folderSearchQuery" placeholder="Search categories…" />

          <div v-if="loadingFolders" :class="pickListClass" aria-busy="true">
            <span class="ds-sr-only">Loading categories…</span>
            <div :class="pickListScrollClass">
              <div v-for="i in 6" :key="i" :class="pickRowClass">
                <SSkeleton width="36px" height="36px" />
                <span class="s-new-sale__row-body">
                  <SSkeleton width="60%" height="12px" />
                  <SSkeleton width="35%" height="10px" />
                </span>
              </div>
            </div>
          </div>
          <div v-else-if="parentCategoryRows.length === 0" :class="emptyStateClass">
            <FolderIcon :size="24" :stroke-width="1.5" aria-hidden="true" />
            <p class="s-new-sale__empty-title">
              {{ folderSearchQuery ? 'No categories found' : 'No categories yet' }}
            </p>
            <p>
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
                  row.depth === 1 ? 's-new-sale__row--nested' : '',
                ]"
                :aria-pressed="isParentRowSelected(row.folder)"
                @click="onParentCategoryRowClick(row)"
              >
                <span class="s-new-sale__mark" aria-hidden="true">
                  <FolderIcon :size="16" :stroke-width="1.75" />
                </span>
                <span class="s-new-sale__row-body">
                  <span :class="pickRowTitleClass">
                    {{ row.folder.name }}
                    <span v-if="row.depth === 1 && row.parentName" class="s-new-sale__muted">
                      · {{ row.parentName }}
                    </span>
                  </span>
                  <span :class="pickRowMetaClass">
                    {{ folderPickerMeta(row.folder) }}
                    <span
                      v-if="!isCategoryHub(row.folder) && selectedCountForFolder(row.folder.id) > 0"
                      class="s-new-sale__accent"
                    >
                      · {{ selectedCountForFolder(row.folder.id) }} in this sale
                    </span>
                  </span>
                </span>
                <ChevronRightIcon
                  v-if="isCategoryHub(row.folder) && !isParentRowSelected(row.folder)"
                  class="s-new-sale__row-icon"
                  :size="16"
                  :stroke-width="2"
                  aria-hidden="true"
                />
                <CheckCircleIcon
                  v-if="isParentRowSelected(row.folder)"
                  class="s-new-sale__row-check"
                  :size="16"
                  :stroke-width="2"
                  aria-hidden="true"
                />
              </button>
            </div>
          </div>
        </div>

        <!-- Step 2: Subcategory -->
        <div
          v-if="currentStep === 1"
          :class="drawerFillStepClass"
        >
          <div class="s-new-sale__head">
            <p :class="sectionLabelClass">
              Subcategory · {{ selectedParentFolder?.name }}
            </p>
            <SButton variant="ghost" size="sm" @click="goBackToParentCategories">
              Change parent
            </SButton>
          </div>
          <SSearch v-model="subcategorySearchQuery" placeholder="Search subcategories…" />
          <div v-if="subcategoryFolders.length === 0" :class="emptyStateClass">
            <FolderIcon :size="24" :stroke-width="1.5" aria-hidden="true" />
            <p class="s-new-sale__empty-title">
              {{ subcategorySearchQuery ? 'No subcategories found' : 'No subcategories yet' }}
            </p>
            <p>Add subcategories under this parent in Inventory</p>
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
                :aria-pressed="isSubcategoryRowSelected(folder)"
                @click="onSubcategoryPick(folder)"
              >
                <span class="s-new-sale__mark" aria-hidden="true">
                  <FolderIcon :size="16" :stroke-width="1.75" />
                </span>
                <span class="s-new-sale__row-body">
                  <span :class="pickRowTitleClass">{{ folder.name }}</span>
                  <span :class="pickRowMetaClass">
                    {{ folderPickerMeta(folder) }}
                    <span v-if="selectedCountForFolder(folder.id) > 0" class="s-new-sale__accent">
                      · {{ selectedCountForFolder(folder.id) }} in this sale
                    </span>
                  </span>
                </span>
                <CheckCircleIcon
                  v-if="isSubcategoryRowSelected(folder)"
                  class="s-new-sale__row-check"
                  :size="16"
                  :stroke-width="2"
                  aria-hidden="true"
                />
              </button>
            </div>
          </div>
        </div>

        <!-- Step 3: Select Items -->
        <div
          v-if="currentStep === 2"
          :class="drawerFillStepClass"
        >
          <div class="s-new-sale__head">
            <p :class="sectionLabelClass">Items · {{ selectedFolder?.name }}</p>
            <div class="s-new-sale__head-actions">
              <SButton variant="ghost" size="sm" @click="addFromAnotherCategory">
                <template #leading>
                  <PlusCircleIcon :size="16" :stroke-width="2" aria-hidden="true" />
                </template>
                Add from another category
              </SButton>
              <SButton variant="ghost" size="sm" @click="loadItems">
                <template #leading>
                  <ArrowPathIcon :size="16" :stroke-width="2" aria-hidden="true" />
                </template>
                Refresh list
              </SButton>
            </div>
          </div>
          <SSearch
            v-model="itemSearchQuery"
            :placeholder="
              selectedFolder?.hasSerialNumbers ? 'Search name or serial…' : 'Search products…'
            "
          />
          <div
            v-if="loadingItems"
            :class="pickListClass"
            aria-busy="true"
          >
            <span class="ds-sr-only">Loading items…</span>
            <div :class="pickListScrollClass">
              <div v-for="i in 6" :key="i" :class="pickRowClass">
                <SSkeleton width="20px" height="20px" />
                <span class="s-new-sale__row-body">
                  <SSkeleton width="60%" height="12px" />
                  <SSkeleton width="35%" height="10px" />
                </span>
              </div>
            </div>
          </div>
          <div v-else-if="availableItems.length === 0" :class="emptyStateClass">
            <CubeIcon :size="24" :stroke-width="1.5" aria-hidden="true" />
            <p class="s-new-sale__empty-title">No items available</p>
            <p>This category has no items to add</p>
          </div>
          <div v-else :class="pickListClass">
            <div :class="pickListScrollClass">
              <div
                v-for="item in filteredAvailableItems"
                :key="item.id"
                :class="[
                  pickRowClass,
                  's-new-sale__item',
                  selectedItems.find((si) => si.id === item.id) ? pickRowSelectedClass : '',
                  itemIsOutOnSellerLoan(item) && !selectedItems.find((si) => si.id === item.id)
                    ? 's-new-sale__item--loan'
                    : '',
                ]"
                @click="onReceiptItemRowClick(item)"
              >
                <div class="s-new-sale__item-main">
                  <span class="s-new-sale__item-check" @click.stop>
                    <SCheckbox
                      :model-value="selectedItems.find((si) => si.id === item.id) !== undefined"
                      :aria-label="`Select ${getItemDisplayName(item)}`"
                      @update:model-value="(checked: boolean) => toggleItemSelection(item, checked)"
                    />
                  </span>
                  <div class="s-new-sale__row-body">
                    <p
                      class="s-new-sale__item-title"
                      :class="{ 's-new-sale__item-title--loan': itemIsOutOnSellerLoan(item) }"
                    >
                      {{ getItemDisplayName(item) }}
                    </p>
                    <p class="s-new-sale__meta">
                      <SBadge v-if="itemIsOutOnSellerLoan(item)" tone="warning">
                        On stock loan<span v-if="item.sellerLoanPartyName"
                          >&nbsp;· {{ item.sellerLoanPartyName }}</span
                        >
                      </SBadge>
                      <span
                        v-if="
                          (selectedFolder?.hasSerialNumbers || hasSerialNumberInTemplate) &&
                          (getItemField(item, 'serialNo') || getItemField(item, 'serialNumber'))
                        "
                      >
                        Serial:
                        {{ getItemField(item, 'serialNo') || getItemField(item, 'serialNumber') }}
                      </span>
                      <span v-if="getItemField(item, 'sku')">SKU: {{ getItemField(item, 'sku') }}</span>
                      <span v-if="getItemField(item, 'price')">
                        <span
                          v-if="item.discountedPrice !== undefined && item.discountedPrice !== null"
                          class="s-new-sale__price"
                        >
                          <s class="s-new-sale__price-was">
                            {{ formatCurrency(parseFloat(getItemField(item, 'price') || '0')) }}
                          </s>
                          <span class="s-new-sale__price-now">
                            {{ formatCurrency(item.discountedPrice) }}
                          </span>
                          <span class="s-new-sale__price-off">
                            ({{
                              item.discountPercentage
                                ? `-${item.discountPercentage}%`
                                : `-${formatCurrency(item.discountAmount || 0)}`
                            }})
                          </span>
                        </span>
                        <span v-else>
                          Price:
                          {{ formatCurrency(parseFloat(getItemField(item, 'price') || '0')) }}
                        </span>
                      </span>
                      <span
                        v-if="
                          !itemUsesSerialNumbers(item) && getItemAvailableStock(item) !== null
                        "
                      >
                        Stock: {{ getItemAvailableStock(item) }}
                      </span>
                    </p>
                  </div>
                </div>
                <div
                  v-if="
                    selectedItems.find((si) => si.id === item.id) &&
                    !itemUsesSerialNumbers(item)
                  "
                  class="s-new-sale__item-extra"
                  @click.stop
                >
                  <SField label="Quantity" :error="getSelectedItemQuantityError(item.id) || undefined">
                    <SInput
                      class="s-new-sale__narrow"
                      type="number"
                      min="1"
                      :model-value="getSelectedItemQuantity(item.id)"
                      @update:model-value="
                        (value) => updateItemQuantity(item.id, parseInt(String(value)) || 1)
                      "
                    />
                  </SField>
                </div>
                <div
                  v-if="selectedItems.find((si) => si.id === item.id)"
                  class="s-new-sale__item-extra"
                  @click.stop
                >
                  <template
                    v-if="
                      !selectedItems.find((si) => si.id === item.id)?.showDiscountInput &&
                      !(selectedItems.find((si) => si.id === item.id)?.discountAmount)
                    "
                  >
                    <SButton variant="ghost" size="sm" @click="toggleItemDiscountInput(item.id)">
                      <template #leading>
                        <PlusIcon :size="16" :stroke-width="2" aria-hidden="true" />
                      </template>
                      Discount
                    </SButton>
                  </template>
                  <SField v-else label="Discount">
                    <div class="s-inline-field">
                      <SInput
                        class="s-new-sale__narrow"
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        :model-value="selectedItems.find((si) => si.id === item.id)?.discountAmount"
                        @update:model-value="
                          (value) => setItemDiscountAmount(item.id, parseFloat(String(value)) || 0)
                        "
                      >
                        <template #prefix>{{ currencySymbol }}</template>
                      </SInput>
                      <SButton variant="ghost" @click="clearItemDiscount(item.id)">Remove</SButton>
                    </div>
                  </SField>
                </div>
              </div>
            </div>
          </div>
          <section
            v-if="selectedItems.length > 0"
            class="s-new-sale__summary"
            aria-label="Selected products"
          >
            <p class="s-new-sale__summary-title">Selected ({{ totalSelectedQuantity }})</p>
            <div
              v-for="group in selectedItemsByFolder"
              :key="group.folderId"
              class="s-new-sale__group"
            >
              <p class="s-new-sale__group-title">{{ group.folderName }}</p>
              <ul class="s-new-sale__lines">
                <li v-for="si in group.lines" :key="si.id" class="s-new-sale__line">
                  <span
                    class="s-new-sale__line-text"
                    :class="{ 's-new-sale__line-text--error': getSelectedItemQuantityError(si.id) }"
                  >
                    <span class="s-new-sale__line-name">
                      {{ getItemDisplayName(si.item) }}
                      <span v-if="!itemUsesSerialNumbers(si.item) && si.quantity > 1">
                        × {{ si.quantity }}
                      </span>
                    </span>
                    <span class="s-new-sale__line-price">
                      {{
                        formatCurrency(
                          Math.max(0, getEffectivePrice(si.item) - (si.discountAmount || 0))
                        )
                      }}
                    </span>
                    <span v-if="getSelectedItemQuantityError(si.id)" class="s-new-sale__line-error">
                      {{ getSelectedItemQuantityError(si.id) }}
                    </span>
                  </span>
                  <SIconButton
                    :label="`Remove ${getItemDisplayName(si.item)}`"
                    class="s-new-sale__line-remove"
                    @click.stop="removeSelectedItem(si.id)"
                  >
                    <XMarkIcon :size="16" :stroke-width="2" aria-hidden="true" />
                  </SIconButton>
                </li>
              </ul>
            </div>
            <p class="s-new-sale__summary-total">
              <span>Total</span>
              <span>{{ formatCurrency(itemsSubtotal) }}</span>
            </p>
          </section>
        </div>

        <!-- Step 4: Sale Details -->
        <SForm v-if="currentStep === 3">
          <SFormSection>
            <SField label="Customer name" required>
              <div class="s-pop-anchor">
                <SInput
                  v-model="receiptForm.customerName"
                  required
                  autocomplete="off"
                  @input="handleCustomerNameInput"
                  @focus="showCustomerSuggestions = true"
                  @blur="handleCustomerNameBlur"
                  placeholder="John Doe"
                >
                  <template v-if="receiptForm.customerName && matchingCustomers.length > 0" #suffix>
                    <MagnifyingGlassIcon :size="16" :stroke-width="1.75" aria-hidden="true" />
                  </template>
                </SInput>
                <ul
                  v-if="
                    showCustomerSuggestions &&
                    receiptForm.customerName &&
                    matchingCustomers.length > 0
                  "
                  class="s-popover s-popover--start s-new-sale__suggest"
                  role="listbox"
                  aria-label="Matching customers"
                >
                  <li
                    v-for="customer in matchingCustomers"
                    :key="customer.id"
                    class="s-menu-row"
                    role="option"
                    aria-selected="false"
                    @mousedown.prevent="selectCustomer(customer)"
                  >
                    <span class="s-menu-row__text">
                      <span class="s-menu-row__label">{{ customer.name }}</span>
                      <span v-if="customer.email || customer.phone" class="s-menu-row__meta">
                        {{ [customer.email, customer.phone].filter(Boolean).join(' · ') }}
                      </span>
                    </span>
                    <span class="s-new-sale__suggest-count">
                      {{ customer.totalOrders }} order{{ customer.totalOrders !== 1 ? 's' : '' }}
                    </span>
                  </li>
                </ul>
              </div>
            </SField>
            <div class="s-form-pair">
              <SField label="Customer email">
                <SInput
                  v-model="receiptForm.customerEmail"
                  type="email"
                  placeholder="john@example.com"
                />
              </SField>
              <SField label="Customer phone">
                <SInput
                  v-model="receiptForm.customerPhone"
                  type="tel"
                  placeholder="+1 234 567 8900"
                />
              </SField>
            </div>
            <SField label="Customer address">
              <SInput
                v-model="receiptForm.customerAddress"
                placeholder="123 Main St, City, State"
              />
            </SField>
            <SField :label="useSplitPayment ? 'Payment methods' : 'Payment method'" required>
              <SSelect v-if="!useSplitPayment" v-model="receiptForm.paymentMethod" required>
                <option value="">Select payment method</option>
                <option v-for="tender in paymentTenderOptions" :key="tender" :value="tender">
                  {{ tender }}
                </option>
              </SSelect>

              <div v-else class="s-new-sale__split">
                <div
                  v-for="(payment, index) in splitPayments"
                  :key="index"
                  class="s-new-sale__split-row"
                >
                  <SSelect
                    v-model="payment.method"
                    required
                    :aria-label="`Payment method ${index + 1}`"
                  >
                    <option value="">Select method</option>
                    <option v-for="tender in paymentTenderOptions" :key="tender" :value="tender">
                      {{ tender }}
                    </option>
                  </SSelect>
                  <SInput
                    v-model.number="payment.amount"
                    type="number"
                    step="0.01"
                    :min="0"
                    :max="receiptTotal - splitPaymentsTotal + payment.amount"
                    required
                    placeholder="0.00"
                    :aria-label="`Amount ${index + 1}`"
                  >
                    <template #prefix>{{ currencySymbol }}</template>
                  </SInput>
                  <SIconButton
                    v-if="splitPayments.length > 1"
                    :label="`Remove payment ${index + 1}`"
                    @click="removeSplitPayment(index)"
                  >
                    <XMarkIcon :size="16" :stroke-width="2" aria-hidden="true" />
                  </SIconButton>
                </div>
                <SButton variant="ghost" size="sm" @click="addSplitPayment">
                  <template #leading>
                    <PlusCircleIcon :size="16" :stroke-width="2" aria-hidden="true" />
                  </template>
                  Add payment method
                </SButton>
                <div
                  class="s-new-sale__balance"
                  :class="`s-new-sale__balance--${splitPaymentBalanceUi.tone}`"
                  role="status"
                >
                  <div class="s-new-sale__balance-head">
                    <span class="s-new-sale__balance-label">Balance</span>
                    <span class="s-new-sale__balance-value">{{ splitPaymentBalanceUi.headline }}</span>
                  </div>
                  <p class="s-new-sale__balance-sub">{{ splitPaymentBalanceUi.sub }}</p>
                  <p class="s-new-sale__balance-foot">
                    Allocated {{ formatCurrency(splitPaymentsTotal) }} of
                    {{ formatCurrency(receiptTotal) }}
                  </p>
                </div>
              </div>
            </SField>
            <SCheckbox
              v-if="paymentSettlement !== 'balance_due'"
              v-model="useSplitPayment"
              label="Split payment"
            />
            <div class="s-field">
              <span :id="settlementLabelId" class="s-field__label">
                Payment<span class="s-field__required" aria-hidden="true">*</span>
              </span>
              <div class="s-choice-grid" role="radiogroup" :aria-labelledby="settlementLabelId">
                <button
                  type="button"
                  role="radio"
                  class="s-choice"
                  :aria-checked="paymentSettlement === 'paid_in_full'"
                  @click="paymentSettlement = 'paid_in_full'"
                >
                  <span class="s-choice__head">
                    <span class="s-choice__title">Paid in full</span>
                    <span class="s-choice__radio" aria-hidden="true" />
                  </span>
                </button>
                <button
                  type="button"
                  role="radio"
                  class="s-choice"
                  :aria-checked="paymentSettlement === 'balance_due'"
                  @click="paymentSettlement = 'balance_due'"
                >
                  <span class="s-choice__head">
                    <span class="s-choice__title">Balance due</span>
                    <span class="s-choice__radio" aria-hidden="true" />
                  </span>
                </button>
              </div>
              <p class="s-field__hint">
                {{
                  paymentSettlement === 'balance_due'
                    ? 'Stock stays reserved until paid off. Order appears under Outstanding.'
                    : 'Stock is marked sold when the sale is recorded.'
                }}
              </p>
            </div>
            <div v-if="paymentSettlement === 'balance_due'" class="s-new-sale__deposit">
              <SField label="Deposit collected today" required>
                <SInput
                  v-model.number="depositAmount"
                  type="number"
                  :min="0"
                  step="0.01"
                  :max="receiptTotal"
                >
                  <template #prefix>{{ currencySymbol }}</template>
                </SInput>
              </SField>
              <p class="s-form-meta s-new-sale__num">
                Balance remaining:
                <strong class="s-new-sale__due">
                  {{ formatCurrency(Math.max(0, receiptTotal - (depositAmount || 0))) }}
                </strong>
              </p>
            </div>
          </SFormSection>
          <SFormSection>
            <SField label="Notes" hint="Optional">
              <STextarea
                v-model="receiptForm.notes"
                :rows="2"
                placeholder="Additional notes..."
              />
            </SField>
            <SField v-if="hasAnyCheckoutDiscount" label="Discount reason" required>
              <STextarea
                v-model="discountReason"
                :rows="2"
                placeholder="Why is a discount being applied to this sale?"
              />
            </SField>
          </SFormSection>

          <!-- Swap-In Section -->
          <SFormSection v-if="canUseSwapInReceipt">
            <SCheckbox v-model="isSwapIn" label="This is a swap-in transaction" />

            <div v-if="isSwapIn" class="s-form">
              <SField label="Category for swapped-in device" required>
                <div v-if="loadingFolders" class="s-new-sale__loading">
                  <SSpinner :size="20" label="Loading categories" />
                </div>
                <div v-else-if="leafFolders.length === 0" class="s-pick__empty">
                  <FolderIcon :size="20" :stroke-width="1.75" aria-hidden="true" />
                  <p>No inventory categories found</p>
                </div>
                <SSelect v-else v-model="swapInFolderId" required>
                  <option value="">Select category for swapped-in device</option>
                  <option v-for="folder in leafFolders" :key="folder.id" :value="folder.id">
                    {{ folder.name }}
                  </option>
                </SSelect>
              </SField>

              <!-- Swapped-In Device Details (aligned with inventory product form) -->
              <div v-if="swapInFolderId && swapInFolder" class="s-form">
                <h4 class="s-form-section__title">Swapped-in device details</h4>
                <div class="s-form-pair">
                  <SField
                    v-for="field in swapInDisplayFields"
                    :key="field.id || field.name"
                    :class="
                      field.type === 'boolean' || field.type === 'date' ? 's-new-sale__span' : ''
                    "
                    :label="field.type === 'boolean' ? undefined : swapInFieldLabel(field)"
                    :required="field.type !== 'boolean' && field.required"
                  >
                    <!-- Text Input -->
                    <SInput
                      v-if="field.type === 'text'"
                      v-model="swapInItemForm[field.name]"
                      :required="field.required"
                      :placeholder="swapInFieldPlaceholder(field)"
                    />
                    <!-- Number Input -->
                    <SInput
                      v-else-if="field.type === 'number'"
                      v-model.number="swapInItemForm[field.name]"
                      type="number"
                      :required="field.required"
                      :placeholder="swapInFieldPlaceholder(field)"
                    />
                    <!-- Currency Input -->
                    <SInput
                      v-else-if="field.type === 'currency'"
                      v-model.number="swapInItemForm[field.name]"
                      type="number"
                      step="0.01"
                      :min="0"
                      :required="field.required"
                      placeholder="0.00"
                    >
                      <template #prefix>{{ currencySymbol }}</template>
                    </SInput>
                    <!-- Date Input -->
                    <SInput
                      v-else-if="field.type === 'date'"
                      v-model="swapInItemForm[field.name]"
                      type="date"
                      :required="field.required"
                    />
                    <!-- Select Input -->
                    <SSelect
                      v-else-if="field.type === 'select' && field.options"
                      v-model="swapInItemForm[field.name]"
                      :required="field.required"
                    >
                      <option value="">Select {{ swapInFieldLabel(field) }}</option>
                      <option v-for="option in field.options" :key="option" :value="option">
                        {{ option }}
                      </option>
                    </SSelect>
                    <!-- Boolean Input -->
                    <SCheckbox
                      v-else-if="field.type === 'boolean'"
                      v-model="swapInItemForm[field.name]"
                      :label="swapInFieldLabel(field)"
                    />
                  </SField>
                </div>
                <p v-if="swapInDisplayFields.length === 0" class="s-form-meta">
                  No template fields defined for this folder.
                </p>
              </div>
            </div>
          </SFormSection>
          <dl class="s-new-sale__totals">
            <div class="s-new-sale__total-row">
              <dt>Products</dt>
              <dd>{{ totalSelectedQuantity }}</dd>
            </div>
            <div class="s-new-sale__total-row">
              <dt>Subtotal (items)</dt>
              <dd>{{ formatCurrency(itemsSubtotal) }}</dd>
            </div>
            <div
              v-if="isSwapIn && swapInCreditAmount > 0"
              class="s-new-sale__total-row s-new-sale__total-row--credit"
            >
              <dt>Swap credit (trade-in)</dt>
              <dd>−{{ formatCurrency(swapInCreditAmount) }}</dd>
            </div>
            <div class="s-new-sale__total-row s-new-sale__total-row--grand">
              <dt>{{ isSwapIn ? 'Amount due' : 'Total' }}</dt>
              <dd>{{ formatCurrency(receiptTotal) }}</dd>
            </div>
          </dl>
        </SForm>
      </div>
    </template>

    <template #footer>
      <div v-if="isPhone" class="s-sale-dock">
        <div class="s-sale-dock__row">
          <SButton v-if="currentStep > 0" :disabled="isCreating" @click="previousStep">
            Back
          </SButton>
          <div v-if="selectedItems.length > 0" class="s-cart-summary">
            <span class="s-cart-summary__count">
              {{ totalSelectedQuantity }} {{ totalSelectedQuantity === 1 ? 'Item' : 'Items' }}
            </span>
            <span class="s-cart-summary__total">
              <span class="s-cart-summary__label">Total</span>
              <span class="s-cart-summary__value">{{ formatCurrency(receiptTotal) }}</span>
            </span>
          </div>
          <SButton
            v-if="currentStep < 3"
            class="s-sale-dock__next"
            variant="primary"
            :disabled="receiptFooterPrimaryDisabled"
            @click="handleReceiptFooterPrimary"
          >
            {{ currentStep === 2 ? 'Review' : 'Next' }}
          </SButton>
        </div>
        <SSlideToConfirm
          v-if="currentStep === 3"
          :label="`Slide to charge ${formatCurrency(receiptTotal)}`"
          loading-label="Creating sale…"
          :disabled="!isFormValid"
          :loading="isCreating"
          @confirm="handleCreateReceipt"
        />
      </div>
      <template v-else>
        <div v-if="currentStep > 0" class="s-dialog__foot-start">
          <SButton :disabled="isCreating" @click="previousStep">Back</SButton>
        </div>
        <SDialogActions
          cancel-label="Cancel"
          :primary-label="receiptFooterPrimaryLabel"
          :primary-loading="isCreating && currentStep >= 3"
          :primary-disabled="receiptFooterPrimaryDisabled"
          @cancel="handleCancel"
          @primary="handleReceiptFooterPrimary"
        />
      </template>
    </template>
  </SDialog>

  <!-- Email Input Modal -->
  <SDialog
    :open="showEmailModal"
    @update:open="showEmailModal = $event"
    size="sm"
    title="Send receipt via email"
  >
    <template #default>
      <SForm>
        <SFormSection>
          <SField label="Email address">
            <SInput
              v-model="emailToSend"
              type="email"
              placeholder="Enter email address"
              @keyup.enter="sendReceiptEmail(lastCreatedReceiptId, lastCreatedReceiptData)"
            />
          </SField>
        </SFormSection>
      </SForm>
    </template>
    <template #footer>
      <SDialogActions
        cancel-label="Cancel"
        primary-label="Send"
        :primary-loading="isSendingEmail"
        :primary-disabled="!emailToSend || !isValidEmail(emailToSend)"
        @cancel="showEmailModal = false"
        @primary="sendReceiptEmail(lastCreatedReceiptId, lastCreatedReceiptData)"
      />
    </template>
  </SDialog>
</template>

<script setup lang="ts">
import SDialog from '~/components/s/SDialog.vue'
import SDialogActions from '~/components/s/SDialogActions.vue'
import SSlideToConfirm from '~/components/s/SSlideToConfirm.vue'
import { useHaptics } from '~/composables/useHaptics'
import { useMinWidthQuery } from '~/composables/useMinWidthQuery'
import { STAFF_DISCOUNT_LIMIT_PERCENT, useSensitiveAction } from '~/composables/useSensitiveAction'
import SField from '~/components/s/SField.vue'
import SForm from '~/components/s/SForm.vue'
import SFormSection from '~/components/s/SFormSection.vue'
import SInput from '~/components/s/SInput.vue'
import SSelect from '~/components/s/SSelect.vue'
import STextarea from '~/components/s/STextarea.vue'
import { ref, computed, watch, onMounted, useId } from 'vue'
import {
  FolderIcon,
  CubeIcon,
  CheckCircleIcon,
  CheckIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  PlusCircleIcon,
  PlusIcon,
  ArrowPathIcon,
  ChevronRightIcon,
} from '~/utils/app-icons'
import SellScreenNoteBanner from '~/components/receipts/SellScreenNoteBanner.vue'
import SBadge from '~/components/s/SBadge.vue'
import SButton from '~/components/s/SButton.vue'
import SCheckbox from '~/components/s/SCheckbox.vue'
import SIconButton from '~/components/s/SIconButton.vue'
import SSearch from '~/components/s/SSearch.vue'
import SSkeleton from '~/components/s/SSkeleton.vue'
import SSpinner from '~/components/s/SSpinner.vue'
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
} from '~/composables/useInventoryItemDisplay'
import {
  folderHasSerialNumbers,
  getSelectedFolderIds,
  groupSelectedSaleLinesByFolder,
} from '~/utils/receipt-multi-folder'
import { resolveBulkStockFieldAndValue } from '~/utils/inventory-bulk-quantity'
import type { ReceiptCreationPrefill } from '~/types/receipt-prefill'

interface Props {
  modelValue: boolean
  prefill?: ReceiptCreationPrefill | null
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
const haptics = useHaptics()
const { confirm: confirmSensitive } = useSensitiveAction()
const isAtLeastSm = useMinWidthQuery(640)
const isPhone = computed(() => !isAtLeastSm.value)
const { defaultPaymentMethod, paymentTenderOptions } = usePaymentTenders()
const {
  drawerCalloutClass,
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
} = useDashboardDrawerChrome()
const currencySymbol = computed(() => preferences.value.currencySymbol || '$')

// Swap-in is part of the sale flow, so anyone who can record a sale can take a trade-in.
const canUseSwapInReceipt = computed(
  () => userStore.isSuperAdmin || userStore.userData?.role === 'staff'
)

const isSendingEmail = ref(false)
const showEmailModal = ref(false)
const emailToSend = ref('')
const lastCreatedReceiptId = ref('')
const lastCreatedReceiptData = ref<any>(null)

const steps = [
  { id: 'parent', label: 'Category' },
  { id: 'subcategory', label: 'Subcategory' },
  { id: 'items', label: 'Products' },
  { id: 'details', label: 'Checkout' },
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
  selectLeafCategory,
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
const selectedItems = ref<
  Array<{
    id: string
    quantity: number
    item: InventoryItem
    discountAmount?: number
    showDiscountInput?: boolean
  }>
>([])
const discountReason = ref('')
const hasAnyCheckoutDiscount = computed(() =>
  selectedItems.value.some((si) => (si.discountAmount || 0) > 0)
)
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
  paymentMethod: defaultPaymentMethod.value,
  notes: '',
})

const prefillItemMatchFailed = ref(false)

/** paid_in_full = normal sale; balance_due = deposit now, stock held until paid off */
const paymentSettlement = ref<'paid_in_full' | 'balance_due'>('paid_in_full')
const depositAmount = ref(0)

const settlementLabelId = `new-sale-settlement-${useId()}`

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

const receiptFooterPrimaryLabel = computed(() => {
  if (currentStep.value < 3) return 'Next'
  return isCreating.value ? 'Creating…' : 'Create sale'
})

const receiptFooterPrimaryDisabled = computed(() => {
  if (currentStep.value < 3) return !canProceed.value
  return !isFormValid.value || isCreating.value
})

function handleReceiptFooterPrimary() {
  if (currentStep.value < 3) nextStep()
  else void handleCreateReceipt()
}

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

  if (hasAnyCheckoutDiscount.value && !discountReason.value.trim()) return false

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

async function applyReceiptCreationPrefill(prefill: ReceiptCreationPrefill) {
  prefillItemMatchFailed.value = false

  if (prefill.customerName) receiptForm.value.customerName = prefill.customerName
  if (prefill.customerPhone) receiptForm.value.customerPhone = prefill.customerPhone
  if (prefill.customerEmail) receiptForm.value.customerEmail = prefill.customerEmail
  if (prefill.notes) receiptForm.value.notes = prefill.notes

  const itemId = prefill.inventoryItemId?.trim()
  if (itemId) {
    if (prefill.itemSearchQuery) itemSearchQuery.value = prefill.itemSearchQuery

    const item = await inventoryStore.fetchInventoryItemById(itemId)
    if (item && !item.dateOut && !item.pendingSaleReceiptId) {
      let folder = inventoryStore.getFolderById(item.folderId)
      if (!folder) {
        folder = (await inventoryStore.fetchFolder(item.folderId)) ?? undefined
      }
      if (folder) {
        selectLeafCategory(folder)
        await loadItems()

        const match =
          availableItems.value.find((row) => row.id === itemId) ?? item
        if (match && !match.dateOut && !match.pendingSaleReceiptId) {
          toggleItemSelection(match, true)
          if (!receiptForm.value.paymentMethod) {
            receiptForm.value.paymentMethod = defaultPaymentMethod.value
          }
          currentStep.value = 3
          return
        }
      }
    }
    prefillItemMatchFailed.value = true
  }

  const searchQuery = prefill.itemSearchQuery?.trim()
  if (!searchQuery) return

  itemSearchQuery.value = searchQuery

  const { resolveLeadProductInventoryMatch } = await import(
    '~/composables/leads/resolveLeadProductInventoryMatch'
  )
  const resolved = await resolveLeadProductInventoryMatch(searchQuery)
  if (!resolved) {
    prefillItemMatchFailed.value = true
    return
  }

  selectLeafCategory(resolved.folder)
  await loadItems()

  const match =
    availableItems.value.find((row) => row.id === resolved.item.id) ?? resolved.item
  toggleItemSelection(match, true)
  if (!receiptForm.value.paymentMethod) {
    receiptForm.value.paymentMethod = defaultPaymentMethod.value
  }
  currentStep.value = 3
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
      await loadFolders()
      await loadCustomers()
      if (props.prefill) {
        await applyReceiptCreationPrefill(props.prefill)
      }
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
        void haptics.impact('light')
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
      void haptics.impact('light')
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

const toggleItemDiscountInput = (itemId: string) => {
  const selected = selectedItems.value.find((si) => si.id === itemId)
  if (selected) selected.showDiscountInput = true
}

const setItemDiscountAmount = (itemId: string, amount: number) => {
  const selected = selectedItems.value.find((si) => si.id === itemId)
  if (selected) selected.discountAmount = amount > 0 ? amount : undefined
}

const clearItemDiscount = (itemId: string) => {
  const selected = selectedItems.value.find((si) => si.id === itemId)
  if (selected) {
    selected.discountAmount = undefined
    selected.showDiscountInput = false
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

/** Sum of sold line items (after per-item discounts, including any checkout-time discount) before swap credit */
const calculateItemsSubtotal = () => {
  return selectedItems.value.reduce((total, si) => {
    const price = Math.max(0, getEffectivePrice(si.item) - (si.discountAmount || 0))
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
// getItemDisplayName, getItemField from useInventoryItemDisplay

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
  prefillItemMatchFailed.value = false
  receiptForm.value = {
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    customerAddress: '',
    paymentMethod: defaultPaymentMethod.value,
    notes: '',
  }
  paymentSettlement.value = 'paid_in_full'
  depositAmount.value = 0
  discountReason.value = ''
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

/** True when any checkout discount exceeds the staff limit for its line. */
const exceedsStaffDiscountLimit = () =>
  selectedItems.value.some((si) => {
    const discount = si.discountAmount || 0
    const unitPrice = getEffectivePrice(si.item)
    return (
      discount > 0 && unitPrice > 0 && (discount / unitPrice) * 100 > STAFF_DISCOUNT_LIMIT_PERCENT
    )
  })

const handleCreateReceipt = async () => {
  if (!isFormValid.value || selectedItems.value.length === 0 || isCreating.value) return

  isCreating.value = true
  if (exceedsStaffDiscountLimit() && !(await confirmSensitive('discount'))) {
    isCreating.value = false
    return
  }

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
      const checkoutDiscount = si.discountAmount || 0
      const inventoryHasDiscount =
        si.item.discountedPrice !== undefined && si.item.discountedPrice !== null
      // A checkout-time discount and a pre-existing inventory discount are mutually exclusive
      // for metadata; final unit price always applies checkout discount on top of effective price.
      const finalPrice = Math.max(0, getEffectivePrice(si.item) - checkoutDiscount)
      const originalPrice = getOriginalPrice(si.item)
      const hasDiscount = inventoryHasDiscount || checkoutDiscount > 0
      const discountAmount = checkoutDiscount > 0 ? checkoutDiscount : si.item.discountAmount
      const discountPercentage =
        checkoutDiscount > 0 && originalPrice > 0
          ? Math.round((checkoutDiscount / originalPrice) * 100)
          : si.item.discountPercentage

      const itemQuantity = lineSerial ? 1 : si.quantity

      return {
        itemId: si.id,
        folderId: si.item.folderId,
        quantity: itemQuantity,
        price: finalPrice, // Final price after discount
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
          discountPercentage,
          discountAmount,
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

    if (hasAnyCheckoutDiscount.value) {
      receiptData.discountReason = discountReason.value.trim()
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
        await inventoryStore.linkSwapInReceipt(swapInFolderId.value, swapInItemId, receiptId)
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

    void haptics.notify('success')
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
