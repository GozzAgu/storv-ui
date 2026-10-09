import { getRouterParam, setHeader } from 'h3'
import { definePaymentsRoute } from '~/server/utils/payments/http'
import { issueLinkToken } from '~/server/utils/payments/links'

/** "Copy again": a new URL for the same link, revocable on its own. */
export default definePaymentsRoute(
  { method: 'POST', rateLimit: { id: 'payments:link-share', limit: 30, windowMs: 60_000 } },
  async ({ event, db, access }) => {
    setHeader(event, 'Cache-Control', 'no-store')
    return issueLinkToken(
      db,
      access,
      { linkId: getRouterParam(event, 'linkId') },
      { appOrigin: useRuntimeConfig().public.appOrigin }
    )
  }
)
