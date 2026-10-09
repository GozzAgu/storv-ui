import { definePaymentsRoute } from '~/server/utils/payments/http'
import { updatePaymentSettings } from '~/server/utils/payments/settings'

/** Owner: cash confirmation mode and tender → kind mapping. Audit-logged. */
export default definePaymentsRoute(
  { method: 'POST', rateLimit: { id: 'payments:settings', limit: 20, windowMs: 600_000 } },
  async ({ db, access, input }) => ({
    settings: await updatePaymentSettings(db, access, {
      cashConfirmation: input.cashConfirmation,
      tenderKinds: input.tenderKinds,
    }),
  })
)
