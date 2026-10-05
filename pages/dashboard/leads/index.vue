<template>
  <div class="ds-root s-c s-page">
    <SPageHeader title="Sales leads">
      <template #description>
        Walk-ins, calls and messages from people who might buy. Turn a lead into a sale when they do.
      </template>
      <template v-if="canAccessLeads && canCreateLead && storesStore.currentStoreId" #actions>
        <SButton variant="primary" @click="showCreateModal = true">
          <template #leading><Plus :size="16" :stroke-width="2" aria-hidden="true" /></template>
          Add lead
        </SButton>
      </template>
    </SPageHeader>

    <PlanGate
      v-if="!canAccessLeadsPlan"
      feature="sales_leads"
      description="Keep track of people who asked about a product, and turn them into sales."
    />

    <SCard v-else-if="!canAccessLeads">
      <SEmptyState
        title="You don't have access to sales leads"
        description="Ask the account owner to give you access to sales leads."
      >
        <template #icon><Lock :size="24" :stroke-width="1.75" /></template>
      </SEmptyState>
    </SCard>

    <SCard v-else-if="!storesStore.currentStoreId && !salesLeadsStore.loading">
      <SEmptyState
        title="Choose a branch"
        description="Leads are kept per branch. Pick one from the branch switcher to see its leads."
      >
        <template #icon><Store :size="24" :stroke-width="1.75" /></template>
      </SEmptyState>
    </SCard>

    <SCard v-else-if="salesLeadsStore.loading && salesLeadsStore.leads.length === 0" flush aria-busy="true">
      <ul class="s-list" aria-label="Loading leads">
        <li v-for="i in 6" :key="i" class="s-list__item" aria-hidden="true">
          <div class="s-list__main">
            <SSkeleton width="40%" height="14px" />
            <SSkeleton width="25%" height="12px" />
          </div>
          <SSkeleton width="72px" height="20px" />
        </li>
      </ul>
    </SCard>

    <SCard v-else-if="salesLeadsStore.error">
      <SEmptyState title="Couldn't load leads" :description="salesLeadsStore.error">
        <template #icon><TriangleAlert :size="24" :stroke-width="1.75" /></template>
        <template #actions>
          <SButton @click="salesLeadsStore.fetchSalesLeads(true)">Try again</SButton>
        </template>
      </SEmptyState>
    </SCard>

    <SCard v-else-if="salesLeadsStore.leads.length === 0">
      <SEmptyState
        title="No leads yet"
        description="Add someone who asked about a product. When they buy, open the lead and create the sale from it."
      >
        <template #icon><Inbox :size="24" :stroke-width="1.75" /></template>
        <template v-if="canCreateLead" #actions>
          <SButton variant="primary" @click="showCreateModal = true">
            <template #leading><Plus :size="16" :stroke-width="2" aria-hidden="true" /></template>
            Add lead
          </SButton>
        </template>
      </SEmptyState>
    </SCard>

    <template v-else>
      <dl class="s-metrics">
        <div class="s-metrics__item">
          <dt class="s-metrics__label">Open leads</dt>
          <dd class="s-metrics__value">{{ salesLeadsStore.openLeads.length }}</dd>
        </div>
        <div class="s-metrics__item">
          <dt class="s-metrics__label">Possible value</dt>
          <dd class="s-metrics__value">{{ formatCurrency(openPipelineValue) }}</dd>
        </div>
        <div class="s-metrics__item">
          <dt class="s-metrics__label">Won</dt>
          <dd class="s-metrics__value">{{ wonLeadCount }}</dd>
        </div>
      </dl>

      <STabs v-model="statusFilter" :tabs="webStatusTabs" label="Lead status" />

      <div class="s-toolbar">
        <SSearch
          v-model="listSearchQuery"
          class="s-toolbar__search"
          placeholder="Search leads"
          label="Search leads by customer, phone, email or product"
        />
      </div>

      <SCard v-if="filteredLeads.length === 0">
        <SEmptyState title="No leads found" description="Try another tab, or clear the search.">
          <template #icon><SearchX :size="24" :stroke-width="1.75" /></template>
          <template #actions>
            <SButton @click="clearListFilters">Show all leads</SButton>
          </template>
        </SEmptyState>
      </SCard>

      <template v-else>
        <!-- Phone -->
        <SCard flush class="s-only-sm">
          <ul class="s-list">
            <li v-for="lead in filteredLeads" :key="lead.id">
              <NuxtLink :to="dashPath(`/leads/${lead.id}`)" class="s-list__item s-list__item--interactive">
                <span class="s-list__main">
                  <span class="s-list__primary">{{ lead.customerName }}</span>
                  <span class="s-list__secondary">{{ lead.productName }}</span>
                </span>
                <span class="s-list__end">
                  <span v-if="lead.estimatedValue" class="s-list__value">{{ formatCurrency(lead.estimatedValue) }}</span>
                  <SBadge :tone="leadStatusTone(lead.status)" size="sm">{{ SALES_LEAD_STATUS_LABELS[lead.status] }}</SBadge>
                </span>
              </NuxtLink>
            </li>
          </ul>
        </SCard>

        <!-- Tablet and desktop -->
        <div class="s-table-wrap s-hide-sm">
          <table class="s-table">
            <thead>
              <tr>
                <th scope="col">Customer</th>
                <th scope="col">Interested in</th>
                <th scope="col" class="s-table__num">Value</th>
                <th scope="col" class="s-hide-lg">Source</th>
                <th scope="col">Status</th>
                <th scope="col" class="s-hide-md">Updated</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="lead in filteredLeads"
                :key="lead.id"
                class="s-table__row--interactive"
                @click="openLead(lead)"
              >
                <td>
                  <NuxtLink :to="dashPath(`/leads/${lead.id}`)" class="s-table__primary s-lead__link" @click.stop>
                    {{ lead.customerName }}
                  </NuxtLink>
                  <span v-if="lead.customerPhone" class="s-table__secondary">{{ lead.customerPhone }}</span>
                </td>
                <td><span class="s-table__secondary s-lead__product">{{ lead.productName }}</span></td>
                <td class="s-table__num">
                  <span v-if="lead.estimatedValue">{{ formatCurrency(lead.estimatedValue) }}</span>
                  <span v-else class="s-table__muted">{{ EMPTY_CELL }}</span>
                </td>
                <td class="s-hide-lg">{{ SALES_LEAD_SOURCE_LABELS[lead.source] }}</td>
                <td @click.stop>
                  <SSelect
                    v-if="isOpenSalesLeadStatus(lead.status)"
                    class="s-lead__status"
                    :model-value="lead.status"
                    :options="openStatusOptions"
                    :disabled="rowStatusSaving === lead.id"
                    :aria-label="`Status for ${lead.customerName}`"
                    @update:model-value="(value) => onRowStatusChange(lead.id, value as SalesLeadStatus)"
                  />
                  <SBadge v-else :tone="leadStatusTone(lead.status)" dot>{{ SALES_LEAD_STATUS_LABELS[lead.status] }}</SBadge>
                </td>
                <td class="s-hide-md s-table__nowrap">{{ formatDay(lead.updatedAt || lead.createdAt) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>
    </template>

    <CreateLeadModal v-model="showCreateModal" @created="onLeadCreated" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { Inbox, Lock, Plus, SearchX, Store, TriangleAlert } from '@lucide/vue'
import SBadge from '~/components/s/SBadge.vue'
import SButton from '~/components/s/SButton.vue'
import SCard from '~/components/s/SCard.vue'
import SEmptyState from '~/components/s/SEmptyState.vue'
import SPageHeader from '~/components/s/SPageHeader.vue'
import SSearch from '~/components/s/SSearch.vue'
import SSelect from '~/components/s/SSelect.vue'
import SSkeleton from '~/components/s/SSkeleton.vue'
import STabs from '~/components/s/STabs.vue'
import PlanGate from '~/components/subscription/PlanGate.vue'
import CreateLeadModal from '~/components/leads/CreateLeadModal.vue'
import { useSalesLeadsStore, SALES_LEAD_SOURCE_LABELS, SALES_LEAD_STATUS_LABELS } from '~/stores/salesLeads'
import { useStoresStore } from '~/stores/stores'
import { useAuthStore } from '~/stores/auth'
import type { SalesLead, SalesLeadStatus } from '~/types/leads'
import { isOpenSalesLeadStatus } from '~/types/leads'
import { leadStatusTone } from '~/utils/lead-status'
import { EMPTY_CELL } from '~/utils/ui-empty'

definePageMeta({
  layout: 'dashboard',
})

const { dashPath } = useDashboardPaths()
const { formatCurrency } = usePreferences()
const { canUse: canUseSubscriptionFeature } = useSubscriptionFeatures()
const { can } = usePermissions()

const salesLeadsStore = useSalesLeadsStore()
const storesStore = useStoresStore()
const authStore = useAuthStore()

const showCreateModal = ref(false)
const statusFilter = ref<'all' | 'open' | SalesLeadStatus>('open')
const listSearchQuery = ref('')
const rowStatusSaving = ref<string | null>(null)

const openStatuses: SalesLeadStatus[] = ['new', 'contacted', 'negotiating']

const canAccessLeadsPlan = computed(() => canUseSubscriptionFeature('sales_leads'))
const canAccessLeads = computed(() => canAccessLeadsPlan.value && can('leads', 'view'))
const canCreateLead = computed(() => can('leads', 'create'))

const filteredLeads = computed(() => {
  let rows = salesLeadsStore.leads
  if (statusFilter.value === 'open') {
    rows = rows.filter((l) => isOpenSalesLeadStatus(l.status))
  } else if (statusFilter.value !== 'all') {
    rows = rows.filter((l) => l.status === statusFilter.value)
  }

  const q = listSearchQuery.value.trim().toLowerCase()
  if (!q) return rows

  return rows.filter((lead) => {
    const haystack = [
      lead.customerName,
      lead.customerPhone,
      lead.customerEmail,
      lead.productName,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
    return haystack.includes(q)
  })
})

function clearListFilters() {
  listSearchQuery.value = ''
  statusFilter.value = 'all'
}

async function onRowStatusChange(leadId: string, status: SalesLeadStatus) {
  if (rowStatusSaving.value) return
  rowStatusSaving.value = leadId
  try {
    await salesLeadsStore.updateLeadStatus(leadId, status)
  } finally {
    rowStatusSaving.value = null
  }
}

const statusTabs = computed(() => [
  { value: 'open' as const, label: 'Open', count: salesLeadsStore.openLeads.length },
  { value: 'all' as const, label: 'All', count: salesLeadsStore.leads.length },
  { value: 'won' as const, label: 'Won', count: salesLeadsStore.leads.filter((l) => l.status === 'won').length },
  { value: 'lost' as const, label: 'Lost', count: salesLeadsStore.leads.filter((l) => l.status === 'lost').length },
])

const webStatusTabs = computed(() =>
  statusTabs.value.map((tab) => ({ value: tab.value, label: tab.label, count: tab.count }))
)

const openStatusOptions = openStatuses.map((status) => ({
  label: SALES_LEAD_STATUS_LABELS[status],
  value: status,
}))

const openPipelineValue = computed(() =>
  salesLeadsStore.openLeads.reduce((sum, lead) => sum + (lead.estimatedValue ?? 0), 0)
)

const wonLeadCount = computed(() => salesLeadsStore.leads.filter((l) => l.status === 'won').length)

function openLead(lead: SalesLead) {
  void navigateTo(dashPath(`/leads/${lead.id}`))
}

function formatDay(v: Date | undefined) {
  if (!v) return EMPTY_CELL
  try {
    return v.toLocaleDateString(undefined, { dateStyle: 'medium' })
  } catch {
    return EMPTY_CELL
  }
}

async function onLeadCreated(leadId: string) {
  await salesLeadsStore.fetchLeadById(leadId)
  await navigateTo(dashPath(`/leads/${leadId}`))
}

watch(
  () => storesStore.currentStoreId,
  () => {
    if (storesStore.currentStoreId && canAccessLeads.value) {
      salesLeadsStore.fetchSalesLeads(true)
    } else if (!storesStore.currentStoreId) {
      salesLeadsStore.clearForUiStoreSwitch()
    }
  }
)

onMounted(async () => {
  if (canAccessLeads.value && storesStore.currentStoreId) {
    await salesLeadsStore.fetchSalesLeads(false)
  }
})
</script>
