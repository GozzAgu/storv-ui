<template>
  <section class="s-table-card" aria-labelledby="stock-out-title">
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
        :title="entries.length ? 'Nothing matches' : 'Nothing has left stock yet'"
        :description="
          entries.length
            ? 'Try another item, reason or type.'
            : 'Deleted products, write-offs, customer and supplier returns, and lowered counts will be listed here.'
        "
      >
        <template #icon><History :size="24" :stroke-width="1.75" /></template>
      </SEmptyState>
    </SCard>

    <template v-else>
      <!-- Phone -->
      <SCard flush class="s-only-sm">
        <ul class="s-list">
          <li v-for="row in visible" :key="row.key" class="s-list__item">
            <span class="s-list__main">
              <span class="s-list__primary">{{ row.itemName }}</span>
              <span class="s-list__secondary">{{ row.what }} · {{ row.why }}</span>
              <span class="s-list__secondary">{{ formatDay(row.at) }} · {{ row.by }}</span>
            </span>
            <span class="s-list__end">
              <span class="s-list__value"
                >{{ row.units }} unit{{ row.units === 1 ? '' : 's' }}</span
              >
              <SBadge :tone="row.tone" size="sm">{{ row.typeLabel }}</SBadge>
            </span>
          </li>
        </ul>
      </SCard>

      <!-- Tablet and desktop -->
      <div class="s-table-wrap s-hide-sm">
        <table class="s-table">
          <thead>
            <tr>
              <th scope="col">Date</th>
              <th scope="col">Item</th>
              <th scope="col">What happened</th>
              <th scope="col" class="s-table__num">Units</th>
              <th scope="col" class="s-table__num s-hide-md">Cost</th>
              <th scope="col" class="s-hide-lg">By</th>
              <th scope="col"><span class="ds-sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in visible" :key="row.key">
              <td class="s-table__nowrap">{{ formatDay(row.at) }}</td>
              <td>
                <span class="s-table__primary">{{ row.itemName }}</span>
                <span class="s-table__secondary">{{ row.itemLine }}</span>
              </td>
              <td>
                <SBadge :tone="row.tone" size="sm">{{ row.typeLabel }}</SBadge>
                <span class="s-table__secondary">{{ row.what }} · {{ row.why }}</span>
              </td>
              <td class="s-table__num">{{ row.units }}</td>
              <td class="s-table__num s-hide-md">
                {{ row.cost === null ? EMPTY_CELL : formatCurrency(row.cost) }}
              </td>
              <td class="s-hide-lg">{{ row.by || EMPTY_CELL }}</td>
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
        </table>
      </div>
      <div v-if="filtered.length > visible.length" class="s-log__more">
        <SButton variant="ghost" size="sm" @click="limit += 50">
          Show more ({{ filtered.length - visible.length }} left)
        </SButton>
      </div>
    </template>

    <p v-if="error" class="s-field__error s-log__error" role="alert">{{ error }}</p>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { History } from '@lucide/vue'
import SBadge from '~/components/s/SBadge.vue'
import SButton from '~/components/s/SButton.vue'
import SCard from '~/components/s/SCard.vue'
import SEmptyState from '~/components/s/SEmptyState.vue'
import SSearch from '~/components/s/SSearch.vue'
import SSelect from '~/components/s/SSelect.vue'
import { useSupplierReturnsStore } from '~/stores/supplierReturns'
import { useInspectionHoldsStore } from '~/stores/inspectionHolds'
import { useWriteOffsStore } from '~/stores/writeOffs'
import { useStockRemovalsStore } from '~/stores/stockRemovals'
import { useStoresStore } from '~/stores/stores'
import { usePreferences } from '~/composables/usePreferences'
import { EMPTY_CELL } from '~/utils/ui-empty'
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
defineProps<{ canRestore: boolean }>()

type Tone = 'neutral' | 'warning' | 'info' | 'success' | 'error'
type EntryType = 'supplier' | 'customer' | 'write_off' | 'deleted' | 'count'

interface Entry {
  key: string
  type: EntryType
  typeLabel: string
  tone: Tone
  at: string | null
  itemName: string
  itemLine: string
  what: string
  why: string
  units: number
  cost: number | null
  by: string
  search: string
  restorableId: string | null
  restored: boolean
}

const supplierReturns = useSupplierReturnsStore()
const holds = useInspectionHoldsStore()
const writeOffs = useWriteOffsStore()
const removals = useStockRemovalsStore()
const storesStore = useStoresStore()
const { formatCurrency } = usePreferences()

const search = ref('')
const typeFilter = ref<'all' | EntryType>('all')
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

function line(details: Record<string, string | number | boolean>, folderName: string) {
  return [stockItemDetailSummary(details, 2), folderName].filter(Boolean).join(' · ')
}

const entries = computed<Entry[]>(() => {
  const out: Entry[] = []
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
    })
  }
  return out.sort((a, b) => (b.at ?? '').localeCompare(a.at ?? ''))
})

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  return entries.value.filter((e) => {
    if (typeFilter.value !== 'all' && e.type !== typeFilter.value) return false
    if (!q) return true
    return [e.itemName, e.itemLine, e.what, e.why, e.by, e.search].some((v) =>
      v.toLowerCase().includes(q)
    )
  })
})
const visible = computed(() => filtered.value.slice(0, limit.value))

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

function formatDay(iso: string | null) {
  if (!iso) return EMPTY_CELL
  return new Date(iso).toLocaleDateString(undefined, { dateStyle: 'medium' })
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
</style>
