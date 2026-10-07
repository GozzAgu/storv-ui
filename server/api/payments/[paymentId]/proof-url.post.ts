import { getRouterParam, setResponseHeader } from 'h3'
import { getAdminStorageBucket } from '~/server/utils/firebase-admin'
import { definePaymentsRoute } from '~/server/utils/payments/http'
import { bucketProofStorage, proofReadUrl } from '~/server/utils/payments/proofs'

/** Five-minute signed URL for a proof file. */
export default definePaymentsRoute(
  { method: 'POST', rateLimit: { id: 'payments:proof-url', limit: 60, windowMs: 60_000 } },
  async ({ event, db, access }) => {
    setResponseHeader(event, 'Cache-Control', 'no-store')
    return proofReadUrl(db, bucketProofStorage(getAdminStorageBucket()), access, {
      paymentId: getRouterParam(event, 'paymentId'),
    })
  }
)
