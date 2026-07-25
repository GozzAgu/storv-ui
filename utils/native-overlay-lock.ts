/** Native overlay scroll lock + overlay host activation (iOS-safe). */
export function setNativeOverlayLock(locked: boolean) {
  if (!import.meta.client) return

  const html = document.documentElement
  const host = document.getElementById('dashboard-native-overlay-host')
  const main = document.querySelector<HTMLElement>('[data-dashboard-main]')

  html.toggleAttribute('data-native-drawer-open', locked)
  host?.classList.toggle('dashboard-native-overlay-host--active', locked)
  host?.toggleAttribute('aria-hidden', !locked)

  if (main) {
    main.style.overflow = locked ? 'hidden' : ''
  }
}

export function clearNativeOverlayLock() {
  setNativeOverlayLock(false)
}
