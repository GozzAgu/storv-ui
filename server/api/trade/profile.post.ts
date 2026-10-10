import { defineTradeRoute } from '~/server/utils/trade/http'
import { saveTradeProfile } from '~/server/utils/trade/partners'

export default defineTradeRoute(
  {
    method: 'POST',
    rateLimit: { id: 'trade:profile', limit: 10, windowMs: 24 * 60 * 60_000 },
    ownerOnly: true,
    requireVerifiedEmail: true,
  },
  async ({ db, access, input }) => ({
    profile: await saveTradeProfile(db, access, {
      handle: input.handle,
      displayName: input.displayName,
    }),
  })
)
