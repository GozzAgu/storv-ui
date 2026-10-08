import { getRouterParam } from 'h3'
import { tokenHashFromParam } from '~/server/utils/payments/link-token'
import { readPublicLink } from '~/server/utils/payments/links'
import { assertTokenRateLimit, definePublicPayRoute } from '~/server/utils/payments/public-http'

/** Public: what the customer is paying (store, receipt number, amount). Nothing else. */
export default definePublicPayRoute(
  { rateLimit: { id: 'paylink:view', limit: 60, windowMs: 60_000 } },
  async ({ event, db }) => {
    const hash = tokenHashFromParam(getRouterParam(event, 'token'))
    await assertTokenRateLimit(event, hash, { id: 'paylink:view-token', limit: 60, windowMs: 60_000 })
    return readPublicLink(db, hash)
  }
)
