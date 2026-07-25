import { getEffectiveApiBase } from '~/utils/capacitor-api-base'

/**
 * Resolve `/api/...` paths against NUXT_PUBLIC_API_BASE when the UI is static
 * (e.g. Capacitor) and API routes live on a separate origin.
 */
export function resolveApiPath(path: string): string {
  if (!import.meta.client) return path
  const base = getEffectiveApiBase()
  if (!base) return path
  const normalized = path.startsWith('/') ? path : `/${path}`
  return `${base}${normalized}`
}
