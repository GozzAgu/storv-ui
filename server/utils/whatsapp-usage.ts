import { createError } from 'h3'
import { FieldValue } from 'firebase-admin/firestore'
import { getAdminFirestore } from '~/server/utils/firebase-admin'
import { whatsAppLimitMessage } from '~/utils/plan-gate-message'
import { getPlanLimits } from '~/types/subscription'
import type { SubscriptionPlan } from '~/types/subscription'

export async function isStaffAccount(uid: string): Promise<boolean> {
  const snap = await getAdminFirestore().collection('users').doc(uid).get()
  return snap.data()?.role === 'staff'
}

function currentMonthKey(): string {
  const now = new Date()
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`
}

function normalizePlan(raw: unknown): SubscriptionPlan {
  const s = typeof raw === 'string' ? raw : 'storvv_micro'
  if (s === 'storvv_medium' || s === 'storvv_enterprise') return s
  if (s === 'medium') return 'storvv_medium'
  if (s === 'enterprise') return 'storvv_enterprise'
  return 'storvv_micro'
}

/** Throws 429 when the user has hit their monthly send cap. */
export async function assertWhatsAppSendAllowed(uid: string): Promise<void> {
  const adminDb = getAdminFirestore()
  const userRef = adminDb.collection('users').doc(uid)
  const userSnap = await userRef.get()
  const plan = normalizePlan(userSnap.data()?.subscription)
  const limit = getPlanLimits(plan).maxWhatsAppMessagesPerMonth
  if (limit < 0) return

  const monthKey = currentMonthKey()
  const usageRef = userRef.collection('whatsappUsage').doc(monthKey)
  const usageSnap = await usageRef.get()
  const count = usageSnap.exists ? Number(usageSnap.data()?.count) || 0 : 0
  if (count >= limit) {
    const forStaff = await isStaffAccount(uid)
    throw createError({
      statusCode: 429,
      message: whatsAppLimitMessage(count, limit, { forStaff }),
    })
  }
}

export async function incrementWhatsAppUsage(uid: string): Promise<void> {
  const adminDb = getAdminFirestore()
  const userRef = adminDb.collection('users').doc(uid)
  const userSnap = await userRef.get()
  const plan = normalizePlan(userSnap.data()?.subscription)
  const limit = getPlanLimits(plan).maxWhatsAppMessagesPerMonth
  const monthKey = currentMonthKey()
  const usageRef = userRef.collection('whatsappUsage').doc(monthKey)

  if (limit >= 0) {
    await adminDb.runTransaction(async (tx) => {
      const snap = await tx.get(usageRef)
      const count = snap.exists ? Number(snap.data()?.count) || 0 : 0
      if (count >= limit) {
        const forStaff = await isStaffAccount(uid)
        throw createError({
          statusCode: 429,
          message: whatsAppLimitMessage(count, limit, { forStaff }),
        })
      }
      tx.set(
        usageRef,
        { count: count + 1, monthKey, updatedAt: FieldValue.serverTimestamp() },
        { merge: true }
      )
    })
  } else {
    await usageRef.set(
      { count: FieldValue.increment(1), monthKey, updatedAt: FieldValue.serverTimestamp() },
      { merge: true }
    )
  }
}
