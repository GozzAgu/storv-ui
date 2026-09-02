import type { Firestore } from 'firebase-admin/firestore'
import { FieldValue } from 'firebase-admin/firestore'
import type { SubscriptionPlan } from '~/types/subscription'
import type { SubscriptionBillingCycle, SubscriptionStatus } from '~/types/subscription-billing'
import {
  computeSubscriptionPeriodEnd,
  isSubscriptionBillingCycle,
} from '~/types/subscription-billing'
import { paystackRequest } from '~/server/utils/payment-links'

export type PaystackSubscriptionRecord = {
  subscription_code?: string
  email_token?: string
  status?: string
  next_payment_date?: string
  plan?: { plan_code?: string; interval?: string }
  customer?: { customer_code?: string }
}

export type ApplySubscriptionParams = {
  userId: string
  planId: SubscriptionPlan
  billingCycle: SubscriptionBillingCycle
  reference?: string
  paystackSubscriptionCode?: string
  paystackSubscriptionEmailToken?: string
  paystackCustomerCode?: string
  subscriptionStatus?: SubscriptionStatus
  subscriptionCurrentPeriodEnd?: string
}

function normalizePaystackDate(value: unknown): string | undefined {
  if (typeof value !== 'string' || !value.trim()) return undefined
  const parsed = new Date(value)
  return Number.isFinite(parsed.getTime()) ? parsed.toISOString() : undefined
}

/** Build user doc fields for an active Paystack subscription. */
export function buildSubscriptionUserPatch(params: ApplySubscriptionParams): Record<string, unknown> {
  const now = new Date()
  const periodEnd =
    params.subscriptionCurrentPeriodEnd ||
    computeSubscriptionPeriodEnd(now, params.billingCycle)

  const patch: Record<string, unknown> = {
    subscription: params.planId,
    subscriptionBillingCycle: params.billingCycle,
    subscriptionUpdatedAt: now.toISOString(),
    subscriptionStatus: params.subscriptionStatus || 'active',
    subscriptionCurrentPeriodEnd: periodEnd,
  }

  if (params.reference) patch.lastPaystackReference = params.reference
  if (params.paystackSubscriptionCode) patch.paystackSubscriptionCode = params.paystackSubscriptionCode
  if (params.paystackSubscriptionEmailToken) {
    patch.paystackSubscriptionEmailToken = params.paystackSubscriptionEmailToken
  }
  if (params.paystackCustomerCode) patch.paystackCustomerCode = params.paystackCustomerCode

  return patch
}

/** Persist subscription fields on the account owner (server-only writes). */
export async function applySubscriptionToUser(
  db: Firestore,
  params: ApplySubscriptionParams
): Promise<void> {
  const patch = buildSubscriptionUserPatch(params)
  await db.collection('users').doc(params.userId).set(patch, { merge: true })
}

/** Find account owner by Paystack subscription code (renewal webhooks). */
export async function findUserIdByPaystackSubscriptionCode(
  db: Firestore,
  subscriptionCode: string
): Promise<string | null> {
  const snap = await db
    .collection('users')
    .where('paystackSubscriptionCode', '==', subscriptionCode)
    .limit(1)
    .get()
  if (snap.empty) return null
  return snap.docs[0]?.id ?? null
}

/** Disable an existing Paystack subscription before plan/cycle change. */
export async function disablePaystackSubscription(
  secretKey: string,
  subscriptionCode: string,
  emailToken: string
): Promise<void> {
  await paystackRequest('/subscription/disable', {
    method: 'POST',
    secretKey,
    body: {
      code: subscriptionCode,
      token: emailToken,
    },
  })
}

/** Fetch active subscription for a Paystack customer after first checkout. */
export async function fetchActivePaystackSubscription(
  secretKey: string,
  customerCode: string
): Promise<PaystackSubscriptionRecord | null> {
  const data = await paystackRequest<{ subscriptions?: PaystackSubscriptionRecord[] }>(
    `/subscription?customer=${encodeURIComponent(customerCode)}`,
    { secretKey }
  )
  const subs = data.subscriptions || []
  const active =
    subs.find((s) => s.status === 'active') ||
    subs.find((s) => s.status === 'non-renewing') ||
    subs[0]
  return active ?? null
}

export function extractSubscriptionFromChargePayload(data: {
  subscription?: PaystackSubscriptionRecord
  customer?: { customer_code?: string }
  metadata?: Record<string, unknown>
}): {
  subscriptionCode?: string
  emailToken?: string
  customerCode?: string
  nextPaymentDate?: string
  userId?: string
  planId?: SubscriptionPlan
  billingCycle?: SubscriptionBillingCycle
} {
  const metadata = data.metadata || {}
  const userId = typeof metadata.userId === 'string' ? metadata.userId : undefined
  const planId = typeof metadata.planId === 'string' ? (metadata.planId as SubscriptionPlan) : undefined
  const billingCycle = isSubscriptionBillingCycle(metadata.billingCycle)
    ? metadata.billingCycle
    : undefined

  return {
    userId,
    planId,
    billingCycle,
    subscriptionCode: data.subscription?.subscription_code,
    emailToken: data.subscription?.email_token,
    customerCode: data.customer?.customer_code,
    nextPaymentDate: normalizePaystackDate(data.subscription?.next_payment_date),
  }
}

/** Mark subscription inactive and revert to Micro when Paystack disables billing. */
export async function cancelSubscriptionForUser(
  db: Firestore,
  userId: string,
  status: SubscriptionStatus = 'canceled'
): Promise<void> {
  await db.collection('users').doc(userId).set(
    {
      subscription: 'storvv_micro',
      subscriptionStatus: status,
      subscriptionUpdatedAt: new Date().toISOString(),
      subscriptionCurrentPeriodEnd: FieldValue.delete(),
      paystackSubscriptionCode: FieldValue.delete(),
      paystackSubscriptionEmailToken: FieldValue.delete(),
    },
    { merge: true }
  )
}

/** Stop Paystack auto-renew; keep paid plan until subscriptionCurrentPeriodEnd. */
export async function cancelAutoRenewForUser(db: Firestore, userId: string): Promise<void> {
  await db.collection('users').doc(userId).set(
    {
      subscriptionStatus: 'canceled',
      subscriptionUpdatedAt: new Date().toISOString(),
      paystackSubscriptionCode: FieldValue.delete(),
      paystackSubscriptionEmailToken: FieldValue.delete(),
    },
    { merge: true }
  )
}

export type UserSubscriptionSnapshot = {
  subscription?: unknown
  subscriptionStatus?: string
  subscriptionCurrentPeriodEnd?: string
}

/** Persist Micro when a canceled subscription's paid period has ended. */
export async function maybeDowngradeExpiredSubscription(
  db: Firestore,
  userId: string,
  userData: UserSubscriptionSnapshot | undefined
): Promise<boolean> {
  if (!userData || userData.subscriptionStatus !== 'canceled') return false
  const periodEnd = userData.subscriptionCurrentPeriodEnd
  if (!periodEnd) return false
  const endMs = new Date(periodEnd).getTime()
  if (!Number.isFinite(endMs) || Date.now() <= endMs) return false

  await cancelSubscriptionForUser(db, userId, 'canceled')
  return true
}
