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

  // Check if user can manage (edit/delete) - either super admin or manager
  const canManage = computed(() => {
    // Super admins can always manage
    if (!isStaff.value) return true
    
    // Staff can only manage if they're managers
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

  // Check if user can manage inventory items - super admins and managers can manage
  const canManageInventoryItems = computed(() => {
    // Super admins can always manage inventory items
    if (!isStaff.value) return true
    
    // Managers can also manage inventory items
    // Staff and interns have view-only access
    return isManager.value
  })

  // Check if user can create inventory folders - super admins and managers can create
  const canCreateInventoryFolders = computed(() => {
    // Super admins can always create inventory folders
    if (!isStaff.value) return true
    
    // Managers can also create inventory folders
    // Staff and interns cannot create folders
    return isManager.value
  })

  return {
    isStaff,
    isManager,
    canManage,
    isReadOnly,
    canCreate,
    canManageInventoryItems,
    canCreateInventoryFolders,
  }
}

