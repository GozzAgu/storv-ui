import { createError, getHeader, type H3Event } from 'h3'

interface Bucket {
  count: number
  resetAt: number
}

const buckets = new Map<string, Bucket>()

export interface RateLimitOptions {
  /** Logical scope, e.g. `receipts:send-email` */
  id: string
  limit: number
  windowMs: number
  /** Prefer authenticated uid when available */
  uid?: string
}

function clientKey(event: H3Event, uid?: string): string {
  if (uid) return `uid:${uid}`
  const forwarded = getHeader(event, 'x-forwarded-for')
  const ip = forwarded?.split(',')[0]?.trim() || event.node.req.socket.remoteAddress || 'unknown'
  return `ip:${ip}`
}

export function assertRateLimit(event: H3Event, opts: RateLimitOptions): void {
  const key = `${opts.id}:${clientKey(event, opts.uid)}`
  const now = Date.now()
  const entry = buckets.get(key)

  if (!entry || now > entry.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + opts.windowMs })
    return
  }

  if (entry.count >= opts.limit) {
    throw createError({ statusCode: 429, message: 'Too many requests. Please try again later.' })
  }

  entry.count += 1
}
