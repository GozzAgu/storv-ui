import { createError } from 'h3'
import { resolveFirebaseStorageBucket } from '~/utils/firebase-storage-bucket'

/** Our own storage locations; a host whose value is missing is refused outright. */
export interface ProxyImageAllowConfig {
  storageBucket: string
  cloudinaryCloudName: string
}

/**
 * Firebase Storage bucket and Cloudinary cloud from runtime config (the same values the client
 * uploads with). Store/account logos go to Cloudinary when it is configured (see
 * pages/dashboard/settings.vue's uploadAccountLogoWithFallback), so receipt PDFs can embed them.
 */
export function proxyImageAllowConfig(): ProxyImageAllowConfig {
  const pub = (useRuntimeConfig().public || {}) as {
    firebase?: { projectId?: string; storageBucket?: string }
    cloudinaryCloudName?: string
  }
  return {
    storageBucket: resolveFirebaseStorageBucket(
      pub.firebase?.projectId || '',
      pub.firebase?.storageBucket || ''
    ).replace(/^gs:\/\//, ''),
    cloudinaryCloudName: String(pub.cloudinaryCloudName || '').trim(),
  }
}

/** Path prefix each allowed host must serve from, or null when we have no value for it. */
function allowedPathPrefix(hostname: string, allow: ProxyImageAllowConfig): string | null {
  const bucket = allow.storageBucket.trim()
  const cloud = allow.cloudinaryCloudName.trim()
  switch (hostname) {
    case 'firebasestorage.googleapis.com':
      return bucket ? `/v0/b/${encodeURIComponent(bucket)}/` : null
    case 'storage.googleapis.com':
      return bucket ? `/${encodeURIComponent(bucket)}/` : null
    case 'res.cloudinary.com':
      return cloud ? `/${encodeURIComponent(cloud)}/image/upload/` : null
    default:
      return null
  }
}

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

export function assertAllowedProxyUrl(
  rawUrl: string,
  allow: ProxyImageAllowConfig = proxyImageAllowConfig()
): URL {
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
  if (parsed.username || parsed.password) {
    throw createError({ statusCode: 400, message: 'Invalid url' })
  }
  if (isBlockedHostname(parsed.hostname)) {
    throw createError({ statusCode: 403, message: 'URL host is not allowed' })
  }
  const prefix = allowedPathPrefix(parsed.hostname.toLowerCase(), allow)
  if (!prefix) {
    throw createError({ statusCode: 403, message: 'Image host is not on the allowed list' })
  }
  // `new URL` has already resolved dot segments, so the prefix cannot be escaped with `../`.
  if (!parsed.pathname.startsWith(prefix)) {
    throw createError({ statusCode: 403, message: 'Image path is not on the allowed list' })
  }

  return parsed
}
