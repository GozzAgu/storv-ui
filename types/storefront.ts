/** Public storefront types: catalogue projections + Phase 2 guest inquiries. */

export type StorefrontPublicAvailability = 'available' | 'unavailable' | 'reserved'

export type StorefrontInquiryType = 'contact' | 'reserve'
export type StorefrontInquiryStatus =
  | 'pending'
  | 'confirmed'
  | 'rejected'
  | 'cancelled'
  | 'completed'

export interface StorefrontSocialLinks {
  instagram?: string
  facebook?: string
  tiktok?: string
  website?: string
}

export interface StorefrontFolderPublish {
  enabled: boolean
  publicFieldIds: string[]
}

export interface StorefrontItemOverride {
  listed?: boolean
}

/** Private: users/{owner}/stores/{storeId}/storefrontConfig/settings */
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
  listAvailableOnly: boolean
  /** Allow guests to request a soft hold (Phase 2). Default true. */
  allowReservations?: boolean
  /** Allow guests to pay online via Paystack payment links (Phase 4). Default false. */
  allowOnlineCheckout?: boolean
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

/** Public: storefronts/{slug} */
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
  allowReservations?: boolean
  allowOnlineCheckout?: boolean
  updatedAt?: unknown
}

/** Public: storefrontListings/{slug}/items/{itemId} */
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
  reservationInquiryId?: string | null
  /** When first published to the public catalogue (preserved across syncs). */
  firstListedAt?: unknown
  updatedAt?: unknown
}

/**
 * Private guest inquiry / reservation.
 * users/{owner}/stores/{storeId}/storefrontInquiries/{id}. Admin SDK writes only.
 */
export interface StorefrontInquiry {
  id: string
  type: StorefrontInquiryType
  status: StorefrontInquiryStatus
  customerName: string
  customerPhone: string
  customerNote?: string
  listingId: string
  listingTitle: string
  listingPrice?: number
  sourceItemId: string
  sourceFolderId?: string
  storefrontSlug: string
  storeId: string
  ownerUid: string
  createdAt?: unknown
  updatedAt?: unknown
  resolvedAt?: unknown
  resolvedByUid?: string
  resolveNote?: string
  /** Payment link sent for this inquiry (merchant → customer). */
  paymentLinkToken?: string
  paymentLinkStatus?: 'unpaid' | 'paid' | 'failed' | 'expired'
  paymentLinkInvoiceNumber?: string
  /** Set when Complete creates a POS receipt + inventory decrement, or when the payment link settles. */
  receiptId?: string
  receiptNumber?: string
}

export const EMPTY_STOREFRONT_CONFIG = (): StorefrontConfig => ({
  enabled: false,
  slug: '',
  displayName: '',
  listAvailableOnly: true,
  allowReservations: true,
  allowOnlineCheckout: false,
  folderPublish: {},
  itemOverrides: {},
  social: {},
})
