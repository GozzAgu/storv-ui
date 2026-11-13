import { defineEventHandler, getRouterParam, readBody } from 'h3'
import { getAdminFirestore } from '~/server/utils/firebase-admin'
import { requireAuth } from '~/server/utils/store-auth'
import { assertRateLimit } from '~/server/utils/rate-limit'
import { runTransferAction } from '~/server/utils/transfers/service'

/** POST /api/transfers/:transferId/:action — dispatch | receive | reject | cancel | track. */
export default defineEventHandler(async (event) => {
  const auth = await requireAuth(event)
  await assertRateLimit(event, {
    id: 'transfers:action',
    limit: 60,
    windowMs: 60_000,
    uid: auth.uid,
  })
  const body = ((await readBody<Record<string, unknown>>(event).catch(() => null)) ?? {}) as Record<
    string,
    unknown
  >
  return runTransferAction(getAdminFirestore(), auth.uid, {
    ownerUserId: body.ownerUserId,
    transferId: getRouterParam(event, 'transferId'),
    action: getRouterParam(event, 'action'),
    reason: body.reason,
    carrier: body.carrier,
    trackingNumber: body.trackingNumber,
  })
})
