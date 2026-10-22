import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

const getDocs = vi.fn()
let storeId = 'store1'
let resolveStoreId: (() => void) | null = null

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  doc: vi.fn(),
  setDoc: vi.fn(),
  getDoc: vi.fn(),
  getDocs,
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  query: vi.fn(() => ({})),
  where: vi.fn(),
  orderBy: vi.fn(),
  serverTimestamp: vi.fn(),
  arrayUnion: vi.fn(),
}))
vi.mock('~/composables/useFirestore', () => ({
  useFirestore: () => ({ getFirestoreInstance: () => ({}) }),
}))
vi.mock('~/composables/useFirestorePaths', () => ({
  getCustomersCollection: vi.fn(() => ({})),
  getCustomerDocument: vi.fn(),
  getQueryUserId: async () => 'owner',
}))
vi.mock('~/composables/useCurrentStore', () => ({
  getCurrentStoreId: () =>
    resolveStoreId
      ? new Promise<string>((resolve) => {
          const release = resolveStoreId!
          resolveStoreId = () => {
            release()
            resolve(storeId)
          }
        })
      : Promise.resolve(storeId),
}))
vi.mock('~/stores/auth', () => ({ useAuthStore: () => ({ currentUser: { uid: 'owner' } }) }))
vi.mock('~/stores/user', () => ({ useUserStore: () => ({ userData: { role: 'superAdmin' } }) }))
vi.mock('~/stores/staff', () => ({ useStaffStore: () => ({}) }))
vi.mock('~/utils/demo-mode', () => ({ isDemoModeActive: () => false, DEMO_USER_UID: 'demo' }))
vi.mock('~/utils/capacitor-env', () => ({ isCapacitorNative: () => false }))

function customerDocs(names: string[]) {
  return {
    docs: names.map((name, i) => ({
      id: `c${i}`,
      data: () => ({ name, createdBy: 'owner', lastOrderDate: new Date(2026, 0, i + 1) }),
    })),
  }
}

async function customersStore() {
  const { useCustomersStore } = await import('~/stores/customers')
  return useCustomersStore()
}

describe('customers fetch cache', () => {
  beforeEach(() => {
    vi.resetModules()
    setActivePinia(createPinia())
    getDocs.mockReset()
    getDocs.mockResolvedValue(customerDocs(['Ada', 'Musa']))
    storeId = 'store1'
    resolveStoreId = null
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('reuses the list for five minutes, then reads again', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    const store = await customersStore()

    await store.fetchCustomers()
    await store.fetchCustomers()
    expect(getDocs).toHaveBeenCalledTimes(1)
    expect(store.customers).toHaveLength(2)

    vi.advanceTimersByTime(5 * 60_000 + 1)
    await store.fetchCustomers()
    expect(getDocs).toHaveBeenCalledTimes(2)
  })

  it('reads again when forced or for another store', async () => {
    const store = await customersStore()
    await store.fetchCustomers()
    await store.fetchCustomers({ force: true })
    expect(getDocs).toHaveBeenCalledTimes(2)

    storeId = 'store2'
    await store.fetchCustomers()
    expect(getDocs).toHaveBeenCalledTimes(3)
  })

  it('shares one read between calls made at the same time', async () => {
    const store = await customersStore()
    await Promise.all([store.fetchCustomers(), store.fetchCustomers(), store.fetchCustomers()])
    expect(getDocs).toHaveBeenCalledTimes(1)
  })

  it('does not hold a caller waiting on the store id hostage to an earlier read', async () => {
    const store = await customersStore()
    // An outer call stuck resolving the store (as during a store switch refresh)
    resolveStoreId = () => {}
    const outer = store.fetchCustomers()
    const release = resolveStoreId!
    resolveStoreId = null

    // A refresh that runs meanwhile must finish on its own
    await store.fetchCustomers()
    expect(store.customers).toHaveLength(2)

    release()
    await outer
    expect(getDocs).toHaveBeenCalledTimes(1)
  })
})
