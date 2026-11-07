<template>
  <ul class="s-stock-items" :aria-label="label">
    <li v-for="(item, index) in items" :key="item.key ?? index" class="s-stock-items__item">
      <div class="s-stock-items__head">
        <span class="s-stock-items__name">{{ item.name || 'Unnamed item' }}</span>
        <span v-if="item.quantity && item.quantity > 1" class="s-stock-items__qty">
          × {{ item.quantity }}
        </span>
        <SBadge v-if="item.badge" size="sm" :tone="item.badgeTone ?? 'neutral'">{{
          item.badge
        }}</SBadge>
      </div>
      <dl v-if="chipsFor(item).length" class="s-stock-items__chips">
        <div v-for="chip in chipsFor(item)" :key="chip.key" class="s-stock-items__chip">
          <dt>{{ chip.label }}</dt>
          <dd>{{ chip.value }}</dd>
        </div>
      </dl>
      <p v-else-if="item.loading" class="s-stock-items__muted">Loading details…</p>
      <p v-else-if="showEmpty" class="s-stock-items__muted">No other details recorded.</p>
    </li>
  </ul>
</template>

<script setup lang="ts">
import SBadge from '~/components/s/SBadge.vue'
import { stockItemDetailChips, type StockItemRow } from '~/utils/stock-item-details'

withDefaults(
  defineProps<{
    items: StockItemRow[]
    label?: string
    /** Say so when an item has nothing beyond its name. */
    showEmpty?: boolean
  }>(),
  { label: 'Items', showEmpty: false }
)

function chipsFor(item: StockItemRow) {
  return stockItemDetailChips(item.details)
}
</script>

<style scoped>
.s-stock-items {
  display: flex;
  flex-direction: column;
  margin: 0;
  padding: 0;
  list-style: none;
}

.s-stock-items__item {
  display: flex;
  flex-direction: column;
  gap: var(--s-space-1);
  padding: var(--s-space-1-5) 0;
  border-bottom: 1px solid var(--s-border);
  min-width: 0;
}

.s-stock-items__item:last-child {
  border-bottom: 0;
}

.s-stock-items__head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--s-space-1);
  min-width: 0;
}

.s-stock-items__name {
  color: var(--s-text);
  font: var(--s-text-body);
  font-weight: 500;
  overflow-wrap: anywhere;
}

.s-stock-items__qty {
  color: var(--s-text-muted);
  font: var(--s-text-small);
  font-variant-numeric: tabular-nums;
}

.s-stock-items__chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--s-space-half) var(--s-space-1);
  margin: 0;
}

.s-stock-items__chip {
  display: inline-flex;
  align-items: baseline;
  gap: 0.3em;
  max-width: 100%;
  padding: 0.125rem 0.5rem;
  border-radius: var(--s-radius-full, 999px);
  background: var(--s-surface-2);
  font: var(--s-text-small);
}

.s-stock-items__chip dt {
  color: var(--s-text-muted);
}

.s-stock-items__chip dt::after {
  content: ':';
}

.s-stock-items__chip dd {
  margin: 0;
  color: var(--s-text);
  font-weight: 500;
  overflow-wrap: anywhere;
}

.s-stock-items__muted {
  margin: 0;
  color: var(--s-text-muted);
  font: var(--s-text-small);
}
</style>
