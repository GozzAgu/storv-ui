import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Staff } from '~/composables/useStaff'

const getDoc = vi.fn()
const getIdToken = vi.fn()
const mockFetch = vi.fn()

vi.stubGlobal('$fetch', mockFetch)

vi.mock('firebase/firestore', () => ({
  collectionGroup: vi.fn(),
  doc: vi.fn((_db: unknown, _col: string, id: string) => ({ id })),
  getDoc: (...args: unknown[]) => getDoc(...args),
  getDocs: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
}))

vi.mock('~/utils/firebase-client-auth', () => ({
  getFirebaseClientAuth: () => ({
    currentUser: { getIdToken },
  }),
}))

vi.mock('~/utils/api-url', () => ({
  resolveApiPath: (path: string) => path,
}))

describe('buildStaffUserDataWithOwnerContext', () => {
  beforeEach(() => {
    getDoc.mockReset()
    getIdToken.mockReset()
    mockFetch.mockReset()
    getIdToken.mockResolvedValue('token')
  })

  const staff: Staff = {
    id: 'staff1',
    firstName: 'Franklin',
    lastName: 'Agu',
    email: 'frank@example.com',
    departmentId: 'dept1',
    storeId: 'store1',
    position: 'Cashier',
    role: 'staff',
    hireDate: '2026-01-01',
    status: 'active',
    authUid: 'auth-staff',
    mustChangePassword: true,
    createdBy: 'owner-uid',
    createdAt: null,
    updatedAt: null,
  }

  it('inherits owner preferences and marks onboarding complete', async () => {
    getDoc.mockResolvedValue({
      exists: () => true,
      id: 'owner-uid',
      data: () => ({
        role: 'superAdmin',
        subscription: 'storvv_enterprise',
        preferences: { currency: 'NGN', region: 'NG' },
        storeDetails: { storeName: 'Port Harcourt' },
        hasCompletedOnboarding: true,
      }),
    })

    const { buildStaffUserDataWithOwnerContext } = await import('~/utils/staff-user-bootstrap')
    const result = await buildStaffUserDataWithOwnerContext({} as never, staff, 'auth-staff')

    expect(result.role).toBe('staff')
    expect(result.hasCompletedOnboarding).toBe(true)
    expect(result.hasCompletedTutorial).toBe(true)
    expect(result.subscription).toBe('storvv_enterprise')
    expect(result.preferences?.currency).toBe('NGN')
    expect(result.storeDetails?.storeName).toBe('Port Harcourt')
    expect(result.mustChangePassword).toBe(true)
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('falls back when owner doc is missing and API is unavailable', async () => {
    getDoc.mockResolvedValue({ exists: () => false })
    mockFetch.mockRejectedValue(new Error('offline'))

    const { buildStaffUserDataWithOwnerContext } = await import('~/utils/staff-user-bootstrap')
    const result = await buildStaffUserDataWithOwnerContext({} as never, staff, 'auth-staff')

    expect(result.hasCompletedOnboarding).toBe(true)
    expect(result.subscription).toBe('storvv_micro')
    expect(result.preferences).toBeUndefined()
  })

  it('inherits enterprise plan via API when owner doc read is denied', async () => {
    getDoc.mockRejectedValue(new Error('Missing or insufficient permissions'))
    mockFetch.mockResolvedValue({
      subscription: 'storvv_enterprise',
      preferences: { currency: 'NGN' },
      storeDetails: { storeName: 'Kano' },
    })

    const { buildStaffUserDataWithOwnerContext } = await import('~/utils/staff-user-bootstrap')
    const result = await buildStaffUserDataWithOwnerContext({} as never, staff, 'auth-staff')

    expect(result.subscription).toBe('storvv_enterprise')
    expect(result.preferences?.currency).toBe('NGN')
    expect(result.storeDetails?.storeName).toBe('Kano')
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/workspace/owner-context',
      expect.objectContaining({
        headers: { Authorization: 'Bearer token' },
      })
    )
  })
})
