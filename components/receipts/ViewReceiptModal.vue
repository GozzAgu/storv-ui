<template>
  <SDialog
    :open="props.modelValue"
    :title="receipt ? `Receipt ${receipt.receiptNumber}` : 'Receipt'"
    size="lg"
    :dismissible="!isPrinting"
    @update:open="(value: boolean) => emit('update:modelValue', value)"
  >
    <div v-if="!receipt" class="s-receipt-view__loading">
      <SSpinner :size="24" />
      <p>Loading receipt…</p>
    </div>

    <div v-else class="s-receipt-view">
      <div ref="receiptContent" class="s-receipt-doc">
        <header class="s-receipt-doc__header">
          <img
            v-if="storeLogoUrl"
            :src="storeLogoUrl"
            alt="Store logo"
            class="s-receipt-doc__logo"
          />
          <h1 class="s-receipt-doc__title">{{ businessName }}</h1>
          <p v-if="branchName" class="s-receipt-doc__sub">{{ branchName }}</p>
          <p v-if="storePhone || storeEmail" class="s-receipt-doc__fine">
            <span v-if="storePhone">{{ storePhone }}</span
            ><span v-if="storePhone && storeEmail"> · </span
            ><span v-if="storeEmail">{{ storeEmail }}</span>
          </p>
        </header>

        <section class="s-receipt-doc__section s-receipt-doc__meta">
          <div>
            <p class="s-receipt-doc__label">Receipt no.</p>
            <p class="s-receipt-doc__value s-receipt-doc__value--strong">
              {{ receipt.receiptNumber }}
            </p>
          </div>
          <div>
            <p class="s-receipt-doc__label">Date</p>
            <p class="s-receipt-doc__value">
              {{ formatReceiptDate(receipt.date) }}
              <span class="s-receipt-doc__muted">· {{ formatReceiptTime(receipt.date) }}</span>
            </p>
          </div>
          <div>
            <p class="s-receipt-doc__label">Billed to</p>
            <p class="s-receipt-doc__value s-receipt-doc__value--strong">
              {{ receipt.customerName }}
            </p>
            <p v-if="receipt.customerEmail" class="s-receipt-doc__fine">
              {{ receipt.customerEmail }}
            </p>
          </div>
          <div class="s-receipt-doc__meta-status">
            <span class="s-receipt-doc__status" :class="`s-receipt-doc__status--${receipt.status}`">
              {{ receiptStatusLabel }}
            </span>
            <span v-if="receipt.isSwapIn" class="s-receipt-doc__status">Swap-in</span>
          </div>
        </section>

        <section class="s-receipt-doc__section">
          <div class="s-receipt-doc__table-wrap">
            <table class="s-receipt-doc__table">
              <thead>
                <tr>
                  <th scope="col">Item</th>
                  <th scope="col" class="s-receipt-doc__center">Qty</th>
                  <th scope="col" class="s-receipt-doc__num">Price</th>
                  <th scope="col" class="s-receipt-doc__num">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, index) in receipt.items" :key="index">
                  <td>
                    <p class="s-receipt-doc__item-name">{{ item.itemName }}</p>
                    <dl v-if="receiptItemSpecs(item).length" class="s-receipt-doc__specs">
                      <template
                        v-for="(spec, specIndex) in receiptItemSpecs(item)"
                        :key="`${index}-spec-${specIndex}`"
                      >
                        <dt>{{ spec.label }}</dt>
                        <dd>{{ spec.value }}</dd>
                      </template>
                    </dl>
                    <p v-if="item.hasDiscount" class="s-receipt-doc__discount">
                      {{
                        item.discountPercentage
                          ? `${item.discountPercentage}% off`
                          : `${formatCurrency(item.discountAmount || 0, { exact: true })} off`
                      }}
                    </p>
                  </td>
                  <td class="s-receipt-doc__center">{{ item.quantity }}</td>
                  <td class="s-receipt-doc__num">
                    <span v-if="item.hasDiscount && item.originalPrice" class="s-receipt-doc__was">
                      {{ formatCurrency(item.originalPrice, { exact: true }) }}
                    </span>
                    {{ formatCurrency(item.price, { exact: true }) }}
                  </td>
                  <td class="s-receipt-doc__num s-receipt-doc__strong">
                    <span v-if="item.hasDiscount && item.originalPrice" class="s-receipt-doc__was">
                      {{
                        formatCurrency((item.originalPrice || 0) * item.quantity, { exact: true })
                      }}
                    </span>
                    {{ formatCurrency(item.price * item.quantity, { exact: true }) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="s-receipt-doc__totals">
            <template v-if="hasAnyDiscount">
              <div class="s-receipt-doc__row">
                <span>Subtotal</span>
                <span>{{ formatCurrency(calculateSubtotalBeforeDiscount, { exact: true }) }}</span>
              </div>
              <div class="s-receipt-doc__row">
                <span>Discount</span>
                <span>-{{ formatCurrency(calculateTotalDiscount, { exact: true }) }}</span>
              </div>
            </template>
            <div v-else class="s-receipt-doc__row">
              <span>Subtotal</span>
              <span>{{ formatCurrency(lineItemsNetTotal, { exact: true }) }}</span>
            </div>
            <div v-if="showSwapCreditLine" class="s-receipt-doc__row">
              <span>Trade-in credit</span>
              <span>-{{ formatCurrency(swapCreditAmount, { exact: true }) }}</span>
            </div>
            <template v-if="receipt.splitPayments?.length">
              <div
                v-for="(sp, spIdx) in receipt.splitPayments"
                :key="spIdx"
                class="s-receipt-doc__row"
              >
                <span
                  >Paid by <span class="s-receipt-doc__capitalize">{{ sp.method }}</span></span
                >
                <span>{{ formatCurrency(sp.amount, { exact: true }) }}</span>
              </div>
            </template>
            <div v-else class="s-receipt-doc__row">
              <span>Payment</span>
              <span class="s-receipt-doc__capitalize">{{ receipt.paymentMethod }}</span>
            </div>
            <div class="s-receipt-doc__grand">
              <span>{{ receiptTotalLabel }}</span>
              <span>{{ formatCurrency(receipt.total, { exact: true }) }}</span>
            </div>
          </div>
        </section>

        <section v-if="receipt.notes" class="s-receipt-doc__section">
          <p class="s-receipt-doc__label">Notes</p>
          <p class="s-receipt-doc__note">{{ receipt.notes }}</p>
        </section>

        <section v-if="receipt.isSwapIn" class="s-receipt-doc__section">
          <p class="s-receipt-doc__label">Trade-in received</p>
          <p v-if="swapInItemLoading" class="s-receipt-doc__muted">Loading trade-in details…</p>
          <p v-else-if="swapInItemError" class="s-receipt-doc__note">{{ swapInItemError }}</p>
          <template v-else-if="swapInPrimaryLabel">
            <p class="s-receipt-doc__item-name">{{ swapInPrimaryLabel }}</p>
            <dl v-if="swapInSpecs.length" class="s-receipt-doc__specs">
              <template v-for="(spec, i) in swapInSpecs" :key="`swap-in-spec-${i}`">
                <dt>{{ spec.label }}</dt>
                <dd>{{ spec.value }}</dd>
              </template>
            </dl>
          </template>
          <p v-else-if="swapInFolderName" class="s-receipt-doc__note">
            Added to {{ swapInFolderName }}
          </p>
          <p v-else-if="receipt.swapInItemId" class="s-receipt-doc__muted">
            Trade-in recorded; details unavailable.
          </p>
        </section>

        <section
          v-if="hasReceiptPolicyContent"
          class="s-receipt-doc__section s-receipt-doc__policies"
        >
          <div v-if="receiptPolicies.salesTerms">
            <p class="s-receipt-doc__label">Terms & conditions</p>
            <p class="s-receipt-doc__note s-receipt-doc__note--fine">
              {{ receiptPolicies.salesTerms }}
            </p>
          </div>
          <div v-if="receiptPolicies.refundPolicy">
            <p class="s-receipt-doc__label">Refund policy</p>
            <p class="s-receipt-doc__note s-receipt-doc__note--fine">
              {{ receiptPolicies.refundPolicy }}
            </p>
          </div>
          <div v-if="receiptPolicies.warrantyPolicy">
            <p class="s-receipt-doc__label">Warranty policy</p>
            <p class="s-receipt-doc__note s-receipt-doc__note--fine">
              {{ receiptPolicies.warrantyPolicy }}
            </p>
          </div>
        </section>

        <footer class="s-receipt-doc__footer">
          <p class="s-receipt-doc__thanks">Thank you for your business</p>
          <p class="s-receipt-doc__fine">
            <span v-if="receipt.createdByUserName"
              >Issued by {{ receipt.createdByUserName }} · </span
            >Generated by Storvv
          </p>
        </footer>
      </div>

      <section v-if="showInternalPanel" class="s-receipt-internal" aria-label="Only visible to you">
        <p class="s-receipt-internal__title">Only visible to you · not on the customer's copy</p>
        <dl class="s-receipt-internal__grid">
          <template v-if="showProfitRows">
            <div>
              <dt>Cost of goods</dt>
              <dd>{{ formatCurrency(receiptCogs, { exact: true }) }}</dd>
            </div>
            <div>
              <dt>Gross profit</dt>
              <dd class="s-receipt-internal__strong">
                {{ formatCurrency(receiptGrossProfitAmount, { exact: true }) }}
                <span v-if="receiptMarginPercent !== null" class="s-receipt-internal__muted">
                  · {{ receiptMarginPercent }}%
                </span>
              </dd>
            </div>
          </template>
          <div v-if="showCommissionRows">
            <dt>
              Commission{{
                receipt.commissionOwedToName ? ` · ${receipt.commissionOwedToName}` : ''
              }}
            </dt>
            <dd>
              {{ formatCurrency(receipt.commissionAmount || 0, { exact: true }) }}
              <span v-if="receipt.commissionStatus === 'paid'" class="s-receipt-internal__muted">
                · Paid
              </span>
              <button
                v-else
                type="button"
                class="s-receipt-internal__link"
                :disabled="isMarkingCommissionPaid"
                @click="markCommissionAsPaid"
              >
                Mark as paid
              </button>
            </dd>
          </div>
        </dl>
      </section>
    </div>

    <template #footer>
      <div class="s-dialog__foot-start">
        <SButton
          variant="ghost"
          :disabled="!receipt"
          @click="receipt && copyReceiptNumber(receipt.receiptNumber)"
        >
          <template #leading>
            <ClipboardDocumentIcon :size="16" :stroke-width="1.75" aria-hidden="true" />
          </template>
          Copy number
        </SButton>
      </div>
      <SButton :disabled="!receipt" @click="handleEmailClick">
        <template #leading>
          <EnvelopeIcon :size="16" :stroke-width="1.75" aria-hidden="true" />
        </template>
        Email
      </SButton>
      <SButton variant="primary" :loading="isPrinting" :disabled="!receipt" @click="handlePrintPDF">
        <template #leading>
          <PrinterIcon v-if="!isPrinting" :size="16" :stroke-width="1.75" aria-hidden="true" />
        </template>
        {{ isPrinting ? 'Generating…' : 'Print / PDF' }}
      </SButton>
    </template>
  </SDialog>

  <SDialog
    :open="showEmailModal"
    size="sm"
    title="Send receipt by email"
    @update:open="showEmailModal = $event"
  >
    <SInput
      v-model="emailToSend"
      label="Email address"
      type="email"
      autocomplete="email"
      placeholder="name@example.com"
      @keyup.enter="handleSendEmail"
    />
    <template #footer>
      <SDialogActions
        primary-label="Send"
        :primary-loading="isSendingEmail"
        :primary-disabled="!emailToSend || !isValidEmail(emailToSend)"
        @cancel="showEmailModal = false"
        @primary="handleSendEmail"
      />
    </template>
  </SDialog>
</template>

<script setup lang="ts">
import SDialog from '~/components/s/SDialog.vue'
import SDialogActions from '~/components/s/SDialogActions.vue'
import SButton from '~/components/s/SButton.vue'
import SInput from '~/components/s/SInput.vue'
import SSpinner from '~/components/s/SSpinner.vue'
import { ref, reactive, computed, watch, onMounted, nextTick, shallowRef } from 'vue'
import { PrinterIcon, EnvelopeIcon, ClipboardDocumentIcon } from '~/utils/app-icons'
import { receiptEmailErrorMessage } from '~/utils/receipt-email-error'
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
import { loadReceiptPdfFonts, renderReceiptPdf } from '~/utils/receipt-pdf'
import { useReceiptPaperHeader } from '~/composables/useReceiptPaperHeader'
import { usePermissions } from '~/composables/usePermissions'
import { useAuthenticatedFetch } from '~/composables/useAuthenticatedFetch'
import { fetchProxiedImageDataUrl } from '~/utils/proxy-image-fetch'
import { receiptGrossProfit, receiptLineCogs } from '~/utils/inventory-item-cost'

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
    // The owner's own profile is already loaded; only staff need the owner's document
    const ud =
      ownerId === useAuthStore().currentUser?.uid && userStore.userData
        ? userStore.userData
        : await getUserDocument(ownerId)
    const r = ud?.storeDetails?.settings?.receipt
    receiptPolicies.salesTerms = (r?.salesTerms || '').trim()
    receiptPolicies.refundPolicy = (r?.refundPolicy || '').trim()
    receiptPolicies.warrantyPolicy = (r?.warrantyPolicy || '').trim()
  } catch (e) {
    console.warn('[ViewReceiptModal] Could not load receipt policies:', e)
  }
}
const inventoryStore = useInventoryStore()
const { formatCurrency, preferences } = usePreferences()

function lookupInventoryItemForReceipt(itemId: string): InventoryItem | null {
  for (const list of Object.values(inventoryStore.items)) {
    const hit = list.find((i) => i.id === itemId)
    if (hit) return hit
  }
  return null
}

const receiptCogs = computed(() => {
  if (!props.receipt || !canViewProfitAndCost.value) return 0
  return receiptLineCogs(props.receipt, lookupInventoryItemForReceipt)
})

const receiptGrossProfitAmount = computed(() => {
  if (!props.receipt || !canViewProfitAndCost.value) return 0
  return receiptGrossProfit(props.receipt, lookupInventoryItemForReceipt)
})

const receiptMarginPercent = computed(() => {
  const total = props.receipt?.total ?? 0
  if (!total || total <= 0) return null
  return Math.round((receiptGrossProfitAmount.value / total) * 100)
})

const showProfitRows = computed(
  () => canViewProfitAndCost.value && props.receipt?.status === 'completed'
)
const showCommissionRows = computed(
  () => canManageCommissions.value && (props.receipt?.commissionAmount || 0) > 0
)
const showInternalPanel = computed(() => showProfitRows.value || showCommissionRows.value)

const RECEIPT_STATUS_LABELS: Record<Receipt['status'], string> = {
  completed: 'Completed',
  pending: 'Pending',
  refunded: 'Refunded',
  balance_due: 'Balance due',
  cancelled: 'Cancelled',
}
const receiptStatusLabel = computed(() =>
  props.receipt ? RECEIPT_STATUS_LABELS[props.receipt.status] ?? props.receipt.status : ''
)

function toSpecs(lines: string[]): { label: string; value: string }[] {
  return lines.map((line) => {
    const at = line.indexOf(': ')
    return at > 0
      ? { label: line.slice(0, at), value: line.slice(at + 2) }
      : { label: '', value: line }
  })
}

function receiptItemSpecs(item: ReceiptItem) {
  return toSpecs(
    getProductDetailLines(item, {
      formatMoney: (n) => formatCurrency(n, { exact: true }),
      omitLineItemFields: true,
    })
  )
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
    formatMoney: (n) => formatCurrency(n, { exact: true }),
    // Customer-facing: never the trade-in's resale price, cost or buyback flags
    omitLineItemFields: true,
  })
})

const swapInSpecs = computed(() => toSpecs(swapInDetailLines.value))

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

async function receiptElementToJsPdf(el: HTMLElement) {
  await nextTick()
  await injectDataUrlsForImages(el)
  if (!props.receipt) {
    throw new Error('Receipt data missing')
  }
  const [{ default: jsPDF }, fonts, logoDataUrl] = await Promise.all([
    import('jspdf'),
    loadReceiptPdfFonts(),
    storeLogoUrl.value ? getReceiptLogoDataUrl(storeLogoUrl.value) : Promise.resolve(null),
  ])

  const receipt = props.receipt
  // Every amount in full on a document the customer keeps: ₦7,000,000.00, never ₦7m.
  const money = (n: number) => formatCurrency(n, { exact: true })
  const isBalanceDue = receipt.status === 'balance_due'
  const swapDetailsReady = receipt.isSwapIn && swapInInventoryItem.value && !swapInItemLoading.value

  const pdf = new jsPDF('p', 'mm', 'a4')
  // Cost and gross profit are never printed: this is the customer's copy (downloaded, printed
  // or emailed), unlike the on-screen view which shows them to the owner.
  return renderReceiptPdf(
    pdf,
    {
      store: {
        name: businessName.value || 'Store',
        branch: branchName.value || undefined,
        phone: storePhone.value || undefined,
        email: storeEmail.value || undefined,
        logoDataUrl,
      },
      receiptNumber: receipt.receiptNumber,
      date: receipt.date instanceof Date ? receipt.date : new Date(receipt.date),
      status: receipt.status,
      customer: {
        name: receipt.customerName,
        phone: receipt.customerPhone || undefined,
        email: receipt.customerEmail || undefined,
        address: receipt.customerAddress || undefined,
      },
      servedBy: receipt.createdByUserName || undefined,
      items: receipt.items.map((item) => ({
        name: item.itemName,
        details: getProductDetailLines(item, { formatMoney: money, omitLineItemFields: true }),
        quantity: item.quantity,
        unitPrice: item.price,
        ...(item.hasDiscount &&
          item.originalPrice &&
          item.originalPrice > item.price && {
            originalUnitPrice: item.originalPrice,
            discountLabel: item.discountPercentage
              ? `${item.discountPercentage}% off`
              : `${money(item.originalPrice - item.price)} off each`,
          }),
        amount: item.price * item.quantity,
      })),
      totals: {
        subtotal: hasAnyDiscount.value
          ? calculateSubtotalBeforeDiscount.value
          : lineItemsNetTotal.value,
        ...(hasAnyDiscount.value && { discount: calculateTotalDiscount.value }),
        ...(showSwapCreditLine.value && { tradeInCredit: swapCreditAmount.value }),
        total: receipt.total,
        totalLabel: receiptTotalLabel.value,
        ...(isBalanceDue && {
          amountPaid: receipt.amountPaid ?? 0,
          balanceDue: receipt.balanceDue ?? Math.max(0, receipt.total - (receipt.amountPaid ?? 0)),
        }),
      },
      payment: {
        method: receipt.paymentMethod,
        ...(receipt.splitPayments?.length && { split: receipt.splitPayments }),
      },
      ...(receipt.isSwapIn && {
        tradeIn: {
          name: swapDetailsReady
            ? swapInPrimaryLabel.value || 'Trade-in item'
            : swapInFolderName.value
            ? `Item added to ${swapInFolderName.value}`
            : 'Trade-in item',
          category: swapInFolderName.value || undefined,
          details: swapDetailsReady ? swapInDetailLines.value : [],
        },
      }),
      notes: receipt.notes || undefined,
      policies: [
        { title: 'Terms of sale', text: receiptPolicies.salesTerms },
        { title: 'Refund policy', text: receiptPolicies.refundPolicy },
        { title: 'Warranty', text: receiptPolicies.warrantyPolicy },
      ],
      currency: (preferences.value.currency || 'NGN').toUpperCase(),
      money,
    },
    fonts
  )
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
    alert(receiptEmailErrorMessage(error))
  } finally {
    isSendingEmail.value = false
  }
}
</script>
