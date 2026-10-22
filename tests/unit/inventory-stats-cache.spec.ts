import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

const getDocs = vi.fn()
let storeId = 'store1'

vi.mock('firebase/firestore', async (importOriginal) => ({
  ...(await importOriginal<typeof import('firebase/firestore')>()),
  getDocs,
  query: vi.fn(() => ({})),
  where: vi.fn(),
}))
vi.mock('~/composables/useFirestore', () => ({
  useFirestore: () => ({ getFirestoreInstance: () => ({}) }),
}))
vi.mock('~/composables/useFirestorePaths', () => ({
  getInventoryFoldersCollection: vi.fn(),
  getInventoryFolderDocument: vi.fn(),
  getInventoryItemsCollection: vi.fn(() => ({})),
  getInventoryItemDocument: vi.fn(),
  getQueryUserId: async () => 'owner',
  getSellerLoanOutDocument: vi.fn(),
}))
vi.mock('~/composables/useCurrentStore', () => ({ getCurrentStoreId: async () => storeId }))
vi.mock('~/composables/useActivityLog', () => ({
  logActivity: vi.fn(),
  getCurrentUserDisplayName: vi.fn(),
}))
vi.mock('~/stores/auth', () => ({ useAuthStore: () => ({ currentUser: { uid: 'owner' } }) }))
vi.mock('~/stores/user', () => ({ useUserStore: () => ({ userData: { role: 'superAdmin' } }) }))
vi.mock('~/stores/staff', () => ({ useStaffStore: () => ({}) }))
vi.mock('~/utils/demo-mode', () => ({ isDemoModeActive: () => false }))
vi.mock('~/utils/capacitor-env', () => ({ isCapacitorNative: () => false }))

const folder = { id: 'f1', name: 'Phones', hasSerialNumbers: true, template: { fields: [] } }

function itemDocs() {
  return {
    docs: [{ id: 'i1', data: () => ({ folderId: 'f1', createdBy: 'owner', name: 'iPhone 13' }) }],
  }
}

async function inventoryStore() {
  const mod = await import('~/stores/inventory')
  const store = mod.useInventoryStore()
  store.folders = [folder as never]
  return store
}

describe('inventory availability stats cache', () => {
  beforeEach(() => {
    vi.resetModules()
    setActivePinia(createPinia())
    getDocs.mockReset()
    getDocs.mockResolvedValue(itemDocs())
    storeId = 'store1'
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('reads the store once and reuses it for ten minutes', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    const store = await inventoryStore()

    await store.fetchFolderAvailabilityStats()
    expect(getDocs).toHaveBeenCalledTimes(1)
    expect(store.folderAvailabilityStats.f1).toBeDefined()

    vi.advanceTimersByTime(9 * 60_000)
    await store.fetchFolderAvailabilityStats()
    expect(getDocs).toHaveBeenCalledTimes(1)

    vi.advanceTimersByTime(2 * 60_000)
    await store.fetchFolderAvailabilityStats()
    expect(getDocs).toHaveBeenCalledTimes(2)
  })

  it('reads again as soon as stock changes on this device', async () => {
    const store = await inventoryStore()
    const { noteInventoryChanged, invalidateFolderItemCaches } = await import(
      '~/utils/inventory-items-firestore'
    )

    await store.fetchFolderAvailabilityStats()
    noteInventoryChanged()
    await store.fetchFolderAvailabilityStats()
    expect(getDocs).toHaveBeenCalledTimes(2)

    // A completed sale clears the folder's caches, which counts as a change too
    invalidateFolderItemCaches('f1')
    await store.fetchFolderAvailabilityStats()
    expect(getDocs).toHaveBeenCalledTimes(3)

    await store.fetchFolderAvailabilityStats()
    expect(getDocs).toHaveBeenCalledTimes(3)
  })

  it('treats a change made during the read as unseen', async () => {
    const store = await inventoryStore()
    const { noteInventoryChanged } = await import('~/utils/inventory-items-firestore')
    getDocs.mockImplementationOnce(async () => {
      noteInventoryChanged()
      return itemDocs()
    })

    await store.fetchFolderAvailabilityStats()
    await store.fetchFolderAvailabilityStats()
    expect(getDocs).toHaveBeenCalledTimes(2)
  })

  it('reads again for another store or when forced', async () => {
    const store = await inventoryStore()

    await store.fetchFolderAvailabilityStats()
    storeId = 'store2'
    await store.fetchFolderAvailabilityStats()
    expect(getDocs).toHaveBeenCalledTimes(2)

    await store.fetchFolderAvailabilityStats({ force: true })
    expect(getDocs).toHaveBeenCalledTimes(3)
  })
})
