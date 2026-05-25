<script setup lang="ts">
import type { ReceiptItem } from '~/stores/receipts'
import { getProductDetailLines } from '~/composables/useReceiptProductDetails'
import { formatDiscountPercent } from '~/utils/format-discount'

const props = withDefaults(
 defineProps<{
 items: ReceiptItem[] | undefined | null
 itemsCountFallback?: number
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
</script>

<template>
 <div v-if="items && items.length > 0" class="overflow-x-auto">
 <table class="w-full min-w-[28rem] border-separate border-spacing-0 text-left">
 <thead>
 <tr class="border-b border-gray-200/80 bg-gray-50/95 dark:bg-gray-900/50">
 <th
 class="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-gray-500 dark:text-gray-400"
 :class="compact ? 'pl-2' : ''"
 >
 Product
 </th>
 <th class="w-12 px-2 py-1.5 text-center text-[10px] font-semibold uppercase tracking-[0.1em] text-gray-500 dark:text-gray-400">
 Qty
 </th>
 <th class="w-24 px-2 py-1.5 text-right text-[10px] font-semibold uppercase tracking-[0.1em] text-gray-500 dark:text-gray-400">
 Unit
 </th>
 <th class="w-28 px-3 py-1.5 text-right text-[10px] font-semibold uppercase tracking-[0.1em] text-gray-500 dark:text-gray-400">
 Line total
 </th>
 </tr>
 </thead>
 <tbody class="divide-y divide-gray-100/90 dark:divide-gray-800/70">
 <tr
 v-for="(item, idx) in items"
 :key="idx"
 class="bg-white/60 dark:bg-transparent"
 >
 <td class="px-3 py-2 align-top" :class="compact ? 'pl-2' : ''">
 <p
 class="font-medium leading-snug text-gray-900 dark:text-gray-50"
 :class="compact ? 'text-[11px]' : 'text-xs'"
 >
 {{ item.itemName }}
 </p>
 <p
 v-if="detailSummary(item)"
 class="mt-0.5 leading-snug text-gray-500 dark:text-gray-400"
 :class="compact ? 'text-[9px]' : 'text-[10px]'"
 >
 {{ detailSummary(item) }}
 </p>
 <p
 v-if="discountLabel(item)"
 class="mt-0.5 font-medium text-emerald-700 dark:text-emerald-400/90"
 :class="compact ? 'text-[9px]' : 'text-[10px]'"
 >
 {{ discountLabel(item) }}
 </p>
 </td>
 <td
 class="px-2 py-2 text-center tabular-nums text-gray-700 dark:text-gray-300"
 :class="compact ? 'text-[11px]' : 'text-xs'"
 >
 {{ item.quantity }}
 </td>
 <td class="px-2 py-2 text-right tabular-nums" :class="compact ? 'text-[11px]' : 'text-xs'">
 <span v-if="item.hasDiscount && item.originalPrice != null" class="text-gray-400 line-through dark:text-gray-500">
 {{ formatCurrency(item.originalPrice) }}
 </span>
 <span class="font-medium text-gray-900 dark:text-gray-100">
 {{ formatCurrency(item.price) }}
 </span>
 </td>
 <td class="px-3 py-2 text-right tabular-nums" :class="compact ? 'text-[11px]' : 'text-xs'">
 <span
 v-if="item.hasDiscount && item.originalPrice != null"
 class="mr-1 text-gray-400 line-through dark:text-gray-500"
 >
 {{ formatCurrency(lineSubtotalBeforeDiscount(item)) }}
 </span>
 <span class="font-semibold text-gray-900 dark:text-gray-50">
 {{ formatCurrency(lineTotal(item)) }}
 </span>
 </td>
 </tr>
 </tbody>
 </table>
 </div>
 <p
 v-else
 class="text-gray-500 dark:text-gray-400"
 :class="compact ? 'text-[10px]' : 'text-xs'"
 >
 {{ itemsCountFallback }} item{{ itemsCountFallback === 1 ? '' : 's' }} (details unavailable)
 </p>
</template>
