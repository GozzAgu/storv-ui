import { createError } from 'h3'

const ALLOWED_PROXY_HOSTS = new Set([
  'firebasestorage.googleapis.com',
  'storage.googleapis.com',
  // Store/account logos are uploaded here when Cloudinary env vars are configured (see
  // pages/dashboard/settings.vue's uploadAccountLogoWithFallback) - needed so receipt PDFs
  // (download + email attachment) can embed the logo via the same proxy-fetch path.
  'res.cloudinary.com',
])

function isBlockedHostname(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/^\[/, '').replace(/\]$/, '')
  if (!host || host === 'localhost' || host.endsWith('.localhost')) return true
  if (host === '127.0.0.1' || host === '::1' || host === '0.0.0.0') return true

  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) {
    const [a, b] = host.split('.').map((part) => Number(part))
    if (a === 10) return true
    if (a === 127) return true
    if (a === 0) return true
    if (a === 169 && b === 254) return true
    if (a === 192 && b === 168) return true
    if (a === 172 && b >= 16 && b <= 31) return true
  }

  return false
}

export function assertAllowedProxyUrl(rawUrl: string): URL {
  if (!rawUrl || typeof rawUrl !== 'string') {
    throw createError({ statusCode: 400, message: 'url is required' })
  }

  let parsed: URL
  try {
    parsed = new URL(rawUrl)
  } catch {
    throw createError({ statusCode: 400, message: 'Invalid url' })
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw createError({ statusCode: 400, message: 'Only http(s) URLs are allowed' })
  }
  if (isBlockedHostname(parsed.hostname)) {
    throw createError({ statusCode: 403, message: 'URL host is not allowed' })
  }
  if (!ALLOWED_PROXY_HOSTS.has(parsed.hostname.toLowerCase())) {
    throw createError({ statusCode: 403, message: 'Image host is not on the allowed list' })
  }

  return parsed
}
