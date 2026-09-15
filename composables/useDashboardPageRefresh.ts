/**
 * Shared page refresh handler for web header button + iOS pull-to-refresh.
 * Pages register once; both surfaces call the same function.
 */
const DASHBOARD_PAGE_REFRESH_KEY = 'dashboard-page-refresh-handler'

export function useDashboardPageRefreshRegister(handler: () => Promise<void>) {
  const registered = useState<(() => Promise<void>) | null>(DASHBOARD_PAGE_REFRESH_KEY, () => null)

  onMounted(() => {
    registered.value = handler
  })

  onUnmounted(() => {
    if (registered.value === handler) {
      registered.value = null
    }
  })
}

export function useDashboardPageRefreshHandler() {
  return useState<(() => Promise<void>) | null>(DASHBOARD_PAGE_REFRESH_KEY, () => null)
}

/** Soft fallback when a page has not registered a handler. */
export async function runDefaultDashboardRefresh() {
  if (!import.meta.client) return

  const authStore = useAuthStore()
  const userStore = useUserStore()
  const storesStore = useStoresStore()

  const tasks: Promise<unknown>[] = []

  if (authStore.currentUser?.uid) {
    tasks.push(userStore.fetchUserData(authStore.currentUser.uid))
  }
  if (typeof storesStore.fetchStores === 'function') {
    tasks.push(storesStore.fetchStores())
  }

  await Promise.allSettled(tasks)

  try {
    await refreshNuxtData()
  } catch {
    /* pages without useAsyncData are fine */
  }
}
