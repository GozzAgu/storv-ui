<script setup lang="ts">
import { computed } from 'vue'
import type { ReceiptItem } from '~/stores/receipts'
import type { InventoryItem } from '~/stores/inventory'
import { getProductDetailLines } from '~/composables/useReceiptProductDetails'
import { formatDiscountPercent } from '~/utils/format-discount'
import { usePermissions } from '~/composables/usePermissions'
import { useInventoryStore } from '~/stores/inventory'
import { usePreferences } from '~/composables/usePreferences'
import { resolveReceiptLineUnitCost } from '~/utils/inventory-item-cost'

const props = withDefaults(
  defineProps<{
    items: ReceiptItem[] | undefined | null
    itemsCountFallback?: number
    compact?: boolean
  }>(),
  { compact: false, itemsCountFallback: 0 }
)

const { canViewProfitAndCost } = usePermissions()
const inventoryStore = useInventoryStore()
const { formatCurrency } = usePreferences()

const showProfitHints = computed(() => canViewProfitAndCost.value)

function lookupInventoryItem(itemId: string): InventoryItem | null {
  for (const list of Object.values(inventoryStore.items)) {
    const hit = list.find((i) => i.id === itemId)
    if (hit) return hit
  }
  return null
}

function lineProfitHint(item: ReceiptItem): string | null {
  if (!showProfitHints.value) return null
  const inv = lookupInventoryItem(item.itemId)
  const unitCost = resolveReceiptLineUnitCost(item, inv)
  if (unitCost <= 0) return null
  const profit = lineTotal(item) - unitCost * item.quantity
  const prefix = profit >= 0 ? '+' : ''
  return `${prefix}${formatCurrency(profit)} profit`
}

function lineTotal(item: ReceiptItem) {
  return item.price * item.quantity
}

function lineSubtotalBeforeDiscount(item: ReceiptItem) {
  if (item.hasDiscount && item.originalPrice != null) {
    return item.originalPrice * item.quantity
  }
  return lineTotal(item)
}

function detailSummary(item: ReceiptItem): string {
  const lines = getProductDetailLines(item, {
    omitLineItemFields: true,
    formatMoney: formatCurrency,
  })
  return lines.join(' · ')
}

function discountLabel(item: ReceiptItem): string | null {
  const pct = formatDiscountPercent(item.discountPercentage)
  if (pct) return `${pct}% off`
  if (item.discountAmount != null && item.discountAmount > 0) {
    return `${formatCurrency(item.discountAmount)} off`
  }
  return null
}

const textSize = computed(() => (props.compact ? 'text-[11px]' : 'text-xs'))
const metaSize = computed(() => (props.compact ? 'text-[10px]' : 'text-[11px]'))
</script>

<template>
  <div v-if="items && items.length > 0">
    <div
      class="hidden grid-cols-[minmax(0,1fr)_2.5rem_6.5rem_7rem] gap-x-2 border-b border-gray-100 px-2 pb-1.5 pt-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-gray-400 dark:border-gray-800/80 dark:text-gray-500 sm:grid"
      :class="compact ? 'sm:grid-cols-[minmax(0,1fr)_2rem_5.75rem_6.25rem]' : ''"
    >
      <span>Product</span>
      <span class="text-center">Qty</span>
      <span class="text-right">Unit</span>
      <span class="text-right">Total</span>
    </div>

    <ul class="divide-y divide-gray-100 dark:divide-gray-800/70">
      <li
        v-for="(item, idx) in items"
        :key="idx"
        class="grid grid-cols-1 gap-2 px-2 py-2.5 sm:grid-cols-[minmax(0,1fr)_2.5rem_6.5rem_7rem] sm:items-start sm:gap-x-2 sm:py-2"
        :class="compact ? 'sm:grid-cols-[minmax(0,1fr)_2rem_5.75rem_6.25rem]' : ''"
      >
        <div class="min-w-0">
          <p
            class="font-medium leading-snug text-gray-900 dark:text-gray-50"
            :class="textSize"
          >
            {{ item.itemName }}
          </p>
          <p
            v-if="detailSummary(item)"
            class="mt-0.5 leading-snug text-gray-500 dark:text-gray-400"
            :class="metaSize"
          >
            {{ detailSummary(item) }}
          </p>
          <p
            v-if="discountLabel(item)"
            class="mt-0.5 font-medium text-emerald-700 dark:text-emerald-400/90"
            :class="metaSize"
          >
            {{ discountLabel(item) }}
          </p>
        </div>

        <div
          class="flex items-center justify-between gap-3 sm:block sm:text-center"
        >
          <span class="text-[10px] font-medium uppercase tracking-wide text-gray-400 sm:hidden">
            Qty
          </span>
          <span
            class="tabular-nums text-gray-700 dark:text-gray-300"
            :class="textSize"
          >
            {{ item.quantity }}
          </span>
        </div>

        <div class="flex items-center justify-between gap-3 sm:block sm:text-right">
          <span class="text-[10px] font-medium uppercase tracking-wide text-gray-400 sm:hidden">
            Unit
          </span>
          <div class="tabular-nums leading-tight" :class="textSize">
            <span
              v-if="item.hasDiscount && item.originalPrice != null"
              class="block text-gray-400 line-through dark:text-gray-500"
              :class="metaSize"
            >
              {{ formatCurrency(item.originalPrice) }}
            </span>
            <span class="font-medium text-gray-900 dark:text-gray-100">
              {{ formatCurrency(item.price) }}
            </span>
          </div>
        </div>

        <div class="flex items-center justify-between gap-3 sm:block sm:text-right">
          <span class="text-[10px] font-medium uppercase tracking-wide text-gray-400 sm:hidden">
            Total
          </span>
          <div class="tabular-nums leading-tight" :class="textSize">
            <span
              v-if="item.hasDiscount && item.originalPrice != null"
              class="block text-gray-400 line-through dark:text-gray-500"
              :class="metaSize"
            >
              {{ formatCurrency(lineSubtotalBeforeDiscount(item)) }}
            </span>
            <span class="font-semibold text-gray-900 dark:text-gray-50">
              {{ formatCurrency(lineTotal(item)) }}
            </span>
            <span
              v-if="lineProfitHint(item)"
              class="mt-0.5 block text-[10px] tabular-nums text-emerald-700 dark:text-emerald-400/90"
            >
              {{ lineProfitHint(item) }}
            </span>
          </div>
        </div>
      </li>
    </ul>
  </div>
  <p
    v-else
    class="px-2 py-2 text-gray-500 dark:text-gray-400"
    :class="compact ? 'text-[11px]' : 'text-xs'"
  >
    {{ itemsCountFallback }} item{{ itemsCountFallback === 1 ? '' : 's' }} - details unavailable
  </p>
</template>
