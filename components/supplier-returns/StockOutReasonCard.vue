<template>
  <div class="s-why">
    <div class="s-why__head">
      <SBadge :tone="row.tone" size="sm">{{ row.typeLabel }}</SBadge>
      <span class="s-why__item">{{ row.itemName }}</span>
    </div>
    <p class="s-why__headline">{{ row.headline }}</p>
    <dl class="s-record-summary s-record-summary--stack s-why__facts">
      <div v-for="fact in row.facts" :key="fact.label" class="s-record-row">
        <dt>{{ fact.label }}</dt>
        <dd class="s-record-row__value s-why__value">{{ fact.value }}</dd>
      </div>
    </dl>
  </div>
</template>

<script setup lang="ts">
import SBadge from '~/components/s/SBadge.vue'
import type { StockOutEntry } from '~/utils/stock-out-entry'

/** The hover card on a stock out log row: exactly why the item left stock, and the facts. */
defineProps<{ row: StockOutEntry }>()
</script>

<style scoped>
.s-why {
  display: flex;
  flex-direction: column;
  gap: var(--s-space-1);
  padding: var(--s-space-2);
}

.s-why__head {
  display: flex;
  align-items: center;
  gap: var(--s-space-1);
  min-width: 0;
}

.s-why__item {
  overflow: hidden;
  color: var(--s-text);
  font: var(--s-text-body);
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.s-why__headline {
  margin: 0;
  color: var(--s-text);
  font: var(--s-text-body);
}

.s-why__facts {
  margin: 0;
}

.s-why__value {
  text-align: end;
  overflow-wrap: anywhere;
}
</style>
