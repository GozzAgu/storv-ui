/**
 * Who made an approval decision, for display. The server saves the person's name with each
 * decision; the viewer sees "you" for their own. Records from before names were saved have only a
 * uid, so they show nothing rather than a raw id.
 */
export function decidedByName(name: unknown, uid: unknown, viewerUid?: string): string | null {
  if (viewerUid && typeof uid === 'string' && uid === viewerUid) return 'you'
  if (typeof name === 'string' && name.trim()) return name.trim()
  return null
}

/** "Approved by Ada", "Rejected by you", or null when nobody was recorded (the badge says it). */
export function decidedByLine(
  verb: string,
  name: unknown,
  uid: unknown,
  viewerUid?: string
): string | null {
  const who = decidedByName(name, uid, viewerUid)
  return who ? `${verb} by ${who}` : null
}
