<template>
  <div class="ds-root s-c s-page">
    <SPageHeader title="Returns">
      <template #description>
        Everything that came back or left stock outside a sale: customer returns waiting for
        inspection, defective stock going back to suppliers, and a log of every item removed.
      </template>
      <template v-if="canView && canManage && storesStore.currentStoreId" #actions>
        <SButton variant="primary" @click="showLog = true">
          <template #leading><Plus :size="16" :stroke-width="2" aria-hidden="true" /></template>
          Return to supplier
        </SButton>
      </template>
    </SPageHeader>

    <SCard v-if="!canView">
      <SEmptyState
        title="You don't have access to returns"
        description="Ask the account owner to give you access to products."
      >
        <template #icon><Lock :size="24" :stroke-width="1.75" /></template>
      </SEmptyState>
    </SCard>

    <SCard v-else-if="!storesStore.currentStoreId && !store.loading">
      <SEmptyState
        title="Choose a branch"
        description="Returns are kept per branch. Pick one from the branch switcher."
      >
        <template #icon><Store :size="24" :stroke-width="1.75" /></template>
      </SEmptyState>
    </SCard>

    <SCard v-else-if="store.loading && store.returns.length === 0" flush aria-busy="true">
      <ul class="s-list" aria-label="Loading returns">
        <li v-for="i in 5" :key="i" class="s-list__item" aria-hidden="true">
          <div class="s-list__main">
            <SSkeleton width="40%" height="14px" />
            <SSkeleton width="25%" height="12px" />
          </div>
          <SSkeleton width="72px" height="14px" />
        </li>
      </ul>
    </SCard>

    <SCard v-else-if="store.error">
      <SEmptyState title="Couldn't load returns" :description="store.error">
        <template #icon><TriangleAlert :size="24" :stroke-width="1.75" /></template>
        <template #actions>
          <SButton @click="store.fetchReturns(true)">Try again</SButton>
        </template>
      </SEmptyState>
    </SCard>

    <template v-else-if="store.returns.length === 0">
      <InspectionHoldsTable
        v-if="holdsStore.open.length"
        :holds="holdsStore.open"
        :can-manage="canManage"
        :can-write-off="canWriteOff"
        :restocking-id="restockingId"
        :error="inspectError"
        @restock="restock"
        @to-supplier="openHoldToSupplier"
        @write-off="(hold) => openWriteOff({ hold })"
      />
      <SCard>
        <SEmptyState
          title="No returns yet"
          description="When stock arrives defective, log it here or from the item in Inventory. It's taken out of stock and tracked until the supplier settles it."
        >
          <template #icon><PackageX :size="24" :stroke-width="1.75" /></template>
          <template v-if="canManage" #actions>
            <SButton variant="primary" @click="showLog = true">
              <template #leading><Plus :size="16" :stroke-width="2" aria-hidden="true" /></template>
              Return to supplier
            </SButton>
          </template>
        </SEmptyState>
      </SCard>
    </template>

    <template v-else>
      <dl class="s-metrics" aria-label="Returns summary">
        <div v-for="metric in metrics" :key="metric.key" class="s-metrics__item">
          <dt class="s-metrics__label">{{ metric.label }}</dt>
          <dd class="s-metrics__value" :class="metric.tone && `s-metrics__value--${metric.tone}`">
            {{ metric.value }}
          </dd>
        </div>
      </dl>

      <InspectionHoldsTable
        v-if="holdsStore.open.length"
        :holds="holdsStore.open"
        :can-manage="canManage"
        :can-write-off="canWriteOff"
        :restocking-id="restockingId"
        :error="inspectError"
        @restock="restock"
        @to-supplier="openHoldToSupplier"
        @write-off="(hold) => openWriteOff({ hold })"
      />

      <section class="s-table-card" aria-labelledby="sr-table-title">
        <div class="s-table-card__head">
          <h2 id="sr-table-title" class="s-sr-section-title">Supplier returns</h2>
          <STabs v-model="activeTab" :tabs="tabs" label="Supplier return views" />
          <div class="s-toolbar">
            <SSearch
              v-model="searchQuery"
              class="s-toolbar__search"
              placeholder="Search returns"
              label="Search by item, serial number, supplier or fault"
            />
            <div v-if="supplierOptions.length > 2" class="s-toolbar__filter">
              <SSelect v-model="supplierFilter" :options="supplierOptions" aria-label="Supplier" />
            </div>
          </div>
        </div>

        <SCard v-if="filteredReturns.length === 0">
          <SEmptyState
            title="No returns found"
            description="Try another item, serial number or supplier, or switch tabs."
          >
            <template #icon><SearchX :size="24" :stroke-width="1.75" /></template>
            <template #actions>
              <SButton @click="clearFilters">Clear filters</SButton>
            </template>
          </SEmptyState>
        </SCard>

        <template v-else>
          <!-- Phone -->
          <SCard flush class="s-only-sm">
            <ul class="s-list">
              <li v-for="row in filteredReturns" :key="row.id">
                <button
                  type="button"
                  class="s-list__item s-list__item--interactive"
                  @click="openDetail(row)"
                >
                  <span class="s-list__main">
                    <span class="s-list__primary">{{ row.item.name }}</span>
                    <span class="s-list__secondary">
                      {{ row.supplierName || 'Supplier not set' }} · {{ row.defect || 'Faulty' }}
                    </span>
                  </span>
                  <span class="s-list__end">
                    <span class="s-list__value">{{ moneyOrDash(row.costValue) }}</span>
                    <SBadge :tone="STATUS_TONES[row.status]" size="sm" dot>
                      {{ SUPPLIER_RETURN_STATUS_LABELS[row.status] }}
                    </SBadge>
                  </span>
                </button>
              </li>
            </ul>
          </SCard>

          <!-- Tablet and desktop -->
          <div class="s-table-wrap s-hide-sm">
            <table class="s-table">
              <thead>
                <tr>
                  <th scope="col">Item</th>
                  <th scope="col" class="s-hide-md">Fault</th>
                  <th scope="col">Supplier</th>
                  <th scope="col" class="s-hide-lg">Returned on</th>
                  <th scope="col" class="s-table__num">Cost</th>
                  <th scope="col">Status</th>
                  <th scope="col"><span class="ds-sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in filteredReturns" :key="row.id">
                  <td>
                    <button
                      type="button"
                      class="s-table__primary s-link s-sr-row-link"
                      @click="openDetail(row)"
                    >
                      {{ row.item.name }}
                    </button>
                    <span class="s-table__secondary">{{ itemLine(row) }}</span>
                  </td>
                  <td class="s-hide-md">
                    <span class="s-table__primary">{{ row.defect || 'Faulty' }}</span>
                  </td>
                  <td>
                    <span class="s-table__primary">{{ row.supplierName || EMPTY_CELL }}</span>
                    <span v-if="row.supplierReference" class="s-table__secondary">{{
                      row.supplierReference
                    }}</span>
                  </td>
                  <td class="s-hide-lg s-table__nowrap">
                    {{ formatDay(row.createdAt) }}
                  </td>
                  <td class="s-table__num">{{ moneyOrDash(row.costValue) }}</td>
                  <td>
                    <SBadge :tone="STATUS_TONES[row.status]" size="sm" dot>
                      {{ statusText(row) }}
                    </SBadge>
                  </td>
                  <td class="s-table__nowrap">
                    <SButton
                      v-if="canManage && row.status === 'ready'"
                      variant="secondary"
                      size="sm"
                      @click="openSend(row)"
                    >
                      Send to supplier
                    </SButton>
                    <SButton
                      v-else-if="canManage && row.status === 'with_supplier'"
                      variant="secondary"
                      size="sm"
                      @click="openResolve(row)"
                    >
                      Resolve
                    </SButton>
                    <SButton
                      v-else-if="canManage && awaitingRestock(row)"
                      variant="secondary"
                      size="sm"
                      @click="openRestock(row)"
                    >
                      Put back in stock
                    </SButton>
                    <SButton
                      v-else-if="canWriteOff && row.status === 'rejected' && !row.writeOffId"
                      variant="secondary"
                      size="sm"
                      @click="openWriteOff({ supplierReturn: row })"
                    >
                      Write off
                    </SButton>
                    <SButton v-else variant="ghost" size="sm" @click="openDetail(row)">
                      View
                    </SButton>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </template>
      </section>
    </template>

    <StockOutLog
      v-if="canView && storesStore.currentStoreId && !store.error"
      :can-restore="can('products', 'create')"
    />

    <!-- Detail -->
    <SDialog
      v-model:open="showDetail"
      placement="right"
      size="md"
      :title="selected?.item.name ?? 'Supplier return'"
      :description="selected ? itemLine(selected) : undefined"
    >
      <div v-if="selected" class="s-form">
        <div class="s-sr-status">
          <SBadge :tone="STATUS_TONES[selected.status]" dot>{{ statusText(selected) }}</SBadge>
          <span class="s-sr-status__meta">{{ inventoryActionText(selected) }}</span>
        </div>

        <section class="s-form-section" aria-labelledby="sr-origin">
          <h3 id="sr-origin" class="s-form-section__title">Where it came from</h3>
          <dl class="s-record-summary s-record-summary--stack">
            <div v-for="fact in originFacts" :key="fact.label" class="s-record-row">
              <dt>{{ fact.label }}</dt>
              <dd class="s-record-row__value">{{ fact.value }}</dd>
            </div>
            <div v-if="stockDays" class="s-record-row">
              <dt>In stock before the fault was logged</dt>
              <dd class="s-record-row__value">{{ stockDays }}</dd>
            </div>
          </dl>
        </section>

        <section class="s-form-section" aria-labelledby="sr-fault">
          <h3 id="sr-fault" class="s-form-section__title">The fault</h3>
          <p class="s-sr-text">{{ selected.defect || 'No description given.' }}</p>
          <ul v-if="detailChips.length" class="s-sr-chips" aria-label="Item details">
            <li v-for="chip in detailChips" :key="chip.key" class="s-sr-chip">
              <span class="s-sr-chip__label">{{ chip.label }}</span> {{ chip.value }}
            </li>
          </ul>
        </section>

        <section class="s-form-section" aria-labelledby="sr-money">
          <h3 id="sr-money" class="s-form-section__title">Value</h3>
          <dl class="s-record-summary s-record-summary--stack">
            <div class="s-record-row">
              <dt>Quantity</dt>
              <dd class="s-record-row__value">{{ selected.item.quantity }}</dd>
            </div>
            <div class="s-record-row">
              <dt>Cost</dt>
              <dd class="s-record-row__value">{{ moneyOrDash(selected.costValue) }}</dd>
            </div>
          </dl>
        </section>

        <section class="s-form-section" aria-labelledby="sr-supplier">
          <h3 id="sr-supplier" class="s-form-section__title">Supplier</h3>
          <dl v-if="selected.supplierName" class="s-record-summary s-record-summary--stack">
            <div class="s-record-row">
              <dt>Supplier</dt>
              <dd class="s-record-row__value">{{ selected.supplierName }}</dd>
            </div>
            <div v-if="selected.supplierReference" class="s-record-row">
              <dt>Reference</dt>
              <dd class="s-record-row__value">{{ selected.supplierReference }}</dd>
            </div>
            <div v-if="selected.outcome" class="s-record-row">
              <dt>Outcome</dt>
              <dd class="s-record-row__value">
                {{ SUPPLIER_RETURN_OUTCOME_LABELS[selected.outcome] }}
              </dd>
            </div>
          </dl>
          <p v-else class="s-sr-text s-sr-text--muted">Not sent to a supplier yet.</p>
          <p v-if="selected.notes" class="s-sr-text">{{ selected.notes }}</p>
        </section>

        <section class="s-form-section" aria-labelledby="sr-history">
          <h3 id="sr-history" class="s-form-section__title">History</h3>
          <ol class="s-timeline">
            <li v-for="(event, i) in selected.history" :key="i" class="s-timeline__item">
              <span class="s-timeline__marker" aria-hidden="true">
                <span class="s-timeline__dot" />
              </span>
              <div class="s-timeline__body">
                <div class="s-timeline__head">
                  <p class="s-timeline__title">{{ historyTitle(event.status) }}</p>
                  <time class="s-timeline__meta" :datetime="event.at">
                    {{ formatDay(event.at) }}
                  </time>
                </div>
                <p class="s-timeline__text">
                  {{ event.byName }}<template v-if="event.note"> · {{ event.note }}</template>
                </p>
              </div>
            </li>
          </ol>
        </section>
      </div>

      <template
        v-if="selected && canWriteOff && selected.status === 'rejected' && !selected.writeOffId"
        #footer
      >
        <div class="s-sr-actions">
          <SButton variant="danger" @click="openWriteOff({ supplierReturn: selected })">
            Write off as a loss
          </SButton>
        </div>
      </template>
      <template v-else-if="selected && canManage && awaitingRestock(selected)" #footer>
        <div class="s-sr-actions">
          <SButton variant="primary" @click="openRestock(selected)">Put back in stock</SButton>
        </div>
      </template>
      <template v-else-if="selected && canManage && !isClosed(selected)" #footer>
        <div class="s-sr-actions">
          <SButton variant="ghost" @click="openResolve(selected, 'rejected')">
            Supplier rejected it
          </SButton>
          <SButton v-if="selected.status === 'ready'" variant="primary" @click="openSend(selected)">
            Send to supplier
          </SButton>
          <SButton v-else variant="primary" @click="openResolve(selected)">Resolve</SButton>
        </div>
      </template>
    </SDialog>

    <!-- Send -->
    <SDialog
      v-model:open="showSend"
      size="sm"
      title="Send to supplier"
      :description="acting ? acting.item.name : undefined"
    >
      <SForm id="sr-send-form" @submit="submitSend">
        <SFormSection>
          <SField label="Supplier" required>
            <SInput
              v-model="sendForm.supplierName"
              maxlength="120"
              list="sr-known-suppliers"
              placeholder="Who you bought it from"
            />
            <datalist id="sr-known-suppliers">
              <option v-for="name in knownSuppliers" :key="name" :value="name" />
            </datalist>
          </SField>
          <SField label="Supplier reference" hint="Optional">
            <SInput
              v-model="sendForm.supplierReference"
              maxlength="60"
              placeholder="RMA, waybill or invoice no."
            />
          </SField>
          <SField label="Note" hint="Optional">
            <STextarea
              v-model="sendForm.note"
              :rows="2"
              maxlength="300"
              placeholder="e.g. Picked up by the supplier's driver"
            />
          </SField>
        </SFormSection>
        <p v-if="actionError" class="s-field__error" role="alert">{{ actionError }}</p>
      </SForm>
      <template #footer>
        <SDialogActions
          primary-label="Mark as sent"
          :primary-loading="saving"
          :primary-disabled="!sendForm.supplierName.trim()"
          :cancel-disabled="saving"
          @cancel="showSend = false"
          @primary="submitSend"
        />
      </template>
    </SDialog>

    <!-- Resolve -->
    <SDialog
      v-model:open="showResolve"
      size="sm"
      title="Close return"
      :description="
        acting ? `${acting.item.name} · ${acting.supplierName || 'Supplier'}` : undefined
      "
    >
      <SForm id="sr-resolve-form" @submit="submitResolve">
        <SFormSection>
          <SField label="What did the supplier do?" required>
            <SSelect v-model="resolveForm.outcome" :options="resolveOptions" />
          </SField>
          <SField label="Note" hint="Optional">
            <STextarea
              v-model="resolveForm.note"
              :rows="2"
              maxlength="300"
              :placeholder="
                resolveForm.outcome === 'rejected'
                  ? 'Why the supplier rejected it'
                  : 'e.g. Credit note CN-114 for ₦7,200,000'
              "
            />
          </SField>
          <SField
            v-if="resolveForm.outcome === 'replacement' && acting?.item.serial"
            label="Serial number of the replacement"
            hint="Serial, IMEI or VIN of the new unit the supplier sent"
            required
          >
            <SInput v-model="resolveForm.newSerial" maxlength="80" />
          </SField>
          <p v-if="acting && restocksOnClose" class="s-callout">
            {{ restockNote(acting, resolveForm.outcome) }}
          </p>
        </SFormSection>
        <p v-if="actionError" class="s-field__error" role="alert">{{ actionError }}</p>
      </SForm>
      <template #footer>
        <SDialogActions
          :primary-label="
            resolveForm.outcome === 'rejected'
              ? 'Mark rejected'
              : restocksOnClose
              ? 'Close and put back in stock'
              : 'Close return'
          "
          :primary-variant="resolveForm.outcome === 'rejected' ? 'danger' : 'primary'"
          :primary-loading="saving"
          :primary-disabled="needsSerial(acting, resolveForm.outcome, resolveForm.newSerial)"
          :cancel-disabled="saving"
          @cancel="showResolve = false"
          @primary="submitResolve"
        />
      </template>
    </SDialog>

    <!-- Put back in stock (returns closed as repaired/replaced before restocking existed) -->
    <SDialog
      v-model:open="showRestock"
      size="sm"
      title="Put back in stock"
      :description="acting ? `${acting.item.name} · ${acting.supplierName}` : undefined"
    >
      <SForm id="sr-restock-form" @submit="submitRestock">
        <SFormSection>
          <SField
            v-if="acting?.outcome === 'replacement' && acting.item.serial"
            label="Serial number of the replacement"
            hint="Serial, IMEI or VIN of the new unit the supplier sent"
            required
          >
            <SInput v-model="restockSerial" maxlength="80" />
          </SField>
          <p v-if="acting && acting.outcome" class="s-callout">
            {{ restockNote(acting, acting.outcome) }}
          </p>
        </SFormSection>
        <p v-if="actionError" class="s-field__error" role="alert">{{ actionError }}</p>
      </SForm>
      <template #footer>
        <SDialogActions
          primary-label="Put back in stock"
          :primary-loading="saving"
          :primary-disabled="needsSerial(acting, acting?.outcome ?? 'refund', restockSerial)"
          :cancel-disabled="saving"
          @cancel="showRestock = false"
          @primary="submitRestock"
        />
      </template>
    </SDialog>

    <ReturnToSupplierDialog v-model:open="showLog" @logged="activeTab = 'open'" />
    <WriteOffDialog
      v-model:open="showWriteOff"
      :hold="writeOffHold"
      :supplier-return="writeOffReturn"
      @written="onWrittenOff"
    />
    <ReturnToSupplierDialog
      v-model:open="showHoldDialog"
      :hold="holdForSupplier"
      @logged="activeTab = 'open'"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { Lock, PackageX, Plus, SearchX, Store, TriangleAlert } from '@lucide/vue'
import SBadge from '~/components/s/SBadge.vue'
import SButton from '~/components/s/SButton.vue'
import SCard from '~/components/s/SCard.vue'
import SDialog from '~/components/s/SDialog.vue'
import SDialogActions from '~/components/s/SDialogActions.vue'
import SEmptyState from '~/components/s/SEmptyState.vue'
import SField from '~/components/s/SField.vue'
import SForm from '~/components/s/SForm.vue'
import SFormSection from '~/components/s/SFormSection.vue'
import SInput from '~/components/s/SInput.vue'
import SPageHeader from '~/components/s/SPageHeader.vue'
import SSearch from '~/components/s/SSearch.vue'
import SSelect from '~/components/s/SSelect.vue'
import SSkeleton from '~/components/s/SSkeleton.vue'
import STabs from '~/components/s/STabs.vue'
import STextarea from '~/components/s/STextarea.vue'
import ReturnToSupplierDialog from '~/components/supplier-returns/ReturnToSupplierDialog.vue'
import WriteOffDialog from '~/components/write-offs/WriteOffDialog.vue'
import InspectionHoldsTable from '~/components/supplier-returns/InspectionHoldsTable.vue'
import StockOutLog from '~/components/supplier-returns/StockOutLog.vue'
import { useSupplierReturnsStore } from '~/stores/supplierReturns'
import { useInspectionHoldsStore } from '~/stores/inspectionHolds'
import type { InspectionHold } from '~/types/inspection-holds'
import { useStoresStore } from '~/stores/stores'
import { usePreferences } from '~/composables/usePreferences'
import { EMPTY_CELL } from '~/utils/ui-empty'
import { stockItemDetailChips, stockItemDetailSummary } from '~/utils/stock-item-details'
import { daysInStock, supplierReturnOriginFacts } from '~/utils/supplier-return-display'
import {
  SUPPLIER_RETURN_OUTCOME_LABELS,
  SUPPLIER_RETURN_STATUS_LABELS,
  type SupplierReturn,
  RESTOCK_OUTCOMES,
  type SupplierReturnOutcome,
  type SupplierReturnStatus,
} from '~/types/supplier-returns'

definePageMeta({
  layout: 'dashboard',
})

const store = useSupplierReturnsStore()
const storesStore = useStoresStore()
const { formatCurrency } = usePreferences()
const { can } = usePermissions()

const canView = computed(() => can('products', 'view'))
/** Mirrors the server: taking stock out needs products edit or delete. */
const canManage = computed(() => can('products', 'edit') || can('products', 'delete'))
const showLog = ref(false)

// ── To inspect: held customer returns ──
const holdsStore = useInspectionHoldsStore()
const restockingId = ref<string | null>(null)
const inspectError = ref('')
const showHoldDialog = ref(false)
const holdForSupplier = ref<InspectionHold | null>(null)

async function restock(hold: InspectionHold) {
  restockingId.value = hold.id
  inspectError.value = ''
  try {
    await holdsStore.decide(hold.id, { action: 'restock' })
  } catch (err) {
    inspectError.value =
      (err as { message?: string })?.message || 'That didn’t save. Please try again.'
  } finally {
    restockingId.value = null
  }
}

// ── Write off: held returns judged unsellable, or claims the supplier rejected ──
const canWriteOff = computed(() => can('products', 'delete'))
const showWriteOff = ref(false)
const writeOffHold = ref<InspectionHold | null>(null)
const writeOffReturn = ref<SupplierReturn | null>(null)

function openWriteOff(source: { hold?: InspectionHold; supplierReturn?: SupplierReturn }) {
  writeOffHold.value = source.hold ?? null
  writeOffReturn.value = source.supplierReturn ?? null
  showWriteOff.value = true
}

function onWrittenOff() {
  showDetail.value = false
}

function openHoldToSupplier(hold: InspectionHold) {
  holdForSupplier.value = hold
  showHoldDialog.value = true
}

const STATUS_TONES: Record<SupplierReturnStatus, 'warning' | 'info' | 'success' | 'error'> = {
  ready: 'warning',
  with_supplier: 'info',
  resolved: 'success',
  rejected: 'error',
}

const isClosed = (row: SupplierReturn) => row.status === 'resolved' || row.status === 'rejected'

// ── Summary ──
const metrics = computed(() => {
  const rows = store.returns
  const ready = rows.filter((r) => r.status === 'ready').length
  const sumCost = (status: SupplierReturnStatus) =>
    rows.filter((r) => r.status === status).reduce((sum, r) => sum + (r.costValue ?? 0), 0)
  const rejected = rows.filter((r) => r.status === 'rejected')
  return [
    {
      key: 'ready',
      label: 'Ready to send',
      value: String(ready),
      tone: ready > 0 ? ('warning' as const) : undefined,
    },
    {
      key: 'with',
      label: 'With suppliers',
      value: String(rows.filter((r) => r.status === 'with_supplier').length),
    },
    {
      key: 'atRisk',
      label: 'Cost awaiting settlement',
      value: formatCurrency(sumCost('ready') + sumCost('with_supplier')),
    },
    {
      key: 'stock',
      label: 'Back in stock',
      value: formatCurrency(
        rows.filter((r) => r.restockedAt).reduce((sum, r) => sum + (r.costValue ?? 0), 0)
      ),
    },
    {
      key: 'money',
      label: 'Money recovered',
      value: formatCurrency(
        rows
          .filter((r) => r.status === 'resolved' && r.outcome && !isRestockOutcome(r.outcome))
          .reduce((sum, r) => sum + (r.costValue ?? 0), 0)
      ),
    },
    {
      key: 'lost',
      label: 'Rejected claims',
      value: formatCurrency(sumCost('rejected')),
      tone: rejected.length > 0 ? ('error' as const) : undefined,
    },
  ]
})

// ── Tabs, search, filter ──
const activeTab = ref('open')
const countWhere = (fn: (r: SupplierReturn) => boolean) => store.returns.filter(fn).length
const tabs = computed(() => [
  { value: 'open', label: 'Open', count: countWhere((r) => !isClosed(r)) },
  { value: 'ready', label: 'Ready to send', count: countWhere((r) => r.status === 'ready') },
  {
    value: 'with_supplier',
    label: 'With supplier',
    count: countWhere((r) => r.status === 'with_supplier'),
  },
  { value: 'closed', label: 'Closed', count: countWhere(isClosed) },
])

const searchQuery = ref('')
const supplierFilter = ref('all')
const knownSuppliers = computed(() =>
  [...new Set(store.returns.map((r) => r.supplierName).filter(Boolean))].sort()
)
const supplierOptions = computed(() => [
  { value: 'all', label: 'All suppliers' },
  ...knownSuppliers.value.map((s) => ({ value: s, label: s })),
])

const filteredReturns = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  return store.returns
    .filter((r) => {
      if (activeTab.value === 'open') return !isClosed(r)
      if (activeTab.value === 'closed') return isClosed(r)
      return r.status === activeTab.value
    })
    .filter((r) => supplierFilter.value === 'all' || r.supplierName === supplierFilter.value)
    .filter((r) => {
      if (!q) return true
      return [
        r.item.name,
        r.item.folderName,
        r.supplierName,
        r.supplierReference,
        r.defect,
        ...Object.values(r.item.details).map(String),
      ].some((v) => v?.toLowerCase().includes(q))
    })
})

function clearFilters() {
  searchQuery.value = ''
  supplierFilter.value = 'all'
  activeTab.value = 'open'
}

// ── Detail ──
const showDetail = ref(false)
const selectedId = ref<string | null>(null)
const selected = computed(() => (selectedId.value ? store.byId(selectedId.value) : null))
const originFacts = computed(() =>
  selected.value ? supplierReturnOriginFacts(selected.value) : []
)
const stockDays = computed(() => (selected.value ? daysInStock(selected.value) : null))
const detailChips = computed(() =>
  selected.value ? stockItemDetailChips(selected.value.item.details) : []
)

function openDetail(row: SupplierReturn) {
  selectedId.value = row.id
  showDetail.value = true
}

// ── Actions ──
const acting = ref<SupplierReturn | null>(null)
const saving = ref(false)
const actionError = ref('')

const showSend = ref(false)
const sendForm = reactive({ supplierName: '', supplierReference: '', note: '' })

function openSend(row: SupplierReturn) {
  acting.value = row
  actionError.value = ''
  Object.assign(sendForm, {
    supplierName: row.supplierName,
    supplierReference: row.supplierReference,
    note: '',
  })
  showSend.value = true
}

async function submitSend() {
  const row = acting.value
  if (!row || !sendForm.supplierName.trim() || saving.value) return
  await run(async () => {
    await store.applyAction(row.id, {
      action: 'send',
      supplierName: sendForm.supplierName.trim(),
      supplierReference: sendForm.supplierReference.trim() || undefined,
      note: sendForm.note.trim() || undefined,
    })
    showSend.value = false
  })
}

const showResolve = ref(false)
const resolveForm = reactive({
  outcome: 'refund' as SupplierReturnOutcome | 'rejected',
  note: '',
  newSerial: '',
})
const resolveOptions = [
  ...Object.entries(SUPPLIER_RETURN_OUTCOME_LABELS).map(([value, label]) => ({ value, label })),
  { value: 'rejected', label: 'Rejected the claim' },
]

function openResolve(row: SupplierReturn, outcome: SupplierReturnOutcome | 'rejected' = 'refund') {
  acting.value = row
  actionError.value = ''
  Object.assign(resolveForm, { outcome, note: '', newSerial: '' })
  showResolve.value = true
}

async function submitResolve() {
  const row = acting.value
  if (!row || saving.value) return
  if (needsSerial(row, resolveForm.outcome, resolveForm.newSerial)) return
  const note = resolveForm.note.trim() || undefined
  const newSerial = resolveForm.newSerial.trim() || undefined
  await run(async () => {
    await store.applyAction(
      row.id,
      resolveForm.outcome === 'rejected'
        ? { action: 'reject', note }
        : { action: 'resolve', outcome: resolveForm.outcome, note, newSerial }
    )
    showResolve.value = false
  })
}

// ── Back in stock: repaired or replacement units go back on sale ──
const isRestockOutcome = (o: SupplierReturnOutcome | 'rejected') =>
  (RESTOCK_OUTCOMES as readonly string[]).includes(o)
const restocksOnClose = computed(() => isRestockOutcome(resolveForm.outcome))
const showRestock = ref(false)
const restockSerial = ref('')

/** Closed as repaired or replaced, but the unit isn't back in inventory yet. */
const awaitingRestock = (row: SupplierReturn) =>
  row.status === 'resolved' && !!row.outcome && isRestockOutcome(row.outcome) && !row.restockedAt

function needsSerial(
  row: SupplierReturn | null,
  outcome: SupplierReturnOutcome | 'rejected',
  serial: string
) {
  return !!row && outcome === 'replacement' && row.item.serial && !serial.trim()
}

function restockNote(row: SupplierReturn, outcome: SupplierReturnOutcome | 'rejected') {
  const where = row.item.folderName
  if (outcome === 'replacement') {
    return row.item.serial
      ? `The replacement goes into ${where} as a new unit, with the details of the original and the serial number above.`
      : `${row.item.quantity} replacement unit${
          row.item.quantity === 1 ? '' : 's'
        } go back into ${where}.`
  }
  return row.item.serial
    ? `The repaired unit goes back into ${where}, as it was before, and can be sold again.`
    : `${row.item.quantity} repaired unit${
        row.item.quantity === 1 ? '' : 's'
      } go back into ${where}.`
}

function openRestock(row: SupplierReturn) {
  acting.value = row
  actionError.value = ''
  restockSerial.value = ''
  showRestock.value = true
}

async function submitRestock() {
  const row = acting.value
  if (!row || saving.value || needsSerial(row, row.outcome ?? 'refund', restockSerial.value)) return
  await run(async () => {
    await store.applyAction(row.id, {
      action: 'restock',
      newSerial: restockSerial.value.trim() || undefined,
    })
    showRestock.value = false
  })
}

async function run(fn: () => Promise<void>) {
  saving.value = true
  actionError.value = ''
  try {
    await fn()
  } catch (err) {
    actionError.value =
      (err as { message?: string })?.message || 'That didn’t save. Please try again.'
  } finally {
    saving.value = false
  }
}

// ── Formatting ──
function itemLine(row: SupplierReturn) {
  const details = stockItemDetailSummary(row.item.details, 2)
  const qty = row.item.serial ? '' : `Qty ${row.item.quantity}`
  return [details, qty, row.item.folderName].filter(Boolean).join(' · ')
}

function statusText(row: SupplierReturn) {
  if (row.writeOffId) return 'Rejected · written off'
  if (row.restockedAt && row.outcome) {
    return `${SUPPLIER_RETURN_OUTCOME_LABELS[row.outcome]} · back in stock`
  }
  if (awaitingRestock(row) && row.outcome) {
    return `${SUPPLIER_RETURN_OUTCOME_LABELS[row.outcome]} · not in stock yet`
  }
  if (row.status === 'resolved' && row.outcome) return SUPPLIER_RETURN_OUTCOME_LABELS[row.outcome]
  return SUPPLIER_RETURN_STATUS_LABELS[row.status]
}

function historyTitle(status: SupplierReturnStatus) {
  return {
    ready: 'Returned faulty, out of stock',
    with_supplier: 'Sent to supplier',
    resolved: 'Settled by supplier',
    rejected: 'Rejected by supplier',
  }[status]
}

function inventoryActionText(row: SupplierReturn) {
  return row.item.inventoryAction === 'removed'
    ? 'Removed from inventory'
    : `${row.item.quantity} unit${row.item.quantity === 1 ? '' : 's'} taken off stock`
}

function moneyOrDash(value: number | null) {
  return value === null ? EMPTY_CELL : formatCurrency(value)
}

function formatDay(iso: string | null) {
  if (!iso) return EMPTY_CELL
  const d = new Date(iso)
  return Number.isNaN(d.getTime())
    ? EMPTY_CELL
    : d.toLocaleDateString(undefined, { dateStyle: 'medium' })
}

// ── Loading ──
// Permissions and the branch both arrive after mount, so load once both are known (and again on
// a branch switch).
watch(
  [() => storesStore.currentStoreId, canView],
  ([id, allowed], [prevId] = [undefined, false]) => {
    if (!id) {
      store.clearForStoreSwitch()
      holdsStore.clearForStoreSwitch()
      return
    }
    if (allowed) {
      const switched = id !== prevId && prevId !== undefined
      void store.fetchReturns(switched)
      void holdsStore.fetchHolds(switched)
    }
  },
  { immediate: true }
)
</script>

<style scoped>
.s-sr-section-title {
  margin: 0;
  color: var(--s-text);
  font: var(--s-text-heading);
}

.s-sr-row-link {
  padding: 0;
  border: 0;
  background: none;
  font: inherit;
  text-align: start;
  cursor: pointer;
}

.s-sr-status {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--s-space-1);
}

.s-sr-status__meta,
.s-sr-text--muted {
  color: var(--s-text-muted);
  font: var(--s-text-small);
}

.s-sr-text {
  margin: 0;
  color: var(--s-text);
  font: var(--s-text-body);
}

.s-sr-chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--s-space-half);
  margin: var(--s-space-1) 0 0;
  padding: 0;
  list-style: none;
}

.s-sr-chip {
  padding: 2px var(--s-space-1);
  border: 1px solid var(--s-border);
  border-radius: var(--s-radius-full);
  color: var(--s-text);
  font: var(--s-text-small);
}

.s-sr-chip__label {
  color: var(--s-text-muted);
}

.s-sr-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: var(--s-space-1);
  width: 100%;
}
</style>
