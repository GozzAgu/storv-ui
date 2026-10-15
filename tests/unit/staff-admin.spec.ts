import { describe, expect, it } from 'vitest'
import {
  EMPTY_STAFF_PERMISSIONS,
  FULL_STAFF_PERMISSIONS,
  coerceStaffPermissions,
  normalizeStaffAdminGrants,
  resolveStaffPermissions,
} from '~/utils/staff-permissions'
import {
  assertCanManageTarget,
  parseNewStaff,
  permissionsForWrite,
  type StaffManager,
} from '~/server/utils/staff-admin'

const owner: StaffManager = { kind: 'owner', uid: 'owner1' }
const admin: StaffManager = { kind: 'admin', uid: 'admin1' }

function statusOf(fn: () => unknown): number | undefined {
  try {
    fn()
  } catch (err) {
    return (err as { statusCode?: number }).statusCode
  }
  return undefined
}

describe('resolveStaffPermissions for branch admins', () => {
  it('grants every module action regardless of the stored matrix', () => {
    const p = resolveStaffPermissions({ admin: true, permissions: EMPTY_STAFF_PERMISSIONS })
    expect(p.products).toEqual(FULL_STAFF_PERMISSIONS.products)
    expect(p.receipts).toEqual(FULL_STAFF_PERMISSIONS.receipts)
    expect(p.multiStoreSync).toEqual(EMPTY_STAFF_PERMISSIONS.multiStoreSync)
  })

  it('unlocks transfers when the stock-transfers extra is on', () => {
    const p = resolveStaffPermissions({
      admin: true,
      adminGrants: { stockTransfers: true },
      permissions: EMPTY_STAFF_PERMISSIONS,
    })
    expect(p.multiStoreSync).toEqual(FULL_STAFF_PERMISSIONS.multiStoreSync)
  })

  it('keeps financial figures at the owner’s stored grant', () => {
    expect(resolveStaffPermissions({ admin: true }).financials.view).toBe(false)
    expect(
      resolveStaffPermissions({
        admin: true,
        permissions: { financials: { view: true, create: false, edit: false, delete: false } },
      }).financials.view
    ).toBe(true)
  })

  it('ignores a non-true admin value', () => {
    const p = resolveStaffPermissions({
      admin: 'yes' as unknown as boolean,
      permissions: EMPTY_STAFF_PERMISSIONS,
    })
    expect(p.products.create).toBe(false)
  })
})

describe('coerceStaffPermissions', () => {
  it('drops unknown modules (including payments) and non-boolean values', () => {
    const p = coerceStaffPermissions({
      payments: { view: true, confirm: true },
      products: { view: true, create: 'yes', delete: 1 },
      admin: true,
    }) as unknown as Record<string, unknown>
    expect(p.payments).toBeUndefined()
    expect(p.admin).toBeUndefined()
    expect(p.products).toEqual({ view: true, create: false, edit: false, delete: false })
    expect(Object.keys(p).sort()).toEqual(Object.keys(EMPTY_STAFF_PERMISSIONS).sort())
  })
})

describe('normalizeStaffAdminGrants', () => {
  it('defaults every extra to off and keeps only known true flags', () => {
    expect(normalizeStaffAdminGrants(undefined)).toEqual({
      branches: false,
      paymentsConfirm: false,
      deleteSales: false,
      storeSettings: false,
      dataExport: false,
      stockTransfers: false,
    })
    const g = normalizeStaffAdminGrants({ deleteSales: true, branches: 'true', owner: true })
    expect(g.deleteSales).toBe(true)
    expect(g.branches).toBe(false)
    expect((g as unknown as Record<string, unknown>).owner).toBeUndefined()
  })
})

describe('permissionsForWrite', () => {
  const asked = {
    products: { view: true, create: true },
    financials: { view: true },
  }

  it('lets the owner set financial figures', () => {
    expect(permissionsForWrite(owner, asked).financials.view).toBe(true)
  })

  it('keeps an admin’s write from granting financial figures', () => {
    const p = permissionsForWrite(admin, asked)
    expect(p.products.create).toBe(true)
    expect(p.financials.view).toBe(false)
  })

  it('keeps an admin’s write from removing financial figures the owner granted', () => {
    const p = permissionsForWrite(
      admin,
      { financials: { view: false } },
      { financials: { view: true, create: false, edit: false, delete: false } }
    )
    expect(p.financials.view).toBe(true)
  })
})

describe('assertCanManageTarget', () => {
  const staff = { createdBy: 'owner1', authUid: 'staff1' }

  it('owner manages anyone they created, including admins', () => {
    expect(statusOf(() => assertCanManageTarget(owner, 'owner1', staff, undefined))).toBeUndefined()
    expect(
      statusOf(() => assertCanManageTarget(owner, 'owner1', { ...staff, admin: true }, undefined))
    ).toBeUndefined()
  })

  it('admin manages regular staff', () => {
    expect(
      statusOf(() => assertCanManageTarget(admin, 'owner1', staff, { admin: false }))
    ).toBeUndefined()
  })

  it('admin cannot touch another admin (flag on either record)', () => {
    expect(
      statusOf(() => assertCanManageTarget(admin, 'owner1', { ...staff, admin: true }, undefined))
    ).toBe(403)
    expect(statusOf(() => assertCanManageTarget(admin, 'owner1', staff, { admin: true }))).toBe(403)
  })

  it('admin cannot change their own record', () => {
    expect(
      statusOf(() =>
        assertCanManageTarget(admin, 'owner1', { ...staff, authUid: 'admin1' }, undefined)
      )
    ).toBe(403)
  })

  it('nobody manages a record from another workspace', () => {
    expect(
      statusOf(() =>
        assertCanManageTarget(owner, 'owner1', { ...staff, createdBy: 'x' }, undefined)
      )
    ).toBe(403)
  })
})

describe('parseNewStaff', () => {
  it('normalises names and defaults status to active', () => {
    const f = parseNewStaff({ firstName: ' ada ', lastName: 'obi', email: 'a@b.co' })
    expect(f.firstName).toBe('Ada')
    expect(f.status).toBe('active')
    expect(f.hireDate).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('never creates inactive staff and rejects bad input', () => {
    expect(
      parseNewStaff({ firstName: 'A', lastName: 'B', email: 'a@b.co', status: 'inactive' }).status
    ).toBe('active')
    expect(statusOf(() => parseNewStaff({ firstName: '', lastName: 'B', email: 'a@b.co' }))).toBe(
      400
    )
    expect(
      statusOf(() => parseNewStaff({ firstName: 'A', lastName: 'B', email: 'a@b.co', salary: -5 }))
    ).toBe(400)
  })
})
