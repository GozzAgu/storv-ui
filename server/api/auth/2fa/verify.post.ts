import { createError, defineEventHandler, readBody } from 'h3'
import { requireAuth } from '~/server/utils/store-auth'
import { verifyTotpCode } from '~/server/utils/two-factor'
import { assertRateLimit } from '~/server/utils/rate-limit'

interface VerifyBody {
  code?: string
}

export default defineEventHandler(async (event) => {
  const auth = await requireAuth(event)
  assertRateLimit(event, { id: 'auth-2fa-verify', limit: 20, windowMs: 60_000, uid: auth.uid })

  const body = await readBody<VerifyBody>(event)
  const code = body.code?.trim()
  if (!code || code.length !== 6) {
    throw createError({ statusCode: 400, message: 'A 6-digit verification code is required' })
  }

  const valid = await verifyTotpCode(auth.uid, code)
  if (!valid) {
    throw createError({ statusCode: 401, message: 'Invalid verification code' })
  }

  return { success: true }
})
