/** Shared TTL for Pinia store list fetches (receipts, folders, availability stats). */
export const STORE_LIST_FETCH_TTL_MS = 90_000

export type StoreFetchStamp = {
  storeId: string
  fetchedAt: number
}

export function isStoreFetchStampFresh(
  stamp: StoreFetchStamp | null,
  storeId: string,
  force?: boolean
): boolean {
  if (force) return false
  if (!stamp || stamp.storeId !== storeId) return false
  return Date.now() - stamp.fetchedAt < STORE_LIST_FETCH_TTL_MS
}

export function isStoreListFetchFresh(
  stamp: StoreFetchStamp | null,
  storeId: string,
  hasData: boolean,
  force?: boolean
): boolean {
  if (force) return false
  if (!stamp || stamp.storeId !== storeId || !hasData) return false
  return Date.now() - stamp.fetchedAt < STORE_LIST_FETCH_TTL_MS
}

const storeRefreshWarm = new Map<string, number>()

export function isStoreRefreshWarm(storeId: string, force?: boolean): boolean {
  if (force) return false
  const at = storeRefreshWarm.get(storeId)
  if (!at) return false
  return Date.now() - at < STORE_LIST_FETCH_TTL_MS
}

export function markStoreRefreshWarm(storeId: string): void {
  storeRefreshWarm.set(storeId, Date.now())
}

export function clearStoreDataFetchCaches(): void {
  storeRefreshWarm.clear()
}
