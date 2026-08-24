/** Dashboard paths reachable before onboarding is complete. */
export const ONBOARDING_EXEMPT_DASHBOARD_PATHS = [
  '/dashboard/onboarding',
  '/dashboard/verify-email',
  '/dashboard/change-password',
] as const

export function isOnboardingExemptDashboardPath(path: string): boolean {
  return ONBOARDING_EXEMPT_DASHBOARD_PATHS.some(
    (exempt) => path === exempt || path.startsWith(`${exempt}/`)
  )
}
