import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

type SnapHandler = (snap: unknown) => void
const listeners: { path: string; onNext: SnapHandler; unsubscribe: ReturnType<typeof vi.fn> }[] = []
const toastInfo = vi.fn()
const fetchDepartments = vi.fn(async () => {})
const currentUser = { uid: 'u1' }

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  doc: vi.fn(),
  setDoc: vi.fn(),
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  updateDoc: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  serverTimestamp: vi.fn(),
  deleteField: vi.fn(),
  collectionGroup: vi.fn(),
  onSnapshot: vi.fn((ref: { path: string }, onNext: SnapHandler) => {
    const unsubscribe = vi.fn()
    listeners.push({ path: ref.path, onNext, unsubscribe })
    return unsubscribe
  }),
}))
vi.mock('~/composables/useFirestore', () => ({
  useFirestore: () => ({ getFirestoreInstance: () => ({}) }),
}))
vi.mock('~/composables/useFirestorePaths', () => ({
  getStaffCollection: vi.fn(),
  getQueryUserId: vi.fn(),
  getStaffDocument: (_db: unknown, owner: string, store: string, dept: string, id: string) => ({
    path: `users/${owner}/stores/${store}/departments/${dept}/staff/${id}`,
  }),
}))
vi.mock('~/composables/useCurrentStore', () => ({ getCurrentStoreId: vi.fn() }))
vi.mock('~/composables/useAppToast', () => ({ useAppToast: () => ({ info: toastInfo }) }))
vi.mock('~/stores/auth', () => ({ useAuthStore: () => ({ currentUser }) }))
vi.mock('~/stores/user', () => ({ useUserStore: () => ({}) }))
vi.mock('~/stores/departments', () => ({
  useDepartmentsStore: () => ({ fetchDepartments, getDepartmentById: () => undefined }),
}))
vi.mock('~/utils/demo-mode', () => ({ isDemoModeActive: () => false }))

const PATH = 'users/owner/stores/store1/departments/dept1/staff/staff1'

function snapshot(data: Record<string, unknown>) {
  return { id: 'staff1', ref: { path: PATH }, exists: () => true, data: () => data }
}

async function signedInStaffStore() {
  const { useStaffStore } = await import('~/stores/staff')
  const store = useStaffStore()
  store.staff = [
    {
      id: 'staff1',
      authUid: 'u1',
      status: 'active',
      createdBy: 'owner',
      storeId: 'store1',
      departmentId: 'dept1',
      departmentName: 'Sales',
      admin: false,
    } as never,
  ]
  await store.watchCurrentStaffMember()
  return store
}

describe('staff own-record live updates', () => {
  beforeEach(() => {
    vi.resetModules()
    setActivePinia(createPinia())
    listeners.length = 0
    toastInfo.mockReset()
    fetchDepartments.mockClear()
  })

  it('applies admin rights the moment the owner grants them', async () => {
    const store = await signedInStaffStore()
    expect(listeners.map((l) => l.path)).toEqual([PATH])

    listeners[0]!.onNext(
      snapshot({ authUid: 'u1', status: 'active', createdBy: 'owner', admin: true, adminGrants: { branches: true } })
    )

    expect(store.getCurrentStaffMember?.admin).toBe(true)
    expect(store.getCurrentStaffMember?.adminGrants).toEqual({ branches: true })
    expect(store.getCurrentStaffMember?.departmentName).toBe('Sales')
    expect(toastInfo).toHaveBeenCalledWith('You are now an admin of this branch.')
    expect(fetchDepartments).toHaveBeenCalled()
  })

  it('stays quiet when nothing about admin access changed', async () => {
    await signedInStaffStore()
    listeners[0]!.onNext(snapshot({ authUid: 'u1', status: 'active', createdBy: 'owner', admin: false }))
    expect(toastInfo).not.toHaveBeenCalled()
    expect(fetchDepartments).not.toHaveBeenCalled()
  })

  it('does not open a second listener for the same record', async () => {
    const store = await signedInStaffStore()
    await store.watchCurrentStaffMember()
    expect(listeners).toHaveLength(1)
  })
})
