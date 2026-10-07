import { createError, defineEventHandler, getQuery, readBody, type H3Event } from 'h3'
import type { Firestore } from 'firebase-admin/firestore'
import { getAdminFirestore } from '~/server/utils/firebase-admin'
import { assertRateLimit } from '~/server/utils/rate-limit'
import { requireAuth, type AuthContext } from '~/server/utils/store-auth'
import { requirePaymentsV2 } from './config'
import { resolvePaymentsAccess, type PaymentsAccess } from './access'
import { PaymentServiceError } from './records'

export interface PaymentsRouteContext {
  event: H3Event
  db: Firestore
  auth: AuthContext
  access: PaymentsAccess
  input: Record<string, unknown>
}

export interface PaymentsRouteOptions {
  method: 'GET' | 'POST'
  /** Per-uid limit, distributed (KV) in production. */
  rateLimit: { id: string; limit: number; windowMs: number }
}

export function toHttpError(err: unknown): unknown {
  if (err instanceof PaymentServiceError) {
    return createError({
      statusCode: err.statusCode,
      message: err.message,
      data: { code: err.code },
    })
  }
  return err
}

/**
 * Every Payments V2 staff route: feature gate (404 when off) → Firebase auth (401) → per-uid
 * rate limit → store membership (404 across stores) → handler. Request bodies are never logged.
 */
export function definePaymentsRoute<T>(
  options: PaymentsRouteOptions,
  run: (ctx: PaymentsRouteContext) => Promise<T>
) {
  return defineEventHandler(async (event) => {
    await requirePaymentsV2()
    const auth = await requireAuth(event)
    await assertRateLimit(event, { ...options.rateLimit, uid: auth.uid, requireDistributed: true })

    const input =
      options.method === 'GET'
        ? (getQuery(event) as Record<string, unknown>)
        : (((await readBody<Record<string, unknown>>(event).catch(() => null)) ?? {}) as Record<
            string,
            unknown
          >)
    const db = getAdminFirestore()
    try {
      const access = await resolvePaymentsAccess(
        db,
        auth.uid,
        input.ownerUserId as string,
        input.storeId as string
      )
      return await run({ event, db, auth, access, input })
    } catch (err) {
      throw toHttpError(err)
    }
  })
}
