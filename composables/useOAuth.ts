/**
 * Composable to detect OAuth authentication providers
 */

import { useAuthStore } from '~/stores/auth'

/**
 * Check if the current user signed in with OAuth (Google, etc.)
 */
export const useOAuth = () => {
  const authStore = useAuthStore()

  /**
   * Check if current user is authenticated via OAuth provider
   * Returns true if user signed in with Google or other OAuth providers
   */
  const isOAuthUser = (): boolean => {
    if (!authStore.currentUser) {
      return false
    }

    // Check providerData to see which providers are linked
    const providerData = authStore.currentUser.providerData || []
    
    // Check if user has any OAuth providers (not email/password)
    const hasOAuthProvider = providerData.some(
      (provider: any) => provider.providerId !== 'password'
    )
    
    // Specifically check for Google provider
    const hasGoogleProvider = providerData.some(
      (provider: any) => provider.providerId === 'google.com'
    )

    return hasOAuthProvider || hasGoogleProvider
  }

  /**
   * Check if user signed in specifically with Google
   */
  const isGoogleUser = (): boolean => {
    if (!authStore.currentUser) {
      return false
    }

    const providerData = authStore.currentUser.providerData || []
    
    return providerData.some(
      (provider: any) => provider.providerId === 'google.com'
    )
  }

  /**
   * Get list of provider IDs for current user
   */
  const getProviders = (): string[] => {
    if (!authStore.currentUser) {
      return []
    }

    const providerData = authStore.currentUser.providerData || []
    return providerData.map((provider: any) => provider.providerId)
  }

  return {
    isOAuthUser,
    isGoogleUser,
    getProviders,
  }
}

