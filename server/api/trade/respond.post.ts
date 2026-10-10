import { defineTradeRoute } from '~/server/utils/trade/http'
import {
  isTradeAction,
  notifyTradeOwner,
  respondToConnection,
  TradeError,
  tradeLabel,
} from '~/server/utils/trade/partners'

const ID = /^[A-Za-z0-9_~-]{3,300}$/

export default defineTradeRoute(
  {
    method: 'POST',
    rateLimit: { id: 'trade:respond', limit: 60, windowMs: 10 * 60_000 },
    ownerOnly: true,
  },
  async ({ db, auth, access, input }) => {
    const id = typeof input.connectionId === 'string' ? input.connectionId : ''
    if (!ID.test(id)) throw new TradeError('INVALID_ID', 400, 'connectionId is invalid')
    if (!isTradeAction(input.action)) throw new TradeError('INVALID_ACTION', 400, 'Unknown action')
    const result = await respondToConnection(db, access, id, input.action)
    if (input.action === 'accept' && result.partnerScope) {
      await notifyTradeOwner(db, result.partnerScope, {
        type: 'trade_accepted',
        title: 'New trade partner',
        message: `${await tradeLabel(db, access)} accepted your partner request.`,
        actorUid: auth.uid,
        connectionId: id,
      })
    }
    return { status: result.status }
  }
)
