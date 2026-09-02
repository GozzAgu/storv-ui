import { getSubscriptionBillingBanner } from '~/utils/subscription-billing-ui'
import { useAuthStore } from '~/stores/auth'

const DISMISS_PREFIX = 'storvv_billing_banner_dismiss_'

/** Dashboard shell billing alerts + lazy subscription sync. */
export function useSubscriptionBillingUi() {
  const userStore = useUserStore()
  const { authFetch } = useAuthenticatedFetch()

  const bannerContent = computed(() =>
    getSubscriptionBillingBanner(userStore.userData, userStore.isSuperAdmin)
  )

  const bannerVisible = ref(false)

  function isBannerDismissed(id: string): boolean {
    if (!import.meta.client) return false
    try {
      return localStorage.getItem(`${DISMISS_PREFIX}${id}`) === '1'
    } catch {
      return false
    }
  }

  function dismissBanner(id: string) {
    if (!import.meta.client) return
    try {
      localStorage.setItem(`${DISMISS_PREFIX}${id}`, '1')
    } catch {
      // ignore
    }
    bannerVisible.value = false
  }

  watch(
    bannerContent,
    (content) => {
      bannerVisible.value = Boolean(content && !isBannerDismissed(content.id))
    },
    { immediate: true }
  )

  async function syncSubscriptionStatus(): Promise<void> {
    if (!userStore.isSuperAdmin) return
    try {
      const result = (await authFetch('/api/paystack/sync-subscription', {
        method: 'POST',
      })) as { downgraded?: boolean }
      if (result.downgraded) {
        const authStore = useAuthStore()
        if (authStore.currentUser?.uid) {
          await userStore.fetchUserData(authStore.currentUser.uid)
        }
      }
    } catch {
      // best-effort
    }
  }

  return {
    bannerContent,
    bannerVisible,
    dismissBanner,
    syncSubscriptionStatus,
  }
}
