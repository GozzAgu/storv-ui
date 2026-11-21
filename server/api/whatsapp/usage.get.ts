import { createError, defineEventHandler } from 'h3'
import { requireAuth } from '~/server/utils/store-auth'
import { getWhatsAppAllowance, resolveWhatsAppOwnerId } from '~/server/utils/whatsapp-usage'

/** This month's WhatsApp sends for the caller's business (shared by the owner and staff). */
export default defineEventHandler(async (event) => {
  const auth = await requireAuth(event)
  const ownerId = await resolveWhatsAppOwnerId(auth.decoded)
  if (!ownerId) throw createError({ statusCode: 403, message: 'No active workspace' })

  const { count, limit, monthKey, plan } = await getWhatsAppAllowance(ownerId)
  const unlimited = limit < 0
  return {
    count,
    limit: unlimited ? -1 : limit,
    unlimited,
    canSend: unlimited || count < limit,
    remaining: unlimited ? null : Math.max(0, limit - count),
    monthKey,
    plan,
  }
})
