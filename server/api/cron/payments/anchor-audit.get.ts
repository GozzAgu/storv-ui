import { defineEventHandler } from 'h3'
import { getAdminFirestore } from '~/server/utils/firebase-admin'
import { requireCronAuth } from '~/server/utils/cron-auth'
import { getPaymentsV2Gate } from '~/server/utils/payments/config'
import {
  createDailyAnchor,
  utcDateKey,
  verifyStoreAuditChain,
} from '~/server/utils/payments/audit-log'
import { opsAlert, opsAlertDepsFromEnv } from '~/server/utils/payments/ops-alert'
import { sendViaResend } from '~/server/utils/staff-invite-email'

/**
 * Daily (Vercel Cron): verify each store's payment audit chain, then anchor its head.
 * A broken chain is logged as `payments-audit-verify-failed`, alerted to ops once a day per
 * store, and not anchored.
 */
export default defineEventHandler(async (event) => {
  requireCronAuth(event)
  const gate = await getPaymentsV2Gate()
  if (!gate.enabled) return { skipped: true }

  const db = getAdminFirestore()
  const alertDeps = opsAlertDepsFromEnv(sendViaResend)
  const heads = await db.collectionGroup('paymentAudit').get()
  let anchored = 0
  let broken = 0

  for (const head of heads.docs) {
    const parts = head.ref.path.split('/')
    if (head.id !== 'head' || parts.length !== 6 || parts[0] !== 'users' || parts[2] !== 'stores') {
      continue
    }
    const ownerId = parts[1]!
    const storeId = parts[3]!
    const result = await verifyStoreAuditChain(db, ownerId, storeId)
    if (!result.ok) {
      broken += 1
      console.error(
        JSON.stringify({
          tag: 'payments-audit-verify-failed',
          ownerId,
          storeId,
          firstBreak: result.firstBreak,
        })
      )
      await opsAlert(
        db,
        'audit-chain-broken',
        `${ownerId}_${storeId}_${utcDateKey()}`,
        {
          ownerId,
          storeId,
          breakSeq: result.firstBreak.seq,
          breakReason: result.firstBreak.reason,
        },
        alertDeps
      )
      continue
    }
    const { created } = await createDailyAnchor(db, ownerId, storeId)
    if (created) anchored += 1
  }

  return { stores: heads.size, anchored, broken }
})
