<template>
  <SidePanel
    :model-value="props.modelValue"
    title="Apply discount"
    size="md"
    dense
    @update:model-value="(value: boolean) => emit('update:modelValue', value)"
  >
    <IosForm v-if="item" layout="fill">
      <IosFormSection fixed>
        <p class="dash-drawer-label">Product</p>
        <p class="text-sm font-semibold text-gray-900 dark:text-gray-100">
          {{ getItemName(item) }}
        </p>
        <p class="dash-drawer-hint mt-1">
          Current price
          <span class="font-semibold text-gray-900 dark:text-gray-100"
            >{{ currencySymbol }}{{ formatCurrency(getOriginalPrice(item)) }}</span
          >
        </p>
      </IosFormSection>

      <IosFormSection fixed>
        <IosFormField label="Discount type">
          <div class="grid grid-cols-2 gap-2">
            <button
              type="button"
              @click="discountType = 'percentage'"
              :class="[
                'rounded-lg px-3 py-2.5 text-left transition-all duration-200',
                discountType === 'percentage'
                  ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                  : 'bg-gray-50/80 text-gray-600 dark:bg-white/[0.04] dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/[0.08]',
              ]"
            >
              <span class="block text-sm font-medium">Percentage</span>
              <span class="mt-0.5 block text-[11px] opacity-80">e.g. 10%</span>
            </button>
            <button
              type="button"
              @click="discountType = 'amount'"
              :class="[
                'rounded-lg px-3 py-2.5 text-left transition-all duration-200',
                discountType === 'amount'
                  ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                  : 'bg-gray-50/80 text-gray-600 dark:bg-white/[0.04] dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/[0.08]',
              ]"
            >
              <span class="block text-sm font-medium">Fixed amount</span>
              <span class="mt-0.5 block text-[11px] opacity-80"
                >e.g. {{ currencySymbol }}5.00</span
              >
            </button>
          </div>
        </IosFormField>

        <IosFormField
          label="Discount value"
          :hint="
            discountType === 'percentage'
              ? '0-100'
              : `Max ${currencySymbol}${formatCurrency(getOriginalPrice(item))}`
          "
        >
          <div class="relative">
            <span
              v-if="discountType === 'percentage'"
              class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-400 dark:text-gray-500"
              >%</span
            >
            <span
              v-else
              class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-400 dark:text-gray-500"
              >{{ currencySymbol }}</span
            >
            <IosFormInput
              v-model="discountValue"
              type="number"
              :min="0"
              :max="discountType === 'percentage' ? 100 : getOriginalPrice(item)"
              step="any"
              extra-class="pl-9"
              :placeholder="discountType === 'percentage' ? '0' : '0.00'"
            />
          </div>
        </IosFormField>
      </IosFormSection>

      <IosFormSection
        v-if="discountValue != null && discountValue > 0 && isValid"
        fixed
      >
        <p class="dash-drawer-label">Preview</p>
        <div class="space-y-2 text-sm">
          <div class="flex justify-between text-gray-600 dark:text-gray-400">
            <span>Original</span>
            <span class="font-medium text-gray-900 dark:text-gray-100"
              >{{ currencySymbol }}{{ formatCurrency(getOriginalPrice(item)) }}</span
            >
          </div>
          <div class="flex justify-between text-gray-600 dark:text-gray-400">
            <span>Discount</span>
            <span class="font-medium text-red-600 dark:text-red-400">
              {{
                discountType === 'percentage'
                  ? `${discountValue}%`
                  : `−${currencySymbol}${formatCurrency(discountValue)}`
              }}
            </span>
          </div>
          <div class="flex justify-between border-t border-gray-200/80 pt-2 dark:border-white/10">
            <span class="font-medium text-gray-900 dark:text-gray-100">New price</span>
            <span class="font-semibold text-gray-900 dark:text-gray-100"
              >{{ currencySymbol }}{{ formatCurrency(calculateDiscountedPrice()) }}</span
            >
          </div>
        </div>
      </IosFormSection>
    </IosForm>

    <template #footer>
      <IosDrawerActions
        :primary-label="isApplying ? 'Applying…' : 'Apply discount'"
        :primary-disabled="!isValid || isApplying"
        @cancel="handleCancel"
        @primary="handleApplyDiscount"
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
  item: InventoryItem | null
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
  } catch (error: unknown) {
    toast.error(error instanceof Error ? error.message : 'Failed to apply discount')
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
