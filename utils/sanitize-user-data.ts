import type { UserData } from '~/composables/useUser'

/** Strip server-only fields before keeping user docs in client state. */
export function sanitizeUserData(data: UserData): UserData {
  const { twoFactorSecret: _secret, ...safe } = data
  return safe as UserData
}
