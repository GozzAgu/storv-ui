export type SubscriptionPlan = 'storvv_micro' | 'storvv_medium' | 'storvv_enterprise'

export const SUBSCRIPTION_PLANS: Array<{ id: SubscriptionPlan; name: string }> = [
  { id: 'storvv_micro', name: 'Storvv Micro' },
  { id: 'storvv_medium', name: 'Storvv Medium' },
  { id: 'storvv_enterprise', name: 'Storvv Enterprise' },
]

/** Feature flags by plan. Used for nav gating and upgrade prompts. */
export type SubscriptionFeature =
  | 'dashboard'
  | 'inventory'
  | 'receipts'
  | 'returns'
  | 'customers'
  | 'analytics'
  | 'activity_logs'
  | 'departments'
  | 'multi_store_sync'
  | 'settings'
  | 'profile'
  | 'notifications'

/** Max limits by plan (use -1 for unlimited where applicable). */
interface SubscriptionLimits {
  maxStores: number
  maxDepartmentsPerStore: number
  maxStaffPerStore: number
}

const FEATURES_BY_PLAN: Record<SubscriptionPlan, SubscriptionFeature[]> = {
  storvv_micro: [
    'dashboard',
    'inventory',
    'receipts',
    'returns',
    'customers',
    'settings',
    'profile',
    'notifications',
  ],
  storvv_medium: [
    'dashboard',
    'inventory',
    'receipts',
    'returns',
    'customers',
    'analytics',
    'activity_logs',
    'departments',
    'settings',
    'profile',
    'notifications',
  ],
  storvv_enterprise: [
    'dashboard',
    'inventory',
    'receipts',
    'returns',
    'customers',
    'analytics',
    'activity_logs',
    'departments',
    'multi_store_sync',
    'settings',
    'profile',
    'notifications',
  ],
}

const LIMITS_BY_PLAN: Record<SubscriptionPlan, SubscriptionLimits> = {
  storvv_micro: {
    maxStores: 1,
    maxDepartmentsPerStore: 1,
    maxStaffPerStore: 2,
  },
  storvv_medium: {
    maxStores: 5,
    maxDepartmentsPerStore: 10,
    maxStaffPerStore: 25,
  },
  storvv_enterprise: {
    maxStores: -1,
    maxDepartmentsPerStore: -1,
    maxStaffPerStore: -1,
  },
}

/** Returns whether the plan includes the feature. */
export function planHasFeature(plan: SubscriptionPlan, feature: SubscriptionFeature): boolean {
  return FEATURES_BY_PLAN[plan]?.includes(feature) ?? false
}

/** Returns limits for the plan. */
export function getPlanLimits(plan: SubscriptionPlan): SubscriptionLimits {
  return LIMITS_BY_PLAN[plan] ?? LIMITS_BY_PLAN.storvv_micro
}

/** Human-readable feature summary per plan (for settings/landing). */
export const SUBSCRIPTION_FEATURE_SUMMARY: Record<SubscriptionPlan, string[]> = {
  storvv_micro: [
    '1 store',
    'Inventory & receipts',
    'Returns & customers',
    'Dashboard & notifications',
    'Settings & profile',
  ],
  storvv_medium: [
    'Up to 5 stores',
    'Everything in Micro',
    'Analytics & reports',
    'Departments & teams (up to 10 depts, 25 staff per store)',
    'Full receipts & returns',
  ],
  storvv_enterprise: [
    'Unlimited stores',
    'Everything in Medium',
    'Multi-store sync & transfers',
    'Unlimited departments & staff',
    'Priority support',
  ],
}
