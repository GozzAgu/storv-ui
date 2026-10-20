import { createError } from 'h3'
import { defineSalesRoute } from '~/server/utils/sales/http'
import { canCloseSales, refundSale } from '~/server/utils/sales/balance'
import { closeV2SaleIfNeeded } from '~/server/utils/sales/v2-close'

/** Refunds a completed sale and returns its stock once. */
export default defineSalesRoute({ id: 'sales:refund', limit: 30 }, async ({ db, auth, actor, input }) => {
  if (!canCloseSales(actor)) throw createError({ statusCode: 403, message: 'You don’t have permission to refund sales.' })
  await closeV2SaleIfNeeded(db, auth.uid, actor, input.receiptId, 'refund', input.reason)
  await refundSale(db, actor, { receiptId: input.receiptId, reason: input.reason })
  return { status: 'refunded' as const }
})
