<template>
  <SDialog
      placement="right"
    :open="props.modelValue"
    title="Apply bulk discount"
    size="md"
    @update:open="(value: boolean) => emit('update:modelValue', value)"
  >
    <SForm>
      <SFormSection>
        <p class="s-callout">
          This discount will be applied to
          <strong>{{ selectedItems.length }}</strong>
          selected product{{ selectedItems.length !== 1 ? 's' : '' }}.
        </p>
      </SFormSection>

      <SFormSection>
        <div class="s-field">
          <span :id="discountTypeLabelId" class="s-field__label">
            Discount type<span class="s-field__required" aria-hidden="true">*</span>
          </span>
          <div class="s-choice-grid" role="radiogroup" :aria-labelledby="discountTypeLabelId">
            <button
              type="button"
              role="radio"
              class="s-choice"
              :aria-checked="discountType === 'percentage'"
              @click="discountType = 'percentage'"
            >
              <span class="s-choice__head">
                <span class="s-choice__title">Percentage</span>
                <span class="s-choice__radio" aria-hidden="true" />
              </span>
              <span class="s-choice__description">e.g. 10%</span>
            </button>
            <button
              type="button"
              role="radio"
              class="s-choice"
              :aria-checked="discountType === 'amount'"
              @click="discountType = 'amount'"
            >
              <span class="s-choice__head">
                <span class="s-choice__title">Fixed amount</span>
                <span class="s-choice__radio" aria-hidden="true" />
              </span>
              <span class="s-choice__description">e.g. {{ currencySymbol }}5.00</span>
            </button>
          </div>
        </div>

        <SField
          label="Discount value"
          required
          :hint="
            discountType === 'percentage'
              ? 'Enter a value between 0 and 100.'
              : 'Enter a fixed amount to deduct from each product.'
          "
        >
          <SInput
            v-model="discountValue"
            type="number"
            :min="0"
            :max="discountType === 'percentage' ? 100 : undefined"
            step="any"
            :placeholder="discountType === 'percentage' ? '10' : '5.00'"
          >
            <template #prefix>{{ discountType === 'percentage' ? '%' : currencySymbol }}</template>
          </SInput>
        </SField>
      </SFormSection>

      <SFormSection
        v-if="discountValue && discountValue > 0 && previewItems.length > 0"
        fixed
      >
        <h3 class="s-form-section__title">
          Preview (first {{ Math.min(3, previewItems.length) }})
        </h3>
        <div :class="pickListClass">
          <div :class="pickListScrollClass">
            <div
              v-for="(item, index) in previewItems.slice(0, 3)"
              :key="item.id || index"
              :class="[pickRowClass, 's-pick__row--static', 's-pick__row--stacked']"
            >
              <p :class="pickRowTitleClass">{{ getItemName(item) }}</p>
              <dl class="s-sheet-summary">
                <div class="s-sheet-summary__row">
                  <dt>Original</dt>
                  <dd>{{ currencySymbol }}{{ formatCurrency(getItemPrice(item)) }}</dd>
                </div>
                <div class="s-sheet-summary__row s-sheet-summary__row--discount">
                  <dt>Discount</dt>
                  <dd>
                    {{
                      discountType === 'percentage'
                        ? `${discountValue}%`
                        : `−${currencySymbol}${formatCurrency(discountValue)}`
                    }}
                  </dd>
                </div>
                <div class="s-sheet-summary__row s-sheet-summary__row--total">
                  <dt>New price</dt>
                  <dd>{{ currencySymbol }}{{ formatCurrency(calculateItemDiscountedPrice(item)) }}</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
        <p v-if="selectedItems.length > 3" class="s-form-meta">
          … and {{ selectedItems.length - 3 }} more product{{
            selectedItems.length - 3 !== 1 ? 's' : ''
          }}
        </p>
      </SFormSection>

      <SFormSection v-if="discountValue && discountValue > 0" fixed>
        <p class="s-form-meta">
          Items without a valid price will be skipped automatically.
        </p>
      </SFormSection>
    </SForm>

    <template #footer>
      <SDialogActions
        :primary-label="bulkDiscountPrimaryLabel"
        :primary-disabled="!isValid || isApplying"
        @cancel="handleCancel"
        @primary="handleApplyBulkDiscount"
      />
    </template>
  </SDialog>
</template>

<script setup lang="ts">
import SDialog from '~/components/s/SDialog.vue'
import SDialogActions from '~/components/s/SDialogActions.vue'
import SField from '~/components/s/SField.vue'
import SForm from '~/components/s/SForm.vue'
import SFormSection from '~/components/s/SFormSection.vue'
import SInput from '~/components/s/SInput.vue'
import { ref, computed, useId } from 'vue'
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

const discountTypeLabelId = `bulk-discount-type-${useId()}`

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
