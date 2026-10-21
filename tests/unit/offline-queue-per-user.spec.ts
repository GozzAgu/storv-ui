import { beforeEach, describe, expect, it, vi } from 'vitest'

const auth = { currentUser: { uid: 'amaka' } as { uid: string } | null }
vi.mock('~/stores/auth', () => ({ useAuthStore: () => auth }))
vi.mock('~/composables/useFirestore', () => ({
  useFirestore: () => ({ getFirestoreInstance: () => null }),
}))

const STORAGE_KEY = 'storv_pending_operations'

describe('queued offline changes', () => {
  beforeEach(() => {
    vi.resetModules()
    localStorage.clear()
    auth.currentUser = { uid: 'amaka' }
  })

  it('only counts and clears the signed-in user’s own changes', async () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([
        {
          id: '1',
          type: 'set',
          documentPath: 'users/owner1/stores/s1/inventoryItems/a',
          data: {},
          merge: false,
          timestamp: 1,
          uid: 'amaka',
        },
        {
          id: '2',
          type: 'set',
          documentPath: 'users/owner1/stores/s1/inventoryItems/b',
          data: {},
          merge: false,
          timestamp: 2,
          uid: 'tunde',
        },
        // From before changes were tagged: replays only for the account whose data it is.
        {
          id: '3',
          type: 'set',
          documentPath: 'users/amaka/stores/s1/inventoryItems/c',
          data: {},
          merge: false,
          timestamp: 3,
        },
        {
          id: '4',
          type: 'set',
          documentPath: 'users/owner1/stores/s1/inventoryItems/d',
          data: {},
          merge: false,
          timestamp: 4,
        },
      ])
    )
    const { initOfflineSync, useOfflineMode, clearOfflineQueueForUser } = await import(
      '~/composables/useOfflineMode'
    )
    Object.defineProperty(navigator, 'onLine', { configurable: true, get: () => false })
    initOfflineSync()
    expect(useOfflineMode().pendingCount.value).toBe(2)

    clearOfflineQueueForUser('amaka')
    const left = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]').map(
      (op: { id: string }) => op.id
    )
    expect(left).toEqual(['2', '4'])

    auth.currentUser = { uid: 'tunde' }
    expect(useOfflineMode().pendingCount.value).toBe(1)
  })
})
