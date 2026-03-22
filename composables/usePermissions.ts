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

  // Check if current user is staff
  const isStaff = computed(() => {
    return userStore.userData?.role === 'staff'
  })

  // Check if current user is a manager
  const isManager = computed(() => {
    if (!isStaff.value || !authStore.currentUser) return false
    
    // Get the current staff member's document from state
    const currentStaffMember = staffStore.getCurrentStaffMember
    return currentStaffMember?.role === 'manager'
  })

  // Store ops except inventory: super admin or manager (departments, settings, etc.)
  const canManage = computed(() => {
    if (!isStaff.value) return true
    return isManager.value
  })

  // Check if user can only view (read-only access)
  const isReadOnly = computed(() => {
    return isStaff.value && !isManager.value
  })

  // Check if user can create receipts - all authenticated users can create
  const canCreate = computed(() => {
    // All authenticated users (super admins, managers, and staff) can create receipts
    return !!authStore.currentUser
  })

  // Edit receipt / line items / refund flows — super admin or store manager (not regular staff)
  const canEditReceipts = computed(() => userStore.isSuperAdmin || isManager.value)

  // Check if user can delete receipts - only super admins
  const canDeleteReceipts = computed(() => {
    // Only super admins can delete receipts
    return !isStaff.value
  })

  // Inventory structure (folders/items) — super admin only
  const canManageInventoryItems = computed(() => userStore.isSuperAdmin)

  const canCreateInventoryFolders = computed(() => userStore.isSuperAdmin)

  // Check if user can create staff - only super admins (managers cannot create staff)
  const canCreateStaff = computed(() => {
    // Only super admins can create staff
    // Managers have all other permissions but cannot create staff
    return !isStaff.value
  })

  return {
    isStaff,
    isManager,
    canManage,
    isReadOnly,
    canCreate,
    canEditReceipts,
    canDeleteReceipts,
    canManageInventoryItems,
    canCreateInventoryFolders,
    canCreateStaff,
  }
}

