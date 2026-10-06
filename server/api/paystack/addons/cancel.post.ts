import { createError, defineEventHandler, readBody } from 'h3'
import { getAdminFirestore } from '~/server/utils/firebase-admin'
import { requireAuth, requireFreshTotp } from '~/server/utils/store-auth'
import { resolvePaystackSecretKey } from '~/server/utils/paystack-validation'
import { cancelAddOn, refreshAddOnSummary } from '~/server/utils/subscription-addons'

/** Stop renewing one add-on; it stays usable until the end of its paid month. */
export default defineEventHandler(async (event) => {
  try {
    const auth = await requireAuth(event, { requireVerifiedEmail: true })
    const body = (await readBody(event)) as { addOnId?: string; totpCode?: string }
    await requireFreshTotp(auth, body.totpCode)

    const addOnId = typeof body.addOnId === 'string' ? body.addOnId.trim() : ''
    if (!addOnId) {
      throw createError({ statusCode: 400, message: 'addOnId is required.' })
    }

    const config = useRuntimeConfig()
    const secretKey = resolvePaystackSecretKey(config)
    if (!secretKey) {
      throw createError({ statusCode: 503, message: 'Paystack is not configured.' })
    }

    const adminDb = getAdminFirestore()
    const record = await cancelAddOn(adminDb, secretKey, { userId: auth.uid, addOnId })
    if (!record) {
      throw createError({ statusCode: 404, message: 'Add-on not found.' })
    }
    await refreshAddOnSummary(adminDb, auth.uid)

    return { success: true, endsAt: record.endsAt || null }
  } catch (err: unknown) {
    const e = err as { statusCode?: number; message?: string }
    if (e.statusCode) throw err
    console.error('[paystack/addons/cancel] error:', err)
    throw createError({ statusCode: 500, message: e.message || 'Failed to cancel add-on' })
  }
})
