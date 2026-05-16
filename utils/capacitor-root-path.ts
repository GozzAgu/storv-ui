/** True when the WebView is on the marketing root (no real page for the native shell). */
export function isCapacitorMarketingRoot(pathname: string): boolean {
  const path = pathname || '/'
  return path === '/' || path === '/index.html'
}

/** Redirect native shell off `/` before Nuxt mounts the marketing page. */
export function redirectCapacitorRootToSignIn(): boolean {
  if (typeof window === 'undefined') return false
  if (!isCapacitorMarketingRoot(window.location.pathname)) return false
  window.location.replace('/signin')
  return true
}
