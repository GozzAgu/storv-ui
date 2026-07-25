import { isCapacitorNative } from '~/utils/capacitor-env'

const DEFAULT_NATIVE_API_BASE = 'https://app.storvv.com'

/** Hosted API origin for Capacitor when NUXT_PUBLIC_API_BASE is unset. */
export function getEffectiveApiBase(): string {
  const config = useRuntimeConfig()
  const explicit = String(config.public.apiBase || '')
    .trim()
    .replace(/\/$/, '')
  if (explicit) return explicit

  if (isCapacitorNative()) {
    const origin = String(config.public.appOrigin || DEFAULT_NATIVE_API_BASE)
      .trim()
      .replace(/\/$/, '')
    return origin || DEFAULT_NATIVE_API_BASE
  }

  return ''
}

export function isApiBaseConfigured(): boolean {
  return Boolean(getEffectiveApiBase())
}
