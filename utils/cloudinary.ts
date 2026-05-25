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
 * Insert a small-fit transform after /upload/ (no-op if not a standard Cloudinary image URL).
 */
export function optimizeCloudinaryLogo(url: string, size = 128): string {
 if (!url || !isCloudinaryUrl(url) || !url.includes('/upload/')) return url
 const segment = `w_${size},h_${size},c_fit,f_auto,q_auto`
 if (url.includes(`/${segment}/`) || url.match(/\/upload\/[^/]+\//)?.[0]?.includes('w_')) {
 return url
 }
 return url.replace('/upload/', `/upload/${segment}/`)
}
