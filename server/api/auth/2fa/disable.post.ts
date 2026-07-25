import { createError, defineEventHandler, readBody } from 'h3'
import { requireAuth, requireFreshTotp } from '~/server/utils/store-auth'
import { clearTwoFactor } from '~/server/utils/two-factor'
import { assertRateLimit } from '~/server/utils/rate-limit'

interface DisableBody {
  code?: string
  totpCode?: string
}

export default defineEventHandler(async (event) => {
  const auth = await requireAuth(event, { requireVerifiedEmail: true })
  await assertRateLimit(event, { id: 'auth-2fa-disable', limit: 10, windowMs: 60_000, uid: auth.uid })

  const body = await readBody<DisableBody>(event)
  const code = body.totpCode?.trim() || body.code?.trim()
  await requireFreshTotp(auth, code)

  await clearTwoFactor(auth.uid)
  return { success: true }
})
