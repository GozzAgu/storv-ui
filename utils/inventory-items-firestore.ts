import type { Firestore, QueryDocumentSnapshot } from 'firebase/firestore'
import {
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getDocs,
  type CollectionReference,
} from 'firebase/firestore'
import type { InventoryItem } from '~/stores/inventory'

/** Firestore page size (limit + startAfter) for the UI's paginated item list. */
export const INVENTORY_FIRESTORE_PAGE_SIZE = 20
/**
 * Page size used only when fetching an entire folder's items at once
 * (fetchAllInventoryItemsChunked - quick sale, search, bulk export, receipt lines).
 * Larger than the UI page size on purpose: cursor pagination is a sequential chain of
 * network round trips, so a bigger chunk means far fewer round trips for the same total
 * item count (e.g. a 200-item folder: ~1 round trip instead of 10 at size 20).
 */
export const INVENTORY_FIRESTORE_ALL_CHUNK_SIZE = 300
const PAGE_CACHE_TTL_MS = 30_000
const ALL_CHUNK_CACHE_TTL_MS = 45_000

const pageDataCache = new Map<string, { items: InventoryItem[]; fetchedAt: number }>()
const allItemsCache = new Map<string, { items: InventoryItem[]; fetchedAt: number }>()

export function clearInventoryItemQueryCaches() {
  pageDataCache.clear()
  allItemsCache.clear()
}

export function invalidateFolderItemCaches(folderId: string) {
  allItemsCache.delete(folderId)
  const prefix = `${folderId}:`
  for (const k of pageDataCache.keys()) {
    if (k.startsWith(prefix)) pageDataCache.delete(k)
  }
}

function pageCacheKey(folderId: string, page: number, pageSize: number) {
  return `${folderId}:${page}:${pageSize}`
}

export function docToInventoryItem(
  d: QueryDocumentSnapshot,
  folderId: string,
  queryUserId: string
): InventoryItem {
  const data = d.data()
  const exclude = [
    'folderId',
    'storeId',
    'createdAt',
    'updatedAt',
    'createdBy',
    'dateIn',
    'dateOut',
    'pendingSaleReceiptId',
    'pendingSaleAt',
    'sellerLoanOutId',
    'sellerLoanPartyName',
    'sellerLoanPartyPhone',
    'sellerLoanOutAt',
    'swapIn',
    'swapInReceiptId',
    'buyback',
    'buybackId',
    'buybackPrice',
    'unitCost',
    'discountPercentage',
    'discountAmount',
    'originalPrice',
    'discountedPrice',
  ]
  return {
    id: d.id,
    folderId: data.folderId || folderId,
    storeId: typeof data.storeId === 'string' ? data.storeId : '',
    ...Object.fromEntries(Object.entries(data).filter(([key]) => !exclude.includes(key))),
    dateIn: data.dateIn?.toDate
      ? data.dateIn.toDate()
      : data.dateIn
      ? new Date(data.dateIn)
      : data.createdAt?.toDate
      ? data.createdAt.toDate()
      : new Date(data.createdAt) || new Date(),
    dateOut: data.dateOut?.toDate
      ? data.dateOut.toDate()
      : data.dateOut
      ? new Date(data.dateOut)
      : undefined,
    pendingSaleReceiptId:
      typeof data.pendingSaleReceiptId === 'string' ? data.pendingSaleReceiptId : undefined,
    pendingSaleAt: data.pendingSaleAt?.toDate
      ? data.pendingSaleAt.toDate()
      : data.pendingSaleAt
      ? new Date(data.pendingSaleAt as string | number)
      : undefined,
    sellerLoanOutId: data.sellerLoanOutId ?? undefined,
    sellerLoanPartyName: data.sellerLoanPartyName ?? undefined,
    sellerLoanPartyPhone:
      typeof data.sellerLoanPartyPhone === 'string' ? data.sellerLoanPartyPhone : undefined,
    sellerLoanOutAt: data.sellerLoanOutAt?.toDate
      ? data.sellerLoanOutAt.toDate()
      : data.sellerLoanOutAt
      ? new Date(data.sellerLoanOutAt as string | number)
      : undefined,
    swapIn: data.swapIn || false,
    swapInReceiptId: data.swapInReceiptId || undefined,
    buyback: data.buyback || false,
    buybackId: typeof data.buybackId === 'string' ? data.buybackId : undefined,
    buybackPrice: typeof data.buybackPrice === 'number' ? data.buybackPrice : undefined,
    unitCost: typeof data.unitCost === 'number' ? data.unitCost : undefined,
    discountPercentage: data.discountPercentage || undefined,
    discountAmount: data.discountAmount || undefined,
    originalPrice: data.originalPrice || undefined,
    discountedPrice: data.discountedPrice || undefined,
    createdAt: data.createdAt?.toDate
      ? data.createdAt.toDate()
      : new Date(data.createdAt) || new Date(),
    updatedAt: data.updatedAt?.toDate
      ? data.updatedAt.toDate()
      : new Date(data.updatedAt) || undefined,
    createdBy: data.createdBy || queryUserId,
  } as InventoryItem
}

function buildOrderedPageQuery(
  itemsRef: CollectionReference,
  folderId: string,
  queryUserId: string,
  isStaff: boolean,
  pageSize: number,
  after: QueryDocumentSnapshot | null
) {
  const wf = where('folderId', '==', folderId)
  const ob = orderBy('createdAt', 'desc')
  if (isStaff) {
    return after
      ? query(itemsRef, wf, ob, startAfter(after), limit(pageSize))
      : query(itemsRef, wf, ob, limit(pageSize))
  }
  const wc = where('createdBy', '==', queryUserId)
  return after
    ? query(itemsRef, wf, wc, ob, startAfter(after), limit(pageSize))
    : query(itemsRef, wf, wc, ob, limit(pageSize))
}

/** Unordered fallback only for first chunk (no cursor). */
function buildUnorderedPageQuery(
  itemsRef: CollectionReference,
  folderId: string,
  queryUserId: string,
  isStaff: boolean,
  pageSize: number
) {
  const wf = where('folderId', '==', folderId)
  if (isStaff) {
    return query(itemsRef, wf, limit(pageSize))
  }
  return query(itemsRef, wf, where('createdBy', '==', queryUserId), limit(pageSize))
}

async function getOnePageOrdered(
  itemsRef: CollectionReference,
  folderId: string,
  queryUserId: string,
  isStaff: boolean,
  pageSize: number,
  after: QueryDocumentSnapshot | null
) {
  try {
    const q = buildOrderedPageQuery(itemsRef, folderId, queryUserId, isStaff, pageSize, after)
    return await getDocs(q)
  } catch {
    if (after) {
      throw new Error('A database index is required for inventory pagination. Please contact Storvv support.')
    }
    return getDocs(buildUnorderedPageQuery(itemsRef, folderId, queryUserId, isStaff, pageSize))
  }
}

function sortItemsDesc(items: InventoryItem[]) {
  items.sort((a, b) => {
    const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt)
    const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt)
    return dateB.getTime() - dateA.getTime()
  })
}

/**
 * Pages with limit + startAfter (createdAt desc). Visits pages 1..target sequentially.
 */
export async function getInventoryItemsPage(
  _db: Firestore,
  params: {
    itemsRef: CollectionReference
    folderId: string
    queryUserId: string
    isStaff: boolean
    page: number
    pageSize: number
    force: boolean
  }
): Promise<InventoryItem[]> {
  const { itemsRef, folderId, queryUserId, isStaff, page, pageSize, force } = params
  if (page < 1) throw new Error('page must be >= 1')

  const pKey = pageCacheKey(folderId, page, pageSize)
  if (!force) {
    const hit = pageDataCache.get(pKey)
    if (hit && Date.now() - hit.fetchedAt < PAGE_CACHE_TTL_MS) {
      return hit.items
    }
  }

  let cursor: QueryDocumentSnapshot | null = null
  let lastPageItems: InventoryItem[] = []

  for (let p = 1; p <= page; p++) {
    const snap = await getOnePageOrdered(
      itemsRef,
      folderId,
      queryUserId,
      isStaff,
      pageSize,
      p === 1 ? null : cursor
    )
    lastPageItems = snap.docs.map((doc) => docToInventoryItem(doc, folderId, queryUserId))
    sortItemsDesc(lastPageItems)
    pageDataCache.set(pageCacheKey(folderId, p, pageSize), {
      items: lastPageItems,
      fetchedAt: Date.now(),
    })

    if (snap.empty) {
      if (p < page) {
        pageDataCache.set(pKey, { items: [], fetchedAt: Date.now() })
        return []
      }
      return lastPageItems
    }

    cursor = snap.docs[snap.docs.length - 1]!

    if (snap.docs.length < pageSize) {
      if (p < page) {
        pageDataCache.set(pKey, { items: [], fetchedAt: Date.now() })
        return []
      }
      return lastPageItems
    }

    if (p === page) {
      return lastPageItems
    }
  }

  return lastPageItems
}

export async function fetchAllInventoryItemsChunked(
  _db: Firestore,
  params: {
    itemsRef: CollectionReference
    folderId: string
    queryUserId: string
    isStaff: boolean
    pageSize: number
    force: boolean
  }
): Promise<InventoryItem[]> {
  const { itemsRef, folderId, queryUserId, isStaff, pageSize, force } = params
  if (!force) {
    const hit = allItemsCache.get(folderId)
    if (hit && Date.now() - hit.fetchedAt < ALL_CHUNK_CACHE_TTL_MS) {
      return hit.items
    }
  }

  const all: InventoryItem[] = []
  let cursor: QueryDocumentSnapshot | null = null

  try {
    for (;;) {
      const snap = await getOnePageOrdered(
        itemsRef,
        folderId,
        queryUserId,
        isStaff,
        pageSize,
        cursor
      )
      if (snap.empty) break
      for (const doc of snap.docs) {
        all.push(docToInventoryItem(doc, folderId, queryUserId))
      }
      if (snap.docs.length < pageSize) break
      cursor = snap.docs[snap.docs.length - 1]!
    }
  } catch {
    const snap = await getDocs(
      buildUnorderedPageQuery(itemsRef, folderId, queryUserId, isStaff, 5000)
    )
    for (const doc of snap.docs) {
      all.push(docToInventoryItem(doc, folderId, queryUserId))
    }
  }

  sortItemsDesc(all)
  allItemsCache.set(folderId, { items: all, fetchedAt: Date.now() })
  return all
}
