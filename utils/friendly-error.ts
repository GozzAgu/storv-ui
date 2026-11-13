import { getErrorMessage } from '~/utils/error-message'

/**
 * Turns any thrown value into copy that is safe to show a user. Raw cloud SDK errors
 * (Firestore paths, `setDoc()` validation text, `FirebaseError: ...`, bare error codes)
 * never reach the UI; messages the app wrote itself pass through unchanged.
 */

export const GENERIC_ERROR_MESSAGE = 'Something went wrong. Please try again.'

const CODE_MESSAGES: Record<string, string> = {
  'permission-denied': "You don't have permission to do that. Ask your store owner for access.",
  unauthenticated: 'Your session has expired. Please sign in again.',
  unavailable: 'You appear to be offline. Check your connection and try again.',
  'deadline-exceeded': 'That took too long. Check your connection and try again.',
  'resource-exhausted': 'Too many requests right now. Please wait a moment and try again.',
  'not-found': "We couldn't find that record. It may have been removed.",
  'already-exists': 'That record already exists.',
  cancelled: 'That action was cancelled. Please try again.',
  'auth/user-not-found': 'No account found with this email address.',
  'auth/wrong-password': 'Incorrect password. Please try again.',
  'auth/invalid-credential': 'Incorrect email or password.',
  'auth/invalid-email': 'That email address is not valid.',
  'auth/email-already-in-use': 'An account with this email already exists.',
  'auth/weak-password': 'Please choose a stronger password.',
  'auth/too-many-requests': 'Too many attempts. Please wait a moment and try again.',
  'auth/network-request-failed': 'Network error. Check your connection and try again.',
  'auth/requires-recent-login': 'For your security, please sign in again and retry.',
  'auth/popup-closed-by-user': 'Sign-in was cancelled.',
  'auth/user-disabled':
    'This account has been deactivated. Contact your store owner if you need access restored.',
  'storage/unauthorized': "You don't have permission to upload this file.",
  'storage/quota-exceeded': 'File storage is full. Contact Storvv support.',
  'storage/canceled': 'Upload cancelled.',
}

const SDK_CODE =
  /^(?:(?:auth|storage|functions|firestore|messaging|app-check|installations)\/[a-z0-9-]+|permission-denied|unauthenticated|unavailable|deadline-exceeded|resource-exhausted|not-found|already-exists|cancelled|failed-precondition|invalid-argument|aborted|out-of-range|unimplemented|internal|data-loss|unknown)$/

/** Text that only an SDK would write: never show it as is. */
const RAW_SDK_TEXT = [
  /firebase/i,
  /firestore/i,
  /googleapis/i,
  /\b(?:setDoc|addDoc|updateDoc|deleteDoc|getDoc|getDocs|writeBatch|runTransaction|doc|collection|query|where)\(\)/,
  /Function \w+\(\) (?:called|cannot|requires)/,
  /Unsupported field value/i,
  /INTERNAL ASSERTION/i,
  /\bdocument path\b|\bdocumentPath\b|\bcollection reference\b/i,
  /^Missing or insufficient permissions\.?$/i,
  /client is offline/i,
  /\busers\/[A-Za-z0-9]{12,}\//,
  /\(\s*(?:auth|storage|functions)\/[a-z0-9-]+\s*\)/,
]

function extractCode(error: unknown, message: string): string | null {
  if (error && typeof error === 'object') {
    const code = (error as { code?: unknown }).code
    if (typeof code === 'string' && SDK_CODE.test(code)) return code
  }
  const wrapped = message.match(/\((?:(auth|storage|functions)\/[a-z0-9-]+)\)/)
  if (wrapped) return wrapped[0].slice(1, -1)
  if (SDK_CODE.test(message.trim())) return message.trim()
  if (/^Missing or insufficient permissions\.?$/i.test(message.trim())) return 'permission-denied'
  if (/client is offline/i.test(message)) return 'unavailable'
  return null
}

export function isRawSdkMessage(message: string): boolean {
  const text = message.trim()
  if (!text) return false
  if (SDK_CODE.test(text)) return true
  return RAW_SDK_TEXT.some((pattern) => pattern.test(text))
}

/** A user-safe message for a thrown value; `fallback` replaces anything raw or empty. */
export function friendlyErrorMessage(error: unknown, fallback = GENERIC_ERROR_MESSAGE): string {
  const message = getErrorMessage(error).trim()
  const code = extractCode(error, message)
  const isSdkError =
    !!code || (error instanceof Error && error.name === 'FirebaseError') || isRawSdkMessage(message)

  if (isSdkError) {
    if (code && CODE_MESSAGES[code]) return CODE_MESSAGES[code]
    return fallback
  }
  return message || fallback
}

/** Same check for a string that is about to be shown (e.g. a toast). */
export function friendlyDisplayMessage(message: string, fallback = GENERIC_ERROR_MESSAGE): string {
  return friendlyErrorMessage(message, fallback)
}
