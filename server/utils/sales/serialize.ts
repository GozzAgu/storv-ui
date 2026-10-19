import { FieldValue, Timestamp } from 'firebase-admin/firestore'

/**
 * Receipt data for the response: Timestamps become ISO strings, and server-timestamp sentinels
 * (not resolved until the write lands) become the current time.
 */
export function serializeForClient(value: unknown): unknown {
  if (value instanceof Timestamp) return value.toDate().toISOString()
  if (value instanceof Date) return value.toISOString()
  if (value instanceof FieldValue) return new Date().toISOString()
  if (Array.isArray(value)) return value.map(serializeForClient)
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([k, v]) => [k, serializeForClient(v)])
    )
  }
  return value
}
