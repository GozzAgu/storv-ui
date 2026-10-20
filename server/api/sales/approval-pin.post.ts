import { createError } from 'h3'
import { defineSalesRoute } from '~/server/utils/sales/http'
import { actorCanApproveDiscounts } from '~/server/utils/sales/actor'
import { setApprovalPin } from '~/server/utils/sales/approval-pin'
import { requireFreshTotp, readTotpCodeFromRequest } from '~/server/utils/store-auth'

/** Sets the caller's approval PIN for discounts and trade-ins in this business. */
export default defineSalesRoute(
  { id: 'sales:approval-pin', limit: 10, write: false },
  async ({ event, db, auth, actor, input }) => {
    if (!actorCanApproveDiscounts(actor)) {
      throw createError({ statusCode: 403, message: 'Only managers can set an approval PIN.' })
    }
    await requireFreshTotp(auth, await readTotpCodeFromRequest(event))
    await setApprovalPin(db, actor.ownerId, auth.uid, String(input.pin ?? ''))
    return { ok: true }
  }
)
