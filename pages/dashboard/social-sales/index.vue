<template>
  <div :class="[pageWithFixedFooterClass, 'dash-page--unified']">
    <DashboardPageHeader class="dash-page-header--unified">
      <template #eyebrow>
        <p :class="eyebrowClass">Social Sales</p>
      </template>
      <template #title>
        <h1 :class="pageTitleClass">Social Sales</h1>
      </template>
      <template v-if="canAccess && metrics" #description>
        <DashboardPageMetrics :metrics="headerMetrics" aria-label="Social sales summary" />
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

    <div
      v-if="!canAccess"
      class="rounded-sm bg-red-50/90 px-4 py-4 dark:bg-red-950/25 sm:px-5 sm:py-5"
    >
      <p class="text-xs font-medium text-red-800 dark:text-red-200">
        Sign in to track social media leads and revenue.
      </p>
    </div>

    <PlanUpgradePrompt
      v-else-if="!canUseSubscriptionFeature('social_sales')"
      feature="social_sales"
      title="Social Sales is on Medium and Enterprise"
      description="Upgrade to track WhatsApp and Instagram leads, conversion rates, and social revenue."
      :title-class="pageTitleClass"
      :desc-class="cardDescClass"
    />

    <template v-else>
      <div
        v-if="!storesStore.currentStoreId && !leadsStore.loading"
        :class="stateCardClass"
      >
        <BuildingStorefrontIcon
          class="mx-auto mb-3 h-8 w-8 text-[#4876c7] dark:text-[#9ab5e3]"
          stroke-width="1.5"
        />
        <p :class="['dash-state-card__title', pageTitleClass, '!text-sm']">Select a store</p>
        <p :class="['dash-state-card__desc', cardDescClass]">
          Social sales metrics are scoped to the active branch.
        </p>
      </div>

      <template v-else>
        <div v-if="leadsStore.loading && leadsStore.leads.length === 0" class="space-y-3 p-4">
          <div v-for="i in 6" :key="i" class="h-10 animate-pulse rounded-sm bg-gray-200 dark:bg-white/10" />
        </div>

        <template v-else>
          <section :class="kpiGridWideClass">
            <div v-for="kpi in kpiCards" :key="kpi.key" :class="cardPaddedClass">
              <p :class="cardDescClass">{{ kpi.label }}</p>
              <p :class="[pageTitleClass, '!text-xl tabular-nums']">{{ kpi.value }}</p>
            </div>
          </section>

          <div :class="chartsGridClass">
            <section :class="[cardFlushClass, 'dash-charts-grid__main overflow-hidden']">
              <div
                :class="[
                  cardHeaderClass,
                  'dash-card__header--compact !mb-0 border-b px-4 py-3 sm:flex-row sm:items-center',
                ]"
              >
                <div>
                  <h2 :class="cardTitleClass">Leads by platform</h2>
                  <p :class="cardDescClass">All open and closed leads</p>
                </div>
              </div>
              <div class="dash-chart-wrap dash-chart-wrap--tall px-2 py-2">
                <LazyApexChart
                  v-if="analytics.leadsByPlatform.length > 0"
                  type="donut"
                  height="280"
                  :options="leadsByPlatformOptions"
                  :series="leadsByPlatformSeries"
                />
                <p v-else :class="[emptyClass, 'p-6']">No leads yet.</p>
              </div>
            </section>

            <section :class="[cardPaddedClass, 'dash-charts-grid__side flex flex-col']">
              <h2 :class="cardTitleClass">Revenue by platform</h2>
              <p :class="cardDescClass">Won leads only (demo data)</p>
              <div class="mt-2 flex-1">
                <LazyApexChart
                  v-if="analytics.revenueByPlatform.length > 0"
                  type="bar"
                  height="280"
                  :options="revenueByPlatformOptions"
                  :series="revenueByPlatformSeries"
                />
                <p v-else :class="emptyClass">No won leads yet.</p>
              </div>
            </section>
          </div>

          <section :class="cardPaddedClass">
            <div :class="[cardHeaderClass, 'dash-card__header--compact']">
              <div>
                <h2 :class="cardTitleClass">Recent leads</h2>
                <p :class="cardDescClass">Latest enquiries from social channels</p>
              </div>
              <NuxtLink to="/dashboard/social-sales/leads" :class="cardLinkClass">View all</NuxtLink>
            </div>
            <div class="overflow-x-auto">
              <table class="dashboard-table min-w-full">
                <thead>
                  <tr>
                    <th scope="col">Customer</th>
                    <th scope="col">Platform</th>
                    <th scope="col">Product</th>
                    <th scope="col">Status</th>
                    <th scope="col">Est. value</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="lead in recentLeads" :key="lead.id">
                    <td>
                      <NuxtLink
                        :to="`/dashboard/social-sales/leads/${lead.id}`"
                        class="dashboard-table__primary font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"
                      >
                        {{ lead.customerName }}
                      </NuxtLink>
                    </td>
                    <td>{{ socialPlatformLabel(lead.platform) }}</td>
                    <td class="max-w-[12rem] truncate">{{ lead.productName }}</td>
                    <td><SocialLeadStatusBadge :status="lead.status" /></td>
                    <td class="tabular-nums">{{ formatCurrency(lead.estimatedValue) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        </template>
      </template>
    </template>

    <CreateSocialLeadModal v-model="showCreateModal" />
  </div>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent, onMounted, ref, watch } from 'vue'
import { BuildingStorefrontIcon, PlusIcon } from '~/utils/app-icons'
import Button from '~/components/ui/Button.vue'
import SocialSalesSubNav from '~/components/social-sales/SocialSalesSubNav.vue'
import SocialLeadStatusBadge from '~/components/social-sales/SocialLeadStatusBadge.vue'
import CreateSocialLeadModal from '~/components/social-sales/CreateSocialLeadModal.vue'
import PlanUpgradePrompt from '~/components/subscription/PlanUpgradePrompt.vue'
import { useSocialSalesLeadsStore } from '~/stores/social-sales/leads'
import { useStoresStore } from '~/stores/stores'
import { useAuthStore } from '~/stores/auth'
import { useThemeStore } from '~/stores/theme'
import {
  computeSocialSalesAnalytics,
  computeSocialSalesDashboardMetrics,
} from '~/composables/social-sales/useSocialSalesMetrics'
import { useSocialSalesCharts } from '~/composables/social-sales/useSocialSalesCharts'
import { socialPlatformLabel } from '~/types/social-sales'

const LazyApexChart = defineAsyncComponent(
  () => import('~/components/charts/LazyApexChart.client.vue')
)

definePageMeta({ layout: 'dashboard' })

useHead({ title: 'Social Sales - Storvv' })

const { eyebrowClass, pageTitleClass, headerBtnClass, pageWithFixedFooterClass } =
  useDashboardPageChrome()
const {
  cardPaddedClass,
  cardFlushClass,
  cardHeaderClass,
  cardTitleClass,
  cardDescClass,
  cardLinkClass,
  chartsGridClass,
  emptyClass,
  stateCardClass,
  kpiGridWideClass,
} = useDashboardAnalyticsChrome()

const leadsStore = useSocialSalesLeadsStore()
const storesStore = useStoresStore()
const authStore = useAuthStore()
const themeStore = useThemeStore()
const { formatCurrency } = usePreferences()
const { canUse: canUseSubscriptionFeature } = useSubscriptionFeatures()

const canAccess = computed(() => !!authStore.currentUser)
const showCreateModal = ref(false)

const metrics = computed(() =>
  leadsStore.leads.length > 0 ? computeSocialSalesDashboardMetrics(leadsStore.leads) : null
)

const analytics = computed(() => computeSocialSalesAnalytics(leadsStore.leads))

const {
  leadsByPlatformSeries,
  leadsByPlatformOptions,
  revenueByPlatformSeries,
  revenueByPlatformOptions,
} = useSocialSalesCharts(
  analytics,
  computed(() => themeStore.actualTheme === 'dark'),
  formatCurrency
)

const headerMetrics = computed(() => {
  const m = metrics.value
  if (!m) return []
  return [
    { key: 'total', label: 'Total leads', value: String(m.totalLeads) },
    { key: 'won', label: 'Won', value: String(m.wonLeads) },
    { key: 'conv', label: 'Conversion', value: `${m.conversionRate}%` },
  ]
})

const kpiCards = computed(() => {
  const m = metrics.value
  if (!m) return []
  return [
    { key: 'whatsapp', label: 'WhatsApp leads', value: String(m.whatsappLeads) },
    { key: 'instagram', label: 'Instagram leads', value: String(m.instagramLeads) },
    { key: 'won', label: 'Won leads', value: String(m.wonLeads) },
    { key: 'lost', label: 'Lost leads', value: String(m.lostLeads) },
    { key: 'conv', label: 'Conversion rate', value: `${m.conversionRate}%` },
    { key: 'rev-wa', label: 'Revenue · WhatsApp', value: formatCurrency(m.revenueWhatsapp) },
    { key: 'rev-ig', label: 'Revenue · Instagram', value: formatCurrency(m.revenueInstagram) },
    { key: 'rev-wi', label: 'Revenue · Walk-ins', value: formatCurrency(m.revenueWalkIn) },
  ]
})

const recentLeads = computed(() =>
  [...leadsStore.leads].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, 5)
)

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
