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
    // Check if we just signed in and are on app domain
    const isAppDomain = typeof window !== 'undefined' && 
      (window.location.host.startsWith('app.') || window.location.host === 'app.storvv.com')
    const signedInUserId = typeof window !== 'undefined' ? sessionStorage.getItem('signed_in_user_id') : null
    const lastSignInTime = typeof window !== 'undefined' ? sessionStorage.getItem('last_signin_time') : null
    
    // If we just signed in and are on app domain, wait longer for Firebase to restore
    const timeoutDuration = (isAppDomain && signedInUserId && lastSignInTime) ? 15000 : 8000
    
    const loadingTimeout = setTimeout(() => {
      if (loading.value) {
        console.warn('[Firebase Auth] Loading timeout - auth state may not be restored')
        loading.value = false
        authStore.loading = false
      }
    }, timeoutDuration)

    // CRITICAL: onAuthStateChanged automatically restores auth state from Firebase servers
    // This works across domains because Firebase stores auth state on their servers
    // When called on a new domain, it checks with Firebase servers and restores the session
    onAuthStateChanged(auth, async (user) => {
      // Update both useState (for backward compatibility) and Pinia store
      console.log('[Firebase Auth] Auth state changed:', user ? `User: ${user.uid}` : 'No user')
      
      // If no user but we're on app domain and just signed in, Firebase should restore
      // Give Firebase more time to restore the session from servers
      if (!user && typeof window !== 'undefined') {
        const host = window.location.host
        const isAppDomain = host && (host.startsWith('app.') || host === 'app.storvv.com')
        const signedInUserId = sessionStorage.getItem('signed_in_user_id')
        const lastSignInTime = sessionStorage.getItem('last_signin_time')
        
        if (isAppDomain && signedInUserId && lastSignInTime) {
          const timeSinceSignIn = Date.now() - parseInt(lastSignInTime)
          // If we just signed in (within last 10 seconds), Firebase might still be restoring
          if (timeSinceSignIn < 10000) {
            console.log('[Firebase Auth] Recently signed in, waiting for Firebase to restore session from servers...')
            // Don't mark loading as false yet - give Firebase more time
            // The onAuthStateChanged will fire again when Firebase restores the session
            return // Don't update loading state yet
          }
        }
      }
      
      // If user is restored, verify the token is valid and clear temp token
      if (user) {
        try {
          // Force token refresh to ensure it's valid on this domain
          await user.getIdToken(true)
          console.log('[Firebase Auth] Auth token refreshed successfully')
          
          // Clear temporary token storage
          if (typeof window !== 'undefined') {
            sessionStorage.removeItem('auth_token_temp')
            sessionStorage.removeItem('auth_token_time')
          }
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

  // Check for auth token in URL hash (from cross-domain redirect)
  const checkUrlAuthToken = () => {
    if (typeof window === 'undefined') return
    
    const hash = window.location.hash
    if (hash && hash.includes('auth_token=')) {
      const tokenMatch = hash.match(/auth_token=([^&]+)/)
      if (tokenMatch && tokenMatch[1]) {
        const token = tokenMatch[1]
        console.log('[Firebase Auth] Found auth token in URL hash, attempting to restore session')
        
        // Store token temporarily
        sessionStorage.setItem('auth_token_temp', token)
        sessionStorage.setItem('auth_token_time', Date.now().toString())
        
        // Clear hash from URL
        window.history.replaceState(null, '', window.location.pathname + window.location.search)
      }
    }
    
    // Also check sessionStorage for token (from previous page)
    const storedToken = sessionStorage.getItem('auth_token_temp')
    const tokenTime = sessionStorage.getItem('auth_token_time')
    if (storedToken && tokenTime) {
      const age = Date.now() - parseInt(tokenTime)
      // Token is valid for 5 minutes
      if (age < 5 * 60 * 1000) {
        console.log('[Firebase Auth] Found auth token in sessionStorage')
      } else {
        // Token expired, remove it
        sessionStorage.removeItem('auth_token_temp')
        sessionStorage.removeItem('auth_token_time')
      }
    }
  }
  
  // Check for auth token immediately
  checkUrlAuthToken()
  
  // Initialize auth
  initializeAuth()
  
  // Retry after a short delay if Firebase plugin might still be loading
  setTimeout(() => {
    if (loading.value) {
      initializeAuth()
    }
  }, 200)
})

