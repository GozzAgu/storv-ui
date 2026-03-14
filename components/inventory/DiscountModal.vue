<template>
  <Modal
    :model-value="props.modelValue"
    size="md"
    @update:model-value="(value: boolean) => emit('update:modelValue', value)"
  >
    <template #header>
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-primary-500/10 dark:bg-primary-400/10 flex items-center justify-center">
          <TagIcon class="w-5 h-5 text-primary-500 dark:text-primary-400" stroke-width="1.75" />
        </div>
        <div>
          <h3 class="text-base font-semibold text-gray-900 dark:text-gray-100 tracking-tight">Apply discount</h3>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Set percentage or fixed amount</p>
        </div>
      </div>
    </template>

    <template #default>
      <div v-if="item" class="space-y-6">
        <!-- Product summary -->
        <div class="rounded-xl bg-gray-50/80 dark:bg-gray-800/50 border border-gray-200/60 dark:border-gray-700/50 p-4">
          <p class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Product</p>
          <p class="text-sm font-semibold text-gray-900 dark:text-gray-100">{{ getItemName(item) }}</p>
          <p class="text-xs text-gray-600 dark:text-gray-400 mt-1.5">
            Current price <span class="font-semibold text-gray-900 dark:text-gray-100">{{ currencySymbol }}{{ formatCurrency(getOriginalPrice(item)) }}</span>
          </p>
        </div>

        <!-- Discount type -->
        <div>
          <p class="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2.5">Discount type</p>
          <div class="grid grid-cols-2 gap-2">
            <button
              type="button"
              @click="discountType = 'percentage'"
              :class="[
                'py-2.5 px-3 rounded-xl text-left transition-all duration-200 border',
                discountType === 'percentage'
                  ? 'border-primary-400/60 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-300 ring-1 ring-primary-400/30'
                  : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50'
              ]"
            >
              <span class="block text-sm font-medium">Percentage</span>
              <span class="block text-[11px] opacity-80 mt-0.5">e.g. 10%</span>
            </button>
            <button
              type="button"
              @click="discountType = 'amount'"
              :class="[
                'py-2.5 px-3 rounded-xl text-left transition-all duration-200 border',
                discountType === 'amount'
                  ? 'border-primary-400/60 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-300 ring-1 ring-primary-400/30'
                  : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50'
              ]"
            >
              <span class="block text-sm font-medium">Fixed amount</span>
              <span class="block text-[11px] opacity-80 mt-0.5">e.g. {{ currencySymbol }}5.00</span>
            </button>
          </div>
        </div>

        <!-- Discount value -->
        <div>
          <p class="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Discount value</p>
          <div class="relative">
            <span
              v-if="discountType === 'percentage'"
              class="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 dark:text-gray-500 font-medium"
            >%</span>
            <span
              v-else
              class="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 dark:text-gray-500 font-medium"
            >{{ currencySymbol }}</span>
            <input
              v-model.number="discountValue"
              type="number"
              :min="0"
              :max="discountType === 'percentage' ? 100 : getOriginalPrice(item)"
              step="any"
              :placeholder="discountType === 'percentage' ? '0' : '0.00'"
              class="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500/25 focus:border-primary-500 transition-colors"
            />
          </div>
          <p v-if="discountType === 'percentage'" class="text-[11px] text-gray-400 dark:text-gray-500 mt-1.5">0–100</p>
          <p v-else class="text-[11px] text-gray-400 dark:text-gray-500 mt-1.5">Max {{ currencySymbol }}{{ formatCurrency(getOriginalPrice(item)) }}</p>
        </div>

        <!-- Preview -->
        <div
          v-if="discountValue != null && discountValue > 0 && isValid"
          class="rounded-xl bg-emerald-50/80 dark:bg-emerald-900/20 border border-emerald-200/60 dark:border-emerald-800/40 p-4"
        >
          <p class="text-xs font-medium text-emerald-800 dark:text-emerald-200 mb-3">Preview</p>
          <div class="space-y-2 text-sm">
            <div class="flex justify-between text-gray-600 dark:text-gray-400">
              <span>Original</span>
              <span class="font-medium text-gray-900 dark:text-gray-100">{{ currencySymbol }}{{ formatCurrency(getOriginalPrice(item)) }}</span>
            </div>
            <div class="flex justify-between text-gray-600 dark:text-gray-400">
              <span>Discount</span>
              <span class="font-medium text-red-600 dark:text-red-400">
                {{ discountType === 'percentage' ? `${discountValue}%` : `−${currencySymbol}${formatCurrency(discountValue)}` }}
              </span>
            </div>
            <div class="flex justify-between pt-2 border-t border-emerald-200/60 dark:border-emerald-800/40">
              <span class="font-medium text-emerald-800 dark:text-emerald-200">New price</span>
              <span class="font-semibold text-emerald-700 dark:text-emerald-300">{{ currencySymbol }}{{ formatCurrency(calculateDiscountedPrice()) }}</span>
            </div>
          </div>
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex items-center justify-end gap-2 w-full">
        <Button variant="outline" size="sm" @click="handleCancel" class="!rounded-xl">Cancel</Button>
        <Button
          variant="primary"
          size="sm"
          class="!rounded-xl"
          @click="handleApplyDiscount"
          :disabled="!isValid || isApplying"
        >
          {{ isApplying ? 'Applying…' : 'Apply discount' }}
        </Button>
      </div>
    </template>
  </Modal>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { TagIcon } from '@heroicons/vue/24/outline'
import Modal from '~/components/ui/Modal.vue'
import Button from '~/components/ui/Button.vue'
import { useInventoryStore, type InventoryItem } from '~/stores/inventory'
import { useToast } from '~/composables/useToast'
import { usePreferences } from '~/composables/usePreferences'

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
const { preferences } = usePreferences()
const currencySymbol = computed(() => preferences.value?.currencySymbol ?? '$')

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

const getOriginalPrice = (item: InventoryItem): number => {
  return item.originalPrice || inventoryStore.getItemPrice(item) || 0
}

const calculateDiscountedPrice = (): number => {
  if (!props.item || !discountValue.value || discountValue.value <= 0) return 0
  const originalPrice = getOriginalPrice(props.item)
  if (discountType.value === 'percentage') {
    const discount = (originalPrice * discountValue.value) / 100
    return Math.round((originalPrice - discount) * 100) / 100
  }
  return Math.round((originalPrice - discountValue.value) * 100) / 100
}

const isValid = computed(() => {
  if (!props.item || !discountValue.value || discountValue.value <= 0) return false
  const originalPrice = getOriginalPrice(props.item)
  if (discountType.value === 'percentage') {
    return discountValue.value >= 0 && discountValue.value <= 100
  }
  return discountValue.value >= 0 && discountValue.value <= originalPrice
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
    toast.success('Discount applied')
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
