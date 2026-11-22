/** "Polanco Sales" → "PS", "Accounts" → "AC": a quiet mark that tells list rows apart. */
export function nameInitials(name: string | null | undefined): string {
  const parts = (name || '')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  if (parts.length === 0) return '?'
  // Model years and branch numbers ("Camry 2021", "Phase 2") make poor initials: skip them.
  const words = parts.filter((p) => /\p{L}/u.test(p))
  const use = words.length ? words : parts
  if (use.length === 1) return use[0]!.slice(0, 2).toUpperCase()
  return `${use[0]![0]}${use[use.length - 1]![0]}`.toUpperCase()
}
