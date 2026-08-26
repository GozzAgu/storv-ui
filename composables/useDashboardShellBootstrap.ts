import { useAuthStore } from '~/stores/auth'
import { useUserStore } from '~/stores/user'
import { useStoresStore } from '~/stores/stores'
import { useDepartmentsStore } from '~/stores/departments'
import { useInventoryStore } from '~/stores/inventory'
import { useStaffStore } from '~/stores/staff'
import { isStaffCreationInProgress } from '~/utils/staff-creation-session'

let shellBootstrapInflight: Promise<void> | null = null
let shellBootstrapKey = ''

/**
 * Coordinates one-time dashboard shell data load (user, stores, folders, departments).
 * Dedupes parallel calls from layout watches and page mounts.
 */
export function runDashboardShellBootstrap(options?: { force?: boolean }): Promise<void> {
  if (options?.force) {
    shellBootstrapInflight = null
    shellBootstrapKey = ''
  }

  const authStore = useAuthStore()
  const userStore = useUserStore()
  const userId = authStore.currentUser?.uid ?? ''
  const role = userStore.userData?.role ?? ''
  const key = `${userId}:${role}`

  if (!options?.force && shellBootstrapInflight && shellBootstrapKey === key) {
    return shellBootstrapInflight
  }

  const run = (async () => {
    if (authStore.loading || !authStore.currentUser) return
    if (isStaffCreationInProgress()) return

    const uid = authStore.currentUser.uid
    if (!userStore.userData || userStore.userData.uid !== uid) {
      await userStore.fetchUserData(uid)
    }

    const userData = userStore.userData
    if (!userData) return

    const storesStore = useStoresStore()
    const departmentsStore = useDepartmentsStore()
    const inventoryStore = useInventoryStore()
    const staffStore = useStaffStore()

    if (userData.role === 'superAdmin') {
      await storesStore.fetchStores()
      await storesStore.initializeCurrentStore()
      await Promise.all([
        departmentsStore.fetchDepartments(),
        inventoryStore.fetchFolders(),
      ])
      return
    }

    if (userData.role === 'staff') {
      try {
        await staffStore.fetchCurrentStaffMember()
      } catch {
        /* non-fatal; pages may retry */
      }
      await storesStore.initializeCurrentStore()
      await Promise.all([
        departmentsStore.fetchDepartments(),
        inventoryStore.fetchFolders(),
      ])
    }
  })()

  shellBootstrapKey = key
  shellBootstrapInflight = run.finally(() => {
    if (shellBootstrapInflight === run) {
      shellBootstrapInflight = null
    }
  })

  return shellBootstrapInflight
}
