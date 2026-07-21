<template>
  <span
    v-if="label"
    :class="[
      inline ? 'inline' : 'block',
      'text-[10px] tabular-nums leading-snug text-emerald-700 dark:text-emerald-400/90',
      className,
    ]"
  >
    {{ label }}
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
  const profit = getItemGrossProfit(props.item)
  if (profit === null) return null
  const margin = getItemMarginPercent(props.item)
  const profitPrefix = profit >= 0 ? '+' : ''
  return `${profitPrefix}${formatCurrency(profit)} · ${formatMarginPercent(margin)} margin`
})
</script>
