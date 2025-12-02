<template>
  <Modal
    :model-value="props.modelValue"
    @update:model-value="(value: boolean) => emit('update:modelValue', value)"
    size="lg"
  >
    <template #header>
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
          <ArrowPathIcon class="w-6 h-6 text-orange-600 dark:text-orange-400" />
        </div>
        <div>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Return/Refund Receipt
          </h3>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            Receipt #{{ receipt?.receiptNumber }}
          </p>
        </div>
      </div>
    </template>

    <div v-if="!receipt" class="text-center py-12">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">Loading receipt...</p>
    </div>

    <div v-else class="max-h-[calc(100vh-16rem)] overflow-y-auto space-y-4">
      <!-- Warning Message -->
      <div class="p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl">
        <div class="flex items-start gap-3">
          <ExclamationTriangleIcon class="w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
          <div>
            <p class="text-sm font-medium text-orange-800 dark:text-orange-200">
              Confirm Return/Refund
            </p>
            <p class="mt-1 text-xs text-orange-700 dark:text-orange-300">
              This action will mark the receipt as refunded and return all items to inventory. The customer will be notified and the transaction will be recorded.
            </p>
          </div>
        </div>
      </div>

      <!-- Receipt Details -->
      <div class="space-y-3">
        <div>
          <h4 class="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">Receipt Information</h4>
          <div class="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 space-y-1.5">
            <div class="flex justify-between text-sm">
              <span class="text-gray-600 dark:text-gray-400">Receipt Number:</span>
              <span class="font-medium text-gray-900 dark:text-gray-100">{{ receipt.receiptNumber }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-gray-600 dark:text-gray-400">Customer:</span>
              <span class="font-medium text-gray-900 dark:text-gray-100">{{ receipt.customerName }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-gray-600 dark:text-gray-400">Date:</span>
              <span class="font-medium text-gray-900 dark:text-gray-100">{{ formatDate(receipt.date) }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-gray-600 dark:text-gray-400">Total Amount:</span>
              <span class="font-semibold text-gray-900 dark:text-gray-100">${{ formatCurrency(receipt.total) }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-gray-600 dark:text-gray-400">Payment Method:</span>
              <span class="font-medium text-gray-900 dark:text-gray-100">{{ receipt.paymentMethod }}</span>
            </div>
          </div>
        </div>

        <!-- Items to be Returned -->
        <div>
          <h4 class="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">Items to be Returned</h4>
          <div class="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <div class="overflow-x-auto max-h-48 overflow-y-auto">
              <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead class="sticky top-0">
                  <tr>
                    <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Item</th>
                    <th class="px-4 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Quantity</th>
                    <th class="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Price</th>
                    <th class="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Total</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                  <tr v-for="(item, index) in receipt.items" :key="index">
                    <td class="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">{{ item.itemName }}</td>
                    <td class="px-4 py-2 text-sm text-center text-gray-600 dark:text-gray-400">{{ item.quantity }}</td>
                    <td class="px-4 py-2 text-sm text-right text-gray-600 dark:text-gray-400">${{ formatCurrency(item.price) }}</td>
                    <td class="px-4 py-2 text-sm text-right font-medium text-gray-900 dark:text-gray-100">
                      ${{ formatCurrency(item.price * item.quantity) }}
                    </td>
                  </tr>
                </tbody>
                <tfoot class="bg-gray-50 dark:bg-gray-700/50 sticky bottom-0">
                  <tr>
                    <td colspan="3" class="px-4 py-2 text-sm font-semibold text-gray-900 dark:text-gray-100 text-right">
                      Refund Amount:
                    </td>
                    <td class="px-4 py-2 text-sm font-bold text-gray-900 dark:text-gray-100 text-right">
                      ${{ formatCurrency(receipt.total) }}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>

        <!-- Return Reason (Optional) -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Return Reason <span class="text-gray-500 dark:text-gray-400">(Optional)</span>
          </label>
          <textarea
            v-model="returnReason"
            rows="2"
            class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
            placeholder="Enter reason for return/refund..."
          ></textarea>
        </div>

        <!-- Confirmation Checkbox -->
        <div class="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <Checkbox
            v-model="confirmed"
            label="I confirm that I want to return/refund this receipt. All items will be returned to inventory and the receipt will be marked as refunded."
            size="sm"
            wrapper-class="items-start"
            label-class="text-sm text-gray-700 dark:text-gray-300"
          />
        </div>
      </div>
    </div>

    <template #footer>
      <Button variant="outline" @click="handleCancel" class="w-full sm:w-auto">Cancel</Button>
      <Button
        variant="primary"
        :disabled="!confirmed || isProcessing"
        @click="handleConfirmReturn"
        :icon="ArrowPathIcon"
        class="w-full sm:w-auto"
      >
        {{ isProcessing ? 'Processing...' : 'Confirm Return/Refund' }}
      </Button>
    </template>
  </Modal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { ArrowPathIcon, ExclamationTriangleIcon } from '@heroicons/vue/24/outline'
import Modal from '~/components/ui/Modal.vue'
import Button from '~/components/ui/Button.vue'
import Checkbox from '~/components/ui/Checkbox.vue'
import { useReceiptsStore, type Receipt } from '~/stores/receipts'
import { useInventoryStore } from '~/stores/inventory'

interface Props {
  modelValue: boolean
  receipt: Receipt | null
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'returned': [receipt: Receipt]
}>()

const receiptsStore = useReceiptsStore()
const inventoryStore = useInventoryStore()

const returnReason = ref('')
const confirmed = ref(false)
const isProcessing = ref(false)

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

const formatDate = (date: Date | string | any) => {
  if (!date) return 'N/A'
  try {
    const dateObj = date?.toDate ? date.toDate() : new Date(date)
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return 'N/A'
  }
}

const handleCancel = () => {
  returnReason.value = ''
  confirmed.value = false
  emit('update:modelValue', false)
}

const handleConfirmReturn = async () => {
  if (!props.receipt || !confirmed.value || isProcessing.value) return

  isProcessing.value = true

  try {
    const receipt = props.receipt
    const itemIds = receipt.itemIds || []

    // 1. Return items to inventory (remove dateOut)
    if (itemIds.length > 0) {
      try {
        await inventoryStore.returnItemsToStock(itemIds)
      } catch (error: any) {
        console.error('[ReturnReceiptModal] Error returning items to stock:', error)
        throw new Error('Failed to return items to inventory. Please try again.')
      }
    }

    // 2. Update receipt status to refunded
    await receiptsStore.updateReceipt(receipt.id, {
      status: 'refunded',
      notes: returnReason.value ? `Returned: ${returnReason.value}` : 'Returned',
    })

    // 3. Update customer (if needed - this might be handled elsewhere)
    // The receipt status change should be sufficient

    emit('returned', receipt)
    handleCancel()
  } catch (error: any) {
    alert(error.message || 'Failed to process return/refund. Please try again.')
  } finally {
    isProcessing.value = false
  }
}

// Reset form when modal opens/closes
watch(() => props.modelValue, (isOpen) => {
  if (isOpen) {
    returnReason.value = ''
    confirmed.value = false
    isProcessing.value = false
  }
})
</script>

