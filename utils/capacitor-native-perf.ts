import { isCapacitorNative } from '~/utils/capacitor-env'

/** Remove Google Fonts link tags - native uses system UI fonts for faster first paint. */
export function stripNativeWebFontLinks(): void {
  if (typeof document === 'undefined') return
  document
    .querySelectorAll('link[href*="fonts.googleapis.com"], link[href*="fonts.gstatic.com"]')
    .forEach((el) => el.remove())
}

/** Run work after first paint; shorter fallback on native WKWebView. */
export function scheduleNativeIdleWork(fn: () => void, timeoutMs = 2500): void {
  if (typeof window === 'undefined') return
  if ('requestIdleCallback' in window) {
    requestIdleCallback(fn, { timeout: timeoutMs })
  } else {
    setTimeout(fn, Math.min(timeoutMs, 800))
  }
}

export function isNativePerfContext(): boolean {
  return isCapacitorNative()
}
