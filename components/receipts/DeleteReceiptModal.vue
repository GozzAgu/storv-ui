<template>
  <Modal
    :model-value="props.modelValue"
    @update:model-value="(value: boolean) => emit('update:modelValue', value)"
    size="lg"
  >
    <template #header>
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-md bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
          <TrashIcon class="w-6 h-6 text-red-600 dark:text-red-400" />
        </div>
        <div>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Delete Receipt
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
      <div class="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
        <div class="flex items-start gap-3">
          <ExclamationTriangleIcon class="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p class="text-sm font-medium text-red-800 dark:text-red-200">
              Confirm Deletion
            </p>
            <p class="mt-1 text-xs text-red-700 dark:text-red-300">
              This action cannot be undone. Deleting this receipt will also delete the associated customer (if no other receipts exist) and return all items to inventory.
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
              <span class="text-gray-600 dark:text-gray-400">Status:</span>
              <span class="font-medium text-gray-900 dark:text-gray-100">{{ receipt.status.charAt(0).toUpperCase() + receipt.status.slice(1) }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-gray-600 dark:text-gray-400">Items Count:</span>
              <span class="font-medium text-gray-900 dark:text-gray-100">{{ receipt.itemsCount }} item{{ receipt.itemsCount !== 1 ? 's' : '' }}</span>
            </div>
          </div>
        </div>

        <!-- Items to be Returned -->
        <div>
          <h4 class="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">Items to be Returned to Inventory</h4>
          <div class="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <div class="overflow-x-auto max-h-48 overflow-y-auto">
              <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead class="sticky top-0">
                  <tr>
                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Item</th>
                    <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Quantity</th>
                    <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Price</th>
                    <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Total</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                  <tr v-for="(item, index) in receipt.items" :key="index">
                    <td class="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{{ item.itemName }}</td>
                    <td class="px-4 py-3 text-sm text-center text-gray-600 dark:text-gray-400">{{ item.quantity }}</td>
                    <td class="px-4 py-3 text-sm text-right text-gray-600 dark:text-gray-400">${{ formatCurrency(item.price) }}</td>
                    <td class="px-4 py-3 text-sm text-right font-medium text-gray-900 dark:text-gray-100">
                      ${{ formatCurrency(item.price * item.quantity) }}
                    </td>
                  </tr>
                </tbody>
                <tfoot class="bg-gray-50 dark:bg-gray-700/50">
                  <tr>
                    <td colspan="3" class="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-gray-100 text-right">
                      Total:
                    </td>
                    <td class="px-4 py-3 text-sm font-bold text-gray-900 dark:text-gray-100 text-right">
                      ${{ formatCurrency(receipt.total) }}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>

        <!-- What Will Happen -->
        <div class="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <h4 class="text-xs font-semibold text-yellow-900 dark:text-yellow-100 mb-1.5">What will happen:</h4>
          <ul class="space-y-0.5 text-xs text-yellow-800 dark:text-yellow-200 list-disc list-inside">
            <li>All items from this receipt will be returned to inventory</li>
            <li>The associated customer will be removed (if this was their only receipt)</li>
            <li>This receipt will be permanently deleted</li>
            <li>This action cannot be undone</li>
          </ul>
        </div>

        <!-- Confirmation Checkbox -->
        <div class="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <Checkbox
            v-model="confirmed"
            label="I understand that this action cannot be undone and will permanently delete this receipt and its associated data."
            size="sm"
            wrapper-class="items-start"
            label-class="text-sm text-gray-700 dark:text-gray-300"
          />
        </div>
      </div>
    </div>

    <template #footer>
      <Button variant="outline" size="sm" @click="handleCancel" class="w-full sm:w-auto !rounded-lg">Cancel</Button>
      <Button
        variant="danger"
        size="sm"
        extra-class="!rounded-lg"
        :disabled="!confirmed || isProcessing"
        @click="handleConfirmDelete"
        :icon="TrashIcon"
        class="w-full sm:w-auto"
      >
        {{ isProcessing ? 'Deleting...' : 'Delete Receipt' }}
      </Button>
    </template>
  </Modal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { TrashIcon, ExclamationTriangleIcon } from '@heroicons/vue/24/outline'
import Modal from '~/components/ui/Modal.vue'
import Button from '~/components/ui/Button.vue'
import Checkbox from '~/components/ui/Checkbox.vue'
import type { Receipt } from '~/stores/receipts'

interface Props {
  modelValue: boolean
  receipt: Receipt | null
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'confirmDelete': [receipt: Receipt]
}>()

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
  confirmed.value = false
  emit('update:modelValue', false)
}

const handleConfirmDelete = () => {
  if (!props.receipt || !confirmed.value || isProcessing.value) return
  const receipt = props.receipt
  emit('confirmDelete', receipt)
  handleCancel()
}

// Reset form when modal opens/closes
watch(() => props.modelValue, (isOpen) => {
  if (isOpen) {
    confirmed.value = false
    isProcessing.value = false
  }
})
</script>

