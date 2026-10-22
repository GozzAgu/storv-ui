import { beforeEach, describe, expect, it, vi } from 'vitest'

const getDocs = vi.fn()
const authStore: { currentUser: { uid: string } | null } = { currentUser: { uid: 'staff1' } }
const userStore = { userData: { role: 'staff' } as { role: string }, fetchUserData: vi.fn() }
let demo = false

vi.mock('firebase/firestore', async (importOriginal) => ({
  ...(await importOriginal<typeof import('firebase/firestore')>()),
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  getDocs,
}))
vi.mock('~/composables/useFirestore', () => ({
  useFirestore: () => ({ getFirestoreInstance: () => ({}) }),
}))
vi.mock('~/stores/auth', () => ({ useAuthStore: () => authStore }))
vi.mock('~/stores/user', () => ({ useUserStore: () => userStore }))
vi.mock('~/stores/staff', () => ({ useStaffStore: () => ({ getCurrentStaffMember: null }) }))
vi.mock('~/utils/demo-mode', () => ({ isDemoModeActive: () => demo, DEMO_USER_UID: 'demo' }))

function legacyStaff(owner: string) {
  return { empty: false, docs: [{ data: () => ({ createdBy: owner }) }] }
}

describe('getQueryUserId owner memo', () => {
  beforeEach(() => {
    vi.resetModules()
    getDocs.mockReset()
    getDocs.mockResolvedValue(legacyStaff('owner1'))
    authStore.currentUser = { uid: 'staff1' }
    userStore.userData = { role: 'staff' }
    demo = false
  })

  it("looks up a staff member's owner once per sign-in", async () => {
    const { getQueryUserId } = await import('~/composables/useFirestorePaths')
    expect(await getQueryUserId()).toBe('owner1')
    expect(await getQueryUserId()).toBe('owner1')
    expect(await getQueryUserId()).toBe('owner1')
    expect(getDocs).toHaveBeenCalledTimes(1)
  })

  it('looks up again for another user or after the cache is cleared', async () => {
    const { getQueryUserId, clearQueryUserIdCache } = await import(
      '~/composables/useFirestorePaths'
    )
    await getQueryUserId()

    authStore.currentUser = { uid: 'staff2' }
    getDocs.mockResolvedValue(legacyStaff('owner2'))
    expect(await getQueryUserId()).toBe('owner2')
    expect(getDocs).toHaveBeenCalledTimes(2)

    clearQueryUserIdCache()
    await getQueryUserId()
    expect(getDocs).toHaveBeenCalledTimes(3)
  })

  it('needs no read for an owner and never remembers demo mode', async () => {
    const { getQueryUserId } = await import('~/composables/useFirestorePaths')
    authStore.currentUser = { uid: 'owner1' }
    userStore.userData = { role: 'superAdmin' }
    expect(await getQueryUserId()).toBe('owner1')

    demo = true
    expect(await getQueryUserId()).toBe('demo')
    demo = false
    expect(await getQueryUserId()).toBe('owner1')
    expect(getDocs).not.toHaveBeenCalled()
  })
})
