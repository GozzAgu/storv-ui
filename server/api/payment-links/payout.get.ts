import { createError, defineEventHandler, getQuery } from 'h3'
import { getAdminFirestore } from '~/server/utils/firebase-admin'
import { requireAuth, requireStoreReadAccess } from '~/server/utils/store-auth'
import { payoutDocId, type MerchantPayoutDoc } from '~/server/utils/payment-links'

/** Authenticated: payout/bank connection status for the dashboard. Never exposes the full account number. */
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
  const snap = await adminDb.collection('merchantPayouts').doc(payoutDocId(ownerUserId, storeId)).get()

  if (!snap.exists) {
    return { success: true, payout: { connected: false } }
  }
  const data = snap.data() as MerchantPayoutDoc
  return {
    success: true,
    payout: {
      connected: !!data.connected,
      bankName: data.bankName || '',
      accountName: data.accountName || '',
      accountNumberLast4: (data.accountNumber || '').slice(-4),
      percentageCharge: Number(data.percentageCharge) || 0,
    },
  }
})
