/**
 * Dev access gate for the app hostname only (e.g. app.storvv.com). Controlled by NUXT_PUBLIC_APP_DEV_GATE.
 * Skipped for localhost, 127.0.0.1, and *.vercel.app (same idea as 00-subdomain.global.ts).
 */

export default defineNuxtRouteMiddleware((to) => {
  const config = useRuntimeConfig()
  if (!config.public.appDevGate) {
    return
  }

  if (import.meta.server) {
    return
  }

  const host = getHostname()
  if (shouldSkipDevGateForHost(host)) {
    return
  }
  if (!isAppHost(host, config)) {
    return
  }

  if (to.path === '/dev-access') {
    return
  }

  const gateCookie = useCookie('storv_app_dev_gate', {
    path: '/',
    sameSite: 'lax',
    secure: import.meta.env.PROD,
  })
  if (gateCookie.value === '1') {
    return
  }

  const redirect = encodeURIComponent(to.fullPath || '/')
  return navigateTo(`/dev-access?redirect=${redirect}`)
})

function getHostname(): string {
  if (import.meta.client) {
    return window.location.hostname
  }
  const raw = useRequestHeaders(['host']).host || ''
  return raw.split(':')[0] || ''
}

function shouldSkipDevGateForHost(host: string): boolean {
  if (!host) return true
  if (host === 'localhost' || host === '127.0.0.1') return true
  if (host.endsWith('.vercel.app')) return true
  return false
}

function isAppHost(host: string, config: ReturnType<typeof useRuntimeConfig>): boolean {
  const explicit = (config.public.appHost as string | undefined) || 'app.storvv.com'
  return host === explicit || host.startsWith('app.')
}
