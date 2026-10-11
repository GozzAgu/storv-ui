import { kvCredentials } from './rate-limit-env'

/**
 * Redis-backed rate limiting over the Upstash REST API. Enable by connecting Upstash for Redis
 * on Vercel, which sets KV_REST_API_URL/KV_REST_API_TOKEN or UPSTASH_REDIS_REST_URL/_TOKEN.
 */
export const kv = {
  async checkLimit(key: string, limit: number, windowMs: number): Promise<boolean> {
    const { createClient } = await import('@vercel/kv')
    const { url, token } = kvCredentials()!
    const client = createClient({ url, token })

    const bucket = Math.floor(Date.now() / windowMs)
    const redisKey = `ratelimit:${key}:${bucket}`

    const count = await client.incr(redisKey)
    if (count === 1) {
      await client.expire(redisKey, Math.ceil(windowMs / 1000))
    }

    return count <= limit
  },
}
