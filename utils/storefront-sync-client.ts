/**
 * Client-side storefront projection sync.
 * Writes only allowlisted public fields to top-level storefront collections.
 */

import {
  deleteDoc,
  getDoc,
  serverTimestamp,
  setDoc,
  type DocumentData,
  type DocumentReference,
  type Firestore,
} from 'firebase/firestore'
import type { InventoryFolder, InventoryItem } from '~/stores/inventory'
import {
  getStorefrontConfigDocument,
  getStorefrontListingDocument,
  getStorefrontPublicProfileDocument,
} from '~/composables/useFirestorePaths'
import {
  buildStorefrontListing,
  buildStorefrontPublicProfile,
} from '~/utils/storefront-projection'
import { isValidStorefrontSlug } from '~/utils/storefront-slug'
import {
  EMPTY_STOREFRONT_CONFIG,
  type StorefrontConfig,
  type StorefrontPublicListing,
} from '~/types/storefront'

function stripUndefined<T extends Record<string, unknown>>(obj: T): T {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as T
}

function isPermissionDenied(err: unknown): boolean {
  const code = (err as { code?: string })?.code || ''
  const message = String((err as { message?: string })?.message || '')
  return (
    code === 'permission-denied' ||
    message.toLowerCase().includes('insufficient permissions') ||
    message.toLowerCase().includes('permission_denied')
  )
}

/** getDoc that treats missing-or-unreadable public docs as non-existent. */
async function getDocIfPresent<T extends DocumentData = DocumentData>(
  ref: DocumentReference
): Promise<{ exists: boolean; data: T | undefined }> {
  try {
    const snap = await getDoc(ref)
    return { exists: snap.exists(), data: snap.exists() ? (snap.data() as T) : undefined }
  } catch (err) {
    if (isPermissionDenied(err)) return { exists: false, data: undefined }
    throw err
  }
}

export function parseStorefrontConfig(raw: Record<string, unknown> | undefined): StorefrontConfig {
  const base = EMPTY_STOREFRONT_CONFIG()
  if (!raw) return base
  return {
    ...base,
    enabled: Boolean(raw.enabled),
    slug: String(raw.slug || '').trim().toLowerCase(),
    displayName: String(raw.displayName || '').trim(),
    tagline: raw.tagline != null ? String(raw.tagline) : undefined,
    description: raw.description != null ? String(raw.description) : undefined,
    logoUrl: raw.logoUrl != null ? String(raw.logoUrl) : undefined,
    city: raw.city != null ? String(raw.city) : undefined,
    addressPublic: raw.addressPublic != null ? String(raw.addressPublic) : undefined,
    phonePublic: raw.phonePublic != null ? String(raw.phonePublic) : undefined,
    whatsappE164: raw.whatsappE164 != null ? String(raw.whatsappE164) : undefined,
    emailPublic: raw.emailPublic != null ? String(raw.emailPublic) : undefined,
    social:
      raw.social && typeof raw.social === 'object'
        ? (raw.social as StorefrontConfig['social'])
        : {},
    collectionInfo: raw.collectionInfo != null ? String(raw.collectionInfo) : undefined,
    warrantyInfo: raw.warrantyInfo != null ? String(raw.warrantyInfo) : undefined,
    listAvailableOnly: raw.listAvailableOnly !== false,
    allowReservations: raw.allowReservations !== false,
    allowOnlineCheckout: raw.allowOnlineCheckout === true,
    folderPublish:
      raw.folderPublish && typeof raw.folderPublish === 'object'
        ? (raw.folderPublish as StorefrontConfig['folderPublish'])
        : {},
    itemOverrides:
      raw.itemOverrides && typeof raw.itemOverrides === 'object'
        ? (raw.itemOverrides as StorefrontConfig['itemOverrides'])
        : {},
  }
}

export async function fetchStorefrontConfig(
  db: Firestore,
  ownerUid: string,
  storeId: string
): Promise<StorefrontConfig> {
  const snap = await getDoc(getStorefrontConfigDocument(db, ownerUid, storeId))
  if (!snap.exists()) return EMPTY_STOREFRONT_CONFIG()
  return parseStorefrontConfig(snap.data() as Record<string, unknown>)
}

export async function saveStorefrontConfig(
  db: Firestore,
  ownerUid: string,
  storeId: string,
  config: StorefrontConfig
): Promise<void> {
  const slug = config.slug.trim().toLowerCase()
  if (config.enabled && !isValidStorefrontSlug(slug)) {
    throw new Error('Choose a valid storefront URL slug (lowercase letters, numbers, hyphens).')
  }

  const ref = getStorefrontConfigDocument(db, ownerUid, storeId)
  const existing = await getDoc(ref)
  const payload = stripUndefined({
    ...config,
    slug,
    folderPublish: config.folderPublish || {},
    itemOverrides: config.itemOverrides || {},
    social: config.social || {},
    updatedAt: serverTimestamp(),
    createdAt: existing.exists()
      ? existing.data()?.createdAt ?? serverTimestamp()
      : serverTimestamp(),
  })
  await setDoc(ref, payload, { merge: true })
}

export async function unpublishStorefrontSlug(db: Firestore, slug: string): Promise<void> {
  if (!slug) return
  const ref = getStorefrontPublicProfileDocument(db, slug)
  const existing = await getDocIfPresent(ref)
  if (!existing.exists) return
  await setDoc(ref, { isPublished: false, updatedAt: serverTimestamp() }, { merge: true })
}

export async function publishStorefrontProfile(
  db: Firestore,
  ownerUid: string,
  storeId: string,
  config: StorefrontConfig,
  options?: { previousSlug?: string; currency?: string }
): Promise<void> {
  const profile = buildStorefrontPublicProfile({
    config,
    ownerUid,
    storeId,
    currency: options?.currency,
  })
  if (!profile) return

  const slug = profile.slug
  const previousSlug = options?.previousSlug
  if (previousSlug && previousSlug !== slug) {
    await unpublishStorefrontSlug(db, previousSlug).catch(() => undefined)
  }

  await setDoc(
    getStorefrontPublicProfileDocument(db, slug),
    stripUndefined({
      ...profile,
      updatedAt: serverTimestamp(),
    }),
    { merge: true }
  )
}

export async function upsertStorefrontListing(
  db: Firestore,
  slug: string,
  listing: StorefrontPublicListing
): Promise<void> {
  const ref = getStorefrontListingDocument(db, slug, listing.id)
  if (!listing.isListed) {
    await deleteDoc(ref).catch(() => undefined)
    return
  }
  const existing = await getDocIfPresent<StorefrontPublicListing>(ref)
  const firstListedAt = existing.exists
    ? existing.data?.firstListedAt ?? serverTimestamp()
    : serverTimestamp()
  await setDoc(
    ref,
    stripUndefined({
      ...listing,
      firstListedAt,
      updatedAt: serverTimestamp(),
    }),
    { merge: true }
  )
}

export async function deleteStorefrontListing(
  db: Firestore,
  slug: string,
  itemId: string
): Promise<void> {
  if (!slug || !itemId) return
  await deleteDoc(getStorefrontListingDocument(db, slug, itemId)).catch(() => undefined)
}

/** Fire-and-forget sync for a single inventory item after create/update/delete. */
export async function syncStorefrontItemFromInventory(params: {
  db: Firestore
  ownerUid: string
  storeId: string
  item: InventoryItem | null
  itemId: string
  folder: InventoryFolder | null
  folders: InventoryFolder[]
  currency?: string
}): Promise<void> {
  const { db, ownerUid, storeId, item, itemId, folder, folders, currency } = params
  const config = await fetchStorefrontConfig(db, ownerUid, storeId)
  if (!config.slug) return

  if (!item || !folder || !config.enabled) {
    await deleteStorefrontListing(db, config.slug, itemId)
    return
  }

  const listing = buildStorefrontListing({
    item,
    folder,
    folders,
    config,
    ownerUid,
    currency,
  })
  if (!listing || !listing.isListed) {
    await deleteStorefrontListing(db, config.slug, itemId)
    return
  }

  // Preserve soft reservation hold unless inventory is no longer sellable.
  const existingSnap = await getDocIfPresent<StorefrontPublicListing>(
    getStorefrontListingDocument(db, config.slug, itemId)
  )
  if (existingSnap.exists && existingSnap.data) {
    const existing = existingSnap.data
    if (
      existing.reservationInquiryId &&
      (existing.availability === 'reserved' || listing.availability === 'available')
    ) {
      if (listing.availability === 'available') {
        listing.availability = 'reserved'
        listing.reservationInquiryId = existing.reservationInquiryId
      } else {
        listing.reservationInquiryId = null
      }
    }
  }

  await upsertStorefrontListing(db, config.slug, listing)
}
