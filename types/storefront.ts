/** Public storefront Phase 1 — types for config + customer-facing projections. */

export type StorefrontPublicAvailability = 'available' | 'unavailable'

export interface StorefrontSocialLinks {
  instagram?: string
  facebook?: string
  tiktok?: string
  website?: string
}

export interface StorefrontFolderPublish {
  /** When true, eligible products in this category can appear on the storefront. */
  enabled: boolean
  /** Template field ids allowed on the public listing (beyond title/price). */
  publicFieldIds: string[]
}

export interface StorefrontItemOverride {
  /** Explicit false hides the item even if the category is published. */
  listed?: boolean
}

/** Private per-store config: users/{owner}/stores/{storeId}/storefrontConfig/settings */
export interface StorefrontConfig {
  enabled: boolean
  slug: string
  displayName: string
  tagline?: string
  description?: string
  logoUrl?: string
  city?: string
  addressPublic?: string
  phonePublic?: string
  whatsappE164?: string
  emailPublic?: string
  social?: StorefrontSocialLinks
  collectionInfo?: string
  warrantyInfo?: string
  /** Only list items that resolve to public "available". */
  listAvailableOnly: boolean
  folderPublish: Record<string, StorefrontFolderPublish>
  itemOverrides: Record<string, StorefrontItemOverride>
  updatedAt?: unknown
  createdAt?: unknown
}

export interface StorefrontPublicAttribute {
  key: string
  label: string
  value: string
}

/** Top-level public profile: storefronts/{slug} */
export interface StorefrontPublicProfile {
  slug: string
  isPublished: boolean
  ownerUid: string
  storeId: string
  displayName: string
  tagline?: string
  description?: string
  logoUrl?: string
  city?: string
  addressPublic?: string
  phonePublic?: string
  whatsappE164?: string
  emailPublic?: string
  social?: StorefrontSocialLinks
  collectionInfo?: string
  warrantyInfo?: string
  currency?: string
  updatedAt?: unknown
}

/** Public listing: storefrontListings/{slug}/items/{itemId} */
export interface StorefrontPublicListing {
  id: string
  isListed: boolean
  title: string
  price: number
  currency?: string
  availability: StorefrontPublicAvailability
  categoryPath: string
  categoryName: string
  attributes: StorefrontPublicAttribute[]
  description?: string
  imageUrl?: string
  searchText: string
  sortPrice: number
  sourceItemId: string
  sourceFolderId: string
  ownerUid: string
  storeId: string
  updatedAt?: unknown
}

export const EMPTY_STOREFRONT_CONFIG = (): StorefrontConfig => ({
  enabled: false,
  slug: '',
  displayName: '',
  listAvailableOnly: true,
  folderPublish: {},
  itemOverrides: {},
  social: {},
})
