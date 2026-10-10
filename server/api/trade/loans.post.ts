import { defineTradeRoute } from '~/server/utils/trade/http'
import { createTradeLoan } from '~/server/utils/trade/loans'

/** Lend serial items to a partner (Enterprise). Any active member, as with Stock loans. */
export default defineTradeRoute(
  {
    method: 'POST',
    rateLimit: { id: 'trade:loan-create', limit: 30, windowMs: 60 * 60_000 },
  },
  async ({ db, auth, access, input }) =>
    createTradeLoan(db, access, auth.uid, {
      to: input.to,
      requestId: input.requestId,
      dueDate: input.dueDate,
      lines: input.lines,
    })
)
