import {
  getDocs,
  query,
  orderBy,
  limit,
  startAfter,
  type QueryDocumentSnapshot,
  type Query,
} from 'firebase/firestore'

import { useFirestore } from '~/composables/useFirestore'
import { useAuthStore } from '~/stores/auth'
import {
  getQueryUserId,
  getCustomerBuybacksCollection,
  getSellerLoanOutsCollection,
} from '~/composables/useFirestorePaths'
import { getCurrentStoreId } from '~/composables/useCurrentStore'
import type { CustomerBuyback } from '~/stores/customerBuybacks'
import type { SellerLoanOut } from '~/stores/sellerLoanOuts'

const PAGE_SIZE = 500

function snapshotToDate(v: unknown): Date | undefined {
  if (
    v &&
    typeof v === 'object' &&
    'toDate' in v &&
    typeof (v as { toDate: () => Date }).toDate === 'function'
  ) {
    return (v as { toDate: () => Date }).toDate()
  }
  if (v instanceof Date) return v
  return undefined
}

function mapBuybackDoc(id: string, data: Record<string, unknown>): CustomerBuyback {
  const rawStatus = typeof data.status === 'string' ? data.status : 'completed'
  return {
    id,
    storeId: (data.storeId as string) || '',
    status: rawStatus === 'cancelled' ? 'cancelled' : 'completed',
    customerName: (data.customerName as string) || '',
    customerPhone: (data.customerPhone as string) ?? '',
    customerEmail: (data.customerEmail as string) ?? '',
    folderId: (data.folderId as string) || '',
    inventoryItemId: (data.inventoryItemId as string) || '',
    purchasePrice: Number(data.purchasePrice) || 0,
    paymentMethod: (data.paymentMethod as string) || '',
    itemSummary: (data.itemSummary as string) || '',
    notes: (data.notes as string) || '',
    createdAt: snapshotToDate(data.createdAt),
    updatedAt: snapshotToDate(data.updatedAt),
    createdBy: (data.createdBy as string) || '',
  }
}

function mapLoanDoc(id: string, data: Record<string, unknown>): SellerLoanOut {
  const rawStatus = typeof data.status === 'string' ? data.status : 'active'
  const status: SellerLoanOut['status'] =
    rawStatus === 'returned' ? 'returned' : rawStatus === 'sold' ? 'sold' : 'active'
  return {
    id,
    storeId: (data.storeId as string) || '',
    status,
    partyName: (data.partyName as string) || '',
    partyPhone: (data.partyPhone as string) ?? '',
    partyNotes: (data.partyNotes as string) || '',
    lines: Array.isArray(data.lines) ? (data.lines as SellerLoanOut['lines']) : [],
    createdAt: snapshotToDate(data.createdAt),
    updatedAt: snapshotToDate(data.updatedAt),
    returnedAt: snapshotToDate(data.returnedAt),
    soldAt: snapshotToDate(data.soldAt),
    createdBy: (data.createdBy as string) || '',
  }
}

async function fetchAllPaginated<T>(
  buildPageQuery: (lastDoc: QueryDocumentSnapshot | null) => Query,
  mapDoc: (id: string, data: Record<string, unknown>) => T
): Promise<T[]> {
  const results: T[] = []
  let lastDoc: QueryDocumentSnapshot | null = null

  while (true) {
    const snap = await getDocs(buildPageQuery(lastDoc))
    if (snap.empty) break

    results.push(...snap.docs.map((doc) => mapDoc(doc.id, doc.data() as Record<string, unknown>)))
    lastDoc = snap.docs[snap.docs.length - 1] ?? null
    if (snap.docs.length < PAGE_SIZE) break
  }

  return results
}

export async function fetchAllCustomerBuybacksForExport(): Promise<CustomerBuyback[]> {
  const { isDemoModeActive } = await import('~/utils/demo-mode')
  if (isDemoModeActive()) {
    const { useCustomerBuybacksStore } = await import('~/stores/customerBuybacks')
    const store = useCustomerBuybacksStore()
    await store.fetchCustomerBuybacks(true)
    return store.buybacks
  }

  const db = useFirestore().getFirestoreInstance()
  const authStore = useAuthStore()
  if (!db || !authStore.currentUser) return []

  const userId = await getQueryUserId()
  const storeId = await getCurrentStoreId()
  if (!userId || !storeId) return []

  const col = getCustomerBuybacksCollection(db, userId, storeId)
  return fetchAllPaginated(
    (lastDoc) =>
      lastDoc
        ? query(col, orderBy('createdAt', 'desc'), startAfter(lastDoc), limit(PAGE_SIZE))
        : query(col, orderBy('createdAt', 'desc'), limit(PAGE_SIZE)),
    mapBuybackDoc
  )
}

export async function fetchAllSellerLoanOutsForExport(): Promise<SellerLoanOut[]> {
  const { isDemoModeActive } = await import('~/utils/demo-mode')
  if (isDemoModeActive()) {
    const storeId = (await getCurrentStoreId()) || ''
    const { getDemoSellerLoans } = await import('~/utils/demo-bridge')
    return getDemoSellerLoans(storeId)
  }

  const db = useFirestore().getFirestoreInstance()
  const authStore = useAuthStore()
  if (!db || !authStore.currentUser) return []

  const userId = await getQueryUserId()
  const storeId = await getCurrentStoreId()
  if (!userId || !storeId) return []

  const col = getSellerLoanOutsCollection(db, userId, storeId)
  return fetchAllPaginated(
    (lastDoc) =>
      lastDoc
        ? query(col, orderBy('createdAt', 'desc'), startAfter(lastDoc), limit(PAGE_SIZE))
        : query(col, orderBy('createdAt', 'desc'), limit(PAGE_SIZE)),
    mapLoanDoc
  )
}
