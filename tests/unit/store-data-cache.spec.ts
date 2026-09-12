import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  isStoreFetchStampFresh,
  isStoreListFetchFresh,
  STORE_LIST_FETCH_TTL_MS,
  type StoreFetchStamp,
} from '~/utils/store-data-cache'

describe('store-data-cache', () => {
  const storeId = 'store_test_123'

  it('marks fresh stamps as fresh within TTL for web', () => {
    const stamp: StoreFetchStamp = {
      storeId,
      fetchedAt: Date.now() - 1000,
    }
    expect(isStoreFetchStampFresh(stamp, storeId)).toBe(true)
  })

  it('marks expired stamps as stale on web when past TTL', () => {
    const stamp: StoreFetchStamp = {
      storeId,
      fetchedAt: Date.now() - (STORE_LIST_FETCH_TTL_MS + 5000),
    }
    expect(isStoreFetchStampFresh(stamp, storeId)).toBe(false)
  })

  it('force parameter always bypasses freshness check', () => {
    const stamp: StoreFetchStamp = {
      storeId,
      fetchedAt: Date.now(),
    }
    expect(isStoreFetchStampFresh(stamp, storeId, true)).toBe(false)
    expect(isStoreListFetchFresh(stamp, storeId, true, true)).toBe(false)
  })

  it('mismatched storeId is never fresh', () => {
    const stamp: StoreFetchStamp = {
      storeId: 'other_store',
      fetchedAt: Date.now(),
    }
    expect(isStoreFetchStampFresh(stamp, storeId)).toBe(false)
  })

  it('null or missing stamp is never fresh', () => {
    expect(isStoreFetchStampFresh(null, storeId)).toBe(false)
  })
})
