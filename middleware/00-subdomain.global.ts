import {
  getHostname,
  getAppOrigin,
  isAppHost,
  isMarketingHost,
  isMarketingPath,
  shouldSkipHostRouting,
} from '~/utils/hostRouting'

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
