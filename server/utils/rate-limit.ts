import { createError, getHeader, type H3Event } from 'h3'

export interface RateLimitOptions {
  /** Logical scope, e.g. `receipts:send-email` */
  id: string
  limit: number
  windowMs: number
  /** Prefer authenticated uid when available */
  uid?: string
  /**
   * Payment and other money routes: in production, refuse (503) instead of falling back to the
   * per-instance memory limiter, which does not hold across serverless instances.
   */
  requireDistributed?: boolean
}

interface Bucket {
  count: number
  resetAt: number
}

const memoryBuckets = new Map<string, Bucket>()

/**
 * Client IP from a header the caller cannot set. On Vercel, `x-vercel-forwarded-for` is written
 * by the platform; a raw `x-forwarded-for` can be supplied by anyone, so it is never used.
 */
export function trustedClientIp(event: H3Event, env: NodeJS.ProcessEnv = process.env): string {
  if (env.VERCEL) {
    const platformIp = getHeader(event, 'x-vercel-forwarded-for')?.split(',')[0]?.trim()
    if (platformIp) return platformIp
  }
  return event.node.req.socket?.remoteAddress || 'unknown'
}

function clientKey(event: H3Event, uid?: string): string {
  if (uid) return `uid:${uid}`
  return `ip:${trustedClientIp(event)}`
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

export function kvConfigured(env: NodeJS.ProcessEnv = process.env): boolean {
  return Boolean(env.KV_REST_API_URL && env.KV_REST_API_TOKEN)
}

function isProduction(env: NodeJS.ProcessEnv = process.env): boolean {
  return env.VERCEL_ENV === 'production' || env.NODE_ENV === 'production'
}

/** Distributed when Vercel KV env is set; otherwise in-memory per instance. */
export async function assertRateLimit(event: H3Event, opts: RateLimitOptions): Promise<void> {
  const key = `${opts.id}:${clientKey(event, opts.uid)}`
  if (kvConfigured()) {
    await assertRateLimitKv(key, opts)
    return
  }
  if (opts.requireDistributed && isProduction()) {
    throw createError({ statusCode: 503, message: 'This service is temporarily unavailable.' })
  }
  assertRateLimitMemory(key, opts)
}
