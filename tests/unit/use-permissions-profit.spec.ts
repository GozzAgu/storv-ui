import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref } from 'vue'

const userData = ref<{ role?: string } | null>({ role: 'superAdmin' })
const staffMember = ref<{ role?: string } | null>(null)

vi.mock('~/stores/auth', () => ({
  useAuthStore: () => ({ currentUser: { uid: 'u1' } }),
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

describe('usePermissions profit visibility', () => {
  beforeEach(() => {
    userData.value = { role: 'superAdmin' }
    staffMember.value = null
  })

  it('allows super admin to view profit and cost', async () => {
    const { usePermissions } = await import('~/composables/usePermissions')
    expect(usePermissions().canViewProfitAndCost.value).toBe(true)
  })

  it('blocks staff from viewing profit and cost', async () => {
    userData.value = { role: 'staff' }
    staffMember.value = { role: 'staff' }
    const { usePermissions } = await import('~/composables/usePermissions')
    expect(usePermissions().canViewProfitAndCost.value).toBe(false)
  })

  it('blocks managers from viewing profit and cost', async () => {
    userData.value = { role: 'staff' }
    staffMember.value = { role: 'manager' }
    const { usePermissions } = await import('~/composables/usePermissions')
    expect(usePermissions().canViewProfitAndCost.value).toBe(false)
  })

  it('allows only super admin to manage billing', async () => {
    const { usePermissions } = await import('~/composables/usePermissions')
    expect(usePermissions().canManageBilling.value).toBe(true)

    userData.value = { role: 'staff' }
    staffMember.value = { role: 'manager' }
    expect(usePermissions().canManageBilling.value).toBe(false)
  })
})
