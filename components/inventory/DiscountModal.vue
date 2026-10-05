<template>
  <SDialog
      placement="right"
    :open="props.modelValue"
    title="Apply discount"
    size="md"
    @update:open="(value: boolean) => emit('update:modelValue', value)"
  >
    <SForm v-if="item">
      <SFormSection>
        <dl class="s-sheet-summary">
          <div class="s-sheet-summary__row">
            <dt>Product</dt>
            <dd>{{ getItemName(item) }}</dd>
          </div>
          <div class="s-sheet-summary__row">
            <dt>Current price</dt>
            <dd>{{ currencySymbol }}{{ formatCurrency(getOriginalPrice(item)) }}</dd>
          </div>
        </dl>
      </SFormSection>

      <SFormSection>
        <div class="s-field">
          <span :id="discountTypeLabelId" class="s-field__label">Discount type</span>
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
          :hint="
            discountType === 'percentage'
              ? '0-100'
              : `Max ${currencySymbol}${formatCurrency(getOriginalPrice(item))}`
          "
        >
          <SInput
            v-model="discountValue"
            type="number"
            :min="0"
            :max="discountType === 'percentage' ? 100 : getOriginalPrice(item)"
            step="any"
            :placeholder="discountType === 'percentage' ? '0' : '0.00'"
          >
            <template #prefix>{{ discountType === 'percentage' ? '%' : currencySymbol }}</template>
          </SInput>
        </SField>
      </SFormSection>

      <SFormSection
        v-if="discountValue != null && discountValue > 0 && isValid"
        fixed
      >
        <h3 class="s-form-section__title">Preview</h3>
        <dl class="s-sheet-summary">
          <div class="s-sheet-summary__row">
            <dt>Original</dt>
            <dd>{{ currencySymbol }}{{ formatCurrency(getOriginalPrice(item)) }}</dd>
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
            <dd>{{ currencySymbol }}{{ formatCurrency(calculateDiscountedPrice()) }}</dd>
          </div>
        </dl>
      </SFormSection>
    </SForm>

    <template #footer>
      <SDialogActions
        :primary-label="isApplying ? 'Applying…' : 'Apply discount'"
        :primary-disabled="!isValid || isApplying"
        @cancel="handleCancel"
        @primary="handleApplyDiscount"
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

const discountTypeLabelId = `discount-type-${useId()}`

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
