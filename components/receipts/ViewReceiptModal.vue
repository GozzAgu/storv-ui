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
            class="p-1.5 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex-shrink-0"
            title="Copy receipt number"
          >
            <ClipboardDocumentIcon class="w-4 h-4" stroke-width="1.5" />
          </button>
        </div>
        <div class="flex items-center gap-1.5 flex-shrink-0">
          <button
            @click="showEmailModal = true"
            :disabled="isSendingEmail || !receipt"
            class="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5 text-xs font-medium"
          >
            <EnvelopeIcon class="w-4 h-4" stroke-width="1.5" />
            <span>{{ isSendingEmail ? 'Sending...' : 'Email' }}</span>
          </button>
          <button
            @click="handlePrintPDF"
            :disabled="isPrinting || !receipt"
            class="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5 text-xs font-medium"
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
        class="receipt-content bg-white text-gray-900 rounded-2xl shadow-sm border border-gray-200 overflow-hidden max-w-lg mx-auto"
        :class="{ 'pdf-export': isCapturingPdf }"
      >
        <!-- Store header -->
        <div class="text-center pt-6 pb-4 px-6">
          <div v-if="storeLogoUrl" class="flex justify-center mb-2">
            <img :src="storeLogoUrl" alt="Store logo" class="receipt-logo w-10 h-10 rounded-lg object-contain ring-1 ring-gray-200" />
          </div>
          <h1 class="text-sm font-semibold text-gray-900 tracking-tight">{{ storeName || 'Store' }}</h1>
          <p v-if="storeAddress" class="mt-0.5 text-[10px] text-gray-500">{{ storeAddress }}</p>
          <p v-if="storePhone || storeEmail" class="mt-0.5 text-[10px] text-gray-500">
            <span v-if="storePhone">{{ storePhone }}</span><span v-if="storePhone && storeEmail"> · </span><span v-if="storeEmail">{{ storeEmail }}</span>
          </p>
        </div>

        <!-- Meta block -->
        <div class="px-6 pb-4">
          <div class="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
            <div>
              <p class="text-[10px] text-gray-500 uppercase tracking-wider font-medium">Receipt</p>
              <p class="text-xs font-medium text-gray-900 mt-0.5">
                {{ receipt.receiptNumber }}
                <span v-if="receipt.isSwapIn" class="text-gray-500 font-normal"> · Swap-in</span>
              </p>
            </div>
            <div class="text-right">
              <p class="text-[10px] text-gray-500 uppercase tracking-wider font-medium">Date & time</p>
              <p class="text-xs text-gray-900 mt-0.5">{{ formatReceiptDate(receipt.date) }}</p>
              <p class="text-[10px] text-gray-500">{{ formatReceiptTime(receipt.date) }}</p>
            </div>
          </div>
          <div class="mt-3 pt-3 border-t border-gray-100">
            <p class="text-[10px] text-gray-500 uppercase tracking-wider font-medium">Customer</p>
            <p class="text-xs font-medium text-gray-900 mt-0.5">{{ receipt.customerName }}</p>
            <p v-if="receipt.customerEmail" class="text-[10px] text-gray-500 mt-0.5">{{ receipt.customerEmail }}</p>
          </div>
        </div>

        <!-- Items -->
        <div class="px-6 pb-4">
          <p class="text-[10px] text-gray-500 uppercase tracking-wider font-medium mb-1.5">Items</p>
          <table class="w-full">
            <thead>
              <tr class="border-b border-gray-200">
                <th class="text-left py-1.5 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Product</th>
                <th class="text-center py-1.5 text-[10px] font-semibold text-gray-500 uppercase tracking-wider w-10">Qty</th>
                <th class="text-right py-1.5 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Price</th>
                <th class="text-right py-1.5 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Total</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(item, index) in receipt.items"
                :key="index"
                class="border-b border-gray-100"
              >
                <td class="py-2">
                  <p class="text-xs font-medium text-gray-900">{{ item.itemName }}</p>
                  <p v-if="item.hasDiscount" class="text-[10px] text-gray-500 mt-0.5">
                    {{ item.discountPercentage ? `${item.discountPercentage}% off` : `-${formatCurrency(item.discountAmount || 0)}` }}
                  </p>
                </td>
                <td class="py-2 text-center text-xs text-gray-700">{{ item.quantity }}</td>
                <td class="py-2 text-right text-xs text-gray-700">
                  <template v-if="item.hasDiscount && item.originalPrice">
                    <span class="text-[10px] text-gray-400 line-through block">{{ formatCurrency(item.originalPrice) }}</span>
                    <span>{{ formatCurrency(item.price) }}</span>
                  </template>
                  <span v-else>{{ formatCurrency(item.price) }}</span>
                </td>
                <td class="py-2 text-right text-xs font-medium text-gray-900">
                  <template v-if="item.hasDiscount && item.originalPrice">
                    <span class="text-[10px] text-gray-400 font-normal line-through block">{{ formatCurrency((item.originalPrice || 0) * item.quantity) }}</span>
                    <span>{{ formatCurrency(item.price * item.quantity) }}</span>
                  </template>
                  <span v-else>{{ formatCurrency(item.price * item.quantity) }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Totals -->
        <div class="px-6 pb-4">
          <div class="flex justify-end">
            <div class="w-44 space-y-1">
              <template v-if="hasAnyDiscount">
                <div class="flex justify-between text-xs">
                  <span class="text-gray-500">Subtotal</span>
                  <span>{{ formatCurrency(calculateSubtotalBeforeDiscount) }}</span>
                </div>
                <div class="flex justify-between text-xs">
                  <span class="text-gray-500">Discount</span>
                  <span class="text-gray-600">-{{ formatCurrency(calculateTotalDiscount) }}</span>
                </div>
              </template>
              <template v-else>
                <div class="flex justify-between text-xs">
                  <span class="text-gray-500">Subtotal</span>
                  <span>{{ formatCurrency(receipt.total) }}</span>
                </div>
              </template>
              <div class="flex justify-between text-xs pt-1.5 border-t border-gray-200">
                <span class="text-gray-500">Payment</span>
                <span class="capitalize text-gray-900">{{ receipt.paymentMethod }}</span>
              </div>
              <div class="flex justify-between text-xs font-semibold pt-1.5 border-t border-gray-200">
                <span>Total</span>
                <span>{{ formatCurrency(receipt.total) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Status -->
        <div class="px-6 pb-4">
          <span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-700">
            {{ receipt.status.charAt(0).toUpperCase() + receipt.status.slice(1) }}
          </span>
        </div>

        <!-- Notes -->
        <div v-if="receipt.notes" class="px-6 pb-4">
          <p class="text-[10px] text-gray-500 uppercase tracking-wider font-medium mb-0.5">Notes</p>
          <p class="text-xs text-gray-700 whitespace-pre-wrap">{{ receipt.notes }}</p>
        </div>

        <!-- Swap-in -->
        <div v-if="receipt.isSwapIn && swapInFolderName" class="px-6 pb-4">
          <p class="text-[10px] text-gray-500 uppercase tracking-wider font-medium mb-0.5">Swap-in</p>
          <p class="text-xs text-gray-700">Device added to {{ swapInFolderName }}</p>
        </div>

        <!-- Branch & generated by -->
        <div v-if="receipt.storeBranchName || receipt.createdByUserName" class="px-6 pb-4 flex flex-wrap justify-between gap-2 text-[10px] text-gray-500">
          <span v-if="receipt.storeBranchName">Branch: {{ receipt.storeBranchName }}</span>
          <span v-if="receipt.createdByUserName">Generated by {{ receipt.createdByUserName }}</span>
        </div>

        <!-- Footer -->
        <div class="px-6 py-4 bg-gray-50 border-t border-gray-100 text-center">
          <p class="text-xs text-gray-600">Thank you for your business</p>
          <p class="text-[10px] text-gray-500 mt-0.5">Computer-generated receipt</p>
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
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-primary-400"
            @keyup.enter="handleSendEmail"
          />
        </div>
        <div class="flex gap-2 justify-end">
          <button
            @click="showEmailModal = false"
            class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            @click="handleSendEmail"
            :disabled="!emailToSend || !isValidEmail(emailToSend) || isSendingEmail"
            class="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-400 rounded-md transition-colors"
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

/** Convert external images in the receipt to data URLs so html2canvas can draw them (avoids CORS tainting). */
async function injectDataUrlsForImages(el: HTMLElement): Promise<void> {
  const images = el.querySelectorAll<HTMLImageElement>('img[src^="http"]')
  await Promise.all(
    Array.from(images).map(async (img) => {
      const url = img.getAttribute('src')
      if (!url || url.startsWith('data:')) return
      try {
        // Proxy via our API so we avoid CORS; server fetches the image and returns it
        const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(url)}`
        const res = await fetch(proxyUrl)
        if (!res.ok) return
        const blob = await res.blob()
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result as string)
          reader.onerror = reject
          reader.readAsDataURL(blob)
        })
        img.src = dataUrl
        await img.decode()
      } catch {
        // Leave src as-is if proxy or decode fails
      }
    })
  )
}

const handlePrintPDF = async () => {
  if (!receiptContent.value || !props.receipt || isPrinting.value) return

  isPrinting.value = true

  try {
    isCapturingPdf.value = true
    await nextTick()
    await injectDataUrlsForImages(receiptContent.value!)

    // Dynamically import jsPDF and html2canvas
    const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
      import('jspdf'),
      import('html2canvas')
    ])

    // Create canvas from receipt content (pdf-export class keeps text at ~12px on A4)
    const canvas = await html2canvas(receiptContent.value, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    })

    // Calculate PDF dimensions (A4: 210 x 297 mm)
    const imgWidth = 210
    const pageHeight = 297
    const imgHeight = (canvas.height * imgWidth) / canvas.width
    let heightLeft = imgHeight

    // Create PDF
    const pdf = new jsPDF('p', 'mm', 'a4')
    let position = 0

    // Add image to PDF
    const imgData = canvas.toDataURL('image/png')
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
    heightLeft -= pageHeight

    // Add additional pages if needed
    while (heightLeft > 0) {
      position = heightLeft - imgHeight
      pdf.addPage()
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight
    }

    // Save PDF
    pdf.save(`receipt-${props.receipt.receiptNumber}.pdf`)
  } catch (error: any) {
    console.error('Error generating PDF:', error)
    alert('Failed to generate PDF. Please try again.')
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
    await nextTick()
    await injectDataUrlsForImages(receiptContent.value)

    // Dynamically import jsPDF and html2canvas
    const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
      import('jspdf'),
      import('html2canvas')
    ])

    // Create canvas from receipt content (pdf-export class keeps text at ~12px on A4)
    const canvas = await html2canvas(receiptContent.value, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    })

    // Calculate PDF dimensions (A4: 210 x 297 mm)
    const imgWidth = 210
    const pageHeight = 297
    const imgHeight = (canvas.height * imgWidth) / canvas.width
    let heightLeft = imgHeight

    // Create PDF
    const pdf = new jsPDF('p', 'mm', 'a4')
    let position = 0

    // Add image to PDF
    const imgData = canvas.toDataURL('image/png')
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
    heightLeft -= pageHeight

    // Add additional pages if needed
    while (heightLeft > 0) {
      position = heightLeft - imgHeight
      pdf.addPage()
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight
    }

    // Convert PDF to base64 string
    const dataUri = pdf.output('datauristring')
    const base64 = dataUri.split(',')[1] // Remove data:application/pdf;base64, prefix
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
  font-family: inherit;
  line-height: 1.5;
}

/* Logo: preserve aspect ratio (no stretch) in PDF and on screen */
.receipt-logo {
  object-fit: contain;
  object-position: center;
}

/* PDF export: reduce font sizes so text appears ~12px on A4 (scale 2 capture → 210mm width) */
.receipt-content.pdf-export {
  font-size: 10px;
}
.receipt-content.pdf-export h1,
.receipt-content.pdf-export .text-sm {
  font-size: 10px !important;
}
.receipt-content.pdf-export .text-xs,
.receipt-content.pdf-export p {
  font-size: 10px !important;
}
.receipt-content.pdf-export .text-\[10px\] {
  font-size: 8px !important;
}
.receipt-content.pdf-export th,
.receipt-content.pdf-export td {
  font-size: 10px !important;
}
.receipt-content.pdf-export .text-\[11px\] {
  font-size: 8px !important;
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

