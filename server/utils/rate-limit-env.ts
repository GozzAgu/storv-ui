export function kvCredentials(
  env: NodeJS.ProcessEnv = process.env
): { url: string; token: string } | null {
  const url = env.KV_REST_API_URL || env.UPSTASH_REDIS_REST_URL
  const token = env.KV_REST_API_TOKEN || env.UPSTASH_REDIS_REST_TOKEN
  return url && token ? { url, token } : null
}
