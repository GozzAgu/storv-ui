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

  return {
    isStaff,
    isManager,
    canManage,
    isReadOnly,
    canCreate,
  }
}

