import { getRouterParam } from 'h3'
import { definePaymentsRoute } from '~/server/utils/payments/http'
import { revokePaymentLink } from '~/server/utils/payments/links'

/** Revoke a link and every copy of it. A link sale with nothing paid is cancelled. */
export default definePaymentsRoute(
  { method: 'POST', rateLimit: { id: 'payments:link-revoke', limit: 30, windowMs: 60_000 } },
  ({ event, db, access, input }) =>
    revokePaymentLink(db, access, { linkId: getRouterParam(event, 'linkId'), reason: input.reason })
)
