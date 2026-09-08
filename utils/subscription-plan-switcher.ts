import type { SubscriptionPlan } from '~/types/subscription'
import { normalizeSubscriptionPlan, SUBSCRIPTION_PLANS } from '~/types/subscription'
import type { SubscriptionBillingCycle, SubscriptionStatus } from '~/types/subscription-billing'

/** Paid plans that can be selected via Paystack change-plan checkout (not free Micro). */
export function getChangeablePaidPlans(
  currentStoredPlan: SubscriptionPlan
): Array<{ id: SubscriptionPlan; name: string; direction: 'upgrade' | 'downgrade' | 'same' }> {
  const order: SubscriptionPlan[] = ['storvv_micro', 'storvv_medium', 'storvv_enterprise']
  const currentIdx = order.indexOf(normalizeSubscriptionPlan(currentStoredPlan))
  return SUBSCRIPTION_PLANS.filter((p) => p.id !== 'storvv_micro' && p.id !== currentStoredPlan).map(
    (p) => {
      const idx = order.indexOf(p.id)
      return {
        id: p.id,
        name: p.name,
        direction: idx > currentIdx ? ('upgrade' as const) : ('downgrade' as const),
      }
    }
  )
}

export type DevPlanSwitcherPayload = {
  planId: SubscriptionPlan
  billingCycle?: SubscriptionBillingCycle
  subscriptionStatus?: SubscriptionStatus
  /** ISO period end; omit for active plans (server sets a default). */
  subscriptionCurrentPeriodEnd?: string | null
}

/** Show Settings plan QA tools in demo mode only. */
export function canShowDevPlanSwitcher(options: {
  isDemo: boolean
  allowPublicFlag?: boolean
  isDev?: boolean
}): boolean {
  return options.isDemo
}
