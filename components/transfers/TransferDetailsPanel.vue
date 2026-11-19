<template>
  <div class="s-transfer-panel">
    <dl v-if="facts.length" class="s-transfer-panel__facts">
      <div v-for="fact in facts" :key="fact.label" class="s-transfer-panel__fact">
        <dt class="s-transfer-panel__fact-label">{{ fact.label }}</dt>
        <dd class="s-transfer-panel__fact-value">{{ fact.value }}</dd>
      </div>
    </dl>

    <div class="s-transfer-panel__items-wrap">
      <div class="s-transfer-panel__head" aria-hidden="true">
        <span>Item</span>
        <span>Details</span>
        <span class="s-transfer-panel__qty">Qty</span>
      </div>
      <ul class="s-transfer-panel__items" :aria-label="label">
        <li v-for="(row, index) in rows" :key="row.key ?? index" class="s-transfer-panel__item">
          <span class="s-transfer-panel__name">{{ row.name || 'Unnamed item' }}</span>
          <span class="s-transfer-panel__details">
            <template v-if="chipsFor(row).length">
              <span v-for="chip in chipsFor(row)" :key="chip.key" class="s-transfer-panel__detail">
                <span class="s-transfer-panel__detail-label">{{ chip.label }}</span>
                <span class="s-transfer-panel__detail-value">{{ chip.value }}</span>
              </span>
            </template>
            <span v-else class="s-transfer-panel__muted">{{
              row.loading ? 'Loading details…' : '—'
            }}</span>
          </span>
          <span class="s-transfer-panel__qty">{{ row.quantity ?? 1 }}</span>
        </li>
        <li v-if="rows.length === 0" class="s-transfer-panel__empty s-transfer-panel__muted">
          No items recorded on this transfer.
        </li>
      </ul>
    </div>
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
  gap: var(--s-space-2);
  padding: var(--s-space-2);
  border: 1px solid var(--s-divider);
  border-radius: var(--s-radius-lg);
  background: var(--s-surface-2);
}

/* Timeline: label above value, in even columns that wrap. */
.s-transfer-panel__facts {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: var(--s-space-1-5) var(--s-space-3);
  margin: 0;
}

.s-transfer-panel__fact {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.s-transfer-panel__fact-label {
  color: var(--s-text-muted);
  font: var(--s-text-caption);
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.s-transfer-panel__fact-value {
  margin: 0;
  color: var(--s-text);
  font: var(--s-text-small);
  overflow-wrap: anywhere;
}

/* Items: one aligned row per unit, with its own column headings. */
.s-transfer-panel__head,
.s-transfer-panel__item {
  display: grid;
  grid-template-columns: minmax(140px, 1fr) 3fr 56px;
  align-items: baseline;
  gap: var(--s-space-2);
}

.s-transfer-panel__head {
  padding-bottom: var(--s-space-1);
  border-bottom: 1px solid var(--s-divider);
  color: var(--s-text-muted);
  font: var(--s-text-caption);
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.s-transfer-panel__items {
  margin: 0;
  padding: 0;
  list-style: none;
}

.s-transfer-panel__item {
  padding: var(--s-space-1) 0;
  border-bottom: 1px solid var(--s-divider);
  font: var(--s-text-small);
}

.s-transfer-panel__item:last-child {
  border-bottom: 0;
  padding-bottom: 0;
}

.s-transfer-panel__name {
  color: var(--s-text);
  font-weight: 500;
  overflow-wrap: anywhere;
}

.s-transfer-panel__details {
  display: flex;
  flex-wrap: wrap;
  gap: var(--s-space-half) var(--s-space-2);
  min-width: 0;
}

.s-transfer-panel__detail {
  display: inline-flex;
  gap: 0.35em;
  white-space: nowrap;
}

.s-transfer-panel__detail-label {
  color: var(--s-text-muted);
}

.s-transfer-panel__detail-value {
  color: var(--s-text);
}

.s-transfer-panel__qty {
  color: var(--s-text-2);
  font-variant-numeric: tabular-nums;
  text-align: right;
}

.s-transfer-panel__empty {
  padding: var(--s-space-1) 0 0;
  font: var(--s-text-small);
}

.s-transfer-panel__muted {
  color: var(--s-text-muted);
}

@media (max-width: 640px) {
  .s-transfer-panel {
    padding: var(--s-space-1-5);
  }

  .s-transfer-panel__facts {
    grid-template-columns: 1fr 1fr;
  }

  .s-transfer-panel__head {
    display: none;
  }

  .s-transfer-panel__item {
    grid-template-columns: 1fr auto;
    gap: var(--s-space-half) var(--s-space-1);
  }

  .s-transfer-panel__qty::before {
    content: '× ';
  }

  .s-transfer-panel__details {
    grid-column: 1 / -1;
    grid-row: 2;
  }
}
</style>
