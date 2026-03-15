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
const PLAN_ALIASES: Record<string, SubscriptionPlan> = {
  micro: 'storvv_micro',
  medium: 'storvv_medium',
  enterprise: 'storvv_enterprise',
  storvv_micro: 'storvv_micro',
  storvv_medium: 'storvv_medium',
  storvv_enterprise: 'storvv_enterprise',
}

export function useSubscriptionFeatures() {
  const userStore = useUserStore()
  const plan = computed<SubscriptionPlan>(() => {
    const raw = userStore.userData?.subscription
    if (!raw || typeof raw !== 'string') return 'storvv_micro'
    const normalized = PLAN_ALIASES[raw] ?? PLAN_ALIASES[raw.toLowerCase()] ?? raw
    return ['storvv_micro', 'storvv_medium', 'storvv_enterprise'].includes(normalized) ? (normalized as SubscriptionPlan) : 'storvv_micro'
  })

  const canUse = (feature: SubscriptionFeature): boolean => {
    return planHasFeature(plan.value, feature)
  }

  const limits = computed(() => getPlanLimits(plan.value))

  const featureSummary = computed(() => SUBSCRIPTION_FEATURE_SUMMARY[plan.value])

  /** True if the user can add another department (given current count for the store). */
  const canAddDepartment = (currentDepartmentCount: number) => {
    const max = limits.value.maxDepartmentsPerStore
    return max < 0 || currentDepartmentCount < max
  }

  /** True if the user can add another staff member (given current staff count for the store). */
  const canAddStaff = (currentStaffCountInStore: number) => {
    const max = limits.value.maxStaffPerStore
    return max < 0 || currentStaffCountInStore < max
  }

  return {
    plan,
    canUse,
    limits,
    featureSummary,
    canAddDepartment,
    canAddStaff,
    SUBSCRIPTION_PLANS,
    SUBSCRIPTION_FEATURE_SUMMARY,
  }
}
