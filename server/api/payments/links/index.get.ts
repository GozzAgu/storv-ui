import { definePaymentsRoute } from '~/server/utils/payments/http'
import { listReceiptLinks } from '~/server/utils/payments/links'

/** Payment links on one sale, with each shared copy (no tokens). */
export default definePaymentsRoute(
  { method: 'GET', rateLimit: { id: 'payments:link-list', limit: 120, windowMs: 60_000 } },
  ({ db, access, input }) => listReceiptLinks(db, access, { receiptId: input.receiptId })
)
