<template>
  <SidePanel
    :model-value="props.modelValue"
    title="Apply bulk discount"
    size="lg"
    dense
    @update:model-value="(value: boolean) => emit('update:modelValue', value)"
  >
    <IosForm layout="fill">
      <IosFormSection fixed>
        <p class="dash-drawer-callout">
          This discount will be applied to
          <strong class="font-medium text-gray-900 dark:text-gray-100">{{ selectedItems.length }}</strong>
          selected product{{ selectedItems.length !== 1 ? 's' : '' }}.
        </p>
      </IosFormSection>

      <IosFormSection fixed>
        <IosFormField label="Discount type" required>
          <div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <button
              type="button"
              @click="discountType = 'percentage'"
              :class="[
                'rounded-lg px-3 py-2.5 text-center transition-all',
                discountType === 'percentage'
                  ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                  : 'bg-gray-50/80 text-gray-900 dark:bg-white/[0.04] dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-white/[0.08]',
              ]"
            >
              <p class="text-sm font-medium">Percentage</p>
              <p class="mt-1 text-xs opacity-70">e.g., 10%</p>
            </button>
            <button
              type="button"
              @click="discountType = 'amount'"
              :class="[
                'rounded-lg px-3 py-2.5 text-center transition-all',
                discountType === 'amount'
                  ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                  : 'bg-gray-50/80 text-gray-900 dark:bg-white/[0.04] dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-white/[0.08]',
              ]"
            >
              <p class="text-sm font-medium">Fixed amount</p>
              <p class="mt-1 text-xs opacity-70">e.g., {{ currencySymbol }}5.00</p>
            </button>
          </div>
        </IosFormField>

        <IosFormField
          label="Discount value"
          required
          :hint="
            discountType === 'percentage'
              ? 'Enter a value between 0 and 100.'
              : 'Enter a fixed amount to deduct from each product.'
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
              {{ currencySymbol }}
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

      <IosFormSection
        v-if="discountValue && discountValue > 0 && previewItems.length > 0"
        fixed
      >
        <p class="dash-drawer-label">
          Preview (first {{ Math.min(3, previewItems.length) }})
        </p>
        <div :class="pickListClass">
          <div :class="[pickListScrollClass, 'max-h-64']">
            <div
              v-for="(item, index) in previewItems.slice(0, 3)"
              :key="item.id || index"
              :class="[pickRowClass, '!cursor-default hover:!bg-transparent', 'flex-col !items-start gap-1']"
            >
              <p :class="pickRowTitleClass">{{ getItemName(item) }}</p>
              <div class="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                <div class="flex justify-between gap-4">
                  <span>Original</span>
                  <span>{{ currencySymbol }}{{ formatCurrency(getItemPrice(item)) }}</span>
                </div>
                <div class="flex justify-between gap-4 text-red-600 dark:text-red-400">
                  <span>Discount</span>
                  <span>
                    {{
                      discountType === 'percentage'
                        ? `${discountValue}%`
                        : `−${currencySymbol}${formatCurrency(discountValue)}`
                    }}
                  </span>
                </div>
                <div class="flex justify-between gap-4 font-semibold text-gray-900 dark:text-gray-100">
                  <span>New price</span>
                  <span>{{ currencySymbol }}{{ formatCurrency(calculateItemDiscountedPrice(item)) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <p
          v-if="selectedItems.length > 3"
          class="dash-drawer-hint mt-2 text-center"
        >
          … and {{ selectedItems.length - 3 }} more product{{
            selectedItems.length - 3 !== 1 ? 's' : ''
          }}
        </p>
      </IosFormSection>

      <IosFormSection v-if="discountValue && discountValue > 0" fixed>
        <p class="dash-drawer-hint">
          Items without a valid price will be skipped automatically.
        </p>
      </IosFormSection>
    </IosForm>

    <template #footer>
      <IosDrawerActions
        :primary-label="bulkDiscountPrimaryLabel"
        :primary-disabled="!isValid || isApplying"
        @cancel="handleCancel"
        @primary="handleApplyBulkDiscount"
      />
    </template>
  </SidePanel>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import SidePanel from '~/components/ui/SidePanel.vue'
import IosDrawerActions from '~/components/ios/IosDrawerActions.vue'
import { IosForm, IosFormSection, IosFormField, IosFormInput } from '~/components/ios/forms'
import { useInventoryStore, type InventoryItem } from '~/stores/inventory'
import { useAppToast } from '~/composables/useAppToast'
import { usePreferences } from '~/composables/usePreferences'

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
const { preferences } = usePreferences()
const currencySymbol = computed(() => preferences.value?.currencySymbol ?? '$')
const {
  pickListClass,
  pickListScrollClass,
  pickRowClass,
  pickRowTitleClass,
} = useDashboardDrawerChrome()

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
  } catch (error: unknown) {
    toast.error(error instanceof Error ? error.message : 'Failed to apply bulk discount')
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
