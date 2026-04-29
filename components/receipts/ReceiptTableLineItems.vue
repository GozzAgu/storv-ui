<script setup lang="ts">
import type { ReceiptItem } from '~/stores/receipts'
import { getProductDetailLines } from '~/composables/useReceiptProductDetails'

const props = withDefaults(
  defineProps<{
    items: ReceiptItem[] | undefined | null
    itemsCountFallback?: number
    /** Tighter spacing for mobile cards */
    compact?: boolean
  }>(),
  { compact: false, itemsCountFallback: 0 }
)

const { formatCurrency } = usePreferences()

function lineTotal(item: ReceiptItem) {
  return item.price * item.quantity
}

function lineSubtotalBeforeDiscount(item: ReceiptItem) {
  if (item.hasDiscount && item.originalPrice != null) {
    return item.originalPrice * item.quantity
  }
  return lineTotal(item)
}
</script>

<template>
  <div v-if="items && items.length > 0" :class="compact ? 'space-y-1.5' : 'space-y-2'">
    <div
      v-for="(item, idx) in items"
      :key="idx"
      :class="[
        'rounded-sm bg-white/85 shadow-[0_1px_2px_rgba(15,23,42,0.05)] dark:bg-gray-900/55 dark:shadow-none',
        compact ? 'px-2 py-1.5' : 'px-2.5 py-2.5',
      ]"
    >
      <div class="flex items-start justify-between gap-2">
        <p
          :class="[
            'font-medium leading-snug text-gray-900 dark:text-gray-50',
            compact ? 'text-[10px]' : 'text-[11px]',
          ]"
        >
          {{ item.itemName }}
        </p>
        <span
          class="shrink-0 rounded-sm bg-gray-100 px-1.5 py-0.5 tabular-nums text-gray-700 dark:bg-gray-800/90 dark:text-gray-300"
          :class="compact ? 'text-[9px]' : 'text-[10px]'"
        >
          Qty {{ item.quantity }}
        </span>
      </div>

      <ul
        v-if="getProductDetailLines(item).length > 0"
        class="mt-1 space-y-px text-gray-600 dark:text-gray-400"
        :class="compact ? 'text-[9px] leading-snug' : 'text-[10px] leading-snug'"
      >
        <li v-for="(line, dIdx) in getProductDetailLines(item)" :key="dIdx">
          {{ line }}
        </li>
      </ul>

      <p
        v-if="item.hasDiscount"
        class="mt-1 text-gray-500 dark:text-gray-400"
        :class="compact ? 'text-[9px]' : 'text-[10px]'"
      >
        <template v-if="item.discountPercentage != null">
          {{ item.discountPercentage }}% off
        </template>
        <template v-else-if="item.discountAmount != null">
          -{{ formatCurrency(item.discountAmount) }}
        </template>
        <template v-else>Discount applied</template>
      </p>

      <div
        class="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 tabular-nums text-gray-700 dark:text-gray-300"
        :class="compact ? 'text-[9px]' : 'text-[10px]'"
      >
        <span>
          <span class="text-gray-500 dark:text-gray-500">Unit</span>
          <template v-if="item.hasDiscount && item.originalPrice != null">
            <span class="ml-0.5 text-gray-400 line-through dark:text-gray-500">
              {{ formatCurrency(item.originalPrice) }}
            </span>
            <span class="ml-0.5">{{ formatCurrency(item.price) }}</span>
          </template>
          <template v-else>
            <span class="ml-0.5">{{ formatCurrency(item.price) }}</span>
          </template>
        </span>
        <span class="ml-auto rounded-sm bg-gray-100 px-1.5 py-0.5 font-semibold text-gray-900 dark:bg-gray-800/90 dark:text-gray-50">
          <span class="font-normal text-gray-500 dark:text-gray-400">Line</span>
          <template v-if="item.hasDiscount && item.originalPrice != null">
            <span class="text-gray-400 line-through dark:text-gray-500 font-normal">
              {{ formatCurrency(lineSubtotalBeforeDiscount(item)) }}
            </span>
            {{ ' ' }}
          </template>
          {{ formatCurrency(lineTotal(item)) }}
        </span>
      </div>
    </div>
  </div>
  <p
    v-else
    class="text-gray-500 dark:text-gray-400"
    :class="compact ? 'text-[9px]' : 'text-[10px]'"
  >
    {{ itemsCountFallback }} item{{ itemsCountFallback === 1 ? '' : 's' }} (details unavailable)
  </p>
</template>
