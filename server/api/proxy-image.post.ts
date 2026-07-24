import { createError, readBody } from 'h3'
import { getProxiedImageForUrl, sendProxiedImage } from '~/server/utils/proxyImage'
import { requireAuth } from '~/server/utils/store-auth'

/**
 * Same as GET /api/proxy-image but with URL in the body.
 * Use for long signed URLs (Firebase, etc.); long query strings are often truncated.
 */
export default defineEventHandler(async (event) => {
  await requireAuth(event)
  const body = await readBody(event).catch(() => ({} as { url?: string }))
  const url = body?.url
  if (typeof url !== 'string') {
    throw createError({ statusCode: 400, message: 'url is required in JSON body' })
  }
  const { buffer, contentType } = await getProxiedImageForUrl(url)
  return sendProxiedImage(event, buffer, contentType)
})
