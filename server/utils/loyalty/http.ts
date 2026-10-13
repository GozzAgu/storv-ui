import { createError, defineEventHandler, getQuery, readBody, type H3Event } from 'h3'
import type { Firestore } from 'firebase-admin/firestore'
import { getAdminFirestore } from '~/server/utils/firebase-admin'
import { assertRateLimit } from '~/server/utils/rate-limit'
import { requireAuth, requireStoreReadAccess, type AuthContext } from '~/server/utils/store-auth'
import { requireLoyalty } from './sync'

const ID_PATTERN = /^[A-Za-z0-9_-]{1,128}$/

export function loyaltyDocId(value: unknown, field: string): string {
  if (typeof value !== 'string' || !ID_PATTERN.test(value)) {
    throw createError({ statusCode: 400, message: `${field} is invalid` })
  }
  return value
}

export interface LoyaltyRouteContext {
  event: H3Event
  db: Firestore
  auth: AuthContext
  ownerId: string
  storeId: string
  isOwner: boolean
  input: Record<string, unknown>
}

/**
 * Every rewards route: feature gate (404 when off) → Firebase auth → per-uid rate limit →
 * active member of the branch (owners pass) → handler. `ownerOnly` routes refuse staff.
 */
export function defineLoyaltyRoute<T>(
  options: {
    method: 'GET' | 'POST'
    rateLimit: { id: string; limit: number; windowMs: number }
    ownerOnly?: boolean
  },
  run: (ctx: LoyaltyRouteContext) => Promise<T>
) {
  return defineEventHandler(async (event) => {
    requireLoyalty()
    const auth = await requireAuth(event)
    await assertRateLimit(event, { ...options.rateLimit, uid: auth.uid, requireDistributed: true })
    const input =
      options.method === 'GET'
        ? (getQuery(event) as Record<string, unknown>)
        : (await readBody<Record<string, unknown>>(event).catch(() => null)) ?? {}
    const ownerId = loyaltyDocId(input.ownerUserId, 'ownerUserId')
    const storeId = loyaltyDocId(input.storeId, 'storeId')
    const isOwner = auth.uid === ownerId
    if (options.ownerOnly && !isOwner) {
      throw createError({ statusCode: 403, message: 'Only the business owner can change rewards' })
    }
    await requireStoreReadAccess(auth.uid, ownerId, storeId)
    return run({ event, db: getAdminFirestore(), auth, ownerId, storeId, isOwner, input })
  })
}
