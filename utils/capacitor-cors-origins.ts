/** Origins used by Capacitor / Ionic WebViews when the UI is a static shell. */
export const CAPACITOR_ORIGIN_PREFIXES = [
  'capacitor://',
  'ionic://',
  'http://localhost',
  'https://localhost',
  'http://127.0.0.1',
  'https://127.0.0.1',
] as const

export function isCapacitorOrigin(origin: string): boolean {
  const normalized = origin.trim().toLowerCase()
  return CAPACITOR_ORIGIN_PREFIXES.some((prefix) => normalized.startsWith(prefix))
}
