import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

type Listener = {
  query: { path: string; ordered: boolean }
  onNext: (snap: unknown) => void
  onError: (error: { code?: string; message?: string }) => void
  unsubscribe: ReturnType<typeof vi.fn>
}
const listeners: Listener[] = []
const getDocs = vi.fn()
const currentUser = { uid: 'u1' }
let storeId = 'store1'

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  doc: vi.fn(),
  setDoc: vi.fn(),
  getDoc: vi.fn(),
  getDocs,
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(() => 'orderBy'),
  query: vi.fn((ref: { path: string }, ...constraints: unknown[]) => ({
    path: ref.path,
    ordered: constraints.includes('orderBy'),
  })),
  serverTimestamp: vi.fn(),
  onSnapshot: vi.fn((q: Listener['query'], onNext, onError) => {
    const unsubscribe = vi.fn()
    listeners.push({ query: q, onNext, onError, unsubscribe })
    return unsubscribe
  }),
}))
vi.mock('~/composables/useFirestore', () => ({
  useFirestore: () => ({ getFirestoreInstance: () => ({}) }),
}))
vi.mock('~/composables/useFirestorePaths', () => ({
  getReceiptsCollection: (_db: unknown, owner: string, store: string) => ({
    path: `users/${owner}/stores/${store}/receipts`,
  }),
  getReceiptDocument: vi.fn(),
  getQueryUserId: async () => 'owner',
}))
vi.mock('~/composables/useCurrentStore', () => ({ getCurrentStoreId: async () => storeId }))
vi.mock('~/stores/auth', () => ({ useAuthStore: () => ({ currentUser }) }))
vi.mock('~/stores/user', () => ({ useUserStore: () => ({ userData: { role: 'superAdmin' } }) }))
vi.mock('~/stores/staff', () => ({ useStaffStore: () => ({}) }))
vi.mock('~/stores/customers', () => ({ useCustomersStore: () => ({}) }))
vi.mock('~/stores/notifications', () => ({ useNotificationsStore: () => ({}) }))
vi.mock('~/composables/usePermissions', () => ({ usePermissions: () => ({}) }))
vi.mock('~/composables/usePreferences', () => ({ usePreferences: () => ({}) }))
vi.mock('~/composables/useLoyalty', () => ({ useLoyalty: () => ({}) }))
vi.mock('~/utils/demo-mode', () => ({ isDemoModeActive: () => false }))

function snapshot(ids: string[]) {
  return {
    docs: ids.map((id, i) => ({
      id,
      data: () => ({ createdBy: 'owner', items: [], total: 100, date: new Date(2026, 0, i + 1) }),
    })),
  }
}

async function receiptsStore() {
  const { useReceiptsStore, stopLiveReceipts } = await import('~/stores/receipts')
  return { store: useReceiptsStore(), stopLiveReceipts }
}

/** Let the store's awaits run until it has opened its listener. */
async function settle() {
  for (let i = 0; i < 20; i++) await Promise.resolve()
  await new Promise((resolve) => setTimeout(resolve, 0))
}

describe('receipts live listener', () => {
  beforeEach(() => {
    vi.resetModules()
    setActivePinia(createPinia())
    listeners.length = 0
    getDocs.mockReset()
    storeId = 'store1'
  })

  it('opens one listener and serves later fetches, forced or not, from it', async () => {
    const { store, stopLiveReceipts } = await receiptsStore()
    const first = store.fetchReceipts()
    await settle()
    expect(listeners).toHaveLength(1)
    expect(listeners[0]!.query).toEqual({
      path: 'users/owner/stores/store1/receipts',
      ordered: true,
    })

    listeners[0]!.onNext(snapshot(['a', 'b']))
    await first
    expect(store.receipts.map((r) => r.id)).toEqual(['b', 'a'])

    await store.fetchReceipts()
    await store.fetchReceipts({ force: true })
    expect(listeners).toHaveLength(1)
    expect(getDocs).not.toHaveBeenCalled()
    stopLiveReceipts()
  })

  it('pushes later changes into the list without another fetch', async () => {
    const { store, stopLiveReceipts } = await receiptsStore()
    const first = store.fetchReceipts()
    await settle()
    listeners[0]!.onNext(snapshot(['a']))
    await first

    listeners[0]!.onNext(snapshot(['a', 'b', 'c']))
    expect(store.receipts).toHaveLength(3)
    stopLiveReceipts()
  })

  it('restores the list from the listener when something cleared it', async () => {
    const { store, stopLiveReceipts } = await receiptsStore()
    const first = store.fetchReceipts()
    await settle()
    listeners[0]!.onNext(snapshot(['a', 'b']))
    await first

    store.receipts = []
    await store.fetchReceipts()
    expect(store.receipts).toHaveLength(2)
    expect(listeners).toHaveLength(1)
    stopLiveReceipts()
  })

  it('moves the listener when the store changes', async () => {
    const { store, stopLiveReceipts } = await receiptsStore()
    const first = store.fetchReceipts()
    await settle()
    listeners[0]!.onNext(snapshot(['a']))
    await first

    storeId = 'store2'
    const second = store.fetchReceipts()
    await settle()
    expect(listeners).toHaveLength(2)
    expect(listeners[0]!.unsubscribe).toHaveBeenCalledOnce()
    expect(listeners[1]!.query.path).toBe('users/owner/stores/store2/receipts')
    listeners[1]!.onNext(snapshot(['x']))
    await second
    expect(store.receipts.map((r) => r.id)).toEqual(['x'])

    // A late snapshot from the old store's listener must not overwrite the new list
    listeners[0]!.onNext(snapshot(['a', 'b']))
    expect(store.receipts.map((r) => r.id)).toEqual(['x'])
    stopLiveReceipts()
  })

  it('falls back to an unordered listener when the index is missing', async () => {
    const { store, stopLiveReceipts } = await receiptsStore()
    const first = store.fetchReceipts()
    await settle()
    listeners[0]!.onError({ code: 'failed-precondition', message: 'needs an index' })
    expect(listeners).toHaveLength(2)
    expect(listeners[1]!.query.ordered).toBe(false)

    listeners[1]!.onNext(snapshot(['a', 'b']))
    await first
    expect(store.receipts.map((r) => r.id)).toEqual(['b', 'a'])
    expect(store.error).toBeNull()
    stopLiveReceipts()
  })

  it('stops listening on sign-out and listens afresh next time', async () => {
    const { store, stopLiveReceipts } = await receiptsStore()
    const first = store.fetchReceipts()
    await settle()
    listeners[0]!.onNext(snapshot(['a']))
    await first

    stopLiveReceipts()
    expect(listeners[0]!.unsubscribe).toHaveBeenCalledOnce()

    const again = store.fetchReceipts()
    await settle()
    expect(listeners).toHaveLength(2)
    listeners[1]!.onNext(snapshot(['a']))
    await again
    stopLiveReceipts()
  })
})
