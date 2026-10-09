import { getRouterParam } from 'h3'
import { definePaymentsRoute } from '~/server/utils/payments/http'
import { closeSale } from '~/server/utils/payments/service'

/** Cancel or mark refunded a sale with V2 payments, once no money is held against it. */
export default definePaymentsRoute(
  { method: 'POST', rateLimit: { id: 'payments:close-sale', limit: 30, windowMs: 60_000 } },
  ({ event, db, access, input }) =>
    closeSale(db, access, {
      receiptId: getRouterParam(event, 'receiptId'),
      action: input.action,
      reason: input.reason,
    })
)
