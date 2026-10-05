<template>
  <div class="ds-root s-c s-page s-overview">
    <Tutorial
      v-if="!gettingStartedVisible"
      ref="tutorialRef"
      :tutorial-steps="resolvedTutorialSteps"
      @complete="onTutorialComplete"
    />

    <SPageHeader :title="formatGreeting(userName || 'there')" data-tutorial="dashboard">
      <template #eyebrow>
        <p class="s-page-header__eyebrow">
          {{ currentStoreLabel }}<template v-if="userRoleLabel"> · {{ userRoleLabel }}</template>
        </p>
      </template>
      <template v-if="!needsStoreSelection && !isLoading && dayStory" #description>
        {{ dayStory }}
      </template>
      <template v-if="!needsStoreSelection" #actions>
        <SButton v-if="canManageInventoryItems" to="/dashboard/inventory">
          <template #leading>
            <PackagePlus :size="16" :stroke-width="1.75" aria-hidden="true" />
          </template>
          Add product
        </SButton>
        <SButton variant="primary" to="/dashboard/receipts?new=1">
          <template #leading>
            <Plus :size="16" :stroke-width="2" aria-hidden="true" />
          </template>
          New sale
        </SButton>
      </template>
    </SPageHeader>

    <SCard v-if="needsStoreSelection && !isLoading">
      <SEmptyState
        title="Select a store"
        :description="
          canManageBranches
            ? 'Pick the branch you want to see. Every number on this page is for one branch at a time.'
            : 'We are connecting to your store. This usually takes a moment.'
        "
      >
        <template #icon><Store :size="20" :stroke-width="1.75" /></template>
        <template v-if="canManageBranches" #actions>
          <InlineStorePicker />
          <SButton variant="ghost" size="sm" to="/dashboard/settings">Manage stores</SButton>
        </template>
      </SEmptyState>
    </SCard>

    <template v-else-if="isLoading">
      <div class="s-overview__stats" role="status" aria-label="Loading overview">
        <div v-for="i in 4" :key="`stat-${i}`" class="s-stat">
          <SSkeleton width="50%" height="16px" />
          <SSkeleton width="70%" height="32px" />
          <SSkeleton width="40%" height="16px" />
        </div>
      </div>
      <div class="s-overview__row s-overview__row--main">
        <SCard><SSkeleton height="260px" /></SCard>
        <SCard><SSkeleton :lines="4" height="40px" /></SCard>
      </div>
      <div class="s-overview__row s-overview__row--main">
        <SCard><SSkeleton :lines="5" height="40px" /></SCard>
        <SCard><SSkeleton :lines="5" height="40px" /></SCard>
      </div>
    </template>

    <template v-else>
      <GettingStartedChecklist />

      <div v-if="isQuietDashboard && !gettingStartedVisible" class="s-overview-quiet">
        <SCard class="s-overview-quiet__hero">
          <p class="s-overview-quiet__eyebrow">Today</p>
          <h2 class="s-overview-quiet__title">{{ quietHeadline }}</h2>
          <p class="s-overview-quiet__meta">{{ formatCurrency(0) }} revenue · 0 sales so far</p>
          <SButton v-if="quietPrimaryCta" variant="primary" :to="quietPrimaryCta.href">
            {{ quietPrimaryCta.label }}
          </SButton>
        </SCard>
        <SCard title="Shortcuts" flush>
          <ul class="s-list">
            <li v-for="link in quietShortcutLinks" :key="link.href">
              <NuxtLink :to="link.href" class="s-list__item s-list__item--interactive">
                <span class="s-list__main">
                  <span class="s-list__primary">{{ link.label }}</span>
                </span>
                <ChevronRight class="s-list__lead" :size="16" :stroke-width="2" aria-hidden="true" />
              </NuxtLink>
            </li>
          </ul>
        </SCard>
      </div>

      <template v-else-if="!isQuietDashboard">
        <div class="s-overview__stats">
          <SStat
            label="Revenue"
            :value="formatCurrency(totalRevenue)"
            :delta="revenueDelta"
            :hint="revenueChangeText"
            to="/dashboard/analytics"
          >
            <template #icon><Banknote :size="16" :stroke-width="2" /></template>
          </SStat>
          <SStat
            label="Sales today"
            :value="todayReceiptsCount"
            :hint="`${formatCurrency(todaySales)} revenue`"
            to="/dashboard/receipts"
          >
            <template #icon><ShoppingBag :size="16" :stroke-width="2" /></template>
          </SStat>
          <SStat
            label="Outstanding"
            :value="formatCurrency(outstandingBalanceTotal)"
            :hint="`${outstandingCount} open balance${outstandingCount === 1 ? '' : 's'}`"
            :tone="outstandingCount > 0 ? 'warning' : undefined"
            to="/dashboard/receipts?tab=outstanding"
          >
            <template #icon><Clock :size="16" :stroke-width="2" /></template>
          </SStat>
          <SStat
            label="Low stock"
            :value="lowStockItems.length"
            :hint="lowStockItems.length > 0 ? 'Review restocking' : 'All above reorder level'"
            :tone="lowStockItems.length > 0 ? 'warning' : undefined"
            to="/dashboard/inventory"
          >
            <template #icon><TriangleAlert :size="16" :stroke-width="2" /></template>
          </SStat>
        </div>

        <div class="s-overview__row s-overview__row--main">
          <OverviewRevenueChart
            :daily="dailyRevenueData"
            :weekly="weeklyRevenueData"
            :monthly="monthlyRevenueData"
            :currency-symbol="currencySymbol"
          />
          <OverviewAttention :items="homeAttentionItems" />
        </div>

        <div class="s-overview__row s-overview__row--main">
          <SCard title="Recent sales" flush>
            <template #actions>
              <SButton variant="ghost" size="sm" to="/dashboard/receipts">View all</SButton>
            </template>
            <SEmptyState
              v-if="recentReceipts.length === 0"
              title="No sales yet"
              description="Your latest sales will show up here."
            >
              <template #actions>
                <SButton variant="primary" size="sm" to="/dashboard/receipts?new=1">
                  New sale
                </SButton>
              </template>
            </SEmptyState>
            <ul v-else class="s-list">
              <li v-for="tx in recentReceiptsTop" :key="tx.id">
                <button
                  type="button"
                  class="s-list__item s-list__item--interactive"
                  @click="openHomeReceipt(tx.id)"
                >
                  <SAvatar :name="tx.customerName" />
                  <span class="s-list__main">
                    <span class="s-list__primary">{{ tx.customerName }}</span>
                    <span class="s-list__secondary">
                      #{{ tx.receiptNumber }} · {{ tx.paymentMethod }} · {{ tx.time }}
                    </span>
                  </span>
                  <span class="s-list__end">
                    <span class="s-list__value">{{ tx.amount }}</span>
                    <SBadge v-if="tx.status !== 'completed'" :tone="getReceiptStatusTone(tx.status)">
                      {{ tx.statusLabel }}
                    </SBadge>
                    <ReceiptProfitHint
                      v-else-if="getRecentReceiptById(tx.id)"
                      :receipt="getRecentReceiptById(tx.id)!"
                    />
                  </span>
                </button>
              </li>
            </ul>
          </SCard>

          <SCard title="Low stock" flush>
            <template #actions>
              <SButton
                v-if="lowStockItems.length > 0"
                variant="ghost"
                size="sm"
                :loading="reorderExporting"
                @click="handleExportReorderList"
              >
                <template v-if="!reorderExporting" #leading>
                  <Download :size="16" :stroke-width="1.75" aria-hidden="true" />
                </template>
                Export
              </SButton>
            </template>
            <p v-if="lowStockItems.length === 0" class="s-list__empty">
              Everything is above its reorder level.
            </p>
            <ul v-else class="s-list">
              <li v-for="item in lowStockItemsTop" :key="item.id">
                <NuxtLink
                  :to="`/dashboard/inventory/${item.folderId}`"
                  class="s-list__item s-list__item--interactive"
                >
                  <span class="s-list__main">
                    <span class="s-list__primary">{{ item.name }}</span>
                    <span class="s-list__secondary">{{ lowStockMeta(item) }}</span>
                  </span>
                  <span class="s-list__value s-list__value--warning">
                    {{ item.isSerialNumber ? 'Serial' : `${item.quantity} left` }}
                  </span>
                </NuxtLink>
              </li>
            </ul>
          </SCard>
        </div>
      </template>
    </template>

    <ReceiptDetailsDrawer
      v-model="showHomeReceiptDrawer"
      :receipt="homeSelectedReceipt"
      @preview="previewHomeReceipt"
      @record-payment="goReceiptAction('outstanding')"
      @cancel="goReceiptAction()"
      @refund="goReceiptAction()"
      @print="printHomeReceipt"
    />
    <ViewReceiptModal
      v-model="showHomeReceiptPreview"
      :receipt="homeSelectedReceipt"
    />
    <div
      v-if="homePrintReceipt"
      class="pointer-events-none fixed left-[-10000px] top-0 opacity-0"
      aria-hidden="true"
    >
      <ReceiptShareSurface
        ref="homeShareSurfaceRef"
        :receipt="homePrintReceipt"
        :business-name="homePrintBusinessName"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, defineAsyncComponent, nextTick } from 'vue'
import { Banknote, ChevronRight, Clock, Download, PackagePlus, Plus, ShoppingBag, Store, TriangleAlert } from '@lucide/vue'

const Tutorial = defineAsyncComponent(() => import('~/components/Tutorial.vue'))
const GettingStartedChecklist = defineAsyncComponent(
  () => import('~/components/dashboard/GettingStartedChecklist.vue')
)
import type { TutorialStep } from '~/components/Tutorial.vue'
import { MARKETING_FEATURE_ICONS } from '~/utils/marketing-feature-icons'
import SAvatar from '~/components/s/SAvatar.vue'
import SBadge from '~/components/s/SBadge.vue'
import SButton from '~/components/s/SButton.vue'
import SCard from '~/components/s/SCard.vue'
import SEmptyState from '~/components/s/SEmptyState.vue'
import SPageHeader from '~/components/s/SPageHeader.vue'
import SSkeleton from '~/components/s/SSkeleton.vue'
import SStat from '~/components/s/SStat.vue'
import OverviewAttention from '~/components/overview/OverviewAttention.vue'
import OverviewRevenueChart from '~/components/overview/OverviewRevenueChart.vue'
import InlineStorePicker from '~/components/dashboard/InlineStorePicker.vue'
import ReceiptProfitHint from '~/components/receipts/ReceiptProfitHint.vue'
import ReceiptDetailsDrawer from '~/components/receipts/ReceiptDetailsDrawer.vue'
import ViewReceiptModal from '~/components/receipts/ViewReceiptModal.vue'
import ReceiptShareSurface from '~/components/receipts/ReceiptShareSurface.vue'
import type { Receipt } from '~/stores/receipts'
import type { DashboardAlert } from '~/composables/useDashboardInsights'
import { captureReceiptElementAsPdf } from '~/composables/useReceiptImageCapture'
import { usePaymentLinks } from '~/composables/usePaymentLinks'
import { runDashboardShellBootstrap } from '~/composables/useDashboardShellBootstrap'
import { scheduleNativeIdleWork } from '~/utils/capacitor-native-perf'
import { useReceiptsStore } from '~/stores/receipts'
import { useInventoryStore } from '~/stores/inventory'
import { useAuthStore } from '~/stores/auth'
import { useUserStore } from '~/stores/user'
import { useStoresStore } from '~/stores/stores'
import { getStoreBranchShortLabel } from '~/utils/store-branch-label'
import { getReceiptStatusTone } from '~/utils/receipt-status'
import { useSalesLeadsStore } from '~/stores/salesLeads'
import { useStorefrontStore } from '~/stores/storefront'
import { usePreferences } from '~/composables/usePreferences'
import { useDashboardInsights } from '~/composables/useDashboardInsights'
import { useAppToast } from '~/composables/useAppToast'
import { useReorderListExport } from '~/composables/useReorderListExport'
import { useSubscriptionFeatures } from '~/composables/useSubscriptionFeatures'
import { usePermissions } from '~/composables/usePermissions'
import { useCapacitorNativeApp } from '~/composables/useCapacitorNativeApp'
import { useDashboardPageRefreshRegister } from '~/composables/useDashboardPageRefresh'
import type { InventoryItem } from '~/stores/inventory'

definePageMeta({
  layout: 'dashboard',
  middleware: 'auth',
})

/** Max rows shown in dashboard list cards (no in-card scrolling). */
const DASHBOARD_LIST_TOP = 5

const tutorialSteps: TutorialStep[] = [
  {
    title: 'Welcome to Your Dashboard',
    description:
      'Your command center summarizes revenue, alerts, outstanding balances, and recent sales for the active store.',
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
    title: 'Create and Track Sales',
    description:
      'Sales drive revenue charts, customer counts, and payment-method breakdowns. Balance-due sales surface under Needs attention.',
    icon: MARKETING_FEATURE_ICONS.receipts,
    targetSelector: '[data-tutorial="sales"]',
    fallbackTargetSelector: '[data-tutorial="receipts"]',
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

const staffTutorialSteps: TutorialStep[] = [
  {
    title: 'Your dashboard',
    description:
      'See today’s sales, low-stock signals, and outstanding balances for your assigned store at a glance.',
    icon: MARKETING_FEATURE_ICONS.dashboard,
    targetSelector: '[data-tutorial="dashboard"]',
  },
  {
    title: 'Find inventory',
    description:
      'Browse categories and products your role can access. Add or update stock when your manager grants permission.',
    icon: MARKETING_FEATURE_ICONS.inventory,
    targetSelector: '[data-tutorial="inventory"]',
  },
  {
    title: 'Record sales',
    description:
      'Create receipts, take payments, and look up past sales for customers you serve.',
    icon: MARKETING_FEATURE_ICONS.receipts,
    targetSelector: '[data-tutorial="sales"]',
    fallbackTargetSelector: '[data-tutorial="receipts"]',
  },
  {
    title: 'Your profile',
    description:
      'Update your details, change your password, and review security settings from Profile.',
    icon: MARKETING_FEATURE_ICONS.profile,
    targetSelector: '[data-tutorial="profile"]',
  },
]

const tutorialRef = ref<InstanceType<typeof Tutorial> | null>(null)

const receiptsStore = useReceiptsStore()
const inventoryStore = useInventoryStore()
const authStore = useAuthStore()
const userStore = useUserStore()
const storesStore = useStoresStore()
const salesLeadsStore = useSalesLeadsStore()
const storefrontStore = useStorefrontStore()

const resolvedTutorialSteps = computed(() =>
  userStore.userData?.role === 'staff' ? staffTutorialSteps : tutorialSteps
)

const { preferences } = usePreferences()
const { canUse: canUseSubscriptionFeature } = useSubscriptionFeatures()
const canAccessLeadsPlan = computed(() => canUseSubscriptionFeature('sales_leads'))
const { canShowPaymentLinksSummary, showPaymentLinksComingSoon } = usePaymentLinksLaunch()
const paymentLinksLive = computed(
  () => canShowPaymentLinksSummary.value && !showPaymentLinksComingSoon.value
)
const { canManageBranches } = useBusinessCapabilities()
const { canManageInventoryItems, hasAnyManageAccess } = usePermissions()
const { isNativeApp } = useCapacitorNativeApp()
const { formatGreeting } = useTimeGreeting()
useDashboardPageRefreshRegister(async () => {
  await loadDashboardData({ force: true })
})

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
  dailyRevenueData,
  weeklyRevenueData,
  monthlyRevenueData,
  revenueChangePercent,
  revenueChangeText,
  lowStockItems,
  recentReceipts,
  dayStory,
  attentionItems,
} = insights

const revenueDelta = computed(() => {
  const raw = revenueChangePercent.value
  if (!raw) return undefined
  const value = Number.parseFloat(raw)
  return Number.isFinite(value) ? value : undefined
})

function topN<T>(items: T[], limit = DASHBOARD_LIST_TOP): T[] {
  return items.slice(0, limit)
}

const attentionItemsTop = computed(() => topN(attentionItems.value))

const { stats: paymentLinkStats, loadAll: loadPaymentLinksForAttention } = usePaymentLinks()

const homeAttentionItems = computed((): DashboardAlert[] => {
  const items = [...attentionItemsTop.value]
  if (paymentLinksLive.value && paymentLinkStats.value.failed > 0) {
    items.unshift({
      id: 'payment-links-failed',
      level: 'critical',
      title: 'Failed payment links',
      description: `${paymentLinkStats.value.failed} link${
        paymentLinkStats.value.failed === 1 ? '' : 's'
      } failed to collect.`,
      href: '/dashboard/payment-links',
      cta: 'Review links',
    })
  }
  return topN(items)
})

function lowStockMeta(item: { folderName?: string; isSerialNumber?: boolean; threshold?: number }) {
  const parts = [item.folderName?.trim()]
  if (!item.isSerialNumber) parts.push(`reorder at ${item.threshold}`)
  return parts.filter(Boolean).join(' · ')
}

function getRecentReceiptById(id: string) {
  return receiptsStore.receipts.find((r) => r.id === id) ?? null
}

const showHomeReceiptDrawer = ref(false)
const showHomeReceiptPreview = ref(false)
const homeSelectedReceipt = ref<Receipt | null>(null)
const homePrintReceipt = ref<Receipt | null>(null)
const homeShareSurfaceRef = ref<{ getElement: () => HTMLElement | null } | null>(null)

const homePrintBusinessName = computed(
  () => storesStore.currentStore?.name || userStore.userData?.businessName || 'Store'
)

function openHomeReceipt(id: string) {
  const receipt = getRecentReceiptById(id)
  if (!receipt) {
    void navigateTo(`/dashboard/receipts?receipt=${id}`)
    return
  }
  homeSelectedReceipt.value = receipt
  showHomeReceiptDrawer.value = true
}

function previewHomeReceipt(receipt: Receipt) {
  homeSelectedReceipt.value = receipt
  showHomeReceiptPreview.value = true
}

function goReceiptAction(tab?: string) {
  showHomeReceiptDrawer.value = false
  const id = homeSelectedReceipt.value?.id
  void navigateTo(
    tab
      ? `/dashboard/receipts?tab=${tab}${id ? `&receipt=${id}` : ''}`
      : id
        ? `/dashboard/receipts?receipt=${id}`
        : '/dashboard/receipts'
  )
}

async function printHomeReceipt(receipt: Receipt) {
  homePrintReceipt.value = receipt
  await nextTick()
  const el = homeShareSurfaceRef.value?.getElement?.()
  if (!el) {
    previewHomeReceipt(receipt)
    homePrintReceipt.value = null
    return
  }
  try {
    const blob = await captureReceiptElementAsPdf(el)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `receipt-${receipt.receiptNumber || receipt.id}.pdf`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Receipt PDF ready')
  } catch {
    previewHomeReceipt(receipt)
    toast.info('Opened receipt preview. Use Print / PDF there')
  } finally {
    homePrintReceipt.value = null
  }
}

const recentReceiptsTop = computed(() => topN(recentReceipts.value))
const lowStockItemsTop = computed(() => topN(lowStockItems.value))

const hasInitialDashboardData = receiptsStore.receipts.length > 0 || inventoryStore.folders.length > 0
const isLoading = ref(!hasInitialDashboardData)

const needsStoreSelection = computed(() => !storesStore.currentStoreId)

const { visible: gettingStartedVisible, nextStep: gettingStartedNextStep } =
  useGettingStartedPath()

/** New / empty workspace: compress chrome to a today strip + one CTA. */
const isQuietDashboard = computed(() => {
  if (needsStoreSelection.value || isLoading.value) return false
  if (inventoryStore.totalItems > 0 || inventoryStore.folders.length > 0) return false
  return (
    todayReceiptsCount.value === 0 &&
    todaySales.value === 0 &&
    totalRevenue.value === 0 &&
    totalOrders.value === 0 &&
    outstandingCount.value === 0 &&
    lowStockItems.value.length === 0
  )
})

const quietHeadline = computed(() => {
  if (gettingStartedNextStep.value) return gettingStartedNextStep.value.title
  if (inventoryStore.totalItems === 0) return 'Ready when you are'
  return 'Quiet day so far'
})

const quietPrimaryCta = computed(() => {
  if (gettingStartedNextStep.value) {
    return {
      href: gettingStartedNextStep.value.href,
      label: gettingStartedNextStep.value.cta,
    }
  }
  if (inventoryStore.totalItems === 0) {
    return { href: '/dashboard/inventory', label: 'Add product' }
  }
  return { href: '/dashboard/receipts?new=1', label: 'New sale' }
})

const quietShortcutLinks = computed(() => {
  if (quietPrimaryCta.value?.href === '/dashboard/inventory') {
    return [
      { href: '/dashboard/inventory', label: 'Add product' },
      { href: '/dashboard/receipts', label: 'Sales' },
      { href: '/dashboard/analytics', label: 'Reports' },
    ]
  }
  return [
    { href: '/dashboard/receipts?new=1', label: 'New sale' },
    { href: '/dashboard/inventory', label: 'Inventory' },
    { href: '/dashboard/analytics', label: 'Reports' },
  ]
})

const currentStoreLabel = computed(() => {
  const store = storesStore.currentStore
  if (!store) return 'No store selected'
  return getStoreBranchShortLabel(store.name) || 'Active store'
})

const userRoleLabel = computed(() => {
  const role = userStore.userData?.role
  if (role === 'superAdmin') return 'Super admin'
  if (role === 'admin') return 'Admin'
  if (role === 'staff') return hasAnyManageAccess.value ? 'Manager' : 'Staff'
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

const onTutorialComplete = () => {}

const loadDashboardData = async (options?: { force?: boolean }) => {
  try {
    if (!authStore.currentUser) return

    await runDashboardShellBootstrap(options)

    await Promise.all([
      receiptsStore.fetchReceipts(options),
      canAccessLeadsPlan.value ? salesLeadsStore.fetchSalesLeads(options?.force === true) : Promise.resolve(),
      storefrontStore.fetchAnalytics(options).catch(() => undefined),
    ])

    if (isNativeApp.value) {
      scheduleNativeIdleWork(() => {
        void inventoryStore.fetchFolderAvailabilityStats(options).then((grouped) => {
          dashboardFolderItems.value = grouped
        })
      }, 600)
    } else {
      dashboardFolderItems.value = await inventoryStore.fetchFolderAvailabilityStats(options)
    }
  } catch (error) {
    console.error('Error loading dashboard data:', error)
  }
}

const refreshDashboardAfterStoreSwitch = async () => {
  try {
    await Promise.all([
      receiptsStore.fetchReceipts({ force: true }),
      canAccessLeadsPlan.value ? salesLeadsStore.fetchSalesLeads(true) : Promise.resolve(),
      storefrontStore.fetchAnalytics({ force: true }).catch(() => undefined),
    ])
    if (isNativeApp.value) {
      scheduleNativeIdleWork(() => {
        void inventoryStore.fetchFolderAvailabilityStats({ force: true }).then((grouped) => {
          dashboardFolderItems.value = grouped
        })
      }, 600)
    } else {
      dashboardFolderItems.value = await inventoryStore.fetchFolderAvailabilityStats({ force: true })
    }
  } catch (error) {
    console.error('Error refreshing dashboard after store switch:', error)
  }
}

onMounted(async () => {
  const hasData = receiptsStore.receipts.length > 0 || inventoryStore.folders.length > 0
  if (!hasData) {
    isLoading.value = true
  }
  await loadDashboardData()
  if (paymentLinksLive.value) {
    void loadPaymentLinksForAttention().catch(() => undefined)
  }
  isLoading.value = false
})

watch(
  () => storesStore.currentStoreId,
  async (id, prev) => {
    if (!id || !prev || id === prev || !authStore.currentUser) return
    isLoading.value = true
    await refreshDashboardAfterStoreSwitch()
    isLoading.value = false
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
  title: 'Overview - Storvv',
})
</script>
