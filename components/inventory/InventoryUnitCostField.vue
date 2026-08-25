<template>
  <div class="min-w-0">
    <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
      Unit cost
      <span v-if="optionalHint" class="font-normal text-gray-500 dark:text-gray-400">
        (what you paid)
      </span>
    </label>
    <div class="relative">
      <span
        class="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-500 dark:text-gray-400"
      >
        {{ currencySymbol }}
      </span>
      <input
        :value="modelValue ?? ''"
        type="number"
        step="0.01"
        min="0"
        class="w-full pl-7 pr-2.5 py-1.5 text-xs rounded-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary-500/50 transition-all"
        placeholder="0.00"
        @input="onInput"
      />
    </div>
    <p v-if="marginPreview !== null && showMarginPreview" class="mt-1 text-[10px] tabular-nums text-emerald-700 dark:text-emerald-400/90">
      Est. margin {{ marginPreview }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
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
