/** Every image Storvv uploads is WebP of at most 30 KB. Shared by the client, server and tests. */
export const IMAGE_UPLOAD_MAX_BYTES = 30 * 1024
export const IMAGE_UPLOAD_TYPE = 'image/webp'
export const IMAGE_CACHE_CONTROL = 'public, max-age=31536000, immutable'

/** WebP files start with "RIFF", four size bytes, then "WEBP". */
export function isWebpBytes(bytes: Uint8Array): boolean {
  if (bytes.length < 12) return false
  const ascii = (from: number, to: number) => String.fromCharCode(...bytes.subarray(from, to))
  return ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP'
}
