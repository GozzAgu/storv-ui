import { FieldValue, Timestamp, type Firestore } from 'firebase-admin/firestore'
import type {
  StorefrontInquiry,
  StorefrontPublicAvailability,
  StorefrontPublicListing,
} from '~/types/storefront'

/** How long a guest reservation holds a listing before it lapses back to available. */
export const STOREFRONT_RESERVATION_HOLD_MS = 48 * 60 * 60 * 1000

/** Open guest reservations one phone number may hold at a single storefront. */
export const STOREFRONT_MAX_OPEN_RESERVATIONS_PER_PHONE = 3

/** Firestore Timestamp, Date, `{ seconds }` or epoch ms to epoch ms; null when unreadable. */
export function timestampToMs(value: unknown): number | null {
  if (value == null) return null
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  if (value instanceof Date) return value.getTime()
  const t = value as { toMillis?: () => number; seconds?: number }
  if (typeof t.toMillis === 'function') return t.toMillis()
  if (typeof t.seconds === 'number') return t.seconds * 1000
  return null
}

/**
 * A guest hold whose `reservedUntil` has passed. Holds without one (merchant-confirmed,
 * checkout payment links) do not lapse here; their own flows release them.
 */
export function isReservationExpired(
  listing: Pick<StorefrontPublicListing, 'availability' | 'reservedUntil'>,
  nowMs: number = Date.now()
): boolean {
  if (listing.availability !== 'reserved') return false
  const until = timestampToMs(listing.reservedUntil)
  return until != null && until <= nowMs
}

/** Availability as guests should see it: a lapsed hold reads as available. */
export function effectiveListingAvailability(
  listing: Pick<StorefrontPublicListing, 'availability' | 'reservedUntil'>,
  nowMs: number = Date.now()
): StorefrontPublicAvailability {
  return isReservationExpired(listing, nowMs) ? 'available' : listing.availability
}

/** Digits only, so `+234 801...` and `+234801...` count as the same customer. */
export function inquiryPhoneKey(phone: string): string {
  return String(phone || '').replace(/\D/g, '')
}

/**
 * Pending reserve requests still inside their hold, plus confirmed ones. Requests made before
 * holds expired use their creation time plus the hold window.
 */
export function countOpenReservations(
  inquiries: Array<Pick<StorefrontInquiry, 'type' | 'status' | 'reservedUntil' | 'createdAt'>>,
  nowMs: number = Date.now()
): number {
  return inquiries.filter((inq) => {
    if (inq.type !== 'reserve') return false
    if (inq.status === 'confirmed') return true
    if (inq.status !== 'pending') return false
    const createdMs = timestampToMs(inq.createdAt)
    const until =
      timestampToMs(inq.reservedUntil) ??
      (createdMs != null ? createdMs + STOREFRONT_RESERVATION_HOLD_MS : null)
    return until == null || until > nowMs
  }).length
}

export type ReleaseExpiredReservationsResult = {
  scanned: number
  released: number
  failed: number
}

/**
 * Cron: put lapsed guest holds back on sale. Each listing is rechecked in its own transaction,
 * so a hold the merchant confirmed a moment ago (which clears `reservedUntil`) is skipped.
 */
export async function releaseExpiredReservations(
  db: Firestore,
  nowMs: number = Date.now(),
  batchLimit = 300
): Promise<ReleaseExpiredReservationsResult> {
  const result: ReleaseExpiredReservationsResult = { scanned: 0, released: 0, failed: 0 }
  const snap = await db
    .collectionGroup('items')
    .where('reservedUntil', '<=', Timestamp.fromMillis(nowMs))
    .limit(batchLimit)
    .get()

  for (const doc of snap.docs) {
    // `items` is a common name; only storefrontListings/{slug}/items are listings.
    if (doc.ref.parent.parent?.parent.id !== 'storefrontListings') continue
    result.scanned += 1
    try {
      const released = await db.runTransaction(async (tx) => {
        const fresh = await tx.get(doc.ref)
        if (!fresh.exists) return false
        const listing = fresh.data() as StorefrontPublicListing
        if (!isReservationExpired(listing, nowMs)) return false
        tx.update(doc.ref, {
          availability: 'available',
          reservationInquiryId: null,
          reservedUntil: null,
          updatedAt: FieldValue.serverTimestamp(),
        })
        return true
      })
      if (released) result.released += 1
    } catch (err) {
      result.failed += 1
      console.error('[storefront-reservations] release failed', doc.ref.path, err)
    }
  }
  return result
}
