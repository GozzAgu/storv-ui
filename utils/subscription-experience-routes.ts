import type { SubscriptionFeature } from '~/types/subscription'
import { getMinimumPlanForFeature } from '~/types/subscription'

const PLAN_GATED_PATHS: Array<{ prefix: string; feature: SubscriptionFeature }> = [
  { prefix: '/dashboard/analytics', feature: 'analytics' },
  { prefix: '/dashboard/activity', feature: 'activity_logs' },
  { prefix: '/dashboard/leads', feature: 'sales_leads' },
  { prefix: '/dashboard/multi-store-sync', feature: 'multi_store_sync' },
  { prefix: '/dashboard/seller-loans', feature: 'seller_loans' },
]

export function getRequiredSubscriptionFeatureForPath(path: string): SubscriptionFeature | null {
  const normalized = path.replace(/^\/demo(?=\/)/, '')
  for (const entry of PLAN_GATED_PATHS) {
    if (normalized === entry.prefix || normalized.startsWith(`${entry.prefix}/`)) {
      return entry.feature
    }
  }
  return null
}

export function planUnavailablePath(feature: SubscriptionFeature): string {
  return `/dashboard/experience-unavailable?feature=${encodeURIComponent(feature)}`
}

export function canAccessDashboardPathBySubscriptionPlan(
  path: string,
  canUseFeature: (feature: SubscriptionFeature) => boolean
): boolean {
  const required = getRequiredSubscriptionFeatureForPath(path)
  if (!required) return true
  return canUseFeature(required)
}

export function getMinimumPlanLabelForPath(path: string): string | null {
  const feature = getRequiredSubscriptionFeatureForPath(path)
  if (!feature) return null
  const plan = getMinimumPlanForFeature(feature)
  return plan
}
