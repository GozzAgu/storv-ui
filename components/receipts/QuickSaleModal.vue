<template>
  <SDialog
    placement="right"
    :open="modelValue"
    title="Quick sale"
    size="md"
    :dismissible="!isProcessing"
    @update:open="(value: boolean) => emit('update:modelValue', value)"
  >
    <div class="s-form s-qs">
      <p v-if="isPlanViewOnly" class="s-notice">{{ PLAN_VIEW_ONLY_SALE_NOTICE }}</p>
      <SellScreenNoteBanner />

      <!-- Folder Selection -->
      <section class="s-qs__group" aria-label="Category">
        <div class="s-qs__group-head">
          <p :class="sectionLabelClass">Category</p>
          <SButton
            v-if="selectedFolder && !folderPickerExpanded"
            variant="ghost"
            size="sm"
            @click="openCategoryPicker"
          >
            Change
          </SButton>
        </div>

        <div
          v-if="selectedFolder && !folderPickerExpanded"
          :class="[pickRowSelectedClass, 's-qs__selected']"
        >
          <span :class="folderTileClass(selectedFolder.color)" aria-hidden="true">
            <FolderIcon :size="16" :stroke-width="1.75" />
          </span>
          <div class="s-qs__row-main">
            <p :class="pickRowTitleClass">{{ selectedFolderLabel }}</p>
            <p :class="pickRowMetaClass">{{ folderPickerMeta(selectedFolder) }}</p>
          </div>
        </div>

        <template v-else>
          <div v-if="showSubcategoryList && selectedParentFolder">
            <SButton variant="ghost" size="sm" @click="goBackToParentCategories">
              <template #leading>
                <ChevronLeftIcon :size="16" :stroke-width="2" aria-hidden="true" />
              </template>
              {{ selectedParentFolder.name }}
            </SButton>
          </div>

          <SSearch
            v-model="folderPickerSearch"
            :placeholder="showSubcategoryList ? 'Search subcategories…' : 'Search categories…'"
          />

          <div :class="pickListClass">
            <div :class="[pickListScrollClass, 's-qs__scroll']">
              <template v-if="showSubcategoryList">
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
                  <span :class="folderTileClass(folder.color)" aria-hidden="true">
                    <FolderIcon :size="16" :stroke-width="1.75" />
                  </span>
                  <span class="s-qs__row-main">
                    <span :class="pickRowTitleClass">{{ folder.name }}</span>
                    <span :class="pickRowMetaClass">{{ folderPickerMeta(folder) }}</span>
                  </span>
                  <CheckIcon
                    v-if="isSubcategoryRowSelected(folder)"
                    class="s-qs__row-check"
                    :size="16"
                    :stroke-width="2"
                    aria-hidden="true"
                  />
                </button>
                <div v-if="subcategoryFolders.length === 0" :class="emptyStateClass">
                  <p>No subcategories found</p>
                </div>
              </template>
              <template v-else>
                <button
                  v-for="row in parentCategoryRows"
                  :key="`${row.depth}-${row.folder.id}`"
                  type="button"
                  :class="[
                    pickRowClass,
                    isParentRowSelected(row.folder) ? pickRowSelectedClass : '',
                    row.depth === 1 ? 's-qs__row--nested' : '',
                  ]"
                  :aria-pressed="isParentRowSelected(row.folder)"
                  @click="onParentCategoryPick(row)"
                >
                  <span :class="folderTileClass(row.folder.color)" aria-hidden="true">
                    <FolderIcon :size="16" :stroke-width="1.75" />
                  </span>
                  <span class="s-qs__row-main">
                    <span :class="pickRowTitleClass">
                      {{ row.folder.name }}
                      <span v-if="row.depth === 1 && row.parentName" class="s-qs__row-parent">
                        · {{ row.parentName }}
                      </span>
                    </span>
                    <span :class="pickRowMetaClass">{{ folderPickerMeta(row.folder) }}</span>
                  </span>
                  <ChevronRightIcon
                    v-if="isCategoryHub(row.folder) && !isParentRowSelected(row.folder)"
                    class="s-qs__row-chevron"
                    :size="16"
                    :stroke-width="2"
                    aria-hidden="true"
                  />
                  <CheckIcon
                    v-if="!isCategoryHub(row.folder) && isParentRowSelected(row.folder)"
                    class="s-qs__row-check"
                    :size="16"
                    :stroke-width="2"
                    aria-hidden="true"
                  />
                </button>
                <div v-if="parentCategoryRows.length === 0" :class="emptyStateClass">
                  <FolderIcon :size="24" :stroke-width="1.5" aria-hidden="true" />
                  <p>No categories found</p>
                </div>
              </template>
            </div>
          </div>
        </template>
      </section>

      <!-- Barcode scan / search (after category is picked) -->
      <section
        v-if="selectedFolder && !folderPickerExpanded"
        class="s-qs-scan"
        aria-label="Scan or search"
      >
        <div class="s-qs-scan__head">
          <span class="s-qs-scan__icon" aria-hidden="true">
            <QrCodeIcon :size="20" :stroke-width="1.75" />
          </span>
          <div class="s-qs__row-main">
            <p :class="sectionLabelClass">Scan or search</p>
            <p class="s-form-meta">Barcode, SKU, or serial in {{ selectedFolder.name }}</p>
          </div>
          <SButton
            size="sm"
            :variant="isScanning ? 'danger' : 'primary'"
            :aria-pressed="isScanning"
            @click="toggleScanner"
          >
            <template #leading>
              <XMarkIcon v-if="isScanning" :size="16" :stroke-width="2" aria-hidden="true" />
              <QrCodeIcon v-else :size="16" :stroke-width="2" aria-hidden="true" />
            </template>
            {{ isScanning ? 'Stop' : 'Scan' }}
          </SButton>
        </div>

        <div v-if="isScanning" class="s-qs-scan__camera-wrap">
          <div ref="scannerContainer" id="scanner-container" class="s-qs-scan__camera">
            <div v-if="!scannerReady" class="s-qs-scan__loading">
              <SSpinner :size="24" label="Starting camera" />
              <p>Initializing camera…</p>
            </div>
          </div>
          <p class="s-form-meta s-qs-scan__tip">Point camera at barcode or QR code</p>
        </div>

        <div class="s-inline-field">
          <div class="s-inline-field__grow">
            <SInput
              v-model="manualBarcode"
              placeholder="Enter barcode, SKU, or serial…"
              aria-label="Barcode, SKU, or serial"
              @keyup.enter="searchByBarcode"
            />
          </div>
          <SButton :loading="isSearching" @click="searchByBarcode">Search</SButton>
        </div>
      </section>

      <!-- Products in selected subfolder -->
      <section
        v-if="selectedFolder && !folderPickerExpanded"
        class="s-qs__group"
        aria-label="Products"
      >
        <p :class="sectionLabelClass">Products · {{ selectedFolder.name }}</p>
        <SSearch v-model="itemSearchQuery" placeholder="Search products…" />

        <div v-if="loadingFolderItems" :class="pickListClass" aria-busy="true">
          <div :class="[pickListScrollClass, 's-qs__scroll']">
            <div v-for="i in 5" :key="i" :class="pickRowClass">
              <div class="s-qs__row-main s-qs__skeleton">
                <SSkeleton width="60%" height="14px" />
                <SSkeleton width="40%" height="12px" />
              </div>
              <SSkeleton width="3.5rem" height="14px" />
            </div>
          </div>
        </div>
        <div v-else-if="availableFolderItems.length === 0" :class="emptyStateClass">
          <p>{{ itemSearchQuery ? 'No products found' : 'No products in this category' }}</p>
        </div>
        <div v-else :class="pickListClass">
          <div :class="[pickListScrollClass, 's-qs__scroll']">
            <button
              v-for="item in availableFolderItems"
              :key="item.id"
              type="button"
              :class="[pickRowClass, isItemInCart(item.id) ? pickRowSelectedClass : '']"
              :disabled="!canAddItemToCart(item)"
              @click="onPickFolderItem(item)"
            >
              <span class="s-qs__row-main">
                <span :class="pickRowTitleClass">{{ getItemDisplayName(item) }}</span>
                <span :class="[pickRowMetaClass, 's-qs__num']">
                  <span v-if="getItemBarcodeLabel(item)">{{ getItemBarcodeLabel(item) }} · </span>
                  <span v-if="getItemField(item, 'sku')"
                    >SKU: {{ getItemField(item, 'sku') }} ·
                  </span>
                  <span v-if="!hasSaleUnitPrice(item)">No price</span>
                  <span v-else-if="getItemPriceLabel(item)">{{ getItemPriceLabel(item) }}</span>
                  <span
                    v-if="!selectedFolder?.hasSerialNumbers && getItemStockLabel(item) !== null"
                  >
                    · Stock: {{ getItemStockLabel(item) }}
                  </span>
                </span>
              </span>
              <SBadge v-if="isItemInCart(item.id)">In cart</SBadge>
              <PlusIcon
                v-if="canAddItemToCart(item)"
                class="s-qs__row-add"
                :size="16"
                :stroke-width="2"
                aria-hidden="true"
              />
            </button>
          </div>
        </div>
      </section>

      <!-- Selected Items -->
      <section class="s-qs__block" aria-labelledby="quick-sale-cart-title">
        <h3 id="quick-sale-cart-title" class="s-form-section__title">Selected items</h3>
        <SEmptyState
          v-if="cartItems.length === 0"
          class="s-qs-cart__empty"
          title="Your cart is empty"
          description="Pick a category, then scan or tap a product"
        >
          <template #icon>
            <ShoppingBagIcon :size="20" :stroke-width="1.75" />
          </template>
        </SEmptyState>
        <ul v-else class="s-qs-cart">
          <li v-for="(item, index) in cartItems" :key="index" class="s-qs-line">
            <div class="s-qs-line__row">
              <div class="s-qs__row-main">
                <p class="s-qs-line__name">{{ item.name }}</p>
                <p class="s-qs-line__meta">
                  Qty: {{ item.quantity }} ×
                  <span v-if="(item.discountAmount || 0) > 0">
                    <s class="s-qs-line__was">{{ formatCurrency(item.price) }}</s>
                    {{ formatCurrency(Math.max(0, item.price - (item.discountAmount || 0))) }}
                  </span>
                  <span v-else>{{ formatCurrency(item.price) }}</span>
                </p>
              </div>
              <div class="s-qs-stepper">
                <SIconButton
                  label="Decrease quantity"
                  variant="secondary"
                  @click="updateQuantity(index, item.quantity - 1)"
                >
                  <MinusIcon :size="16" :stroke-width="2" aria-hidden="true" />
                </SIconButton>
                <span class="s-qs-stepper__value" aria-live="polite">{{ item.quantity }}</span>
                <SIconButton
                  label="Increase quantity"
                  variant="secondary"
                  @click="updateQuantity(index, item.quantity + 1)"
                >
                  <PlusIcon :size="16" :stroke-width="2" aria-hidden="true" />
                </SIconButton>
              </div>
              <SIconButton
                :label="`Remove ${item.name}`"
                class="s-qs-line__remove"
                @click="removeItem(index)"
              >
                <TrashIcon :size="16" :stroke-width="2" aria-hidden="true" />
              </SIconButton>
            </div>
            <button
              v-if="!item.showDiscountInput && !(item.discountAmount && item.discountAmount > 0)"
              type="button"
              class="s-link s-qs-line__link"
              @click="item.showDiscountInput = true"
            >
              Add discount
            </button>
            <div v-else class="s-qs-line__discount">
              <label :for="`quick-sale-discount-${index}`" class="s-field__label">Discount</label>
              <div class="s-qs-line__discount-input">
                <SInput
                  :id="`quick-sale-discount-${index}`"
                  v-model="item.discountAmount"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                >
                  <template #prefix>{{ currencySymbol }}</template>
                </SInput>
              </div>
              <SButton variant="ghost" size="sm" @click="clearCartItemDiscount(item)">
                Remove
              </SButton>
            </div>
          </li>
        </ul>
        <SField v-if="hasAnyDiscount" label="Discount reason" required>
          <STextarea
            v-model="discountReason"
            :rows="2"
            placeholder="Why is a discount being applied to this sale?"
          />
        </SField>
      </section>

      <!-- Customer Info (Collapsible) -->
      <section class="s-qs__block">
        <button
          type="button"
          class="s-qs-disclosure"
          :aria-expanded="showCustomerInfo"
          aria-controls="quick-sale-customer"
          @click="showCustomerInfo = !showCustomerInfo"
        >
          <span>Customer info <span class="s-field__optional">Optional</span></span>
          <ChevronDownIcon
            :class="[
              's-qs-disclosure__chevron',
              showCustomerInfo ? 's-qs-disclosure__chevron--open' : '',
            ]"
            :size="16"
            :stroke-width="2"
            aria-hidden="true"
          />
        </button>
        <div v-if="showCustomerInfo" id="quick-sale-customer" class="s-form">
          <SField label="Customer name">
            <div class="s-pop-anchor">
              <SInput
                v-model="customerName"
                placeholder="Walk-in customer"
                autocomplete="off"
                @input="customerSuggestField = 'name'"
                @blur="customerSuggestField = null"
              />
              <CustomerSuggestions
                v-if="customerSuggestField === 'name'"
                :customers="matchingCustomers"
                @pick="selectCustomer"
              />
            </div>
          </SField>
          <SField label="Phone" hint="Optional">
            <div class="s-pop-anchor">
              <SInput
                v-model="customerPhone"
                type="tel"
                autocomplete="off"
                @input="customerSuggestField = 'phone'"
                @blur="customerSuggestField = null"
              />
              <CustomerSuggestions
                v-if="customerSuggestField === 'phone'"
                :customers="matchingCustomers"
                @pick="selectCustomer"
              />
            </div>
          </SField>
        </div>
      </section>

      <!-- Commission (Collapsible, admin/owner only) -->
      <section v-if="canManageCommissions" class="s-qs__block">
        <button
          type="button"
          class="s-qs-disclosure"
          :aria-expanded="showCommission"
          aria-controls="quick-sale-commission"
          @click="showCommission = !showCommission"
        >
          <span>Commission <span class="s-field__optional">Optional</span></span>
          <ChevronDownIcon
            :class="[
              's-qs-disclosure__chevron',
              showCommission ? 's-qs-disclosure__chevron--open' : '',
            ]"
            :size="16"
            :stroke-width="2"
            aria-hidden="true"
          />
        </button>
        <div v-if="showCommission" id="quick-sale-commission" class="s-form">
          <SField label="Commission amount" hint="Folded into the total the customer pays.">
            <SInput v-model="commissionAmount" type="number" min="0" step="0.01" placeholder="0.00">
              <template #prefix>{{ currencySymbol }}</template>
            </SInput>
          </SField>
          <SField label="Owed to" hint="Who this commission is owed to.">
            <SInput v-model="commissionOwedToName" placeholder="e.g. referral agent's name" />
          </SField>
          <SField v-if="commissionEligibleStaff.length" label="Attribute to staff" hint="Optional">
            <SSelect v-model="commissionOwedToUid">
              <option value="">None</option>
              <option v-for="s in commissionEligibleStaff" :key="s.id" :value="s.authUid">
                {{ s.firstName }} {{ s.lastName }}
              </option>
            </SSelect>
          </SField>
        </div>
      </section>

      <!-- Payment -->
      <section class="s-qs__block" aria-labelledby="quick-sale-payment-title">
        <div class="s-qs__group-head">
          <div class="s-qs__row-main">
            <h3 id="quick-sale-payment-title" class="s-form-section__title">Payment</h3>
            <p class="s-form-meta">From your checkout methods in Settings</p>
          </div>
          <SCheckbox v-model="useSplitPayment" variant="switch" label="Split payment" />
        </div>

        <div
          v-if="!useSplitPayment"
          class="s-qs-tenders"
          role="group"
          aria-labelledby="quick-sale-payment-title"
        >
          <button
            v-for="method in paymentTenderOptions"
            :key="method"
            type="button"
            class="s-qs-tender"
            :aria-pressed="paymentMethod === method"
            @click="paymentMethod = method"
          >
            {{ method }}
          </button>
        </div>

        <div v-else class="s-qs-split">
          <div v-for="(payment, index) in splitPayments" :key="index" class="s-qs-split__line">
            <div class="s-control s-control--select s-qs-split__method">
              <PaymentMethodSelect
                v-model="payment.method"
                select-class="s-control__input"
                placeholder="Method"
                :aria-label="`Payment line ${index + 1} method`"
              />
              <ChevronDownIcon
                class="s-control__chevron"
                :size="16"
                :stroke-width="1.75"
                aria-hidden="true"
              />
            </div>
            <div class="s-qs-split__amount">
              <SInput
                v-model="payment.amount"
                type="number"
                step="0.01"
                min="0"
                :max="cartTotal - splitPaymentsTotal + payment.amount"
                placeholder="0.00"
                :aria-label="`Payment line ${index + 1} amount`"
              >
                <template #prefix>{{ currencySymbol }}</template>
              </SInput>
            </div>
            <SIconButton
              v-if="splitPayments.length > 1"
              :label="`Remove payment line ${index + 1}`"
              @click="removeSplitPayment(index)"
            >
              <XMarkIcon :size="16" :stroke-width="2" aria-hidden="true" />
            </SIconButton>
          </div>
          <SButton block @click="addSplitPayment">
            <template #leading>
              <PlusIcon :size="16" :stroke-width="2" aria-hidden="true" />
            </template>
            Add payment line
          </SButton>
          <div
            :class="['s-qs-balance', `s-qs-balance--${splitPaymentBalanceUi.tone}`]"
            role="status"
          >
            <div class="s-qs-balance__row">
              <span class="s-qs-balance__label">Balance</span>
              <div class="s-qs-balance__value">
                <p class="s-qs-balance__headline">{{ splitPaymentBalanceUi.headline }}</p>
                <p class="s-qs-balance__sub">{{ splitPaymentBalanceUi.sub }}</p>
              </div>
            </div>
            <p class="s-qs-balance__foot">
              Allocated {{ formatCurrency(splitPaymentsTotal) }} of
              {{ formatCurrency(cartTotal) }}
            </p>
          </div>
        </div>
      </section>

      <!-- Total -->
      <div class="s-qs-summary">
        <span class="s-qs-summary__label">Total</span>
        <span class="s-qs-summary__value">{{ formatCurrency(cartTotal) }}</span>
      </div>
    </div>

    <template #footer>
      <SDialogActions
        :primary-label="`Complete sale (${formatCurrency(cartTotal)})`"
        :primary-loading="isProcessing"
        :primary-disabled="!canCompleteQuickSale"
        @cancel="handleCancel"
        @primary="completeSale"
      />
    </template>
  </SDialog>

  <ApprovalPinDialog
    v-model:open="approvalOpen"
    :reason="approvalReason"
    :error="approvalError"
    :busy="isProcessing"
    @approve="submitQuickSale"
  />
</template>

<script setup lang="ts">
import SDialog from '~/components/s/SDialog.vue'
import SDialogActions from '~/components/s/SDialogActions.vue'
import SField from '~/components/s/SField.vue'
import SInput from '~/components/s/SInput.vue'
import SSelect from '~/components/s/SSelect.vue'
import STextarea from '~/components/s/STextarea.vue'
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import {
  XMarkIcon,
  QrCodeIcon,
  ShoppingBagIcon,
  MinusIcon,
  PlusIcon,
  TrashIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  FolderIcon,
  CheckIcon,
} from '~/utils/app-icons'
import SellScreenNoteBanner from '~/components/receipts/SellScreenNoteBanner.vue'
import PaymentMethodSelect from '~/components/receipts/PaymentMethodSelect.vue'
import CustomerSuggestions from '~/components/receipts/CustomerSuggestions.vue'
import SBadge from '~/components/s/SBadge.vue'
import SButton from '~/components/s/SButton.vue'
import SCheckbox from '~/components/s/SCheckbox.vue'
import SEmptyState from '~/components/s/SEmptyState.vue'
import SIconButton from '~/components/s/SIconButton.vue'
import SSearch from '~/components/s/SSearch.vue'
import SSkeleton from '~/components/s/SSkeleton.vue'
import SSpinner from '~/components/s/SSpinner.vue'
import { useInventoryStore, type InventoryFolder, type InventoryItem } from '~/stores/inventory'
import { useSellerLoanOutsStore } from '~/stores/sellerLoanOuts'
import { useReceiptsStore } from '~/stores/receipts'
import { useStoresStore } from '~/stores/stores'
import { useCustomersStore } from '~/stores/customers'
import {
  buildCustomerOptions,
  suggestCustomers,
  type CustomerSuggestField,
} from '~/utils/customer-suggest'
import { useAuthStore } from '~/stores/auth'
import { useUserStore } from '~/stores/user'
import { useStaffStore } from '~/stores/staff'
import { usePermissions } from '~/composables/usePermissions'
import { usePreferences } from '~/composables/usePreferences'
import { useAppToast } from '~/composables/useAppToast'
import { getReceiptProductDetails } from '~/composables/useReceiptProductDetails'
import { resolveBulkStockFieldAndValue } from '~/utils/inventory-bulk-quantity'
import { PLAN_VIEW_ONLY_SALE_NOTICE } from '~/utils/plan-access'
import { usePlanViewOnly } from '~/composables/usePlanViewOnly'
import { buildSaleTenders } from '~/utils/payments-v2-tenders'
import { useReceiptCategoryPicker } from '~/composables/useReceiptCategoryPicker'
import { useDashboardDrawerChrome } from '~/composables/useDashboardDrawerChrome'
import {
  getInventoryItemDisplayName as getItemDisplayName,
  getInventoryItemField as getItemField,
} from '~/composables/useInventoryItemDisplay'
import type { InventoryFolderDisplayRow } from '~/utils/inventory-folder-tree'
import { isItemOnPartnerLoan } from '~/utils/inventory-availability'
import { hasSaleUnitPrice, NO_PRICE_SALE_MESSAGE } from '~/utils/inventory-item-price'
import ApprovalPinDialog from '~/components/receipts/ApprovalPinDialog.vue'
import { useSalesApi, toSaleApiError, type SaleApproval } from '~/composables/useSalesApi'
import { discountNeedsApproval } from '~/utils/sale-pricing'
import { isDemoModeActive } from '~/utils/demo-mode'
import { newSaleId } from '~/utils/sales-outbox'
import { invalidateFolderItemCaches } from '~/utils/inventory-items-firestore'

interface Props {
  modelValue: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'sale-completed': []
}>()

const inventoryStore = useInventoryStore()
const sellerLoanOutsStore = useSellerLoanOutsStore()
const receiptsStore = useReceiptsStore()
const paymentsV2 = usePaymentsV2()
const storesStore = useStoresStore()
const customersStore = useCustomersStore()
const authStore = useAuthStore()
const userStore = useUserStore()
const staffStore = useStaffStore()
const { formatCurrency, preferences } = usePreferences()

const currencySymbol = computed(() => preferences.value?.currencySymbol || '$')
const {
  success: showSuccessToast,
  error: showErrorToast,
  warning: showWarningToast,
} = useAppToast()

const {
  sectionLabelClass,
  pickListClass,
  pickListScrollClass,
  pickRowClass,
  pickRowSelectedClass,
  pickRowTitleClass,
  pickRowMetaClass,
  emptyStateClass,
} = useDashboardDrawerChrome()

const FOLDER_TONES: Record<string, string> = {
  blue: 'info',
  green: 'success',
  purple: 'accent',
  indigo: 'accent',
  orange: 'warning',
  yellow: 'warning',
  red: 'error',
  pink: 'error',
}

function folderTileClass(color: string): string {
  return `s-qs-folder s-qs-folder--${FOLDER_TONES[color] ?? 'neutral'}`
}

const {
  selectedParentFolder,
  selectedFolder,
  folderSearchQuery,
  subcategorySearchQuery,
  parentCategoryRows,
  subcategoryFolders,
  isCategoryHub,
  folderPickerMeta,
  isParentRowSelected,
  isSubcategoryRowSelected,
  onParentCategoryRowClick,
  onSubcategoryClick,
  selectLeafCategory,
  resetCategoryPicker,
} = useReceiptCategoryPicker()

const folderPickerExpanded = ref(true)

const showSubcategoryList = computed(() => {
  const parent = selectedParentFolder.value
  return parent !== null && isCategoryHub(parent) && !selectedFolder.value
})

const folderPickerSearch = computed({
  get: () => (showSubcategoryList.value ? subcategorySearchQuery.value : folderSearchQuery.value),
  set: (value: string) => {
    if (showSubcategoryList.value) {
      subcategorySearchQuery.value = value
    } else {
      folderSearchQuery.value = value
    }
  },
})

const selectedFolderId = computed(() => selectedFolder.value?.id ?? '')

const selectedFolderLabel = computed(() => {
  const folder = selectedFolder.value
  if (!folder) return ''
  const parent = selectedParentFolder.value
  return parent && parent.id !== folder.id ? `${folder.name} · ${parent.name}` : folder.name
})

function handleCancel() {
  if (isProcessing.value) return
  stopScanner()
  emit('update:modelValue', false)
}

function clearCartItemDiscount(item: { discountAmount?: number; showDiscountInput?: boolean }) {
  item.discountAmount = undefined
  item.showDiscountInput = false
}

function openCategoryPicker() {
  stopScanner()
  folderPickerExpanded.value = true
  if (!selectedFolder.value) return
  const parent = selectedParentFolder.value
  if (parent && isCategoryHub(parent) && parent.id !== selectedFolder.value.id) {
    selectedFolder.value = null
    return
  }
  selectedFolder.value = null
  selectedParentFolder.value = null
  folderItems.value = []
  itemSearchQuery.value = ''
}

function goBackToParentCategories() {
  selectedParentFolder.value = null
  subcategorySearchQuery.value = ''
}

async function onParentCategoryPick(row: InventoryFolderDisplayRow) {
  onParentCategoryRowClick(row)
  if (selectedFolder.value && !isCategoryHub(selectedFolder.value)) {
    folderPickerExpanded.value = false
    await loadFolderItems()
  }
}

async function onSubcategoryPick(folder: InventoryFolder) {
  onSubcategoryClick(folder)
  folderPickerExpanded.value = false
  await loadFolderItems()
}

const isScanning = ref(false)
const scannerReady = ref(false)
const scannerContainer = ref<HTMLElement | null>(null)
const manualBarcode = ref('')
const isSearching = ref(false)
const folderItems = ref<InventoryItem[]>([])
const loadingFolderItems = ref(false)
const itemSearchQuery = ref('')
const cartItems = ref<
  Array<{
    id: string
    name: string
    price: number
    quantity: number
    item: InventoryItem
    discountAmount?: number
    showDiscountInput?: boolean
  }>
>([])
const showCustomerInfo = ref(false)
const customerName = ref('')
const customerPhone = ref('')
const customerSuggestField = ref<CustomerSuggestField | null>(null)
const matchingCustomers = computed(() => {
  const field = customerSuggestField.value
  if (!field || field === 'email') return []
  const query = field === 'name' ? customerName.value : customerPhone.value
  return suggestCustomers(customerOptions.value, field, query)
})
const customerOptions = computed(() =>
  buildCustomerOptions(customersStore.customers, receiptsStore.receipts)
)

const selectCustomer = (customer: { name: string; phone?: string }) => {
  customerName.value = customer.name
  if (customer.phone) customerPhone.value = customer.phone
  customerSuggestField.value = null
}

watch(showCustomerInfo, async (open) => {
  if (!open) return
  if (userStore.userData?.role === 'staff') {
    await staffStore.fetchCurrentStaffMember().catch(() => {})
  }
  const results = await Promise.allSettled([
    customersStore.customers.length === 0 ? customersStore.fetchCustomers() : Promise.resolve(),
    receiptsStore.receipts.length === 0 ? receiptsStore.fetchReceipts() : Promise.resolve(),
  ])
  for (const result of results) {
    if (result.status === 'rejected') console.error('Error loading customers:', result.reason)
  }
})
const discountReason = ref('')
const hasAnyDiscount = computed(() => cartItems.value.some((ci) => (ci.discountAmount || 0) > 0))
const { canManageCommissions, isStoreOwner, isAdmin, canEditReceipts } = usePermissions()
const salesApi = useSalesApi()
const canApproveSales = computed(() => isStoreOwner.value || isAdmin.value || canEditReceipts.value)
const approvalOpen = ref(false)
const approvalReason = ref('')
const approvalError = ref<string | null>(null)
/** Kept across approval retries and offline queueing so one sale is recorded once. */
const pendingSaleId = ref<string | null>(null)
const showCommission = ref(false)
const commissionAmount = ref<number | undefined>(undefined)
const commissionOwedToName = ref('')
const commissionOwedToUid = ref('')
const { paymentTenderOptions, defaultPaymentMethod } = usePaymentTenders()
const paymentMethod = ref(defaultPaymentMethod.value)
const useSplitPayment = ref(false)
const splitPayments = ref<Array<{ method: string; amount: number }>>([{ method: '', amount: 0 }])
const isProcessing = ref(false)

watch(
  paymentTenderOptions,
  (opts) => {
    if (!opts.length) return
    if (!opts.includes(paymentMethod.value)) {
      paymentMethod.value = opts[0]!
    }
  },
  { immediate: true }
)

let html5QrCode: any = null

const cartTotal = computed(() => {
  return cartItems.value.reduce(
    (total, item) => total + Math.max(0, item.price - (item.discountAmount || 0)) * item.quantity,
    0
  )
})

const splitPaymentsTotal = computed(() =>
  splitPayments.value.reduce((sum, p) => sum + (p.amount || 0), 0)
)

const SPLIT_PAY_EPS = 0.01
const splitPaymentRemaining = computed(() => {
  const left = cartTotal.value - splitPaymentsTotal.value
  return Math.round(left * 100) / 100
})

const splitPaymentBalanceUi = computed(() => {
  const rem = splitPaymentRemaining.value
  if (Math.abs(rem) < SPLIT_PAY_EPS) {
    return { tone: 'ok' as const, headline: 'Balanced', sub: 'Payment lines match the sale total.' }
  }
  if (rem > 0) {
    return {
      tone: 'short' as const,
      headline: `${formatCurrency(rem)} left`,
      sub: `Enter the rest so the sum equals ${formatCurrency(cartTotal.value)}.`,
    }
  }
  return {
    tone: 'over' as const,
    headline: `Over by ${formatCurrency(Math.abs(rem))}`,
    sub: 'Adjust amounts so the split total matches the sale.',
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

const { isViewOnly: isPlanViewOnly } = usePlanViewOnly()

const canCompleteQuickSale = computed(() => {
  if (isPlanViewOnly.value) return false
  if (cartItems.value.length === 0 || !selectedFolderId.value) return false
  if (hasAnyDiscount.value && !discountReason.value.trim()) return false
  if (useSplitPayment.value) {
    if (splitPayments.value.length === 0) return false
    if (splitPayments.value.some((p) => !p.method || p.amount <= 0)) return false
    return Math.abs(splitPaymentRemaining.value) < SPLIT_PAY_EPS
  }
  return !!paymentMethod.value
})

/** Staff eligible to be attributed a commission payout (has an auth uid, so they're a real login-capable member). */
const commissionEligibleStaff = computed(() =>
  staffStore.staff.filter((s) => !!s.authUid && s.status === 'active')
)

const toggleScanner = async () => {
  if (isScanning.value) {
    stopScanner()
  } else {
    await startScanner()
  }
}

const startScanner = async () => {
  isScanning.value = true
  scannerReady.value = false
  await nextTick()

  if (!scannerContainer.value) {
    isScanning.value = false
    showErrorToast('Could not open scanner')
    return
  }

  try {
    const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import('html5-qrcode')
    const containerId = scannerContainer.value.id || 'scanner-container'
    html5QrCode = new Html5Qrcode(containerId)

    const config = {
      fps: 10,
      qrbox: { width: 250, height: 250 },
      aspectRatio: 1.0,
      formatsToSupport: [
        Html5QrcodeSupportedFormats.QR_CODE,
        Html5QrcodeSupportedFormats.EAN_13,
        Html5QrcodeSupportedFormats.EAN_8,
        Html5QrcodeSupportedFormats.UPC_A,
        Html5QrcodeSupportedFormats.UPC_E,
        Html5QrcodeSupportedFormats.CODE_128,
        Html5QrcodeSupportedFormats.CODE_39,
      ],
    }

    await html5QrCode.start({ facingMode: 'environment' }, config, onScanSuccess, onScanError)

    scannerReady.value = true
  } catch (error: any) {
    console.error('Scanner error:', error)
    showErrorToast('Failed to start camera. Please check permissions.')
    isScanning.value = false
    scannerReady.value = false
  }
}

const stopScanner = async () => {
  if (html5QrCode) {
    try {
      await html5QrCode.stop()
      await html5QrCode.clear()
      html5QrCode = null
    } catch (error) {
      console.error('Error stopping scanner:', error)
    }
  }
  isScanning.value = false
  scannerReady.value = false
}

const onScanSuccess = (decodedText: string) => {
  manualBarcode.value = decodedText
  searchByBarcode()
  // Optionally stop scanner after successful scan
  // stopScanner()
}

const onScanError = (errorMessage: string) => {
  // Ignore continuous scan errors
}

const loadFolderItems = async (): Promise<InventoryItem[]> => {
  if (!selectedFolderId.value) {
    folderItems.value = []
    return []
  }
  loadingFolderItems.value = true
  try {
    const items = await inventoryStore.fetchItemsAllChunked(selectedFolderId.value)
    folderItems.value = items
    return items
  } catch (error: any) {
    showErrorToast('Failed to load folder items')
    folderItems.value = []
    return []
  } finally {
    loadingFolderItems.value = false
  }
}

const availableFolderItems = computed(() => {
  let items = folderItems.value.filter(
    (item) => !item.dateOut && !item.pendingSaleReceiptId && !isItemOnPartnerLoan(item)
  )
  const query = itemSearchQuery.value.trim().toLowerCase()
  if (!query) return items
  return items.filter((item) => {
    const name = getItemDisplayName(item).toLowerCase()
    const sku = getItemField(item, 'sku').toLowerCase()
    const barcode = getItemField(item, 'barcode').toLowerCase()
    const serial =
      getItemField(item, 'serialNo').toLowerCase() ||
      getItemField(item, 'serialNumber').toLowerCase()
    return (
      name.includes(query) ||
      sku.includes(query) ||
      barcode.includes(query) ||
      serial.includes(query)
    )
  })
})

function getItemStockLabel(item: InventoryItem): number | null {
  const folder = selectedFolder.value
  if (!folder || folder.hasSerialNumbers) return null
  const stock = resolveBulkStockFieldAndValue(item as Record<string, unknown>, folder)
  return stock?.value ?? null
}

function getItemPriceLabel(item: InventoryItem): string {
  const price = parseFloat(getItemField(item, 'price') || '0')
  return formatCurrency(price)
}

function getItemBarcodeLabel(item: InventoryItem): string | null {
  const barcode = getItemField(item, 'barcode').trim()
  return barcode ? `Barcode: ${barcode}` : null
}

function isItemInCart(itemId: string): boolean {
  return cartItems.value.some((ci) => ci.id === itemId)
}

function canAddItemToCart(item: InventoryItem): boolean {
  const folder = selectedFolder.value
  if (!folder) return false
  if (isItemOnPartnerLoan(item)) return false
  if (folder.hasSerialNumbers) {
    if (item.dateOut || item.pendingSaleReceiptId) return false
    return !isItemInCart(item.id)
  }
  const stock = resolveBulkStockFieldAndValue(item as Record<string, unknown>, folder)
  const onHand = stock?.value ?? 0
  if (onHand <= 0) return false
  const inCart = cartItems.value.find((ci) => ci.id === item.id)
  return !inCart || inCart.quantity < onHand
}

function addItemToCart(foundItem: InventoryItem): boolean {
  const folder = selectedFolder.value
  if (!folder) return false

  if (isItemOnPartnerLoan(foundItem)) {
    showErrorToast('This product is lent to a partner')
    return false
  }

  const existingIndex = cartItems.value.findIndex((ci) => ci.id === foundItem.id)
  if (existingIndex >= 0 && cartItems.value[existingIndex]) {
    if (folder.hasSerialNumbers) return false
    const stock = resolveBulkStockFieldAndValue(foundItem as Record<string, unknown>, folder)
    const maxQty = stock?.value ?? 0
    if (cartItems.value[existingIndex].quantity + 1 > maxQty) {
      showWarningToast('Not enough stock')
      return false
    }
    cartItems.value[existingIndex].quantity++
    return true
  }

  if (folder.hasSerialNumbers) {
    if (foundItem.dateOut) {
      showErrorToast('This product has already been sold')
      return false
    }
    if (foundItem.pendingSaleReceiptId) {
      showErrorToast('This product is reserved on an outstanding order')
      return false
    }
  } else {
    const stock = resolveBulkStockFieldAndValue(foundItem as Record<string, unknown>, folder)
    const onHand = stock?.value ?? 0
    if (onHand <= 0) {
      showErrorToast('This product is out of stock')
      return false
    }
  }

  if (!hasSaleUnitPrice(foundItem)) {
    showErrorToast(NO_PRICE_SALE_MESSAGE)
    return false
  }

  const price = parseFloat(String((foundItem as any).price || (foundItem as any).Price || '0'))
  const name =
    String((foundItem as any).name || (foundItem as any).itemName || '').trim() ||
    getItemDisplayName(foundItem)

  cartItems.value.push({
    id: foundItem.id,
    name,
    price,
    quantity: 1,
    item: foundItem,
  })
  return true
}

async function onPickFolderItem(item: InventoryItem) {
  if (!canAddItemToCart(item)) return
  if (addItemToCart(item)) {
    showSuccessToast('Product added to cart')
  }
}

const searchByBarcode = async () => {
  if (!manualBarcode.value.trim() || !selectedFolderId.value) {
    showWarningToast('Please select a folder and enter a barcode')
    return
  }

  isSearching.value = true
  try {
    const folder = selectedFolder.value
    if (!folder) return

    const items = await loadFolderItems()

    // Search for item by barcode, SKU, or serial number
    const foundItem: InventoryItem | undefined = items.find((item: InventoryItem) => {
      const query = manualBarcode.value.trim().toLowerCase()
      const barcode = String((item as any).barcode || '').toLowerCase()
      const sku = String((item as any).sku || '').toLowerCase()
      const serial = String(
        (item as any).serialNo || (item as any).serialNumber || ''
      ).toLowerCase()
      return barcode === query || sku === query || serial === query
    })

    if (!foundItem) {
      showWarningToast('Product not found')
      manualBarcode.value = ''
      return
    }

    if (addItemToCart(foundItem)) {
      manualBarcode.value = ''
      showSuccessToast('Product added to cart')
    } else {
      manualBarcode.value = ''
    }
  } catch (error: any) {
    showErrorToast('Error searching for product')
  } finally {
    isSearching.value = false
  }
}

const updateQuantity = (index: number, newQuantity: number) => {
  if (newQuantity <= 0) {
    removeItem(index)
    return
  }
  if (cartItems.value[index]) {
    cartItems.value[index].quantity = newQuantity
  }
}

const removeItem = (index: number) => {
  cartItems.value.splice(index, 1)
}

const completeSale = async () => {
  if (!canCompleteQuickSale.value || isProcessing.value) return
  if (isDemoModeActive()) return completeSaleLocally()

  const needsApproval = cartItems.value.some((ci) =>
    discountNeedsApproval(ci.price, ci.discountAmount || 0)
  )
  if (needsApproval && !canApproveSales.value) {
    if (navigator.onLine === false) {
      showErrorToast('A sale that needs manager approval needs an internet connection.')
      return
    }
    approvalReason.value =
      'This sale has a discount above 10%. A manager must approve it with their PIN.'
    approvalError.value = null
    approvalOpen.value = true
    return
  }
  await submitQuickSale()
}

/** Sends the sale to the server (or queues it offline); `approval` comes from the PIN dialog. */
async function submitQuickSale(approval?: SaleApproval) {
  if (isProcessing.value) return
  isProcessing.value = true
  approvalError.value = null
  try {
    pendingSaleId.value ??= newSaleId()
    const commission = canManageCommissions.value ? commissionAmount.value || 0 : 0
    const units = cartItems.value.reduce((n, ci) => n + ci.quantity, 0)
    const outcome = await salesApi.createSale(
      {
        saleId: pendingSaleId.value,
        source: 'quick_sale',
        lines: cartItems.value.map((ci) => ({
          itemId: ci.id,
          quantity: selectedFolder.value?.hasSerialNumbers ? 1 : ci.quantity,
          discountAmount: ci.discountAmount || 0,
        })),
        customer: { name: customerName.value, phone: customerPhone.value },
        payment: {
          method: paymentMethod.value || 'Cash',
          ...(useSplitPayment.value &&
            splitPayments.value.length > 0 && {
              split: splitPayments.value.map((p) => ({ method: p.method, amount: p.amount })),
            }),
        },
        ...(hasAnyDiscount.value && { discountReason: discountReason.value.trim() }),
        ...(commission > 0 && {
          commission: {
            amount: commission,
            owedToName: commissionOwedToName.value.trim() || undefined,
            owedToUid: commissionOwedToUid.value || undefined,
          },
        }),
      },
      {
        approval,
        summary: `${units} item${units === 1 ? '' : 's'} · ${formatCurrency(
          cartTotal.value + commission
        )}`,
        clientTotal: Math.round((cartTotal.value + commission) * 100) / 100,
      }
    )
    approvalOpen.value = false

    if (outcome.status === 'queued') {
      showWarningToast(
        'No connection. The sale is saved on this device and will be recorded when you are back online.'
      )
    } else {
      const receipt = receiptsStore.addRecordedSale(outcome.result.receipt)
      if (outcome.result.paymentWarning) showWarningToast(outcome.result.paymentWarning)
      for (const folderId of receipt.folderIds ?? []) {
        invalidateFolderItemCaches(folderId)
        delete inventoryStore.items[folderId]
      }
      void sellerLoanOutsStore.refreshAfterSale().catch(() => {})
      showSuccessToast('Sale completed successfully!')
    }
    pendingSaleId.value = null
    resetForm()
    emit('update:modelValue', false)
    emit('sale-completed')
  } catch (err) {
    const error = toSaleApiError(err)
    if (error.code === 'APPROVAL_REQUIRED') {
      approvalReason.value = error.message
      approvalOpen.value = true
    } else if (approvalOpen.value) {
      approvalError.value = error.message
    } else {
      showErrorToast(error.message || 'Failed to complete sale')
    }
  } finally {
    isProcessing.value = false
  }
}

/** Demo mode: the sale is recorded on this device only. */
const completeSaleLocally = async () => {
  isProcessing.value = true
  // Everything the receipt needs is read now: the awaits below can be slow on a bad connection,
  // and the form must not change what this sale records while they run.
  const cart = cartItems.value.map((ci) => ({ ...ci }))
  const sale = {
    customerName: customerName.value,
    customerPhone: customerPhone.value,
    paymentMethod: paymentMethod.value,
    useSplitPayment: useSplitPayment.value,
    splitPayments: splitPayments.value.map((p) => ({ method: p.method, amount: p.amount })),
    itemsCount: cart.reduce((sum, ci) => sum + ci.quantity, 0),
    cartTotal: cartTotal.value,
    commission: canManageCommissions.value ? commissionAmount.value || 0 : 0,
    commissionOwedToName: commissionOwedToName.value.trim(),
    commissionOwedToUid: commissionOwedToUid.value,
    discountReason: hasAnyDiscount.value ? discountReason.value.trim() : '',
    folderId: selectedFolderId.value,
    hasSerialNumbers: selectedFolder.value?.hasSerialNumbers ?? false,
  }
  try {
    const receiptNumber = `REC-${Date.now().toString().slice(-6)}`

    const receiptItems = cart.map((ci) => {
      const discountAmount = ci.discountAmount || 0
      const hasDiscount = discountAmount > 0
      return {
        itemId: ci.id,
        quantity: ci.quantity,
        price: hasDiscount ? Math.max(0, ci.price - discountAmount) : ci.price,
        itemName: ci.name,
        serialNo: String((ci.item as any).serialNo || (ci.item as any).serialNumber || ''),
        brand: String((ci.item as any).brand || ''),
        model: String((ci.item as any).model || ''),
        sku: String((ci.item as any).sku || ''),
        productDetails: getReceiptProductDetails(ci.item),
        ...(hasDiscount && {
          originalPrice: ci.price,
          discountAmount,
          discountPercentage: Math.round((discountAmount / ci.price) * 100),
          hasDiscount: true,
        }),
      }
    })

    const itemIds = cart.map((ci) => ci.id)
    const hasSerialNumbers = sale.hasSerialNumbers

    if (sale.folderId && itemIds.length > 0) {
      const saleLines = cart.map((ci) => ({
        itemId: ci.id,
        quantitySold: hasSerialNumbers ? 1 : ci.quantity,
      }))
      await inventoryStore.applyReceiptSaleToInventory(sale.folderId, saleLines, {
        hasSerialNumbers,
      })
      await sellerLoanOutsStore.refreshAfterSale().catch(() => {})
    }

    // Get current store and user information
    const currentStore = storesStore.currentStore
    const currentStoreId = storesStore.currentStoreId
    if (!currentStoreId) {
      showErrorToast('No store selected. Please select a store first.')
      isProcessing.value = false
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

    const v2 = (await paymentsV2.loadAccess()).enabled

    // Create receipt
    const receiptData: any = {
      receiptNumber,
      customerName: sale.customerName || 'Walk-in Customer',
      customerEmail: '',
      customerPhone: sale.customerPhone || '',
      date: new Date(),
      items: receiptItems,
      itemsCount: sale.itemsCount,
      total: sale.cartTotal + sale.commission,
      paymentMethod: sale.useSplitPayment ? 'Split Payment' : sale.paymentMethod || 'Cash',
      status: 'completed' as const,
      notes: 'Quick Sale',
      folderId: sale.folderId || '',
      itemIds,
      storeId: currentStoreId, // Store ID where receipt was created
      storeBranchName, // Store branch name
      storeLogoUrl: storesStore.currentStore?.logoUrl || userStore.userData?.storeLogoUrl || '', // Account logo - empty string if none (Firestore rejects undefined)
      createdByUserName, // User who created the receipt
    }
    if (v2) receiptData.paymentsV2 = true

    if (sale.discountReason) {
      receiptData.discountReason = sale.discountReason
    }

    if (sale.commission > 0) {
      receiptData.commissionAmount = sale.commission
      receiptData.commissionOwedToName = sale.commissionOwedToName || undefined
      receiptData.commissionOwedToUid = sale.commissionOwedToUid || undefined
      receiptData.commissionStatus = 'owed'
    }

    if (sale.useSplitPayment && sale.splitPayments.length > 0) {
      receiptData.splitPayments = sale.splitPayments
    }

    const receiptId = await receiptsStore.createReceipt(receiptData)

    if (v2) {
      await paymentsV2.recordSaleTenders(
        receiptId,
        buildSaleTenders({
          total: receiptData.total,
          isBalanceDue: false,
          deposit: 0,
          method: sale.paymentMethod || 'Cash',
          split: sale.useSplitPayment ? sale.splitPayments : undefined,
        })
      )
    }

    showSuccessToast('Sale completed successfully!')
    resetForm()
    emit('update:modelValue', false)
    emit('sale-completed')
  } catch (error: any) {
    showErrorToast(error.message || 'Failed to complete sale')
  } finally {
    isProcessing.value = false
  }
}

const resetForm = () => {
  cartItems.value = []
  customerName.value = ''
  customerPhone.value = ''
  discountReason.value = ''
  showCommission.value = false
  commissionAmount.value = undefined
  commissionOwedToName.value = ''
  commissionOwedToUid.value = ''
  paymentMethod.value = defaultPaymentMethod.value
  useSplitPayment.value = false
  splitPayments.value = [{ method: '', amount: 0 }]
  manualBarcode.value = ''
  resetCategoryPicker()
  folderPickerExpanded.value = true
  folderItems.value = []
  itemSearchQuery.value = ''
  showCustomerInfo.value = false
  stopScanner()
}

watch(
  () => props.modelValue,
  async (isOpen) => {
    if (isOpen) {
      await inventoryStore.fetchFolders()
      const leaf = inventoryStore.leafFolders
      if (leaf.length === 1 && leaf[0]) {
        selectLeafCategory(leaf[0])
        folderPickerExpanded.value = false
        await loadFolderItems()
      } else {
        folderPickerExpanded.value = true
      }
    } else {
      resetForm()
    }
  }
)

onMounted(() => {
  inventoryStore.fetchFolders()
})

onUnmounted(() => {
  stopScanner()
})
</script>

<style scoped>
#scanner-container {
  width: 100%;
  height: 100%;
}
</style>
