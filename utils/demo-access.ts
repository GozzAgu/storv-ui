/**
 * The demo is closed to the public: visitors book a walkthrough instead, and the Storvv team runs
 * the demo on those calls. The team opens it once with the private link
 * `/demo?access=<NUXT_PUBLIC_DEMO_ACCESS_KEY>`; this browser then remembers it.
 *
 * This keeps casual visitors out, not a determined one: the key ships in the page and the demo
 * holds only sample data, so nothing private sits behind it. Without a key set, only local
 * development can open the demo.
 */

const ACCESS_STORAGE_KEY = 'storvv-demo-access'

/** Where a blocked visitor lands: the home page with the walkthrough form open. */
export const DEMO_CLOSED_REDIRECT = { path: '/', query: { walkthrough: 'demo' } } as const

export function canOpenDemo(
  query: Record<string, unknown>,
  accessKey: string,
  isDev: boolean
): boolean {
  if (isDev) return true
  const key = accessKey.trim()
  if (!key) return false
  const given = Array.isArray(query.access) ? query.access[0] : query.access
  if (typeof given === 'string' && given === key) {
    try {
      localStorage.setItem(ACCESS_STORAGE_KEY, key)
    } catch {
      /* private mode: the link still works for this visit */
    }
    return true
  }
  try {
    return localStorage.getItem(ACCESS_STORAGE_KEY) === key
  } catch {
    return false
  }
}
