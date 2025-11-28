import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  type User,
  type Auth
} from 'firebase/auth'
import { useFirebase } from './useFirebase'

/**
 * Composable for Firebase Authentication
 */
export const useFirebaseAuth = () => {
  const { getApp } = useFirebase()
  
  // Get Auth instance
  const getAuthInstance = (): Auth | null => {
    if (import.meta.server) return null
    
    const app = getApp()
    if (!app) {
      console.warn('Firebase app not initialized')
      return null
    }
    
    return getAuth(app)
  }

  // Use shared state (initialized by plugin)
  const currentUser = useState<User | null>('firebase-auth-user', () => null)
  const loading = useState<boolean>('firebase-auth-loading', () => false)
  
  // On server-side, loading should be false
  if (import.meta.server) {
    loading.value = false
  }

  // Sign in with email and password
  const signIn = async (email: string, password: string) => {
    const auth = getAuthInstance()
    if (!auth) {
      throw new Error('Firebase Auth not initialized')
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      return userCredential.user
    } catch (error: any) {
      throw new Error(error.message || 'Sign in failed')
    }
  }

  // Sign up with email and password
  const signUp = async (email: string, password: string) => {
    const auth = getAuthInstance()
    if (!auth) {
      throw new Error('Firebase Auth not initialized')
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      return userCredential.user
    } catch (error: any) {
      throw new Error(error.message || 'Sign up failed')
    }
  }

  // Sign out
  const signOut = async () => {
    const auth = getAuthInstance()
    if (!auth) {
      throw new Error('Firebase Auth not initialized')
    }

    try {
      await firebaseSignOut(auth)
    } catch (error: any) {
      throw new Error(error.message || 'Sign out failed')
    }
  }

  // Send password reset email
  const resetPassword = async (email: string) => {
    const auth = getAuthInstance()
    if (!auth) {
      throw new Error('Firebase Auth not initialized')
    }

    try {
      await sendPasswordResetEmail(auth, email)
    } catch (error: any) {
      throw new Error(error.message || 'Password reset failed')
    }
  }

  // Sign in with Google (using popup method - more reliable)
  const signInWithGoogle = async () => {
    const auth = getAuthInstance()
    if (!auth) {
      throw new Error('Firebase Auth not initialized')
    }

    try {
      const provider = new GoogleAuthProvider()
      // Add scopes if needed
      provider.addScope('profile')
      provider.addScope('email')
      
      // Use popup method (more reliable, avoids sessionStorage issues)
      // Note: COOP warnings in console are harmless and can be ignored
      const result = await signInWithPopup(auth, provider)
      return result.user
    } catch (error: any) {
      // Handle popup closed by user
      if (error.code === 'auth/popup-closed-by-user') {
        throw new Error('Sign in was cancelled')
      }
      // Handle account exists with different credential
      if (error.code === 'auth/account-exists-with-different-credential') {
        throw new Error('An account already exists with this email. Please sign in with your email and password instead.')
      }
      // Handle popup blocked
      if (error.code === 'auth/popup-blocked') {
        throw new Error('Pop-up was blocked by your browser. Please allow pop-ups for this site.')
      }
      // Handle network errors
      if (error.code === 'auth/network-request-failed') {
        throw new Error('Network error. Please check your internet connection and try again.')
      }
      // Handle missing permissions (Firestore)
      if (error.code === 'permission-denied' || error.message?.includes('permission')) {
        throw new Error('Permission denied. Please check your Firestore security rules. See FIRESTORE_SETUP.md for setup instructions.')
      }
      throw new Error(error.message || 'Google sign in failed')
    }
  }

  return {
    currentUser: readonly(currentUser),
    loading: readonly(loading),
    signIn,
    signUp,
    signOut,
    resetPassword,
    signInWithGoogle,
    getAuthInstance
  }
}

