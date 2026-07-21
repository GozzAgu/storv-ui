import { createError } from 'h3'

export function rethrowFirebaseAdminSetupError(
  err: unknown,
  action: 'remove' | 'reactivate'
): never {
  const message = err instanceof Error ? err.message : String(err)
  if (
    message.includes('Firebase Admin not configured') ||
    message.includes('FIREBASE_SERVICE_ACCOUNT') ||
    message.includes('Invalid Firebase service account')
  ) {
    const verb = action === 'remove' ? 'Staff removal' : 'Staff reactivation'
    throw createError({
      statusCode: 503,
      message: `${verb} is temporarily unavailable on the server. Please try again later or contact Storvv support.`,
    })
  }
  throw err
}
