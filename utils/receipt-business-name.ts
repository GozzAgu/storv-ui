import type { UserData } from '~/composables/useUser'

/** e.g. rockstar.limited@… → Rockstar Limited */
export function formatBusinessNameFromEmail(email?: string): string {
  const local = email?.split('@')?.[0]?.trim()
  if (!local) return ''
  return local
    .replace(/[._-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

/**
 * Account-level business name (Profile business name), not branch / location fields.
 */
export function resolveBusinessNameFromUserData(
  userData?: UserData | null,
  options?: { branchName?: string }
): string {
  if (!userData) return ''

  const branch = options?.branchName?.trim().toLowerCase() || ''

  const fromName = userData.name?.trim()
  if (fromName && (!branch || fromName.toLowerCase() !== branch)) {
    return fromName
  }

  const fromEmail = formatBusinessNameFromEmail(userData.email)
  if (fromEmail && (!branch || fromEmail.toLowerCase() !== branch)) {
    return fromEmail
  }

  const fromStoreDetails = userData.storeDetails?.storeName?.trim()
  if (fromStoreDetails && (!branch || fromStoreDetails.toLowerCase() !== branch)) {
    return fromStoreDetails
  }

  return fromName || fromEmail || fromStoreDetails || ''
}
