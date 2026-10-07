import { defineEventHandler } from 'h3'
import { getAdminFirestore, getAdminStorageBucket } from '~/server/utils/firebase-admin'
import { requireCronAuth } from '~/server/utils/cron-auth'
import { getPaymentsV2Gate } from '~/server/utils/payments/config'
import { bucketProofStorage, runProofRetention } from '~/server/utils/payments/proofs'

/** Daily (Vercel Cron): delete payment proofs 12 months after confirm or reject. */
export default defineEventHandler(async (event) => {
  requireCronAuth(event)
  const gate = await getPaymentsV2Gate()
  if (!gate.enabled) return { skipped: true }
  const result = await runProofRetention(
    getAdminFirestore(),
    bucketProofStorage(getAdminStorageBucket())
  )
  console.info(JSON.stringify({ tag: 'payments-proof-retention', ...result }))
  return result
})
