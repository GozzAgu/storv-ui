/**
 * Builds a VoiceOver-friendly stat card label, e.g.
 * "Today's sales, 2 million naira, up 12 percent, vs yesterday".
 */
export function buildIosStatAccessibilityLabel(parts: {
  label: string
  value?: string | number | null
  change?: string | null
  subtext?: string | null
}): string {
  const segments: string[] = [parts.label]

  if (parts.value !== undefined && parts.value !== null && String(parts.value).trim() !== '') {
    segments.push(String(parts.value))
  }
  if (parts.change) segments.push(parts.change)
  if (parts.subtext) segments.push(parts.subtext)

  return segments.join(', ')
}
