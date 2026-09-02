import { getAuthWaitMs, waitForAuthStore, ensureUserProfileLoaded } from '~/utils/wait-for-auth'
import {
  canAccessDashboardPathByBusinessExperience,
  getRequiredBusinessCapabilityForPath,
  experienceUnavailablePath,
  isBusinessExperienceExemptPath,
  normalizeExperienceGuardPath,
} from '~/utils/business-experience-routes'

/**
 * Page-level business experience guards (Solo progressive unlock).
 * Runs after auth.global.ts; does not replace subscription or role checks.
 */
export default defineNuxtRouteMiddleware(async (to) => {
  if (import.meta.server) return

  const { isDemoRoutePath } = await import('~/utils/demo-mode')
  if (isDemoRoutePath(to.path)) return

  const normalized = normalizeExperienceGuardPath(to.path)
  if (!normalized.startsWith('/dashboard')) return
  if (isBusinessExperienceExemptPath(normalized)) return

  const required = getRequiredBusinessCapabilityForPath(normalized)
  if (!required) return

  const authStore = useAuthStore()
  await waitForAuthStore(authStore, getAuthWaitMs())
  if (!authStore.currentUser) return

  const userStore = useUserStore()
  await ensureUserProfileLoaded(userStore, authStore.currentUser.uid, getAuthWaitMs())
  if (!userStore.userData) return

  if (canAccessDashboardPathByBusinessExperience(normalized, userStore.userData.storeDetails)) {
    return
  }

  return navigateTo(experienceUnavailablePath(required), { replace: true })
})
