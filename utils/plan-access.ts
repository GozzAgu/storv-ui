import {
  getEligibleStoresForPlan,
  storeCreatedAtMillis,
  type SubscriptionAddOnTotals,
  type SubscriptionPlan,
} from '~/types/subscription'

/**
 * Over the plan's limits (a trial ended, or a paid plan was downgraded or canceled) nothing is
 * deleted: the extra stores, and the extra staff in a store, become view only.
 * 'store': this whole store is past the plan's store count.
 * 'staff': this staff member is past the store's staff count and not one the owner picked.
 */
export type PlanViewOnlyReason = 'store' | 'staff'

/** Stores past the plan's store count, newest first to go (the oldest stay fully usable). */
export function isStoreViewOnlyOnPlan<T extends { id: string; createdAt?: unknown }>(
  stores: T[],
  storeId: string,
  plan: SubscriptionPlan,
  addOns?: SubscriptionAddOnTotals
): boolean {
  if (!stores.some((store) => store.id === storeId)) return false
  return !getEligibleStoresForPlan(stores, plan, addOns).some((store) => store.id === storeId)
}

export interface PlanAccessStaff {
  id: string
  createdAt?: unknown
}

/**
 * Staff ids that keep full access in a store, or null when the store is within its staff count
 * (everyone keeps full access). The owner's picks come first; open places go to the
 * longest-serving staff, so a store is never left with fewer full-access staff than it may have.
 */
export function pickFullAccessStaff(
  staff: PlanAccessStaff[],
  maxStaff: number,
  picked: unknown
): string[] | null {
  if (maxStaff < 0 || staff.length <= maxStaff) return null
  const known = new Set(staff.map((member) => member.id))
  const chosen: string[] = []
  if (Array.isArray(picked)) {
    for (const id of picked) {
      if (chosen.length >= maxStaff) break
      if (typeof id === 'string' && known.has(id) && !chosen.includes(id)) chosen.push(id)
    }
  }
  const byAge = [...staff].sort(
    (a, b) =>
      storeCreatedAtMillis(a.createdAt) - storeCreatedAtMillis(b.createdAt) ||
      a.id.localeCompare(b.id)
  )
  for (const member of byAge) {
    if (chosen.length >= maxStaff) break
    if (!chosen.includes(member.id)) chosen.push(member.id)
  }
  return chosen
}

export const PLAN_VIEW_ONLY_TITLE = 'View only'

export function planViewOnlyMessage(reason: PlanViewOnlyReason, isOwner: boolean): string {
  if (reason === 'store') {
    return isOwner
      ? 'This branch is past the number of branches your plan includes. Upgrade to sell and edit here again.'
      : 'This branch is past the number of branches the plan includes. Ask the account owner to upgrade.'
  }
  return 'This branch has more staff than the plan includes, so your account can look but not sell or edit. Ask the account owner for full access.'
}

export const PLAN_VIEW_ONLY_SALE_NOTICE =
  'View only: selling is paused in this branch until the plan is upgraded.'

/** Thrown by write actions while view only; short enough for a toast. */
export const PLAN_VIEW_ONLY_ERROR = 'View only: this needs a plan upgrade first.'
