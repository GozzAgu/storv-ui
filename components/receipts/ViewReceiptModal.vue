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
              <p class="text-sm font-semibold">{{ receipt.receiptNumber }}</p>
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
                <td class="py-2 px-2">{{ item.itemName }}</td>
                <td class="py-2 px-2 text-center">{{ item.quantity }}</td>
                <td class="py-2 px-2 text-right">${{ formatCurrency(item.price) }}</td>
                <td class="py-2 px-2 text-right font-semibold">
                  ${{ formatCurrency(item.price * item.quantity) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Totals -->
        <div class="mb-5 pt-3 border-t-2 border-gray-300">
          <div class="flex justify-end">
            <div class="w-48 space-y-1.5">
              <div class="flex justify-between">
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

// Store information
const storeName = computed(() => userStore.userData?.storeDetails?.storeName || '')
const storeAddress = computed(() => userStore.userData?.storeDetails?.storeAddress || '')
const storePhone = computed(() => userStore.userData?.storeDetails?.storePhone || '')
const storeEmail = computed(() => userStore.userData?.storeDetails?.storeEmail || '')

const authStore = useAuthStore()

// Load user data if not already loaded
watch(() => props.modelValue, async (isOpen) => {
  if (isOpen && !userStore.userData && authStore.currentUser) {
    try {
      await userStore.fetchUserData(authStore.currentUser.uid)
    } catch (error) {
      console.error('Error loading user data:', error)
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

