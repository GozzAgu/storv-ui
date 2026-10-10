import type { TradeOverview } from '~/types/trade'
import { getPaymentsV2Gate } from '~/server/utils/payments/config'
import { defineTradeRoute } from '~/server/utils/trade/http'
import { getTradeProfile, listTradeConnections } from '~/server/utils/trade/partners'
import { tradeLendBlocker } from '~/server/utils/trade/loans'
import { tradeSellBlocker } from '~/server/utils/trade/sales'

export default defineTradeRoute(
  { method: 'GET', rateLimit: { id: 'trade:overview', limit: 120, windowMs: 10 * 60_000 } },
  async ({ db, access }): Promise<TradeOverview> => {
    const [profile, connections, gate, lendBlocker] = await Promise.all([
      getTradeProfile(db, access),
      listTradeConnections(db, access),
      getPaymentsV2Gate(),
      tradeLendBlocker(db, access),
    ])
    return {
      profile,
      connections,
      canManage: access.isOwner,
      canTrade: access.canTrade,
      sellBlocker: await tradeSellBlocker(db, access, access.canTrade, gate.enabled),
      lendBlocker,
    }
  }
)
