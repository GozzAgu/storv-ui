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
        <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Receipt {{ receipt?.receiptNumber }}
        </h3>
        <div class="flex items-center gap-2">
          <button
            @click="handlePrintPDF"
            :disabled="isPrinting || !receipt"
            class="px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white rounded-lg transition-colors flex items-center gap-2 text-sm font-medium"
          >
            <PrinterIcon class="w-4 h-4" />
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
      <div ref="receiptContent" class="receipt-content bg-white text-gray-900 p-6 max-w-2xl mx-auto">
        <!-- Store Header -->
        <div class="text-center mb-6 pb-4 border-b-2 border-gray-300">
          <h1 class="text-xl font-bold mb-1">{{ storeName || 'Store Name' }}</h1>
          <p v-if="storeAddress" class="text-xs text-gray-600 mb-0.5">{{ storeAddress }}</p>
          <p v-if="storePhone" class="text-xs text-gray-600 mb-0.5">Phone: {{ storePhone }}</p>
          <p v-if="storeEmail" class="text-xs text-gray-600">Email: {{ storeEmail }}</p>
        </div>

        <!-- Receipt Info -->
        <div class="mb-5">
          <div class="flex justify-between items-start mb-3">
            <div>
              <p class="text-xs text-gray-600 mb-0.5">Receipt Number</p>
              <div class="flex items-center gap-2">
                <p class="text-sm font-semibold">{{ receipt.receiptNumber }}</p>
                <span
                  v-if="receipt.isSwapIn"
                  class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                  title="Swap-in transaction"
                >
                  Swap-in
                </span>
              </div>
            </div>
            <div class="text-right">
              <p class="text-xs text-gray-600 mb-0.5">Date</p>
              <p class="text-sm font-semibold">{{ formatReceiptDate(receipt.date) }}</p>
              <p class="text-xs text-gray-600 mt-0.5">{{ formatReceiptTime(receipt.date) }}</p>
            </div>
          </div>

          <div class="mt-3 pt-3 border-t border-gray-300">
            <p class="text-xs text-gray-600 mb-0.5">Customer</p>
            <p class="text-sm font-semibold">{{ receipt.customerName }}</p>
            <p v-if="receipt.customerEmail" class="text-xs text-gray-600">{{ receipt.customerEmail }}</p>
          </div>
        </div>

        <!-- Items Table -->
        <div class="mb-5">
          <table class="w-full border-collapse text-xs">
            <thead>
              <tr class="border-b-2 border-gray-300">
                <th class="text-left py-2 px-2 font-semibold">Item</th>
                <th class="text-center py-2 px-2 font-semibold">Qty</th>
                <th class="text-right py-2 px-2 font-semibold">Price</th>
                <th class="text-right py-2 px-2 font-semibold">Total</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(item, index) in receipt.items"
                :key="index"
                class="border-b border-gray-200"
              >
                <td class="py-2 px-2">
                  <div>{{ item.itemName }}</div>
                  <div v-if="item.hasDiscount" class="text-xs text-red-600 mt-0.5">
                    Discount: {{ item.discountPercentage ? `${item.discountPercentage}%` : `-$${formatCurrency(item.discountAmount || 0)}` }}
                  </div>
                </td>
                <td class="py-2 px-2 text-center">{{ item.quantity }}</td>
                <td class="py-2 px-2 text-right">
                  <div v-if="item.hasDiscount && item.originalPrice" class="flex flex-col items-end">
                    <span class="text-xs text-gray-400 line-through">${{ formatCurrency(item.originalPrice) }}</span>
                    <span class="font-semibold text-green-600">${{ formatCurrency(item.price) }}</span>
                  </div>
                  <span v-else>${{ formatCurrency(item.price) }}</span>
                </td>
                <td class="py-2 px-2 text-right font-semibold">
                  <div v-if="item.hasDiscount && item.originalPrice" class="flex flex-col items-end">
                    <span class="text-xs text-gray-400 line-through">${{ formatCurrency((item.originalPrice || 0) * item.quantity) }}</span>
                    <span class="text-green-600">${{ formatCurrency(item.price * item.quantity) }}</span>
                  </div>
                  <span v-else>${{ formatCurrency(item.price * item.quantity) }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Totals -->
        <div class="mb-5 pt-3 border-t-2 border-gray-300">
          <div class="flex justify-end">
            <div class="w-48 space-y-1.5">
              <!-- Calculate totals with discounts -->
              <template v-if="hasAnyDiscount">
                <div class="flex justify-between">
                  <span class="text-xs text-gray-600">Subtotal:</span>
                  <span class="text-xs font-semibold">${{ formatCurrency(calculateSubtotalBeforeDiscount) }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-xs text-red-600">Total Discount:</span>
                  <span class="text-xs font-semibold text-red-600">-${{ formatCurrency(calculateTotalDiscount) }}</span>
                </div>
              </template>
              <div v-else class="flex justify-between">
                <span class="text-xs text-gray-600">Subtotal:</span>
                <span class="text-xs font-semibold">${{ formatCurrency(receipt.total) }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-xs text-gray-600">Payment Method:</span>
                <span class="text-xs font-semibold capitalize">{{ receipt.paymentMethod }}</span>
              </div>
              <div class="flex justify-between pt-1.5 border-t border-gray-300">
                <span class="text-sm font-bold">Total:</span>
                <span class="text-sm font-bold">${{ formatCurrency(receipt.total) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Status Badge -->
        <div class="mb-5 text-center">
          <span
            :class="[
              'inline-block px-3 py-1 rounded-full text-xs font-semibold',
              receipt.status === 'completed'
                ? 'bg-green-100 text-green-800'
                : receipt.status === 'pending'
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-red-100 text-red-800'
            ]"
          >
            {{ receipt.status.charAt(0).toUpperCase() + receipt.status.slice(1) }}
          </span>
        </div>

        <!-- Notes -->
        <div v-if="receipt.notes" class="mb-5 pt-3 border-t border-gray-300">
          <p class="text-xs font-semibold text-gray-600 mb-1">Notes:</p>
          <p class="text-xs text-gray-700 whitespace-pre-wrap">{{ receipt.notes }}</p>
        </div>

        <!-- Swap-In Information -->
        <div v-if="receipt.isSwapIn && swapInFolderName" class="mb-5 pt-3 border-t border-gray-300">
          <p class="text-xs font-semibold text-gray-600 mb-1">Swap-In:</p>
          <p class="text-xs text-gray-700">
            A device was swapped in and added to inventory folder: <strong>{{ swapInFolderName }}</strong>
          </p>
        </div>

        <!-- Footer -->
        <div class="mt-6 pt-4 border-t-2 border-gray-300 text-center text-xs text-gray-500">
          <p>Thank you for your business!</p>
          <p class="mt-1">This is a computer-generated receipt.</p>
        </div>
      </div>
    </div>
  </Modal>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { PrinterIcon } from '@heroicons/vue/24/outline'
import Modal from '~/components/ui/Modal.vue'
import type { Receipt } from '~/stores/receipts'
import { useUserStore } from '~/stores/user'
import { useAuthStore } from '~/stores/auth'
import { useInventoryStore } from '~/stores/inventory'

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
const userStore = useUserStore()
const inventoryStore = useInventoryStore()

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

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

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
</script>

<style scoped>
.receipt-content {
  font-family: 'Comic Neue', 'Comic Sans MS', cursive;
}

/* Print styles */
@media print {
  .receipt-content {
    page-break-inside: avoid;
  }
}
</style>

