<template>
  <div :class="[pageWithFixedFooterClass, 'dash-page--unified']">
    <DashboardPageHeader class="dash-page-header--unified">
      <template #eyebrow>
        <p :class="eyebrowClass">Social Sales</p>
      </template>
      <template #title>
        <h1 :class="pageTitleClass">Leads</h1>
      </template>
      <template v-if="canAccess && leadsStore.leads.length > 0" #description>
        <DashboardPageMetrics :metrics="headerMetrics" aria-label="Leads summary" />
      </template>
      <template v-if="canAccess" #actions>
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

    <SocialSalesSubNav v-if="canAccess" class="mb-1" />

    <div v-if="!canAccess" class="rounded-sm bg-red-50/90 px-4 py-4 dark:bg-red-950/25">
      <p class="text-xs font-medium text-red-800 dark:text-red-200">Sign in to manage leads.</p>
    </div>

    <PlanUpgradePrompt
      v-else-if="!canUseSubscriptionFeature('social_sales')"
      feature="social_sales"
      title="Social Sales is on Medium and Enterprise"
      description="Upgrade to manage WhatsApp and Instagram leads in one place."
      :title-class="pageTitleClass"
      :desc-class="cardDescClass"
    />

    <template v-else>
      <div v-if="!storesStore.currentStoreId && !leadsStore.loading" :class="tableShellFlexClass">
        <DashboardTableEmptyState
          :icon="BuildingStorefrontIcon"
          title="Select a store"
          description="Choose a branch to view and manage social sales leads."
        />
      </div>

      <div v-else :class="tableShellFlexClass">
        <DataTableToolbar native-table-key="social-leads">
          <template #filters>
            <div class="relative min-w-[10rem] flex-1 sm:max-w-xs">
              <MagnifyingGlassIcon
                class="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400"
              />
              <input
                v-model="searchQuery"
                type="search"
                placeholder="Search leads…"
                :class="[fieldClass, 'w-full pl-8']"
                aria-label="Search leads"
              />
            </div>
            <select
              v-model="platformFilter"
              :class="[fieldClass, 'min-w-[8rem]']"
              aria-label="Filter by platform"
            >
              <option value="all">All platforms</option>
              <option v-for="p in SOCIAL_SALES_PLATFORMS" :key="p.value" :value="p.value">
                {{ p.label }}
              </option>
            </select>
            <select
              v-model="statusFilter"
              :class="[fieldClass, 'min-w-[8rem]']"
              aria-label="Filter by status"
            >
              <option value="all">All statuses</option>
              <option v-for="s in SOCIAL_LEAD_STATUSES" :key="s.value" :value="s.value">
                {{ s.label }}
              </option>
            </select>
          </template>
        </DataTableToolbar>

        <div
          v-if="leadsStore.loading && leadsStore.leads.length === 0"
          class="space-y-3 p-6"
        >
          <div v-for="i in 6" :key="i" class="h-10 animate-pulse rounded-sm bg-gray-200 dark:bg-white/10" />
        </div>

        <DashboardTableEmptyState
          v-else-if="filteredRows.length === 0"
          :icon="ChatBubbleLeftRightIcon"
          title="No leads match your filters"
          description="Try adjusting search or filters, or add a lead when Firestore is connected."
        />

        <div v-else class="overflow-x-auto">
          <table class="dashboard-table min-w-full">
            <thead>
              <tr>
                <th scope="col">Customer</th>
                <th scope="col">Platform</th>
                <th scope="col">Product interested in</th>
                <th scope="col" class="dashboard-table__col-numeric">Est. value</th>
                <th scope="col">Status</th>
                <th scope="col">Assigned staff</th>
                <th scope="col">Date created</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="lead in filteredRows" :key="lead.id">
                <td class="max-w-[14rem]">
                  <NuxtLink
                    :to="`/dashboard/social-sales/leads/${lead.id}`"
                    class="dashboard-table__primary block truncate font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"
                  >
                    {{ lead.customerName }}
                  </NuxtLink>
                  <span
                    v-if="lead.customerPhone || lead.whatsappNumber"
                    class="dashboard-table__muted mt-0.5 block truncate text-[10px]"
                  >
                    {{ lead.whatsappNumber || lead.customerPhone }}
                  </span>
                </td>
                <td class="whitespace-nowrap">{{ socialPlatformLabel(lead.platform) }}</td>
                <td class="max-w-[16rem] truncate">{{ lead.productName }}</td>
                <td class="dashboard-table__col-numeric tabular-nums">
                  {{ formatCurrency(lead.estimatedValue) }}
                </td>
                <td><SocialLeadStatusBadge :status="lead.status" /></td>
                <td class="whitespace-nowrap">{{ lead.assignedToName || '—' }}</td>
                <td class="whitespace-nowrap text-[11px] text-gray-500 dark:text-gray-400">
                  {{ formatWhen(lead.createdAt) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>

    <CreateSocialLeadModal v-model="showCreateModal" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import {
  BuildingStorefrontIcon,
  ChatBubbleLeftRightIcon,
  MagnifyingGlassIcon,
  PlusIcon,
} from '~/utils/app-icons'
import Button from '~/components/ui/Button.vue'
import DataTableToolbar from '~/components/ui/DataTableToolbar.vue'
import SocialSalesSubNav from '~/components/social-sales/SocialSalesSubNav.vue'
import SocialLeadStatusBadge from '~/components/social-sales/SocialLeadStatusBadge.vue'
import CreateSocialLeadModal from '~/components/social-sales/CreateSocialLeadModal.vue'
import PlanUpgradePrompt from '~/components/subscription/PlanUpgradePrompt.vue'
import { useSocialSalesLeadsStore } from '~/stores/social-sales/leads'
import { useStoresStore } from '~/stores/stores'
import { useAuthStore } from '~/stores/auth'
import {
  SOCIAL_LEAD_STATUSES,
  SOCIAL_SALES_PLATFORMS,
  socialPlatformLabel,
  type SocialLeadStatus,
  type SocialSalesPlatform,
} from '~/types/social-sales'

definePageMeta({ layout: 'dashboard' })

useHead({ title: 'Social Sales Leads - Storvv' })

const { eyebrowClass, pageTitleClass, fieldClass, headerBtnClass, pageWithFixedFooterClass } =
  useDashboardPageChrome()
const { tableShellFlexClass } = useDashboardTableChrome()
const { cardDescClass } = useDashboardHomeChrome()

const leadsStore = useSocialSalesLeadsStore()
const storesStore = useStoresStore()
const authStore = useAuthStore()
const { formatCurrency } = usePreferences()
const { canUse: canUseSubscriptionFeature } = useSubscriptionFeatures()

const canAccess = computed(() => !!authStore.currentUser)
const showCreateModal = ref(false)

const searchQuery = ref('')
const platformFilter = ref<SocialSalesPlatform | 'all'>('all')
const statusFilter = ref<SocialLeadStatus | 'all'>('all')

watch([searchQuery, platformFilter, statusFilter], () => {
  leadsStore.setFilters({
    search: searchQuery.value,
    platform: platformFilter.value,
    status: statusFilter.value,
  })
})

const filteredRows = computed(() => leadsStore.filteredLeads)

const headerMetrics = computed(() => [
  { key: 'shown', label: 'Showing', value: String(filteredRows.value.length) },
  { key: 'total', label: 'Total', value: String(leadsStore.leads.length) },
])

function formatWhen(v: Date) {
  try {
    return v.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
  } catch {
    return '-'
  }
}

watch(
  () => storesStore.currentStoreId,
  () => {
    if (storesStore.currentStoreId && canAccess.value) {
      leadsStore.fetchLeads(true)
    } else if (!storesStore.currentStoreId) {
      leadsStore.clearForUiStoreSwitch()
    }
  }
)

onMounted(() => {
  if (canAccess.value && storesStore.currentStoreId) {
    leadsStore.fetchLeads(true)
  }
})
</script>
