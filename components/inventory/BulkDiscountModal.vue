<template>
 <Modal
 :model-value="props.modelValue"
 title="Apply Bulk Discount"
 size="lg"
 @update:model-value="(value: boolean) => emit('update:modelValue', value)"
 >
 <template #default>
 <div class="space-y-4">
 <div class="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-sm">
 <p class="text-sm text-blue-800 dark:text-blue-200">
 <strong>Bulk Discount:</strong> This discount will be applied to <strong>{{ selectedItems.length }}</strong> selected product{{ selectedItems.length !== 1 ? 's' : '' }}.
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
 :class="[ 'p-3 border-0 rounded-sm transition-all text-center', discountType === 'percentage' ? 'bg-primary-50 dark:bg-primary-900/20' : 'bg-gray-50/80 hover:bg-gray-100 dark:hover:bg-gray-800/50' ]"
 >
 <p class="font-medium text-sm text-gray-900 dark:text-gray-100">Percentage</p>
 <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">e.g., 10%</p>
 </button>
 <button
 type="button"
 @click="discountType = 'amount'"
 :class="[ 'p-3 border-0 rounded-sm transition-all text-center', discountType === 'amount' ? 'bg-primary-50 dark:bg-primary-900/20' : 'bg-gray-50/80 hover:bg-gray-100 dark:hover:bg-gray-800/50' ]"
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
 :max="discountType === 'percentage' ? 100 : undefined"
 step="any"
 :placeholder="discountType === 'percentage' ? '10' : '5.00'"
 class="w-full pl-8 pr-4 py-2 rounded-sm bg-white dark:!bg-dashboard-card text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-400"
 />
 </div>
 <p v-if="discountType === 'percentage'" class="text-xs text-gray-500 dark:text-gray-400 mt-1">
 Enter a value between 0 and 100. This percentage will be applied to each product's price.
 </p>
 <p v-else class="text-xs text-gray-500 dark:text-gray-400 mt-1">
 Enter a fixed amount. This amount will be deducted from each product's price.
 </p>
 </div>

 <!-- Preview Sample -->
 <div v-if="discountValue && discountValue > 0 && previewItems.length > 0" class="p-4 bg-gray-50 dark:!bg-dashboard-card rounded-sm">
 <p class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Preview (showing first {{ Math.min(3, previewItems.length) }} products):</p>
 <div class="space-y-2 max-h-64 overflow-y-auto">
 <div
 v-for="(item, index) in previewItems.slice(0, 3)"
 :key="item.id || index"
 class="p-3 bg-white dark:bg-gray-700 rounded-sm"
 >
 <div class="flex justify-between items-start mb-2">
 <p class="text-sm font-medium text-gray-900 dark:text-gray-100 truncate flex-1">
 {{ getItemName(item) }}
 </p>
 </div>
 <div class="space-y-1 text-xs">
 <div class="flex justify-between text-gray-600 dark:text-gray-400">
 <span>Original:</span>
 <span>${{ formatCurrency(getItemPrice(item)) }}</span>
 </div>
 <div class="flex justify-between text-red-600 dark:text-red-400">
 <span>Discount:</span>
 <span>
 {{ discountType === 'percentage' ? `${discountValue}%` : `-$${formatCurrency(discountValue)}` }}
 </span>
 </div>
 <div class="flex justify-between text-green-600 dark:text-green-400 font-semibold pt-1 border-t border-gray-200">
 <span>New Price:</span>
 <span>${{ formatCurrency(calculateItemDiscountedPrice(item)) }}</span>
 </div>
 </div>
 </div>
 <p v-if="selectedItems.length > 3" class="text-xs text-gray-500 dark:text-gray-400 text-center pt-2">
 ... and {{ selectedItems.length - 3 }} more product{{ selectedItems.length - 3 !== 1 ? 's' : '' }}
 </p>
 </div>
 </div>

 <div v-if="discountValue && discountValue > 0" class="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-sm">
 <p class="text-xs text-yellow-800 dark:text-yellow-200">
 <strong>Note:</strong> Items without a valid price will be skipped automatically.
 </p>
 </div>
 </div>
 </template>

 <template #footer>
 <Button variant="outline" size="sm" @click="handleCancel" class="w-full sm:w-auto !rounded-2xl">Cancel</Button>
 <Button
 variant="primary"
 size="sm"
 extra-class="!rounded-2xl"
 @click="handleApplyBulkDiscount"
 :disabled="!isValid || isApplying"
 class="w-full sm:w-auto"
 >
 <span v-if="isApplying">Applying...</span>
 <span v-else>Apply to {{ selectedItems.length }} Product{{ selectedItems.length !== 1 ? 's' : '' }}</span>
 </Button>
 </template>
 </Modal>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import Modal from '~/components/ui/Modal.vue'
import Button from '~/components/ui/Button.vue'
import { useInventoryStore, type InventoryItem } from '~/stores/inventory'
import { useAppToast } from '~/composables/useAppToast'

interface Props {
 modelValue: boolean
 selectedItems: InventoryItem[]
 folderId: string
}

const props = defineProps<Props>()
const emit = defineEmits<{
 'update:modelValue': [value: boolean]
 'discount-applied': []
}>()

const inventoryStore = useInventoryStore()
const toast = useAppToast()

const discountType = ref<'percentage' | 'amount'>('percentage')
const discountValue = ref<number>(0)
const isApplying = ref(false)

const getItemName = (item: InventoryItem): string => {
 const nameFields = ['name', 'Name', 'product', 'Product', 'title', 'Title']
 for (const field of nameFields) {
 if (item[field]) return String(item[field])
 }
 return `Product ${item.id.slice(0, 8)}`
}

const getItemPrice = (item: InventoryItem): number => {
 return item.originalPrice || inventoryStore.getItemPrice(item) || 0
}

const calculateItemDiscountedPrice = (item: InventoryItem): number => {
 const originalPrice = getItemPrice(item)
 if (discountType.value === 'percentage') {
 const discount = (originalPrice * discountValue.value) / 100
 return Math.round((originalPrice - discount) * 100) / 100
 } else {
 return Math.round((originalPrice - discountValue.value) * 100) / 100
 }
}

const previewItems = computed(() => {
 return props.selectedItems.filter(item => getItemPrice(item) > 0)
})

const isValid = computed(() => {
 if (!discountValue.value || discountValue.value <= 0) return false
 
 if (discountType.value === 'percentage') {
 return discountValue.value >= 0 && discountValue.value <= 100
 } else {
 return discountValue.value >= 0
 }
})

const formatCurrency = (value: number) => {
 return new Intl.NumberFormat('en-US', {
 minimumFractionDigits: 2,
 maximumFractionDigits: 2,
 }).format(value)
}

const handleApplyBulkDiscount = async () => {
 if (!isValid.value || props.selectedItems.length === 0) return

 isApplying.value = true
 try {
 const itemIds = props.selectedItems.map(item => item.id)
 const count = await inventoryStore.applyBulkDiscount(
 props.folderId,
 itemIds,
 discountType.value,
 discountValue.value
 )
 toast.success(`Discount applied successfully to ${count} product${count !== 1 ? 's' : ''}!`)
 emit('discount-applied')
 handleCancel()
 } catch (error: any) {
 toast.error(error.message || 'Failed to apply bulk discount')
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

