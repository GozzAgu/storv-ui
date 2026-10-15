/**
 * Template columns marked `unique` (engine number, chassis number, IMEI): every product needs its
 * own value, so bulk add asks for them per serial and duplicates are refused.
 */

type UniqueCapableField = {
  name: string
  label?: string
  type: string
  unique?: boolean
}

/** Columns the app fills itself or that identify the product line, never per-unit identifiers. */
const NEVER_UNIQUE_FIELD_NAMES = new Set(['serialNo', 'serialNumber', 'brand', 'model', 'name'])

export function canFieldBeUnique(field: Pick<UniqueCapableField, 'name' | 'type'>): boolean {
  return (
    (field.type === 'text' || field.type === 'number') && !NEVER_UNIQUE_FIELD_NAMES.has(field.name)
  )
}

export function uniqueTemplateFields<T extends UniqueCapableField>(fields: readonly T[]): T[] {
  return fields.filter((f) => f.unique === true && canFieldBeUnique(f))
}

/** Case, spaces and dashes are ignored, so "GHS-1847 3829" and "ghs18473829" are the same number. */
export function normalizeUniqueValue(value: unknown): string {
  if (value === undefined || value === null) return ''
  return String(value)
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, '')
}

export type UniqueValueClash = {
  fieldName: string
  fieldLabel: string
  value: string
}

/** First value that appears on more than one of `items` for any unique column, or null. */
export function findUniqueValueClashInBatch(
  items: readonly Record<string, unknown>[],
  fields: readonly UniqueCapableField[]
): UniqueValueClash | null {
  for (const field of uniqueTemplateFields(fields)) {
    const seen = new Set<string>()
    for (const item of items) {
      const key = normalizeUniqueValue(item[field.name])
      if (!key) continue
      if (seen.has(key)) {
        return {
          fieldName: field.name,
          fieldLabel: field.label || field.name,
          value: String(item[field.name]).trim(),
        }
      }
      seen.add(key)
    }
  }
  return null
}
