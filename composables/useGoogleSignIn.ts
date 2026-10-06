import type { User, UserCredential } from 'firebase/auth'
import { AUTH_UNAVAILABLE_MESSAGE } from '~/utils/cloud-user-messages'
import { getFirebaseClientAuth } from '~/utils/firebase-client-auth'
import {
  consumeGoogleRedirectResult,
  hasPendingGoogleRedirect,
  isGoogleSignInAvailable,
  isGoogleSignInCancelled,
  mapGoogleSignInError,
  signInWithGoogle,
} from '~/utils/google-sign-in'
import { clearSignOutPending } from '~/utils/auth-sign-out'
import { isTwoFactorSessionVerified } from '~/utils/two-factor-session'
import { useFirebaseAuth } from '~/composables/useFirebaseAuth'
import { useProductAnalytics } from '~/composables/useProductAnalytics'
import { useUser } from '~/composables/useUser'
import { useUserStore } from '~/stores/user'

export type GoogleSignInOutcome =
  | { status: 'cancelled' }
  | { status: 'needs-two-factor'; user: User }
  | { status: 'signed-in'; user: User; isNewAccount: boolean }

/**
 * "Continue with Google" for sign-in and sign-up. Existing owners and staff (Firebase links
 * Google to the same account by email) load their workspace; a first-time Google user gets
 * a free Micro owner workspace, just like email sign-up.
 */
export function useGoogleSignIn() {
  const available = ref(false)
  const loading = ref(false)
  const userStore = useUserStore()
  const { signOut } = useFirebaseAuth()
  const { createUserDocument } = useUser()
  const { trackEvent } = useProductAnalytics()

  onMounted(() => {
    available.value = isGoogleSignInAvailable()
  })

  async function createOwnerWorkspace(user: User) {
    const email = (user.email || '').trim().toLowerCase()
    await createUserDocument(user.uid, {
      email,
      name: user.displayName?.trim() || email.split('@')[0] || 'My business',
      role: 'superAdmin',
      subscription: 'storvv_micro',
      hasCompletedOnboarding: false,
      hasCompletedTutorial: false,
      activationFunnel: { signedUpAt: new Date().toISOString() },
    })
    trackEvent('sign_up', { method: 'google' })
  }

  async function openWorkspace(user: User): Promise<GoogleSignInOutcome> {
    await userStore.fetchUserData(user.uid)

    let isNewAccount = false
    if (!userStore.userData) {
      if (userStore.error?.includes('deactivated')) {
        const message = userStore.error
        await signOut().catch(() => {})
        throw new Error(message)
      }
      await createOwnerWorkspace(user)
      await userStore.fetchUserData(user.uid)
      isNewAccount = true
    }

    if (!userStore.userData) {
      const message = userStore.error || 'We could not open your workspace. Please try again.'
      await signOut().catch(() => {})
      throw new Error(message)
    }

    if (userStore.userData.twoFactorEnabled && !isTwoFactorSessionVerified(user.uid)) {
      return { status: 'needs-two-factor', user }
    }

    return { status: 'signed-in', user, isNewAccount }
  }

  async function run(
    getCredential: () => Promise<UserCredential | null>
  ): Promise<GoogleSignInOutcome> {
    const auth = getFirebaseClientAuth()
    if (!auth) throw new Error(AUTH_UNAVAILABLE_MESSAGE)

    loading.value = true
    try {
      clearSignOutPending()
      let credential: UserCredential | null
      try {
        credential = await getCredential()
      } catch (error) {
        if (isGoogleSignInCancelled(error)) return { status: 'cancelled' }
        throw new Error(mapGoogleSignInError(error))
      }
      if (!credential) return { status: 'cancelled' }
      return await openWorkspace(credential.user)
    } finally {
      loading.value = false
    }
  }

  /** Throws a user-facing Error; resolves 'cancelled' when the Google sheet was dismissed. */
  function continueWithGoogle(): Promise<GoogleSignInOutcome> {
    return run(() => signInWithGoogle(getFirebaseClientAuth()!))
  }

  /**
   * Browsers that block popups fall back to a full-page redirect; call on mount to finish it.
   * Resolves null when no Google redirect is pending.
   */
  async function resumeGoogleRedirect(): Promise<GoogleSignInOutcome | null> {
    if (!hasPendingGoogleRedirect()) return null
    return run(() => consumeGoogleRedirectResult(getFirebaseClientAuth()!))
  }

  return { available, loading, continueWithGoogle, resumeGoogleRedirect }
}
