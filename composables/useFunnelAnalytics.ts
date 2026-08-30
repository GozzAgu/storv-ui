import type { ActivationFunnel } from '~/types/growth'
import type { ProductAnalyticsEvent } from '~/plugins/03.product-analytics.client'
import { useProductAnalytics } from '~/composables/useProductAnalytics'
import { useUser } from '~/composables/useUser'
import { useAuthStore } from '~/stores/auth'
import { useUserStore } from '~/stores/user'

type FunnelMilestone = keyof ActivationFunnel

const MILESTONE_EVENT: Partial<Record<FunnelMilestone, ProductAnalyticsEvent>> = {
  signedUpAt: 'sign_up',
  firstLoginAt: 'login',
  onboardingCompletedAt: 'onboarding_complete',
  firstInventoryItemAt: 'first_inventory_item',
  firstSaleAt: 'first_sale',
  firstUpgradeStartedAt: 'upgrade_started',
  firstUpgradeSuccessAt: 'upgrade_success',
  subscriptionCanceledAt: 'subscription_cancel',
}

/**
 * Fire analytics + persist milestone once on the user doc (owner accounts).
 * Safe to call multiple times; duplicates are ignored.
 */
export function useFunnelAnalytics() {
  const { trackEvent } = useProductAnalytics()
  const { updateUserDocument } = useUser()
  const authStore = useAuthStore()
  const userStore = useUserStore()

  async function recordMilestone(
    key: FunnelMilestone,
    params?: Record<string, unknown>
  ): Promise<boolean> {
    const uid = authStore.currentUser?.uid
    if (!uid || import.meta.server) return false

    const existing = userStore.userData?.activationFunnel?.[key]
    if (existing) return false

    const event = MILESTONE_EVENT[key]
    if (event) trackEvent(event, params)

    const now = new Date().toISOString()
    const nextFunnel: ActivationFunnel = {
      ...(userStore.userData?.activationFunnel ?? {}),
      [key]: now,
    }

    try {
      await updateUserDocument(uid, { activationFunnel: nextFunnel })
      if (userStore.userData) {
        userStore.userData.activationFunnel = nextFunnel
      }
      return true
    } catch (error) {
      if (import.meta.dev) console.warn('[funnel]', key, error)
      return false
    }
  }

  return { recordMilestone }
}
