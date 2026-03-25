/** Comma-separated SHA-256 hex digests (64 chars each) of allowed invite codes (UTF-8, lowercased alphanumeric). */
export function parseInviteSha256List(raw: string): string[] {
  return raw
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
}

export function isValidInviteHashList(raw: string): boolean {
  const parts = parseInviteSha256List(raw)
  return parts.length > 0 && parts.every((p) => /^[a-f0-9]{64}$/.test(p))
}

export async function verifyInviteCodeAgainstHashes(
  normalizedCode: string,
  rawHashList: string
): Promise<boolean> {
  const enc = new TextEncoder().encode(normalizedCode)
  const buf = await crypto.subtle.digest('SHA-256', enc)
  const hex = Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
  const allowed = parseInviteSha256List(rawHashList)
  return allowed.includes(hex)
}
