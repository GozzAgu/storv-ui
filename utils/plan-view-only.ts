import { useStoresStore } from '~/stores/stores'
import { useUserStore } from '~/stores/user'
import { resolveEffectiveSubscriptionPlan, summarizeSubscriptionAddOns } from '~/types/subscription'
import { isDemoModeActive } from '~/utils/demo-mode'
import {
  isStoreViewOnlyOnPlan,
  PLAN_VIEW_ONLY_ERROR,
  type PlanViewOnlyReason,
} from '~/utils/plan-access'

/**
 * Why the signed-in user can only look at the current store, or null when they have full use.
 * The owner works it out from their own stores; staff get it from the owner context.
 */
export function currentPlanViewOnlyReason(): PlanViewOnlyReason | null {
  if (isDemoModeActive()) return null
  const userData = useUserStore().userData
  if (!userData) return null
  if (userData.role === 'staff') return userData.planViewOnly ?? null
  if (userData.role !== 'superAdmin') return null

  const storesStore = useStoresStore()
  const storeId = storesStore.currentStoreId
  if (!storeId) return null
  const viewOnly = isStoreViewOnlyOnPlan(
    storesStore.stores,
    storeId,
    resolveEffectiveSubscriptionPlan(userData),
    summarizeSubscriptionAddOns(userData.subscriptionAddOns)
  )
  return viewOnly ? 'store' : null
}

/** First line of every store write action; the app-side half of view only. */
export function assertPlanWritable(): void {
  if (currentPlanViewOnlyReason()) throw new Error(PLAN_VIEW_ONLY_ERROR)
}
