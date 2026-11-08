import { createError, defineEventHandler, readBody } from 'h3'
import { getAdminFirestore } from '~/server/utils/firebase-admin'
import { assertRateLimit } from '~/server/utils/rate-limit'
import { createDemoLead, demoRequestMeta, notifyDemoLead } from '~/server/utils/demo-insights'
import { validateDemoLead } from '~/utils/demo-insights'

/** "Book a walkthrough" requests from the demo and the website. Public, so tightly limited. */
export default defineEventHandler(async (event) => {
  await assertRateLimit(event, { id: 'demo-leads', limit: 5, windowMs: 10 * 60_000 })

  const body = ((await readBody(event).catch(() => null)) || {}) as Record<string, unknown>

  // Hidden field people never see; bots fill it in. Pretend it worked so they don't retry.
  if (typeof body.website === 'string' && body.website.trim()) {
    return { success: true }
  }

  const validated = validateDemoLead(body)
  if (!validated.ok) {
    throw createError({
      statusCode: 400,
      message: validated.message,
      data: { field: validated.field },
    })
  }

  const db = getAdminFirestore()
  const { activity } = await createDemoLead(db, validated.data, demoRequestMeta(event))
  await notifyDemoLead(validated.data, activity)
  return { success: true }
})
