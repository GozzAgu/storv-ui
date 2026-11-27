<template>
  <section class="s-table-card s-dept-table" aria-labelledby="stock-out-title">
    <div class="s-table-card__head">
      <div>
        <h2 id="stock-out-title" class="s-log__title">Stock out log</h2>
        <p class="s-log__hint">
          Every item that left stock other than by a sale, transfer or stock loan, with who did it
          and why. Nothing is removed without a trace.
        </p>
      </div>
      <div class="s-toolbar">
        <SSearch
          v-model="search"
          class="s-toolbar__search"
          placeholder="Search the log"
          label="Search by item, serial number, reason or person"
        />
        <div class="s-toolbar__filter">
          <SSelect v-model="typeFilter" :options="typeOptions" aria-label="Type" />
        </div>
      </div>
    </div>

    <SCard v-if="filtered.length === 0">
      <SEmptyState
        :title="inWindow.length ? 'Nothing matches' : emptyTitle"
        :description="
          inWindow.length
            ? 'Try another item, reason or type.'
            : 'Deleted products, write-offs, customer and supplier returns, and lowered counts will be listed here.'
        "
      >
        <template #icon><History :size="24" :stroke-width="1.75" /></template>
      </SEmptyState>
    </SCard>

    <template v-else>
      <!-- Phone: tap a row for the full reason -->
      <SCard flush class="s-only-sm">
        <ul class="s-list">
          <li v-for="row in visible" :key="row.key">
            <SHoverCard :label="`Why ${row.itemName} is out of stock`" :width="400">
              <template #trigger>
                <span class="s-list__item">
                  <span class="s-list__main">
                    <span class="s-list__primary">{{ row.itemName }}</span>
                    <span class="s-list__secondary">{{ row.what }} · {{ row.why }}</span>
                    <span class="s-list__secondary"
                      >{{ formatSaleWhen(row.at).label }} · {{ row.by }}</span
                    >
                  </span>
                  <span class="s-list__end">
                    <span class="s-list__value"
                      >{{ row.units }} unit{{ row.units === 1 ? '' : 's' }}</span
                    >
                    <SBadge :tone="row.tone" size="sm">{{ row.typeLabel }}</SBadge>
                  </span>
                </span>
              </template>
              <StockOutReasonCard :row="row" />
            </SHoverCard>
          </li>
        </ul>
      </SCard>

      <!-- Tablet and desktop -->
      <div class="s-table-wrap s-hide-sm">
        <table class="s-table">
          <thead>
            <tr>
              <th scope="col">Item</th>
              <th scope="col">What happened</th>
              <th scope="col" class="s-table__num">Units</th>
              <th scope="col" class="s-table__num s-hide-md">Cost</th>
              <th scope="col" class="s-hide-lg">By</th>
              <th scope="col">Date</th>
              <th scope="col"><span class="ds-sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in visible" :key="row.key">
              <td>
                <div class="s-team__cell">
                  <span class="s-dept-table__mark" aria-hidden="true">
                    {{ nameInitials(row.itemName) }}
                  </span>
                  <span class="s-team__cell-text">
                    <span class="s-table__primary">{{ row.itemName }}</span>
                    <span class="s-table__secondary">{{ row.itemLine }}</span>
                  </span>
                </div>
              </td>
              <td>
                <SHoverCard :label="`Why ${row.itemName} is out of stock`" :width="400">
                  <template #trigger>
                    <span class="s-log__why">
                      <span class="s-log__type" :class="`s-log__type--${row.tone}`">{{
                        row.typeLabel
                      }}</span>
                      <span class="s-table__secondary">{{ row.what }} · {{ row.why }}</span>
                    </span>
                  </template>
                  <StockOutReasonCard :row="row" />
                </SHoverCard>
              </td>
              <td class="s-table__num" :class="{ 's-amount--void': row.restored }">
                {{ row.units }}
              </td>
              <td class="s-table__num s-hide-md" :class="{ 's-amount--void': row.restored }">
                {{ row.cost === null ? EMPTY_CELL : formatCurrency(row.cost) }}
              </td>
              <td class="s-hide-lg">
                <span v-if="row.by" class="s-dept-table__manager">
                  <SAvatar :name="row.by" size="sm" />
                  {{ row.by }}
                </span>
                <span v-else class="s-table__muted">{{ EMPTY_CELL }}</span>
              </td>
              <td class="s-table__nowrap s-table__muted" :title="formatSaleWhen(row.at).title">
                {{ formatSaleWhen(row.at).label }}
              </td>
              <td class="s-table__nowrap">
                <SButton
                  v-if="row.restorableId && canRestore"
                  variant="secondary"
                  size="sm"
                  :loading="restoringId === row.restorableId"
                  :disabled="!!restoringId"
                  @click="restore(row.restorableId)"
                >
                  Restore
                </SButton>
                <span v-else-if="row.restored" class="s-log__muted">Restored</span>
              </td>
            </tr>
          </tbody>
          <!-- What everything matching the search and type adds up to (not just what's shown) -->
          <tfoot class="s-table__totals">
            <tr>
              <td>
                <span class="s-table__totals-label">
                  {{ filteredTotals.count }} {{ filteredTotals.count === 1 ? 'entry' : 'entries' }}
                </span>
              </td>
              <td />
              <td class="s-table__num">
                <span class="s-table__totals-value">{{ filteredTotals.units }}</span>
              </td>
              <td class="s-table__num s-hide-md">
                <span class="s-table__totals-value">{{
                  filteredTotals.cost === null ? EMPTY_CELL : formatCurrency(filteredTotals.cost)
                }}</span>
              </td>
              <td class="s-hide-lg" />
              <td />
              <td />
            </tr>
          </tfoot>
        </table>
      </div>
      <div v-if="filtered.length > visible.length" class="s-log__more">
        <SButton variant="ghost" size="sm" @click="limit += 50">
          Show more ({{ filtered.length - visible.length }} left)
        </SButton>
      </div>
    </template>

    <p v-if="olderHidden > 0" class="s-callout s-log__plan">
      {{ olderHidden }} older {{ olderHidden === 1 ? 'entry is' : 'entries are' }} kept safely. Your
      plan shows the last {{ STOCK_OUT_LOG_FREE_DAYS }} days; Medium and up show the full history.
      <NuxtLink v-if="userStore.isSuperAdmin" :to="dashPath('/settings?upgrade=1')"
        >View plans</NuxtLink
      >
    </p>

    <p v-if="error" class="s-field__error s-log__error" role="alert">{{ error }}</p>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { History } from '~/icons'
import SAvatar from '~/components/s/SAvatar.vue'
import SBadge from '~/components/s/SBadge.vue'
import SButton from '~/components/s/SButton.vue'
import SCard from '~/components/s/SCard.vue'
import SEmptyState from '~/components/s/SEmptyState.vue'
import SSearch from '~/components/s/SSearch.vue'
import SSelect from '~/components/s/SSelect.vue'
import SHoverCard from '~/components/s/SHoverCard.vue'
import StockOutReasonCard from '~/components/supplier-returns/StockOutReasonCard.vue'
import type { StockOutEntry, StockOutEntryType } from '~/utils/stock-out-entry'
import { useSupplierReturnsStore } from '~/stores/supplierReturns'
import { useInspectionHoldsStore } from '~/stores/inspectionHolds'
import { useWriteOffsStore } from '~/stores/writeOffs'
import { useStockRemovalsStore } from '~/stores/stockRemovals'
import { useStoresStore } from '~/stores/stores'
import { useUserStore } from '~/stores/user'
import { STOCK_OUT_LOG_FREE_DAYS } from '~/types/subscription'
import { usePreferences } from '~/composables/usePreferences'
import { EMPTY_CELL } from '~/utils/ui-empty'
import { nameInitials } from '~/utils/name-initials'
import { formatSaleWhen } from '~/utils/sale-display'
import { stockItemDetailSummary } from '~/utils/stock-item-details'
import {
  SUPPLIER_RETURN_OUTCOME_LABELS,
  SUPPLIER_RETURN_STATUS_LABELS,
} from '~/types/supplier-returns'
import { WRITE_OFF_REASON_LABELS } from '~/types/stock-write-offs'
import { STOCK_REMOVAL_KIND_LABELS, STOCK_REMOVAL_REASON_LABELS } from '~/types/stock-removals'

/**
 * One chronological list of everything that left stock outside a sale, transfer or loan:
 * supplier returns, customer returns, write-offs, deletions and lowered counts.
 */
const props = withDefaults(
  defineProps<{
    canRestore: boolean
    /** Full history is Medium and up; otherwise the last STOCK_OUT_LOG_FREE_DAYS days show. */
    fullHistory?: boolean
  }>(),
  { fullHistory: true }
)

const userStore = useUserStore()
const { dashPath } = useDashboardPaths()

const supplierReturns = useSupplierReturnsStore()
const holds = useInspectionHoldsStore()
const writeOffs = useWriteOffsStore()
const removals = useStockRemovalsStore()
const storesStore = useStoresStore()
const { formatCurrency } = usePreferences()

const search = ref('')
const typeFilter = ref<'all' | StockOutEntryType>('all')
const limit = ref(50)
const restoringId = ref<string | null>(null)
const error = ref('')

const typeOptions = [
  { value: 'all', label: 'All types' },
  { value: 'supplier', label: 'Supplier returns' },
  { value: 'customer', label: 'Customer returns' },
  { value: 'write_off', label: 'Write-offs' },
  { value: 'deleted', label: 'Deleted products' },
  { value: 'count', label: 'Lowered counts' },
]

function fact(label: string, value: string | number | null | undefined) {
  return value === null || value === undefined || value === ''
    ? []
    : [{ label, value: String(value) }]
}

function money(value: number | null) {
  return value === null ? null : formatCurrency(value)
}

function when(iso: string | null) {
  if (!iso) return null
  return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

function itemFacts(details: Record<string, string | number | boolean>, folderName: string) {
  return [...fact('Details', stockItemDetailSummary(details, 4)), ...fact('Category', folderName)]
}

function line(details: Record<string, string | number | boolean>, folderName: string) {
  return [stockItemDetailSummary(details, 2), folderName].filter(Boolean).join(' · ')
}

const entries = computed<StockOutEntry[]>(() => {
  const out: StockOutEntry[] = []
  for (const r of supplierReturns.returns) {
    const status =
      r.status === 'resolved' && r.outcome
        ? `${SUPPLIER_RETURN_OUTCOME_LABELS[r.outcome]}${r.restockedAt ? ', back in stock' : ''}`
        : SUPPLIER_RETURN_STATUS_LABELS[r.status]
    out.push({
      key: `sr-${r.id}`,
      type: 'supplier',
      typeLabel: 'Supplier return',
      tone: 'info',
      at: r.createdAt,
      itemName: r.item.name,
      itemLine: line(r.item.details, r.item.folderName),
      what: `To ${r.supplierName || 'supplier'} · ${status}`,
      why: r.defect || 'Faulty',
      units: r.item.quantity,
      cost: r.costValue,
      by: r.createdByName,
      search: '',
      restorableId: null,
      restored: false,
      headline: `Sent back to ${r.supplierName || 'the supplier'} as defective`,
      facts: [
        ...fact('Fault', r.defect),
        ...fact('Supplier', r.supplierName),
        ...fact('Reference', r.supplierReference),
        ...fact('Status', status),
        ...(r.customerReturn
          ? fact(
              'Came from',
              `Customer return #${r.customerReturn.receiptNumber} · ${r.customerReturn.customerName}`
            )
          : []),
        ...fact('Units', r.item.quantity),
        ...fact('Cost', money(r.costValue)),
        ...itemFacts(r.item.details, r.item.folderName),
        ...fact('Logged by', r.createdByName),
        ...fact('When', when(r.createdAt)),
      ],
    })
  }
  for (const h of holds.holds) {
    const outcome = {
      held: 'Waiting for inspection',
      restocked: 'Inspected, back on sale',
      to_supplier: 'Inspected, returned to supplier',
      written_off: 'Inspected, written off',
    }[h.status]
    out.push({
      key: `ih-${h.id}`,
      type: 'customer',
      typeLabel: 'Customer return',
      tone: h.status === 'held' ? 'warning' : 'neutral',
      at: h.heldAt,
      itemName: h.item.name,
      itemLine: line(h.item.details, h.item.folderName),
      what: `${h.sale.customerName} on #${h.sale.receiptNumber} · ${outcome}`,
      why: h.complaint || 'No reason given',
      units: h.item.quantity,
      cost: h.item.unitCost === null ? null : h.item.unitCost * h.item.quantity,
      by: h.heldByName,
      search: h.sale.receiptNumber,
      restorableId: null,
      restored: false,
      headline: `${h.sale.customerName} brought it back · ${outcome.toLowerCase()}`,
      facts: [
        ...fact('Customer said', h.complaint || 'No reason given'),
        ...fact('Sale', `#${h.sale.receiptNumber} · ${h.sale.customerName}`),
        ...fact('Outcome', outcome),
        ...fact('Decided by', h.closedByName),
        ...fact('Decided', when(h.closedAt)),
        ...fact('Units', h.item.quantity),
        ...fact('Cost', money(h.item.unitCost === null ? null : h.item.unitCost * h.item.quantity)),
        ...itemFacts(h.item.details, h.item.folderName),
        ...fact('Held by', h.heldByName),
        ...fact('Returned', when(h.heldAt)),
      ],
    })
  }
  for (const w of writeOffs.writeOffs) {
    out.push({
      key: `wo-${w.id}`,
      type: 'write_off',
      typeLabel: 'Written off',
      tone: 'error',
      at: w.createdAt,
      itemName: w.item.name,
      itemLine: line(w.item.details, w.item.folderName),
      what: WRITE_OFF_REASON_LABELS[w.reason],
      why: w.note || 'No note',
      units: w.quantity,
      cost: w.costValue,
      by: w.createdByName,
      search: '',
      restorableId: null,
      restored: false,
      headline: `Written off as a loss: ${WRITE_OFF_REASON_LABELS[w.reason].toLowerCase()}`,
      facts: [
        ...fact('Reason', WRITE_OFF_REASON_LABELS[w.reason]),
        ...fact('What happened', w.note),
        ...(w.customerReturn
          ? fact(
              'Came from',
              `Customer return #${w.customerReturn.receiptNumber} · ${w.customerReturn.customerName}`
            )
          : []),
        ...(w.customerReturn ? fact('Customer said', w.customerReturn.complaint) : []),
        ...(w.supplierReturn
          ? fact('Came from', `${w.supplierReturn.supplierName} rejected the claim`)
          : []),
        ...fact('Units', w.quantity),
        ...fact('Loss at cost', money(w.costValue)),
        ...itemFacts(w.item.details, w.item.folderName),
        ...fact('Written off by', w.createdByName),
        ...fact('When', when(w.createdAt)),
      ],
    })
  }
  for (const r of removals.removals) {
    const count = r.kind === 'count_reduced'
    out.push({
      key: `rm-${r.id}`,
      type: count ? 'count' : 'deleted',
      typeLabel: STOCK_REMOVAL_KIND_LABELS[r.kind],
      tone: count ? 'warning' : 'neutral',
      at: r.createdAt,
      itemName: r.item.name,
      itemLine: line(r.item.details, r.item.folderName),
      what:
        count && r.before !== null && r.after !== null
          ? `Count ${r.before} → ${r.after}`
          : STOCK_REMOVAL_REASON_LABELS[r.reason],
      why: r.note || (count ? STOCK_REMOVAL_REASON_LABELS[r.reason] : 'No note'),
      units: r.quantity,
      cost: r.costValue,
      by: r.createdByName,
      search: '',
      restorableId: !count && !r.restoredAt ? r.id : null,
      restored: !!r.restoredAt,
      headline: count
        ? `Stock count lowered from ${r.before} to ${r.after}: ${STOCK_REMOVAL_REASON_LABELS[
            r.reason
          ].toLowerCase()}`
        : r.kind === 'category_deleted'
        ? 'Removed when its category was deleted'
        : `Deleted from inventory: ${STOCK_REMOVAL_REASON_LABELS[r.reason].toLowerCase()}`,
      facts: [
        ...fact('Reason', STOCK_REMOVAL_REASON_LABELS[r.reason]),
        ...fact('Note', r.note),
        ...(count ? fact('Count', `${r.before} → ${r.after}`) : []),
        ...fact('Units', r.quantity),
        ...fact('Cost', money(r.costValue)),
        ...itemFacts(r.item.details, r.item.folderName),
        ...fact(count ? 'Changed by' : 'Deleted by', r.createdByName),
        ...fact('When', when(r.createdAt)),
        ...(r.restoredAt ? fact('Restored', when(r.restoredAt)) : []),
      ],
    })
  }
  return out.sort((a, b) => (b.at ?? '').localeCompare(a.at ?? ''))
})

/** Every record is kept on every plan; without full history only the recent ones show. */
const inWindow = computed(() => {
  if (props.fullHistory) return entries.value
  const cutoff = new Date(Date.now() - STOCK_OUT_LOG_FREE_DAYS * 86_400_000).toISOString()
  return entries.value.filter((e) => !e.at || e.at >= cutoff)
})
const olderHidden = computed(() => entries.value.length - inWindow.value.length)

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  return inWindow.value.filter((e) => {
    if (typeFilter.value !== 'all' && e.type !== typeFilter.value) return false
    if (!q) return true
    return [e.itemName, e.itemLine, e.what, e.why, e.by, e.search].some((v) =>
      v.toLowerCase().includes(q)
    )
  })
})
const visible = computed(() => filtered.value.slice(0, limit.value))
/** Restored deletions came back into stock, so they are listed but not counted as stock out. */
const filteredTotals = computed(() => {
  const rows = filtered.value.filter((e) => !e.restored)
  const priced = rows.filter((e) => e.cost !== null)
  return {
    count: filtered.value.length,
    units: rows.reduce((sum, e) => sum + e.units, 0),
    cost: priced.length ? priced.reduce((sum, e) => sum + (e.cost ?? 0), 0) : null,
  }
})
const emptyTitle = computed(() =>
  olderHidden.value
    ? `Nothing in the last ${STOCK_OUT_LOG_FREE_DAYS} days`
    : 'Nothing has left stock yet'
)

watch([search, typeFilter], () => {
  limit.value = 50
})

async function restore(removalId: string) {
  restoringId.value = removalId
  error.value = ''
  try {
    await removals.restore(removalId)
  } catch (err) {
    error.value = (err as { message?: string })?.message || 'Couldn’t restore that product.'
  } finally {
    restoringId.value = null
  }
}

// Write-offs and removals aren't loaded by the rest of the page.
watch(
  () => storesStore.currentStoreId,
  (id, prev) => {
    if (!id) return
    const switched = prev !== undefined && id !== prev
    void writeOffs.fetchWriteOffs(switched)
    void removals.fetchRemovals(switched)
  },
  { immediate: true }
)
</script>

<style scoped>
.s-log__title {
  margin: 0;
  color: var(--s-text);
  font: var(--s-text-heading);
}

.s-log__hint {
  margin: var(--s-space-half) 0 0;
  color: var(--s-text-muted);
  font: var(--s-text-small);
}

.s-log__why {
  display: inline-flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 1px;
  cursor: help;
}

/* The kind of exit reads as a small coloured word, not a pill */
.s-log__type {
  color: var(--s-text);
  font: var(--s-text-small);
  font-weight: 500;
}

.s-log__type--warning {
  color: var(--s-warning);
}

.s-log__type--info {
  color: var(--s-info);
}

.s-log__type--success {
  color: var(--s-success);
}

.s-log__type--error {
  color: var(--s-error);
}

.s-log__muted {
  color: var(--s-text-muted);
  font: var(--s-text-small);
}

.s-log__more {
  display: flex;
  justify-content: center;
  padding: var(--s-space-2);
}

.s-log__error {
  margin: 0;
  padding: var(--s-space-2) var(--s-space-3);
}

.s-log__plan {
  margin: var(--s-space-2) var(--s-space-3);
}
</style>
