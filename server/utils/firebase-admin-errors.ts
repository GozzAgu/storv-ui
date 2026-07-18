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
      message: `${verb} requires Firebase Admin on the server. Set FIREBASE_SERVICE_ACCOUNT_JSON (or FIREBASE_SERVICE_ACCOUNT_PATH locally) in .env, then restart the dev server.`,
    })
  }
  throw err
}
