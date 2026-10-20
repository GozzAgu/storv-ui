import { defineSalesRoute } from '~/server/utils/sales/http'
import { actorCanApproveDiscounts } from '~/server/utils/sales/actor'
import { hasApprovalPin } from '~/server/utils/sales/approval-pin'

/** Whether the caller can approve discounts here, and whether they have set a PIN. */
export default defineSalesRoute(
  { id: 'sales:approval-pin:get', limit: 60, method: 'GET', write: false },
  async ({ db, auth, actor }) => {
    const canApprove = actorCanApproveDiscounts(actor)
    return {
      canApprove,
      hasPin: canApprove ? await hasApprovalPin(db, actor.ownerId, auth.uid) : false,
    }
  }
)
