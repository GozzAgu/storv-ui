/** Replace typographic dashes in user-facing demo copy with comma separators. */
export function sanitizeDemoDisplayDashes(text: string): string {
  if (!text) return text
  return text
    .replace(/\s*[—–]\s*/g, ', ')
    .replace(/,\s*,+/g, ',')
    .replace(/\s{2,}/g, ' ')
    .trim()
}
