/** True when running inside Capacitor iOS/Android (WKWebView). */
export function isCapacitorNative(): boolean {
  if (import.meta.server || typeof window === 'undefined') return false

  try {
    const cap = (window as Window & { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor
    if (cap?.isNativePlatform?.() === true) return true
  } catch {
    /* ignore */
  }

  try {
    const { protocol, href } = window.location
    if (protocol === 'capacitor:') return true
    if (href.startsWith('capacitor://')) return true
  } catch {
    /* ignore */
  }

  return false
}

/** Apply document class used by Capacitor-safe CSS overrides. */
export function markCapacitorDocument(): void {
  if (!isCapacitorNative() || typeof document === 'undefined') return
  document.documentElement.classList.add('capacitor-native')
}
