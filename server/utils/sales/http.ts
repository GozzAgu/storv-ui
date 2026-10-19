import { defineEventHandler, readBody, getQuery, type H3Event } from 'h3'
import type { Firestore } from 'firebase-admin/firestore'
import { getAdminFirestore } from '~/server/utils/firebase-admin'
import { requireAuth, type AuthContext } from '~/server/utils/store-auth'
import { assertRateLimit } from '~/server/utils/rate-limit'
import { resolveStoreActor, type StoreActor } from './actor'

interface SalesRouteContext {
  event: H3Event
  db: Firestore
  auth: AuthContext
  actor: StoreActor
  input: Record<string, unknown>
}

/** Auth → per-uid rate limit → store actor (plan-checked for writes) → handler. */
export function defineSalesRoute<T>(
  options: { id: string; limit: number; method?: 'GET' | 'POST'; write?: boolean },
  run: (ctx: SalesRouteContext) => Promise<T>
) {
  return defineEventHandler(async (event) => {
    const auth = await requireAuth(event)
    await assertRateLimit(event, { id: options.id, limit: options.limit, windowMs: 60_000, uid: auth.uid })
    const input =
      options.method === 'GET'
        ? (getQuery(event) as Record<string, unknown>)
        : (((await readBody<Record<string, unknown>>(event).catch(() => null)) ?? {}) as Record<string, unknown>)
    const db = getAdminFirestore()
    const actor = await resolveStoreActor(db, auth.uid, input.ownerUserId, input.storeId, {
      write: options.write !== false,
    })
    return run({ event, db, auth, actor, input })
  })
}
