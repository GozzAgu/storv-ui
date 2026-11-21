import { createError, defineEventHandler } from 'h3'
import { requireAuth } from '~/server/utils/store-auth'
import {
  assertWhatsAppSendAllowed,
  incrementWhatsAppUsage,
  resolveWhatsAppOwnerId,
} from '~/server/utils/whatsapp-usage'

/**
 * Counts a WhatsApp share opened from the browser (wa.me link) against the business's monthly
 * allowance. Refuses with 429 once it is used up.
 */
export default defineEventHandler(async (event) => {
  const auth = await requireAuth(event)
  const ownerId = await resolveWhatsAppOwnerId(auth.decoded)
  if (!ownerId) throw createError({ statusCode: 403, message: 'No active workspace' })

  const allowance = await assertWhatsAppSendAllowed(ownerId, auth.uid)
  if (allowance.limit < 0) {
    await incrementWhatsAppUsage(ownerId, auth.uid)
    return { success: true, unlimited: true }
  }
  const { count, limit } = await incrementWhatsAppUsage(ownerId, auth.uid)
  return { success: true, count, limit }
})
