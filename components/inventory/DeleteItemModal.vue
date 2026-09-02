<template>
  <Modal
    :model-value="props.modelValue"
    @update:model-value="(value: boolean) => emit('update:modelValue', value)"
    size="lg"
  >
    <template #header>
      <div class="flex items-center gap-2.5">
        <div
          class="w-8 h-8 rounded-sm bg-red-100 dark:bg-red-900/30 flex items-center justify-center"
        >
          <TrashIcon class="w-4 h-4 text-red-600 dark:text-red-400" />
        </div>
        <div class="min-w-0">
          <h3 class="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
            Delete Product
          </h3>
          <p class="text-xs text-gray-500 dark:text-gray-400 truncate">
            {{ itemName || 'This product' }}
          </p>
        </div>
      </div>
    </template>

    <div class="max-h-[calc(100vh-14rem)] overflow-y-auto space-y-3">
      <!-- Warning -->
      <div
        class="p-3 bg-red-50 dark:bg-red-900/20 ring-1 ring-red-200/50 dark:ring-red-800/40 rounded-sm"
      >
        <div class="flex items-start gap-2.5">
          <ExclamationTriangleIcon
            class="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5"
          />
          <div>
            <p class="text-xs font-medium text-red-800 dark:text-red-200">Confirm deletion</p>
            <p class="mt-0.5 text-xs text-red-700 dark:text-red-300">
              This action cannot be undone. The product will be permanently removed from inventory.
            </p>
          </div>
        </div>
      </div>

      <!-- Item Details -->
      <div v-if="item" class="space-y-2">
        <h4 class="text-xs font-semibold text-gray-900 dark:text-gray-100">Item information</h4>
        <div class="bg-gray-50/80 dark:bg-gray-700/40 rounded-sm p-2.5 space-y-1.5">
          <div v-if="item.brand || item.model" class="flex justify-between text-xs">
            <span class="text-gray-500 dark:text-gray-400">Product model</span>
            <span class="font-medium text-gray-900 dark:text-gray-100"
              >{{ item.brand || '' }}{{ item.brand && item.model ? ' ' : ''
              }}{{ item.model || '' }}</span
            >
          </div>
          <div v-if="item.serialNo || item.serialNumber" class="flex justify-between text-xs">
            <span class="text-gray-500 dark:text-gray-400">Serial Number</span>
            <span class="font-medium text-gray-900 dark:text-gray-100">{{
              item.serialNo || item.serialNumber
            }}</span>
          </div>
          <div v-if="item.quantity !== undefined" class="flex justify-between text-xs">
            <span class="text-gray-500 dark:text-gray-400">Quantity</span>
            <span class="font-medium text-gray-900 dark:text-gray-100">{{ item.quantity }}</span>
          </div>
          <div v-if="item.price" class="flex justify-between text-xs">
            <span class="text-gray-500 dark:text-gray-400">Unit price</span>
            <span class="font-medium text-gray-900 dark:text-gray-100">{{
              formatCurrency(item.price)
            }}</span>
          </div>
        </div>
      </div>

      <!-- What will happen -->
      <div
        class="p-2.5 bg-amber-50 dark:bg-amber-900/20 ring-1 ring-amber-200/50 dark:ring-amber-800/40 rounded-sm"
      >
        <h4 class="text-xs font-semibold text-amber-900 dark:text-amber-100 mb-1">
          What will happen
        </h4>
        <ul class="space-y-0.5 text-xs text-amber-800 dark:text-amber-200 list-disc list-inside">
          <li>Product permanently deleted from inventory</li>
          <li>All associated data removed</li>
          <li>This action cannot be undone</li>
        </ul>
      </div>

      <!-- Confirmation -->
      <div class="p-2.5 bg-gray-50 dark:bg-gray-700/40 rounded-sm">
        <Checkbox
          v-model="confirmed"
          label="I understand that this action cannot be undone and will permanently delete this product."
          size="sm"
          wrapper-class="items-start"
          label-class="text-xs text-gray-700 dark:text-gray-300"
        />
      </div>
    </div>

    <template #footer>
      <IosDrawerActions
        primary-variant="danger"
        :primary-label="isProcessing ? 'Deleting...' : 'Delete Product'"
        :primary-icon="TrashIcon"
        :primary-disabled="!confirmed || isProcessing"
        @cancel="handleCancel"
        @primary="handleConfirmDelete"
      />
    </template>
  </Modal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import {
  TrashIcon,
  ExclamationTriangleIcon,
} from '~/utils/app-icons'
import Modal from '~/components/ui/Modal.vue'
import IosDrawerActions from '~/components/ios/IosDrawerActions.vue'
import Checkbox from '~/components/ui/Checkbox.vue'
import { usePreferences } from '~/composables/usePreferences'

interface Props {
  modelValue: boolean
  item: any | null
  itemName?: string
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  deleted: [item: any]
}>()

const { formatCurrency: formatCurrencyUtil } = usePreferences()

const confirmed = ref(false)
const isProcessing = ref(false)

const formatCurrency = (value: number) => {
  return formatCurrencyUtil(value)
}

const handleCancel = () => {
  confirmed.value = false
  emit('update:modelValue', false)
}

const handleConfirmDelete = async () => {
  if (!props.item || !confirmed.value || isProcessing.value) return

  isProcessing.value = true

  try {
    emit('deleted', props.item)
    handleCancel()
  } catch (error: any) {
    console.error('Delete error:', error)
  } finally {
    isProcessing.value = false
  }
}

// Reset form when modal opens/closes
watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen) {
      confirmed.value = false
      isProcessing.value = false
    }
  }
)
</script>
