import { getAuth, onAuthStateChanged, setPersistence, browserLocalPersistence, type Auth } from 'firebase/auth'
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
  const initializeAuth = async () => {
    try {
      const { getApp } = useFirebase()
      const app = getApp()
      
      if (!app) {
        setTimeout(() => {
          initializeAuth()
        }, 500)
        return
      }

      const auth = getAuth(app)
      
      // CRITICAL: Set persistence to LOCAL to ensure auth state persists across page reloads
      // This is especially important for cross-domain redirects
      // Note: Firebase Auth should automatically restore sessions from servers across subdomains
      // if authDomain is configured correctly in Firebase Console
      try {
        await setPersistence(auth, browserLocalPersistence)
        console.log('[Firebase Auth] Persistence set to LOCAL')
      } catch (error) {
        console.warn('[Firebase Auth] Error setting persistence:', error)
        // Continue anyway - default is usually LOCAL
      }
      
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
    }, 5000)

    onAuthStateChanged(auth, (user) => {
      // Update both useState (for backward compatibility) and Pinia store
      console.log('[Firebase Auth] Auth state changed:', user ? `User: ${user.uid}` : 'No user')
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

