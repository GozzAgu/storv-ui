import type { Firestore } from 'firebase-admin/firestore'
import { createError } from 'h3'
import type { SubscriptionAddOnEntry, SubscriptionAddOnKind } from '~/types/subscription'
import { getLiveSubscriptionAddOns } from '~/types/subscription'
import { PAYSTACK_CURRENCY } from '~/server/utils/paystack-validation'
import {
  disablePaystackSubscription,
  listPaystackSubscriptions,
  type PaystackSubscriptionRecord,
} from '~/server/utils/paystack-subscription'

/**
 * Enterprise add-ons: each extra store / staff seat is its own monthly Paystack subscription.
 * - Checkout: users/{uid}/pendingCheckouts/{reference} with kind 'addon'
 * - Paid add-on: users/{uid}/subscriptionAddOns/{reference}
 * - Renewal lookup: paystackAddOnSubscriptions/{subscriptionCode} → { userId, addOnId }
 * - Client summary: users/{uid}.subscriptionAddOns (drives plan limits)
 */

export const SUBSCRIPTION_ADD_ON_KINDS: SubscriptionAddOnKind[] = ['store', 'staff']

export function isSubscriptionAddOnKind(value: unknown): value is SubscriptionAddOnKind {
  return value === 'store' || value === 'staff'
}

const AMOUNT_KEYS: Record<SubscriptionAddOnKind, string> = {
  store: 'paystackAddOnStoreAmount',
  staff: 'paystackAddOnStaffAmount',
}

const PLAN_CODE_KEYS: Record<SubscriptionAddOnKind, string> = {
  store: 'paystackPlanCodeAddOnStore',
  staff: 'paystackPlanCodeAddOnStaff',
}

export function getAddOnAmountKobo(
  kind: SubscriptionAddOnKind,
  config: Record<string, unknown>
): number {
  const amount = Number(config[AMOUNT_KEYS[kind]])
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error(`Invalid server amount config for ${kind} add-on`)
  }
  return amount
}

export function getAddOnPlanCode(
  kind: SubscriptionAddOnKind,
  config: Record<string, unknown>
): string {
  const key = PLAN_CODE_KEYS[kind]
  const code = typeof config[key] === 'string' ? (config[key] as string).trim() : ''
  if (!code) {
    throw new Error(
      `Missing Paystack plan code for the ${kind} add-on. Set ${toEnvName(key)} in env.`
    )
  }
  return code
}

function toEnvName(key: string): string {
  return key
    .replace(/AddOn/, 'Addon')
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .toUpperCase()
}

export type AddOnStatus = 'active' | 'past_due' | 'canceled'

export type SubscriptionAddOnRecord = {
  userId: string
  kind: SubscriptionAddOnKind
  storeId?: string
  status: AddOnStatus
  reference: string
  amount: number
  currency: string
  paystackPlanCode: string
  paystackSubscriptionCode?: string
  paystackSubscriptionEmailToken?: string
  currentPeriodEnd?: string
  endsAt?: string
  createdAt: string
  updatedAt: string
}

export type PendingAddOnCheckout = {
  kind: 'addon'
  userId: string
  addOnKind: SubscriptionAddOnKind
  storeId?: string
  amount: number
  currency: string
  paystackPlanCode: string
  status: 'initialized' | 'completed'
}

const addOnsCollection = (db: Firestore, userId: string) =>
  db.collection('users').doc(userId).collection('subscriptionAddOns')

const addOnLookupDoc = (db: Firestore, subscriptionCode: string) =>
  db.collection('paystackAddOnSubscriptions').doc(subscriptionCode)

function normalizeDate(value: unknown): string | undefined {
  if (typeof value !== 'string' || !value.trim()) return undefined
  const parsed = new Date(value)
  return Number.isFinite(parsed.getTime()) ? parsed.toISOString() : undefined
}

/** Rebuild the owner-doc summary the client uses for limits. */
export async function refreshAddOnSummary(
  db: Firestore,
  userId: string
): Promise<SubscriptionAddOnEntry[]> {
  const snap = await addOnsCollection(db, userId).get()
  const entries: SubscriptionAddOnEntry[] = snap.docs.map((docSnap) => {
    const record = docSnap.data() as SubscriptionAddOnRecord
    return {
      id: docSnap.id,
      kind: record.kind,
      ...(record.storeId ? { storeId: record.storeId } : {}),
      status: record.status,
      ...(record.endsAt ? { endsAt: record.endsAt } : {}),
    }
  })
  const live = getLiveSubscriptionAddOns(entries)
  await db.collection('users').doc(userId).set({ subscriptionAddOns: live }, { merge: true })
  return live
}

/**
 * Turn a paid add-on checkout into an active add-on (idempotent; verify + webhook both call this).
 * Throws 409 when the payment does not match what was initialized.
 */
export async function completeAddOnCheckout(
  db: Firestore,
  params: { userId: string; reference: string; paidAmountKobo: number; currency?: string }
): Promise<{ alreadyProcessed: boolean; kind: SubscriptionAddOnKind; storeId?: string }> {
  const pendingRef = db
    .collection('users')
    .doc(params.userId)
    .collection('pendingCheckouts')
    .doc(params.reference)
  const addOnRef = addOnsCollection(db, params.userId).doc(params.reference)

  const result = await db.runTransaction(async (tx) => {
    const pendingSnap = await tx.get(pendingRef)
    const pending = pendingSnap.data() as PendingAddOnCheckout | undefined
    if (!pending || pending.kind !== 'addon' || pending.userId !== params.userId) {
      throw createError({ statusCode: 409, message: 'No matching add-on checkout was found.' })
    }
    if (
      pending.amount !== params.paidAmountKobo ||
      (params.currency || '').toUpperCase() !== PAYSTACK_CURRENCY
    ) {
      throw createError({ statusCode: 409, message: 'Payment does not match the add-on price.' })
    }
    if (pending.status === 'completed') {
      return { alreadyProcessed: true, kind: pending.addOnKind, storeId: pending.storeId }
    }

    const now = new Date().toISOString()
    const record: SubscriptionAddOnRecord = {
      userId: params.userId,
      kind: pending.addOnKind,
      ...(pending.storeId ? { storeId: pending.storeId } : {}),
      status: 'active',
      reference: params.reference,
      amount: pending.amount,
      currency: pending.currency,
      paystackPlanCode: pending.paystackPlanCode,
      createdAt: now,
      updatedAt: now,
    }
    tx.set(addOnRef, record)
    tx.set(
      pendingRef,
      { status: 'completed', paidAt: now, verifiedAt: now, updatedAt: now },
      { merge: true }
    )
    return { alreadyProcessed: false, kind: pending.addOnKind, storeId: pending.storeId }
  })

  await refreshAddOnSummary(db, params.userId)
  return result
}

async function claimSubscription(
  db: Firestore,
  userId: string,
  addOnId: string,
  sub: PaystackSubscriptionRecord
): Promise<boolean> {
  if (!sub.subscription_code) return false
  try {
    await addOnLookupDoc(db, sub.subscription_code).create({
      userId,
      addOnId,
      createdAt: new Date().toISOString(),
    })
  } catch {
    return false
  }
  await addOnsCollection(db, userId)
    .doc(addOnId)
    .set(
      {
        paystackSubscriptionCode: sub.subscription_code,
        ...(sub.email_token ? { paystackSubscriptionEmailToken: sub.email_token } : {}),
        ...(normalizeDate(sub.next_payment_date)
          ? { currentPeriodEnd: normalizeDate(sub.next_payment_date) }
          : {}),
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    )
  return true
}

/**
 * Link the Paystack subscription Paystack created for this add-on checkout, so it can be
 * renewed and canceled. Picks the newest unclaimed subscription on the add-on's plan.
 */
export async function attachPaystackSubscriptionToAddOn(
  db: Firestore,
  secretKey: string,
  params: { userId: string; addOnId: string; customerCode: string }
): Promise<boolean> {
  const addOnSnap = await addOnsCollection(db, params.userId).doc(params.addOnId).get()
  const record = addOnSnap.data() as SubscriptionAddOnRecord | undefined
  if (!record || record.paystackSubscriptionCode) return Boolean(record)

  const candidates = (await listPaystackSubscriptions(secretKey, params.customerCode))
    .filter((sub) => sub.plan?.plan_code === record.paystackPlanCode && sub.status === 'active')
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())

  for (const sub of candidates) {
    if (await claimSubscription(db, params.userId, params.addOnId, sub)) return true
  }
  return false
}

/** `subscription.create` webhook: attach to the oldest paid add-on still missing a subscription. */
export async function attachSubscriptionFromWebhook(
  db: Firestore,
  sub: PaystackSubscriptionRecord
): Promise<boolean> {
  const planCode = sub.plan?.plan_code
  const customerCode = sub.customer?.customer_code
  if (!planCode || !customerCode || !sub.subscription_code) return false

  const userSnap = await db
    .collection('users')
    .where('paystackCustomerCode', '==', customerCode)
    .limit(1)
    .get()
  const userId = userSnap.docs[0]?.id
  if (!userId) return false

  const addOns = await addOnsCollection(db, userId).where('paystackPlanCode', '==', planCode).get()
  const unattached = addOns.docs
    .filter((docSnap) => {
      const record = docSnap.data() as SubscriptionAddOnRecord
      return !record.paystackSubscriptionCode && record.status !== 'canceled'
    })
    .sort((a, b) => String(a.data().createdAt).localeCompare(String(b.data().createdAt)))

  for (const docSnap of unattached) {
    if (await claimSubscription(db, userId, docSnap.id, sub)) return true
  }
  return false
}

export async function findAddOnBySubscriptionCode(
  db: Firestore,
  subscriptionCode: string
): Promise<{ userId: string; addOnId: string } | null> {
  const snap = await addOnLookupDoc(db, subscriptionCode).get()
  const data = snap.data() as { userId?: string; addOnId?: string } | undefined
  if (!data?.userId || !data.addOnId) return null
  return { userId: data.userId, addOnId: data.addOnId }
}

/** Webhook lifecycle for an add-on subscription (renewed, failed, disabled). */
export async function updateAddOnFromWebhook(
  db: Firestore,
  subscriptionCode: string,
  update: { status: AddOnStatus; nextPaymentDate?: string }
): Promise<boolean> {
  const match = await findAddOnBySubscriptionCode(db, subscriptionCode)
  if (!match) return false

  const ref = addOnsCollection(db, match.userId).doc(match.addOnId)
  const record = (await ref.get()).data() as SubscriptionAddOnRecord | undefined
  if (!record) return false

  const now = new Date().toISOString()
  const patch: Record<string, unknown> = { status: update.status, updatedAt: now }
  const nextPayment = normalizeDate(update.nextPaymentDate)
  if (nextPayment) patch.currentPeriodEnd = nextPayment
  if (update.status === 'canceled') {
    patch.endsAt = record.endsAt || record.currentPeriodEnd || now
  }
  await ref.set(patch, { merge: true })
  await refreshAddOnSummary(db, match.userId)
  return true
}

/**
 * Stop billing for one add-on. It keeps granting capacity until `endsAt`
 * (end of the paid month unless `immediate`).
 */
export async function cancelAddOn(
  db: Firestore,
  secretKey: string,
  params: { userId: string; addOnId: string; endsAt?: string; immediate?: boolean }
): Promise<SubscriptionAddOnRecord | null> {
  const ref = addOnsCollection(db, params.userId).doc(params.addOnId)
  const record = (await ref.get()).data() as SubscriptionAddOnRecord | undefined
  if (!record || record.status === 'canceled') return record ?? null

  if (record.paystackSubscriptionCode && record.paystackSubscriptionEmailToken) {
    await disablePaystackSubscription(
      secretKey,
      record.paystackSubscriptionCode,
      record.paystackSubscriptionEmailToken
    )
  }

  const now = new Date().toISOString()
  const endsAt = params.immediate ? now : params.endsAt || record.currentPeriodEnd || now
  await ref.set({ status: 'canceled', endsAt, updatedAt: now }, { merge: true })
  return { ...record, status: 'canceled', endsAt, updatedAt: now }
}

/** Cancel every add-on (plan canceled or moved off Enterprise). */
export async function cancelAllAddOns(
  db: Firestore,
  secretKey: string,
  userId: string,
  options: { endsAt?: string; immediate?: boolean } = {}
): Promise<void> {
  const snap = await addOnsCollection(db, userId)
    .where('status', 'in', ['active', 'past_due'])
    .get()
  if (snap.empty) return
  for (const docSnap of snap.docs) {
    try {
      await cancelAddOn(db, secretKey, { userId, addOnId: docSnap.id, ...options })
    } catch (err) {
      console.warn('[subscription-addons] could not cancel add-on', docSnap.id, err)
    }
  }
  await refreshAddOnSummary(db, userId)
}
