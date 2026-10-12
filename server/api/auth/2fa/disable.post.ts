import { createError, defineEventHandler, readBody } from 'h3'
import { requireAuth, requireFreshTotp } from '~/server/utils/store-auth'
import { clearTwoFactor } from '~/server/utils/two-factor'
import { assertRateLimit } from '~/server/utils/rate-limit'

interface DisableBody {
  code?: string
  totpCode?: string
}

/** The client re-enters the password right before calling, so the sign-in must be this recent. */
const MAX_SIGN_IN_AGE_SECONDS = 5 * 60

export default defineEventHandler(async (event) => {
  // Re-entering the password starts a new sign-in that has not passed 2FA yet; the fresh
  // authenticator code below is this action's second factor.
  const auth = await requireAuth(event, { requireVerifiedEmail: true, allowPendingTwoFactor: true })
  await assertRateLimit(event, {
    id: 'auth-2fa-disable',
    limit: 10,
    windowMs: 60_000,
    uid: auth.uid,
  })

  if (Math.floor(Date.now() / 1000) - auth.authTime > MAX_SIGN_IN_AGE_SECONDS) {
    throw createError({
      statusCode: 401,
      message: 'Please confirm your password again to disable two-factor authentication',
      data: { code: 'RECENT_SIGN_IN_REQUIRED' },
    })
  }

  const body = await readBody<DisableBody>(event)
  const code = body.totpCode?.trim() || body.code?.trim()
  await requireFreshTotp(auth, code)

  await clearTwoFactor(auth.uid)
  return { success: true }
})
