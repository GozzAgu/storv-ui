import { defineEventHandler, getHeader, getRequestURL, setHeader } from 'h3'
import { getAdminFirestore } from '~/server/utils/firebase-admin'
import { renderStorefrontOgHtml } from '~/server/utils/storefront-og-html'
import {
  formatStorefrontMoney,
  isLinkPreviewBot,
} from '~/utils/storefront-share'
import type { StorefrontPublicListing, StorefrontPublicProfile } from '~/types/storefront'

/**
 * Serve Open Graph HTML to link-preview crawlers for /store/* (SPA otherwise).
 */
export default defineEventHandler(async (event) => {
  const path = event.path || ''
  if (!path.startsWith('/store/')) return
  if ((event.method || 'GET').toUpperCase() !== 'GET') return

  const ua = getHeader(event, 'user-agent') || ''
  if (!isLinkPreviewBot(ua)) return

  const matchProduct = path.match(/^\/store\/([^/?#]+)\/p\/([^/?#]+)\/?$/)
  const matchStore = path.match(/^\/store\/([^/?#]+)\/?$/)
  if (!matchProduct && !matchStore) return

  const slug = decodeURIComponent((matchProduct || matchStore)![1]).toLowerCase()
  const itemId = matchProduct ? decodeURIComponent(matchProduct[2]) : ''

  const origin = getRequestURL(event).origin
  try {
    const adminDb = getAdminFirestore()
    const profileSnap = await adminDb.collection('storefronts').doc(slug).get()
    if (!profileSnap.exists) return

    const profile = profileSnap.data() as StorefrontPublicProfile
    if (!profile.isPublished) return

    if (itemId) {
      const itemSnap = await adminDb
        .collection('storefrontListings')
        .doc(slug)
        .collection('items')
        .doc(itemId)
        .get()
      if (!itemSnap.exists) return
      const item = itemSnap.data() as StorefrontPublicListing
      if (!item.isListed) return

      const price = formatStorefrontMoney(item.price, item.currency || profile.currency)
      const avail =
        item.availability === 'available'
          ? 'Available'
          : item.availability === 'reserved'
            ? 'Reserved'
            : 'Unavailable'
      const title = `${item.title} · ${profile.displayName}`
      const description = `${price} · ${avail}. ${item.description || profile.tagline || ''}`.trim()
      const url = `${origin}/store/${encodeURIComponent(slug)}/p/${encodeURIComponent(itemId)}`

      setHeader(event, 'content-type', 'text/html; charset=utf-8')
      setHeader(event, 'cache-control', 'public, max-age=300')
      return renderStorefrontOgHtml({
        title,
        description,
        url,
        imageUrl: item.imageUrl || profile.logoUrl || null,
        siteName: profile.displayName,
      })
    }

    const title = `${profile.displayName} · Storvv`
    const description =
      profile.tagline ||
      profile.description ||
      `Browse available products from ${profile.displayName}`
    const url = `${origin}/store/${encodeURIComponent(slug)}`

    setHeader(event, 'content-type', 'text/html; charset=utf-8')
    setHeader(event, 'cache-control', 'public, max-age=300')
    return renderStorefrontOgHtml({
      title,
      description,
      url,
      imageUrl: profile.logoUrl || null,
      siteName: profile.displayName,
    })
  } catch {
    // Fall through to SPA if Admin/Firestore is unavailable.
  }
})
