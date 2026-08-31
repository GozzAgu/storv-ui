<template>
  <Modal
    :model-value="props.modelValue"
    title="Apply Bulk Discount"
    size="lg"
    @update:model-value="(value: boolean) => emit('update:modelValue', value)"
  >
    <template #default>
      <IosForm layout="fill">
        <IosFormSection fixed>
          <div
            class="p-4 bg-gray-50 dark:bg-white/[0.04] rounded-sm"
          >
            <p class="text-sm text-gray-700 dark:text-gray-300">
              <strong>Bulk Discount:</strong> This discount will be applied to
              <strong>{{ selectedItems.length }}</strong> selected product{{
                selectedItems.length !== 1 ? 's' : ''
              }}.
            </p>
          </div>
        </IosFormSection>

        <IosFormSection title="Discount" fixed>
          <IosFormField label="Discount Type" required>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                @click="discountType = 'percentage'"
                :class="[
                  'p-3 border-0 rounded-sm transition-all text-center',
                  discountType === 'percentage'
                    ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                    : 'bg-gray-50/80 text-gray-900 dark:bg-white/[0.04] dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-white/[0.08]',
                ]"
              >
                <p class="font-medium text-sm">Percentage</p>
                <p class="text-xs opacity-70 mt-1">e.g., 10%</p>
              </button>
              <button
                type="button"
                @click="discountType = 'amount'"
                :class="[
                  'p-3 border-0 rounded-sm transition-all text-center',
                  discountType === 'amount'
                    ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                    : 'bg-gray-50/80 text-gray-900 dark:bg-white/[0.04] dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-white/[0.08]',
                ]"
              >
                <p class="font-medium text-sm">Fixed Amount</p>
                <p class="text-xs opacity-70 mt-1">e.g., $5.00</p>
              </button>
            </div>
          </IosFormField>

          <IosFormField
            label="Discount Value"
            required
            :hint="
              discountType === 'percentage'
                ? `Enter a value between 0 and 100. This percentage will be applied to each product's price.`
                : `Enter a fixed amount. This amount will be deducted from each product's price.`
            "
          >
            <div class="relative">
              <span
                v-if="discountType === 'percentage'"
                class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400"
              >
                %
              </span>
              <span
                v-else
                class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400"
              >
                $
              </span>
              <IosFormInput
                v-model="discountValue"
                type="number"
                :min="0"
                :max="discountType === 'percentage' ? 100 : undefined"
                step="any"
                extra-class="pl-8"
                :placeholder="discountType === 'percentage' ? '10' : '5.00'"
              />
            </div>
          </IosFormField>
        </IosFormSection>

        <!-- Preview Sample -->
        <IosFormSection
          v-if="discountValue && discountValue > 0 && previewItems.length > 0"
          fixed
        >
        <div
          class="p-4 bg-gray-50 dark:bg-white/[0.03] rounded-sm"
        >
          <p class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Preview (showing first {{ Math.min(3, previewItems.length) }} products):
          </p>
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
                    {{
                      discountType === 'percentage'
                        ? `${discountValue}%`
                        : `-$${formatCurrency(discountValue)}`
                    }}
                  </span>
                </div>
                <div
                  class="flex justify-between text-green-600 dark:text-green-400 font-semibold pt-1 border-t border-gray-200"
                >
                  <span>New Price:</span>
                  <span>${{ formatCurrency(calculateItemDiscountedPrice(item)) }}</span>
                </div>
              </div>
            </div>
            <p
              v-if="selectedItems.length > 3"
              class="text-xs text-gray-500 dark:text-gray-400 text-center pt-2"
            >
              ... and {{ selectedItems.length - 3 }} more product{{
                selectedItems.length - 3 !== 1 ? 's' : ''
              }}
            </p>
          </div>
        </div>
        </IosFormSection>

        <IosFormSection v-if="discountValue && discountValue > 0" fixed>
        <div
          class="p-4 bg-amber-50 dark:bg-amber-950/25 rounded-sm"
        >
          <p class="text-xs text-amber-900 dark:text-amber-100">
            <strong>Note:</strong> Items without a valid price will be skipped automatically.
          </p>
        </div>
        </IosFormSection>
      </IosForm>
    </template>

    <template #footer>
      <IosDrawerActions
        :primary-label="bulkDiscountPrimaryLabel"
        :primary-disabled="!isValid || isApplying"
        @cancel="handleCancel"
        @primary="handleApplyBulkDiscount"
      />
    </template>
  </Modal>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import Modal from '~/components/ui/Modal.vue'
import IosDrawerActions from '~/components/ios/IosDrawerActions.vue'
import { IosForm, IosFormSection, IosFormField, IosFormInput } from '~/components/ios/forms'
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
  return props.selectedItems.filter((item) => getItemPrice(item) > 0)
})

const isValid = computed(() => {
  if (!discountValue.value || discountValue.value <= 0) return false

  if (discountType.value === 'percentage') {
    return discountValue.value >= 0 && discountValue.value <= 100
  } else {
    return discountValue.value >= 0
  }
})

const bulkDiscountPrimaryLabel = computed(() => {
  if (isApplying.value) return 'Applying...'
  const count = props.selectedItems.length
  return `Apply to ${count} product${count !== 1 ? 's' : ''}`
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
    const itemIds = props.selectedItems.map((item) => item.id)
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
