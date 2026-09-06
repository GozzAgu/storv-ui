/** Share URLs, UTM tags, and copy for public storefronts. */

export type StorefrontUtmParams = {
  source?: string
  medium?: string
  campaign?: string
  content?: string
}

export function withStorefrontUtm(url: string, utm: StorefrontUtmParams = {}): string {
  const base = String(url || '').trim()
  if (!base) return ''
  let parsed: URL
  try {
    parsed = new URL(base, 'https://storvv.com')
  } catch {
    return base
  }
  if (utm.source) parsed.searchParams.set('utm_source', utm.source)
  if (utm.medium) parsed.searchParams.set('utm_medium', utm.medium)
  if (utm.campaign) parsed.searchParams.set('utm_campaign', utm.campaign)
  if (utm.content) parsed.searchParams.set('utm_content', utm.content)
  // If caller passed a relative path, return path + query
  if (!/^https?:\/\//i.test(base)) {
    return `${parsed.pathname}${parsed.search}${parsed.hash}`
  }
  return parsed.toString()
}

export function storefrontAbsoluteUrl(
  origin: string,
  path: string,
  utm?: StorefrontUtmParams
): string {
  const root = String(origin || '').replace(/\/$/, '')
  const rel = path.startsWith('/') ? path : `/${path}`
  const absolute = `${root}${rel}`
  return utm ? withStorefrontUtm(absolute, utm) : absolute
}

export function buildStorefrontShareMessage(params: {
  storeName: string
  productTitle?: string
  priceLabel?: string
  url: string
}): string {
  const store = String(params.storeName || 'our store').trim()
  if (params.productTitle) {
    const price = params.priceLabel ? ` (${params.priceLabel})` : ''
    return `Check out ${params.productTitle}${price} at ${store}:\n${params.url}`
  }
  return `Browse ${store} on Storvv:\n${params.url}`
}

export function buildStorefrontWhatsAppShareHref(message: string): string {
  return `https://wa.me/?text=${encodeURIComponent(message)}`
}

/** Known link-preview crawlers (WhatsApp, IG, Facebook, Twitter/X, Slack, etc.). */
export function isLinkPreviewBot(userAgent: string): boolean {
  const ua = String(userAgent || '').toLowerCase()
  if (!ua) return false
  const needles = [
    'facebookexternalhit',
    'facebot',
    'twitterbot',
    'linkedinbot',
    'slackbot',
    'discordbot',
    'whatsapp',
    'telegrambot',
    'skypeuripreview',
    'pinterest',
    'googlebot',
    'bingbot',
    'duckduckbot',
    'embedly',
    'quora link preview',
    'showyoubot',
    'outbrain',
    'vkshare',
    'w3c_validator',
    'redditbot',
    'applebot',
    'iframely',
    'semrushbot',
  ]
  return needles.some((n) => ua.includes(n))
}

export function formatStorefrontMoney(amount: number, currency?: string | null): string {
  const cur = currency || 'NGN'
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: cur,
      maximumFractionDigits: 0,
    }).format(Number(amount) || 0)
  } catch {
    return `${cur} ${Number(amount) || 0}`
  }
}
