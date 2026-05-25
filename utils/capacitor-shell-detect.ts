/**
 * Inline-safe Capacitor shell detection (no Capacitor JS bridge required).
 * Used in app.html before the app bundle loads.
 */
export function isCapacitorShellLocation(
 protocol: string,
 hostname: string,
 port: string,
 href: string,
 userAgent = ''
): boolean {
 if (protocol === 'capacitor:' || href.startsWith('capacitor://')) return true

 const host = hostname.toLowerCase()
 const isLocalHost = host === 'localhost' || host === '127.0.0.1'
 const p = port || ''

 // Capacitor embedded server (not Nuxt dev on :3000 / :3001).
 if (isLocalHost && protocol === 'https:' && (!p || p === '443')) return true
 if (isLocalHost && protocol === 'http:' && (!p || p === '80')) return true

 // WKWebView user agent includes "Capacitor" even when loading a remote origin.
 if (userAgent && /Capacitor/i.test(userAgent)) return true

 return false
}
