import { createError } from 'h3'
import { FieldValue, type DocumentReference } from 'firebase-admin/firestore'
import type { DecodedIdToken } from 'firebase-admin/auth'
import { getAdminFirestore } from '~/server/utils/firebase-admin'
import { findStaffDocForLogin, resolveStaffWorkspaceOwnerId } from '~/server/utils/staff-workspace'
import { whatsAppLimitMessage } from '~/utils/plan-gate-message'
import {
  getPlanLimits,
  resolveEffectiveSubscriptionPlan,
  type SubscriptionPlan,
} from '~/types/subscription'

/**
 * WhatsApp sends are capped per business per calendar month (UTC), on the owner's plan:
 * Micro 10, Medium 50, Enterprise unlimited (see `maxWhatsAppMessagesPerMonth`).
 *
 * The count lives on the owner (`users/{ownerId}/whatsappUsage/{YYYY-MM}`) so the owner and
 * every staff member share one allowance; `bySender` keeps who sent how many. Staff have no
 * `users/{uid}` doc of their own, so counting per signed-in account would give each of them a
 * separate (Micro-sized) allowance.
 */

export interface WhatsAppAllowance {
  ownerId: string
  plan: SubscriptionPlan
  /** -1 = unlimited. */
  limit: number
  count: number
  monthKey: string
  usageRef: DocumentReference
}

export function currentWhatsAppMonthKey(now = new Date()): string {
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`
}

export async function isStaffAccount(uid: string): Promise<boolean> {
  const snap = await getAdminFirestore().collection('users').doc(uid).get()
  return !snap.exists || snap.data()?.role === 'staff'
}

/**
 * The business a signed-in person sends for: themselves if they own an account, else the owner
 * of the workspace where they are active staff. Null when they are neither.
 */
export async function resolveWhatsAppOwnerId(decoded: DecodedIdToken): Promise<string | null> {
  const db = getAdminFirestore()
  const self = await db.collection('users').doc(decoded.uid).get()
  if (self.exists && self.data()?.role !== 'staff') return decoded.uid
  const staffDoc = await findStaffDocForLogin(db, decoded)
  return staffDoc ? resolveStaffWorkspaceOwnerId(staffDoc.ref.path) : null
}

/** This month's count and limit for one business. */
export async function getWhatsAppAllowance(ownerId: string): Promise<WhatsAppAllowance> {
  const db = getAdminFirestore()
  const ownerRef = db.collection('users').doc(ownerId)
  const ownerSnap = await ownerRef.get()
  const plan = resolveEffectiveSubscriptionPlan(ownerSnap.data())
  const limit = getPlanLimits(plan).maxWhatsAppMessagesPerMonth
  const monthKey = currentWhatsAppMonthKey()
  const usageRef = ownerRef.collection('whatsappUsage').doc(monthKey)
  const usageSnap = await usageRef.get()
  const count = usageSnap.exists ? Number(usageSnap.data()?.count) || 0 : 0
  return { ownerId, plan, limit, count, monthKey, usageRef }
}

function limitReached(count: number, limit: number, plan: SubscriptionPlan, forStaff: boolean) {
  return createError({
    statusCode: 429,
    message: whatsAppLimitMessage(count, limit, { forStaff, plan }),
    data: { code: 'WHATSAPP_LIMIT_REACHED', count, limit, plan },
  })
}

/** Throws 429 when the business has used this month's WhatsApp sends. */
export async function assertWhatsAppSendAllowed(
  ownerId: string,
  senderUid: string
): Promise<WhatsAppAllowance> {
  const allowance = await getWhatsAppAllowance(ownerId)
  if (allowance.limit === 0) {
    throw createError({
      statusCode: 403,
      message: 'WhatsApp messaging is not included on your plan.',
    })
  }
  if (allowance.limit > 0 && allowance.count >= allowance.limit) {
    throw limitReached(allowance.count, allowance.limit, allowance.plan, senderUid !== ownerId)
  }
  return allowance
}

/**
 * Counts one send against the business, refusing it if the month's allowance is used up
 * (checked again inside the transaction so two tills can't both take the last send).
 */
export async function incrementWhatsAppUsage(
  ownerId: string,
  senderUid: string
): Promise<{ count: number; limit: number }> {
  const db = getAdminFirestore()
  const { limit, plan, monthKey, usageRef } = await getWhatsAppAllowance(ownerId)
  return db.runTransaction(async (tx) => {
    const snap = await tx.get(usageRef)
    const count = snap.exists ? Number(snap.data()?.count) || 0 : 0
    if (limit >= 0 && count >= limit) {
      throw limitReached(count, limit, plan, senderUid !== ownerId)
    }
    tx.set(
      usageRef,
      {
        count: count + 1,
        monthKey,
        bySender: { [senderUid]: FieldValue.increment(1) },
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    )
    return { count: count + 1, limit }
  })
}
