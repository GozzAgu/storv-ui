import { createHash, timingSafeEqual } from 'node:crypto'

function hashCode(value: string): Buffer {
  return createHash('sha256').update(value, 'utf8').digest()
}

function timingSafeEqualString(a: string, b: string): boolean {
  try {
    return timingSafeEqual(hashCode(a), hashCode(b))
  } catch {
    return false
  }
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const configured = String(config.inviteAccessCode || '').trim()

  if (!configured) {
    throw createError({ statusCode: 503, message: 'Invite access is not configured' })
  }

  const body = (await readBody(event).catch(() => null)) as { code?: string } | null
  const raw = String(body?.code ?? '').trim().toLowerCase().replace(/\s/g, '')
  if (!raw || raw.length < 4 || raw.length > 64 || !/^[a-z0-9]+$/.test(raw)) {
    throw createError({ statusCode: 400, message: 'Invalid access code' })
  }

  const codes = configured
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)

  const ok = codes.some((c) => timingSafeEqualString(raw, c))
  if (!ok) {
    throw createError({ statusCode: 401, message: 'Invalid access code' })
  }

  return { ok: true as const }
})
