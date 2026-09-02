<template>
  <div :class="[pageWithFixedFooterClass, 'dash-page--unified']">
    <!-- iOS: sales-style list UI -->
    <div v-if="isCapacitorIos" class="ios-sales-shell" data-leads-page>
      <IosPageNavBar title="Sales leads" />

      <IosQuickActionBar
        v-if="canAccessLeadsPlan"
        v-model="iosLeadTab"
        role="tablist"
        aria-label="Lead actions and filters"
        :options="iosLeadQuickActions"
      />

      <template v-if="canAccessLeadsPlan && storesStore.currentStoreId">
        <div v-if="!salesLeadsStore.loading" class="ios-sales-chrome">
          <div class="ios-search-bar-host ios-search-bar-host--sticky">
            <IosSearchBar
              v-model="listSearchQuery"
              placeholder="Search customer, phone, or product…"
            />
          </div>
          <IosQuickActionBar
            v-model="statusFilter"
            aria-label="Filter leads by status"
            :options="iosLeadStatusOptions"
          />
        </div>

        <IosTransactionListSkeleton
          v-if="salesLeadsStore.loading && salesLeadsStore.leads.length === 0"
          :count="8"
        />

        <DashboardTableEmptyState
          v-else-if="salesLeadsStore.error"
          :icon="InboxIcon"
          title="Could not load leads"
          :description="salesLeadsStore.error"
        />

        <DashboardTableEmptyState
          v-else-if="salesLeadsStore.leads.length === 0"
          :icon="InboxIcon"
          title="No leads yet"
          description="Log walk-ins, phone calls, and other enquiries here."
        />

        <DashboardTableEmptyState
          v-else-if="filteredLeads.length === 0"
          :icon="MagnifyingGlassIcon"
          title="No leads match your search"
          description="Try another status tab or clear the search box."
        >
          <button
            type="button"
            class="text-xs font-medium text-primary-600 underline decoration-primary-300 underline-offset-2 dark:text-primary-400"
            @click="clearListFilters"
          >
            Clear filters
          </button>
        </DashboardTableEmptyState>

        <div v-else class="ios-receipt-transaction-list">
          <IosReceiptTransactionRow
            v-for="(lead, index) in filteredLeads"
            :key="lead.id"
            :title="lead.customerName"
            :subtitle="iosLeadSubtitle(lead)"
            :amount="iosLeadAmount(lead)"
            :amount-tone="iosLeadAmountTone(lead)"
            :date="formatWhenShort(lead.updatedAt || lead.createdAt)"
            :variant="iosLeadVariant(lead.status)"
            :last="index === filteredLeads.length - 1"
            show-menu
            menu-kind="lead"
            :menu-id="lead.id"
            @click="navigateTo(dashPath(`/leads/${lead.id}`))"
            @menu="toggleLeadMenu(lead.id)"
          />
        </div>
      </template>

      <DashboardTableEmptyState
        v-else-if="canAccessLeadsPlan && !storesStore.currentStoreId"
        :icon="BuildingStorefrontIcon"
        title="Select a store"
        description="Use the store selector to view leads for a branch."
      />

      <FeatureGateCard v-else-if="!canAccessLeadsPlan" feature="sales_leads" />
    </div>

    <!-- Web -->
    <template v-else>
    <DashboardPageHeader class="dash-page-header--unified">
      <template #eyebrow>
        <p :class="eyebrowClass">Commerce</p>
      </template>
      <template #title>
        <h1 :class="pageTitleClass">Sales leads</h1>
      </template>
      <template
        v-if="canAccessLeadsPlan && salesLeadsStore.loading && salesLeadsStore.leads.length === 0"
        #description
      >
        <DashPageMetricsSkeleton :count="2" />
      </template>
      <template
        v-else-if="canAccessLeadsPlan && !salesLeadsStore.loading && filteredLeads.length > 0"
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
          <DashTableSkeleton
            v-if="salesLeadsStore.loading && salesLeadsStore.leads.length === 0"
            :columns="[
              { label: 'Customer', lines: 2 },
              { label: 'Product' },
              { label: 'Est. value', bone: '4.5rem' },
              { label: 'Source', bone: '4rem' },
              { label: 'Status', class: 'dashboard-table__col-status', bone: '5.5rem' },
              { label: 'Updated', bone: '6rem' },
              { label: 'Actions', class: 'dashboard-table__col-actions', bone: '3.5rem' },
            ]"
            :rows="8"
            leading="none"
            flush
            aria-label="Loading leads"
          />

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
              'Source is manual - no integrations required',
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
                        : ' - '
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
                    <button
                      type="button"
                      class="dashboard-table__action-btn"
                      :data-lead-actions-anchor="lead.id"
                      aria-label="Lead actions"
                      @click="toggleLeadMenu(lead.id)"
                    >
                      <EllipsisVerticalIcon class="h-4 w-4" stroke-width="2" />
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </template>

    <div v-else class="py-8">
      <FeatureGateCard feature="sales_leads" />
    </div>
    </template>

    <CreateLeadModal v-model="showCreateModal" @created="onLeadCreated" />

    <IosContextMenu
      :open="Boolean(openLeadMenuId && leadForOpenMenu && leadMenuFixedStyle)"
      :style="leadMenuFixedStyle"
      menu-id="lead"
    >
      <IosContextMenuItem
        label="View lead"
        :icon="InboxIcon"
        @click="
          () => {
            navigateTo(dashPath(`/leads/${leadForOpenMenu!.id}`))
            closeLeadMenu()
          }
        "
      />
    </IosContextMenu>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import {
  BuildingStorefrontIcon,
  CheckCircleIcon,
  EllipsisVerticalIcon,
  FunnelIcon,
  InboxIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  XMarkIcon,
} from '~/utils/app-icons'
import Button from '~/components/ui/Button.vue'
import FeatureGateCard from '~/components/subscription/FeatureGateCard.vue'
import CreateLeadModal from '~/components/leads/CreateLeadModal.vue'
import LeadStatusBadge from '~/components/leads/LeadStatusBadge.vue'
import IosContextMenu from '~/components/ios/IosContextMenu.vue'
import IosContextMenuItem from '~/components/ios/IosContextMenuItem.vue'
import IosPageNavBar from '~/components/ios/IosPageNavBar.vue'
import IosQuickActionBar, { type IosQuickActionOption } from '~/components/ios/IosQuickActionBar.vue'
import IosTransactionListSkeleton from '~/components/ios/IosTransactionListSkeleton.vue'
import IosSearchBar from '~/components/ios/IosSearchBar.vue'
import IosReceiptTransactionRow, {
  type ReceiptTransactionAmountTone,
  type ReceiptTransactionVariant,
} from '~/components/ios/IosReceiptTransactionRow.vue'
import { useSalesLeadsStore, SALES_LEAD_SOURCE_LABELS, SALES_LEAD_STATUS_LABELS } from '~/stores/salesLeads'
import { useStoresStore } from '~/stores/stores'
import { useAuthStore } from '~/stores/auth'
import type { SalesLead, SalesLeadStatus } from '~/types/leads'
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
const { isCapacitorIos } = useIsCapacitorIos()

const salesLeadsStore = useSalesLeadsStore()
const storesStore = useStoresStore()
const authStore = useAuthStore()

const showCreateModal = ref(false)
const statusFilter = ref<'all' | 'open' | SalesLeadStatus>('open')
const listSearchQuery = ref('')
const rowStatusSaving = ref<string | null>(null)
const iosLeadTab = ref('list')

const iosLeadQuickActions = computed((): IosQuickActionOption[] => [
  {
    value: 'add',
    label: 'Add lead',
    icon: PlusIcon,
    trailing: 'add',
    action: () => {
      showCreateModal.value = true
    },
  },
  { value: 'list', label: 'Leads', icon: InboxIcon },
])

function iosLeadSubtitle(lead: SalesLead) {
  const parts = [lead.productName, SALES_LEAD_SOURCE_LABELS[lead.source]]
  if (lead.customerPhone) parts.push(lead.customerPhone)
  return parts.filter(Boolean).join(' · ')
}

function iosLeadAmount(lead: SalesLead) {
  return lead.estimatedValue && lead.estimatedValue > 0
    ? formatCurrency(lead.estimatedValue)
    : SALES_LEAD_STATUS_LABELS[lead.status]
}

function iosLeadAmountTone(lead: SalesLead): ReceiptTransactionAmountTone {
  if (lead.status === 'won') return 'positive'
  if (lead.status === 'lost') return 'negative'
  return 'neutral'
}

function iosLeadVariant(status: SalesLeadStatus): ReceiptTransactionVariant {
  if (status === 'won') return 'credit'
  if (status === 'lost') return 'cancelled'
  return 'pending'
}

function formatWhenShort(v: Date | undefined) {
  if (!v) return ''
  try {
    return v.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  } catch {
    return ''
  }
}

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

const {
  openMenuId: openLeadMenuId,
  menuFixedStyle: leadMenuFixedStyle,
  toggleMenu: toggleLeadMenu,
  closeMenu: closeLeadMenu,
} = useAnchoredRowMenu({
  anchorAttr: 'data-lead-actions-anchor',
})

const leadForOpenMenu = computed(() => {
  const id = openLeadMenuId.value
  if (!id) return null
  return filteredLeads.value.find((lead) => lead.id === id) ?? null
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

const iosLeadStatusOptions = computed((): IosQuickActionOption[] =>
  statusTabs.value.map((tab) => ({
    value: tab.value,
    label: tab.label,
    badge: tab.count || undefined,
    icon:
      tab.value === 'open'
        ? InboxIcon
        : tab.value === 'won'
          ? CheckCircleIcon
          : tab.value === 'lost'
            ? XMarkIcon
            : FunnelIcon,
  }))
)

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
