import { CLIENT_ONLY_ROUTE_PATTERNS, MARKETING_PAGE_PATHS } from './marketing-paths'
import { canonicalUrl } from './marketing-seo'

/** How often each public page tends to change, and how much it matters, for search engines. */
const PAGE_HINTS: Record<string, { changefreq: string; priority: string }> = {
  '/': { changefreq: 'weekly', priority: '1.0' },
  '/pricing': { changefreq: 'weekly', priority: '0.9' },
  '/features': { changefreq: 'weekly', priority: '0.9' },
  '/help': { changefreq: 'weekly', priority: '0.7' },
  '/security': { changefreq: 'monthly', priority: '0.6' },
  '/about': { changefreq: 'monthly', priority: '0.6' },
  '/privacy': { changefreq: 'yearly', priority: '0.3' },
  '/terms': { changefreq: 'yearly', priority: '0.3' },
}

/** The public marketing pages, i.e. every marketing path that has real content to index. */
export function sitemapPaths(): string[] {
  const clientOnly = CLIENT_ONLY_ROUTE_PATTERNS as readonly string[]
  return MARKETING_PAGE_PATHS.filter((path) => !clientOnly.includes(path))
}

export function buildSitemapXml(lastmod: string): string {
  const urls = sitemapPaths().map((path) => {
    const hint = PAGE_HINTS[path] ?? { changefreq: 'monthly', priority: '0.5' }
    return [
      '  <url>',
      `    <loc>${canonicalUrl(path)}</loc>`,
      `    <lastmod>${lastmod}</lastmod>`,
      `    <changefreq>${hint.changefreq}</changefreq>`,
      `    <priority>${hint.priority}</priority>`,
      '  </url>',
    ].join('\n')
  })
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls,
    '</urlset>',
    '',
  ].join('\n')
}
