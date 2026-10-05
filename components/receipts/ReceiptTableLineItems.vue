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

function detailSpecs(item: ReceiptItem): Array<{ label: string; value: string }> {
  const name = item.itemName?.trim().toLowerCase()
  return getProductDetailLines(item, { omitLineItemFields: true, formatMoney: formatCurrency })
    .map((line) => {
      const at = line.indexOf(': ')
      return at === -1
        ? { label: '', value: line }
        : { label: line.slice(0, at), value: line.slice(at + 2) }
    })
    .filter((spec) => spec.value.trim().toLowerCase() !== name)
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
  <ul
    v-if="items && items.length > 0"
    class="s-line-items"
    :class="{ 's-line-items--compact': props.compact }"
  >
    <li v-for="(item, idx) in items" :key="idx" class="s-line-item">
      <div class="s-line-item__main">
        <p class="s-line-item__name">{{ item.itemName }}</p>
        <p class="s-line-item__price">
          <span>{{ item.quantity }} ×</span>
          <s v-if="item.hasDiscount && item.originalPrice != null" class="s-line-item__was">
            {{ formatCurrency(item.originalPrice) }}
          </s>
          <span class="s-line-item__unit">{{ formatCurrency(item.price) }}</span>
          <span v-if="discountLabel(item)" class="s-line-item__discount">
            {{ discountLabel(item) }}
          </span>
        </p>
        <ul v-if="detailSpecs(item).length" class="s-line-item__specs">
          <li v-for="spec in detailSpecs(item)" :key="spec.label + spec.value" class="s-line-item__spec">
            <span v-if="spec.label" class="s-line-item__spec-label">{{ spec.label }}</span>
            {{ spec.value }}
          </li>
        </ul>
      </div>
      <div class="s-line-item__amount">
        <span class="s-line-item__total">{{ formatCurrency(lineTotal(item)) }}</span>
        <s
          v-if="item.hasDiscount && item.originalPrice != null && item.quantity > 1"
          class="s-line-item__was"
        >
          {{ formatCurrency(lineSubtotalBeforeDiscount(item)) }}
        </s>
        <span v-if="lineProfitHint(item)" class="s-profit-hint">{{ lineProfitHint(item) }}</span>
      </div>
    </li>
  </ul>
  <p v-else class="s-line-items__empty">
    {{ itemsCountFallback }} item{{ itemsCountFallback === 1 ? '' : 's' }} - details unavailable
  </p>
</template>
