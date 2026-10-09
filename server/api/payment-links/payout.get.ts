import { createError, defineEventHandler, getQuery } from 'h3'
import { getAdminFirestore } from '~/server/utils/firebase-admin'
import { requireAuth, requireStoreReadAccess } from '~/server/utils/store-auth'
import { payoutDocId, toPayoutView, type StoredPayout } from '~/server/utils/payments/payout'

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

  const snap = await getAdminFirestore()
    .collection('merchantPayouts')
    .doc(payoutDocId(ownerUserId, storeId))
    .get()

  return {
    success: true,
    payout: toPayoutView(snap.data() as Partial<StoredPayout> | undefined),
    canChange: auth.uid === ownerUserId,
  }
})
