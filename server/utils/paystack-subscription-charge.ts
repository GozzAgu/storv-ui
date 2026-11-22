import { FieldValue, type Firestore } from 'firebase-admin/firestore'
import type { SubscriptionPlan } from '~/types/subscription'
import type { SubscriptionBillingCycle } from '~/types/subscription-billing'
import {
  SUBSCRIPTION_BILLING_CYCLES,
  getPaystackPlanCodeConfigKey,
  isSubscriptionBillingCycle,
} from '~/types/subscription-billing'
import {
  VALID_PLANS,
  getExpectedPlanAmount,
  validatePaidAmountAndCurrency,
} from '~/server/utils/paystack-validation'
import {
  buildSubscriptionUserPatch,
  extractSubscriptionFromChargePayload,
  findUserIdByPaystackSubscriptionCode,
  type ApplySubscriptionParams,
  type PaystackSubscriptionRecord,
} from '~/server/utils/paystack-subscription'

export type SubscriptionChargeData = {
  reference?: string
  amount?: number
  currency?: string
  metadata?: Record<string, unknown>
  subscription?: PaystackSubscriptionRecord
  customer?: { customer_code?: string }
  plan?: { plan_code?: string } | string | null
}

export type SubscriptionChargeProblem =
  | 'unknown-owner'
  | 'unknown-plan'
  | 'plan-mismatch'
  | 'amount-mismatch'

export type ResolvedSubscriptionCharge =
  | {
      ok: true
      userId: string
      planId: SubscriptionPlan
      billingCycle: SubscriptionBillingCycle
      subscriptionCode: string
    }
  | { ok: false; problem: SubscriptionChargeProblem; userId?: string }

const PAID_PLANS: SubscriptionPlan[] = VALID_PLANS.filter((plan) => plan !== 'storvv_micro')

export const SUBSCRIPTION_CHARGES_COLLECTION = 'subscriptionCharges'

export function paystackPlanCodeOf(data: SubscriptionChargeData): string | undefined {
  const plan = data.plan
  const code = typeof plan === 'string' ? plan : plan?.plan_code
  const fromSubscription = data.subscription?.plan?.plan_code
  const value = (code || fromSubscription || '').trim()
  return value || undefined
}

export interface LegacyPaystackPlan {
  planCode: string
  planId: SubscriptionPlan
  billingCycle: SubscriptionBillingCycle
  amountKobo: number
}

/**
 * Grandfathered plans from `PAYSTACK_LEGACY_PLANS`: `PLN_code:plan:cycle:amountKobo`, comma
 * separated. After a price change the old Paystack plans stay as they are and are listed here, so
 * subscribers on them keep renewing at their old price. Malformed entries are skipped.
 */
export function parseLegacyPaystackPlans(raw: unknown): LegacyPaystackPlan[] {
  if (typeof raw !== 'string' || !raw.trim()) return []
  const out: LegacyPaystackPlan[] = []
  for (const entry of raw.split(',')) {
    const [code, plan, cycle, amount] = entry.trim().split(':')
    const planCode = (code || '').trim()
    const planId = (plan || '').trim() as SubscriptionPlan
    const billingCycle = (cycle || '').trim()
    const amountKobo = Number(amount)
    if (
      !planCode.startsWith('PLN_') ||
      !PAID_PLANS.includes(planId) ||
      !isSubscriptionBillingCycle(billingCycle) ||
      !Number.isInteger(amountKobo) ||
      amountKobo <= 0
    ) {
      continue
    }
    out.push({ planCode, planId, billingCycle, amountKobo })
  }
  return out
}

/**
 * Map a Paystack plan code back to the Storvv plan and cycle configured for it. A grandfathered
 * code also carries the amount it renews at.
 */
export function planFromPaystackPlanCode(
  planCode: string,
  config: Record<string, unknown>
): {
  planId: SubscriptionPlan
  billingCycle: SubscriptionBillingCycle
  legacyAmountKobo?: number
} | null {
  for (const planId of PAID_PLANS) {
    for (const billingCycle of SUBSCRIPTION_BILLING_CYCLES) {
      const key = getPaystackPlanCodeConfigKey(planId, billingCycle)
      const configured =
        key && typeof config[key] === 'string' ? (config[key] as string).trim() : ''
      if (configured && configured === planCode) return { planId, billingCycle }
    }
  }
  const legacy = parseLegacyPaystackPlans(config.paystackLegacyPlans).find(
    (entry) => entry.planCode === planCode
  )
  if (legacy) {
    return {
      planId: legacy.planId,
      billingCycle: legacy.billingCycle,
      legacyAmountKobo: legacy.amountKobo,
    }
  }
  return null
}

/**
 * Decide which account and plan a subscription charge pays for. Never trusts the plan or cycle
 * in the charge metadata (anyone holding the public key can write it): the plan comes from
 * Paystack's plan code, a renewal's owner from the stored subscription code, and a first charge's
 * owner from the pending checkout that /api/paystack/initialize created for that reference.
 */
export async function resolveSubscriptionCharge(
  db: Firestore,
  data: SubscriptionChargeData,
  config: Record<string, unknown>
): Promise<ResolvedSubscriptionCharge | null> {
  const extracted = extractSubscriptionFromChargePayload(data)
  const subscriptionCode = extracted.subscriptionCode
  if (!subscriptionCode) return null

  const planCode = paystackPlanCodeOf(data)
  const fromCode = planCode ? planFromPaystackPlanCode(planCode, config) : null

  let userId = await findUserIdByPaystackSubscriptionCode(db, subscriptionCode)
  let planId: SubscriptionPlan | undefined
  let billingCycle: SubscriptionBillingCycle | undefined

  if (userId) {
    if (fromCode) {
      ;({ planId, billingCycle } = fromCode)
    } else {
      const stored = (await db.collection('users').doc(userId).get()).data()
      planId = stored?.subscription as SubscriptionPlan | undefined
      billingCycle = isSubscriptionBillingCycle(stored?.subscriptionBillingCycle)
        ? stored.subscriptionBillingCycle
        : undefined
    }
  } else {
    const claimedUserId = extracted.userId
    if (!claimedUserId || !data.reference) return { ok: false, problem: 'unknown-owner' }
    const pendingSnap = await db
      .collection('users')
      .doc(claimedUserId)
      .collection('pendingCheckouts')
      .doc(data.reference)
      .get()
    if (!pendingSnap.exists) return { ok: false, problem: 'unknown-owner' }
    const pending = pendingSnap.data() as {
      planId?: SubscriptionPlan
      billingCycle?: SubscriptionBillingCycle
      paystackPlanCode?: string
    }
    userId = claimedUserId
    planId = pending.planId
    billingCycle = pending.billingCycle || 'monthly'
    const planCodeDiffers =
      planCode && pending.paystackPlanCode && planCode !== pending.paystackPlanCode
    const tierDiffers =
      fromCode && (fromCode.planId !== planId || fromCode.billingCycle !== billingCycle)
    if (planCodeDiffers || tierDiffers) return { ok: false, problem: 'plan-mismatch', userId }
  }

  if (planCode && !fromCode) return { ok: false, problem: 'unknown-plan', userId }
  if (!planId || !PAID_PLANS.includes(planId) || !billingCycle) {
    return { ok: false, problem: 'unknown-plan', userId }
  }

  let expectedAmount: number
  try {
    // A grandfathered plan renews at its own price; everything else at today's.
    expectedAmount =
      fromCode?.legacyAmountKobo ?? getExpectedPlanAmount(planId, config, billingCycle)
  } catch {
    return { ok: false, problem: 'unknown-plan', userId }
  }
  const validity = validatePaidAmountAndCurrency(Number(data.amount), data.currency, expectedAmount)
  if (!validity.valid) return { ok: false, problem: 'amount-mismatch', userId }

  return { ok: true, userId, planId, billingCycle, subscriptionCode }
}

/**
 * Apply a resolved charge once per Paystack reference. Returns false when this reference was
 * already applied (a replayed or re-delivered webhook), leaving the account untouched.
 */
export async function applySubscriptionChargeOnce(
  db: Firestore,
  params: ApplySubscriptionParams & { reference?: string; amountKobo: number }
): Promise<boolean> {
  const userRef = db.collection('users').doc(params.userId)
  const patch = {
    ...buildSubscriptionUserPatch(params),
    subscriptionPaymentIssue: FieldValue.delete(),
  }
  if (!params.reference) {
    await userRef.set(patch, { merge: true })
    return true
  }
  const batch = db.batch()
  batch.create(userRef.collection(SUBSCRIPTION_CHARGES_COLLECTION).doc(params.reference), {
    planId: params.planId,
    billingCycle: params.billingCycle,
    amountKobo: params.amountKobo,
    subscriptionCode: params.paystackSubscriptionCode ?? null,
    appliedAt: FieldValue.serverTimestamp(),
  })
  batch.set(userRef, patch, { merge: true })
  try {
    await batch.commit()
    return true
  } catch (err) {
    if ((err as { code?: number }).code === 6) return false
    throw err
  }
}

/** Shown to the owner in Settings; cleared by the next charge that applies. */
export async function recordSubscriptionPaymentIssue(
  db: Firestore,
  userId: string,
  issue: { reference?: string; amountKobo: number; problem: SubscriptionChargeProblem }
): Promise<void> {
  await db
    .collection('users')
    .doc(userId)
    .set(
      {
        subscriptionPaymentIssue: {
          reference: issue.reference ?? null,
          amountKobo: Number.isFinite(issue.amountKobo) ? issue.amountKobo : 0,
          problem: issue.problem,
          at: new Date().toISOString(),
        },
      },
      { merge: true }
    )
}
