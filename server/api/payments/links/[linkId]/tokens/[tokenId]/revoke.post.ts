import { getRouterParam } from 'h3'
import { definePaymentsRoute } from '~/server/utils/payments/http'
import { revokeLinkToken } from '~/server/utils/payments/links'

/** Revoke one shared copy of a link; the link and its other copies keep working. */
export default definePaymentsRoute(
  { method: 'POST', rateLimit: { id: 'payments:link-token-revoke', limit: 30, windowMs: 60_000 } },
  async ({ event, db, access }) => {
    await revokeLinkToken(db, access, {
      linkId: getRouterParam(event, 'linkId'),
      tokenId: getRouterParam(event, 'tokenId'),
    })
    return { ok: true }
  }
)
