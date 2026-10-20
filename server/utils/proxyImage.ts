import { createError, setHeader, type H3Event } from 'h3'
import { assertAllowedProxyUrl } from '~/server/utils/proxy-image-url'

function sniffImageMime(buffer: Buffer): string | null {
  if (buffer.length < 12) {
    return null
  }
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg'
  }
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
    return 'image/png'
  }
  if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) {
    return 'image/gif'
  }
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return 'image/webp'
  }
  return null
}

/** Largest image the proxy will pass through; logos and product photos are far smaller. */
export const PROXY_IMAGE_MAX_BYTES = 2 * 1024 * 1024
const PROXY_IMAGE_TIMEOUT_MS = 5000

function tooLarge() {
  return createError({ statusCode: 413, message: 'Image is too large' })
}

/** Reads the body but stops (and cancels the download) once it passes `maxBytes`. */
export async function readBodyWithLimit(response: Response, maxBytes: number): Promise<Buffer> {
  if (!response.body) return Buffer.alloc(0)
  const reader = response.body.getReader()
  const chunks: Uint8Array[] = []
  let total = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    total += value.byteLength
    if (total > maxBytes) {
      await reader.cancel().catch(() => undefined)
      throw tooLarge()
    }
    chunks.push(value)
  }
  return Buffer.concat(chunks, total)
}

/**
 * Validates URL and fetches image bytes. Used by GET and POST /api/proxy-image.
 * Long URLs (e.g. Firebase with tokens) must use POST; GET query strings are often limited.
 * Redirects are refused (a redirect could leave the allowed hosts), as are slow or large responses.
 */
export async function getProxiedImageForUrl(
  url: string
): Promise<{ buffer: Buffer; contentType: string }> {
  assertAllowedProxyUrl(url)

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'StorvReceipt/1.0',
    },
    redirect: 'manual',
    signal: AbortSignal.timeout(PROXY_IMAGE_TIMEOUT_MS),
  }).catch(() => null)

  // With `redirect: 'manual'` a 3xx comes back as-is (not ok), so it fails here unfollowed.
  if (!response?.ok) {
    throw createError({ statusCode: 502, message: 'Failed to fetch image' })
  }

  const declaredLength = Number(response.headers.get('content-length'))
  if (Number.isFinite(declaredLength) && declaredLength > PROXY_IMAGE_MAX_BYTES) {
    await response.body?.cancel().catch(() => undefined)
    throw tooLarge()
  }

  const buffer = await readBodyWithLimit(response, PROXY_IMAGE_MAX_BYTES).catch((err) => {
    if ((err as { statusCode?: number })?.statusCode === 413) throw err
    throw createError({ statusCode: 502, message: 'Failed to fetch image' })
  })
  const contentTypeHeader = (response.headers.get('content-type') || '').split(';').shift() ?? ''
  let contentType = contentTypeHeader.trim().toLowerCase()
  if (!contentType.startsWith('image/')) {
    const sniffed = sniffImageMime(buffer)
    if (sniffed) {
      contentType = sniffed
    } else {
      throw createError({ statusCode: 400, message: 'URL did not return an image' })
    }
  }

  return { buffer, contentType }
}

export function sendProxiedImage(event: H3Event, buffer: Buffer, contentType: string) {
  setHeader(event, 'content-type', contentType)
  setHeader(event, 'cache-control', 'private, max-age=3600')
  return buffer
}
