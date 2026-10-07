import { definePaymentsRoute } from '~/server/utils/payments/http'
import { previewTillDay } from '~/server/utils/payments/service'

/** The day's awaiting cash payments the caller may count (their own entries listed apart). */
export default definePaymentsRoute(
  { method: 'GET', rateLimit: { id: 'payments:till-preview', limit: 60, windowMs: 60_000 } },
  ({ db, access, input }) => previewTillDay(db, access, input.businessDate)
)
