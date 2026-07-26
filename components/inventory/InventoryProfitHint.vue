<template>
  <span
    v-if="label"
    :class="[
      inline ? 'inline' : 'block',
      'tabular-nums text-gray-500 dark:text-gray-400',
      inline ? 'text-[10px] leading-none' : 'text-[10px] leading-snug',
      className,
    ]"
  >
    <span v-if="inline" class="text-gray-300 dark:text-gray-600" aria-hidden="true"> · </span
    >{{ label }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { InventoryItem } from '~/stores/inventory'
import { getItemGrossProfit, getItemMarginPercent, formatMarginPercent } from '~/utils/inventory-item-cost'
import { usePermissions } from '~/composables/usePermissions'
import { usePreferences } from '~/composables/usePreferences'

const props = withDefaults(
  defineProps<{
    item: InventoryItem
    inline?: boolean
    className?: string
  }>(),
  { inline: false, className: '' }
)

const { canViewProfitAndCost } = usePermissions()
const { formatCurrency } = usePreferences()

const label = computed(() => {
  if (!canViewProfitAndCost.value) return null
  const margin = getItemMarginPercent(props.item)
  if (margin === null) return null
  if (props.inline) {
    return formatMarginPercent(margin)
  }
  const profit = getItemGrossProfit(props.item)
  if (profit === null) return null
  const profitPrefix = profit >= 0 ? '+' : ''
  return `${profitPrefix}${formatCurrency(profit)} · ${formatMarginPercent(margin)}`
})
</script>
