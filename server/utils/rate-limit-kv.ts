/**
 * Vercel KV-backed rate limiting. Enable by linking a KV store and setting:
 * KV_REST_API_URL, KV_REST_API_TOKEN (auto-injected on Vercel).
 */
export const kv = {
  async checkLimit(key: string, limit: number, windowMs: number): Promise<boolean> {
    const { createClient } = await import('@vercel/kv')
    const client = createClient({
      url: process.env.KV_REST_API_URL!,
      token: process.env.KV_REST_API_TOKEN!,
    })

    const bucket = Math.floor(Date.now() / windowMs)
    const redisKey = `ratelimit:${key}:${bucket}`

    const count = await client.incr(redisKey)
    if (count === 1) {
      await client.expire(redisKey, Math.ceil(windowMs / 1000))
    }

    return count <= limit
  },
}
