import { Capacitor } from '@capacitor/core'
import { isCapacitorShellLocation } from '~/utils/capacitor-shell-detect'

/** True when running inside Capacitor iOS/Android (WKWebView). */
export function isCapacitorNative(): boolean {
  if (import.meta.server || typeof window === 'undefined') return false

  try {
    if (Capacitor.isNativePlatform()) return true
  } catch {
    /* ignore */
  }

  try {
    const cap = (window as Window & { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor
    if (cap?.isNativePlatform?.() === true) return true
  } catch {
    /* ignore */
  }

  if (document.documentElement.classList.contains('capacitor-native')) return true

  try {
    if (/Capacitor/i.test(navigator.userAgent)) return true
  } catch {
    /* ignore */
  }

  try {
    const { protocol, hostname, port, href } = window.location
    if (isCapacitorShellLocation(protocol, hostname, port, href, navigator.userAgent)) return true
  } catch {
    /* ignore */
  }

  return false
}

/** Apply document classes and undo app.html FOUC hide on native. */
export function markCapacitorDocument(): void {
  if (!isCapacitorNative() || typeof document === 'undefined') return
  const html = document.documentElement
  html.classList.add('capacitor-native', 'styles-loaded')
  html.style.removeProperty('display')
  document.body?.style.removeProperty('display')
}
