import { computed } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { useUserStore } from '~/stores/user'
import { useStaffStore } from '~/stores/staff'

/**
 * Composable for checking user permissions
 */
export const usePermissions = () => {
  const authStore = useAuthStore()
  const userStore = useUserStore()
  const staffStore = useStaffStore()

  const isStaff = computed(() => userStore.userData?.role === 'staff')

  const isManager = computed(() => {
    if (!isStaff.value || !authStore.currentUser) return false
    const currentStaffMember = staffStore.getCurrentStaffMember
    return currentStaffMember?.role === 'manager'
  })

  /** Owner-granted inventory access for a manager (not all managers by default). */
  const hasInventoryEditorAccess = computed(() => {
    if (!userStore.isSuperAdmin) {
      const member = staffStore.getCurrentStaffMember
      return member?.canManageInventory === true
    }
    return true
  })

  const canManage = computed(() => {
    if (!isStaff.value) return true
    return isManager.value
  })

  const isReadOnly = computed(() => {
    return isStaff.value && !isManager.value && !hasInventoryEditorAccess.value
  })

  const canCreate = computed(() => !!authStore.currentUser)

  const canEditReceipts = computed(() => userStore.isSuperAdmin || isManager.value)

  const canDeleteReceipts = computed(() => !isStaff.value)

  const canManageInventoryItems = computed(() => hasInventoryEditorAccess.value)

  const canCreateInventoryFolders = computed(() => hasInventoryEditorAccess.value)

  const canCreateStaff = computed(() => !isStaff.value)

  const canRemoveStaff = computed(() => userStore.isSuperAdmin)

  const canMoveStaff = computed(() => userStore.isSuperAdmin)

  /** Super admin can grant inventory editor rights to chosen managers. */
  const canGrantInventoryAccess = computed(() => userStore.isSuperAdmin)

  /** Unit cost, margin, COGS, and gross profit - super admin only. */
  const canViewProfitAndCost = computed(() => userStore.isSuperAdmin)

  return {
    isStaff,
    isManager,
    hasInventoryEditorAccess,
    canManage,
    isReadOnly,
    canCreate,
    canEditReceipts,
    canDeleteReceipts,
    canManageInventoryItems,
    canCreateInventoryFolders,
    canCreateStaff,
    canRemoveStaff,
    canMoveStaff,
    canGrantInventoryAccess,
    canViewProfitAndCost,
  }
}
