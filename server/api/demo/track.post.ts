import { createError, defineEventHandler, readBody, setResponseStatus } from 'h3'
import { getAdminFirestore } from '~/server/utils/firebase-admin'
import { assertRateLimit } from '~/server/utils/rate-limit'
import { demoRequestMeta, recordDemoActivity } from '~/server/utils/demo-insights'
import { logServerError } from '~/server/utils/log-server-error'
import { validateDemoTrackBatch } from '~/utils/demo-insights'

/**
 * Anonymous demo activity: pages seen, time on them and named actions. No personal data.
 * Sent with navigator.sendBeacon when the tab hides, so it answers 204 and never fails loudly.
 */
export default defineEventHandler(async (event) => {
  await assertRateLimit(event, { id: 'demo-track', limit: 40, windowMs: 60_000 })

  let body: unknown = await readBody(event).catch(() => null)
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body)
    } catch {
      body = null
    }
  }
  const batch = validateDemoTrackBatch(body)
  if (!batch) throw createError({ statusCode: 400, message: 'Invalid activity' })

  try {
    await recordDemoActivity(getAdminFirestore(), batch, demoRequestMeta(event))
  } catch (error) {
    const status = (error as { statusCode?: number })?.statusCode
    if (status === 409) throw error
    logServerError('demo-track', error)
  }
  setResponseStatus(event, 204)
  return null
})
