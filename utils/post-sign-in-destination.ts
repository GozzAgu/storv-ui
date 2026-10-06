import type { UserData } from '~/composables/useUser'
import { markOnboardingCompleteForSession } from '~/utils/onboarding-session'

/** Where a freshly signed-in user lands (staff password reset, owner onboarding, or dashboard). */
export function resolvePostSignInDestination(userData: UserData): string {
  if (userData.role === 'staff') {
    return userData.mustChangePassword ? '/dashboard/change-password' : '/dashboard'
  }
  if (!userData.hasCompletedOnboarding) return '/dashboard/onboarding'
  markOnboardingCompleteForSession(userData.uid)
  return '/dashboard'
}
