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
        console.warn('Firebase auth loading timeout')
        loading.value = false
        authStore.loading = false
      }
    }, 3000)

    onAuthStateChanged(auth, (user) => {
      // Update both useState (for backward compatibility) and Pinia store
      currentUser.value = user
      authStore.currentUser = user
      loading.value = false
      authStore.loading = false
      clearTimeout(loadingTimeout)
    }, (error) => {
      console.error('Auth state change error:', error)
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

