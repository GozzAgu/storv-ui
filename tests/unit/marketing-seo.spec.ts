import { describe, expect, it } from 'vitest'
import {
  SITE_URL,
  canonicalUrl,
  faqJsonLd,
  organizationJsonLd,
  softwareJsonLd,
  stripHtml,
} from '~/utils/marketing-seo'
import { buildSitemapXml, sitemapPaths } from '~/utils/sitemap'
import { storvvWhatsappLink } from '~/utils/storvv-whatsapp'
import { CLIENT_ONLY_ROUTE_PATTERNS } from '~/utils/marketing-paths'

describe('marketing SEO helpers', () => {
  it('builds canonical URLs on the www host', () => {
    expect(canonicalUrl('/')).toBe(`${SITE_URL}/`)
    expect(canonicalUrl('/pricing')).toBe(`${SITE_URL}/pricing`)
    expect(canonicalUrl('pricing/')).toBe(`${SITE_URL}/pricing`)
  })

  it('turns FAQ answers with links into plain text', () => {
    expect(stripHtml('Yes. <a href="/x">Book a walkthrough</a> &amp; more')).toBe(
      'Yes. Book a walkthrough & more'
    )
    const ld = faqJsonLd([{ q: 'Is it free?', a: '<b>Yes</b>, for one store.' }])
    expect(ld['@type']).toBe('FAQPage')
    expect(ld.mainEntity).toEqual([
      {
        '@type': 'Question',
        name: 'Is it free?',
        acceptedAnswer: { '@type': 'Answer', text: 'Yes, for one store.' },
      },
    ])
  })

  it('lists plans as naira offers, with a monthly unit only for paid plans', () => {
    const ld = softwareJsonLd([
      { name: 'Micro', price: 0, description: 'Free' },
      { name: 'Medium', price: 15000, description: 'Growing' },
    ]) as { offers: Record<string, unknown>[] }
    expect(ld.offers[0]).toMatchObject({ price: '0', priceCurrency: 'NGN' })
    expect(ld.offers[0]).not.toHaveProperty('priceSpecification')
    expect(ld.offers[1]).toMatchObject({
      price: '15000',
      priceSpecification: { unitText: 'MONTH', priceCurrency: 'NGN' },
    })
  })

  it('gives search engines the contact number and email', () => {
    const org = organizationJsonLd()
    expect(org.telephone).toBe('+2349163070964')
    expect(org.email).toBe('hello@storvv.com')
  })
})

describe('sitemap', () => {
  it('lists every public marketing page, including About, and no app routes', () => {
    const paths = sitemapPaths()
    expect(paths).toContain('/')
    expect(paths).toContain('/about')
    for (const path of CLIENT_ONLY_ROUTE_PATTERNS) expect(paths).not.toContain(path)
  })

  it('writes valid sitemap XML with canonical URLs', () => {
    const xml = buildSitemapXml('2026-11-25')
    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true)
    expect(xml).toContain(`<loc>${SITE_URL}/pricing</loc>`)
    expect(xml).toContain('<lastmod>2026-11-25</lastmod>')
    expect(xml).not.toContain('/dashboard')
  })
})

describe('Storvv WhatsApp link', () => {
  it('opens a chat with Storvv, optionally with a message typed in', () => {
    expect(storvvWhatsappLink()).toBe('https://wa.me/2349163070964')
    expect(storvvWhatsappLink('Hi Storvv, I have a question.')).toBe(
      'https://wa.me/2349163070964?text=Hi%20Storvv%2C%20I%20have%20a%20question.'
    )
  })
})
