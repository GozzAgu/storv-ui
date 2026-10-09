import { definePaymentsRoute } from '~/server/utils/payments/http'
import { submitTillCount } from '~/server/utils/payments/service'

export default definePaymentsRoute(
  { method: 'POST', rateLimit: { id: 'payments:till-count', limit: 20, windowMs: 600_000 } },
  ({ db, access, input }) =>
    submitTillCount(db, access, {
      businessDate: input.businessDate,
      countedKobo: input.countedKobo,
      confirmIds: input.confirmIds,
      rejectIds: input.rejectIds,
      rejectReason: input.rejectReason,
      note: input.note,
    })
)
