/**
 * Shared styling for store “chip” badges (top nav StoreSelector + sidenav Branches).
 * Keeps per-store hue consistent from store id/name.
 */

export interface StoreBadgeTarget {
  id?: string
  name?: string | null
}

export function hueFromString(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = Math.imul(31, h) + s.charCodeAt(i)!
    h |= 0
  }
  return ((h % 360) + 360) % 360
}

export function iconSurfaceStyleFor(store: StoreBadgeTarget): Record<string, string> {
  const key = store.id || store.name || 'default'
  const hue = hueFromString(key)
  return {
    background: `linear-gradient(145deg, hsl(${hue} 58% 50%) 0%, hsl(${hue} 62% 40%) 100%)`,
    boxShadow:
      'inset 0 1px 0 rgb(255 255 255 / 0.18), inset 0 -1px 0 rgb(0 0 0 / 0.08)',
  }
}
