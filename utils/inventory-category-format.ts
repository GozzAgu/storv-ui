/** Display helpers for inventory categories (Firestore still uses "folder"). */

import { capitalizeWords } from '~/utils/capitalize-text'

/** Title-case each word for display (e.g. "acura" → "Acura", "alfa romeo" → "Alfa Romeo"). */
export function formatCategoryDisplayName(name: string): string {
  return capitalizeWords(name ?? '')
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
