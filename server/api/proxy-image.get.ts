import { getProxiedImageForUrl, sendProxiedImage } from '~/server/utils/proxyImage'

/**
 * Proxies image requests (GET) so the client can load cross-origin images.
 * Prefer POST for very long URLs (e.g. Firebase); query strings are length-limited.
 */
export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const url = query.url as string
  const { buffer, contentType } = await getProxiedImageForUrl(url)
  return sendProxiedImage(event, buffer, contentType)
})
