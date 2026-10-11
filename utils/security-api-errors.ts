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

/**
 * Code from a server `createError({ data: { code } })`. Through $fetch the response body is
 * `error.data`, so the code sits at `error.data.data.code`; errors built in-app put it at
 * `error.data.code`.
 */
export function apiErrorCode(error: unknown): string | undefined {
  const data = (error as { data?: { code?: unknown; data?: { code?: unknown } } })?.data
  const code = data?.data?.code ?? data?.code
  return typeof code === 'string' ? code : undefined
}

export function isEmailVerificationRequiredError(error: unknown): boolean {
  return apiErrorCode(error) === 'EMAIL_VERIFICATION_REQUIRED'
}

export function isTwoFactorRequiredError(error: unknown): boolean {
  return apiErrorCode(error) === 'TFA_REQUIRED'
}

export function isTotpCodeRequiredError(error: unknown): boolean {
  return apiErrorCode(error) === 'TFA_CODE_REQUIRED'
}
