/** Visual helpers for inventory category grid cards (Firestore still uses "folder"). */

/** Storvv primary-500 / primary-600 (tailwind.config.js) */
export const PRIMARY_ACCENT = '#143f8d'
export const PRIMARY_ACCENT_DARK = '#0f357a'
const LEGACY_DEFAULT_BLUE = '#3b82f6'

const TYPE_LABELS: Record<string, string> = {
  general: 'General',
  electronics: 'Electronics',
  clothing: 'Clothing & apparel',
  automotive: 'Automotive',
  food: 'Food & beverage',
  office: 'Office supplies',
  other: 'Other',
}

export type CategoryTrackingPill = {
  label: string
  dotClass: string
  pillClass: string
}

/** Label for departments that can access this category. */
export function categoryDepartmentAccessLabel(
  allowedDepartmentIds: string[] | undefined,
  resolveDepartmentName: (id: string) => string | undefined
): string {
  if (!allowedDepartmentIds || allowedDepartmentIds.length === 0) {
    return 'All departments'
  }
  const names = allowedDepartmentIds
    .map((id) => resolveDepartmentName(id)?.trim())
    .filter((n): n is string => Boolean(n))
  if (names.length === 0) return 'All departments'
  if (names.length === 1) return names[0]!
  if (names.length === 2) return `${names[0]}, ${names[1]}`
  return `${names[0]}, +${names.length - 1} more`
}

/** Title-case each word for display (e.g. "acura" → "Acura", "alfa romeo" → "Alfa Romeo"). */
export function formatCategoryDisplayName(name: string): string {
  const trimmed = name?.trim()
  if (!trimmed) return ''
  return trimmed
    .split(/\s+/)
    .map((word) => {
      if (!word) return word
      return word.charAt(0).toUpperCase() + word.slice(1)
    })
    .join(' ')
}

export function formatCategoryTypeLabel(type: string | undefined): string {
  if (!type?.trim()) return 'General'
  return TYPE_LABELS[type] ?? type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export function categoryDescriptionText(description: string | undefined): string {
  const trimmed = description?.trim()
  return trimmed || 'No description added yet.'
}

export function categoryTrackingPill(
  hasSerialNumbers: boolean,
  lowStockCount: number
): CategoryTrackingPill {
  if (lowStockCount > 0) {
    return {
      label: 'Low stock',
      dotClass: '',
      pillClass: 'dash-grid-card__pill dash-pill--warning',
    }
  }
  if (hasSerialNumbers) {
    return {
      label: 'Serial',
      dotClass: '',
      pillClass: 'dash-grid-card__pill dash-pill--accent',
    }
  }
  return {
    label: 'Quantity',
    dotClass: '',
    pillClass: 'dash-grid-card__pill dash-pill--success',
  }
}

export function formatCategoryDate(date: unknown): string | null {
  if (!date) return null
  try {
    let dateObj: Date
    if (
      date &&
      typeof date === 'object' &&
      typeof (date as { toDate?: () => Date }).toDate === 'function'
    ) {
      dateObj = (date as { toDate: () => Date }).toDate()
    } else if (date && typeof date === 'object' && 'seconds' in date) {
      const ts = date as { seconds: number; nanoseconds?: number }
      dateObj = new Date(ts.seconds * 1000 + (ts.nanoseconds || 0) / 1_000_000)
    } else {
      dateObj = new Date(date as string | number | Date)
    }
    if (Number.isNaN(dateObj.getTime())) return null
    return dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  } catch {
    return null
  }
}

export function parseHexColor(input: string | undefined): string | null {
  if (!input) return null
  const raw = input.trim()
  const hex = raw.startsWith('#') ? raw.slice(1) : raw
  if (!/^[0-9a-fA-F]{6}$/.test(hex)) return null
  return `#${hex.toLowerCase()}`
}

/** Maps stored folder colors (incl. legacy Tailwind blue) to Storvv dark primary. */
export function normalizeAccentColor(input: string | undefined): string {
  const parsed = parseHexColor(input)
  if (!parsed || parsed === LEGACY_DEFAULT_BLUE) return PRIMARY_ACCENT
  const lightBlues = new Set(['#4876c7', '#6e94d6', '#9ab5e3', '#3b82f6'])
  if (lightBlues.has(parsed)) return PRIMARY_ACCENT
  return parsed
}
