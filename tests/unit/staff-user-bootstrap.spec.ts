import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Staff } from '~/composables/useStaff'

const getDoc = vi.fn()

vi.mock('firebase/firestore', () => ({
  collectionGroup: vi.fn(),
  doc: vi.fn((_db: unknown, _col: string, id: string) => ({ id })),
  getDoc: (...args: unknown[]) => getDoc(...args),
  getDocs: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
}))

describe('buildStaffUserDataWithOwnerContext', () => {
  beforeEach(() => {
    getDoc.mockReset()
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
  })

  it('falls back when owner doc is missing', async () => {
    getDoc.mockResolvedValue({ exists: () => false })

    const { buildStaffUserDataWithOwnerContext } = await import('~/utils/staff-user-bootstrap')
    const result = await buildStaffUserDataWithOwnerContext({} as never, staff, 'auth-staff')

    expect(result.hasCompletedOnboarding).toBe(true)
    expect(result.subscription).toBe('storvv_micro')
    expect(result.preferences).toBeUndefined()
  })
})
