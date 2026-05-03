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
            title="Copy receipt number"
          >
            <ClipboardDocumentIcon class="w-4 h-4" stroke-width="1.5" />
          </button>
        </div>
        <div class="flex items-center gap-1.5 flex-shrink-0">
          <button
            @click="showEmailModal = true"
            :disabled="isSendingEmail || !receipt"
            class="px-3 py-1.5 rounded-sm border border-gray-200 dark:border-gray-600 bg-white dark:!bg-dashboard-card text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5 text-xs font-medium"
          >
            <EnvelopeIcon class="w-4 h-4" stroke-width="1.5" />
            <span>{{ isSendingEmail ? 'Sending...' : 'Email' }}</span>
          </button>
          <button
            type="button"
            @click="handlePrintPDF"
            :disabled="isPrinting || !receipt"
            class="px-3 py-1.5 rounded-sm border border-gray-200 dark:border-gray-600 bg-white dark:!bg-dashboard-card text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5 text-xs font-medium"
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
        class="receipt-content bg-white text-gray-900 rounded-sm overflow-hidden max-w-2xl mx-auto border border-gray-200/90 shadow-sm"
      >
        <!-- Store header -->
        <div class="receipt-header text-center px-6 pt-6 pb-4 border-b border-gray-200/90">
          <div v-if="storeLogoUrl" class="mb-2 flex justify-center">
            <img
              :src="storeLogoUrl"
              alt="Store logo"
              class="receipt-logo h-16 w-16 sm:h-20 sm:w-20 rounded-sm object-contain"
            />
          </div>
          <h1 class="text-sm font-semibold tracking-tight text-gray-900">{{ storeName || 'Store' }}</h1>
          <p v-if="storeAddress" class="mt-1 text-[10px] leading-snug text-gray-500">{{ storeAddress }}</p>
          <p v-if="storePhone || storeEmail" class="mt-1 text-[10px] leading-snug text-gray-500">
            <span v-if="storePhone">{{ storePhone }}</span><span v-if="storePhone && storeEmail"> · </span><span v-if="storeEmail">{{ storeEmail }}</span>
          </p>
        </div>

        <!-- Meta block -->
        <div class="receipt-section px-6 py-4 border-b border-gray-100">
          <div class="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
            <div>
              <p class="text-[10px] font-medium uppercase tracking-wider text-gray-500">Receipt</p>
              <p class="mt-1 text-[13px] font-medium leading-tight text-gray-900">
                {{ receipt.receiptNumber }}
                <span v-if="receipt.isSwapIn" class="font-normal text-gray-500"> · Swap-in</span>
              </p>
            </div>
            <div class="text-right">
              <p class="text-[10px] font-medium uppercase tracking-wider text-gray-500">Date & time</p>
              <p class="mt-1 text-[12px] leading-tight text-gray-900">{{ formatReceiptDate(receipt.date) }}</p>
              <p class="text-[10px] text-gray-500">{{ formatReceiptTime(receipt.date) }}</p>
            </div>
          </div>
          <div class="mt-3 border-t border-gray-100 pt-3">
            <p class="text-[10px] font-medium uppercase tracking-wider text-gray-500">Customer</p>
            <p class="mt-1 text-[13px] font-medium leading-tight text-gray-900">{{ receipt.customerName }}</p>
            <p v-if="receipt.customerEmail" class="mt-1 text-[10px] leading-snug text-gray-500">{{ receipt.customerEmail }}</p>
          </div>
        </div>

        <!-- Items -->
        <div class="receipt-section px-6 py-4 border-b border-gray-100">
          <p class="mb-2 text-[10px] font-medium uppercase tracking-wider text-gray-500">Items</p>
          <table class="w-full">
            <thead class="bg-gray-50">
              <tr class="border-b border-gray-200">
                <th class="py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-600">Product</th>
                <th class="w-12 py-2 text-center text-[10px] font-semibold uppercase tracking-wider text-gray-600">Qty</th>
                <th class="py-2 text-right text-[10px] font-semibold uppercase tracking-wider text-gray-600">Price</th>
                <th class="py-2 text-right text-[10px] font-semibold uppercase tracking-wider text-gray-600">Total</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(item, index) in receipt.items"
                :key="index"
                class="border-b border-gray-100/90"
              >
                <td class="py-2 align-top">
                  <p class="text-[12px] font-medium leading-tight text-gray-900">{{ item.itemName }}</p>
                  <div
                    v-if="getProductDetailLines(item).length > 0"
                    class="mt-0.5 space-y-px"
                  >
                    <p
                      v-for="(line, detailIndex) in getProductDetailLines(item)"
                      :key="`${index}-detail-${detailIndex}`"
                      class="text-[10px] leading-snug text-gray-500"
                    >
                      {{ line }}
                    </p>
                  </div>
                  <p v-if="item.hasDiscount" class="mt-1 text-[10px] text-gray-500">
                    {{ item.discountPercentage ? `${item.discountPercentage}% off` : `-${formatCurrency(item.discountAmount || 0)}` }}
                  </p>
                </td>
                <td class="py-2 text-center text-[12px] text-gray-700">{{ item.quantity }}</td>
                <td class="py-2 text-right text-[12px] text-gray-700">
                  <template v-if="item.hasDiscount && item.originalPrice">
                    <span class="block text-[10px] leading-tight text-gray-400 line-through">{{ formatCurrency(item.originalPrice) }}</span>
                    <span class="leading-tight">{{ formatCurrency(item.price) }}</span>
                  </template>
                  <span v-else>{{ formatCurrency(item.price) }}</span>
                </td>
                <td class="py-2 text-right text-[12px] font-medium text-gray-900">
                  <template v-if="item.hasDiscount && item.originalPrice">
                    <span class="block text-[10px] font-normal leading-tight text-gray-400 line-through">{{ formatCurrency((item.originalPrice || 0) * item.quantity) }}</span>
                    <span class="leading-tight">{{ formatCurrency(item.price * item.quantity) }}</span>
                  </template>
                  <span v-else>{{ formatCurrency(item.price * item.quantity) }}</span>
                </td>
              </tr>
            </tbody>
          </table>
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
              <div class="flex justify-between border-t border-gray-200 pt-2 text-[12px] leading-tight">
                <span class="text-gray-500">Payment</span>
                <span class="capitalize text-gray-900">{{ receipt.paymentMethod }}</span>
              </div>
              <div class="flex justify-between border-t border-gray-200 pt-2 text-[13px] font-semibold leading-tight">
                <span>{{ receiptTotalLabel }}</span>
                <span>{{ formatCurrency(receipt.total) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Status -->
        <div class="px-6 py-3">
          <span class="inline-flex items-center rounded px-2 py-1 text-[10px] font-medium bg-gray-100 text-gray-700">
            {{ receipt.status.charAt(0).toUpperCase() + receipt.status.slice(1) }}
          </span>
        </div>

        <!-- Notes -->
        <div v-if="receipt.notes" class="px-6 pb-3">
          <p class="mb-1 text-[10px] font-medium uppercase tracking-wider text-gray-500">Notes</p>
          <p class="whitespace-pre-wrap text-[12px] leading-snug text-gray-700">{{ receipt.notes }}</p>
        </div>

        <!-- Swap-in -->
        <div v-if="receipt.isSwapIn && swapInFolderName" class="px-6 pb-3">
          <p class="mb-1 text-[10px] font-medium uppercase tracking-wider text-gray-500">Swap-in</p>
          <p class="text-[12px] leading-snug text-gray-700">Device added to {{ swapInFolderName }}</p>
        </div>

        <!-- Branch & generated by -->
        <div v-if="receipt.storeBranchName || receipt.createdByUserName" class="flex flex-wrap justify-between gap-2 border-t border-gray-100 px-6 py-3 text-[10px] leading-snug text-gray-500">
          <span v-if="receipt.storeBranchName">Branch: {{ receipt.storeBranchName }}</span>
          <span v-if="receipt.createdByUserName">Generated by {{ receipt.createdByUserName }}</span>
        </div>

        <!-- Footer -->
        <div class="border-t border-gray-100 bg-gray-50 px-6 py-3 text-center">
          <p class="text-[12px] leading-tight text-gray-700">Thank you for your business</p>
          <p class="mt-1 text-[10px] text-gray-500">Computer-generated receipt · Generated by storvv</p>
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
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:!bg-dashboard-card text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-primary-400"
            @keyup.enter="handleSendEmail"
          />
        </div>
        <div class="flex gap-2 justify-end">
          <button
            @click="showEmailModal = false"
            class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-sm transition-colors"
          >
            Cancel
          </button>
          <button
            @click="handleSendEmail"
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
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { PrinterIcon, EnvelopeIcon, ClipboardDocumentIcon } from '@heroicons/vue/24/outline'
import Modal from '~/components/ui/Modal.vue'
import type { Receipt } from '~/stores/receipts'
import { useUserStore } from '~/stores/user'
import { useAuthStore } from '~/stores/auth'
import { useInventoryStore } from '~/stores/inventory'
import { useStoresStore } from '~/stores/stores'
import { usePreferences } from '~/composables/usePreferences'
import { useCopy } from '~/composables/useCopy'
import { getProductDetailLines } from '~/composables/useReceiptProductDetails'
import { useAppToast } from '~/composables/useAppToast'

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

const copyReceiptNumber = (receiptNumber: string) => {
  copyToClipboard(receiptNumber, 'Receipt number')
}
const userStore = useUserStore()
const inventoryStore = useInventoryStore()
const storesStore = useStoresStore()
const { formatCurrency } = usePreferences()

// Store information (receipt.storeBranchName takes precedence for receipts created in a specific branch)
const storeName = computed(() => props.receipt?.storeBranchName || userStore.userData?.storeDetails?.storeName || '')
const storeAddress = computed(() => userStore.userData?.storeDetails?.storeAddress || '')
const storePhone = computed(() => userStore.userData?.storeDetails?.storePhone || '')
const storeEmail = computed(() => userStore.userData?.storeDetails?.storeEmail || '')
// Store logo - from receipt (when created), store by storeId, or account logo
const storeLogoUrl = computed(() => {
  const receipt = props.receipt
  if (receipt?.storeLogoUrl) return receipt.storeLogoUrl
  if (receipt?.storeId) {
    const store = storesStore.getStoreById?.(receipt.storeId) || (storesStore.currentStore?.id === receipt.storeId ? storesStore.currentStore : null)
    if (store?.logoUrl) return store.logoUrl
  }
  return userStore.userData?.storeLogoUrl || ''
})

// Swap-in folder name
const swapInFolderName = computed(() => {
  if (!props.receipt?.isSwapIn || !props.receipt?.swapInFolderId) return null
  const folder = inventoryStore.getFolderById(props.receipt.swapInFolderId)
  return folder?.name || null
})

const authStore = useAuthStore()

// Discount calculations
const hasAnyDiscount = computed(() => {
  return props.receipt?.items?.some(item => item.hasDiscount) || false
})

const calculateSubtotalBeforeDiscount = computed(() => {
  if (!props.receipt?.items) return 0
  return props.receipt.items.reduce((total, item) => {
    const originalPrice = item.originalPrice || item.price
    return total + (originalPrice * item.quantity)
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
watch(() => props.receipt, (receipt) => {
  if (receipt?.customerEmail) {
    emailToSend.value = receipt.customerEmail
  }
}, { immediate: true })

// Load user data and folders if not already loaded
watch(() => props.modelValue, async (isOpen) => {
  if (isOpen) {
    if (!userStore.userData && authStore.currentUser) {
      try {
        await userStore.fetchUserData(authStore.currentUser.uid)
      } catch (error) {
        console.error('Error loading user data:', error)
      }
    }
    // Load folders if receipt has swap-in and folders aren't loaded
    if (props.receipt?.isSwapIn && props.receipt?.swapInFolderId && inventoryStore.folders.length === 0) {
      try {
        await inventoryStore.fetchFolders()
      } catch (error) {
        console.error('Error loading folders:', error)
      }
    }
  }
}, { immediate: false })

// Also load on mount if modal opens immediately
onMounted(async () => {
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

/** 1×1 transparent GIF: use when proxy fails so html2canvas never taints the canvas */
const TRANSPARENT_1X1_GIF =
  'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'

const RECEIPT_PDF_IMAGE_FORMAT: 'PNG' | 'JPEG' = 'PNG'
const RECEIPT_PDF_JPEG_QUALITY = 0.96
/** Long signed URLs (e.g. Firebase) can exceed max GET length; use POST instead */
const PROXY_MAX_GET_STRING_CHARS = 1800
const H2C_SCALES: readonly [number, number, number] = [2, 1.75, 1.5]

/**
 * Convert remote images to data URLs so html2canvas does not taint the canvas
 * (tainted canvas → SecurityError on toDataURL, PDF generation fails).
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

/** html2canvas does not support some modern CSS color functions (e.g. oklch in Tailwind v4). */
function sanitizeUnsupportedColorFunctions(cssText: string): string {
  return cssText.replace(/oklch\([^)]+\)/gi, '#000')
}

function forcePrintThemeOnClone(cloneDocument: Document, cloneRoot: HTMLElement) {
  // Disable dark mode inheritance inside the cloned document.
  cloneDocument.documentElement.classList.remove('dark')
  cloneDocument.body.classList.remove('dark')
  cloneDocument.documentElement.style.colorScheme = 'light'
  cloneDocument.body.style.colorScheme = 'light'

  // Ensure captured receipt is always white with dark text, regardless of app theme.
  cloneRoot.classList.add('pdf-export')
  cloneRoot.style.backgroundColor = '#ffffff'
  cloneRoot.style.color = '#111827'
  cloneRoot.style.borderColor = '#e5e7eb'
  cloneRoot.querySelectorAll<HTMLElement>('*').forEach((node) => {
    // Keep explicit transparent backgrounds; otherwise force white to avoid dark-mode bleed.
    const bg = node.style.backgroundColor?.trim().toLowerCase()
    if (!bg || bg === 'transparent') {
      node.style.backgroundColor = '#ffffff'
    }
    const color = node.style.color?.trim().toLowerCase()
    if (!color) {
      node.style.color = '#111827'
    }
  })
}

function prepareHtml2CanvasClone(cloneDocument: Document, cloneRoot: HTMLElement) {
  // Last-ditch: replace any still-remote <img> in the clone to avoid tainting.
  cloneRoot.querySelectorAll('img').forEach((img) => {
    const s = (img.getAttribute('src') || '').trim()
    if (!s || s.startsWith('data:') || s.startsWith('blob:')) return
    if (s.startsWith('http://') || s.startsWith('https://') || s.startsWith('//')) {
      img.setAttribute('src', TRANSPARENT_1X1_GIF)
    }
  })

  // Prevent parser crash: strip unsupported color functions from inline styles and style tags.
  cloneRoot.querySelectorAll<HTMLElement>('[style]').forEach((node) => {
    const style = node.getAttribute('style')
    if (!style || !/oklch\(/i.test(style)) return
    node.setAttribute('style', sanitizeUnsupportedColorFunctions(style))
  })

  cloneDocument.querySelectorAll<HTMLStyleElement>('style').forEach((styleEl) => {
    if (!styleEl.textContent || !/oklch\(/i.test(styleEl.textContent)) return
    styleEl.textContent = sanitizeUnsupportedColorFunctions(styleEl.textContent)
  })

  forcePrintThemeOnClone(cloneDocument, cloneRoot)
}

async function fetchProxyImageDataUrl(absoluteUrl: string): Promise<string> {
  const usePost = absoluteUrl.length > PROXY_MAX_GET_STRING_CHARS
  const res = usePost
    ? await fetch('/api/proxy-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: absoluteUrl }),
      })
    : await fetch(`/api/proxy-image?url=${encodeURIComponent(absoluteUrl)}`)
  if (!res.ok) {
    throw new Error(`Image proxy ${res.status}`)
  }
  const blob = await res.blob()
  return await new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
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

async function html2CanvasReceipt(
  el: HTMLElement,
  scale: number
): Promise<HTMLCanvasElement> {
  if (import.meta.client && document.fonts?.ready) {
    await document.fonts.ready
  }
  const { default: html2canvas } = await import('html2canvas')
  const captureWidth = Math.max(1, Math.ceil(el.scrollWidth || el.clientWidth))
  const captureHeight = Math.max(1, Math.ceil(el.scrollHeight || el.clientHeight))
  const baseOptions = {
    scale,
    useCORS: true,
    allowTaint: false,
    logging: false,
    backgroundColor: '#ffffff',
    width: captureWidth,
    height: captureHeight,
    x: 0,
    y: 0,
    scrollX: 0,
    scrollY: 0,
    windowWidth: captureWidth + 32,
    windowHeight: captureHeight + 32,
    onclone: prepareHtml2CanvasClone,
  } as const

  // Use the classic renderer only; foreignObject mode can clip left glyph edges in PDFs.
  const fallbackCanvas = await html2canvas(el, {
    ...baseOptions,
    foreignObjectRendering: false,
  })
  if (isCanvasEffectivelyBlank(fallbackCanvas)) {
    throw new Error('Rendered canvas is blank')
  }
  return fallbackCanvas
}

function createDetachedPdfCaptureNode(el: HTMLElement): { target: HTMLElement; cleanup: () => void } {
  if (!import.meta.client || typeof document === 'undefined') {
    return { target: el, cleanup: () => {} }
  }

  const wrapper = document.createElement('div')
  wrapper.style.position = 'fixed'
  wrapper.style.left = '0'
  wrapper.style.top = '0'
  wrapper.style.margin = '0'
  wrapper.style.padding = '0'
  wrapper.style.background = '#ffffff'
  wrapper.style.pointerEvents = 'none'
  wrapper.style.zIndex = '-1'
  wrapper.style.overflow = 'visible'

  const clone = el.cloneNode(true) as HTMLElement
  clone.classList.add('pdf-export')
  clone.style.margin = '0'
  clone.style.transform = 'none'
  clone.style.position = 'static'
  clone.style.left = '0'
  clone.style.top = '0'
  clone.style.overflow = 'visible'

  wrapper.appendChild(clone)
  document.body.appendChild(wrapper)

  return {
    target: clone,
    cleanup: () => {
      wrapper.remove()
    },
  }
}

function isCanvasEffectivelyBlank(canvas: HTMLCanvasElement): boolean {
  const ctx = canvas.getContext('2d')
  if (!ctx || canvas.width === 0 || canvas.height === 0) return true
  // Sample a coarse grid: if every sampled pixel is near-white/transparent, treat as blank.
  const cols = 12
  const rows = 16
  const stepX = Math.max(1, Math.floor(canvas.width / cols))
  const stepY = Math.max(1, Math.floor(canvas.height / rows))
  for (let y = 0; y < canvas.height; y += stepY) {
    for (let x = 0; x < canvas.width; x += stepX) {
      const { data } = ctx.getImageData(x, y, 1, 1)
      const r = data[0] ?? 255
      const g = data[1] ?? 255
      const b = data[2] ?? 255
      const a = data[3] ?? 255
      const nearWhite = r > 245 && g > 245 && b > 245
      const transparent = a < 8
      if (!nearWhite && !transparent) {
        return false
      }
    }
  }
  return true
}

function addCanvasLeftGutter(canvas: HTMLCanvasElement, gutterPx = 24): HTMLCanvasElement {
  if (!import.meta.client || typeof document === 'undefined' || gutterPx <= 0) {
    return canvas
  }
  const padded = document.createElement('canvas')
  padded.width = canvas.width + gutterPx
  padded.height = canvas.height
  const ctx = padded.getContext('2d')
  if (!ctx) return canvas
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, padded.width, padded.height)
  ctx.drawImage(canvas, gutterPx, 0)
  return padded
}

/**
 * Renders the receipt to jsPDF, retrying with lower scale if canvas is too large
 * (browser limits) or the pipeline throws.
 */
async function receiptElementToJsPdf(el: HTMLElement) {
  await nextTick()
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
  const contentWidth = pageWidth - (margin * 2)
  const rightEdge = pageWidth - margin
  const rowGap = 4.6
  let y = 16

  const ensureSpace = (required = 8) => {
    if (y + required > pageHeight - margin) {
      pdf.addPage()
      y = margin
    }
  }

  const writeLabel = (label: string) => {
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(8)
    pdf.setTextColor(107, 114, 128)
    pdf.text(label.toUpperCase(), margin, y)
    y += rowGap
  }

  const writeTextLines = (text: string, maxWidth = contentWidth, opts?: { bold?: boolean; align?: 'left' | 'right'; x?: number }) => {
    const clean = String(text || '').trim()
    if (!clean) return
    const lines = pdf.splitTextToSize(clean, maxWidth) as string[]
    pdf.setFont('helvetica', opts?.bold ? 'bold' : 'normal')
    pdf.setFontSize(10)
    pdf.setTextColor(31, 41, 55)
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

  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(11)
  pdf.setTextColor(17, 24, 39)
  pdf.text(storeName.value || 'Store', pageWidth / 2, y, { align: 'center' })
  y += 6
  if (storeAddress.value) {
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(9)
    pdf.setTextColor(75, 85, 99)
    const addr = pdf.splitTextToSize(storeAddress.value, contentWidth - 24) as string[]
    addr.forEach((line) => {
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
  writeTextLines(`${receipt.receiptNumber}${receipt.isSwapIn ? ' · Swap-in' : ''}`, 90, { bold: true })
  y -= rowGap * 2
  const rightColX = rightEdge
  const dateY = y
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(8)
  pdf.setTextColor(107, 114, 128)
  pdf.text('DATE & TIME', rightColX, dateY, { align: 'right' })
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(10)
  pdf.setTextColor(31, 41, 55)
  pdf.text(formatReceiptDate(receipt.date), rightColX, dateY + rowGap, { align: 'right' })
  pdf.setFontSize(9)
  pdf.setTextColor(75, 85, 99)
  pdf.text(formatReceiptTime(receipt.date), rightColX, dateY + (rowGap * 2), { align: 'right' })
  y = dateY + (rowGap * 3) + 2

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
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(9)
  pdf.setTextColor(55, 65, 81)
  pdf.text('PRODUCT', productX, y)
  pdf.text('QTY', qtyX, y, { align: 'right' })
  pdf.text('PRICE', priceX, y, { align: 'right' })
  pdf.text('TOTAL', totalX, y, { align: 'right' })
  y += 2
  pdf.setDrawColor(229, 231, 235)
  pdf.line(margin, y, rightEdge, y)
  y += 5

  // Items rows
  for (const item of receipt.items) {
    const detailLines = getProductDetailLines(item)
    const productLinesRaw = [item.itemName, ...detailLines]
    if (item.hasDiscount) {
      productLinesRaw.push(item.discountPercentage ? `${item.discountPercentage}% off` : `-${formatCurrency(item.discountAmount || 0)}`)
    }
    const productLines = productLinesRaw.flatMap(line => pdf.splitTextToSize(String(line), 78) as string[])
    const itemBlockHeight = Math.max(6, productLines.length * rowGap)
    ensureSpace(itemBlockHeight + 8)

    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(10)
    pdf.setTextColor(31, 41, 55)
    productLines.forEach((line, index) => {
      pdf.text(line, productX, y + (index * rowGap))
    })

    pdf.setTextColor(17, 24, 39)
    pdf.text(String(item.quantity), qtyX, y, { align: 'right' })
    pdf.text(formatPdfCurrency(item.price), priceX, y, { align: 'right' })
    pdf.setFont('helvetica', 'bold')
    pdf.text(formatPdfCurrency(item.price * item.quantity), totalX, y, { align: 'right' })

    y += itemBlockHeight + 2
    pdf.setDrawColor(243, 244, 246)
    pdf.line(margin, y, rightEdge, y)
    y += 4
  }

  // Totals
  const totalsLeft = margin + 108
  const writeTotalRow = (label: string, value: string, bold = false) => {
    ensureSpace(7)
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(10)
    pdf.setTextColor(75, 85, 99)
    pdf.text(label, totalsLeft, y)
    pdf.setFont('helvetica', bold ? 'bold' : 'normal')
    pdf.setTextColor(17, 24, 39)
    pdf.text(value, rightEdge, y, { align: 'right' })
    y += rowGap + 0.5
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
  writeTotalRow('Payment', receipt.paymentMethod)
  writeTotalRow(receiptTotalLabel.value, formatPdfCurrency(receipt.total), true)

  y += 3
  ensureSpace(26)
  writeLabel('Status')
  writeTextLines(receipt.status.charAt(0).toUpperCase() + receipt.status.slice(1))
  if (receipt.notes) {
    y += 1
    writeLabel('Notes')
    writeTextLines(receipt.notes, contentWidth)
  }
  if (receipt.isSwapIn && swapInFolderName.value) {
    y += 1
    writeLabel('Swap-in')
    writeTextLines(`Device added to ${swapInFolderName.value}`, contentWidth)
  }
  if (receipt.storeBranchName || receipt.createdByUserName) {
    y += 1
    const meta = [
      receipt.storeBranchName ? `Branch: ${receipt.storeBranchName}` : '',
      receipt.createdByUserName ? `Generated by ${receipt.createdByUserName}` : '',
    ].filter(Boolean).join('    ')
    writeTextLines(meta, contentWidth)
  }

  y += 5
  ensureSpace(10)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(10)
  pdf.setTextColor(31, 41, 55)
  pdf.text('Thank you for your business', pageWidth / 2, y, { align: 'center' })
  y += rowGap
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(8)
  pdf.setTextColor(107, 114, 128)
  pdf.text('Computer-generated receipt - Generated by storvv', pageWidth / 2, y, { align: 'center' })

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
      `Could not create the PDF. ${msg && msg.length < 180 ? `(${msg})` : 'Check the console for details.'}`,
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
    // Generate PDF first
    const pdfBase64 = await generateReceiptPDF()

    // Send email with PDF attachment
    const response = await $fetch('/api/receipts/send-email', {
      method: 'POST',
      body: {
        receiptId: props.receipt.id,
        receiptNumber: props.receipt.receiptNumber,
        customerEmail: emailToSend.value,
        receiptData: props.receipt,
        pdfBase64: pdfBase64,
      },
    })

    if (!response.success) {
      const errorMessage = ('error' in response && response.error) ? String(response.error) : 'Failed to send email'
      throw new Error(errorMessage)
    }

    alert('Receipt sent to email successfully!')
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

<style scoped>
.receipt-content {
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif;
  line-height: 1.45;
  color-scheme: light;
}

/* Keep on-screen receipt text readable and prevent clipping artifacts */
.receipt-content p,
.receipt-content span,
.receipt-content td,
.receipt-content th {
  line-height: 1.5;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
}

.receipt-content .leading-tight {
  line-height: 1.45 !important;
}

.receipt-content .leading-snug {
  line-height: 1.4 !important;
}

/* Logo: preserve aspect ratio (no stretch) in PDF and on screen */
.receipt-logo {
  object-fit: contain;
  object-position: center;
}

/* PDF export: mirror on-screen layout, keep text crisp and avoid clipping */
.receipt-content.pdf-export {
  width: 640px !important;
  max-width: 640px !important;
  margin: 0 auto !important;
  font-size: 10px;
  line-height: 1.55;
  overflow: visible !important;
  padding-left: 12px !important;
  padding-right: 8px !important;
  box-sizing: border-box !important;
  font-family: Arial, Helvetica, sans-serif !important;
  -webkit-font-smoothing: auto;
  text-rendering: auto;
  font-kerning: none;
}
.receipt-content.pdf-export h1 {
  font-size: 13px !important;
  line-height: 1.35 !important;
}
.receipt-content.pdf-export .text-xs,
.receipt-content.pdf-export .text-sm,
.receipt-content.pdf-export .text-\[11px\],
.receipt-content.pdf-export p {
  font-size: 10px !important;
  line-height: 1.5 !important;
}
.receipt-content.pdf-export .text-\[10px\],
.receipt-content.pdf-export .text-\[9px\] {
  font-size: 9px !important;
  line-height: 1.5 !important;
}
.receipt-content.pdf-export th,
.receipt-content.pdf-export td {
  font-size: 10px !important;
  line-height: 1.6 !important;
  padding-top: 6px !important;
  padding-bottom: 6px !important;
  vertical-align: top;
  overflow: visible !important;
}

/* Prevent clipped glyph descenders and long unbroken strings in PDF capture */
.receipt-content.pdf-export p,
.receipt-content.pdf-export span,
.receipt-content.pdf-export td,
.receipt-content.pdf-export th,
.receipt-content.pdf-export h1 {
  overflow-wrap: anywhere !important;
  word-break: break-word !important;
  hyphens: auto;
  white-space: normal !important;
  line-height: 1.6 !important;
  overflow: visible !important;
  font-family: Arial, Helvetica, sans-serif !important;
  font-kerning: none;
  letter-spacing: 0.01em;
  text-rendering: auto;
}

.receipt-content.pdf-export table {
  width: 100% !important;
  table-layout: fixed;
  border-collapse: collapse;
}

.receipt-content.pdf-export tr {
  overflow: visible !important;
}
.receipt-content.pdf-export .receipt-logo {
  width: 64px !important;
  height: 64px !important;
}

/* PDF capture: ensure clean print look */
@media print {
  .receipt-content {
    page-break-inside: avoid;
    box-shadow: none;
    border-radius: 0;
    background: #fff;
  }
}
</style>

