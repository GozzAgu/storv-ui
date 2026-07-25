import { createError, getHeader, type H3Event } from 'h3'

export interface RateLimitOptions {
  /** Logical scope, e.g. `receipts:send-email` */
  id: string
  limit: number
  windowMs: number
  /** Prefer authenticated uid when available */
  uid?: string
}

interface Bucket {
  count: number
  resetAt: number
}

const memoryBuckets = new Map<string, Bucket>()

function clientKey(event: H3Event, uid?: string): string {
  if (uid) return `uid:${uid}`
  const forwarded = getHeader(event, 'x-forwarded-for')
  const ip = forwarded?.split(',')[0]?.trim() || event.node.req.socket.remoteAddress || 'unknown'
  return `ip:${ip}`
}

function assertRateLimitMemory(key: string, opts: RateLimitOptions): void {
  const now = Date.now()
  const entry = memoryBuckets.get(key)

  if (!entry || now > entry.resetAt) {
    memoryBuckets.set(key, { count: 1, resetAt: now + opts.windowMs })
    return
  }

  if (entry.count >= opts.limit) {
    throw createError({ statusCode: 429, message: 'Too many requests. Please try again later.' })
  }

  entry.count += 1
}

async function assertRateLimitKv(key: string, opts: RateLimitOptions): Promise<void> {
  const { kv } = await import('./rate-limit-kv')
  const allowed = await kv.checkLimit(key, opts.limit, opts.windowMs)
  if (!allowed) {
    throw createError({ statusCode: 429, message: 'Too many requests. Please try again later.' })
  }
}

function kvConfigured(): boolean {
  return Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN)
}

/** Distributed when Vercel KV env is set; otherwise in-memory per instance. */
export async function assertRateLimit(event: H3Event, opts: RateLimitOptions): Promise<void> {
  const key = `${opts.id}:${clientKey(event, opts.uid)}`
  if (kvConfigured()) {
    await assertRateLimitKv(key, opts)
    return
  }
  assertRateLimitMemory(key, opts)
}
