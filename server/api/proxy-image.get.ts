/**
 * Proxies image requests so the client can load cross-origin images (e.g. for PDF export).
 * Server-side fetch is not subject to CORS.
 */
export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const url = query.url as string

  if (!url || typeof url !== 'string') {
    throw createError({ statusCode: 400, message: 'url is required' })
  }

  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    throw createError({ statusCode: 400, message: 'Invalid url' })
  }
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw createError({ statusCode: 400, message: 'Only http(s) URLs are allowed' })
  }

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'StorvReceipt/1.0',
    },
  }).catch(() => null)

  if (!response?.ok) {
    throw createError({ statusCode: 502, message: 'Failed to fetch image' })
  }

  const contentType = response.headers.get('content-type') || ''
  if (!contentType.startsWith('image/')) {
    throw createError({ statusCode: 400, message: 'URL did not return an image' })
  }

  const buffer = Buffer.from(await response.arrayBuffer())
  setHeader(event, 'content-type', contentType)
  setHeader(event, 'cache-control', 'private, max-age=3600')
  return buffer
})
