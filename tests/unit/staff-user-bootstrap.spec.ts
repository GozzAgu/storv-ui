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

  it('inherits owner preferences via API and marks onboarding complete', async () => {
    mockFetch.mockResolvedValue({
      subscription: 'storvv_enterprise',
      preferences: { currency: 'NGN', region: 'NG' },
      storeDetails: { storeName: 'Port Harcourt' },
    })

    const { buildStaffUserDataWithOwnerContext } = await import('~/utils/staff-user-bootstrap')
    const { userData: result, inheritedOwnerContext } = await buildStaffUserDataWithOwnerContext(
      {} as never,
      staff,
      'auth-staff'
    )

    expect(inheritedOwnerContext).toBe(true)
    expect(result.role).toBe('staff')
    expect(result.hasCompletedOnboarding).toBe(true)
    expect(result.hasCompletedTutorial).toBe(true)
    expect(result.subscription).toBe('storvv_enterprise')
    expect(result.preferences?.currency).toBe('NGN')
    expect(result.storeDetails?.storeName).toBe('Port Harcourt')
    expect(result.mustChangePassword).toBe(true)
  })

  it('preserves prior enterprise plan when owner context is unavailable', async () => {
    mockFetch.mockRejectedValue(new Error('offline'))
    getDoc.mockRejectedValue(new Error('Missing or insufficient permissions'))

    const { buildStaffUserDataWithOwnerContext } = await import('~/utils/staff-user-bootstrap')
    const { userData: result, inheritedOwnerContext } = await buildStaffUserDataWithOwnerContext(
      {} as never,
      staff,
      'auth-staff',
      {
        uid: 'auth-staff',
        email: 'frank@example.com',
        name: 'Franklin Agu',
        role: 'staff',
        subscription: 'storvv_enterprise',
        hasCompletedOnboarding: true,
        hasCompletedTutorial: true,
      }
    )

    expect(inheritedOwnerContext).toBe(false)
    expect(result.subscription).toBe('storvv_enterprise')
  })

  it('falls back to micro only when no prior plan and API unavailable', async () => {
    mockFetch.mockRejectedValue(new Error('offline'))
    getDoc.mockResolvedValue({ exists: () => false })

    const { buildStaffUserDataWithOwnerContext } = await import('~/utils/staff-user-bootstrap')
    const { userData: result, inheritedOwnerContext } = await buildStaffUserDataWithOwnerContext(
      {} as never,
      staff,
      'auth-staff'
    )

    expect(inheritedOwnerContext).toBe(false)
    expect(result.hasCompletedOnboarding).toBe(true)
    expect(result.subscription).toBe('storvv_micro')
    expect(result.preferences).toBeUndefined()
  })
})
