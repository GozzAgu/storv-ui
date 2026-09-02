import type { SubscriptionPlan } from '~/types/subscription'
import type { SubscriptionBillingCycle } from '~/types/subscription-billing'
import { SUBSCRIPTION_PLANS } from '~/types/subscription'
import { getExpectedPlanAmount } from '~/server/utils/paystack-validation'

/** Public plan amounts (kobo) for checkout price preview. */
export default defineEventHandler(() => {
  const config = useRuntimeConfig()
  const plans: Partial<
    Record<SubscriptionPlan, Partial<Record<SubscriptionBillingCycle, number>>>
  > = {}

  for (const plan of SUBSCRIPTION_PLANS.map((entry) => entry.id)) {
    if (plan === 'storvv_micro') {
      plans[plan] = { monthly: 0, quarterly: 0, yearly: 0 }
      continue
    }
    try {
      plans[plan] = {
        monthly: getExpectedPlanAmount(plan, config as Record<string, unknown>, 'monthly'),
        quarterly: getExpectedPlanAmount(plan, config as Record<string, unknown>, 'quarterly'),
        yearly: getExpectedPlanAmount(plan, config as Record<string, unknown>, 'yearly'),
      }
    } catch {
      plans[plan] = {}
    }
  }

  return { plans, currency: 'NGN' }
})
