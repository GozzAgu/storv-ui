import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import { SHARE_IMAGE, SITE_NAME, STORVV_CONTACT, canonicalUrl } from '~/utils/marketing-seo'

interface MarketingSeo {
  title: string
  description: MaybeRefOrGetter<string>
  /** Path on the marketing site, e.g. "/pricing". */
  path: string
  /** schema.org objects for this page. */
  jsonLd?: MaybeRefOrGetter<Record<string, unknown>[]>
}

/**
 * Title, description, canonical URL, link-preview tags (Open Graph, X) and structured data for
 * one marketing page. Rendered into the server HTML, so crawlers and chat apps see it.
 */
export function useMarketingSeo(seo: MarketingSeo) {
  const url = canonicalUrl(seo.path)
  const description = computed(() => toValue(seo.description))

  useSeoMeta({
    title: seo.title,
    description,
    ogType: 'website',
    ogSiteName: SITE_NAME,
    ogLocale: 'en_NG',
    ogUrl: url,
    ogTitle: seo.title,
    ogDescription: description,
    ogImage: SHARE_IMAGE.url,
    ogImageWidth: SHARE_IMAGE.width,
    ogImageHeight: SHARE_IMAGE.height,
    ogImageAlt: SHARE_IMAGE.alt,
    ogImageType: 'image/png',
    twitterCard: 'summary_large_image',
    twitterSite: STORVV_CONTACT.xHandle,
    twitterTitle: seo.title,
    twitterDescription: description,
    twitterImage: SHARE_IMAGE.url,
    twitterImageAlt: SHARE_IMAGE.alt,
  })

  useHead({
    link: [{ rel: 'canonical', href: url }],
    script: computed(() =>
      (toValue(seo.jsonLd) ?? []).map((data, i) => ({
        key: `ld-${i}`,
        type: 'application/ld+json',
        // Escape "<" so an answer can never close the script tag early.
        innerHTML: JSON.stringify(data).replace(/</g, '\\u003c'),
      }))
    ),
  })
}
