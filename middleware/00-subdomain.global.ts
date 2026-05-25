/**
 * Host-based routing for split marketing (www) vs app (app) on one Vercel deployment.
 * Runs before auth.global.ts (filename order: 00- before auth).
 *
 * - www.* / apex marketing host: only marketing paths; everything else → app subdomain
 * - app.*: `/` → `/dashboard` (auth middleware then handles sign-in)
 *
 * Skipped on localhost and Vercel preview (*.vercel.app) so dev/preview behave normally.
 */
export default defineNuxtRouteMiddleware((to) => {
 const host = getHostname()

 if (shouldSkipHostRouting(host)) {
 return
 }

 const config = useRuntimeConfig()
 const appOrigin = getAppOrigin(config)
 const isApp = isAppHost(host, config)
 const isMarketing = isMarketingHost(host, config)

 // Unknown host (e.g. custom preview): do not force routing
 if (!isMarketing && !isApp) {
 return
 }

 // Marketing host: keep landing + legal (+ subscribe) on www; send app routes to app.*
 if (isMarketing) {
 if (isMarketingPath(to.path)) {
 return
 }
 const target = `${appOrigin}${to.fullPath}`
 return navigateTo(target, { external: true })
 }

 // App host: root should open the product, not the marketing page
 if (isApp && to.path === '/') {
 return navigateTo('/dashboard')
 }
})

function getHostname(): string {
 if (import.meta.client) {
 return window.location.hostname
 }
 const raw = useRequestHeaders(['host']).host || ''
 return raw.split(':')[0] || ''
}

function shouldSkipHostRouting(host: string): boolean {
 if (!host) return true
 if (host === 'localhost' || host === '127.0.0.1') return true
 if (host.endsWith('.vercel.app')) return true
 return false
}

function isMarketingHost(host: string, config: ReturnType<typeof useRuntimeConfig>): boolean {
 const extras = (config.public.marketingHosts as string[] | undefined) || []
 const defaults = ['www.storvv.com', 'storvv.com']
 const allowed = new Set([...defaults, ...extras])
 return allowed.has(host)
}

function isAppHost(host: string, config: ReturnType<typeof useRuntimeConfig>): boolean {
 const explicit = (config.public.appHost as string | undefined) || 'app.storvv.com'
 return host === explicit || host.startsWith('app.')
}

function getAppOrigin(config: ReturnType<typeof useRuntimeConfig>): string {
 const fromConfig = String(config.public.appOrigin || '').trim()
 if (fromConfig.startsWith('https://') || fromConfig.startsWith('http://')) {
 return fromConfig.replace(/\/$/, '')
 }
 return 'https://app.storvv.com'
}

/** Paths that stay on the marketing site (www). */
function isMarketingPath(path: string): boolean {
 const marketingRoutes = ['/', '/privacy', '/terms', '/subscribe']
 return marketingRoutes.includes(path)
}
