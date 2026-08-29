import {
  buildBusinessCapabilityContext,
  canUseBusinessCapability,
  type BusinessCapability,
  type BusinessExperienceConfig,
} from '~/types/business-experience'
import { isDepartmentsAreaPath } from '~/utils/department-routes'

/** Paths always reachable regardless of business experience gates. */
export const BUSINESS_EXPERIENCE_EXEMPT_PATHS = [
  '/dashboard/settings',
  '/dashboard/experience-unavailable',
  '/dashboard/onboarding',
  '/dashboard/verify-email',
  '/dashboard/change-password',
  '/dashboard/help',
  '/dashboard/profile',
] as const

export function normalizeExperienceGuardPath(path: string): string {
  return path.replace(/^\/demo(?=\/)/, '')
}

export function isBusinessExperienceExemptPath(path: string): boolean {
  const normalized = normalizeExperienceGuardPath(path)
  return BUSINESS_EXPERIENCE_EXEMPT_PATHS.some(
    (exempt) => normalized === exempt || normalized.startsWith(`${exempt}/`)
  )
}

/** Required capability for a dashboard path, or null when unguarded. */
export function getRequiredBusinessCapabilityForPath(path: string): BusinessCapability | null {
  const normalized = normalizeExperienceGuardPath(path)

  if (isDepartmentsAreaPath(normalized)) {
    return 'staffManagement'
  }

  if (
    normalized === '/dashboard/multi-store-sync' ||
    normalized.startsWith('/dashboard/multi-store-sync/')
  ) {
    return 'multiLocationAdmin'
  }

  if (
    normalized === '/dashboard/payment-links' ||
    normalized.startsWith('/dashboard/payment-links/')
  ) {
    return 'paymentLinks'
  }

  return null
}

export function canAccessDashboardPathByBusinessExperience(
  path: string,
  config?: BusinessExperienceConfig | null
): boolean {
  const required = getRequiredBusinessCapabilityForPath(path)
  if (!required) return true
  if (isBusinessExperienceExemptPath(path)) return true
  return canUseBusinessCapability(required, buildBusinessCapabilityContext(config))
}

export function experienceUnavailablePath(capability: BusinessCapability): string {
  return `/dashboard/experience-unavailable?capability=${encodeURIComponent(capability)}`
}
