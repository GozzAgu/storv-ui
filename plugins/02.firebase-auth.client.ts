import { getAuth, onAuthStateChanged, type Auth } from 'firebase/auth'
import { useFirebase } from '~/composables/useFirebase'
import { useAuthStore } from '~/stores/auth'
import { watch } from 'vue'
import type { User } from 'firebase/auth'

export default defineNuxtPlugin(() => {
  // Only run on client side
  if (import.meta.server) return

  // Initialize Pinia auth store first - ensure loading starts as true
  const authStore = useAuthStore()
  if (authStore.loading === false) {
    authStore.loading = true
  }

  // Initialize useState (for backward compatibility with old composables)
  const currentUser = useState<User | null>('firebase-auth-user', () => null)
  const loading = useState<boolean>('firebase-auth-loading', () => true)
  
  // Sync Pinia store with useState for backward compatibility
  watch(() => authStore.currentUser, (user) => {
    currentUser.value = user
  }, { immediate: true })
  
  watch(() => authStore.loading, (val) => {
    loading.value = val
  }, { immediate: true })

  // Initialize auth state listener (updates both useState and Pinia store)
  const initializeAuth = () => {
    try {
      const { getApp } = useFirebase()
      const app = getApp()
      
      if (!app) {
        setTimeout(() => {
          const retryApp = getApp()
          if (retryApp) {
            setupAuthListener(getAuth(retryApp))
          } else {
            loading.value = false
            authStore.loading = false
          }
        }, 500)
        return
      }

      const auth = getAuth(app)
      setupAuthListener(auth)
    } catch (error) {
      console.error('Error initializing auth:', error)
      loading.value = false
      authStore.loading = false
    }
  }

  const setupAuthListener = (auth: Auth) => {
    const loadingTimeout = setTimeout(() => {
      if (loading.value) {
        console.warn('[Firebase Auth] Loading timeout - auth state may not be restored')
        loading.value = false
        authStore.loading = false
      }
    }, 8000) // Increased to 8 seconds for cross-domain redirects

    // CRITICAL: onAuthStateChanged automatically restores auth state from Firebase servers
    // This works across domains because Firebase stores auth state on their servers
    // When called on a new domain, it checks with Firebase servers and restores the session
    onAuthStateChanged(auth, async (user) => {
      // Update both useState (for backward compatibility) and Pinia store
      console.log('[Firebase Auth] Auth state changed:', user ? `User: ${user.uid}` : 'No user')
      
      // If user is restored, verify the token is valid
      if (user) {
        try {
          // Force token refresh to ensure it's valid on this domain
          await user.getIdToken(true)
          console.log('[Firebase Auth] Auth token refreshed successfully')
        } catch (error) {
          console.error('[Firebase Auth] Error refreshing token:', error)
        }
      }
      
      currentUser.value = user
      authStore.currentUser = user
      loading.value = false
      authStore.loading = false
      clearTimeout(loadingTimeout)
    }, (error) => {
      console.error('[Firebase Auth] Auth state change error:', error)
      loading.value = false
      authStore.loading = false
      clearTimeout(loadingTimeout)
    })
  }

  // Initialize auth
  initializeAuth()
  
  // Retry after a short delay if Firebase plugin might still be loading
  setTimeout(() => {
    if (loading.value) {
      initializeAuth()
    }
  }, 200)
})

