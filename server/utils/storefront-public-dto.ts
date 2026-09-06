import type { StorefrontPublicListing, StorefrontPublicProfile } from '~/types/storefront'

export function publicStorefrontProfileDto(profile: StorefrontPublicProfile) {
  return {
    slug: profile.slug,
    displayName: profile.displayName,
    tagline: profile.tagline || null,
    description: profile.description || null,
    logoUrl: profile.logoUrl || null,
    city: profile.city || null,
    addressPublic: profile.addressPublic || null,
    phonePublic: profile.phonePublic || null,
    whatsappE164: profile.whatsappE164 || null,
    emailPublic: profile.emailPublic || null,
    social: profile.social || {},
    collectionInfo: profile.collectionInfo || null,
    warrantyInfo: profile.warrantyInfo || null,
    currency: profile.currency || null,
    allowReservations: profile.allowReservations !== false,
    allowOnlineCheckout: profile.allowOnlineCheckout === true,
    acceptsPayments: false, // filled by handlers that check payout
  }
}

export function publicStorefrontListingDto(item: StorefrontPublicListing) {
  const toMs = (v: unknown): number | null => {
    if (!v) return null
    if (typeof v === 'number' && Number.isFinite(v)) return v
    const t = v as { toMillis?: () => number; seconds?: number }
    if (typeof t.toMillis === 'function') return t.toMillis()
    if (typeof t.seconds === 'number') return t.seconds * 1000
    if (v instanceof Date) return v.getTime()
    return null
  }

  return {
    id: item.id,
    title: item.title,
    price: item.price,
    currency: item.currency || null,
    availability: item.availability,
    categoryPath: item.categoryPath,
    categoryName: item.categoryName,
    attributes: item.attributes || [],
    description: item.description || null,
    imageUrl: item.imageUrl || null,
    firstListedAtMs: toMs(item.firstListedAt) ?? toMs(item.updatedAt),
    updatedAtMs: toMs(item.updatedAt),
  }
}
