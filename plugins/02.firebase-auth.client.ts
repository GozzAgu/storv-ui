import { onAuthStateChanged, type Auth, type User } from 'firebase/auth'
import { watch } from 'vue'
import { useFirebase } from '~/composables/useFirebase'
import { useAuthStore } from '~/stores/auth'
import { getFirebaseClientAuth, isCapacitorNative } from '~/utils/firebase-client-auth'
import { isDemoModeActive } from '~/utils/demo-mode'
import { initDemoAuth } from '~/utils/demo-bridge'
import { useUserStore } from '~/stores/user'

export default defineNuxtPlugin(() => {
  if (import.meta.server) return

  if (isDemoModeActive()) {
    initDemoAuth()
    return
  }

  const AUTH_INIT_TIMEOUT_MS = isCapacitorNative() ? 2500 : 5000
  const authStore = useAuthStore()
  authStore.loading = true

  const currentUser = useState<User | null>('firebase-auth-user', () => null)
  const loading = useState<boolean>('firebase-auth-loading', () => true)

  const setResolved = (user: User | null) => {
    if (isDemoModeActive() && !user) return
    currentUser.value = user
    authStore.currentUser = user
    loading.value = false
    authStore.loading = false

    if (user?.uid) {
      void import('~/utils/user-profile-cache').then(({ hydrateUserStoreFromCache }) => {
        hydrateUserStoreFromCache(useUserStore(), user.uid)
      })
    }
  }

  watch(
    () => authStore.currentUser,
    (user) => {
      currentUser.value = user
    },
    { immediate: true }
  )

  watch(
    () => authStore.loading,
    (val) => {
      loading.value = val
    },
    { immediate: true }
  )

  let listenerAttached = false
  let timeoutId: ReturnType<typeof setTimeout> | null = null

  const clearInitTimeout = () => {
    if (timeoutId) {
      clearTimeout(timeoutId)
      timeoutId = null
    }
  }

  const attachListener = (auth: Auth) => {
    if (listenerAttached) return
    listenerAttached = true

    timeoutId = setTimeout(() => {
      if (loading.value) {
        console.warn('Firebase auth loading timeout')
        setResolved(auth.currentUser ?? null)
      }
    }, AUTH_INIT_TIMEOUT_MS)

    onAuthStateChanged(
      auth,
      (user) => {
        setResolved(user)
        clearInitTimeout()
      },
      (error) => {
        console.error('[Firebase Auth] Auth state change error:', error)
        setResolved(auth.currentUser ?? null)
        clearInitTimeout()
      }
    )

    // Proactively unblock if auth state is already known (common on web; helps some WKWebView cases)
    void auth
      .authStateReady()
      .then(() => {
        if (loading.value) {
          setResolved(auth.currentUser ?? null)
          clearInitTimeout()
        }
      })
      .catch((error) => {
        console.warn('[Firebase Auth] authStateReady failed:', error)
        if (loading.value) {
          setResolved(auth.currentUser ?? null)
          clearInitTimeout()
        }
      })
  }

  const initializeAuth = (attempt = 0) => {
    try {
      const app = useFirebase().getApp()
      if (!app) {
        if (attempt < 10) {
          setTimeout(() => initializeAuth(attempt + 1), 300)
        } else {
          console.error('[Firebase Auth] Firebase app not available after retries')
          setResolved(null)
        }
        return
      }

      const auth = getFirebaseClientAuth()
      if (!auth) {
        setResolved(null)
        return
      }

      attachListener(auth)
    } catch (error) {
      console.error('Error initializing auth:', error)
      setResolved(null)
    }
  }

  initializeAuth()
})
