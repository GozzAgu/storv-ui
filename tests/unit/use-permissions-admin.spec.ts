import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref } from 'vue'

type Member = {
  authUid?: string
  admin?: boolean
  adminGrants?: Record<string, boolean>
  permissions?: Record<string, Record<string, boolean>>
}

const userData = ref<{ role?: string } | null>({ role: 'superAdmin' })
const staffMember = ref<Member | null>(null)

vi.mock('~/stores/auth', () => ({
  useAuthStore: () => ({ currentUser: { uid: 'admin1' } }),
}))

vi.mock('~/stores/user', () => ({
  useUserStore: () => ({
    get userData() {
      return userData.value
    },
    get isSuperAdmin() {
      return userData.value?.role === 'superAdmin'
    },
  }),
}))

vi.mock('~/stores/staff', () => ({
  useStaffStore: () => ({
    get getCurrentStaffMember() {
      return staffMember.value
    },
  }),
}))

const planViewOnly = ref(false)
vi.mock('~/composables/usePlanViewOnly', () => ({
  usePlanViewOnly: () => ({ isViewOnly: planViewOnly }),
}))

async function perms() {
  const { usePermissions } = await import('~/composables/usePermissions')
  return usePermissions()
}

describe('usePermissions for branch admins', () => {
  beforeEach(() => {
    userData.value = { role: 'staff' }
    staffMember.value = { authUid: 'admin1', admin: true }
    planViewOnly.value = false
  })

  it('treats an admin as able to manage staff and every module', async () => {
    const p = await perms()
    expect(p.isAdmin.value).toBe(true)
    expect(p.canManageStaff.value).toBe(true)
    expect(p.canCreateStaff.value).toBe(true)
    expect(p.canEditStaffPermissions.value).toBe(true)
    expect(p.can('products', 'delete')).toBe(true)
    expect(p.can('multiStoreSync', 'edit')).toBe(false)
  })

  it('unlocks transfers only when the owner turns on the stock-transfers extra', async () => {
    let p = await perms()
    expect(p.can('multiStoreSync', 'view')).toBe(false)
    expect(p.hasAdminGrant('stockTransfers')).toBe(false)

    staffMember.value = {
      authUid: 'admin1',
      admin: true,
      adminGrants: { stockTransfers: true },
    }
    p = await perms()
    expect(p.hasAdminGrant('stockTransfers')).toBe(true)
    expect(p.can('multiStoreSync', 'create')).toBe(true)
  })

  it('keeps owner-only things away from an admin', async () => {
    const p = await perms()
    expect(p.isStoreOwner.value).toBe(false)
    expect(p.canViewFinancials.value).toBe(false)
    expect(p.canManageBilling.value).toBe(false)
  })

  it('gates delete sales and commissions on the owner’s extra', async () => {
    let p = await perms()
    expect(p.canDeleteReceipts.value).toBe(false)
    expect(p.canManageCommissions.value).toBe(false)

    staffMember.value = { authUid: 'admin1', admin: true, adminGrants: { deleteSales: true } }
    p = await perms()
    expect(p.canDeleteReceipts.value).toBe(true)
    expect(p.canManageCommissions.value).toBe(true)
    expect(p.hasAdminGrant('branches')).toBe(false)
  })

  it('ignores extras on someone who is not an admin', async () => {
    staffMember.value = { authUid: 'staff1', admin: false, adminGrants: { deleteSales: true } }
    const p = await perms()
    expect(p.isAdmin.value).toBe(false)
    expect(p.canDeleteReceipts.value).toBe(false)
    expect(p.canManageStaff.value).toBe(false)
  })

  it('lets an admin act on regular staff, but not on themselves or other admins', async () => {
    const p = await perms()
    expect(p.canManageStaffMember({ authUid: 'staff1' })).toBe(true)
    expect(p.canManageStaffMember({ authUid: 'admin1' })).toBe(false)
    expect(p.canManageStaffMember({ authUid: 'admin2', admin: true })).toBe(false)
  })

  it('lets the owner act on anyone and holds every extra', async () => {
    userData.value = { role: 'superAdmin' }
    staffMember.value = null
    const p = await perms()
    expect(p.canManageStaffMember({ authUid: 'admin2', admin: true })).toBe(true)
    expect(p.hasAdminGrant('dataExport')).toBe(true)
    expect(p.canDeleteReceipts.value).toBe(true)
  })

  it('leaves only viewing when the plan makes the store view only, owner included', async () => {
    planViewOnly.value = true
    let p = await perms()
    expect(p.can('products', 'view')).toBe(true)
    expect(p.can('products', 'edit')).toBe(false)
    expect(p.canManageStaff.value).toBe(false)
    expect(p.hasAdminGrant('stockTransfers')).toBe(false)
    expect(p.isReadOnly.value).toBe(true)

    userData.value = { role: 'superAdmin' }
    staffMember.value = null
    p = await perms()
    expect(p.can('receipts', 'view')).toBe(true)
    expect(p.can('receipts', 'create')).toBe(false)
    expect(p.permissions.value.receipts.refund).toBe(false)
    expect(p.canManageStaffMember({ authUid: 'staff1' })).toBe(false)
    expect(p.canViewFinancials.value).toBe(true)
  })
})
