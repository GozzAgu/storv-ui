import type { SubscriptionPlan } from '~/types/subscription'
import type { SubscriptionBillingCycle } from '~/types/subscription-billing'
import { isSubscriptionBillingCycle } from '~/types/subscription-billing'

export const VALID_PLANS: SubscriptionPlan[] = [
  'storvv_micro',
  'storvv_medium',
  'storvv_enterprise',
]
export const PAYSTACK_CURRENCY = 'NGN'

const PLAN_BASE_KEYS: Record<SubscriptionPlan, string> = {
  storvv_micro: 'paystackPlanMicroAmount',
  storvv_medium: 'paystackPlanMediumAmount',
  storvv_enterprise: 'paystackPlanEnterpriseAmount',
}

const PLAN_CYCLE_SUFFIX: Record<SubscriptionBillingCycle, string> = {
  monthly: '',
  quarterly: 'Quarterly',
  yearly: 'Yearly',
}

/** @deprecated Use getPlanAmountConfigKey - kept for tests referencing the old monthly-only map. */
export const PLAN_AMOUNT_KEYS: Record<SubscriptionPlan, string> = {
  storvv_micro: PLAN_BASE_KEYS.storvv_micro,
  storvv_medium: PLAN_BASE_KEYS.storvv_medium,
  storvv_enterprise: PLAN_BASE_KEYS.storvv_enterprise,
}

export function getPlanAmountConfigKey(
  planId: SubscriptionPlan,
  billingCycle: SubscriptionBillingCycle = 'monthly'
): string {
  const base = PLAN_BASE_KEYS[planId]
  const suffix = PLAN_CYCLE_SUFFIX[billingCycle]
  if (!suffix) return base
  return `${base}${suffix}`
}

function readPositiveAmount(config: Record<string, unknown>, key: string): number | null {
  const amount = Number(config[key])
  if (!Number.isFinite(amount) || amount < 0) return null
  return amount
}

export function getExpectedPlanAmount(
  planId: SubscriptionPlan,
  config: Record<string, unknown>,
  billingCycle: SubscriptionBillingCycle = 'monthly'
): number {
  if (!isSubscriptionBillingCycle(billingCycle)) {
    throw new Error(`Invalid billing cycle: ${billingCycle}`)
  }

  const cycleKey = getPlanAmountConfigKey(planId, billingCycle)
  const cycleAmount = readPositiveAmount(config, cycleKey)
  if (cycleAmount !== null) {
    if (planId === 'storvv_micro' && cycleAmount === 0) return 0
    if (cycleAmount > 0) return cycleAmount
  }

  if (billingCycle === 'monthly') {
    throw new Error(`Invalid server plan amount config for ${planId}`)
  }

  const monthlyAmount = getExpectedPlanAmount(planId, config, 'monthly')
  if (monthlyAmount === 0) return 0

  if (billingCycle === 'quarterly') {
    return Math.round(monthlyAmount * 3 * 0.9)
  }

  return Math.round(monthlyAmount * 12 * 0.85)
}

export function validatePaidAmountAndCurrency(
  paidAmount: number,
  paidCurrency: string | undefined,
  expectedAmount: number
): { valid: boolean; message?: string } {
  if (paidAmount !== expectedAmount) {
    return { valid: false, message: 'Payment amount does not match selected plan.' }
  }
  if ((paidCurrency || '').toUpperCase() !== PAYSTACK_CURRENCY) {
    return { valid: false, message: 'Payment currency is invalid.' }
  }
  return { valid: true }
}

/** Server-only: useRuntimeConfig first; `process.env` fallback matches Vercel runtime secrets. */
export function resolvePaystackSecretKey(config: { paystackSecretKey?: string }): string {
  const fromConfig = typeof config.paystackSecretKey === 'string' ? config.paystackSecretKey : ''
  return (fromConfig || process.env.PAYSTACK_SECRET_KEY || '').trim()
}
