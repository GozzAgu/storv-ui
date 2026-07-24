import { createError, defineEventHandler, readBody } from 'h3'
import { requireAuth } from '~/server/utils/store-auth'
import { saveTwoFactorSecret } from '~/server/utils/two-factor'
import { assertRateLimit } from '~/server/utils/rate-limit'

interface SetupBody {
  secret?: string
  code?: string
  method?: 'totp' | 'phone'
}

export default defineEventHandler(async (event) => {
  const auth = await requireAuth(event)
  assertRateLimit(event, { id: 'auth-2fa-setup', limit: 10, windowMs: 60_000, uid: auth.uid })

  const body = await readBody<SetupBody>(event)
  const secret = body.secret?.trim()
  const code = body.code?.trim()
  const method = body.method === 'phone' ? 'phone' : 'totp'

  if (method !== 'totp') {
    throw createError({ statusCode: 400, message: 'Only authenticator-app 2FA is supported' })
  }
  if (!secret || secret.length < 16) {
    throw createError({ statusCode: 400, message: 'A valid TOTP secret is required' })
  }
  if (!code || code.length !== 6) {
    throw createError({ statusCode: 400, message: 'A 6-digit verification code is required' })
  }

  const { TOTP } = await import('otpauth')
  const totp = new TOTP({ secret, digits: 6, period: 30, algorithm: 'SHA1' })
  if (totp.validate({ token: code, window: 2 }) === null) {
    throw createError({ statusCode: 400, message: 'Invalid verification code' })
  }

  await saveTwoFactorSecret(auth.uid, secret, 'totp')
  return { success: true }
})
