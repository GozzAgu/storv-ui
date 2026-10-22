import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

const getDocs = vi.fn()

vi.mock('firebase/firestore', () => ({
  getDocs,
  query: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
}))
vi.mock('~/composables/useFirestore', () => ({
  useFirestore: () => ({ getFirestoreInstance: () => ({}) }),
}))
vi.mock('~/composables/useFirestorePaths', () => ({
  getQueryUserId: async () => 'owner',
  getSellerLoanOutsCollection: vi.fn(),
}))
vi.mock('~/composables/useCurrentStore', () => ({ getCurrentStoreId: async () => 'store1' }))
vi.mock('~/stores/auth', () => ({ useAuthStore: () => ({ currentUser: { uid: 'owner' } }) }))
vi.mock('~/utils/demo-mode', () => ({ isDemoModeActive: () => false, DEMO_USER_UID: 'demo' }))

describe('seller loans after a sale', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    getDocs.mockReset()
    getDocs.mockResolvedValue({ docs: [] })
  })

  it('skips the re-read when no loan is still active', async () => {
    const { useSellerLoanOutsStore } = await import('~/stores/sellerLoanOuts')
    const store = useSellerLoanOutsStore()
    store.loans = [{ id: 'l1', status: 'sold' } as never, { id: 'l2', status: 'returned' } as never]

    await store.refreshAfterSale()
    expect(getDocs).not.toHaveBeenCalled()
  })

  it('re-reads when an active loan could have been sold', async () => {
    const { useSellerLoanOutsStore } = await import('~/stores/sellerLoanOuts')
    const store = useSellerLoanOutsStore()
    store.loans = [{ id: 'l1', status: 'active' } as never]
    store.lastFetchedStoreId = 'store1'

    await store.refreshAfterSale()
    expect(getDocs).toHaveBeenCalledOnce()
  })
})
