<template>
  <div v-if="checkingAuth" class="ds-root s-boot" role="status">
    <Loader2 class="s-spin s-boot__spinner" :size="24" :stroke-width="2" aria-hidden="true" />
    <p class="ds-small ds-text-muted">Verifying authentication…</p>
  </div>

  <div v-else :class="['ds-root s-shell', effectiveSidebarCollapsed ? 's-shell--collapsed' : '']">
    <a class="s-skip-link" href="#main-content">Skip to content</a>
    <ShellSidebar
      :sections="shellNavSections"
      :footer-items="shellFooterNav"
      :is-active="isShellNavActive"
      :collapsed="effectiveSidebarCollapsed"
      :busy="switchingStore"
      :home-to="dashPath('')"
      :logo-src="sidebarLogoSrc"
      :version="appVersion"
      @toggle-collapse="toggleSidebar"
    >
      <template v-if="showBranchSwitcher || currentStore" #branch>
        <ShellBranchSwitcher
          :interactive="showBranchSwitcher"
          :compact="effectiveSidebarCollapsed"
          :manage-to="dashPath('/branches')"
        />
      </template>
    </ShellSidebar>

    <div class="s-shell__main">
      <ShellTopBar :title="shellPageTitle" @search="openGlobalSearch()">
        <template v-if="showBranchSwitcher || currentStore" #lead>
          <ShellBranchSwitcher
            :interactive="showBranchSwitcher"
            :manage-to="dashPath('/branches')"
          />
        </template>
        <template #actions>
          <SButton
            v-if="assistantEnabled"
            class="s-topbar__ai"
            aria-label="Open Storvv Assistant"
            :aria-expanded="assistantStore.isOpen"
            aria-controls="dashboard-assistant-panel"
            @click.stop="openAssistant()"
          >
            <template #leading>
              <Sparkles :size="16" :stroke-width="1.75" aria-hidden="true" />
            </template>
            <span class="s-topbar__ai-label">Ask AI</span>
          </SButton>
          <SIconButton
            class="s-topbar__refresh"
            label="Refresh page"
            :loading="refreshBusy"
            @click="refreshPage"
          >
            <RefreshCw :size="20" :stroke-width="1.75" aria-hidden="true" />
          </SIconButton>
          <ShellNotifications />
          <ShellUserMenu
            :user-name="userName"
            :user-email="userEmail"
            :user-initials="userInitials"
            @sign-out="handleSignOut"
          />
        </template>
      </ShellTopBar>

      <main id="main-content" ref="dashboardMainRef" data-dashboard-main class="s-shell__content" tabindex="-1">
        <ShellPullToRefresh v-if="isNativeApp" />
        <div :key="route.path" class="s-shell__page">
          <DemoModeBanner v-if="isDemoDashboard" />
          <SubscriptionBillingBanner />
          <ClientOnly>
            <OfflineStatusBanner />
          </ClientOnly>
          <slot />
        </div>
      </main>
    </div>

    <ShellBottomNav
      :items="shellBottomNav"
      :more-items="shellMoreNav"
      :is-active="isShellNavActive"
    />

    <ClientOnly>
      <GrowthPromptsHost />
    </ClientOnly>

    <!-- Sign out confirmation -->
    <SDialog
      :open="showLogoutConfirm"
      title="Sign out?"
      description="You'll need to sign in again to access your dashboard."
      size="sm"
      role="alertdialog"
      :dismissible="!loggingOut"
      @update:open="(value: boolean) => { if (!value) cancelSignOut() }"
    >
      <template #footer>
        <SButton :disabled="loggingOut" data-autofocus @click="cancelSignOut">Cancel</SButton>
        <SButton variant="danger" :loading="loggingOut" @click="confirmSignOut">Sign out</SButton>
      </template>
    </SDialog>

    <!-- Global Search (deferred; especially on native to keep first paint lean) -->
    <GlobalSearch v-if="searchShellReady" />

    <DashboardAssistant v-if="assistantEnabled && assistantShellReady" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch, nextTick, defineAsyncComponent } from 'vue'
import { Loader2, RefreshCw, Sparkles } from '@lucide/vue'
import SButton from '~/components/s/SButton.vue'
import SIconButton from '~/components/s/SIconButton.vue'
import SDialog from '~/components/s/SDialog.vue'
import ShellSidebar from '~/components/shell/ShellSidebar.vue'
import ShellTopBar from '~/components/shell/ShellTopBar.vue'
import ShellBranchSwitcher from '~/components/shell/ShellBranchSwitcher.vue'
import ShellNotifications from '~/components/shell/ShellNotifications.vue'
import ShellUserMenu from '~/components/shell/ShellUserMenu.vue'
import ShellBottomNav from '~/components/shell/ShellBottomNav.vue'
import ShellPullToRefresh from '~/components/shell/ShellPullToRefresh.vue'
import {
  SHELL_BRANCHES_NAV_NAME,
  SHELL_CUSTOMERS_NAV_NAME,
  buildShellBottomNav,
  buildShellMoreNav,
  buildShellFooterNav,
  buildShellNavSections,
  shellNavLabel,
  shellRouteTitle,
  type ShellNavItem,
  type ShellNavSourceItem,
} from '~/utils/shell-nav'
import { usePageRefreshAction } from '~/composables/usePageRefreshAction'
import DemoModeBanner from '~/components/demo/DemoModeBanner.vue'
import SubscriptionBillingBanner from '~/components/dashboard/SubscriptionBillingBanner.vue'
import OfflineStatusBanner from '~/components/growth/OfflineStatusBanner.vue'
import { isDashboardNavActive } from '~/utils/shell-nav'
import { DASHBOARD_NAV_DEFINITIONS, filterDashboardNavItems } from '~/utils/dashboard-nav-filter'
import { isPaymentLinksComingSoon } from '~/utils/payment-links-launch'
import { isStorefrontDashboardHidden } from '~/utils/storefront-launch'
import { resolveStoreDepartmentsPath } from '~/utils/department-routes'
import { isStaffCreationInProgress } from '~/utils/staff-creation-session'
const GlobalSearch = defineAsyncComponent(() => import('~/components/search/GlobalSearch.vue'))
const DashboardAssistant = defineAsyncComponent(
  () => import('~/components/dashboard/DashboardAssistant.vue')
)
import { useFirebaseAuth } from '~/composables/useFirebaseAuth'
import { useTheme } from '~/composables/useTheme'
import { useAuthStore } from '~/stores/auth'
import { useUserStore } from '~/stores/user'
import { useNotificationsStore } from '~/stores/notifications'
import { useDepartmentsStore } from '~/stores/departments'
import { useStoresStore } from '~/stores/stores'
import { useSearchStore } from '~/stores/search'
import { isCapacitorNative } from '~/utils/capacitor-env'
import { scheduleNativeIdleWork } from '~/utils/capacitor-native-perf'
import { runDashboardShellBootstrap } from '~/composables/useDashboardShellBootstrap'

const { actualTheme } = useTheme()

const appVersion = (useRuntimeConfig().public.appVersion as string) ?? '0.1'
const authStore = useAuthStore()
const userStore = useUserStore()
const { canUse: canUseSubscriptionFeature } = useSubscriptionFeatures()
const { canUse: canUseBusinessCapability, canManageBranches } = useBusinessCapabilities()
const notificationsStore = useNotificationsStore()
const departmentsStore = useDepartmentsStore()
const storesStore = useStoresStore()
const searchStore = useSearchStore()
const { busy: refreshBusy, refresh: refreshPage } = usePageRefreshAction()
const searchShellReady = ref(false)
const assistantShellReady = ref(false)

function mountSearchShell() {
  if (!searchShellReady.value) searchShellReady.value = true
}

function mountAssistantShell() {
  if (!assistantShellReady.value) assistantShellReady.value = true
}

function mountShellWidgets() {
  mountSearchShell()
  mountAssistantShell()
}

const { openAssistant: openAssistantPanel, enabled: assistantEnabled } = useDashboardAssistant()

function openAssistant(draft?: string) {
  mountAssistantShell()
  nextTick(() => {
    if (assistantStore.isOpen && !draft) assistantStore.close()
    else openAssistantPanel(draft)
  })
}

function openGlobalSearch() {
  mountSearchShell()
  nextTick(() => searchStore.openSearch())
}

function handleGlobalSearchShortcut(e: KeyboardEvent) {
  if (isCapacitorNative()) return
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault()
    mountSearchShell()
    nextTick(() => searchStore.toggleSearch())
  }
}
const { syncSubscriptionStatus } = useSubscriptionBillingUi()
// Fetch notifications after shell is interactive (native defers further).
function scheduleNotificationsFetch() {
  if (!authStore.currentUser) return
  notificationsStore.fetchNotifications()
}

onMounted(() => {
  if (isCapacitorNative()) {
    scheduleNativeIdleWork(scheduleNotificationsFetch, 2000)
  } else if (authStore.currentUser) {
    scheduleNotificationsFetch()
  }
})

// Watch for auth changes to fetch notifications
watch(
  () => authStore.currentUser,
  (newUser) => {
    if (newUser) {
      if (isCapacitorNative()) {
        scheduleNativeIdleWork(scheduleNotificationsFetch, 1500)
      } else {
        scheduleNotificationsFetch()
      }
    }
  }
)

const { isNativeApp } = useCapacitorNativeApp()
const assistantStore = useAssistantStore()
const { activeMenu, openHeaderMenu, closeHeaderMenu } = useActiveHeaderMenu()
const dashboardMainRef = ref<HTMLElement | null>(null)

watch(
  () => assistantStore.isOpen,
  (isOpen) => {
    if (isOpen) {
      openHeaderMenu('assistant')
    } else {
      closeHeaderMenu('assistant')
    }
  }
)

// Another topnav popover (stores, notifications, profile) took over - close the assistant.
watch(activeMenu, (id) => {
  if (id !== 'assistant' && assistantStore.isOpen) {
    assistantStore.close()
  }
})

/** Never block the whole shell on auth - show UI with a short gate only (Capacitor-safe). */
const checkingAuth = ref(false)

const switchingStore = ref(false)

// Sidebar collapsed state with localStorage persistence
// Initialize synchronously on client to prevent layout shift
const sidebarCollapsed = ref(false)

// Load sidebar state synchronously before mount to prevent layout shift
if (import.meta.client) {
  try {
    const savedState = localStorage.getItem('sidebarCollapsed')
    if (savedState !== null) {
      sidebarCollapsed.value = savedState === 'true'
    }
  } catch (e) {
    // Ignore localStorage errors
  }
}

// Save sidebar state to localStorage when it changes
const toggleSidebar = () => {
  sidebarCollapsed.value = !sidebarCollapsed.value
  if (import.meta.client) {
    localStorage.setItem('sidebarCollapsed', String(sidebarCollapsed.value))
  }
}

/** Narrow icon rail only when lg+ and user collapsed; tablet drawer always shows full labels. */
const isLgUp = useMinWidthQuery(1024)
const effectiveSidebarCollapsed = computed(() => sidebarCollapsed.value && isLgUp.value)

const sidebarLogoSrc = computed(() =>
  actualTheme.value === 'dark' ? '/brand/storvv-logo-reversed.png' : '/brand/storvv-logo.png'
)

if (import.meta.client) {
  watch(
    () => effectiveSidebarCollapsed.value,
    (collapsed) => document.documentElement.classList.toggle('s-rail-collapsed', collapsed),
    { immediate: true }
  )
}

const navigation = DASHBOARD_NAV_DEFINITIONS

// Filter navigation based on user access and subscription plan (web sidebar + iOS/Android bottom nav)
const { hasAnyManageAccess, can } = usePermissions()
const { access: paymentsAccess, loadAccess: loadPaymentsAccess } = usePaymentsV2()
if (import.meta.client) {
  watch(
    () => storesStore.currentStoreId,
    () => void loadPaymentsAccess(),
    { immediate: true }
  )
}

const tradeEnabled = Boolean(useRuntimeConfig().public.trade)

function navFilterOptions(launchGates: boolean) {
  return {
    isSuperAdmin: userStore.isSuperAdmin,
    // "Manager-only" nav items now gate on any manage grant across the permission matrix,
    // rather than the retired manager/staff/intern role tier.
    isManager: hasAnyManageAccess.value,
    canViewModule: (module: Parameters<typeof can>[0]) => can(module, 'view'),
    canUseFeature: canUseSubscriptionFeature,
    canUseBusinessCapability,
    hidePaymentLinks: launchGates && isPaymentLinksComingSoon(),
    hideStorefront: launchGates && isStorefrontDashboardHidden(),
    canConfirmPayments: paymentsAccess.value.enabled && paymentsAccess.value.canConfirm,
    tradeEnabled,
  }
}

function navHref(item: { name: string; segment: string }) {
  return item.name === 'Departments'
    ? resolveStoreDepartmentsPath(storesStore.currentStoreId, storesStore.stores[0]?.id) ??
        dashPath('/departments')
    : dashPath(item.segment)
}

const filteredNavigation = computed(() => {
  return filterDashboardNavItems(navigation, navFilterOptions(true)).map((item) => ({
    ...item,
    href: navHref(item),
  }))
})

/** Web shell nav: unlaunched modules are left out; Customers shows wherever Sales does; Branches needs multi-location. */
const shellNavSource = computed<ShellNavSourceItem[]>(() => {
  const unlaunchedSegments = new Set<string>()
  if (isPaymentLinksComingSoon()) unlaunchedSegments.add('/payment-links')
  if (isStorefrontDashboardHidden()) unlaunchedSegments.add('/storefront')

  const items: ShellNavSourceItem[] = filterDashboardNavItems(navigation, navFilterOptions(false))
    .filter((item) => !unlaunchedSegments.has(item.segment))
    .map((item) => ({
      name: item.name,
      iconKey: item.iconKey,
      href: navHref(item),
    }))

  const sales = items.find((item) => item.name === 'Sales')
  if (sales) {
    items.push({
      name: SHELL_CUSTOMERS_NAV_NAME,
      iconKey: 'customers',
      href: dashPath('/customers'),
    })
  }
  if (userStore.isSuperAdmin && canManageBranches.value) {
    items.push({ name: SHELL_BRANCHES_NAV_NAME, iconKey: 'branch', href: dashPath('/branches') })
  }
  return items
})

const shellNavSections = computed(() => buildShellNavSections(shellNavSource.value))
const shellFooterNav = computed(() => buildShellFooterNav(shellNavSource.value))
const shellBottomNav = computed(() => buildShellBottomNav(shellNavSource.value))
const shellMoreNav = computed(() => buildShellMoreNav(shellNavSource.value))

const route = useRoute()
const { basePath, dashPath, isDemoDashboard, matchesDashboardPath } = useDashboardPaths()
useDemoConversionNudge()

const isActive = (href: string) => {
  const visibleHrefs = [
    ...filteredNavigation.value.map((item) => item.href),
    ...shellNavSource.value.map((item) => item.href),
  ]
  return isDashboardNavActive(route.path, href, visibleHrefs)
}

const onCustomersTab = computed(
  () => matchesDashboardPath(route.path, '/receipts') && route.query.tab === 'customers'
)

function isShellNavActive(item: ShellNavItem | ShellNavSourceItem) {
  if (item.name === SHELL_CUSTOMERS_NAV_NAME) {
    return onCustomersTab.value || matchesDashboardPath(route.path, '/customers')
  }
  if (item.name === SHELL_BRANCHES_NAV_NAME) return matchesDashboardPath(route.path, '/branches')
  if (item.name === 'Sales' && onCustomersTab.value) return false
  return isActive(item.href)
}

const shellPageTitle = computed(() => {
  const active = shellNavSource.value.find((item) => isShellNavActive(item))
  if (active) return shellNavLabel(active.name)
  return shellRouteTitle(route.path.slice(basePath.value.length))
})

useHead({ title: () => (shellPageTitle.value ? `${shellPageTitle.value} - Storvv` : 'Storvv') })

// Load stores and departments when user data is available
watch(
  [() => authStore.currentUser, () => authStore.loading],
  async ([user, loading]) => {
    if (!user || loading) return
    if (isStaffCreationInProgress()) return

    await runDashboardShellBootstrap()
  },
  { immediate: true }
)

watch(
  () => [
    userStore.userData?.subscription,
    userStore.userData?.subscriptionStatus,
    userStore.userData?.subscriptionCurrentPeriodEnd,
  ],
  async () => {
    if (userStore.userData?.role !== 'superAdmin' || !storesStore.stores.length) return
    await storesStore.applyPlanToCurrentStoreSelection()
  }
)

// Dim navigation while a branch switch reloads scoped data
watch(
  () => storesStore.currentStoreId,
  async (newStoreId, oldStoreId) => {
    if (!oldStoreId || !newStoreId || oldStoreId === newStoreId) return
    switchingStore.value = true
    await new Promise((resolve) => setTimeout(resolve, 500))
    switchingStore.value = false
  }
)

watch(
  () => storesStore.loading,
  (loading) => {
    if (!loading && switchingStore.value) {
      setTimeout(() => {
        switchingStore.value = false
      }, 300)
    }
  }
)

watch(
  () => route.path,
  (path) => {
    if (
      path.startsWith('/dashboard/stores/') &&
      path.includes('/departments') &&
      authStore.currentUser &&
      departmentsStore.departments.length === 0
    ) {
      departmentsStore
        .fetchDepartments()
        .catch((err) => console.error('Error fetching departments:', err))
    }
  },
  { immediate: true }
)

const currentStore = computed(() => storesStore.currentStore)
const showBranchSwitcher = computed(
  () => userStore.userData?.role === 'superAdmin' && canManageBranches.value
)

// Cache user profile info to prevent UI flickering during staff creation (sign out/sign in process)
// Store the super admin's info when they first load, and preserve it during staff creation
// Persist to localStorage to survive page refreshes
const getCachedUserName = (): string | null => {
  if (!import.meta.client) return null
  const stored = localStorage.getItem('cached_user_name')
  const storedUserId = localStorage.getItem('cached_user_id')
  const currentUserId = authStore.currentUser?.uid
  // Only return cached name if it's for the current user
  if (stored && storedUserId === currentUserId) {
    return stored
  }
  return null
}

const getCachedUserEmail = (): string | null => {
  if (!import.meta.client) return null
  const stored = localStorage.getItem('cached_user_email')
  const storedUserId = localStorage.getItem('cached_user_id')
  const currentUserId = authStore.currentUser?.uid
  // Only return cached email if it's for the current user
  if (stored && storedUserId === currentUserId) {
    return stored
  }
  return null
}

const getCachedUserId = (): string | null | undefined => {
  if (!import.meta.client) return null
  const stored = localStorage.getItem('cached_user_id')
  return stored || null
}

const setCachedUserName = (name: string | null, userId: string | null | undefined) => {
  if (!import.meta.client) return
  if (name && userId) {
    localStorage.setItem('cached_user_name', name)
    localStorage.setItem('cached_user_id', userId)
  }
}

const setCachedUserEmail = (email: string | null, userId: string | null | undefined) => {
  if (!import.meta.client) return
  if (email && userId) {
    localStorage.setItem('cached_user_email', email)
    localStorage.setItem('cached_user_id', userId)
  }
}

const clearCachedUser = () => {
  if (!import.meta.client) return
  localStorage.removeItem('cached_user_name')
  localStorage.removeItem('cached_user_email')
  localStorage.removeItem('cached_user_id')
}

// Initialize from localStorage on mount
const cachedUserName = ref<string | null>(getCachedUserName())
const cachedUserEmail = ref<string | null>(getCachedUserEmail())
const cachedUserId = ref<string | null | undefined>(getCachedUserId())

// Watch userStore.userData to cache super admin info when it's first loaded
watch(
  () => userStore.userData,
  (userData, oldUserData) => {
    // Check if staff creation is in progress - don't update cache during staff creation
    if (isStaffCreationInProgress() && cachedUserName.value) {
      return
    }

    // Only cache if this is a super admin (not staff) and we don't already have cached data
    if (userData?.role === 'superAdmin' && userData.uid) {
      // Only cache if this is a new user or we don't have cached data yet
      if (!cachedUserName.value || cachedUserId.value !== userData.uid) {
        if (userData.name) {
          cachedUserName.value = userData.name
          cachedUserId.value = userData.uid
          setCachedUserName(userData.name, userData.uid)
        }
        // Cache email from auth if available
        if (authStore.currentUser?.email && authStore.currentUser.uid === userData.uid) {
          cachedUserEmail.value = authStore.currentUser.email
          cachedUserId.value = authStore.currentUser.uid
          setCachedUserEmail(authStore.currentUser.email, authStore.currentUser.uid)
        }
      }
    }
  },
  { immediate: true }
)

// User profile data - use cached values during staff creation to prevent UI bug
const userName = computed(() => {
  // During SSR, return a safe default to prevent hydration mismatch
  if (import.meta.server) {
    return 'User'
  }

  const currentUserId = authStore.currentUser?.uid

  // During staff creation, always use cached name if available (preserve super admin name)
  if (isStaffCreationInProgress() && cachedUserName.value) {
    return cachedUserName.value
  }

  // If we have a cached name for the same user, keep using it (prevents flicker)
  // Also check localStorage in case ref was reset on refresh
  if (cachedUserName.value && cachedUserId.value === currentUserId) {
    return cachedUserName.value
  }

  // Check localStorage if ref cache is empty (e.g., after page refresh)
  if (!cachedUserName.value && currentUserId) {
    const storedName = getCachedUserName()
    const storedUserId = getCachedUserId()
    if (storedName && storedUserId === currentUserId) {
      cachedUserName.value = storedName
      cachedUserId.value = storedUserId
      return storedName
    }
  }

  // If no current user but we have cached data, use cache (prevents flicker during sign out)
  if (!currentUserId && cachedUserName.value) {
    return cachedUserName.value
  }

  // Try to get name from Firestore userData first (only if it's for the current auth user)
  // During staff creation, ignore userData if it's for staff (preserve super admin cache)
  if (userStore.userData?.name && currentUserId && userStore.userData.uid === currentUserId) {
    const name = (userStore.userData.name || '').trim()
    const userRole = userStore.userData.role

    // During staff creation, if userData shows staff, ignore it and use cache
    if (isStaffCreationInProgress() && userRole === 'staff') {
      return cachedUserName.value || 'User'
    }

    if (name) {
      // Super admin: business name. Staff / other roles: person name (stored on userData.name).
      if (userRole === 'superAdmin') {
        if (!isStaffCreationInProgress()) {
          cachedUserName.value = name
          cachedUserId.value = currentUserId ?? null
          setCachedUserName(name, currentUserId ?? null)
        }
        return name
      }

      // Prefer storeDetails.storeName only when it is the account business label for owners;
      // for staff keep the personal name from userData.name.
      return name
    }
  }
  // Fallback to Firebase Auth displayName
  if (authStore.currentUser?.displayName && currentUserId && !isStaffCreationInProgress()) {
    const name = authStore.currentUser.displayName ?? null
    if (name) {
      cachedUserName.value = name
      cachedUserId.value = currentUserId ?? null
      setCachedUserName(name, currentUserId ?? null)
      return name
    }
  }
  // Fallback to email prefix (part before @) - but only if we don't have a cached name
  // This prevents overwriting a cached name with email prefix on refresh
  const currentEmail = authStore.currentUser?.email
  if (currentEmail && currentUserId && !isStaffCreationInProgress()) {
    // Only use email prefix if we don't have a cached name in localStorage
    const storedName = getCachedUserName()
    if (!storedName || getCachedUserId() !== currentUserId) {
      const emailPrefix = currentEmail.split('@')[0]!
      cachedUserName.value = emailPrefix
      cachedUserEmail.value = currentEmail
      cachedUserId.value = currentUserId ?? null
      setCachedUserName(emailPrefix, currentUserId ?? null)
      setCachedUserEmail(currentEmail, currentUserId ?? null)
      return emailPrefix
    } else {
      // Use the stored name instead of email prefix
      cachedUserName.value = storedName
      cachedUserId.value = currentUserId ?? null
      return storedName
    }
  }

  // If no current user but we have cached data, use cache (prevents flicker)
  if (cachedUserName.value) {
    return cachedUserName.value
  }

  return 'User'
})

const userEmail = computed(() => {
  // During SSR, return a safe default to prevent hydration mismatch
  if (import.meta.server) {
    return ''
  }

  const currentUserId = authStore.currentUser?.uid

  // During staff creation, always use cached email if available (preserve super admin email)
  if (isStaffCreationInProgress() && cachedUserEmail.value) {
    return cachedUserEmail.value
  }

  // If we have cached email for the same user, keep using it
  // Also check localStorage in case ref was reset on refresh
  if (cachedUserEmail.value && cachedUserId.value === currentUserId) {
    return cachedUserEmail.value
  }

  // Check localStorage if ref cache is empty (e.g., after page refresh)
  if (!cachedUserEmail.value && currentUserId) {
    const storedEmail = getCachedUserEmail()
    const storedUserId = getCachedUserId()
    if (storedEmail && storedUserId === currentUserId) {
      cachedUserEmail.value = storedEmail
      cachedUserId.value = storedUserId
      return storedEmail
    }
  }

  // If no current user but we have cached data, use cache (prevents flicker during sign out)
  if (!currentUserId && cachedUserEmail.value) {
    return cachedUserEmail.value
  }

  const email = authStore.currentUser?.email || ''

  // Cache it for this user (only if not staff creation and it's super admin)
  if (email && currentUserId && !isStaffCreationInProgress()) {
    // Only cache if userStore indicates this is the current user (same uid) and is super admin (or we don't have userData yet)
    const isCurrentUserData = userStore.userData && userStore.userData.uid === currentUserId
    if ((isCurrentUserData && userStore.userData?.role === 'superAdmin') || !userStore.userData) {
      cachedUserEmail.value = email
      cachedUserId.value = currentUserId ?? null
      setCachedUserEmail(email, currentUserId ?? null)
    }
  }

  // During staff creation, if userData shows staff, ignore it and use cache
  if (isStaffCreationInProgress() && userStore.userData?.role === 'staff') {
    return cachedUserEmail.value || ''
  }

  return email
})

const userInitials = computed(() => {
  const name = userName.value
  if (!name || name === 'User') {
    // If no name, use first two letters of email
    const email = userEmail.value
    if (email) {
      return email.substring(0, 2).toUpperCase()
    }
    return 'U'
  }

  // Split name and get first letter of each word
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) {
    // First letter of first name + first letter of last name
    const first = parts[0]?.[0] || ''
    const last = parts[parts.length - 1]?.[0] || ''
    return (first + last).toUpperCase()
  } else if (parts.length === 1 && parts[0]) {
    // Single name, use first two letters
    return parts[0].substring(0, 2).toUpperCase()
  }
  return 'U'
})

const showLogoutConfirm = ref(false)
const loggingOut = ref(false)

const handleSignOut = () => {
  showLogoutConfirm.value = true
}

const cancelSignOut = () => {
  if (loggingOut.value) return
  showLogoutConfirm.value = false
}

const confirmSignOut = async () => {
  if (loggingOut.value) return
  loggingOut.value = true
  if (isDemoDashboard.value) {
    const { clearDemoSession } = await import('~/utils/demo-mode')
    clearDemoSession()
    showLogoutConfirm.value = false
    loggingOut.value = false
    return navigateTo('/')
  }
  const { signOut } = useFirebaseAuth()
  try {
    userStore.clearUserData()
    clearCachedUser()
    cachedUserName.value = null
    cachedUserEmail.value = null
    cachedUserId.value = null
    authStore.currentUser = null
    authStore.loading = false
    await signOut()
    await navigateTo('/signin', { replace: true })
  } catch (error) {
    console.error('Sign out error:', error)
    userStore.clearUserData()
    clearCachedUser()
    cachedUserName.value = null
    cachedUserEmail.value = null
    cachedUserId.value = null
    authStore.currentUser = null
    authStore.loading = false
    await navigateTo('/signin', { replace: true })
  } finally {
    showLogoutConfirm.value = false
    loggingOut.value = false
  }
}

// Close dropdowns on outside click
const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as Node
  const eventPath = typeof event.composedPath === 'function' ? event.composedPath() : []
  // Web assistant is a floating (non-modal) widget, teleported to <body> - no backdrop to
  // catch outside clicks, so check directly against its panel + trigger buttons.
  if (assistantStore.isOpen) {
    const panelEl = document.getElementById('dashboard-assistant-panel')
    const targetEl = target as Element
    const inPanel = panelEl?.contains(target) || eventPath.includes(panelEl as EventTarget)
    const onTrigger = !!targetEl.closest?.('[aria-label="Open Storvv Assistant"]')
    if (!inPanel && !onTrigger) {
      assistantStore.close()
    }
  }
}

watch(
  () => route.path,
  () => {
    useAssistantStore().close()
  }
)

// Authentication guard - redirect if no user
const checkAuth = async () => {
  if (!import.meta.client) {
    checkingAuth.value = false
    return
  }

  checkingAuth.value = authStore.loading

  try {
    await waitForAuthStore(authStore, getAuthWaitMs())
  } finally {
    checkingAuth.value = false
  }

  // Redirect to signin if no user after loading completes
  // But add loop prevention
  if (!authStore.loading && !authStore.currentUser) {
    // Prevent redirect loops
    const redirectKey = 'dashboard_layout_redirect'
    if (sessionStorage.getItem(redirectKey) === 'true') {
      // Already redirecting, don't redirect again
      return
    }

    // Check redirect count
    const redirectCount = parseInt(sessionStorage.getItem('dashboard_redirect_count') || '0')
    if (redirectCount >= 2) {
      // Too many redirects - break the loop
      sessionStorage.removeItem('dashboard_redirect_count')
      sessionStorage.removeItem(redirectKey)
      return // Allow page to load
    }

    // Set flag to prevent loops
    sessionStorage.setItem(redirectKey, 'true')
    sessionStorage.setItem('dashboard_redirect_count', String(redirectCount + 1))
    setTimeout(() => {
      sessionStorage.removeItem(redirectKey)
      sessionStorage.removeItem('dashboard_redirect_count')
    }, 3000)

    return navigateTo('/signin')
  }

  // Clear redirect flags if user is authenticated
  if (authStore.currentUser) {
    sessionStorage.removeItem('dashboard_layout_redirect')
    sessionStorage.removeItem('dashboard_redirect_count')
  }
}

onMounted(async () => {
  document.addEventListener('click', handleClickOutside)
  if (import.meta.client) {
    if (!isCapacitorNative()) {
      window.addEventListener('keydown', handleGlobalSearchShortcut)
    }
    if (isCapacitorNative()) {
      assistantShellReady.value = true
      scheduleNativeIdleWork(() => mountSearchShell(), 3500)
    } else {
      scheduleNativeIdleWork(() => mountShellWidgets(), 2500)
    }
    await checkAuth()

    if (authStore.currentUser?.uid && !authStore.loading) {
      if (isCapacitorNative()) {
        scheduleNativeIdleWork(() => {
          void syncSubscriptionStatus()
        }, 2000)
      } else {
        await syncSubscriptionStatus()
      }
    }

    // Initialize cache from localStorage after auth loads
    const currentUserId = authStore.currentUser?.uid
    if (currentUserId) {
      const storedName = getCachedUserName()
      const storedEmail = getCachedUserEmail()
      const storedUserId = getCachedUserId()

      // Only use stored values if they match the current user
      if (storedUserId === currentUserId) {
        if (storedName) {
          cachedUserName.value = storedName
        }
        if (storedEmail) {
          cachedUserEmail.value = storedEmail
        }
        cachedUserId.value = storedUserId
      }
    }

    // Staff with temporary password must change it before using the app
    if (authStore.currentUser?.uid && !authStore.loading) {
      const ud = userStore.userData
      if (
        ud?.role === 'staff' &&
        ud.mustChangePassword &&
        route.path !== '/dashboard/change-password'
      ) {
        await navigateTo('/dashboard/change-password')
      }
    }
  }
})

// Watch for auth state changes to fetch user data and protect routes
watch(
  () => authStore.currentUser,
  async (user, oldUser) => {
    // Check if staff creation is in progress - don't redirect or update user data during temporary sign-out
    // Redirect to signin if user logs out (but not during staff creation)
    if (import.meta.client && !authStore.loading && !user && !isStaffCreationInProgress()) {
      if (isDemoDashboard.value) return
      // Prevent redirect loops
      const redirectKey = 'dashboard_watch_redirect'
      if (sessionStorage.getItem(redirectKey) === 'true') {
        return // Already redirecting
      }

      // Set flag
      sessionStorage.setItem(redirectKey, 'true')
      setTimeout(() => sessionStorage.removeItem(redirectKey), 3000)

      return navigateTo('/signin')
    }

    // During staff creation, don't fetch or update userData to preserve super admin's profile info
    if (isStaffCreationInProgress()) {
      // console.log('[Dashboard] Staff creation in progress - preserving super admin userData')
      return
    }

    // Only fetch if:
    // 1. User exists
    // 2. We don't have userData OR the user changed (not just signed back in)
    // 3. Staff creation is not in progress
    if (user?.uid && !authStore.loading) {
      const userChanged = oldUser?.uid !== user.uid

      // If user changed, clear old user data and cache so nav never shows previous user
      if (userChanged && !isStaffCreationInProgress()) {
        userStore.clearUserData()
        cachedUserName.value = null
        cachedUserEmail.value = null
        cachedUserId.value = null

        const storedName = getCachedUserName()
        const storedEmail = getCachedUserEmail()
        const storedUserId = getCachedUserId()

        if (storedUserId === user.uid) {
          if (storedName) cachedUserName.value = storedName
          if (storedEmail) cachedUserEmail.value = storedEmail
          cachedUserId.value = storedUserId
        }

        void runDashboardShellBootstrap({ force: true })
      }
    }
  },
  { immediate: true }
)

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  if (import.meta.client) {
    if (!isCapacitorNative()) {
      window.removeEventListener('keydown', handleGlobalSearchShortcut)
    }
  }
})
</script>
