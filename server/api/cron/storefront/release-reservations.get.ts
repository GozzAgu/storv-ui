import { defineEventHandler } from 'h3'
import { getAdminFirestore } from '~/server/utils/firebase-admin'
import { requireCronAuth } from '~/server/utils/cron-auth'
import { releaseExpiredReservations } from '~/server/utils/storefront-reservation'

/**
 * Daily (Vercel Cron): put storefront items whose guest reservation lapsed back on sale.
 * Guests already see a lapsed hold as available; this tidies the stored listing.
 */
export default defineEventHandler(async (event) => {
  requireCronAuth(event)
  const result = await releaseExpiredReservations(getAdminFirestore())
  console.info(JSON.stringify({ tag: 'storefront-reservation-expiry', ...result }))
  if (result.failed > 0) {
    console.error(
      JSON.stringify({ tag: 'storefront-alert', alert: 'reservation-expiry-failures', ...result })
    )
  }
  return result
})
