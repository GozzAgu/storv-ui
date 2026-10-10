import { defineEventHandler } from 'h3'
import { getAdminFirestore } from '~/server/utils/firebase-admin'
import { requireCronAuth } from '~/server/utils/cron-auth'
import { isTradeEnabled } from '~/server/utils/trade/http'
import { remindDueTradeLoans } from '~/server/utils/trade/loans'

/** Daily (Vercel Cron): partner loans due today or overdue remind both businesses. */
export default defineEventHandler(async (event) => {
  requireCronAuth(event)
  if (!isTradeEnabled()) return { skipped: true }
  const result = await remindDueTradeLoans(getAdminFirestore())
  console.info(JSON.stringify({ tag: 'trade-loan-reminders', ...result }))
  if (result.failed > 0) {
    console.error(
      JSON.stringify({ tag: 'trade-alert', alert: 'loan-reminder-failures', ...result })
    )
  }
  return result
})
