import { definePaymentsRoute } from '~/server/utils/payments/http'
import { listAwaiting } from '~/server/utils/payments/service'

export default definePaymentsRoute(
  { method: 'GET', rateLimit: { id: 'payments:awaiting', limit: 120, windowMs: 60_000 } },
  async ({ db, access }) => ({ payments: await listAwaiting(db, access) })
)
