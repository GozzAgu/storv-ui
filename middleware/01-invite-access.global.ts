import { readInviteAccessFromStorage } from '~/composables/useInviteAccess'
import { getHostname, isMarketingHost, shouldSkipHostRouting } from '~/utils/hostRouting'

/**
 * Invitation-only gate for the app deployment (app.* and non-marketing hosts).
 * Disabled when INVITE_ACCESS_CODE is unset at build time (see nuxt.config).
 *
 * Skipped on localhost / Vercel preview (same as subdomain middleware) and on the public marketing host.
 */
export default defineNuxtRouteMiddleware((to) => {
  if (import.meta.server) return

  const config = useRuntimeConfig()
  if (!config.public.inviteGateEnabled) return

  const host = getHostname()
  if (shouldSkipHostRouting(host)) return

  if (isMarketingHost(host, config)) return

  const allowedPaths = ['/access', '/privacy', '/terms']
  if (allowedPaths.includes(to.path)) return

  if (readInviteAccessFromStorage()) return

  const q = to.fullPath && to.fullPath !== '/access' ? `?redirect=${encodeURIComponent(to.fullPath)}` : ''
  return navigateTo(`/access${q}`)
})
