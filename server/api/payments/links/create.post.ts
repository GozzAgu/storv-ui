import { setHeader } from 'h3'
import { definePaymentsRoute } from '~/server/utils/payments/http'
import { createPaymentLink } from '~/server/utils/payments/links'

/** Create a payment link on a sale. Amount (kobo) defaults to what the sale has left to pay. */
export default definePaymentsRoute(
  { method: 'POST', rateLimit: { id: 'payments:link-create', limit: 30, windowMs: 60_000 } },
  async ({ event, db, access, input }) => {
    setHeader(event, 'Cache-Control', 'no-store')
    return createPaymentLink(
      db,
      access,
      {
        receiptId: input.receiptId,
        amountKobo: input.amountKobo,
        expiresInHours: input.expiresInHours,
      },
      { env: process.env, appOrigin: useRuntimeConfig().public.appOrigin }
    )
  }
)
