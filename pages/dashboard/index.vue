<template>
  <div :class="pageClass">
    <Tutorial :tutorial-steps="tutorialSteps" @complete="onTutorialComplete" />

    <header data-tutorial="dashboard" :class="pageHeaderClass">
      <div class="min-w-0">
        <p :class="eyebrowClass">Overview</p>
        <h1 :class="pageTitleClass">Welcome back, {{ userName }}</h1>
        <p :class="pageMetaClass">
          <strong>{{ currentStoreLabel }}</strong>
          <span v-if="userRoleLabel"> · {{ userRoleLabel }}</span>
          <span> · </span>
          <span :class="numClass">{{ totalOrders }} receipts</span>
        </p>
      </div>
    </header>

    <div v-if="needsStoreSelection && !isLoading" :class="stateCardClass">
      <MarketingFeatureIcon
        name="branch"
        size="lg"
        class="mx-auto mb-3 text-[#4876c7] dark:text-[#9ab5e3]"
      />
      <p :class="['dash-state-card__title', pageTitleClass, '!text-sm']">
        Select a store to load your dashboard
      </p>
      <p :class="['dash-state-card__desc', cardDescClass]">
        Choose a branch from the store selector in the top bar. Metrics, charts, and alerts are scoped to the active
        store.
      </p>
      <NuxtLink to="/dashboard/settings" :class="[linkClass, 'mt-4 inline-block']">
        Manage stores in Settings
      </NuxtLink>
    </div>

    <template v-else-if="isLoading">
      <div :class="kpiGridClass">
        <div v-for="i in nativeKpiSkeletonCount" :key="`kpi-${i}`" class="dash-skeleton dash-skeleton--kpi" />
      </div>

      <div :class="cardPaddedClass">
        <div class="mb-3 flex items-center justify-between">
          <div class="dash-skeleton h-3 w-32" />
          <div class="dash-skeleton h-3 w-20" />
        </div>
        <div class="dash-skeleton dash-skeleton--bar !h-1" />
      </div>

      <div :class="chartsGridClass">
        <div class="dash-skeleton dash-skeleton--panel dash-charts-grid__main" />
        <div class="dash-skeleton dash-skeleton--panel dash-charts-grid__side" />
      </div>

      <div :class="tripleGridClass">
        <div v-for="i in 3" :key="`panel-${i}`" class="dash-skeleton dash-skeleton--panel" />
      </div>
    </template>

    <template v-else>
      <ul v-if="attentionItems.length > 0" :class="alertListClass">
        <li v-for="alert in attentionItemsTop" :key="alert.id" :class="alertClass(alert.level)">
          <span class="dash-alert__text">
            <strong>{{ alert.title }}.</strong>
            {{ alert.description }}
          </span>
          <NuxtLink :to="alert.href" :class="['dash-alert__link', cardLinkClass, '!text-[inherit]']">
            {{ alert.cta }}
          </NuxtLink>
        </li>
      </ul>

      <div class="dash-home-kpi">
        <div :class="kpiGridClassResolved">
          <StatCard
            label="Total revenue"
            :value="formatCurrency(totalRevenue)"
            :subtext="revenueChangeText"
            :change="revenueChangePercent"
            :change-positive="revenueChangePositive"
            :sparkline-data="statCardRevenueSparkline.length > 1 ? statCardRevenueSparkline : undefined"
          />
          <StatCard
            label="Orders today"
            :value="todayReceiptsCount.toString()"
            :subtext="`${formatCurrency(todaySales)} revenue`"
          />
          <StatCard
            label="Customers"
            :value="totalCustomers.toString()"
            :subtext="`${newCustomersToday} active today`"
            :subtext-class="newCustomersToday > 0 ? 'success' : ''"
          />
          <StatCard
            label="Low stock signals"
            :value="lowStockItems.length.toString()"
            :subtext="lowStockItems.length > 0 ? 'Review restocking' : 'Within thresholds'"
            :subtext-class="lowStockItems.length > 0 ? 'warning' : ''"
          />
          <StatCard
            label="Outstanding"
            :value="formatCurrency(outstandingBalanceTotal)"
            :subtext="`${outstandingCount} open balance${outstandingCount === 1 ? '' : 's'}`"
            :subtext-class="outstandingCount > 0 ? 'warning' : ''"
          />
        </div>

        <div v-if="canViewProfitAndCost" :class="[kpiGridClassResolved, 'dash-kpi-grid--pair']">
          <StatCard
            label="Gross profit"
            :value="formatCurrency(dashboardGrossProfit)"
            :subtext="dashboardGrossProfitSubtext"
            :change-positive="dashboardGrossProfit >= 0"
          />
          <StatCard
            label="Cost of goods sold"
            :value="formatCurrency(dashboardCogs)"
            subtext="Completed sales with unit cost"
          />
        </div>
      </div>

      <section :class="[cardPaddedClass, 'dash-inventory-health']">
        <div :class="[cardHeaderClass, 'dash-card__header--compact dash-inventory-health__header']">
          <div>
            <p :class="eyebrowClass">Inventory health</p>
            <p :class="cardDescClass">
              <span :class="numClass">{{ inStockCount }}</span> available units ·
              <span :class="numClass">{{ outOfStockCount }}</span> sold ·
              <span :class="numClass">{{ lowStockItems.length }}</span> low-stock lines
            </p>
          </div>
          <NuxtLink to="/dashboard/inventory" :class="cardLinkClass">Open inventory</NuxtLink>
        </div>
        <div class="dash-inventory-health__footer">
          <div :class="[progressClass, 'dash-progress--slim']">
            <div
              class="dash-progress__segment--available transition-all"
              :style="{ width: `${inStockPercentage}%` }"
            />
            <div
              class="dash-progress__segment--low transition-all"
              :style="{ width: `${lowStockPercentage}%` }"
            />
            <div
              class="dash-progress__segment--sold transition-all"
              :style="{ width: `${soldPercentage}%` }"
            />
          </div>
          <div :class="[progressLegendClass, 'dash-progress__legend--compact']">
            <span :class="numClass">{{ inStockPercentage }}% available</span>
            <span :class="numClass">{{ soldPercentage }}% sold through</span>
            <span :class="numClass">{{ formatCurrency(inventoryTotalValue) }} on hand (book)</span>
          </div>
        </div>
      </section>

      <div :class="chartsGridClass">
        <section
          :class="[cardFlushClass, 'dash-charts-grid__main overflow-hidden']"
          data-tutorial="analytics-preview"
        >
          <div :class="[cardHeaderClass, 'dash-card__header--compact !mb-0 px-4 py-3 sm:flex-row sm:items-center']">
            <div>
              <h2 :class="cardTitleClass">Revenue performance</h2>
              <p :class="cardDescClass">{{ chartSubtitle }}</p>
            </div>
            <div :class="segmentGroupClass" role="group" aria-label="Chart period">
              <button
                v-for="opt in chartPeriodOptions"
                :key="opt.value"
                type="button"
                :class="[segmentBtnClass, chartView === opt.value ? segmentBtnActiveClass : '']"
                @click="chartView = opt.value"
              >
                {{ opt.label }}
              </button>
            </div>
          </div>
          <div :class="['dash-chart-wrap', chartData.length === 0 ? 'flex items-center justify-center' : '']">
            <div v-if="chartData.length === 0" class="text-center">
              <MarketingFeatureIcon name="analytics" size="lg" class="mx-auto mb-2 opacity-40" />
              <p :class="cardTitleClass">No revenue data yet</p>
              <p :class="cardDescClass">Completed receipts will populate this chart</p>
            </div>
            <ClientOnly v-else>
              <LazyApexChart type="area" :height="chartHeight" :options="chartOptions" :series="chartSeries" />
              <template #fallback>
                <div :class="emptyClass">Loading chart…</div>
              </template>
            </ClientOnly>
          </div>
        </section>

        <section :class="[cardPaddedClass, 'dash-charts-grid__side flex flex-col']">
          <p :class="eyebrowClass">Payment methods</p>
          <p :class="cardDescClass">Share of completed receipts by tender type</p>
          <div v-if="paymentMethodBreakdown.length === 0" :class="['dash-empty', 'mt-4']">
            No completed sales to analyze yet.
          </div>
          <ul v-else :class="barListClass">
            <li v-for="slice in paymentMethodsTop" :key="slice.method">
              <div :class="['dash-bar-row__head', numClass]">
                <span :class="['dash-bar-row__label', cardTitleClass, '!text-xs']">{{ slice.label }}</span>
                <span :class="['dash-bar-row__meta', numClass]">
                  {{ slice.share }}% · {{ formatCurrency(slice.revenue) }}
                </span>
              </div>
              <div :class="barTrackClass">
                <div
                  :class="barFillClass"
                  :style="{ width: `${Math.max(slice.share, 2)}%` }"
                />
              </div>
              <p :class="['dash-bar-row__foot', numClass]">
                {{ slice.count }} receipt{{ slice.count === 1 ? '' : 's' }}
              </p>
            </li>
          </ul>
        </section>
      </div>

      <PaymentLinksSummaryCard
        v-if="canUseSubscriptionFeature('payment_links') || showNativeComingSoon"
        card-class="dash-card dash-card--padded"
      />

      <section :class="cardPaddedClass">
        <div :class="cardHeaderClass">
          <p :class="eyebrowClass">Business metrics</p>
          <NuxtLink to="/dashboard/analytics" :class="cardLinkClass">Full analytics</NuxtLink>
        </div>
        <dl :class="metricGridClass">
          <div v-for="row in businessMetricsTop" :key="row.label" :class="metricRowClass">
            <dt>{{ row.label }}</dt>
            <dd :class="numClass">{{ row.value }}</dd>
          </div>
          <div v-if="canViewProfitAndCost" :class="metricRowClass">
            <dt>Gross profit</dt>
            <dd :class="[numClass, 'text-emerald-700 dark:text-emerald-400/90']">
              {{ formatCurrency(dashboardGrossProfit) }}
            </dd>
          </div>
        </dl>
      </section>

      <div :class="splitGridClass">
        <section :class="cardPaddedClass">
          <div :class="[cardHeaderClass, 'dash-card__header--compact']">
            <h2 :class="cardTitleClass">Recent receipts</h2>
            <NuxtLink to="/dashboard/receipts" :class="cardLinkClass">View all</NuxtLink>
          </div>
          <div v-if="recentReceipts.length === 0" :class="emptyClass">No receipts yet.</div>
          <ul v-else :class="listClass">
            <li v-for="tx in recentReceiptsTop" :key="tx.id" :class="listRowClass">
              <div class="min-w-0">
                <p :class="['dash-list__primary', 'truncate']">{{ tx.customerName }}</p>
                <p :class="['dash-list__secondary', numClass]">
                  <span>#{{ tx.receiptNumber }}</span>
                  <span aria-hidden="true"> · </span>
                  <span>{{ tx.paymentMethod }}</span>
                  <span class="hidden sm:inline" aria-hidden="true"> · </span>
                  <span class="hidden sm:inline">{{ tx.statusLabel }}</span>
                  <span aria-hidden="true"> · </span>
                  <span>{{ tx.time }}</span>
                </p>
              </div>
              <div class="shrink-0 text-right">
                <p :class="['dash-list__value', numClass]">{{ tx.amount }}</p>
                <ReceiptProfitHint
                  v-if="getRecentReceiptById(tx.id)"
                  :receipt="getRecentReceiptById(tx.id)!"
                  class="mt-0.5"
                />
              </div>
            </li>
          </ul>
        </section>

        <section :class="cardPaddedClass">
          <div :class="[cardHeaderClass, 'dash-card__header--compact']">
            <h2 :class="cardTitleClass">Top products</h2>
            <NuxtLink to="/dashboard/analytics" :class="cardLinkClass">Analytics</NuxtLink>
          </div>
          <div v-if="topSellingItems.length === 0" :class="emptyClass">No product sales yet.</div>
          <ul v-else :class="listClass">
            <li v-for="item in topProductsTop" :key="item.id" :class="listRowClass">
              <div class="min-w-0">
                <p :class="['dash-list__primary', 'truncate']">{{ item.name }}</p>
                <p :class="['dash-list__secondary', numClass]">{{ item.sales }} sold</p>
              </div>
              <p :class="['dash-list__value', numClass]">{{ formatCurrency(item.revenue) }}</p>
            </li>
          </ul>
        </section>
      </div>

      <div :class="tripleGridClass">
        <section :class="cardPaddedClass">
          <div :class="[cardHeaderClass, 'dash-card__header--compact']">
            <h2 :class="cardTitleClass">Low stock</h2>
            <div class="flex items-center gap-2">
              <button
                v-if="lowStockItems.length > 0"
                type="button"
                :class="[cardLinkClass, 'disabled:opacity-50']"
                :disabled="reorderExporting"
                @click="handleExportReorderList"
              >
                {{ reorderExporting ? 'Exporting…' : 'Export reorder list' }}
              </button>
              <NuxtLink to="/dashboard/inventory" :class="cardLinkClass">Inventory</NuxtLink>
            </div>
          </div>
          <div v-if="lowStockItems.length === 0" :class="emptyClass">All lines above threshold.</div>
          <ul v-else :class="listClass">
            <li v-for="item in lowStockItemsTop" :key="item.id" :class="listRowClass">
              <p :class="['dash-list__primary', 'truncate', '!font-medium']">{{ item.name }}</p>
              <span :class="['dash-list__value', 'dash-list__value--warning', numClass]">
                {{ item.quantity }}<span v-if="!item.isSerialNumber"> / {{ item.threshold }}</span>
              </span>
            </li>
          </ul>
        </section>

        <section v-if="canViewActivity" :class="cardPaddedClass">
          <div :class="[cardHeaderClass, 'dash-card__header--compact']">
            <h2 :class="cardTitleClass">Recent activity</h2>
            <NuxtLink to="/dashboard/activity" :class="cardLinkClass">All logs</NuxtLink>
          </div>
          <div v-if="recentActivityLogs.length === 0" :class="emptyClass">No activity logged yet.</div>
          <ul v-else :class="listClass">
            <li v-for="log in recentActivityLogsTop" :key="log.id" :class="[listRowClass, '!items-start gap-2']">
              <span class="self-start" :class="activityActionBadgeClass(log.action)">
                {{ activityActionLabel(log.action) }}
              </span>
              <div class="min-w-0 flex-1">
                <p :class="['dash-list__primary', 'truncate']">{{ activityLogPreviewTitle(log) }}</p>
                <p :class="['dash-list__secondary', numClass]">
                  {{ activityEntityTypeLabel(log.entityType) }}
                  <span class="hidden sm:inline"> · {{ log.userDisplayName }}</span>
                  · {{ formatActivityTime(log.createdAt) }}
                </p>
              </div>
            </li>
          </ul>
        </section>

        <section :class="[cardPaddedClass, canViewActivity ? '' : 'dash-triple-grid__wide']">
          <div :class="[cardHeaderClass, 'dash-card__header--compact']">
            <h2 :class="cardTitleClass">Shortcuts</h2>
          </div>
          <ul :class="listClass">
            <li v-for="link in quickLinksTop" :key="link.href" :class="listRowClass">
              <NuxtLink :to="link.href" class="dash-shortcut-link w-full">
                <span>{{ link.label }}</span>
                <span aria-hidden="true">→</span>
              </NuxtLink>
            </li>
          </ul>
        </section>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, defineAsyncComponent } from 'vue'

const LazyApexChart = defineAsyncComponent(
  () => import('~/components/charts/LazyApexChart.client.vue')
)
import { MARKETING_FEATURE_ICONS } from '~/utils/marketing-feature-icons'
import MarketingFeatureIcon from '~/components/marketing/MarketingFeatureIcon.vue'
import StatCard from '~/components/ui/StatCard.vue'
import PaymentLinksSummaryCard from '~/components/payments/PaymentLinksSummaryCard.vue'
import Tutorial, { type TutorialStep } from '~/components/Tutorial.vue'
import { useDashboardHomeChrome } from '~/composables/useDashboardHomeChrome'
import { useReceiptsStore } from '~/stores/receipts'
import { useInventoryStore } from '~/stores/inventory'
import { useDepartmentsStore } from '~/stores/departments'
import { useAuthStore } from '~/stores/auth'
import { useUserStore } from '~/stores/user'
import { useStoresStore } from '~/stores/stores'
import { getStoreBranchShortLabel } from '~/utils/store-branch-label'
import { useStaffStore } from '~/stores/staff'
import { useThemeStore } from '~/stores/theme'
import { usePreferences } from '~/composables/usePreferences'
import { useDashboardInsights } from '~/composables/useDashboardInsights'
import { useAppToast } from '~/composables/useAppToast'
import { useReorderListExport } from '~/composables/useReorderListExport'
import {
  activityActionBadgeClass,
  activityActionLabel,
  activityEntityTypeLabel,
  activityLogPreviewTitle,
  fetchActivityLogs,
  type ActivityLog,
} from '~/composables/useActivityLog'
import { useSubscriptionFeatures } from '~/composables/useSubscriptionFeatures'
import { usePermissions } from '~/composables/usePermissions'
import { useCapacitorNativeApp } from '~/composables/useCapacitorNativeApp'
import type { InventoryItem } from '~/stores/inventory'
import {
  formatMarginPercent,
  receiptLineRevenue,
  sumReceiptCogs,
  sumReceiptGrossProfit,
} from '~/utils/inventory-item-cost'

definePageMeta({
  layout: 'dashboard',
  middleware: 'auth',
})

const {
  pageClass,
  cardPaddedClass,
  cardFlushClass,
  pageHeaderClass,
  eyebrowClass,
  pageTitleClass,
  pageMetaClass,
  linkClass,
  cardHeaderClass,
  cardTitleClass,
  cardDescClass,
  cardLinkClass,
  kpiGridClass,
  chartsGridClass,
  splitGridClass,
  tripleGridClass,
  alertListClass,
  progressClass,
  progressLegendClass,
  segmentGroupClass,
  segmentBtnClass,
  segmentBtnActiveClass,
  listClass,
  listRowClass,
  metricGridClass,
  metricRowClass,
  barListClass,
  barTrackClass,
  barFillClass,
  numClass,
  emptyClass,
  stateCardClass,
  alertClass,
} = useDashboardHomeChrome()

/** Max rows shown in dashboard list cards (no in-card scrolling). */
const DASHBOARD_LIST_TOP = 5
/** Recent activity rows are taller (badge + two lines) — show fewer to match card height. */
const DASHBOARD_ACTIVITY_TOP = 3

const tutorialSteps: TutorialStep[] = [
  {
    title: 'Welcome to Your Dashboard',
    description:
      'Your command center summarizes revenue, inventory health, outstanding balances, and recent receipts for the active store.',
    icon: MARKETING_FEATURE_ICONS.dashboard,
    targetSelector: '[data-tutorial="dashboard"]',
  },
  {
    title: 'Manage Your Inventory',
    description:
      'Inventory folders track serial or quantity-based stock. Low-stock signals and sell-through rates appear here automatically.',
    icon: MARKETING_FEATURE_ICONS.inventory,
    targetSelector: '[data-tutorial="inventory"]',
  },
  {
    title: 'Create and Track Receipts',
    description:
      'Receipts drive revenue charts, customer counts, and payment-method breakdowns. Balance-due sales surface under Needs attention.',
    icon: MARKETING_FEATURE_ICONS.receipts,
    targetSelector: '[data-tutorial="receipts"]',
  },
  {
    title: 'View Analytics & Reports',
    description:
      'Open Analytics for deeper period comparisons, exports, and product-level charts beyond this overview.',
    lockedDescription:
      'Full Analytics and exports are on Storvv Medium and Enterprise. Your dashboard still shows revenue and payment trends in the preview below.',
    icon: MARKETING_FEATURE_ICONS.analytics,
    targetSelector: '[data-tutorial="analytics"]',
    fallbackTargetSelector: '[data-tutorial="analytics-preview"]',
    subscriptionFeature: 'analytics',
  },
  {
    title: 'Configure Your Settings',
    description:
      'Settings is where you manage stores, departments, staff roles, and inventory thresholds that shape dashboard alerts.',
    icon: MARKETING_FEATURE_ICONS.settings,
    targetSelector: '[data-tutorial="settings"]',
  },
]

const receiptsStore = useReceiptsStore()
const inventoryStore = useInventoryStore()
const departmentsStore = useDepartmentsStore()
const authStore = useAuthStore()
const userStore = useUserStore()
const storesStore = useStoresStore()
const staffStore = useStaffStore()
const themeStore = useThemeStore()

const { preferences } = usePreferences()
const { canUse: canUseSubscriptionFeature } = useSubscriptionFeatures()
const { showNativeComingSoon } = usePaymentLinksLaunch()
const { canViewProfitAndCost } = usePermissions()
const { isNativeApp } = useCapacitorNativeApp()

const currencySymbol = computed(() => preferences.value.currencySymbol || '$')
const dashboardFolderItems = ref<Record<string, InventoryItem[]>>({})

const toast = useAppToast()
const { exporting: reorderExporting, exportReorderListExcel } = useReorderListExport()

async function handleExportReorderList() {
  try {
    const { count } = await exportReorderListExcel()
    toast.success(`Reorder list exported (${count} ${count === 1 ? 'line' : 'lines'})`)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Export failed'
    toast.error(message)
  }
}

const insights = useDashboardInsights(dashboardFolderItems)
const {
  formatCurrency,
  totalRevenue,
  todaySales,
  totalOrders,
  todayReceiptsCount,
  outstandingCount,
  outstandingBalanceTotal,
  totalCustomers,
  newCustomersToday,
  inventoryTotalValue,
  inStockCount,
  outOfStockCount,
  inStockPercentage,
  soldPercentage,
  lowStockPercentage,
  dailyRevenueData,
  weeklyRevenueData,
  monthlyRevenueData,
  revenueChangePercent,
  revenueChangePositive,
  revenueChangeText,
  topSellingItems,
  lowStockItems,
  paymentMethodBreakdown,
  recentReceipts,
  attentionItems,
  quickLinks,
  operationsMetrics,
  salesMetrics,
  statCardRevenueSparkline,
} = insights

const nativeKpiSkeletonCount = computed(() => (canViewProfitAndCost.value ? 7 : 5))

const kpiGridClassResolved = computed(() =>
  isNativeApp.value ? `${kpiGridClass} dash-kpi-grid--compact` : kpiGridClass
)

function topN<T>(items: T[], limit = DASHBOARD_LIST_TOP): T[] {
  return items.slice(0, limit)
}

const attentionItemsTop = computed(() => topN(attentionItems.value))
const paymentMethodsTop = computed(() => topN(paymentMethodBreakdown.value))
const businessMetricsTop = computed(() => [...salesMetrics.value, ...operationsMetrics.value])

function getRecentReceiptById(id: string) {
  return receiptsStore.receipts.find((r) => r.id === id) ?? null
}

const recentReceiptsTop = computed(() => topN(recentReceipts.value))
const topProductsTop = computed(() => topN(topSellingItems.value))
const lowStockItemsTop = computed(() => topN(lowStockItems.value))
const recentActivityLogsTop = computed(() => topN(recentActivityLogs.value, DASHBOARD_ACTIVITY_TOP))
const quickLinksTop = computed(() => topN(quickLinks.value))

const isLoading = ref(true)
const chartView = ref<'daily' | 'weekly' | 'monthly'>('monthly')
const recentActivityLogs = ref<ActivityLog[]>([])

const chartPeriodOptions = [
  { value: 'daily' as const, label: 'Daily' },
  { value: 'weekly' as const, label: 'Weekly' },
  { value: 'monthly' as const, label: 'Monthly' },
]

const isManager = computed(
  () => userStore.userData?.role === 'staff' && staffStore.getCurrentStaffMember?.role === 'manager'
)
const canViewActivity = computed(
  () => (userStore.isSuperAdmin || isManager.value) && canUseSubscriptionFeature('activity_logs')
)

function lookupInventoryItemForProfit(itemId: string): InventoryItem | null {
  for (const list of Object.values(inventoryStore.items)) {
    const hit = list.find((i) => i.id === itemId)
    if (hit) return hit
  }
  for (const list of Object.values(dashboardFolderItems.value)) {
    const hit = list.find((i) => i.id === itemId)
    if (hit) return hit
  }
  return null
}

const completedReceiptsForProfit = computed(() =>
  receiptsStore.receipts.filter((r) => r.status === 'completed')
)

const dashboardSalesRevenue = computed(() =>
  completedReceiptsForProfit.value.reduce((sum, receipt) => sum + receiptLineRevenue(receipt), 0)
)

const dashboardCogs = computed(() =>
  sumReceiptCogs(completedReceiptsForProfit.value, lookupInventoryItemForProfit)
)

const dashboardGrossProfit = computed(() =>
  sumReceiptGrossProfit(completedReceiptsForProfit.value, lookupInventoryItemForProfit)
)

const dashboardGrossProfitSubtext = computed(() => {
  if (dashboardSalesRevenue.value <= 0) return 'Add unit costs on inventory items'
  const margin = (dashboardGrossProfit.value / dashboardSalesRevenue.value) * 100
  return `${formatMarginPercent(margin)} gross margin on line revenue`
})

const needsStoreSelection = computed(() => !storesStore.currentStoreId)

const currentStoreLabel = computed(() => {
  const store = storesStore.currentStore
  if (!store) return 'No store selected'
  return getStoreBranchShortLabel(store.name) || 'Active store'
})

const userRoleLabel = computed(() => {
  const role = userStore.userData?.role
  if (role === 'superAdmin') return 'Super admin'
  if (role === 'admin') return 'Admin'
  if (role === 'staff') return isManager.value ? 'Manager' : 'Staff'
  if (role === 'user') return 'User'
  return ''
})

const userName = computed(() => {
  if (import.meta.server) return 'User'
  if (userStore.userData?.name) return userStore.userData.name.split(' ')[0] || 'User'
  if (authStore.currentUser?.displayName)
    return authStore.currentUser.displayName.split(' ')[0] || 'User'
  if (authStore.currentUser?.email) return authStore.currentUser.email.split('@')[0]
  return 'User'
})

const chartData = computed(() => {
  switch (chartView.value) {
    case 'weekly':
      return weeklyRevenueData.value
    case 'monthly':
      return monthlyRevenueData.value
    default:
      return dailyRevenueData.value
  }
})

const chartSubtitle = computed(() => {
  switch (chartView.value) {
    case 'weekly':
      return 'Last 12 weeks · completed sales only'
    case 'monthly':
      return 'Last 12 months · completed sales only'
    default:
      return 'Last 30 days · completed sales only'
  }
})

const chartSeries = computed(() => {
  if (chartData.value.length === 0) return []
  const seriesName =
    chartView.value === 'weekly'
      ? 'Weekly revenue'
      : chartView.value === 'monthly'
      ? 'Monthly revenue'
      : 'Daily revenue'
  const dataToUse = chartView.value === 'monthly' ? chartData.value.slice(-12) : chartData.value
  return [
    {
      name: seriesName,
      data: dataToUse.map((item) => item.revenue),
    },
  ]
})

const isMobile = ref(false)
if (import.meta.client) {
  isMobile.value = window.innerWidth < 640
  window.addEventListener('resize', () => {
    isMobile.value = window.innerWidth < 640
  })
}
const chartHeight = computed(() => (isMobile.value ? 176 : 220))

const chartOptions = computed(() => {
  const isDark = themeStore.actualTheme === 'dark'
  const lineColor = isDark ? '#9ab5e3' : '#4876c7'
  const gridColor = isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(15, 23, 42, 0.06)'
  const labelColor = isDark ? '#94a3b8' : '#64748b'

  return {
    chart: {
      type: 'area',
      height: chartHeight.value,
      toolbar: { show: false },
      zoom: { enabled: false },
      fontFamily: 'var(--app-font-sans, Quicksand, ui-sans-serif, system-ui, sans-serif)',
      background: 'transparent',
      animations: { enabled: true, easing: 'easeinout', speed: 600 },
    },
    dataLabels: { enabled: false },
    stroke: { curve: 'smooth', width: 2, colors: [lineColor] },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 0,
        opacityFrom: 0.22,
        opacityTo: 0,
        stops: [0, 100],
        colorStops: [
          { offset: 0, color: lineColor, opacity: 0.24 },
          { offset: 100, color: lineColor, opacity: 0 },
        ],
      },
    },
    xaxis: {
      categories: (() => {
        const data = chartView.value === 'monthly' ? chartData.value.slice(-12) : chartData.value
        return data.map((item, index) => {
          if (chartView.value === 'weekly') return `W${index + 1}`
          if (chartView.value === 'monthly')
            return item.date.toLocaleDateString('en-US', { month: 'short' })
          return item.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        })
      })(),
      labels: {
        style: { colors: labelColor, fontSize: '11px', fontWeight: 400 },
        rotate: chartView.value === 'monthly' ? 0 : -45,
        rotateAlways: false,
        offsetY: 4,
      },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      labels: {
        style: { colors: labelColor, fontSize: '11px', fontWeight: 400 },
        formatter: (value: number) => {
          const symbol = currencySymbol.value || '$'
          if (value >= 1000) return `${symbol}${(value / 1000).toFixed(1)}k`
          return `${symbol}${Math.round(value)}`
        },
      },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    grid: {
      borderColor: 'transparent',
      xaxis: { lines: { show: false } },
      yaxis: { lines: { show: true, color: gridColor } },
      padding: { top: 8, right: 4, bottom: 36, left: 4 },
    },
    tooltip: {
      theme: isDark ? 'dark' : 'light',
      y: { formatter: (value: number) => formatCurrency(value) },
    },
    theme: { mode: isDark ? 'dark' : 'light' },
    colors: [lineColor],
    legend: { show: false },
    markers: { size: 0, hover: { size: 4 } },
  }
})

function formatActivityTime(createdAt: ActivityLog['createdAt']): string {
  const d =
    createdAt instanceof Date
      ? createdAt
      : typeof createdAt === 'object' && createdAt && 'toDate' in createdAt
      ? (createdAt as { toDate: () => Date }).toDate()
      : new Date()
  const seconds = Math.floor((Date.now() - d.getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return d.toLocaleDateString()
}

const onTutorialComplete = () => {}

const loadDashboardData = async () => {
  try {
    if (authStore.loading) {
      let attempts = 0
      while (authStore.loading && attempts < 100) {
        await new Promise((resolve) => setTimeout(resolve, 100))
        attempts++
      }
    }

    if (!authStore.currentUser) return

    if (!userStore.userData || userStore.userData.uid !== authStore.currentUser.uid) {
      await userStore.fetchUserData(authStore.currentUser.uid)
    }

    await Promise.all([
      receiptsStore.fetchReceipts(),
      inventoryStore.fetchFolders(),
      departmentsStore.fetchDepartments(),
    ])

    dashboardFolderItems.value = await inventoryStore.fetchFolderAvailabilityStats()

    if (canViewActivity.value) {
      recentActivityLogs.value = await fetchActivityLogs(DASHBOARD_ACTIVITY_TOP)
    } else {
      recentActivityLogs.value = []
    }
  } catch (error) {
    console.error('Error loading dashboard data:', error)
  }
}

onMounted(async () => {
  isLoading.value = true
  await loadDashboardData()
  isLoading.value = false
})

watch(
  () => storesStore.currentStoreId,
  async (id, prev) => {
    if (id && id !== prev && authStore.currentUser) {
      isLoading.value = true
      await loadDashboardData()
      isLoading.value = false
    }
  }
)

watch(
  () => authStore.currentUser,
  async (newUser) => {
    if (newUser && !isLoading.value) {
      await loadDashboardData()
    }
  }
)

useHead({
  title: 'Dashboard - Storvv',
})
</script>