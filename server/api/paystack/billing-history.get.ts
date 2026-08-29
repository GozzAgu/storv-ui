import { createError, defineEventHandler } from 'h3'
import { getAdminFirestore } from '~/server/utils/firebase-admin'
import { requireAuth } from '~/server/utils/store-auth'
import { getPlanDisplayName, normalizeSubscriptionPlan } from '~/types/subscription'

export type BillingHistoryEntry = {
  reference: string
  planId: string
  planLabel: string
  billingCycle: string
  amountKobo: number
  currency: string
  paidAt: string
  status: string
}

/** Completed subscription checkouts for the signed-in account owner. */
export default defineEventHandler(async (event) => {
  const auth = await requireAuth(event)
  const adminDb = getAdminFirestore()

  const snap = await adminDb
    .collection('users')
    .doc(auth.uid)
    .collection('pendingCheckouts')
    .where('status', '==', 'completed')
    .limit(24)
    .get()

  const entries: BillingHistoryEntry[] = snap.docs
    .map((docSnap) => {
      const data = docSnap.data() as {
        planId?: string
        billingCycle?: string
        amount?: number
        currency?: string
        paidAt?: string
        verifiedAt?: string
        status?: string
      }
      const planId = normalizeSubscriptionPlan(data.planId)
      return {
        reference: docSnap.id,
        planId,
        planLabel: getPlanDisplayName(planId),
        billingCycle: data.billingCycle || 'monthly',
        amountKobo: Number(data.amount) || 0,
        currency: (data.currency || 'NGN').toUpperCase(),
        paidAt: data.paidAt || data.verifiedAt || '',
        status: data.status || 'completed',
      }
    })
    .filter((entry) => entry.paidAt)
    .sort((a, b) => new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime())

  return { entries }
})
