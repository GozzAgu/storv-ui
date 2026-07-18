import { isCapacitorNative } from '~/utils/capacitor-env'

/**
 * Auth page entrance classes. On Capacitor, skip opacity-0 animations (WKWebView often never runs them).
 */
export function authEntranceClass(delayMs?: number): string {
  if (import.meta.client && isCapacitorNative()) {
    return 'opacity-100 translate-y-0'
  }

  const base =
    'opacity-0 motion-reduce:animate-none motion-reduce:opacity-100 motion-reduce:translate-y-0 animate-auth-fade-up'
  if (delayMs == null) return base
  return `${base} [animation-delay:${delayMs}ms]`
}
