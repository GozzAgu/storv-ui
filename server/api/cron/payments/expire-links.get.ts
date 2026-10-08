import { defineEventHandler } from 'h3'
import { getAdminFirestore } from '~/server/utils/firebase-admin'
import { requireCronAuth } from '~/server/utils/cron-auth'
import { getPaymentsV2Gate } from '~/server/utils/payments/config'
import { expireDueLinks } from '~/server/utils/payments/links'
import { writeCronHeartbeat } from '~/server/utils/payments/cron-heartbeat'

/**
 * Every 15 minutes (Vercel Cron): end links past their expiry and release link-sale holds. Each
 * link is rechecked in its own transaction, so one paid a moment ago is skipped.
 */
export default defineEventHandler(async (event) => {
  requireCronAuth(event)
  const gate = await getPaymentsV2Gate()
  if (!gate.enabled) return { skipped: true }
  const db = getAdminFirestore()
  const result = await expireDueLinks(db)
  await writeCronHeartbeat(db, 'expire-links', result)
  console.info(JSON.stringify({ tag: 'payments-link-expiry', ...result }))
  if (result.failed > 0) {
    console.error(JSON.stringify({ tag: 'payments-alert', alert: 'link-expiry-failures', ...result }))
  }
  return result
})
