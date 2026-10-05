<template>
  <div class="s-c s-field">
    <label class="s-field__label" :for="inputId">
      Unit cost<span v-if="optionalHint" class="s-field__optional">(what you paid)</span>
    </label>
    <div class="s-control">
      <span class="s-control__affix">{{ currencySymbol }}</span>
      <input
        :id="inputId"
        :value="modelValue ?? ''"
        type="number"
        inputmode="decimal"
        step="0.01"
        min="0"
        class="s-control__input"
        placeholder="0.00"
        :aria-describedby="marginPreview !== null && showMarginPreview ? previewId : undefined"
        @input="onInput"
      />
    </div>
    <p v-if="marginPreview !== null && showMarginPreview" :id="previewId" class="s-profit-hint">
      Est. margin {{ marginPreview }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed, useId } from 'vue'
import { formatMarginPercent, getItemGrossProfit, getItemSellPrice } from '~/utils/inventory-item-cost'
import type { InventoryItem } from '~/stores/inventory'
import { usePermissions } from '~/composables/usePermissions'

const props = withDefaults(
  defineProps<{
    modelValue?: number | null
    sellPrice?: number | null
    previewItem?: InventoryItem | null
    optionalHint?: boolean
  }>(),
  {
    modelValue: null,
    sellPrice: null,
    previewItem: null,
    optionalHint: true,
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: number | null]
}>()

const { currencySymbol } = usePreferences()
const { canViewProfitAndCost } = usePermissions()
const showMarginPreview = computed(() => canViewProfitAndCost.value)
const inputId = `unit-cost-${useId()}`
const previewId = `${inputId}-margin`

const marginPreview = computed(() => {
  const cost = props.modelValue
  if (cost === null || cost === undefined || !Number.isFinite(cost)) return null
  const sell =
    props.sellPrice ??
    (props.previewItem ? getItemSellPrice(props.previewItem) : null) ??
    null
  if (sell === null || sell <= 0) return null
  const profit = sell - cost
  const margin = sell > 0 ? (profit / sell) * 100 : null
  const profitLabel = profit >= 0 ? `+${profit.toFixed(0)}` : profit.toFixed(0)
  return `${profitLabel} · ${formatMarginPercent(margin)}`
})

function onInput(event: Event) {
  const raw = (event.target as HTMLInputElement).value
  if (raw === '') {
    emit('update:modelValue', null)
    return
  }
  const n = Number(raw)
  emit('update:modelValue', Number.isFinite(n) ? n : null)
}
</script>
