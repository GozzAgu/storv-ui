import { createError, defineEventHandler, getQuery, readBody, type H3Event } from 'h3'
import type { Firestore } from 'firebase-admin/firestore'
import { getAdminFirestore } from '~/server/utils/firebase-admin'
import { assertRateLimit } from '~/server/utils/rate-limit'
import { requireAuth, type AuthContext } from '~/server/utils/store-auth'
import { resolveStaffPermissions, type LegacyStaffAccessFields } from '~/utils/staff-permissions'
import { assertDocId } from '../payments/access'
import { storeDocRef } from '../payments/audit-log'
import { PaymentServiceError } from '../payments/records'
import { TradeError, type TradeScope } from './partners'

export interface TradeAccess extends TradeScope {
  isOwner: boolean
  /** Owner, or active staff who can make sales: asks partners for stock and replies. */
  canTrade: boolean
}

export interface TradeRouteContext {
  event: H3Event
  db: Firestore
  auth: AuthContext
  access: TradeAccess
  input: Record<string, unknown>
}

export interface TradeRouteOptions {
  method: 'GET' | 'POST'
  rateLimit: { id: string; limit: number; windowMs: number }
  /** Connecting, removing, blocking and the handle are the owner's decisions. */
  ownerOnly?: boolean
  /** Stock requests and replies: owner or staff who can make sales. */
  tradeOnly?: boolean
  requireVerifiedEmail?: boolean
}

export function isTradeEnabled(): boolean {
  return Boolean(useRuntimeConfig().public.trade)
}

/** A missing store or a caller who is not an active member gets 404, as in Payments V2. */
export async function resolveTradeAccess(
  db: Firestore,
  uid: string,
  ownerId: unknown,
  storeId: unknown
): Promise<TradeAccess> {
  const scope = {
    ownerId: assertDocId(ownerId, 'ownerUserId'),
    storeId: assertDocId(storeId, 'storeId'),
  }
  const store = storeDocRef(db, scope.ownerId, scope.storeId)
  if (!(await store.get()).exists) throw new TradeError('NOT_FOUND', 404, 'Not found')
  if (uid === scope.ownerId) return { ...scope, isOwner: true, canTrade: true }
  const member = (await store.collection('members').doc(uid).get()).data() as
    | (LegacyStaffAccessFields & { status?: string })
    | undefined
  if (member?.status !== 'active') throw new TradeError('NOT_FOUND', 404, 'Not found')
  return { ...scope, isOwner: false, canTrade: resolveStaffPermissions(member).receipts.create }
}

function toHttpError(err: unknown): unknown {
  if (err instanceof TradeError || err instanceof PaymentServiceError) {
    return createError({ statusCode: err.statusCode, message: err.message, data: { code: err.code } })
  }
  return err
}

/** Feature gate (404 when off) → auth → per-uid rate limit → store access → handler. */
export function defineTradeRoute<T>(
  options: TradeRouteOptions,
  run: (ctx: TradeRouteContext) => Promise<T>
) {
  return defineEventHandler(async (event) => {
    if (!isTradeEnabled()) throw createError({ statusCode: 404, message: 'Not found' })
    const auth = await requireAuth(event, { requireVerifiedEmail: options.requireVerifiedEmail })
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
      const access = await resolveTradeAccess(db, auth.uid, input.ownerUserId, input.storeId)
      if (options.ownerOnly && !access.isOwner) {
        throw new TradeError('OWNER_ONLY', 403, 'Only the business owner can manage partners.')
      }
      if (options.tradeOnly && !access.canTrade) {
        throw new TradeError('NO_ACCESS', 403, 'You need permission to make sales to do this.')
      }
      return await run({ event, db, auth, access, input })
    } catch (err) {
      throw toHttpError(err)
    }
  })
}
