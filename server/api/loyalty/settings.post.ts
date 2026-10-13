import { createError } from 'h3'
import { FieldValue } from 'firebase-admin/firestore'
import { defineLoyaltyRoute } from '~/server/utils/loyalty/http'
import { loyaltyRefs } from '~/server/utils/loyalty/sync'
import { LoyaltySettingsError, parseLoyaltySettings } from '~/utils/loyalty'

/** Owner only. New rules apply to sales from now on; points already earned keep their rate. */
export default defineLoyaltyRoute(
  {
    method: 'POST',
    rateLimit: { id: 'loyalty:settings', limit: 20, windowMs: 60_000 },
    ownerOnly: true,
  },
  async ({ db, auth, ownerId, input }) => {
    let settings
    try {
      settings = parseLoyaltySettings(input.settings)
    } catch (err) {
      if (err instanceof LoyaltySettingsError) {
        throw createError({ statusCode: 400, message: err.message })
      }
      throw err
    }
    await loyaltyRefs(db, ownerId).settings.set({
      ...settings,
      updatedBy: auth.uid,
      updatedAt: FieldValue.serverTimestamp(),
    })
    return { settings }
  }
)
