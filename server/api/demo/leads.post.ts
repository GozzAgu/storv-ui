import { createError, defineEventHandler, readBody } from 'h3'
import { assertRateLimit } from '~/server/utils/rate-limit'
import { notifyDemoLead } from '~/server/utils/demo-insights'
import { validateDemoLead } from '~/utils/demo-insights'

/**
 * "Book a walkthrough" requests from the demo and the website. Public, so tightly limited.
 * Nothing is stored in Firestore: the request is emailed to the team. If that email can't go
 * out, the visitor is told and pointed to the calendar or WhatsApp, so no request is lost.
 */
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

  const sent = await notifyDemoLead(validated.data, null)
  if (!sent) {
    throw createError({
      statusCode: 503,
      message:
        'We couldn’t send your request just now. Please pick a time on the calendar or message us on WhatsApp.',
    })
  }
  return { success: true }
})
