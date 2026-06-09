import { createError, defineEventHandler, getQuery } from 'h3'
import { getAdminFirestore } from '~/server/utils/firebase-admin'
import { requireAuth, requireStoreReadAccess } from '~/server/utils/store-auth'
import {
  getPaystackSecret,
  koboToNaira,
  paystackRequest,
  payoutDocId,
  type MerchantPayoutDoc,
} from '~/server/utils/payment-links'

interface PaystackSettlement {
  id: number
  status?: string
  total_amount?: number
  effective_amount?: number
  settlement_date?: string
  createdAt?: string
}

/**
 * Authenticated: real Paystack settlement (payout) history for this merchant's
 * subaccount. Used to show actual "settled to bank" status instead of a guess.
 *
 * Note: Paystack does not settle TEST-mode transactions, so this is empty in test.
 */
export default defineEventHandler(async (event) => {
  const auth = await requireAuth(event)
  const query = getQuery(event)
  const ownerUserId = String(query.ownerUserId || '').trim()
  const storeId = String(query.storeId || '').trim()

  if (!ownerUserId || !storeId) {
    throw createError({ statusCode: 400, message: 'ownerUserId and storeId are required' })
  }

  await requireStoreReadAccess(auth.uid, ownerUserId, storeId)

  const adminDb = getAdminFirestore()
  const payoutSnap = await adminDb.collection('merchantPayouts').doc(payoutDocId(ownerUserId, storeId)).get()
  const payout = payoutSnap.data() as MerchantPayoutDoc | undefined
  if (!payout?.subaccountCode) {
    return { success: true, settlements: [], pendingTotal: 0, settledTotal: 0, lastSettledAtMs: 0 }
  }

  const config = useRuntimeConfig()
  const secretKey = getPaystackSecret(config)

  let raw: PaystackSettlement[] = []
  try {
    raw = await paystackRequest<PaystackSettlement[]>(
      `/settlement?subaccount=${encodeURIComponent(payout.subaccountCode)}&perPage=50`,
      { method: 'GET', secretKey }
    )
  } catch {
    // Settlements may be unavailable (e.g. test mode) — degrade gracefully.
    return { success: true, settlements: [], pendingTotal: 0, settledTotal: 0, lastSettledAtMs: 0 }
  }

  const settlements = (raw || []).map((s) => {
    const amountKobo = Number(s.effective_amount ?? s.total_amount ?? 0)
    const dateStr = s.settlement_date || s.createdAt || ''
    const dateMs = dateStr ? new Date(dateStr).getTime() : 0
    return {
      id: s.id,
      status: (s.status || 'pending').toLowerCase(),
      amount: koboToNaira(amountKobo),
      dateMs: Number.isFinite(dateMs) ? dateMs : 0,
    }
  })

  const isSettled = (st: string) => st === 'success' || st === 'completed'
  const pendingTotal = settlements.filter((s) => !isSettled(s.status)).reduce((sum, s) => sum + s.amount, 0)
  const settledTotal = settlements.filter((s) => isSettled(s.status)).reduce((sum, s) => sum + s.amount, 0)
  const lastSettledAtMs = settlements
    .filter((s) => isSettled(s.status))
    .reduce((max, s) => Math.max(max, s.dateMs), 0)

  return {
    success: true,
    settlements: settlements.sort((a, b) => b.dateMs - a.dateMs).slice(0, 20),
    pendingTotal,
    settledTotal,
    lastSettledAtMs,
  }
})
