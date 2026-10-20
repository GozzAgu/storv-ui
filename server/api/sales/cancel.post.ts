import { createError } from 'h3'
import { defineSalesRoute } from '~/server/utils/sales/http'
import { cancelBalanceDue, canCloseSales } from '~/server/utils/sales/balance'
import { closeV2SaleIfNeeded } from '~/server/utils/sales/v2-close'

/** Cancels a balance-due order and frees the items it was holding. */
export default defineSalesRoute({ id: 'sales:cancel', limit: 30 }, async ({ db, auth, actor, input }) => {
  if (!canCloseSales(actor)) throw createError({ statusCode: 403, message: 'You don’t have permission to cancel orders.' })
  await closeV2SaleIfNeeded(db, auth.uid, actor, input.receiptId, 'cancel', input.reason)
  await cancelBalanceDue(db, actor, { receiptId: input.receiptId, reason: input.reason })
  return { status: 'cancelled' as const }
})
