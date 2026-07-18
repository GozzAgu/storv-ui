import { defineEventHandler } from 'h3'
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
  if (s === 'storvv_medium' || s === 'storvv_enterprise' || s === 'medium' || s === 'enterprise') {
    return s.startsWith('storvv_') ? (s as SubscriptionPlan) : (`storvv_${s}` as SubscriptionPlan)
  }
  if (s === 'storvv_micro' || s === 'micro') return 'storvv_micro'
  return 'storvv_micro'
}

export default defineEventHandler(async (event) => {
  const auth = await requireAuth(event)
  const adminDb = getAdminFirestore()
  const monthKey = currentMonthKey()

  const userSnap = await adminDb.collection('users').doc(auth.uid).get()
  const plan = normalizePlan(userSnap.data()?.subscription)
  const limit = getPlanLimits(plan).maxWhatsAppMessagesPerMonth
  const unlimited = limit < 0

  const usageRef = adminDb
    .collection('users')
    .doc(auth.uid)
    .collection('whatsappUsage')
    .doc(monthKey)
  const usageSnap = await usageRef.get()
  const count = usageSnap.exists ? Number(usageSnap.data()?.count) || 0 : 0

  const canSend = unlimited || count < limit

  return {
    count,
    limit: unlimited ? -1 : limit,
    unlimited,
    canSend,
    monthKey,
    plan,
  }
})
