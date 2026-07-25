/** Returns true when the account has 2FA enabled (Firestore user doc). */
export function accountHasTwoFactorEnabled(): boolean {
  const userStore = useUserStore()
  return userStore.userData?.twoFactorEnabled === true
}

/**
 * If 2FA is enabled, runs `requestTotp()` and returns the code; otherwise undefined.
 * Caller passes the code to sensitive API bodies as `totpCode`.
 */
export async function resolveTotpForSensitiveAction(
  requestTotp: () => Promise<string | null>
): Promise<string | undefined> {
  if (!accountHasTwoFactorEnabled()) return undefined
  const code = await requestTotp()
  if (!code) {
    throw new Error('Authenticator confirmation is required for this action')
  }
  return code
}

export function isEmailVerificationRequiredError(error: unknown): boolean {
  const data = (error as { data?: { code?: string } })?.data
  return data?.code === 'EMAIL_VERIFICATION_REQUIRED'
}

export function isTwoFactorRequiredError(error: unknown): boolean {
  const data = (error as { data?: { code?: string } })?.data
  return data?.code === 'TFA_REQUIRED'
}

export function isTotpCodeRequiredError(error: unknown): boolean {
  const data = (error as { data?: { code?: string } })?.data
  return data?.code === 'TFA_CODE_REQUIRED'
}
