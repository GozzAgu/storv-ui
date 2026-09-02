import {
  FEATURES_BY_PLAN,
  getPlanDisplayName,
  type SubscriptionFeature,
  type SubscriptionPlan,
} from '~/types/subscription'

const FEATURE_UNLOCK_LABELS: Partial<Record<SubscriptionFeature, string>> = {
  analytics: 'Analytics & PDF/Excel exports',
  activity_logs: 'Activity logs',
  sales_leads: 'Sales leads pipeline',
  customer_balance: 'Customer balance ledger',
  multi_store_sync: 'Multi-Store Sync',
  seller_loans: 'Stock loans',
}

const PLAN_LIMIT_UNLOCKS: Record<SubscriptionPlan, string[]> = {
  storvv_micro: ['1 store', '1 department', 'Up to 2 staff'],
  storvv_medium: ['Up to 2 stores', 'Up to 10 departments', 'Up to 25 staff per store'],
  storvv_enterprise: ['Unlimited stores, departments & staff'],
}

/** Human-readable unlocks when moving from one paid tier to another. */
export function getUpgradeUnlockHighlights(
  fromPlan: SubscriptionPlan,
  toPlan: SubscriptionPlan
): string[] {
  if (fromPlan === toPlan) return []

  const fromFeatures = new Set(FEATURES_BY_PLAN[fromPlan])
  const featureLines = FEATURES_BY_PLAN[toPlan]
    .filter((feature) => !fromFeatures.has(feature))
    .map((feature) => FEATURE_UNLOCK_LABELS[feature])
    .filter((line): line is string => Boolean(line))

  const limitLines = PLAN_LIMIT_UNLOCKS[toPlan].filter(
    (line) => !PLAN_LIMIT_UNLOCKS[fromPlan].includes(line)
  )

  return [...featureLines, ...limitLines]
}

export function formatUpgradeSuccessMessage(
  toPlan: SubscriptionPlan,
  fromPlan: SubscriptionPlan = 'storvv_micro'
): string {
  const highlights = getUpgradeUnlockHighlights(fromPlan, toPlan)
  const planName = getPlanDisplayName(toPlan)
  if (!highlights.length) {
    return `You are now on ${planName}.`
  }
  const preview = highlights.slice(0, 3).join(', ')
  const extra = highlights.length > 3 ? ` and ${highlights.length - 3} more` : ''
  return `Welcome to ${planName}. Unlocked: ${preview}${extra}.`
}
