import { sendEmailVerification, type User } from 'firebase/auth'
import type { ActionCodeSettings } from 'firebase/auth'

/**
 * Build continue URL for verification emails. Prefer the **current browser origin** so
 * local dev (`http://localhost:3000`) matches Firebase authorized domains; env-only
 * production URLs were causing `auth/invalid-continue-uri` and silent failure.
 */
export function getEmailVerificationActionCodeSettings(
  appOriginFromConfig?: string
): ActionCodeSettings | undefined {
  let base = ''
  if (typeof window !== 'undefined') {
    base = window.location.origin.replace(/\/$/, '')
  }
  if (!base) {
    base = (appOriginFromConfig || '').trim().replace(/\/$/, '')
  }
  if (!base) return undefined
  return {
    url: `${base}/signin`,
    handleCodeInApp: false,
  }
}

/**
 * Sends Firebase verification email. Tries with continue URL first; if Firebase rejects
 * the URL (common with domain / Action URL settings), retries without ActionCodeSettings
 * so the message still sends.
 */
export async function sendUserEmailVerification(
  user: User,
  appOriginFromConfig?: string
): Promise<void> {
  const action = getEmailVerificationActionCodeSettings(appOriginFromConfig)

  if (action) {
    try {
      await sendEmailVerification(user, action)
      return
    } catch (first: unknown) {
      const code = (first as { code?: string })?.code
      const msg = (first as { message?: string })?.message
      console.warn(
        '[email verification] Send with continue URL failed; retrying without:',
        code,
        msg
      )
    }
  }

  await sendEmailVerification(user)
}
