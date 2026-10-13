import { defineLoyaltyRoute } from '~/server/utils/loyalty/http'
import { loyaltyRefs } from '~/server/utils/loyalty/sync'
import { readLoyaltySettings } from '~/utils/loyalty'

export default defineLoyaltyRoute(
  { method: 'GET', rateLimit: { id: 'loyalty:read', limit: 120, windowMs: 60_000 } },
  async ({ db, ownerId, isOwner }) => ({
    settings: readLoyaltySettings((await loyaltyRefs(db, ownerId).settings.get()).data()),
    canEdit: isOwner,
  })
)
