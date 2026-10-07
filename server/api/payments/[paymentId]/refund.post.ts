import { getRouterParam } from 'h3'
import { definePaymentsRoute } from '~/server/utils/payments/http'
import { refundPayment } from '~/server/utils/payments/service'

/** Records money given back to the customer (manual; Paystack refunds come with Step 4). */
export default definePaymentsRoute(
  { method: 'POST', rateLimit: { id: 'payments:refund', limit: 30, windowMs: 60_000 } },
  async ({ event, db, access, input }) => {
    const res = await refundPayment(db, access, {
      paymentId: getRouterParam(event, 'paymentId'),
      amountKobo: input.amountKobo,
      reason: input.reason,
    })
    const item = res.items[0]!
    return {
      paymentId: item.paymentId,
      status: item.status,
      summary: res.summaries[item.receiptId],
    }
  }
)
