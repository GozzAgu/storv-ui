/**
 * Search and sharing data for the marketing site: the canonical origin, the share image, Storvv's
 * public contact details, and schema.org (JSON-LD) builders. Pure data, so it is easy to test.
 */

export const SITE_URL = 'https://www.storvv.com'
export const SITE_NAME = 'Storvv'

/** 1200×630 link-preview image (WhatsApp, LinkedIn, X, Facebook). */
export const SHARE_IMAGE = {
  url: `${SITE_URL}/og/storvv-share.png`,
  width: 1200,
  height: 630,
  alt: 'Storvv: point of sale and inventory for shops in every branch',
}

export const STORVV_CONTACT = {
  email: 'hello@storvv.com',
  /** E.164, for tel: links and structured data. */
  phone: '+2349163070964',
  /** How the number is shown on the page. */
  phoneDisplay: '+234 916 307 0964',
  instagram: 'https://www.instagram.com/_storvv_',
  x: 'https://x.com/_storvv_',
  xHandle: '@_storvv_',
}

export function canonicalUrl(path: string): string {
  const clean = path === '/' ? '/' : `/${path.replace(/^\/+|\/+$/g, '')}`
  return clean === '/' ? `${SITE_URL}/` : `${SITE_URL}${clean}`
}

/** Plain text for structured data: answers on the page may contain links or simple tags. */
export function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim()
}

type JsonLd = Record<string, unknown>

export function organizationJsonLd(): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${SITE_URL}/#organization`,
    name: SITE_NAME,
    url: `${SITE_URL}/`,
    logo: `${SITE_URL}/brand/storvv-app-icon.png`,
    email: STORVV_CONTACT.email,
    telephone: STORVV_CONTACT.phone,
    sameAs: [STORVV_CONTACT.instagram, STORVV_CONTACT.x],
    contactPoint: [
      {
        '@type': 'ContactPoint',
        contactType: 'customer support',
        email: STORVV_CONTACT.email,
        telephone: STORVV_CONTACT.phone,
        areaServed: 'NG',
        availableLanguage: ['English'],
      },
    ],
  }
}

export function websiteJsonLd(): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#website`,
    name: SITE_NAME,
    url: `${SITE_URL}/`,
    publisher: { '@id': `${SITE_URL}/#organization` },
  }
}

export interface SoftwareOffer {
  name: string
  /** Monthly price in naira; 0 for free. */
  price: number
  description: string
}

export function softwareJsonLd(offers: SoftwareOffer[]): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: SITE_NAME,
    url: `${SITE_URL}/`,
    applicationCategory: 'BusinessApplication',
    applicationSubCategory: 'Point of sale and inventory management',
    operatingSystem: 'Web browser',
    description:
      'Point of sale and inventory for shops: sell, track stock across branches, send receipts on WhatsApp and see what sells.',
    publisher: { '@id': `${SITE_URL}/#organization` },
    offers: offers.map((offer) => ({
      '@type': 'Offer',
      name: offer.name,
      description: offer.description,
      price: String(offer.price),
      priceCurrency: 'NGN',
      url: `${SITE_URL}/pricing`,
      ...(offer.price > 0
        ? {
            priceSpecification: {
              '@type': 'UnitPriceSpecification',
              price: String(offer.price),
              priceCurrency: 'NGN',
              unitText: 'MONTH',
            },
          }
        : {}),
    })),
  }
}

export function faqJsonLd(items: { q: string; a: string }[]): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: stripHtml(item.q),
      acceptedAnswer: { '@type': 'Answer', text: stripHtml(item.a) },
    })),
  }
}

export function breadcrumbJsonLd(name: string, path: string): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
      { '@type': 'ListItem', position: 2, name, item: canonicalUrl(path) },
    ],
  }
}
