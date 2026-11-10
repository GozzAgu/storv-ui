<template>
  <div class="s-transfer-panel">
    <ol v-if="facts.length" class="s-transfer-panel__facts">
      <li v-for="fact in facts" :key="fact.label" class="s-transfer-panel__fact">
        <span class="s-transfer-panel__fact-label">{{ fact.label }}</span>
        <span class="s-transfer-panel__fact-value">{{ fact.value }}</span>
      </li>
    </ol>

    <ul class="s-transfer-panel__items" :aria-label="label">
      <li v-for="(row, index) in rows" :key="row.key ?? index" class="s-transfer-panel__item">
        <span class="s-transfer-panel__name">{{ row.name || 'Unnamed item' }}</span>
        <span class="s-transfer-panel__details">
          <template v-if="chipsFor(row).length">
            <span v-for="chip in chipsFor(row)" :key="chip.key" class="s-transfer-panel__detail">
              <span class="s-transfer-panel__detail-label">{{ chip.label }}</span>
              {{ chip.value }}
            </span>
          </template>
          <span v-else class="s-transfer-panel__muted">{{
            row.loading ? 'Loading details…' : '—'
          }}</span>
        </span>
        <span class="s-transfer-panel__qty">× {{ row.quantity ?? 1 }}</span>
      </li>
      <li v-if="rows.length === 0" class="s-transfer-panel__item s-transfer-panel__muted">
        No items recorded on this transfer.
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { stockItemDetailChips, type StockItemRow } from '~/utils/stock-item-details'

withDefaults(
  defineProps<{
    rows: StockItemRow[]
    /** Dates, tracking and notes shown above the items; empty values are left out by the caller. */
    facts?: Array<{ label: string; value: string }>
    label?: string
  }>(),
  { facts: () => [], label: 'Items in transfer' }
)

function chipsFor(row: StockItemRow) {
  return stockItemDetailChips(row.details)
}
</script>

<style scoped>
.s-transfer-panel {
  display: flex;
  flex-direction: column;
  gap: var(--s-space-1-5);
}

.s-transfer-panel__facts {
  display: flex;
  flex-wrap: wrap;
  gap: var(--s-space-half) var(--s-space-3);
  margin: 0;
  padding: 0;
  list-style: none;
  font: var(--s-text-small);
}

.s-transfer-panel__fact {
  display: inline-flex;
  gap: 0.4em;
  min-width: 0;
}

.s-transfer-panel__fact-label {
  color: var(--s-text-muted);
}

.s-transfer-panel__fact-value {
  color: var(--s-text);
  overflow-wrap: anywhere;
}

.s-transfer-panel__items {
  margin: 0;
  padding: 0;
  list-style: none;
  border-top: 1px solid var(--s-divider);
}

.s-transfer-panel__item {
  display: grid;
  grid-template-columns: minmax(120px, 1.2fr) 2fr auto;
  align-items: baseline;
  gap: var(--s-space-2);
  padding: var(--s-space-1) 0;
  border-bottom: 1px solid var(--s-divider);
  font: var(--s-text-small);
}

.s-transfer-panel__item:last-child {
  border-bottom: 0;
}

.s-transfer-panel__name {
  color: var(--s-text);
  font-weight: 500;
  overflow-wrap: anywhere;
}

.s-transfer-panel__details {
  display: flex;
  flex-wrap: wrap;
  gap: 2px var(--s-space-1-5);
  color: var(--s-text-2);
}

.s-transfer-panel__detail {
  white-space: nowrap;
}

.s-transfer-panel__detail-label {
  color: var(--s-text-muted);
}

.s-transfer-panel__qty {
  color: var(--s-text-muted);
  font-variant-numeric: tabular-nums;
  text-align: right;
}

.s-transfer-panel__muted {
  color: var(--s-text-muted);
}

@media (max-width: 640px) {
  .s-transfer-panel__item {
    grid-template-columns: 1fr auto;
    gap: 2px var(--s-space-1);
  }

  .s-transfer-panel__details {
    grid-column: 1 / -1;
    grid-row: 2;
  }
}
</style>
