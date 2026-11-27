<template>
  <div class="s-losses">
    <SCard v-if="store.error">
      <SEmptyState title="Couldn't load stock losses" :description="store.error">
        <template #icon><TriangleAlert :size="24" :stroke-width="1.75" /></template>
        <template #actions>
          <SButton @click="store.fetchWriteOffs(true)">Try again</SButton>
        </template>
      </SEmptyState>
    </SCard>

    <template v-else>
      <dl class="s-metrics" aria-label="Stock losses summary">
        <div class="s-metrics__item">
          <dt class="s-metrics__label">Loss at cost</dt>
          <dd class="s-metrics__value" :class="{ 's-metrics__value--error': totalLoss > 0 }">
            {{ formatCurrency(totalLoss) }}
          </dd>
        </div>
        <div class="s-metrics__item">
          <dt class="s-metrics__label">Write-offs</dt>
          <dd class="s-metrics__value">{{ inPeriod.length }}</dd>
        </div>
        <div class="s-metrics__item">
          <dt class="s-metrics__label">Units lost</dt>
          <dd class="s-metrics__value">{{ unitsLost }}</dd>
        </div>
        <div v-if="grossProfit !== null" class="s-metrics__item">
          <dt class="s-metrics__label">Gross profit after losses</dt>
          <dd class="s-metrics__value">{{ formatCurrency(grossProfit - totalLoss) }}</dd>
        </div>
      </dl>

      <SCard v-if="inPeriod.length === 0">
        <SEmptyState
          title="No stock written off"
          :description="`Nothing was written off in the ${periodLabel.toLowerCase()}. Write off damaged or lost stock from an item's menu in Inventory, or from Returns.`"
        >
          <template #icon><PackageMinus :size="24" :stroke-width="1.75" /></template>
        </SEmptyState>
      </SCard>

      <template v-else>
        <SCard title="By reason" :description="periodLabel">
          <ul class="s-losses__reasons">
            <li v-for="row in byReason" :key="row.reason" class="s-losses__reason">
              <div class="s-losses__reason-head">
                <span>{{ WRITE_OFF_REASON_LABELS[row.reason] }}</span>
                <span class="s-losses__reason-value">
                  {{ formatCurrency(row.cost) }}
                  <span class="s-losses__muted">· {{ row.count }}</span>
                </span>
              </div>
              <span class="s-meter" role="img" :aria-label="`${row.share}% of losses`">
                <span class="s-meter__fill" :style="{ width: `${row.share}%` }" />
              </span>
            </li>
          </ul>
          <p v-if="uncostedCount" class="s-losses__muted s-losses__note">
            {{ uncostedCount }} write-off{{ uncostedCount === 1 ? ' has' : 's have' }} no cost
            recorded and {{ uncostedCount === 1 ? "isn't" : "aren't" }} in the totals. Add unit
            costs on inventory items to value losses.
          </p>
        </SCard>

        <!-- Phone: one row per write-off -->
        <SCard flush class="s-only-sm" aria-label="Write-offs">
          <ul class="s-list">
            <li v-for="row in inPeriod" :key="row.id">
              <div class="s-list__item">
                <div class="s-list__main">
                  <span class="s-list__primary">{{ row.item.name }}</span>
                  <span class="s-list__secondary">
                    {{ WRITE_OFF_REASON_LABELS[row.reason] }} · {{ row.quantity }}
                    {{ row.quantity === 1 ? 'unit' : 'units' }}
                    <template v-if="row.createdAt">
                      · {{ formatSaleWhen(row.createdAt).label }}</template
                    >
                  </span>
                </div>
                <div class="s-list__end">
                  <span class="s-list__value">{{
                    row.costValue === null ? EMPTY_CELL : formatCurrency(row.costValue)
                  }}</span>
                </div>
              </div>
            </li>
          </ul>
        </SCard>

        <!-- Tablet and desktop: table -->
        <section class="s-table-card s-hide-sm" aria-label="Write-offs">
          <div class="s-table-wrap">
            <table class="s-table">
              <thead>
                <tr>
                  <th scope="col">Item</th>
                  <th scope="col">Reason</th>
                  <th scope="col" class="s-hide-md">From</th>
                  <th scope="col" class="s-table__num">Units</th>
                  <th scope="col" class="s-table__num">Loss</th>
                  <th scope="col" class="s-hide-sm">Date</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in inPeriod" :key="row.id">
                  <td>
                    <span class="s-table__primary">{{ row.item.name }}</span>
                    <span class="s-table__secondary">{{ itemLine(row) }}</span>
                  </td>
                  <td>
                    <span class="s-table__primary">{{ WRITE_OFF_REASON_LABELS[row.reason] }}</span>
                    <span v-if="row.note" class="s-table__secondary">{{ row.note }}</span>
                  </td>
                  <td class="s-hide-md">
                    <span class="s-table__primary">{{ WRITE_OFF_SOURCE_LABELS[row.source] }}</span>
                    <span v-if="sourceDetail(row)" class="s-table__secondary">{{
                      sourceDetail(row)
                    }}</span>
                  </td>
                  <td class="s-table__num">{{ row.quantity }}</td>
                  <td class="s-table__num">
                    {{ row.costValue === null ? EMPTY_CELL : formatCurrency(row.costValue) }}
                  </td>
                  <td class="s-hide-sm s-table__nowrap">
                    <span v-if="row.createdAt" :title="formatSaleWhen(row.createdAt).title">{{
                      formatSaleWhen(row.createdAt).label
                    }}</span>
                    <template v-else>{{ EMPTY_CELL }}</template>
                    <span class="s-table__secondary">{{ row.createdByName }}</span>
                  </td>
                </tr>
              </tbody>
              <!-- What every write-off in the period adds up to -->
              <tfoot class="s-table__totals">
                <tr>
                  <td>
                    <span class="s-table__totals-label">
                      {{ inPeriod.length }} {{ inPeriod.length === 1 ? 'write-off' : 'write-offs' }}
                    </span>
                  </td>
                  <td />
                  <td class="s-hide-md" />
                  <td class="s-table__num">
                    <span class="s-table__totals-value">{{ unitsLost }}</span>
                  </td>
                  <td class="s-table__num">
                    <span class="s-table__totals-value">{{ formatCurrency(totalLoss) }}</span>
                  </td>
                  <td class="s-hide-sm" />
                </tr>
              </tfoot>
            </table>
          </div>
        </section>
      </template>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import { PackageMinus, TriangleAlert } from '~/icons'
import SButton from '~/components/s/SButton.vue'
import SCard from '~/components/s/SCard.vue'
import SEmptyState from '~/components/s/SEmptyState.vue'
import { useWriteOffsStore } from '~/stores/writeOffs'
import { useStoresStore } from '~/stores/stores'
import { usePreferences } from '~/composables/usePreferences'
import { EMPTY_CELL } from '~/utils/ui-empty'
import { stockItemDetailSummary } from '~/utils/stock-item-details'
import { formatSaleWhen } from '~/utils/sale-display'
import {
  WRITE_OFF_REASON_LABELS,
  WRITE_OFF_SOURCE_LABELS,
  type StockWriteOff,
  type WriteOffReason,
} from '~/types/stock-write-offs'

/** Stock written off in the Reports period: totals, a breakdown by reason, and every write-off. */
const props = defineProps<{
  period: 'daily' | 'weekly' | 'monthly'
  periodLabel: string
  /** Gross profit for the same period, when costs are tracked; shows profit after losses. */
  grossProfit: number | null
}>()

const store = useWriteOffsStore()
const storesStore = useStoresStore()
const { formatCurrency } = usePreferences()

/** Same windows as the rest of Reports: 30 days, 12 weeks, 12 months. */
const cutoff = computed(() => {
  const d = new Date()
  if (props.period === 'daily') d.setDate(d.getDate() - 30)
  else if (props.period === 'weekly') d.setDate(d.getDate() - 84)
  else d.setMonth(d.getMonth() - 12)
  return d.getTime()
})

const inPeriod = computed(() =>
  store.writeOffs.filter((w) => w.createdAt && new Date(w.createdAt).getTime() >= cutoff.value)
)
const totalLoss = computed(() => inPeriod.value.reduce((sum, w) => sum + (w.costValue ?? 0), 0))
const unitsLost = computed(() => inPeriod.value.reduce((sum, w) => sum + w.quantity, 0))
const uncostedCount = computed(() => inPeriod.value.filter((w) => w.costValue === null).length)

const byReason = computed(() => {
  const groups = new Map<WriteOffReason, { cost: number; count: number }>()
  for (const w of inPeriod.value) {
    const g = groups.get(w.reason) ?? { cost: 0, count: 0 }
    g.cost += w.costValue ?? 0
    g.count += 1
    groups.set(w.reason, g)
  }
  const max = Math.max(1, ...[...groups.values()].map((g) => g.cost))
  return [...groups.entries()]
    .map(([reason, g]) => ({ reason, ...g, share: Math.round((g.cost / max) * 100) }))
    .sort((a, b) => b.cost - a.cost || b.count - a.count)
})

function itemLine(row: StockWriteOff) {
  return [stockItemDetailSummary(row.item.details, 2), row.item.folderName]
    .filter(Boolean)
    .join(' · ')
}

function sourceDetail(row: StockWriteOff) {
  if (row.customerReturn) {
    return `#${row.customerReturn.receiptNumber} · ${row.customerReturn.customerName}`
  }
  if (row.supplierReturn) return row.supplierReturn.supplierName
  return ''
}

watch(
  () => storesStore.currentStoreId,
  (id, prev) => {
    if (id) void store.fetchWriteOffs(prev !== undefined && id !== prev)
  },
  { immediate: true }
)
</script>

<style scoped>
.s-losses {
  display: flex;
  flex-direction: column;
  gap: var(--s-space-3);
}

.s-losses__reasons {
  display: flex;
  flex-direction: column;
  gap: var(--s-space-2);
  margin: 0;
  padding: 0;
  list-style: none;
}

.s-losses__reason {
  display: flex;
  flex-direction: column;
  gap: var(--s-space-half);
}

.s-losses__reason-head {
  display: flex;
  justify-content: space-between;
  gap: var(--s-space-2);
  color: var(--s-text);
  font: var(--s-text-small);
}

.s-losses__reason-value {
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.s-losses__muted {
  color: var(--s-text-muted);
  font-weight: 400;
}

.s-losses__note {
  margin: var(--s-space-2) 0 0;
  font: var(--s-text-small);
}
</style>
