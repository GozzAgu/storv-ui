/** Slug helpers for public storefront URLs: /store/{slug} */

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export function slugifyStorefrontName(input: string): string {
  return String(input || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
    .slice(0, 48)
}

export function isValidStorefrontSlug(slug: string): boolean {
  const s = String(slug || '').trim()
  if (s.length < 2 || s.length > 48) return false
  if (!SLUG_RE.test(s)) return false
  const reserved = new Set([
    'www',
    'app',
    'api',
    'admin',
    'store',
    'stores',
    'demo',
    'pricing',
    'signin',
    'signup',
    'dashboard',
    'help',
    'support',
    'storvv',
  ])
  return !reserved.has(s)
}

export function storefrontPublicPath(slug: string): string {
  return `/store/${encodeURIComponent(slug)}`
}

export function storefrontProductPath(slug: string, itemId: string): string {
  return `/store/${encodeURIComponent(slug)}/p/${encodeURIComponent(itemId)}`
}
