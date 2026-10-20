import { describe, expect, it } from 'vitest'
import { Timestamp } from 'firebase-admin/firestore'
import {
  countOpenReservations,
  effectiveListingAvailability,
  inquiryPhoneKey,
  isReservationExpired,
  STOREFRONT_RESERVATION_HOLD_MS,
} from '~/server/utils/storefront-reservation'
import { publicStorefrontListingDto } from '~/server/utils/storefront-public-dto'
import type { StorefrontPublicListing } from '~/types/storefront'

const NOW = 1_800_000_000_000

describe('storefront reservation expiry', () => {
  it('treats a reserved listing past reservedUntil as available', () => {
    const listing = {
      availability: 'reserved' as const,
      reservedUntil: Timestamp.fromMillis(NOW - 1),
    }
    expect(isReservationExpired(listing, NOW)).toBe(true)
    expect(effectiveListingAvailability(listing, NOW)).toBe('available')
  })

  it('keeps a hold that has not lapsed, or that has no expiry', () => {
    expect(
      effectiveListingAvailability(
        { availability: 'reserved', reservedUntil: Timestamp.fromMillis(NOW + 60_000) },
        NOW
      )
    ).toBe('reserved')
    expect(effectiveListingAvailability({ availability: 'reserved' }, NOW)).toBe('reserved')
    expect(
      effectiveListingAvailability({ availability: 'reserved', reservedUntil: null }, NOW)
    ).toBe('reserved')
  })

  it('never makes an unavailable listing available', () => {
    expect(
      effectiveListingAvailability(
        { availability: 'unavailable', reservedUntil: Timestamp.fromMillis(NOW - 1) },
        NOW
      )
    ).toBe('unavailable')
  })

  it('shows a lapsed hold as available in the public DTO', () => {
    const dto = publicStorefrontListingDto({
      id: 'l1',
      isListed: true,
      title: 'Phone',
      price: 1000,
      availability: 'reserved',
      reservedUntil: Timestamp.fromMillis(Date.now() - 1000),
      categoryPath: 'Phones',
      categoryName: 'Phones',
      attributes: [],
      searchText: 'phone',
      sortPrice: 1000,
      sourceItemId: 'i1',
      sourceFolderId: 'f1',
      ownerUid: 'o1',
      storeId: 's1',
    } as StorefrontPublicListing)
    expect(dto.availability).toBe('available')
    expect(dto).not.toHaveProperty('reservedUntil')
  })
})

describe('open reservations per phone', () => {
  it('normalises phone formatting to digits', () => {
    expect(inquiryPhoneKey('+234 (801) 234-5678')).toBe('2348012345678')
  })

  it('counts pending unexpired and confirmed reserve requests only', () => {
    const live = Timestamp.fromMillis(NOW + 1000)
    const lapsed = Timestamp.fromMillis(NOW - 1000)
    const count = countOpenReservations(
      [
        { type: 'reserve', status: 'pending', reservedUntil: live },
        { type: 'reserve', status: 'pending', reservedUntil: lapsed },
        { type: 'reserve', status: 'confirmed', reservedUntil: null },
        { type: 'reserve', status: 'rejected', reservedUntil: live },
        { type: 'contact', status: 'pending' },
      ],
      NOW
    )
    expect(count).toBe(2)
  })

  it('ages requests made before expiry existed by their creation time', () => {
    const recent = Timestamp.fromMillis(NOW - 1000)
    const old = Timestamp.fromMillis(NOW - STOREFRONT_RESERVATION_HOLD_MS - 1000)
    expect(
      countOpenReservations(
        [
          { type: 'reserve', status: 'pending', createdAt: recent },
          { type: 'reserve', status: 'pending', createdAt: old },
        ],
        NOW
      )
    ).toBe(1)
  })
})
