import { createHash, timingSafeEqual } from 'node:crypto'
import { createError, getHeader, type H3Event } from 'h3'

/** Vercel Cron sends `Authorization: Bearer $CRON_SECRET`. Hashing first keeps lengths equal. */
export function isValidCronAuthorization(
  header: string | undefined | null,
  secret: string | undefined | null
): boolean {
  if (!secret || secret.length < 16) return false
  const given = createHash('sha256')
    .update(String(header ?? ''))
    .digest()
  const expected = createHash('sha256').update(`Bearer ${secret}`).digest()
  return timingSafeEqual(given, expected)
}

export function requireCronAuth(event: H3Event): void {
  if (!isValidCronAuthorization(getHeader(event, 'authorization'), process.env.CRON_SECRET)) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }
}
