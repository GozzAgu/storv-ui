<template>
  <div :class="[pageWithFixedFooterClass, 'dash-page--unified']">
    <DashboardPageHeader class="dash-page-header--unified">
      <template #eyebrow>
        <p :class="eyebrowClass">Commerce</p>
      </template>
      <template #title>
        <h1 :class="pageTitleClass">Sales leads</h1>
      </template>
      <template
        v-if="canAccessLeadsPlan && !salesLeadsStore.loading && filteredLeads.length > 0"
        #description
      >
        <DashboardPageMetrics :metrics="leadHeaderMetrics" aria-label="Lead summary" />
      </template>
      <template v-if="canAccessLeadsPlan" #actions>
        <Button
          variant="primary"
          size="sm"
          :icon="PlusIcon"
          :extra-class="headerBtnClass"
          @click="showCreateModal = true"
        >
          Add lead
        </Button>
      </template>
    </DashboardPageHeader>

    <div
      v-if="!authStore.currentUser"
      class="rounded-sm bg-red-50/90 px-4 py-4 dark:bg-red-950/25 sm:px-5 sm:py-5"
    >
      <p class="text-xs font-medium text-red-800 dark:text-red-200">
        Sign in to track sales leads for your branch.
      </p>
    </div>

    <template v-else-if="canAccessLeadsPlan">
      <div
        v-if="!storesStore.currentStoreId && !salesLeadsStore.loading"
        :class="tableShellFlexClass"
      >
        <DashboardTableEmptyState
          :icon="BuildingStorefrontIcon"
          title="Select a store"
          description="Use the store selector in the top bar to view leads for a branch."
          :tips="['Leads are tracked per store', 'Convert a lead when you record the sale']"
        />
      </div>

      <div v-else class="flex min-h-0 flex-1 flex-col gap-4 sm:gap-5">
        <nav :class="segmentTabsClass" aria-label="Lead filters" role="tablist">
          <button
            v-for="tab in statusTabs"
            :key="tab.value"
            type="button"
            role="tab"
            :aria-selected="statusFilter === tab.value"
            :class="[
              segmentTabsBtnClass,
              statusFilter === tab.value ? segmentTabsBtnActiveClass : '',
            ]"
            @click="statusFilter = tab.value"
          >
            {{ tab.label }}
            <span
              v-if="tab.count"
              class="ml-1.5 min-w-[1.125rem] rounded-full bg-gray-200/80 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums dark:bg-white/10"
            >
              {{ tab.count }}
            </span>
          </button>
        </nav>

        <DashboardDrawerSearch
          v-model="listSearchQuery"
          placeholder="Search customer, phone, or product…"
        />

        <div :class="tableShellFlexClass">
          <div
            v-if="salesLeadsStore.loading && salesLeadsStore.leads.length === 0"
            class="p-6 sm:p-8"
          >
            <div class="space-y-3">
              <div
                v-for="i in 5"
                :key="i"
                class="h-10 animate-pulse rounded-sm bg-gray-200 dark:bg-white/10"
              />
            </div>
          </div>

          <div v-else-if="salesLeadsStore.error" class="px-4 py-10 text-center sm:px-6">
            <p class="text-sm font-medium text-red-600 dark:text-red-400">Could not load leads.</p>
            <p class="mx-auto mt-1 max-w-sm text-xs text-gray-500 dark:text-gray-400">
              {{ salesLeadsStore.error }}
            </p>
          </div>

          <DashboardTableEmptyState
            v-else-if="salesLeadsStore.leads.length === 0"
            :icon="InboxIcon"
            title="No leads yet"
            description="Log walk-ins, phone calls, and other enquiries here. Convert them to a sale when the customer buys."
            :tips="[
              'Source is manual — no integrations required',
              'Use Create sale on a lead to open the receipt wizard',
            ]"
          />

          <DashboardTableEmptyState
            v-else-if="filteredLeads.length === 0"
            :icon="MagnifyingGlassIcon"
            title="No leads match your search"
            description="Try another status tab or clear the search box."
            :tips="['Open leads exclude won and lost', 'Won leads link to the receipt you create']"
          >
            <button
              type="button"
              class="text-xs font-medium text-primary-600 underline decoration-primary-300 underline-offset-2 hover:text-primary-700 dark:text-primary-400"
              @click="clearListFilters"
            >
              Clear filters
            </button>
          </DashboardTableEmptyState>

          <div v-else class="overflow-x-auto">
            <table class="dashboard-table min-w-full">
              <thead>
                <tr>
                  <th scope="col">Customer</th>
                  <th scope="col">Product</th>
                  <th scope="col">Est. value</th>
                  <th scope="col">Source</th>
                  <th scope="col" class="dashboard-table__col-status">Status</th>
                  <th scope="col">Updated</th>
                  <th scope="col" class="dashboard-table__col-actions">
                    <span class="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="lead in filteredLeads" :key="lead.id">
                  <td class="max-w-[14rem]">
                    <span class="dashboard-table__primary block truncate">
                      {{ lead.customerName }}
                    </span>
                    <span
                      v-if="lead.customerPhone"
                      class="dashboard-table__muted mt-0.5 block truncate text-[10px]"
                    >
                      {{ lead.customerPhone }}
                    </span>
                  </td>
                  <td class="max-w-[16rem]">
                    <span class="dashboard-table__primary block truncate">{{ lead.productName }}</span>
                  </td>
                  <td class="whitespace-nowrap tabular-nums">
                    {{
                      lead.estimatedValue && lead.estimatedValue > 0
                        ? formatCurrency(lead.estimatedValue)
                        : '—'
                    }}
                  </td>
                  <td class="whitespace-nowrap text-[11px]">
                    {{ SALES_LEAD_SOURCE_LABELS[lead.source] }}
                  </td>
                  <td class="dashboard-table__col-status" @click.stop>
                    <select
                      v-if="isOpenSalesLeadStatus(lead.status)"
                      :value="lead.status"
                      class="app-field max-w-[8.5rem] px-2 py-1 text-[11px]"
                      :disabled="rowStatusSaving === lead.id"
                      @change="onRowStatusChange(lead.id, ($event.target as HTMLSelectElement).value as SalesLeadStatus)"
                    >
                      <option v-for="status in openStatuses" :key="status" :value="status">
                        {{ SALES_LEAD_STATUS_LABELS[status] }}
                      </option>
                    </select>
                    <LeadStatusBadge v-else :status="lead.status" />
                  </td>
                  <td class="whitespace-nowrap text-[11px] text-gray-500 dark:text-gray-400">
                    {{ formatWhen(lead.updatedAt || lead.createdAt) }}
                  </td>
                  <td class="dashboard-table__col-actions">
                    <NuxtLink
                      :to="dashPath(`/leads/${lead.id}`)"
                      class="text-xs font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"
                    >
                      View
                    </NuxtLink>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </template>

    <div v-else class="rounded-sm bg-amber-50/90 px-4 py-4 dark:bg-amber-950/25 sm:px-5 sm:py-5">
      <p class="text-xs font-medium text-amber-900 dark:text-amber-100">
        Sales leads are included on Storvv Medium and Enterprise. Track enquiries manually and
        convert them through the existing sale flow. Upgrade in Settings when you are ready.
      </p>
      <NuxtLink
        to="/dashboard/settings"
        class="mt-2 inline-block text-xs font-medium text-amber-900 underline underline-offset-2 dark:text-amber-200"
      >
        Settings
      </NuxtLink>
    </div>

    <CreateLeadModal v-model="showCreateModal" @created="onLeadCreated" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import {
  BuildingStorefrontIcon,
  InboxIcon,
  MagnifyingGlassIcon,
  PlusIcon,
} from '~/utils/app-icons'
import Button from '~/components/ui/Button.vue'
import CreateLeadModal from '~/components/leads/CreateLeadModal.vue'
import LeadStatusBadge from '~/components/leads/LeadStatusBadge.vue'
import { useSalesLeadsStore, SALES_LEAD_SOURCE_LABELS, SALES_LEAD_STATUS_LABELS } from '~/stores/salesLeads'
import { useStoresStore } from '~/stores/stores'
import { useAuthStore } from '~/stores/auth'
import type { SalesLeadStatus } from '~/types/leads'
import { isOpenSalesLeadStatus } from '~/types/leads'

definePageMeta({
  layout: 'dashboard',
})

const {
  eyebrowClass,
  pageTitleClass,
  headerBtnClass,
  pageWithFixedFooterClass,
  segmentTabsClass,
  segmentTabsBtnClass,
  segmentTabsBtnActiveClass,
} = useDashboardPageChrome()
const { tableShellFlexClass } = useDashboardTableChrome()
const { dashPath } = useDashboardPaths()
const { formatCurrency } = usePreferences()
const { canUse: canUseSubscriptionFeature } = useSubscriptionFeatures()

const salesLeadsStore = useSalesLeadsStore()
const storesStore = useStoresStore()
const authStore = useAuthStore()

const showCreateModal = ref(false)
const statusFilter = ref<'all' | 'open' | SalesLeadStatus>('open')
const listSearchQuery = ref('')
const rowStatusSaving = ref<string | null>(null)

const openStatuses: SalesLeadStatus[] = ['new', 'contacted', 'negotiating']

const canAccessLeadsPlan = computed(() => canUseSubscriptionFeature('sales_leads'))

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

const leadHeaderMetrics = computed(() => {
  const open = salesLeadsStore.openLeads.length
  const pipeline = salesLeadsStore.openLeads.reduce(
    (sum, lead) => sum + (lead.estimatedValue ?? 0),
    0
  )
  return [
    { key: 'open', label: 'Open leads', value: String(open) },
    { key: 'pipeline', label: 'Est. pipeline', value: formatCurrency(pipeline) },
  ]
})

function formatWhen(v: Date | undefined) {
  if (!v) return '-'
  try {
    return v.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
  } catch {
    return '-'
  }
}

async function onLeadCreated(leadId: string) {
  await salesLeadsStore.fetchLeadById(leadId)
  await navigateTo(dashPath(`/leads/${leadId}`))
}

watch(
  () => storesStore.currentStoreId,
  () => {
    if (storesStore.currentStoreId && canAccessLeadsPlan.value) {
      salesLeadsStore.fetchSalesLeads(true)
    } else if (!storesStore.currentStoreId) {
      salesLeadsStore.clearForUiStoreSwitch()
    }
  }
)

onMounted(async () => {
  if (canAccessLeadsPlan.value && storesStore.currentStoreId) {
    await salesLeadsStore.fetchSalesLeads(true)
  }
})
</script>
