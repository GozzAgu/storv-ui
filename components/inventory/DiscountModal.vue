<template>
  <Modal
    :model-value="props.modelValue"
    title="Apply Discount"
    size="md"
    @update:model-value="(value: boolean) => emit('update:modelValue', value)"
  >
    <template #default>
      <div class="space-y-4">
        <div v-if="item">
          <div class="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg mb-4">
            <p class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Item:</p>
            <p class="text-base font-semibold text-gray-900 dark:text-gray-100">{{ getItemName(item) }}</p>
            <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Current Price: <span class="font-medium">${{ formatCurrency(getOriginalPrice(item)) }}</span>
            </p>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Discount Type *
            </label>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                @click="discountType = 'percentage'"
                :class="[
                  'p-3 border-2 rounded-lg transition-all text-center',
                  discountType === 'percentage'
                    ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-primary-300'
                ]"
              >
                <p class="font-medium text-sm text-gray-900 dark:text-gray-100">Percentage</p>
                <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">e.g., 10%</p>
              </button>
              <button
                type="button"
                @click="discountType = 'amount'"
                :class="[
                  'p-3 border-2 rounded-lg transition-all text-center',
                  discountType === 'amount'
                    ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-primary-300'
                ]"
              >
                <p class="font-medium text-sm text-gray-900 dark:text-gray-100">Fixed Amount</p>
                <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">e.g., $5.00</p>
              </button>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Discount Value *
            </label>
            <div class="relative">
              <span
                v-if="discountType === 'percentage'"
                class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400"
              >
                %
              </span>
              <span
                v-else
                class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400"
              >
                $
              </span>
              <input
                v-model.number="discountValue"
                type="number"
                :min="0"
                :max="discountType === 'percentage' ? 100 : getOriginalPrice(item)"
                step="any"
                :placeholder="discountType === 'percentage' ? '10' : '5.00'"
                class="w-full pl-8 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <p v-if="discountType === 'percentage'" class="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Enter a value between 0 and 100
            </p>
            <p v-else class="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Maximum: ${{ formatCurrency(getOriginalPrice(item)) }}
            </p>
          </div>

          <!-- Preview -->
          <div v-if="discountValue && discountValue > 0" class="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <p class="text-sm font-medium text-green-800 dark:text-green-200 mb-2">Discount Preview:</p>
            <div class="space-y-1">
              <div class="flex justify-between text-sm">
                <span class="text-gray-600 dark:text-gray-400">Original Price:</span>
                <span class="font-medium text-gray-900 dark:text-gray-100">${{ formatCurrency(getOriginalPrice(item)) }}</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-gray-600 dark:text-gray-400">Discount:</span>
                <span class="font-medium text-red-600 dark:text-red-400">
                  {{ discountType === 'percentage' ? `${discountValue}%` : `-$${formatCurrency(discountValue)}` }}
                </span>
              </div>
              <div class="flex justify-between text-base font-semibold pt-2 border-t border-green-200 dark:border-green-800">
                <span class="text-green-800 dark:text-green-200">Discounted Price:</span>
                <span class="text-green-700 dark:text-green-300">${{ formatCurrency(calculateDiscountedPrice()) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <template #footer>
      <Button variant="outline" @click="handleCancel" class="w-full sm:w-auto">Cancel</Button>
      <Button
        variant="primary"
        @click="handleApplyDiscount"
        :disabled="!isValid || isApplying"
        class="w-full sm:w-auto"
      >
        <span v-if="isApplying">Applying...</span>
        <span v-else>Apply Discount</span>
      </Button>
    </template>
  </Modal>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import Modal from '~/components/ui/Modal.vue'
import Button from '~/components/ui/Button.vue'
import { useInventoryStore, type InventoryItem } from '~/stores/inventory'
import { useToast } from '~/composables/useToast'

interface Props {
  modelValue: boolean
  item: InventoryItem | null
  folderId: string
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'discount-applied': []
}>()

const inventoryStore = useInventoryStore()
const toast = useToast()

const discountType = ref<'percentage' | 'amount'>('percentage')
const discountValue = ref<number>(0)
const isApplying = ref(false)

const getItemName = (item: InventoryItem): string => {
  const nameFields = ['name', 'Name', 'item', 'Item', 'title', 'Title']
  for (const field of nameFields) {
    if (item[field]) return String(item[field])
  }
  return `Item ${item.id.slice(0, 8)}`
}

const getOriginalPrice = (item: InventoryItem): number => {
  return item.originalPrice || inventoryStore.getItemPrice(item) || 0
}

const calculateDiscountedPrice = (): number => {
  if (!props.item || !discountValue.value || discountValue.value <= 0) return 0
  
  const originalPrice = getOriginalPrice(props.item)
  if (discountType.value === 'percentage') {
    const discount = (originalPrice * discountValue.value) / 100
    return Math.round((originalPrice - discount) * 100) / 100
  } else {
    return Math.round((originalPrice - discountValue.value) * 100) / 100
  }
}

const isValid = computed(() => {
  if (!props.item || !discountValue.value || discountValue.value <= 0) return false
  
  const originalPrice = getOriginalPrice(props.item)
  
  if (discountType.value === 'percentage') {
    return discountValue.value >= 0 && discountValue.value <= 100
  } else {
    return discountValue.value >= 0 && discountValue.value <= originalPrice
  }
})

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

const handleApplyDiscount = async () => {
  if (!isValid.value || !props.item) return

  isApplying.value = true
  try {
    await inventoryStore.applyDiscount(
      props.folderId,
      props.item.id,
      discountType.value,
      discountValue.value
    )
    toast.success('Discount applied successfully!')
    emit('discount-applied')
    handleCancel()
  } catch (error: any) {
    toast.error(error.message || 'Failed to apply discount')
  } finally {
    isApplying.value = false
  }
}

const handleCancel = () => {
  discountType.value = 'percentage'
  discountValue.value = 0
  emit('update:modelValue', false)
}
</script>

