/**
 * Extract a human-readable message from Firebase, Capacitor, and generic errors.
 * WKWebView / Capacitor often log raw errors as `{}` in the console.
 */
export function getErrorMessage(error: unknown): string {
  if (error == null) return ''

  if (typeof error === 'string') return error

  if (error instanceof Error) {
    return error.message || ''
  }

  if (typeof error === 'object') {
    const o = error as Record<string, unknown>
    if (typeof o.message === 'string' && o.message.trim()) return o.message
    if (typeof o.errorMessage === 'string' && o.errorMessage.trim()) return o.errorMessage
    if (typeof o.code === 'string') {
      return formatFirebaseOrPluginCode(o.code, typeof o.message === 'string' ? o.message : '')
    }
  }

  try {
    const serialized = JSON.stringify(error)
    if (serialized && serialized !== '{}') return serialized
  } catch {
    /* ignore */
  }

  return ''
}

function formatFirebaseOrPluginCode(code: string, fallback: string): string {
  const map: Record<string, string> = {
    'auth/user-not-found': 'No account found with this email address',
    'auth/wrong-password': 'Incorrect password. Please try again',
    'auth/invalid-email': 'Invalid email address',
    'auth/too-many-requests': 'Too many failed attempts. Please try again later',
    'auth/network-request-failed': 'Network error. Check your connection and try again',
    'auth/invalid-credential': 'Incorrect email or password',
    'permission-denied': 'Permission denied. Please contact your administrator',
    missingKey: 'Secure storage error (missing key)',
    osError: 'Could not access secure storage on this device',
    unknownError: 'Secure storage error on this device',
  }

  if (map[code]) return map[code]
  if (fallback) return fallback
  if (code.startsWith('auth/')) return `Authentication error (${code})`
  return code
}
