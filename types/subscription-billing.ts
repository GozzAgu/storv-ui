import type { SubscriptionPlan } from '~/types/subscription'

export type SubscriptionBillingCycle = 'monthly' | 'quarterly' | 'yearly'

/** Paystack-managed subscription lifecycle on the account owner doc. */
export type SubscriptionStatus = 'active' | 'past_due' | 'canceled' | 'none'

export const SUBSCRIPTION_BILLING_CYCLES: SubscriptionBillingCycle[] = [
  'monthly',
  'quarterly',
  'yearly',
]

export const BILLING_CYCLE_LABELS: Record<SubscriptionBillingCycle, string> = {
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  yearly: 'Yearly',
}

export const BILLING_CYCLE_PERIOD_SUFFIX: Record<SubscriptionBillingCycle, string> = {
  monthly: '/ month',
  quarterly: '/ quarter',
  yearly: '/ year',
}

export function isSubscriptionBillingCycle(value: unknown): value is SubscriptionBillingCycle {
  return (
    value === 'monthly' || value === 'quarterly' || value === 'yearly'
  )
}

/** Display pricing: quarterly ≈ 3 months at 10% off; yearly ≈ 12 months at 15% off. */
export function deriveBillingAmount(
  monthlyAmount: number,
  cycle: SubscriptionBillingCycle
): number {
  if (cycle === 'monthly') return monthlyAmount
  if (cycle === 'quarterly') return Math.round(monthlyAmount * 3 * 0.9)
  return Math.round(monthlyAmount * 12 * 0.85)
}

/** List price before discount (for strikethrough on landing). */
export function deriveBillingListAmount(
  monthlyAmount: number,
  cycle: SubscriptionBillingCycle
): number {
  if (cycle === 'monthly') return monthlyAmount
  if (cycle === 'quarterly') return monthlyAmount * 3
  return monthlyAmount * 12
}

/** Paystack plan interval for each billing cycle. */
export function billingCycleToPaystackInterval(
  cycle: SubscriptionBillingCycle
): 'monthly' | 'quarterly' | 'annually' {
  if (cycle === 'quarterly') return 'quarterly'
  if (cycle === 'yearly') return 'annually'
  return 'monthly'
}

/** Estimate current period end from payment time (fallback when Paystack omits next_payment_date). */
export function computeSubscriptionPeriodEnd(
  from: Date,
  cycle: SubscriptionBillingCycle
): string {
  const end = new Date(from)
  if (cycle === 'quarterly') {
    end.setMonth(end.getMonth() + 3)
  } else if (cycle === 'yearly') {
    end.setFullYear(end.getFullYear() + 1)
  } else {
    end.setMonth(end.getMonth() + 1)
  }
  return end.toISOString()
}

const PAYSTACK_PLAN_CODE_SUFFIX: Record<SubscriptionBillingCycle, string> = {
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  yearly: 'Yearly',
}

const PAYSTACK_PLAN_TIER_PREFIX: Record<Exclude<SubscriptionPlan, 'storvv_micro'>, string> = {
  storvv_medium: 'paystackPlanCodeMedium',
  storvv_enterprise: 'paystackPlanCodeEnterprise',
}

/** Runtime config key for a Paystack plan code (PLN_xxx). Micro has no paid checkout plan. */
export function getPaystackPlanCodeConfigKey(
  planId: SubscriptionPlan,
  billingCycle: SubscriptionBillingCycle
): string | null {
  if (planId === 'storvv_micro') return null
  const prefix = PAYSTACK_PLAN_TIER_PREFIX[planId]
  const suffix = PAYSTACK_PLAN_CODE_SUFFIX[billingCycle]
  return `${prefix}${suffix}`
}
