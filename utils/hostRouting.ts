/**
 * Shared hostname helpers for subdomain routing and invite gate.
 */

export function getHostname(): string {
  if (import.meta.client) {
    return window.location.hostname
  }
  const raw = useRequestHeaders(['host']).host || ''
  return raw.split(':')[0] || ''
}

export function shouldSkipHostRouting(host: string): boolean {
  if (!host) return true
  if (host === 'localhost' || host === '127.0.0.1') return true
  if (host.endsWith('.vercel.app')) return true
  return false
}

export function isMarketingHost(host: string, config: ReturnType<typeof useRuntimeConfig>): boolean {
  const extras = (config.public.marketingHosts as string[] | undefined) || []
  const defaults = ['www.storvv.com', 'storvv.com']
  const allowed = new Set([...defaults, ...extras])
  return allowed.has(host)
}

export function isAppHost(host: string, config: ReturnType<typeof useRuntimeConfig>): boolean {
  const explicit = (config.public.appHost as string | undefined) || 'app.storvv.com'
  return host === explicit || host.startsWith('app.')
}

export function getAppOrigin(config: ReturnType<typeof useRuntimeConfig>): string {
  const fromConfig = String(config.public.appOrigin || '').trim()
  if (fromConfig.startsWith('https://') || fromConfig.startsWith('http://')) {
    return fromConfig.replace(/\/$/, '')
  }
  return 'https://app.storvv.com'
}

/** Paths that stay on the marketing site (www). */
export function isMarketingPath(path: string): boolean {
  const marketingRoutes = ['/', '/privacy', '/terms', '/subscribe']
  return marketingRoutes.includes(path)
}
