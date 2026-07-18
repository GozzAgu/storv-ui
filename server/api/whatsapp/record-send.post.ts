import { createError, defineEventHandler } from 'h3'
import { FieldValue } from 'firebase-admin/firestore'
import { getAdminFirestore } from '~/server/utils/firebase-admin'
import { requireAuth } from '~/server/utils/store-auth'
import { getPlanLimits } from '~/types/subscription'
import type { SubscriptionPlan } from '~/types/subscription'

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

export default defineEventHandler(async (event) => {
  const auth = await requireAuth(event)
  const adminDb = getAdminFirestore()
  const monthKey = currentMonthKey()

  const userRef = adminDb.collection('users').doc(auth.uid)
  const userSnap = await userRef.get()
  const plan = normalizePlan(userSnap.data()?.subscription)
  const limit = getPlanLimits(plan).maxWhatsAppMessagesPerMonth

  if (limit === 0) {
    return {
      success: false,
      error: 'WhatsApp messaging is not included on your plan.',
    }
  }

  const usageRef = userRef.collection('whatsappUsage').doc(monthKey)

  if (limit < 0) {
    await usageRef.set(
      { count: FieldValue.increment(1), monthKey, updatedAt: FieldValue.serverTimestamp() },
      { merge: true }
    )
    return { success: true, unlimited: true }
  }

  const result = await adminDb.runTransaction(async (tx) => {
    const snap = await tx.get(usageRef)
    const count = snap.exists ? Number(snap.data()?.count) || 0 : 0
    if (count >= limit) {
      return { success: false as const, count, limit }
    }
    tx.set(
      usageRef,
      {
        count: count + 1,
        monthKey,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    )
    return { success: true as const, count: count + 1, limit }
  })

  if (!result.success) {
    throw createError({
      statusCode: 429,
      message: `Monthly WhatsApp limit reached (${result.count}/${result.limit}). Upgrade to Storvv Medium for unlimited sends.`,
    })
  }

  return { success: true, count: result.count, limit: result.limit }
})
