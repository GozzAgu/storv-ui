/** Normalize Firestore Timestamp, ISO string, or Date to ISO for growth prompts. */
export function resolveUserCreatedAtIso(
  createdAt: unknown,
  activationSignedUpAt?: string
): string | undefined {
  if (activationSignedUpAt) return activationSignedUpAt
  if (!createdAt) return undefined
  if (typeof createdAt === 'string') return createdAt
  if (createdAt instanceof Date) return createdAt.toISOString()
  const maybeTimestamp = createdAt as { toDate?: () => Date }
  if (typeof maybeTimestamp.toDate === 'function') {
    return maybeTimestamp.toDate().toISOString()
  }
  return undefined
}
