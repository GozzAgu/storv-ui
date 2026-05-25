import type { SubscriptionPlan } from '~/types/subscription'

export const VALID_PLANS: SubscriptionPlan[] = ['storvv_micro', 'storvv_medium', 'storvv_enterprise']
export const PAYSTACK_CURRENCY = 'NGN'

export const PLAN_AMOUNT_KEYS: Record<SubscriptionPlan, string> = {
 storvv_micro: 'paystackPlanMicroAmount',
 storvv_medium: 'paystackPlanMediumAmount',
 storvv_enterprise: 'paystackPlanEnterpriseAmount',
}

export function getExpectedPlanAmount(
 planId: SubscriptionPlan,
 config: Record<string, unknown>
): number {
 const key = PLAN_AMOUNT_KEYS[planId]
 const amount = Number(config[key])
 if (!Number.isFinite(amount) || amount <= 0) {
 throw new Error(`Invalid server plan amount config for ${planId}`)
 }
 return amount
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
