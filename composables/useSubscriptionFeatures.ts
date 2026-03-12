import type { SubscriptionPlan, SubscriptionFeature } from '~/types/subscription'
import {
  planHasFeature,
  getPlanLimits,
  SUBSCRIPTION_PLANS,
  SUBSCRIPTION_FEATURE_SUMMARY,
} from '~/types/subscription'

/**
 * Composable to gate features and limits by the current user's subscription plan.
 * Use in layout (nav), pages (access), and components (limits).
 */
export function useSubscriptionFeatures() {
  const userStore = useUserStore()
  const plan = computed<SubscriptionPlan>(
    () => (userStore.userData?.subscription as SubscriptionPlan) || 'storvv_micro'
  )

  const canUse = (feature: SubscriptionFeature): boolean => {
    return planHasFeature(plan.value, feature)
  }

  const limits = computed(() => getPlanLimits(plan.value))

  const featureSummary = computed(() => SUBSCRIPTION_FEATURE_SUMMARY[plan.value])

  return {
    plan,
    canUse,
    limits,
    featureSummary,
    SUBSCRIPTION_PLANS,
    SUBSCRIPTION_FEATURE_SUMMARY,
  }
}
