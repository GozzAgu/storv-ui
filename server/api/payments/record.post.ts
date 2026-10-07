import { definePaymentsRoute } from '~/server/utils/payments/http'
import { recordManualPayments } from '~/server/utils/payments/service'

/** Record transfer, POS or cash tenders on a sale. Amounts are integer kobo. */
export default definePaymentsRoute(
  { method: 'POST', rateLimit: { id: 'payments:record', limit: 60, windowMs: 60_000 } },
  ({ db, access, input }) =>
    recordManualPayments(db, access, { receiptId: input.receiptId, tenders: input.tenders })
)
