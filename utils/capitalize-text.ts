import type { Template } from '~/stores/inventory'

/** Trim and capitalize the first character; leave the rest unchanged. */
export function capitalizeFirstLetter(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return ''
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1)
}

/** Title-case each whitespace-separated word (e.g. "toyota corolla" → "Toyota Corolla"). */
export function capitalizeWords(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return ''
  return trimmed
    .split(/\s+/)
    .map((word) => capitalizeFirstLetter(word))
    .join(' ')
}

/** Default normalizer for user-entered entity names (categories, products, people, branches). */
export function normalizeEntityName(value: string): string {
  return capitalizeWords(value)
}

const INVENTORY_NAMED_ITEM_KEYS = ['name', 'brand', 'model', 'itemName'] as const

/** Capitalize known inventory product text fields before save. */
export function normalizeInventoryItemNamedFields(item: Record<string, unknown>): void {
  for (const key of INVENTORY_NAMED_ITEM_KEYS) {
    const raw = item[key]
    if (typeof raw === 'string' && raw.trim()) {
      item[key] = normalizeEntityName(raw)
    }
  }
}

/** Capitalize template column labels before save. */
export function normalizeFolderTemplate(template: Template | undefined): Template | undefined {
  if (!template?.fields?.length) return template
  return {
    ...template,
    fields: template.fields.map((field) => ({
      ...field,
      label: field.label?.trim() ? normalizeEntityName(field.label) : field.label,
    })),
  }
}
