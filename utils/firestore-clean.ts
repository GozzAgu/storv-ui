function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object') return false
  const proto = Object.getPrototypeOf(value)
  return proto === Object.prototype || proto === null
}

/**
 * Firestore rejects `undefined` anywhere in a document, including inside arrays (where its error
 * names only the document). Drops undefined from plain objects and arrays at any depth; class
 * instances such as Timestamp, Date and serverTimestamp() sentinels are kept as they are.
 */
export function stripUndefinedDeep<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.filter((item) => item !== undefined).map((item) => stripUndefinedDeep(item)) as T
  }
  if (!isPlainObject(value)) return value
  const out: Record<string, unknown> = {}
  for (const [key, entry] of Object.entries(value)) {
    if (entry !== undefined) out[key] = stripUndefinedDeep(entry)
  }
  return out as T
}
