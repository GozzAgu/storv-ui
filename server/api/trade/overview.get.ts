import type { TradeOverview } from '~/types/trade'
import { defineTradeRoute } from '~/server/utils/trade/http'
import { getTradeProfile, listTradeConnections } from '~/server/utils/trade/partners'

export default defineTradeRoute(
  { method: 'GET', rateLimit: { id: 'trade:overview', limit: 120, windowMs: 10 * 60_000 } },
  async ({ db, access }): Promise<TradeOverview> => {
    const [profile, connections] = await Promise.all([
      getTradeProfile(db, access),
      listTradeConnections(db, access),
    ])
    return { profile, connections, canManage: access.isOwner }
  }
)
