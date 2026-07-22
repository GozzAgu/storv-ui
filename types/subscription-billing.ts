export type SubscriptionBillingCycle = 'monthly' | 'quarterly' | 'yearly'

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
