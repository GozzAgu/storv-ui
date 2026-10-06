import {
  browserPopupRedirectResolver,
  getRedirectResult,
  GoogleAuthProvider,
  signInWithCredential,
  signInWithPopup,
  signInWithRedirect,
  type Auth,
  type UserCredential,
} from 'firebase/auth'
import { isCapacitorNative } from '~/utils/capacitor-env'

type GoogleClientIds = { webClientId: string; iosClientId: string }

let nativeInitialized = false

function readClientIds(): GoogleClientIds {
  const config = useRuntimeConfig().public
  return {
    webClientId: String(config.googleWebClientId || '').trim(),
    iosClientId: String(config.googleIosClientId || '').trim(),
  }
}

/**
 * Web always works once Google is enabled in Firebase Auth. iOS needs the iOS client ID,
 * because Google Sign-In aborts the app when its URL scheme is not configured.
 */
export function isGoogleSignInAvailable(): boolean {
  if (import.meta.server) return false
  if (!isCapacitorNative()) return true
  return Boolean(readClientIds().iosClientId)
}

const CANCEL_CODES = new Set(['auth/popup-closed-by-user', 'auth/cancelled-popup-request'])

/** True when the person closed the Google sheet/popup; callers should stay quiet. */
export function isGoogleSignInCancelled(error: unknown): boolean {
  const code = (error as { code?: string })?.code || ''
  if (CANCEL_CODES.has(code)) return true
  const message = (error as Error)?.message?.toLowerCase() || ''
  return message.includes('cancel')
}

async function signInNative(auth: Auth): Promise<UserCredential> {
  const { SocialLogin } = await import('@capgo/capacitor-social-login')
  const { webClientId, iosClientId } = readClientIds()
  if (!nativeInitialized) {
    await SocialLogin.initialize({
      google: {
        iOSClientId: iosClientId,
        ...(webClientId ? { iOSServerClientId: webClientId, webClientId } : {}),
        mode: 'online',
      },
    })
    nativeInitialized = true
  }

  const login = await SocialLogin.login({
    provider: 'google',
    options: { scopes: ['email', 'profile'] },
  })
  const idToken = (login.result as { idToken?: string | null } | undefined)?.idToken
  if (!idToken) {
    throw new Error('Google did not return a sign-in token. Please try again.')
  }
  return signInWithCredential(auth, GoogleAuthProvider.credential(idToken))
}

const REDIRECT_PENDING_KEY = 'storv_google_redirect_pending'

/** Popups are blocked or unsupported (many mobile and in-app browsers): use a full-page redirect. */
const REDIRECT_FALLBACK_CODES = new Set([
  'auth/popup-blocked',
  'auth/operation-not-supported-in-this-environment',
])

function markRedirectPending(pending: boolean) {
  try {
    if (pending) sessionStorage.setItem(REDIRECT_PENDING_KEY, '1')
    else sessionStorage.removeItem(REDIRECT_PENDING_KEY)
  } catch {
    /* private mode / blocked storage */
  }
}

/** True after returning from Google's redirect page, until the result is consumed. */
export function hasPendingGoogleRedirect(): boolean {
  if (import.meta.server) return false
  try {
    return sessionStorage.getItem(REDIRECT_PENDING_KEY) === '1'
  } catch {
    return false
  }
}

async function signInWeb(auth: Auth): Promise<UserCredential> {
  const provider = new GoogleAuthProvider()
  provider.setCustomParameters({ prompt: 'select_account' })
  try {
    // Auth is created with initializeAuth (no default resolver), so the resolver is passed here.
    return await signInWithPopup(auth, provider, browserPopupRedirectResolver)
  } catch (error) {
    if (!REDIRECT_FALLBACK_CODES.has((error as { code?: string })?.code || '')) throw error
    markRedirectPending(true)
    try {
      return await signInWithRedirect(auth, provider, browserPopupRedirectResolver)
    } catch (redirectError) {
      markRedirectPending(false)
      throw redirectError
    }
  }
}

export async function signInWithGoogle(auth: Auth): Promise<UserCredential> {
  return isCapacitorNative() ? signInNative(auth) : signInWeb(auth)
}

/** Finishes a redirect sign-in started by `signInWithGoogle`; null when there is nothing to finish. */
export async function consumeGoogleRedirectResult(auth: Auth): Promise<UserCredential | null> {
  if (!hasPendingGoogleRedirect()) return null
  try {
    return await getRedirectResult(auth, browserPopupRedirectResolver)
  } finally {
    markRedirectPending(false)
  }
}

export function mapGoogleSignInError(error: unknown): string {
  const code = (error as { code?: string })?.code || ''
  if (code === 'auth/account-exists-with-different-credential') {
    return 'This email already signs in with a password. Use your email and password instead.'
  }
  if (code === 'auth/popup-blocked') {
    return 'Your browser blocked the Google window. Allow pop-ups for Storvv and try again.'
  }
  if (code === 'auth/operation-not-allowed') {
    return 'Google sign-in is not switched on yet. Use your email and password for now.'
  }
  if (code === 'auth/unauthorized-domain') {
    return 'Google sign-in is not allowed on this address yet. Use your email and password for now.'
  }
  if (code === 'auth/network-request-failed') {
    return 'Network error. Check your connection and try again'
  }
  return (error as Error)?.message || 'Google sign-in failed. Please try again.'
}
