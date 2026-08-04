import { sendEmailVerification, type User } from 'firebase/auth'
import {
  getFirebaseAuthActionCodeSettings,
  getFirebaseAuthActionUrl,
} from '~/utils/firebase-auth-action'

export { getFirebaseAuthActionUrl }

/**
 * Sends Firebase verification email. Tries with in-app action handler first; if Firebase rejects
 * the URL (domain / Action URL settings), retries without ActionCodeSettings so the message still sends.
 */
export async function sendUserEmailVerification(
  user: User,
  appOriginFromConfig?: string
): Promise<void> {
  const action = getFirebaseAuthActionCodeSettings(appOriginFromConfig, 'verified')

  if (action) {
    try {
      await sendEmailVerification(user, action)
      return
    } catch (first: unknown) {
      const code = (first as { code?: string })?.code
      const msg = (first as { message?: string })?.message
      console.warn(
        '[email verification] Send with in-app action URL failed; retrying without:',
        code,
        msg
      )
    }
  }

  await sendEmailVerification(user)
}
