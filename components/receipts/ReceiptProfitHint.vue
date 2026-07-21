<template>
  <span
    v-if="hint"
    :class="[
      inline ? 'inline' : 'block',
      'text-[10px] tabular-nums leading-snug text-emerald-700 dark:text-emerald-400/90',
      className,
    ]"
  >
    {{ hint }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Receipt } from '~/stores/receipts'
import type { InventoryItem } from '~/stores/inventory'
import { receiptGrossProfitHint } from '~/utils/inventory-item-cost'
import { usePermissions } from '~/composables/usePermissions'
import { useInventoryStore } from '~/stores/inventory'
import { usePreferences } from '~/composables/usePreferences'

const props = withDefaults(
  defineProps<{
    receipt: Receipt
    inline?: boolean
    className?: string
  }>(),
  { inline: false, className: '' }
)

const { canViewProfitAndCost } = usePermissions()
const inventoryStore = useInventoryStore()
const { formatCurrency } = usePreferences()

function lookupInventoryItem(itemId: string): InventoryItem | null {
  for (const list of Object.values(inventoryStore.items)) {
    const hit = list.find((i) => i.id === itemId)
    if (hit) return hit
  }
  return null
}

const hint = computed(() => {
  if (!canViewProfitAndCost.value) return null
  return receiptGrossProfitHint(props.receipt, formatCurrency, lookupInventoryItem)
})
</script>
