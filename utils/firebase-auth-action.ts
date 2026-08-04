import type { ActionCodeSettings } from 'firebase/auth'

export const AUTH_ACTION_PATH = '/auth/action'

export type FirebaseAuthActionMode =
  | 'verifyEmail'
  | 'resetPassword'
  | 'recoverEmail'
  | 'verifyAndChangeEmail'
  | 'signIn'

export type ParsedFirebaseAuthAction = {
  mode: FirebaseAuthActionMode | ''
  oobCode: string
  continueUrl: string
  apiKey: string
  lang: string
}

/** Prefer current browser origin so localhost works with Firebase authorized domains. */
export function resolveAppOrigin(appOriginFromConfig?: string): string {
  if (typeof window !== 'undefined') {
    return window.location.origin.replace(/\/$/, '')
  }
  return (appOriginFromConfig || '').trim().replace(/\/$/, '')
}

/** Continue URL after the in-app handler finishes (sign-in with optional status flags). */
export function getAuthActionContinueUrl(base: string, status?: 'verified' | 'reset'): string {
  const url = new URL('/signin', base)
  if (status === 'verified') url.searchParams.set('verified', '1')
  if (status === 'reset') url.searchParams.set('reset', '1')
  return url.toString()
}

export function getFirebaseAuthActionUrl(appOriginFromConfig?: string): string {
  const base = resolveAppOrigin(appOriginFromConfig)
  return base ? `${base}${AUTH_ACTION_PATH}` : ''
}

/**
 * Action code settings for verification + password reset emails.
 * Requires Firebase Console → Authentication → Templates → action URL
 * set to `{appOrigin}/auth/action`.
 */
export function getFirebaseAuthActionCodeSettings(
  appOriginFromConfig?: string,
  status?: 'verified' | 'reset'
): ActionCodeSettings | undefined {
  const base = resolveAppOrigin(appOriginFromConfig)
  if (!base) return undefined
  return {
    url: getAuthActionContinueUrl(base, status),
    handleCodeInApp: true,
  }
}

export function parseFirebaseAuthActionFromSearch(search: string): ParsedFirebaseAuthAction {
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search)
  return {
    mode: (params.get('mode') || '') as ParsedFirebaseAuthAction['mode'],
    oobCode: params.get('oobCode') || '',
    continueUrl: params.get('continueUrl') || '',
    apiKey: params.get('apiKey') || '',
    lang: params.get('lang') || '',
  }
}

export function parseFirebaseAuthActionFromLocation(
  query: Record<string, string | string[] | undefined>,
  hash?: string
): ParsedFirebaseAuthAction {
  const read = (key: string) => {
    const value = query[key]
    if (Array.isArray(value)) return value[0] || ''
    return value || ''
  }

  let parsed: ParsedFirebaseAuthAction = {
    mode: read('mode') as ParsedFirebaseAuthAction['mode'],
    oobCode: read('oobCode'),
    continueUrl: read('continueUrl'),
    apiKey: read('apiKey'),
    lang: read('lang'),
  }

  if ((!parsed.mode || !parsed.oobCode) && hash) {
    const fromHash = parseFirebaseAuthActionFromSearch(hash.startsWith('#') ? hash.slice(1) : hash)
    parsed = {
      mode: parsed.mode || fromHash.mode,
      oobCode: parsed.oobCode || fromHash.oobCode,
      continueUrl: parsed.continueUrl || fromHash.continueUrl,
      apiKey: parsed.apiKey || fromHash.apiKey,
      lang: parsed.lang || fromHash.lang,
    }
  }

  return parsed
}

export function getAuthActionErrorCopy(error: unknown): { title: string; message: string } {
  const code = (error as { code?: string })?.code || ''
  const message = (error as { message?: string })?.message || ''

  switch (code) {
    case 'auth/expired-action-code':
      return {
        title: 'This link has expired',
        message:
          'Verification and reset links expire after a short time for security. Request a fresh email and use the new link right away.',
      }
    case 'auth/invalid-action-code':
      return {
        title: 'This link is no longer valid',
        message:
          'The link may have already been used or was replaced by a newer email. Request a new link if you still need to finish this step.',
      }
    case 'auth/user-disabled':
      return {
        title: 'Account unavailable',
        message: 'This account has been disabled. Contact your workspace admin or Storvv support for help.',
      }
    case 'auth/weak-password':
      return {
        title: 'Password too weak',
        message: 'Choose a stronger password with at least 6 characters.',
      }
    default:
      return {
        title: 'Something went wrong',
        message: message || 'We could not complete this request. Try again or request a new email.',
      }
  }
}

export function isSupportedAuthActionMode(mode: string): mode is FirebaseAuthActionMode {
  return (
    mode === 'verifyEmail' ||
    mode === 'resetPassword' ||
    mode === 'recoverEmail' ||
    mode === 'verifyAndChangeEmail' ||
    mode === 'signIn'
  )
}
