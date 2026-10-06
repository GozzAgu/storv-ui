import type { SubscriptionPlan, SubscriptionFeature } from '~/types/subscription'
import {
  planHasFeature,
  getPlanLimits,
  getStaffLimitForStore,
  resolveEffectiveSubscriptionPlan,
  summarizeSubscriptionAddOns,
  SUBSCRIPTION_PLANS,
  SUBSCRIPTION_FEATURE_SUMMARY,
} from '~/types/subscription'

/**
 * Composable to gate features and limits by the current user's subscription plan.
 * Use in layout (nav), pages (access), and components (limits).
 */
export function useSubscriptionFeatures() {
  const userStore = useUserStore()
  const plan = computed<SubscriptionPlan>(() =>
    resolveEffectiveSubscriptionPlan(userStore.userData)
  )

  const canUse = (feature: SubscriptionFeature): boolean => {
    return planHasFeature(plan.value, feature)
  }

  const addOns = computed(() => summarizeSubscriptionAddOns(userStore.userData?.subscriptionAddOns))

  const limits = computed(() => getPlanLimits(plan.value, addOns.value))

  const featureSummary = computed(() => SUBSCRIPTION_FEATURE_SUMMARY[plan.value])

  /** True if the user can add another department (given current count for the store). */
  const canAddDepartment = (currentDepartmentCount: number) => {
    const max = limits.value.maxDepartmentsPerStore
    return max < 0 || currentDepartmentCount < max
  }

  /** Staff cap for a store, including seats bought for it. */
  const staffLimitForStore = (storeId?: string | null) =>
    getStaffLimitForStore(plan.value, storeId, addOns.value)

  /** True if the user can add another staff member (given current staff count for the store). */
  const canAddStaff = (currentStaffCountInStore: number, storeId?: string | null) => {
    const max = staffLimitForStore(storeId)
    return max < 0 || currentStaffCountInStore < max
  }

  return {
    plan,
    canUse,
    addOns,
    limits,
    featureSummary,
    canAddDepartment,
    staffLimitForStore,
    canAddStaff,
    SUBSCRIPTION_PLANS,
    SUBSCRIPTION_FEATURE_SUMMARY,
  }
}
