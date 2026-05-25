import { createError, setHeader, type H3Event } from 'h3'

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

/**
 * Validates URL and fetches image bytes. Used by GET and POST /api/proxy-image.
 * Long URLs (e.g. Firebase with tokens) must use POST; GET query strings are often limited.
 */
export async function getProxiedImageForUrl(
 url: string
): Promise<{ buffer: Buffer; contentType: string }> {
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

 const buffer = Buffer.from(await response.arrayBuffer())
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
