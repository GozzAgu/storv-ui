import { createError, defineEventHandler, readBody } from 'h3'
import { requireAuth, requireSelfUserId } from '~/server/utils/store-auth'

/** Sync Inventory API Endpoint (stub) */
export default defineEventHandler(async (event) => {
  const auth = await requireAuth(event)
  const body = await readBody(event)
  const { userId, sourceStoreId, destinationStoreIds } = body as {
    userId?: string
    sourceStoreId?: string
    destinationStoreIds?: string[]
  }

  requireSelfUserId(auth, userId)

  if (
    !sourceStoreId ||
    !destinationStoreIds ||
    !Array.isArray(destinationStoreIds) ||
    destinationStoreIds.length === 0
  ) {
    throw createError({ statusCode: 400, message: 'Missing required fields' })
  }

  return {
    success: true,
    message: 'Sync request validated. Please implement client-side sync logic.',
  }
})
