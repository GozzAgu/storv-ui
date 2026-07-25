import { createError, defineEventHandler, getQuery } from 'h3'
import { requireAuth, requireSelfUserId } from '~/server/utils/store-auth'

/** Transfer History API Endpoint (stub) */
export default defineEventHandler(async (event) => {
  const auth = await requireAuth(event)
  const query = getQuery(event)
  const userId = typeof query.userId === 'string' ? query.userId : undefined

  requireSelfUserId(auth, userId)

  return {
    success: true,
    history: [],
    note: 'Transfer history should be fetched client-side from Firestore collection: users/{userId}/storeTransfers',
  }
})
