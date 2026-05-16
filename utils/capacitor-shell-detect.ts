/**
 * Inline-safe Capacitor shell detection (no Capacitor JS bridge required).
 * Used in app.html before the app bundle loads.
 */
export function isCapacitorShellLocation(
  protocol: string,
  hostname: string,
  port: string,
  href: string
): boolean {
  if (protocol === 'capacitor:' || href.startsWith('capacitor://')) return true
  // Capacitor iOS/Android embedded server (not Nuxt dev on :3000).
  if (hostname === 'localhost' && protocol === 'https:') {
    return !port || port === '443'
  }
  return false
}
