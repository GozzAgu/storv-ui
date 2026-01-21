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
      <div class="flex items-center justify-between w-full">
        <div class="flex items-center gap-2">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Receipt {{ receipt?.receiptNumber }}
          </h3>
          <button
            v-if="receipt"
            @click="copyReceiptNumber(receipt.receiptNumber)"
            class="p-1.5 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
            title="Copy receipt number"
          >
            <ClipboardDocumentIcon class="w-4 h-4 stroke-1" stroke-width="1.5" />
          </button>
        </div>
        <div class="flex items-center gap-2">
          <button
            @click="showEmailModal = true"
            :disabled="isSendingEmail || !receipt"
            class="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg transition-colors flex items-center gap-2 text-sm font-medium"
          >
            <EnvelopeIcon class="w-4 h-4 stroke-1" stroke-width="1.5" />
            <span>{{ isSendingEmail ? 'Sending...' : 'Send Email' }}</span>
          </button>
          <button
            @click="handlePrintPDF"
            :disabled="isPrinting || !receipt"
            class="px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white rounded-lg transition-colors flex items-center gap-2 text-sm font-medium"
          >
            <PrinterIcon class="w-4 h-4 stroke-1" stroke-width="1.5" />
            <span>{{ isPrinting ? 'Generating...' : 'Print PDF' }}</span>
          </button>
        </div>
      </div>
    </template>

    <div v-if="!receipt" class="text-center py-12">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">Loading receipt...</p>
    </div>

    <div v-else class="max-h-[calc(100vh-12rem)] overflow-y-auto px-6 py-6">
      <!-- Receipt Content (will be used for PDF) -->
      <div ref="receiptContent" class="receipt-content bg-white text-gray-900 p-6 max-w-lg mx-auto">
        <!-- Store Header -->
        <div class="text-center mb-4 pb-3 border-b border-gray-400">
          <h1 class="text-xl font-bold mb-1">{{ storeName || 'Store Name' }}</h1>
          <p v-if="storeAddress" class="text-xs mb-0.5">{{ storeAddress }}</p>
          <p v-if="storePhone" class="text-xs mb-0.5">Phone: {{ storePhone }}</p>
          <p v-if="storeEmail" class="text-xs">Email: {{ storeEmail }}</p>
        </div>

        <!-- Receipt Info -->
        <div class="mb-4 pb-3 border-b border-gray-400">
          <div class="flex justify-between mb-2">
            <div class="flex items-center gap-1.5">
              <p class="text-xs mb-0.5">Receipt: {{ receipt.receiptNumber }}</p>
              <button
                @click="copyReceiptNumber(receipt.receiptNumber)"
                class="p-0.5 text-gray-600 hover:text-gray-900 transition-colors"
                title="Copy receipt number"
              >
                <ClipboardDocumentIcon class="w-3 h-3" />
              </button>
              <span v-if="receipt.isSwapIn" class="text-xs">(Swap-in)</span>
            </div>
            <div class="text-right">
              <p class="text-xs">{{ formatReceiptDate(receipt.date) }}</p>
              <p class="text-xs">{{ formatReceiptTime(receipt.date) }}</p>
            </div>
          </div>
          <div class="mt-2">
            <p class="text-xs mb-0.5">Customer: {{ receipt.customerName }}</p>
            <p v-if="receipt.customerEmail" class="text-xs">{{ receipt.customerEmail }}</p>
          </div>
        </div>

        <!-- Items Table -->
        <div class="mb-4">
          <table class="w-full border-collapse">
            <thead>
              <tr class="border-b border-gray-400">
                <th class="text-left py-1 text-xs font-bold">Item</th>
                <th class="text-center py-1 text-xs font-bold">Qty</th>
                <th class="text-right py-1 text-xs font-bold">Price</th>
                <th class="text-right py-1 text-xs font-bold">Total</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(item, index) in receipt.items"
                :key="index"
                class="border-b border-gray-300"
              >
                <td class="py-1 text-xs">
                  <div>{{ item.itemName }}</div>
                  <div v-if="item.hasDiscount" class="text-xs">
                    Discount: {{ item.discountPercentage ? `${item.discountPercentage}%` : `-${formatCurrency(item.discountAmount || 0)}` }}
                  </div>
                </td>
                <td class="py-1 text-xs text-center">{{ item.quantity }}</td>
                <td class="py-1 text-xs text-right">
                  <div v-if="item.hasDiscount && item.originalPrice" class="flex flex-col items-end">
                    <span class="text-xs line-through">{{ formatCurrency(item.originalPrice) }}</span>
                    <span>{{ formatCurrency(item.price) }}</span>
                  </div>
                  <span v-else>{{ formatCurrency(item.price) }}</span>
                </td>
                <td class="py-1 text-xs text-right">
                  <div v-if="item.hasDiscount && item.originalPrice" class="flex flex-col items-end">
                    <span class="text-xs line-through">{{ formatCurrency((item.originalPrice || 0) * item.quantity) }}</span>
                    <span>{{ formatCurrency(item.price * item.quantity) }}</span>
                  </div>
                  <span v-else>{{ formatCurrency(item.price * item.quantity) }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Totals -->
        <div class="mb-4 pb-3 border-b border-gray-400">
          <div class="flex justify-end">
            <div class="w-48 space-y-1">
              <template v-if="hasAnyDiscount">
                <div class="flex justify-between text-xs">
                  <span>Subtotal:</span>
                  <span>{{ formatCurrency(calculateSubtotalBeforeDiscount) }}</span>
                </div>
                <div class="flex justify-between text-xs">
                  <span>Total Discount:</span>
                  <span>-{{ formatCurrency(calculateTotalDiscount) }}</span>
                </div>
              </template>
              <div v-else class="flex justify-between text-xs">
                <span>Subtotal:</span>
                <span>{{ formatCurrency(receipt.total) }}</span>
              </div>
              <div class="flex justify-between text-xs pt-1 border-t border-gray-400">
                <span>Payment Method:</span>
                <span class="capitalize">{{ receipt.paymentMethod }}</span>
              </div>
              <div class="flex justify-between text-xs pt-1 border-t-2 border-gray-600">
                <span class="font-bold">Total:</span>
                <span class="font-bold">{{ formatCurrency(receipt.total) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Status -->
        <div class="mb-4 text-center">
          <span class="text-xs font-bold">Status: {{ receipt.status.charAt(0).toUpperCase() + receipt.status.slice(1) }}</span>
        </div>

        <!-- Notes -->
        <div v-if="receipt.notes" class="mb-4 pb-3 border-b border-gray-400">
          <p class="text-xs font-bold mb-1">Notes:</p>
          <p class="text-xs whitespace-pre-wrap">{{ receipt.notes }}</p>
        </div>

        <!-- Swap-In Information -->
        <div v-if="receipt.isSwapIn && swapInFolderName" class="mb-4 pb-3 border-b border-gray-400">
          <p class="text-xs font-bold mb-1">Swap-In Information:</p>
          <p class="text-xs">
            A device was swapped in and added to inventory folder: {{ swapInFolderName }}
          </p>
        </div>

        <!-- Store Branch and User Info -->
        <div v-if="receipt.storeBranchName || receipt.createdByUserName" class="mb-4 pb-3 border-b border-gray-400">
          <div class="flex justify-between text-xs">
            <div v-if="receipt.storeBranchName">
              <span>Branch: {{ receipt.storeBranchName }}</span>
            </div>
            <div v-if="receipt.createdByUserName">
              <span>Generated by: {{ receipt.createdByUserName }}</span>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="mt-4 pt-3 border-t border-gray-400 text-center">
          <p class="text-xs mb-0.5">Thank you for your business!</p>
          <p class="text-xs">This is a computer-generated receipt.</p>
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
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-primary-500"
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
import { ref, computed, watch, onMounted } from 'vue'
import { PrinterIcon, EnvelopeIcon, ClipboardDocumentIcon } from '@heroicons/vue/24/outline'
import Modal from '~/components/ui/Modal.vue'
import type { Receipt } from '~/stores/receipts'
import { useUserStore } from '~/stores/user'
import { useAuthStore } from '~/stores/auth'
import { useInventoryStore } from '~/stores/inventory'
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
const { formatCurrency } = usePreferences()

// Store information
const storeName = computed(() => userStore.userData?.storeDetails?.storeName || '')
const storeAddress = computed(() => userStore.userData?.storeDetails?.storeAddress || '')
const storePhone = computed(() => userStore.userData?.storeDetails?.storePhone || '')
const storeEmail = computed(() => userStore.userData?.storeDetails?.storeEmail || '')

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

const handlePrintPDF = async () => {
  if (!receiptContent.value || !props.receipt || isPrinting.value) return

  isPrinting.value = true

  try {
    // Dynamically import jsPDF and html2canvas
    const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
      import('jspdf'),
      import('html2canvas')
    ])

    // Create canvas from receipt content
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

  // Dynamically import jsPDF and html2canvas
  const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
    import('jspdf'),
    import('html2canvas')
  ])

  // Create canvas from receipt content
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
  font-family: 'Courier New', Courier, 'Lucida Console', Monaco, monospace;
  font-size: 13px;
  line-height: 1.5;
  color: #1f2937;
  letter-spacing: 0.3px;
}

.receipt-content h1 {
  font-size: 24px;
  font-weight: 700;
  letter-spacing: 1px;
  line-height: 1.2;
  font-family: 'Courier New', Courier, 'Lucida Console', Monaco, monospace;
}

.receipt-content .text-xs {
  font-size: 10px;
  font-family: 'Courier New', Courier, 'Lucida Console', Monaco, monospace;
}

.receipt-content .text-sm {
  font-size: 12px;
  font-family: 'Courier New', Courier, 'Lucida Console', Monaco, monospace;
}

.receipt-content table {
  font-size: 12px;
  border-collapse: collapse;
  font-family: 'Courier New', Courier, 'Lucida Console', Monaco, monospace;
}

.receipt-content th,
.receipt-content td {
  font-family: 'Courier New', Courier, 'Lucida Console', Monaco, monospace;
  padding: 4px 8px;
}

.receipt-content th {
  font-weight: 700;
}

.receipt-content * {
  font-family: 'Courier New', Courier, 'Lucida Console', Monaco, monospace;
}

/* Print styles */
@media print {
  .receipt-content {
    page-break-inside: avoid;
    font-family: 'Courier New', Courier, 'Lucida Console', Monaco, monospace;
    box-shadow: none;
    border-radius: 0;
  }
  
  .receipt-content .shadow-xl {
    box-shadow: none;
  }
  
  .receipt-content .rounded-lg {
    border-radius: 0;
  }
  
  .receipt-content * {
    font-family: 'Courier New', Courier, 'Lucida Console', Monaco, monospace;
  }
}
</style>

