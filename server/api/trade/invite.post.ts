import { defineTradeRoute } from '~/server/utils/trade/http'
import { inviteTradePartner, notifyTradeOwner, tradeLabel } from '~/server/utils/trade/partners'

export default defineTradeRoute(
  {
    method: 'POST',
    rateLimit: { id: 'trade:invite', limit: 20, windowMs: 24 * 60 * 60_000 },
    ownerOnly: true,
    requireVerifiedEmail: true,
  },
  async ({ db, auth, access, input }) => {
    const result = await inviteTradePartner(db, access, input.handle)
    if (result.changed) {
      const who = await tradeLabel(db, access)
      const accepted = result.relation === 'active'
      await notifyTradeOwner(db, result.partnerScope, {
        type: accepted ? 'trade_accepted' : 'trade_invite',
        title: accepted ? 'New trade partner' : 'Partner request',
        message: accepted
          ? `${who} accepted your partner request.`
          : `${who} wants to connect as a trade partner.`,
        actorUid: auth.uid,
        connectionId: result.connectionId,
      })
    }
    return { connectionId: result.connectionId, relation: result.relation, partner: result.partner }
  }
)
