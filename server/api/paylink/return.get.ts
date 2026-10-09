import { getQuery } from 'h3'
import { readReturnStatus } from '~/server/utils/payments/links'
import { definePublicPayRoute } from '~/server/utils/payments/public-http'

/** Public: status for the page Paystack sends the customer back to (?ref=stvp_...). */
export default definePublicPayRoute(
  { rateLimit: { id: 'paylink:return', limit: 60, windowMs: 60_000 } },
  async ({ event, db }) => readReturnStatus(db, getQuery(event).ref)
)
