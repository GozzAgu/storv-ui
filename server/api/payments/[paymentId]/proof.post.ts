import { getRouterParam } from 'h3'
import { getAdminStorageBucket } from '~/server/utils/firebase-admin'
import { definePaymentsRoute } from '~/server/utils/payments/http'
import { attachProof, bucketProofStorage } from '~/server/utils/payments/proofs'

/** Links an uploaded proof file to the payment after checking the object in Storage. */
export default definePaymentsRoute(
  { method: 'POST', rateLimit: { id: 'payments:proof', limit: 20, windowMs: 60_000 } },
  ({ event, db, access, input }) =>
    attachProof(db, bucketProofStorage(getAdminStorageBucket()), access, {
      paymentId: getRouterParam(event, 'paymentId'),
      fileName: input.fileName,
    })
)
