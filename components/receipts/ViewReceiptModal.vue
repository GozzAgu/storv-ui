<template>
  <Modal
    :model-value="props.modelValue"
    @update:model-value="(value: boolean) => emit('update:modelValue', value)"
    size="xl"
    :close-on-backdrop="!isPrinting"
    :show-close="!isPrinting"
    content-padding="p-0"
  >
    <template #header>
      <div class="flex items-center justify-between w-full gap-4">
        <div class="flex items-center gap-2 min-w-0">
          <h3 class="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
            {{ receipt?.receiptNumber }}
          </h3>
          <button
            v-if="receipt"
            @click="copyReceiptNumber(receipt.receiptNumber)"
            class="p-1.5 rounded-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex-shrink-0"
          >
            <ClipboardDocumentIcon class="w-4 h-4" stroke-width="1.5" />
          </button>
        </div>
        <div class="flex items-center gap-1.5 flex-shrink-0">
          <button
            type="button"
            @click="handleEmailClick"
            :disabled="!receipt"
            class="px-3 py-1.5 rounded-sm bg-white dark:!bg-dashboard-card text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5 text-xs font-medium"
          >
            <EnvelopeIcon class="w-4 h-4" stroke-width="1.5" />
            <span>Email</span>
          </button>
          <button
            type="button"
            @click="handlePrintPDF"
            :disabled="isPrinting || !receipt"
            class="px-3 py-1.5 rounded-sm bg-white dark:!bg-dashboard-card text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5 text-xs font-medium"
          >
            <PrinterIcon class="w-4 h-4" stroke-width="1.5" />
            <span>{{ isPrinting ? 'Generating...' : 'Print' }}</span>
          </button>
        </div>
      </div>
    </template>

    <div v-if="!receipt" class="text-center py-12">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400"></div>
      <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">Loading receipt...</p>
    </div>

    <div v-else class="max-h-[calc(100vh-12rem)] overflow-y-auto p-4 sm:p-6">
      <!-- Receipt Content (used for PDF) -->
      <div
        ref="receiptContent"
        class="receipt-content bg-white text-gray-900 rounded-lg overflow-hidden max-w-2xl mx-auto shadow-sm border border-gray-200"
      >
        <!-- Store header -->
        <div class="receipt-header text-center px-6 pt-6 pb-4 border-b-2 border-gray-900/90">
          <div v-if="storeLogoUrl" class="mb-2 flex justify-center">
            <img
              :src="storeLogoUrl"
              alt="Store logo"
              class="receipt-logo h-16 w-16 sm:h-20 sm:w-20 rounded-sm object-contain"
            />
          </div>
          <h1 class="receipt-display-title text-gray-900">{{ businessName }}</h1>
          <p v-if="branchName" class="mt-1 text-[11px] leading-snug text-gray-600">
            {{ branchName }}
          </p>
          <p v-if="storePhone || storeEmail" class="mt-1 text-[10px] leading-snug text-gray-500">
            <span v-if="storePhone">{{ storePhone }}</span
            ><span v-if="storePhone && storeEmail"> · </span
            ><span v-if="storeEmail">{{ storeEmail }}</span>
          </p>
        </div>

        <!-- Meta block -->
        <div class="receipt-section px-6 py-4 border-b border-gray-100">
          <div class="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
            <div>
              <p class="receipt-section-label text-gray-500">Receipt</p>
              <p class="mt-1 text-[13px] font-medium leading-tight text-gray-900">
                {{ receipt.receiptNumber }}
                <span v-if="receipt.isSwapIn" class="font-normal text-gray-500"> · Swap-in</span>
              </p>
            </div>
            <div class="text-right">
              <p class="receipt-section-label text-gray-500">Date & time</p>
              <p class="mt-1 text-[12px] leading-tight text-gray-900">
                {{ formatReceiptDate(receipt.date) }}
              </p>
              <p class="text-[10px] text-gray-500">{{ formatReceiptTime(receipt.date) }}</p>
            </div>
          </div>
          <div class="mt-3 border-t border-gray-100 pt-3">
            <p class="receipt-section-label text-gray-500">Customer</p>
            <p class="mt-1 text-[13px] font-medium leading-tight text-gray-900">
              {{ receipt.customerName }}
            </p>
            <p v-if="receipt.customerEmail" class="mt-1 text-[10px] leading-snug text-gray-500">
              {{ receipt.customerEmail }}
            </p>
          </div>
        </div>

        <!-- Items -->
        <div class="receipt-section px-6 py-4 border-b border-gray-100">
          <p class="receipt-section-label mb-2 text-gray-500">Items</p>
          <div class="receipt-items-table-wrap -mx-1 overflow-x-auto px-1">
          <table class="w-full min-w-[20rem]">
            <thead class="bg-gray-100">
              <tr class="border-b-2 border-gray-300">
                <th class="receipt-section-label py-2.5 text-left text-gray-700">Product</th>
                <th class="receipt-section-label w-12 py-2.5 text-center text-gray-700">Qty</th>
                <th class="receipt-section-label py-2.5 text-right text-gray-700">Price</th>
                <th
                  v-if="canViewProfitAndCost"
                  class="receipt-section-label py-2.5 text-right text-gray-700"
                >
                  Cost
                </th>
                <th class="receipt-section-label py-2.5 text-right text-gray-700">Total</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(item, index) in receipt.items"
                :key="index"
                class="border-b border-gray-100/90"
              >
                <td class="py-2.5 align-top">
                  <p class="text-[12px] font-medium leading-tight text-gray-900">
                    {{ item.itemName }}
                  </p>
                  <div v-if="receiptItemDetailLines(item).length > 0" class="mt-0.5 space-y-px">
                    <p
                      v-for="(line, detailIndex) in receiptItemDetailLines(item)"
                      :key="`${index}-detail-${detailIndex}`"
                      class="text-[10px] leading-snug text-gray-500"
                    >
                      {{ line }}
                    </p>
                  </div>
                  <p v-if="item.hasDiscount" class="mt-1 text-[10px] text-gray-500">
                    {{
                      item.discountPercentage
                        ? `${item.discountPercentage}% off`
                        : `-${formatCurrency(item.discountAmount || 0)}`
                    }}
                  </p>
                </td>
                <td class="py-2.5 text-center text-[12px] tabular-nums text-gray-700">
                  {{ item.quantity }}
                </td>
                <td class="py-2.5 text-right text-[12px] tabular-nums text-gray-700">
                  <template v-if="item.hasDiscount && item.originalPrice">
                    <span class="block text-[10px] leading-tight text-gray-400 line-through">{{
                      formatCurrency(item.originalPrice)
                    }}</span>
                    <span class="leading-tight">{{ formatCurrency(item.price) }}</span>
                  </template>
                  <span v-else>{{ formatCurrency(item.price) }}</span>
                </td>
                <td
                  v-if="canViewProfitAndCost"
                  class="py-2.5 text-right text-[12px] tabular-nums text-gray-700"
                >
                  <span v-if="receiptLineUnitCost(item) > 0">
                    {{ formatCurrency(receiptLineUnitCost(item)) }}
                  </span>
                  <span v-else class="text-gray-400">-</span>
                </td>
                <td class="py-2.5 text-right text-[12px] font-medium tabular-nums text-gray-900">
                  <template v-if="item.hasDiscount && item.originalPrice">
                    <span
                      class="block text-[10px] font-normal leading-tight text-gray-400 line-through"
                      >{{ formatCurrency((item.originalPrice || 0) * item.quantity) }}</span
                    >
                    <span class="leading-tight">{{
                      formatCurrency(item.price * item.quantity)
                    }}</span>
                  </template>
                  <span v-else>{{ formatCurrency(item.price * item.quantity) }}</span>
                </td>
              </tr>
            </tbody>
          </table>
          </div>
        </div>

        <!-- Totals -->
        <div class="receipt-section px-6 py-4 border-b border-gray-100">
          <div class="flex justify-end">
            <div class="w-56 space-y-1">
              <template v-if="hasAnyDiscount">
                <div class="flex justify-between text-[12px] leading-tight">
                  <span class="text-gray-500">Subtotal</span>
                  <span>{{ formatCurrency(calculateSubtotalBeforeDiscount) }}</span>
                </div>
                <div class="flex justify-between text-[12px] leading-tight">
                  <span class="text-gray-500">Discount</span>
                  <span class="text-gray-600">-{{ formatCurrency(calculateTotalDiscount) }}</span>
                </div>
              </template>
              <template v-else>
                <div class="flex justify-between text-[12px] leading-tight">
                  <span class="text-gray-500">Subtotal</span>
                  <span>{{ formatCurrency(lineItemsNetTotal) }}</span>
                </div>
              </template>
              <template v-if="showSwapCreditLine">
                <div class="flex justify-between text-[12px] leading-tight">
                  <span class="text-gray-500">Swap credit (trade-in)</span>
                  <span class="text-gray-600">-{{ formatCurrency(swapCreditAmount) }}</span>
                </div>
              </template>
              <template v-if="canViewProfitAndCost && receipt.status === 'completed'">
                <div class="flex justify-between text-[12px] leading-tight">
                  <span class="text-gray-500">Cost of goods sold</span>
                  <span>{{ formatCurrency(receiptCogs) }}</span>
                </div>
                <div class="flex justify-between text-[12px] leading-tight">
                  <span class="text-gray-500">Gross profit</span>
                  <span
                    :class="
                      receiptGrossProfitAmount >= 0
                        ? 'text-emerald-700 dark:text-emerald-400/90'
                        : 'text-gray-900'
                    "
                  >
                    {{ formatCurrency(receiptGrossProfitAmount) }}
                  </span>
                </div>
              </template>
              <div
                v-if="canManageCommissions && (receipt.commissionAmount || 0) > 0"
                class="space-y-1 border-t border-gray-200 pt-2 text-[12px] leading-tight"
              >
                <div class="flex justify-between">
                  <span class="text-gray-500">Commission</span>
                  <span>{{ formatCurrency(receipt.commissionAmount || 0) }}</span>
                </div>
                <div v-if="receipt.commissionOwedToName" class="flex justify-between">
                  <span class="text-gray-500">Owed to</span>
                  <span class="text-gray-900">{{ receipt.commissionOwedToName }}</span>
                </div>
                <div class="flex items-center justify-between">
                  <span
                    class="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium"
                    :class="
                      receipt.commissionStatus === 'paid'
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-amber-50 text-amber-700'
                    "
                  >
                    {{ receipt.commissionStatus === 'paid' ? 'Paid' : 'Owed' }}
                  </span>
                  <button
                    v-if="receipt.commissionStatus !== 'paid'"
                    type="button"
                    class="text-[11px] font-medium text-primary-700 hover:underline disabled:opacity-50"
                    :disabled="isMarkingCommissionPaid"
                    @click="markCommissionAsPaid"
                  >
                    Mark as paid
                  </button>
                </div>
              </div>
              <div
                v-if="receipt.splitPayments?.length"
                class="space-y-1 border-t border-gray-200 pt-2 text-[12px] leading-tight"
              >
                <span class="text-gray-500">Payment</span>
                <div
                  v-for="(sp, spIdx) in receipt.splitPayments"
                  :key="spIdx"
                  class="flex justify-between gap-2"
                >
                  <span class="capitalize text-gray-600">{{ sp.method }}</span>
                  <span class="tabular-nums text-gray-900">{{ formatCurrency(sp.amount) }}</span>
                </div>
              </div>
              <div
                v-else
                class="flex justify-between border-t border-gray-200 pt-2 text-[12px] leading-tight"
              >
                <span class="text-gray-500">Payment</span>
                <span class="capitalize text-gray-900">{{ receipt.paymentMethod }}</span>
              </div>
              <div
                class="-mx-3 mt-1 flex justify-between rounded-sm bg-gray-900 px-3 py-2 text-[13px] font-semibold leading-tight text-white"
              >
                <span>{{ receiptTotalLabel }}</span>
                <span>{{ formatCurrency(receipt.total) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Status -->
        <div class="px-6 py-3">
          <span
            class="inline-flex items-center rounded px-2 py-1 text-[10px] font-medium"
            :class="receiptStatusPillClass"
          >
            {{ receipt.status.charAt(0).toUpperCase() + receipt.status.slice(1) }}
          </span>
        </div>

        <!-- Notes -->
        <div v-if="receipt.notes" class="px-6 pb-3">
          <p class="receipt-section-label mb-1 text-gray-500">Notes</p>
          <p class="whitespace-pre-wrap text-[12px] leading-snug text-gray-700">
            {{ receipt.notes }}
          </p>
        </div>

        <!-- Swap-in (trade-in device added to inventory) -->
        <div v-if="receipt.isSwapIn" class="px-6 pb-3">
          <p class="receipt-section-label mb-1 text-gray-500">Swap-in</p>
          <p v-if="swapInFolderName" class="text-[10px] text-gray-500 mb-1.5">
            Folder: {{ swapInFolderName }}
          </p>
          <template v-if="swapInItemLoading">
            <p class="text-[12px] leading-snug text-gray-500">Loading trade-in details…</p>
          </template>
          <template v-else-if="swapInItemError">
            <p class="text-[12px] leading-snug text-amber-800 dark:text-amber-300/90">
              {{ swapInItemError }}
            </p>
          </template>
          <template v-else-if="swapInPrimaryLabel">
            <p class="text-[12px] font-medium leading-snug text-gray-900">
              {{ swapInPrimaryLabel }}
            </p>
            <div v-if="swapInDetailLines.length > 0" class="mt-0.5 space-y-px">
              <p
                v-for="(line, i) in swapInDetailLines"
                :key="`swap-in-detail-${i}`"
                class="text-[10px] leading-snug text-gray-500"
              >
                {{ line }}
              </p>
            </div>
          </template>
          <template v-else-if="swapInFolderName">
            <p class="text-[12px] leading-snug text-gray-700">
              Device added to {{ swapInFolderName }}
            </p>
          </template>
          <template v-else-if="receipt.swapInItemId">
            <p class="text-[12px] leading-snug text-gray-500">
              Trade-in recorded; details unavailable.
            </p>
          </template>
        </div>

        <!-- Branch & generated by -->
        <div
          v-if="receipt.createdByUserName"
          class="border-t border-gray-100 px-6 py-3 text-[10px] leading-snug text-gray-500"
        >
          <span>Generated by {{ receipt.createdByUserName }}</span>
        </div>

        <!-- Account policies (set on Profile: Receipt terms & policies) -->
        <div
          v-if="hasReceiptPolicyContent"
          class="border-t border-gray-100 px-6 py-4 space-y-3 text-left receipt-policies"
        >
          <div v-if="receiptPolicies.salesTerms">
            <p class="receipt-section-label mb-1 text-gray-500">Terms & conditions (sales)</p>
            <p class="whitespace-pre-wrap text-[10px] leading-snug text-gray-600">
              {{ receiptPolicies.salesTerms }}
            </p>
          </div>
          <div v-if="receiptPolicies.refundPolicy">
            <p class="receipt-section-label mb-1 text-gray-500">Refund policy</p>
            <p class="whitespace-pre-wrap text-[10px] leading-snug text-gray-600">
              {{ receiptPolicies.refundPolicy }}
            </p>
          </div>
          <div v-if="receiptPolicies.warrantyPolicy">
            <p class="receipt-section-label mb-1 text-gray-500">Warranty policy</p>
            <p class="whitespace-pre-wrap text-[10px] leading-snug text-gray-600">
              {{ receiptPolicies.warrantyPolicy }}
            </p>
          </div>
        </div>

        <!-- Footer -->
        <div class="border-t border-gray-100 bg-gray-50 px-6 py-3 text-center">
          <p class="text-[12px] leading-tight text-gray-700">Thank you for your business</p>
          <p class="mt-1 text-[10px] text-gray-500">
            Computer-generated receipt · Generated by storvv
          </p>
        </div>
      </div>
    </div>
  </Modal>

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
            @keyup.enter="handleSendEmail"
          />
        </div>
      </div>
    </template>
    <template #footer>
      <IosDrawerActions
        primary-label="Send"
        :primary-loading="isSendingEmail"
        :primary-disabled="!emailToSend || !isValidEmail(emailToSend)"
        @cancel="showEmailModal = false"
        @primary="handleSendEmail"
      />
    </template>
  </Modal>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted, nextTick, shallowRef } from 'vue'
import {
  PrinterIcon,
  EnvelopeIcon,
  ClipboardDocumentIcon,
} from '~/utils/app-icons'
import Modal from '~/components/ui/Modal.vue'
import IosDrawerActions from '~/components/ios/IosDrawerActions.vue'
import { useReceiptsStore, type Receipt, type ReceiptItem } from '~/stores/receipts'
import type { InventoryItem } from '~/stores/inventory'
import { useUserStore } from '~/stores/user'
import { useAuthStore } from '~/stores/auth'
import { useInventoryStore } from '~/stores/inventory'
import { usePreferences } from '~/composables/usePreferences'
import { useCopy } from '~/composables/useCopy'
import {
  getProductDetailLines,
  getInventoryItemDetailLines,
} from '~/composables/useReceiptProductDetails'
import { getInventoryItemDisplayName } from '~/composables/useInventoryItemDisplay'
import { useAppToast } from '~/composables/useAppToast'
import { useProductAnalytics } from '~/composables/useProductAnalytics'
import { useUser } from '~/composables/useUser'
import { getQueryUserId } from '~/composables/useFirestorePaths'
import { setReceiptPdfFont } from '~/utils/receipt-pdf-font'
import { useReceiptPaperHeader } from '~/composables/useReceiptPaperHeader'
import { usePermissions } from '~/composables/usePermissions'
import { useAuthenticatedFetch } from '~/composables/useAuthenticatedFetch'
import { fetchProxiedImageDataUrl } from '~/utils/proxy-image-fetch'
import {
  receiptGrossProfit,
  receiptLineCogs,
  resolveReceiptLineUnitCost,
} from '~/utils/inventory-item-cost'

interface Props {
  modelValue: boolean
  receipt: Receipt | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const receiptContent = ref<HTMLElement | null>(null)
const isCapturingPdf = ref(false)
const isPrinting = ref(false)
const isSendingEmail = ref(false)
const showEmailModal = ref(false)
const emailToSend = ref('')
const { copyToClipboard } = useCopy()
const toast = useAppToast()
const { trackEvent } = useProductAnalytics()
const { authFetch } = useAuthenticatedFetch()

const copyReceiptNumber = (receiptNumber: string) => {
  copyToClipboard(receiptNumber, 'Receipt number')
}
const userStore = useUserStore()
const { canViewProfitAndCost, canManageCommissions } = usePermissions()
const { getUserDocument } = useUser()
const receiptsStore = useReceiptsStore()
const isMarkingCommissionPaid = ref(false)
const markCommissionAsPaid = async () => {
  if (!props.receipt || isMarkingCommissionPaid.value) return
  isMarkingCommissionPaid.value = true
  try {
    await receiptsStore.markCommissionPaid(props.receipt.id)
    if (props.receipt) {
      props.receipt.commissionStatus = 'paid'
    }
    toast.success('Commission marked as paid')
  } catch (error: any) {
    toast.error(error?.message || 'Failed to update commission status')
  } finally {
    isMarkingCommissionPaid.value = false
  }
}

const receiptPolicies = reactive({
  salesTerms: '',
  refundPolicy: '',
  warrantyPolicy: '',
})

const hasReceiptPolicyContent = computed(
  () =>
    !!(receiptPolicies.salesTerms || receiptPolicies.refundPolicy || receiptPolicies.warrantyPolicy)
)

async function loadReceiptPoliciesForView() {
  receiptPolicies.salesTerms = ''
  receiptPolicies.refundPolicy = ''
  receiptPolicies.warrantyPolicy = ''
  try {
    const ownerId = await getQueryUserId()
    if (!ownerId) return
    const ud = await getUserDocument(ownerId)
    const r = ud?.storeDetails?.settings?.receipt
    receiptPolicies.salesTerms = (r?.salesTerms || '').trim()
    receiptPolicies.refundPolicy = (r?.refundPolicy || '').trim()
    receiptPolicies.warrantyPolicy = (r?.warrantyPolicy || '').trim()
  } catch (e) {
    console.warn('[ViewReceiptModal] Could not load receipt policies:', e)
  }
}
const inventoryStore = useInventoryStore()
const { formatCurrency } = usePreferences()

function lookupInventoryItemForReceipt(itemId: string): InventoryItem | null {
  for (const list of Object.values(inventoryStore.items)) {
    const hit = list.find((i) => i.id === itemId)
    if (hit) return hit
  }
  return null
}

function receiptLineUnitCost(line: ReceiptItem): number {
  return resolveReceiptLineUnitCost(line, lookupInventoryItemForReceipt(line.itemId))
}

const receiptCogs = computed(() => {
  if (!props.receipt || !canViewProfitAndCost.value) return 0
  return receiptLineCogs(props.receipt, lookupInventoryItemForReceipt)
})

const receiptGrossProfitAmount = computed(() => {
  if (!props.receipt || !canViewProfitAndCost.value) return 0
  return receiptGrossProfit(props.receipt, lookupInventoryItemForReceipt)
})

function receiptItemDetailLines(item: ReceiptItem) {
  return getProductDetailLines(item, {
    formatMoney: (n) => formatCurrency(n),
    omitLineItemFields: true,
  })
}

const receiptRef = computed(() => props.receipt)
const { businessName, branchName, storePhone, storeEmail, storeLogoUrl, refreshOwnerUserData } =
  useReceiptPaperHeader(receiptRef)

// Swap-in folder name
const swapInFolderName = computed(() => {
  if (!props.receipt?.isSwapIn || !props.receipt?.swapInFolderId) return null
  const folder = inventoryStore.getFolderById(props.receipt.swapInFolderId)
  return folder?.name || null
})

const swapInInventoryItem = shallowRef<InventoryItem | null>(null)
const swapInItemLoading = ref(false)
const swapInItemError = ref<string | null>(null)

watch(
  () =>
    [
      props.modelValue,
      props.receipt?.isSwapIn,
      props.receipt?.swapInItemId,
      props.receipt?.storeId,
    ] as const,
  async ([open, isSwapIn, itemId, storeId]) => {
    swapInInventoryItem.value = null
    swapInItemError.value = null
    swapInItemLoading.value = false
    if (!open || !isSwapIn || !itemId || !storeId) return
    swapInItemLoading.value = true
    try {
      const item = await inventoryStore.fetchInventoryItemById(itemId, { storeId })
      swapInInventoryItem.value = item
      if (!item) {
        swapInItemError.value = 'Trade-in details are unavailable (the item may have been removed).'
      }
    } catch (e) {
      console.warn('[ViewReceiptModal] swap-in item load failed:', e)
      swapInItemError.value = 'Could not load trade-in details.'
    } finally {
      swapInItemLoading.value = false
    }
  },
  { immediate: true }
)

const swapInPrimaryLabel = computed(() => {
  if (!swapInInventoryItem.value) return ''
  return getInventoryItemDisplayName(swapInInventoryItem.value)
})

const swapInDetailLines = computed(() => {
  if (!swapInInventoryItem.value) return []
  return getInventoryItemDetailLines(swapInInventoryItem.value, {
    formatMoney: (n) => formatCurrency(n),
  })
})

const authStore = useAuthStore()

// Discount calculations
const hasAnyDiscount = computed(() => {
  return props.receipt?.items?.some((item) => item.hasDiscount) || false
})

const calculateSubtotalBeforeDiscount = computed(() => {
  if (!props.receipt?.items) return 0
  return props.receipt.items.reduce((total, item) => {
    const originalPrice = item.originalPrice || item.price
    return total + originalPrice * item.quantity
  }, 0)
})

const calculateTotalDiscount = computed(() => {
  if (!props.receipt?.items) return 0
  return props.receipt.items.reduce((total, item) => {
    if (item.hasDiscount && item.originalPrice) {
      const itemDiscount = (item.originalPrice - item.price) * item.quantity
      return total + itemDiscount
    }
    return total
  }, 0)
})

/** Sum of line totals (final prices × qty); merchandise before swap credit */
const lineItemsNetTotal = computed(() => {
  if (!props.receipt?.items?.length) return 0
  return props.receipt.items.reduce((t, item) => t + item.price * item.quantity, 0)
})

const swapCreditAmount = computed(() => {
  const c = props.receipt?.swapInCredit
  return typeof c === 'number' && c > 0 ? c : 0
})

/** Show swap line when we stored credit (new receipts); legacy swap receipts may omit it */
const showSwapCreditLine = computed(() => {
  return !!(props.receipt?.isSwapIn && swapCreditAmount.value > 0)
})

const receiptTotalLabel = computed(() => {
  return showSwapCreditLine.value ? 'Amount due' : 'Total'
})

const receiptStatusPillClass = computed(() => {
  switch (props.receipt?.status) {
    case 'completed':
      return 'bg-emerald-50 text-emerald-700'
    case 'refunded':
      return 'bg-red-50 text-red-700'
    case 'balance_due':
      return 'bg-amber-50 text-amber-700'
    case 'cancelled':
      return 'bg-gray-100 text-gray-500'
    default:
      return 'bg-gray-100 text-gray-700'
  }
})

// Pre-fill email when receipt changes
watch(
  () => props.receipt,
  (receipt) => {
    if (receipt?.customerEmail) {
      emailToSend.value = receipt.customerEmail
    }
  },
  { immediate: true }
)

// Load user data and folders if not already loaded
watch(
  () => props.modelValue,
  async (isOpen) => {
    if (isOpen) {
      await refreshOwnerUserData()
      await loadReceiptPoliciesForView()
      if (!userStore.userData && authStore.currentUser) {
        try {
          await userStore.fetchUserData(authStore.currentUser.uid)
        } catch (error) {
          console.error('Error loading user data:', error)
        }
      }
      // Load folders if receipt has swap-in and folders aren't loaded
      if (
        props.receipt?.isSwapIn &&
        props.receipt?.swapInFolderId &&
        inventoryStore.folders.length === 0
      ) {
        try {
          await inventoryStore.fetchFolders()
        } catch (error) {
          console.error('Error loading folders:', error)
        }
      }
    }
  },
  { immediate: false }
)

// Also load on mount if modal opens immediately
onMounted(async () => {
  if (props.modelValue) {
    await loadReceiptPoliciesForView()
  }
  if (props.modelValue && !userStore.userData && authStore.currentUser) {
    try {
      await userStore.fetchUserData(authStore.currentUser.uid)
    } catch (error) {
      console.error('Error loading user data:', error)
    }
  }
})

// formatCurrency is now imported from usePreferences for currency conversion

const formatReceiptDate = (date: string | Date) => {
  const dateObj = date instanceof Date ? date : new Date(date)
  return dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

const formatReceiptTime = (date: string | Date) => {
  const dateObj = date instanceof Date ? date : new Date(date)
  return dateObj.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

// PDF uses built-in Helvetica; replace unsupported currency glyphs for clean output.
const formatPdfCurrency = (value: number) => {
  return formatCurrency(value).replace(/₦/g, 'NGN ')
}

/** 1×1 transparent GIF: swapped in for a receipt <img> when its proxy fetch fails, so a broken image never renders */
const TRANSPARENT_1X1_GIF =
  'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'

/**
 * Convert remote images to data URLs so the PDF pipeline's <img> fetches don't fail on CORS.
 * (tainted canvas causes SecurityError on toDataURL, PDF generation fails).
 */
function resolveImgHttpUrl(src: string): string | null {
  const trimmed = src.trim()
  if (!trimmed || trimmed.startsWith('data:') || trimmed.startsWith('blob:')) {
    return null
  }
  if (trimmed.startsWith('//')) {
    if (import.meta.client && typeof window !== 'undefined') {
      return `${window.location.protocol}${trimmed}`
    }
    return `https:${trimmed}`
  }
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed
  }
  return null
}

async function fetchProxyImageDataUrl(absoluteUrl: string): Promise<string> {
  return fetchProxiedImageDataUrl(absoluteUrl)
}

async function getReceiptLogoDataUrl(src: string): Promise<string | null> {
  const trimmed = src.trim()
  if (!trimmed) return null
  if (trimmed.startsWith('data:image/')) return trimmed
  const url = resolveImgHttpUrl(trimmed)
  if (!url) return null
  try {
    return await fetchProxyImageDataUrl(url)
  } catch {
    return null
  }
}

function detectPdfImageFormatFromDataUrl(dataUrl: string): 'PNG' | 'JPEG' {
  if (/^data:image\/jpe?g/i.test(dataUrl)) return 'JPEG'
  return 'PNG'
}

async function injectDataUrlsForImages(el: HTMLElement): Promise<void> {
  const images = el.querySelectorAll<HTMLImageElement>('img')
  await Promise.all(
    Array.from(images).map(async (img) => {
      const attr = img.getAttribute('src')
      const url = resolveImgHttpUrl(attr || img.currentSrc || img.src)
      if (!url) return
      try {
        const dataUrl = await fetchProxyImageDataUrl(url)
        img.src = dataUrl
        try {
          await img.decode()
        } catch {
          // Invalid/corrupt decode; still use dataUrl for render
        }
      } catch {
        img.setAttribute('src', TRANSPARENT_1X1_GIF)
      }
    })
  )
}

async function ensureReceiptFontsReady(): Promise<void> {
  if (!import.meta.client || !document.fonts?.load) return
  try {
    await Promise.all([
      document.fonts.load('600 1.05rem "Pixelify Sans"'),
      document.fonts.load('400 11px "JetBrains Mono"'),
    ])
    await document.fonts.ready
  } catch {
    // Built-in fallbacks apply
  }
}

async function receiptElementToJsPdf(el: HTMLElement) {
  await nextTick()
  await ensureReceiptFontsReady()
  await injectDataUrlsForImages(el)
  const { default: jsPDF } = await import('jspdf')
  if (!props.receipt) {
    throw new Error('Receipt data missing')
  }

  const receipt = props.receipt
  const pdf = new jsPDF('p', 'mm', 'a4')
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const margin = 14
  const contentWidth = pageWidth - margin * 2
  const rightEdge = pageWidth - margin
  const rowGap = 4.6
  let y = 16

  const borderInset = 6
  const drawPageBorder = () => {
    pdf.setDrawColor(209, 213, 219)
    pdf.setLineWidth(0.35)
    pdf.roundedRect(
      margin - borderInset,
      borderInset,
      contentWidth + borderInset * 2,
      pageHeight - borderInset * 2,
      2,
      2
    )
  }
  drawPageBorder()

  const ensureSpace = (required = 8) => {
    if (y + required > pageHeight - margin) {
      pdf.addPage()
      drawPageBorder()
      y = margin
    }
  }

  const writeLabel = (label: string) => {
    setReceiptPdfFont(pdf, 'bold')
    pdf.setFontSize(8)
    pdf.setTextColor(107, 114, 128)
    pdf.text(label.toUpperCase(), margin, y)
    y += rowGap
  }

  const writeTextLines = (
    text: string,
    maxWidth = contentWidth,
    opts?: {
      bold?: boolean
      align?: 'left' | 'right'
      x?: number
      color?: [number, number, number]
    }
  ) => {
    const clean = String(text || '').trim()
    if (!clean) return
    const lines = pdf.splitTextToSize(clean, maxWidth) as string[]
    setReceiptPdfFont(pdf, opts?.bold ? 'bold' : 'normal')
    pdf.setFontSize(10)
    const [tr, tg, tb] = opts?.color || [31, 41, 55]
    pdf.setTextColor(tr, tg, tb)
    for (const line of lines) {
      ensureSpace(6)
      if (opts?.align === 'right') {
        pdf.text(line, opts?.x ?? rightEdge, y, { align: 'right' })
      } else {
        pdf.text(line, opts?.x ?? margin, y)
      }
      y += rowGap
    }
  }

  // Header
  const logoDataUrl = storeLogoUrl.value ? await getReceiptLogoDataUrl(storeLogoUrl.value) : null
  if (logoDataUrl) {
    try {
      const logoSize = 13
      const logoX = (pageWidth - logoSize) / 2
      const logoFormat = detectPdfImageFormatFromDataUrl(logoDataUrl)
      pdf.addImage(logoDataUrl, logoFormat, logoX, y, logoSize, logoSize, undefined, 'FAST')
      y += logoSize + 3
    } catch {
      // Continue without logo if image decode/add fails.
    }
  }

  setReceiptPdfFont(pdf, 'bold')
  pdf.setFontSize(11)
  pdf.setTextColor(17, 24, 39)
  pdf.text(businessName.value || 'Store', pageWidth / 2, y, { align: 'center' })
  y += 6
  if (branchName.value) {
    setReceiptPdfFont(pdf, 'normal')
    pdf.setFontSize(9)
    pdf.setTextColor(75, 85, 99)
    const branchLines = pdf.splitTextToSize(branchName.value, contentWidth - 24) as string[]
    branchLines.forEach((line) => {
      ensureSpace(5)
      pdf.text(line, pageWidth / 2, y, { align: 'center' })
      y += rowGap
    })
  }
  const contact = [storePhone.value, storeEmail.value].filter(Boolean).join(' · ')
  if (contact) {
    pdf.setFontSize(9)
    pdf.text(contact, pageWidth / 2, y, { align: 'center' })
    y += rowGap
  }
  y += 2

  // Receipt/date row
  ensureSpace(16)
  writeLabel('Receipt')
  writeTextLines(`${receipt.receiptNumber}${receipt.isSwapIn ? ' · Swap-in' : ''}`, 90, {
    bold: true,
  })
  y -= rowGap * 2
  const rightColX = rightEdge
  const dateY = y
  setReceiptPdfFont(pdf, 'bold')
  pdf.setFontSize(8)
  pdf.setTextColor(107, 114, 128)
  pdf.text('DATE & TIME', rightColX, dateY, { align: 'right' })
  setReceiptPdfFont(pdf, 'normal')
  pdf.setFontSize(10)
  pdf.setTextColor(31, 41, 55)
  pdf.text(formatReceiptDate(receipt.date), rightColX, dateY + rowGap, { align: 'right' })
  pdf.setFontSize(9)
  pdf.setTextColor(75, 85, 99)
  pdf.text(formatReceiptTime(receipt.date), rightColX, dateY + rowGap * 2, { align: 'right' })
  y = dateY + rowGap * 3 + 2

  // Customer
  ensureSpace(14)
  writeLabel('Customer')
  writeTextLines(receipt.customerName, contentWidth, { bold: true })
  if (receipt.customerEmail) writeTextLines(receipt.customerEmail, contentWidth)
  y += 2

  // Items table header
  ensureSpace(16)
  writeLabel('Items')
  const productX = margin
  const qtyX = margin + 92
  const priceX = margin + 134
  const totalX = rightEdge
  setReceiptPdfFont(pdf, 'bold')
  pdf.setFontSize(9)
  pdf.setTextColor(55, 65, 81)
  pdf.text('PRODUCT', productX, y)
  pdf.text('QTY', qtyX, y, { align: 'right' })
  pdf.text('PRICE', priceX, y, { align: 'right' })
  pdf.text('TOTAL', totalX, y, { align: 'right' })
  y += 2
  pdf.setDrawColor(209, 213, 219)
  pdf.setLineWidth(0.5)
  pdf.line(margin, y, rightEdge, y)
  pdf.setLineWidth(0.2)
  y += 5

  // Items rows
  for (const item of receipt.items) {
    const detailLines = getProductDetailLines(item, {
      formatMoney: (n) => formatPdfCurrency(n),
      omitLineItemFields: true,
    })
    const productLinesRaw = [item.itemName, ...detailLines]
    if (item.hasDiscount) {
      productLinesRaw.push(
        item.discountPercentage
          ? `${item.discountPercentage}% off`
          : `-${formatPdfCurrency(item.discountAmount || 0)}`
      )
    }
    const productLines = productLinesRaw.flatMap(
      (line) => pdf.splitTextToSize(String(line), 78) as string[]
    )
    const itemBlockHeight = Math.max(6, productLines.length * rowGap)
    ensureSpace(itemBlockHeight + 8)

    setReceiptPdfFont(pdf, 'normal')
    pdf.setFontSize(10)
    pdf.setTextColor(31, 41, 55)
    productLines.forEach((line, index) => {
      pdf.text(line, productX, y + index * rowGap)
    })

    pdf.setTextColor(17, 24, 39)
    pdf.text(String(item.quantity), qtyX, y, { align: 'right' })
    pdf.text(formatPdfCurrency(item.price), priceX, y, { align: 'right' })
    setReceiptPdfFont(pdf, 'bold')
    pdf.text(formatPdfCurrency(item.price * item.quantity), totalX, y, { align: 'right' })

    y += itemBlockHeight + 2.5
    pdf.setDrawColor(243, 244, 246)
    pdf.line(margin, y, rightEdge, y)
    y += 4.5
  }

  // Totals
  const totalsLeft = margin + 108
  const writeTotalRow = (label: string, value: string, bold = false, highlight = false) => {
    ensureSpace(highlight ? 10 : 7)
    if (highlight) {
      pdf.setFillColor(17, 24, 39)
      pdf.rect(totalsLeft - 3, y - 4.6, rightEdge - totalsLeft + 3, 7.2, 'F')
    }
    setReceiptPdfFont(pdf, 'normal')
    pdf.setFontSize(10)
    pdf.setTextColor(highlight ? 255 : 75, highlight ? 255 : 85, highlight ? 255 : 99)
    pdf.text(label, totalsLeft, y)
    setReceiptPdfFont(pdf, bold ? 'bold' : 'normal')
    pdf.setTextColor(highlight ? 255 : 17, highlight ? 255 : 24, highlight ? 255 : 39)
    pdf.text(value, rightEdge, y, { align: 'right' })
    y += rowGap + (highlight ? 2 : 0.5)
  }

  if (hasAnyDiscount.value) {
    writeTotalRow('Subtotal', formatPdfCurrency(calculateSubtotalBeforeDiscount.value))
    writeTotalRow('Discount', `-${formatPdfCurrency(calculateTotalDiscount.value)}`)
  } else {
    writeTotalRow('Subtotal', formatPdfCurrency(lineItemsNetTotal.value))
  }
  if (showSwapCreditLine.value) {
    writeTotalRow('Swap credit (trade-in)', `-${formatPdfCurrency(swapCreditAmount.value)}`)
  }
  // Cost/gross-profit are intentionally never printed on the PDF - this is the customer-facing
  // document (downloaded, printed, or emailed), unlike the on-screen view which stays
  // owner-only behind canViewProfitAndCost.
  if (receipt.splitPayments?.length) {
    receipt.splitPayments.forEach((sp) => {
      writeTotalRow(`Payment (${sp.method})`, formatPdfCurrency(sp.amount))
    })
  } else {
    writeTotalRow('Payment', receipt.paymentMethod)
  }
  y += 1.5
  writeTotalRow(receiptTotalLabel.value, formatPdfCurrency(receipt.total), true, true)

  y += 3
  ensureSpace(26)
  writeLabel('Status')
  const statusColor: Record<string, [number, number, number]> = {
    completed: [4, 120, 87],
    refunded: [185, 28, 28],
    balance_due: [180, 83, 9],
    cancelled: [107, 114, 128],
  }
  writeTextLines(receipt.status.charAt(0).toUpperCase() + receipt.status.slice(1), contentWidth, {
    bold: true,
    color: statusColor[receipt.status] || [55, 65, 81],
  })
  if (receipt.notes) {
    y += 1
    writeLabel('Notes')
    writeTextLines(receipt.notes, contentWidth)
  }
  if (receipt.isSwapIn) {
    y += 1
    writeLabel('Swap-in')
    if (swapInFolderName.value) {
      writeTextLines(`Folder: ${swapInFolderName.value}`, contentWidth)
    }
    if (swapInItemLoading.value) {
      writeTextLines('Loading trade-in details...', contentWidth)
    } else if (swapInItemError.value) {
      writeTextLines(swapInItemError.value, contentWidth)
    } else if (swapInInventoryItem.value && swapInPrimaryLabel.value) {
      writeTextLines(swapInPrimaryLabel.value, contentWidth, { bold: true })
      for (const line of swapInDetailLines.value) {
        writeTextLines(line, contentWidth)
      }
    } else if (swapInFolderName.value) {
      writeTextLines(`Device added to ${swapInFolderName.value}`, contentWidth)
    } else if (receipt.swapInItemId) {
      writeTextLines('Trade-in recorded; details unavailable.', contentWidth)
    }
  }
  if (receipt.createdByUserName) {
    y += 1
    writeTextLines(`Generated by ${receipt.createdByUserName}`, contentWidth)
  }

  y += 5
  ensureSpace(10)
  setReceiptPdfFont(pdf, 'bold')
  pdf.setFontSize(10)
  pdf.setTextColor(31, 41, 55)
  pdf.text('Thank you for your business', pageWidth / 2, y, { align: 'center' })
  y += rowGap
  setReceiptPdfFont(pdf, 'normal')
  pdf.setFontSize(8)
  pdf.setTextColor(107, 114, 128)
  pdf.text('Computer-generated receipt - Generated by storvv', pageWidth / 2, y, {
    align: 'center',
  })

  return pdf
}

const handlePrintPDF = async () => {
  if (!receiptContent.value || !props.receipt || isPrinting.value) return

  isPrinting.value = true

  try {
    isCapturingPdf.value = true
    const pdf = await receiptElementToJsPdf(receiptContent.value)
    pdf.save(`receipt-${props.receipt.receiptNumber}.pdf`)
  } catch (error: unknown) {
    console.error('Error generating PDF:', error)
    const msg = error instanceof Error ? error.message : String(error)
    toast.error(
      `Could not create the PDF. ${
        msg && msg.length < 180 ? `(${msg})` : 'Check the console for details.'
      }`,
      8000
    )
  } finally {
    isCapturingPdf.value = false
    isPrinting.value = false
  }
}

const isValidEmail = (email: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

const generateReceiptPDF = async (): Promise<string> => {
  if (!receiptContent.value || !props.receipt) {
    throw new Error('Receipt content is required')
  }

  isCapturingPdf.value = true
  try {
    const pdf = await receiptElementToJsPdf(receiptContent.value)
    const dataUri = pdf.output('datauristring')
    const base64 = dataUri.split(',')[1]
    if (!base64) {
      throw new Error('Failed to generate PDF base64')
    }
    return base64
  } finally {
    isCapturingPdf.value = false
  }
}

const handleEmailClick = () => {
  if (!props.receipt) return
  if (props.receipt.customerEmail) {
    emailToSend.value = props.receipt.customerEmail
  }
  showEmailModal.value = true
}

const handleSendEmail = async () => {
  if (!props.receipt) {
    alert('Receipt data is required')
    return
  }

  if (!emailToSend.value || !isValidEmail(emailToSend.value)) {
    alert('Please enter a valid email address')
    return
  }

  isSendingEmail.value = true
  try {
    const ownerUserId = (await getQueryUserId()) || useAuthStore().currentUser?.uid || ''
    const storeId = props.receipt.storeId || ''
    const pdfBase64 = await generateReceiptPDF()

    const response = await authFetch<{ success: boolean; error?: string; message?: string }>(
      '/api/receipts/send-email',
      {
        method: 'POST',
        body: {
          ownerUserId,
          storeId,
          receiptId: props.receipt.id,
          receiptNumber: props.receipt.receiptNumber,
          customerEmail: emailToSend.value,
          receiptData: {
            ...props.receipt,
            businessName: businessName.value,
            storeName: businessName.value,
            salesTerms: receiptPolicies.salesTerms,
            refundPolicy: receiptPolicies.refundPolicy,
            warrantyPolicy: receiptPolicies.warrantyPolicy,
          },
          pdfBase64: pdfBase64,
        },
      }
    )

    if (!response.success) {
      const errorMessage =
        'error' in response && response.error ? String(response.error) : 'Failed to send email'
      throw new Error(errorMessage)
    }

    alert('Receipt sent to email successfully!')
    trackEvent('receipt_email_sent', { receipt_id: props.receipt.id })
    showEmailModal.value = false
    emailToSend.value = ''
  } catch (error: any) {
    console.error('Error sending receipt email:', error)
    alert(`Failed to send email: ${error.message || 'Unknown error'}`)
  } finally {
    isSendingEmail.value = false
  }
}
</script>
