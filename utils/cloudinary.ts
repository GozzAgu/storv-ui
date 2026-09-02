/**
 * True if the URL is served from Cloudinary (skip Firebase Storage delete on remove).
 */
export function isCloudinaryUrl(url: string): boolean {
  if (!url) return false
  try {
    const h = new URL(url).hostname
    return h.includes('cloudinary.com')
  } catch {
    return url.includes('cloudinary.com')
  }
}

/**
 * Fill a square crop after /upload/ so avatars and logo tiles use cover, not letterbox.
 */
export function optimizeCloudinaryLogo(url: string, size = 128): string {
  if (!url || !isCloudinaryUrl(url) || !url.includes('/upload/')) return url
  const segment = `w_${size},h_${size},c_fill,g_center,f_auto,q_auto`
  if (url.includes(`/${segment}/`)) return url
  const withFit = url.replace(
    /\/upload\/w_\d+,h_\d+,c_fit(?:,g_\w+)?,f_auto,q_auto/,
    `/upload/${segment}`
  )
  if (withFit !== url) return withFit
  if (url.match(/\/upload\/[^/]+\//)?.[0]?.includes('w_')) {
    return url
  }
  return url.replace('/upload/', `/upload/${segment}/`)
}
