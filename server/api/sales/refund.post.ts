import { createError } from 'h3'
import { defineSalesRoute } from '~/server/utils/sales/http'
import { assertHoldReason, canCloseSales, refundSale } from '~/server/utils/sales/balance'
import { closeV2SaleIfNeeded } from '~/server/utils/sales/v2-close'
import { parseHeldItemIds } from '~/server/utils/inspection-holds'

/**
 * Refunds a completed sale and returns its stock once. Items in `heldItemIds` ("Needs checking")
 * wait for inspection instead of going back on sale.
 */
export default defineSalesRoute(
  { id: 'sales:refund', limit: 30 },
  async ({ db, auth, actor, input }) => {
    if (!canCloseSales(actor))
      throw createError({ statusCode: 403, message: 'You don’t have permission to refund sales.' })
    // Validate before closing a V2 sale, so a bad request can't leave it closed with stock unreturned.
    const heldItemIds = parseHeldItemIds(input.heldItemIds)
    assertHoldReason(heldItemIds, typeof input.reason === 'string' ? input.reason : '')
    await closeV2SaleIfNeeded(db, auth.uid, actor, input.receiptId, 'refund', input.reason)
    const { inspectionHoldIds } = await refundSale(db, actor, {
      receiptId: input.receiptId,
      reason: input.reason,
      heldItemIds,
    })
    return { status: 'refunded' as const, inspectionHoldIds }
  }
)
