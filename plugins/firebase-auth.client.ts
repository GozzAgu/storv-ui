import { getAuth, onAuthStateChanged, type Auth } from 'firebase/auth'
import { useFirebase } from '~/composables/useFirebase'
import type { User } from 'firebase/auth'

export default defineNuxtPlugin(() => {
  // Only run on client side
  if (import.meta.server) return

  // Initialize shared auth state
  const currentUser = useState<User | null>('firebase-auth-user', () => null)
  const loading = useState<boolean>('firebase-auth-loading', () => true)

  // Initialize auth state listener
  const initializeAuth = () => {
    try {
      const { getApp } = useFirebase()
      const app = getApp()
      
      if (!app) {
        // Firebase app not ready yet, try again in a moment
        setTimeout(() => {
          const retryApp = getApp()
          if (retryApp) {
            setupAuthListener(getAuth(retryApp))
          } else {
            // Still not ready, stop loading anyway
            loading.value = false
          }
        }, 500)
        return
      }

      const auth = getAuth(app)
      setupAuthListener(auth)
    } catch (error) {
      console.error('Error initializing auth:', error)
      loading.value = false
    }
  }

  const setupAuthListener = (auth: Auth) => {
    // Set a timeout to ensure loading always resolves
    const loadingTimeout = setTimeout(() => {
      if (loading.value) {
        console.warn('Firebase auth loading timeout')
        loading.value = false
      }
    }, 3000)

    // Set up auth state listener
    onAuthStateChanged(auth, (user) => {
      currentUser.value = user
      loading.value = false
      clearTimeout(loadingTimeout)
    }, (error) => {
      console.error('Auth state change error:', error)
      loading.value = false
      clearTimeout(loadingTimeout)
    })
  }

  // Initialize auth - try immediately, then retry if needed
  initializeAuth()
  
  // Retry after a short delay if Firebase plugin might still be loading
  setTimeout(() => {
    if (loading.value) {
      initializeAuth()
    }
  }, 200)
})

