import { createError, defineEventHandler } from 'h3'
import { requireAuth } from '~/server/utils/store-auth'
import { clearTwoFactor } from '~/server/utils/two-factor'
import { assertRateLimit } from '~/server/utils/rate-limit'

export default defineEventHandler(async (event) => {
  const auth = await requireAuth(event)
  assertRateLimit(event, { id: 'auth-2fa-disable', limit: 10, windowMs: 60_000, uid: auth.uid })

  await clearTwoFactor(auth.uid)
  return { success: true }
})
