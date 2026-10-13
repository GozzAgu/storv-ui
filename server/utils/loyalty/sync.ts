import { createError } from 'h3'
import { FieldValue, type Firestore } from 'firebase-admin/firestore'
import {
  loyaltyAwardId,
  loyaltyCustomerKey,
  loyaltySpendLast12Months,
  planLoyaltyAward,
  readLoyaltySettings,
  type LoyaltyAward,
  type LoyaltyReceipt,
} from '~/utils/loyalty'

/** Rewards routes 404 and sale hooks do nothing unless LOYALTY_ENABLED=1. */
export function loyaltyEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  return env.LOYALTY_ENABLED === '1'
}

export function requireLoyalty(): void {
  if (!loyaltyEnabled()) throw createError({ statusCode: 404, message: 'Not found' })
}

export const loyaltyRefs = (db: Firestore, ownerId: string) => {
  const owner = db.collection('users').doc(ownerId)
  return {
    settings: owner.collection('loyalty').doc('settings'),
    members: owner.collection('loyaltyMembers'),
    awards: owner.collection('loyaltyAwards'),
    ledger: owner.collection('loyaltyLedger'),
  }
}

export interface LoyaltySyncResult {
  pointsChange: number
  customerKey: string | null
}

/**
 * Bring one sale's points in line with what has been paid on it. Safe to call any number of
 * times: only the difference from the last run is written, once, in one transaction.
 */
export async function syncLoyaltyForReceipt(
  db: Firestore,
  scope: { ownerId: string; storeId: string; receiptId: string; actorUid: string },
  now: Date = new Date()
): Promise<LoyaltySyncResult> {
  const refs = loyaltyRefs(db, scope.ownerId)
  const receiptRef = db
    .collection('users')
    .doc(scope.ownerId)
    .collection('stores')
    .doc(scope.storeId)
    .collection('receipts')
    .doc(scope.receiptId)
  const awardRef = refs.awards.doc(loyaltyAwardId(scope.storeId, scope.receiptId))

  return db.runTransaction(async (tx) => {
    const [receiptSnap, awardSnap, settingsSnap] = await Promise.all([
      tx.get(receiptRef),
      tx.get(awardRef),
      tx.get(refs.settings),
    ])
    const receipt = receiptSnap.exists ? (receiptSnap.data() as LoyaltyReceipt) : null
    const award = awardSnap.exists ? (awardSnap.data() as LoyaltyAward) : null
    const settings = readLoyaltySettings(settingsSnap.data())
    const key = receipt ? loyaltyCustomerKey(receipt) : null

    if (!award && (!settings.enabled || !key)) return { pointsChange: 0, customerKey: key }

    const memberSnap = key ? await tx.get(refs.members.doc(key)) : null
    const plan = planLoyaltyAward({
      storeId: scope.storeId,
      receiptId: scope.receiptId,
      receipt,
      settings,
      award,
      memberSpend12m: loyaltySpendLast12Months(memberSnap?.data()?.spendByMonth, now),
      now,
    })

    const at = FieldValue.serverTimestamp()
    for (const change of plan.changes) {
      const isCurrent = change.customerKey === key && receipt
      tx.set(
        refs.members.doc(change.customerKey),
        {
          key: change.customerKey,
          points: FieldValue.increment(change.points),
          spendByMonth: { [change.month]: FieldValue.increment(change.amount) },
          updatedAt: at,
          ...(isCurrent
            ? {
                name: (receipt.customerName ?? '').trim().slice(0, 120) || 'Customer',
                phone: receipt.customerPhone?.trim() || null,
                email: receipt.customerEmail?.trim().toLowerCase() || null,
                ...(change.amount > 0 ? { lastPurchaseAt: at } : {}),
              }
            : {}),
        },
        { merge: true }
      )
      tx.create(refs.ledger.doc(), {
        customerKey: change.customerKey,
        storeId: scope.storeId,
        receiptId: scope.receiptId,
        type: change.type,
        points: change.points,
        amount: change.amount,
        verified: plan.award?.verified ?? award?.verified ?? false,
        actorUid: scope.actorUid,
        createdAt: at,
      })
    }
    if (plan.award === null) tx.delete(awardRef)
    else if (plan.award) tx.set(awardRef, { ...plan.award, updatedAt: at })

    return {
      pointsChange: plan.changes
        .filter((c) => c.customerKey === key)
        .reduce((sum, c) => sum + c.points, 0),
      customerKey: key,
    }
  })
}

/**
 * For hooks after a payment change or sale delete: rewards must never fail the operation that
 * already committed, so errors are logged and swallowed.
 */
export async function syncLoyaltyBestEffort(
  db: Firestore,
  scope: { ownerId: string; storeId: string; actorUid: string },
  receiptIds: Iterable<string>
): Promise<void> {
  if (!loyaltyEnabled()) return
  for (const receiptId of new Set(receiptIds)) {
    try {
      await syncLoyaltyForReceipt(db, { ...scope, receiptId })
    } catch (err) {
      console.warn('[loyalty] sync after payment failed', {
        receiptId,
        message: err instanceof Error ? err.message : String(err),
      })
    }
  }
}
