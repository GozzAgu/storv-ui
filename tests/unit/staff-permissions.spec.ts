import { describe, expect, it } from 'vitest'
import {
  EMPTY_STAFF_PERMISSIONS,
  FULL_STAFF_PERMISSIONS,
  deriveDefaultPermissions,
  hasAnyModuleManageAccess,
  resolveStaffPermissions,
  summarizeStaffPermissions,
} from '~/utils/staff-permissions'

describe('deriveDefaultPermissions', () => {
  it('manager with inventory grant: full products manage + receipts edit + refund', () => {
    const p = deriveDefaultPermissions({ role: 'manager', canManageInventory: true })
    expect(p.products).toEqual({ view: true, create: true, edit: true, delete: true })
    expect(p.receipts).toEqual({ view: true, create: true, edit: true, delete: false, refund: true })
  })

  it('manager without inventory grant: view-only products, receipts edit + refund still implicit', () => {
    const p = deriveDefaultPermissions({ role: 'manager' })
    expect(p.products).toEqual({ view: true, create: false, edit: false, delete: false })
    expect(p.receipts).toEqual({ view: true, create: true, edit: true, delete: false, refund: true })
  })

  it('staff with receipts grant: no products manage, no receipts edit, but refund granted', () => {
    const p = deriveDefaultPermissions({ role: 'staff', canManageReceipts: true })
    expect(p.products).toEqual({ view: true, create: false, edit: false, delete: false })
    expect(p.receipts).toEqual({ view: true, create: true, edit: false, delete: false, refund: true })
  })

  it('staff without receipts grant: view + create receipts only (POS), no refund', () => {
    const p = deriveDefaultPermissions({ role: 'staff' })
    expect(p.receipts).toEqual({ view: true, create: true, edit: false, delete: false, refund: false })
  })

  it('intern with receipts grant: same shape as staff+grant', () => {
    const p = deriveDefaultPermissions({ role: 'intern', canManageReceipts: true })
    expect(p.receipts.refund).toBe(true)
    expect(p.receipts.edit).toBe(false)
  })

  it('intern without receipts grant: baseline view/create only', () => {
    const p = deriveDefaultPermissions({ role: 'intern' })
    expect(p.receipts).toEqual({ view: true, create: true, edit: false, delete: false, refund: false })
    expect(p.products).toEqual({ view: true, create: false, edit: false, delete: false })
  })

  it('canManageInventory on a non-manager role is ignored (matches legacy mutual exclusivity)', () => {
    const p = deriveDefaultPermissions({ role: 'staff', canManageInventory: true })
    expect(p.products.create).toBe(false)
  })

  it('receipts.delete is never granted by migration', () => {
    expect(deriveDefaultPermissions({ role: 'manager', canManageInventory: true }).receipts.delete).toBe(
      false
    )
  })
})

describe('resolveStaffPermissions', () => {
  it('prefers a stored permissions object over deriving from legacy fields', () => {
    const stored = FULL_STAFF_PERMISSIONS
    const result = resolveStaffPermissions({ role: 'staff', permissions: stored })
    expect(result).toBe(stored)
  })

  it('falls back to deriveDefaultPermissions when permissions is absent', () => {
    const result = resolveStaffPermissions({ role: 'manager', canManageInventory: true })
    expect(result.products.edit).toBe(true)
  })
})

describe('hasAnyModuleManageAccess', () => {
  it('is false for the empty matrix', () => {
    expect(hasAnyModuleManageAccess(EMPTY_STAFF_PERMISSIONS)).toBe(false)
  })

  it('is true when only receipts.refund is granted', () => {
    const p = deriveDefaultPermissions({ role: 'staff', canManageReceipts: true })
    expect(hasAnyModuleManageAccess(p)).toBe(true)
  })

  it('is true for the full matrix', () => {
    expect(hasAnyModuleManageAccess(FULL_STAFF_PERMISSIONS)).toBe(true)
  })
})

describe('summarizeStaffPermissions', () => {
  it('labels the full matrix "full"', () => {
    expect(summarizeStaffPermissions(FULL_STAFF_PERMISSIONS)).toBe('full')
  })

  it('labels the empty matrix "view-only"', () => {
    expect(summarizeStaffPermissions(EMPTY_STAFF_PERMISSIONS)).toBe('view-only')
  })

  it('labels a partial grant "custom"', () => {
    const p = deriveDefaultPermissions({ role: 'staff', canManageReceipts: true })
    expect(summarizeStaffPermissions(p)).toBe('custom')
  })
})
