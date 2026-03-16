/**
 * Helper function to get the current store ID based on user role
 * - For super admins: returns the currently selected store ID from stores store
 * - For staff: returns the storeId from their staff document
 * This is a standalone function that can be used in stores and composables
 */
export async function getCurrentStoreId(): Promise<string | null> {
  if (import.meta.server) return null

  const { useAuthStore } = await import('~/stores/auth')
  const { useUserStore } = await import('~/stores/user')
  const authStore = useAuthStore()
  const userStore = useUserStore()

  if (!authStore.currentUser) return null

  // Fetch user data if not loaded
  if (!userStore.userData) {
    await userStore.fetchUserData(authStore.currentUser.uid)
  }

  // If staff, get storeId from staff document
  if (userStore.userData?.role === 'staff') {
    const { useStaffStore } = await import('~/stores/staff')
    const staffStore = useStaffStore()
    
    // Try to get from cached staff member first
    let staffMember = staffStore.getCurrentStaffMember
    if (!staffMember || !staffMember.storeId) {
      staffMember = await staffStore.fetchCurrentStaffMember()
    }
    
    return staffMember?.storeId || null
  }

  // For super admin (or any non-staff: admin, etc.), get from stores store
  const { useStoresStore } = await import('~/stores/stores')
  const storesStore = useStoresStore()

  if (!storesStore.currentStoreId && storesStore.stores.length === 0) {
    await storesStore.fetchStores()
  }

  if (!storesStore.currentStoreId) {
    await storesStore.initializeCurrentStore()
  }

  return storesStore.currentStoreId
}
