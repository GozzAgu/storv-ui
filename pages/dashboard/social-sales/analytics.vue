<template>
  <div :class="[pageClass, 'dash-page--unified']">
    <DashboardPageHeader class="dash-page-header--unified">
      <template #eyebrow>
        <p :class="eyebrowClass">Social Sales</p>
      </template>
      <template #title>
        <h1 :class="pageTitleClass">Analytics</h1>
      </template>
    </DashboardPageHeader>

    <SocialSalesSubNav v-if="canAccess" class="mb-1" />

    <div v-if="!canAccess" class="rounded-sm bg-red-50/90 px-4 py-4 dark:bg-red-950/25">
      <p class="text-xs font-medium text-red-800 dark:text-red-200">Sign in to view reports.</p>
    </div>

    <PlanUpgradePrompt
      v-else-if="!canUseSubscriptionFeature('social_sales')"
      feature="social_sales"
      title="Social Sales is on Medium and Enterprise"
      description="Upgrade for platform breakdowns, conversion trends, and top products from social."
      :title-class="pageTitleClass"
      :desc-class="cardDescClass"
    />

    <template v-else>
      <div v-if="!storesStore.currentStoreId && !leadsStore.loading" :class="stateCardClass">
        <BuildingStorefrontIcon
          class="mx-auto mb-3 h-8 w-8 text-[#4876c7] dark:text-[#9ab5e3]"
          stroke-width="1.5"
        />
        <p :class="['dash-state-card__title', pageTitleClass, '!text-sm']">Select a store</p>
        <p :class="['dash-state-card__desc', cardDescClass]">
          Reports are scoped to the active branch.
        </p>
      </div>

      <template v-else>
        <div v-if="leadsStore.loading" class="space-y-3 p-4">
          <div v-for="i in 4" :key="i" class="h-32 animate-pulse rounded-sm bg-gray-200 dark:bg-white/10" />
        </div>

        <template v-else>
          <div :class="splitGridClass">
            <section :class="cardPaddedClass">
              <h2 :class="cardTitleClass">Leads by platform</h2>
              <LazyApexChart
                v-if="analytics.leadsByPlatform.length > 0"
                type="donut"
                height="260"
                :options="leadsByPlatformOptions"
                :series="leadsByPlatformSeries"
              />
              <p v-else :class="emptyClass">No leads in this period.</p>
            </section>

            <section :class="cardPaddedClass">
              <h2 :class="cardTitleClass">Sales by platform</h2>
              <p :class="cardDescClass">Won leads count</p>
              <ul class="mt-3 space-y-2">
                <li
                  v-for="row in analytics.salesByPlatform"
                  :key="row.platform"
                  class="flex items-center justify-between text-sm"
                >
                  <span>{{ socialPlatformLabel(row.platform) }}</span>
                  <span :class="numClass">{{ row.count }}</span>
                </li>
              </ul>
              <p v-if="analytics.salesByPlatform.length === 0" :class="[emptyClass, 'mt-3']">
                No won leads yet.
              </p>
            </section>
          </div>

          <div :class="splitGridClass">
            <section :class="cardPaddedClass">
              <h2 :class="cardTitleClass">Revenue by platform</h2>
              <LazyApexChart
                v-if="analytics.revenueByPlatform.length > 0"
                type="bar"
                height="260"
                :options="revenueByPlatformOptions"
                :series="revenueByPlatformSeries"
              />
              <p v-else :class="emptyClass">No revenue from won leads.</p>
            </section>

            <section :class="cardPaddedClass">
              <h2 :class="cardTitleClass">Monthly conversion rate</h2>
              <LazyApexChart
                v-if="analytics.monthlyConversion.length > 0"
                type="line"
                height="260"
                :options="conversionOptions"
                :series="conversionSeries"
              />
              <p v-else :class="emptyClass">Not enough closed leads for trends.</p>
            </section>
          </div>

          <section :class="cardPaddedClass">
            <div :class="[cardHeaderClass, 'dash-card__header--compact']">
              <div>
                <h2 :class="cardTitleClass">Top products from social media</h2>
                <p :class="cardDescClass">WhatsApp & Instagram won leads</p>
              </div>
            </div>
            <div v-if="analytics.topProducts.length === 0" :class="emptyClass">
              No social product sales yet.
            </div>
            <table v-else class="dashboard-table min-w-full">
              <thead>
                <tr>
                  <th scope="col">Product</th>
                  <th scope="col" class="dashboard-table__col-numeric">Sales</th>
                  <th scope="col" class="dashboard-table__col-numeric">Revenue</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in analytics.topProducts" :key="row.productName">
                  <td>{{ row.productName }}</td>
                  <td class="dashboard-table__col-numeric tabular-nums">{{ row.count }}</td>
                  <td class="dashboard-table__col-numeric tabular-nums">
                    {{ formatCurrency(row.revenue) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </section>
        </template>
      </template>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent, onMounted, watch } from 'vue'
import { BuildingStorefrontIcon } from '~/utils/app-icons'
import SocialSalesSubNav from '~/components/social-sales/SocialSalesSubNav.vue'
import PlanUpgradePrompt from '~/components/subscription/PlanUpgradePrompt.vue'
import { useSocialSalesLeadsStore } from '~/stores/social-sales/leads'
import { useStoresStore } from '~/stores/stores'
import { useAuthStore } from '~/stores/auth'
import { useThemeStore } from '~/stores/theme'
import { computeSocialSalesAnalytics } from '~/composables/social-sales/useSocialSalesMetrics'
import { useSocialSalesCharts } from '~/composables/social-sales/useSocialSalesCharts'
import { socialPlatformLabel } from '~/types/social-sales'

const LazyApexChart = defineAsyncComponent(
  () => import('~/components/charts/LazyApexChart.client.vue')
)

definePageMeta({ layout: 'dashboard' })

useHead({ title: 'Social Sales Analytics - Storvv' })

const {
  pageClass,
  cardPaddedClass,
  cardHeaderClass,
  cardTitleClass,
  cardDescClass,
  splitGridClass,
  emptyClass,
  stateCardClass,
  numClass,
  eyebrowClass,
  pageTitleClass,
} = useDashboardHomeChrome()

const leadsStore = useSocialSalesLeadsStore()
const storesStore = useStoresStore()
const authStore = useAuthStore()
const themeStore = useThemeStore()
const { formatCurrency } = usePreferences()
const { canUse: canUseSubscriptionFeature } = useSubscriptionFeatures()

const canAccess = computed(() => !!authStore.currentUser)

const analytics = computed(() => computeSocialSalesAnalytics(leadsStore.leads))

const {
  leadsByPlatformSeries,
  leadsByPlatformOptions,
  revenueByPlatformSeries,
  revenueByPlatformOptions,
  conversionSeries,
  conversionOptions,
} = useSocialSalesCharts(
  analytics,
  computed(() => themeStore.actualTheme === 'dark'),
  formatCurrency
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
