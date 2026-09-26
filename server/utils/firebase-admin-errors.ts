import { createError } from 'h3'

const ACTION_LABELS: Record<string, string> = {
  remove: 'Staff removal',
  reactivate: 'Staff reactivation',
  invite: 'Staff invite email',
}

export function rethrowFirebaseAdminSetupError(
  err: unknown,
  action: 'remove' | 'reactivate' | 'invite' | string = 'remove'
): never {
  const message = err instanceof Error ? err.message : String(err)
  if (
    message.includes('Firebase Admin not configured') ||
    message.includes('FIREBASE_SERVICE_ACCOUNT') ||
    message.includes('Invalid Firebase service account')
  ) {
    const verb = ACTION_LABELS[action] || 'This action'
    throw createError({
      statusCode: 503,
      message: `${verb} is temporarily unavailable on the server. Please try again later or contact Storvv support.`,
    })
  }
  throw err
}
