import { defineLoyaltyRoute, loyaltyDocId } from '~/server/utils/loyalty/http'
import { syncLoyaltyForReceipt } from '~/server/utils/loyalty/sync'

/** Recalculate one sale's points from the stored sale. The caller cannot choose an amount. */
export default defineLoyaltyRoute(
  { method: 'POST', rateLimit: { id: 'loyalty:sync', limit: 120, windowMs: 60_000 } },
  ({ db, auth, ownerId, storeId, input }) =>
    syncLoyaltyForReceipt(db, {
      ownerId,
      storeId,
      receiptId: loyaltyDocId(input.receiptId, 'receiptId'),
      actorUid: auth.uid,
    })
)
