import { sendPasswordResetEmail, type Auth } from 'firebase/auth'
import { getFirebaseAuthActionCodeSettings } from '~/utils/firebase-auth-action'

/**
 * Sends Firebase password reset email via the Storvv in-app action handler when configured.
 */
export async function sendUserPasswordResetEmail(
  auth: Auth,
  email: string,
  appOriginFromConfig?: string
): Promise<void> {
  const action = getFirebaseAuthActionCodeSettings(appOriginFromConfig, 'reset')

  if (action) {
    try {
      await sendPasswordResetEmail(auth, email, action)
      return
    } catch (first: unknown) {
      const code = (first as { code?: string })?.code
      const msg = (first as { message?: string })?.message
      console.warn(
        '[password reset] Send with in-app action URL failed; retrying without:',
        code,
        msg
      )
    }
  }

  await sendPasswordResetEmail(auth, email)
}
