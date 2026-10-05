import { computed, ref } from 'vue'
import { useStoresStore } from '~/stores/stores'
import { useUserStore } from '~/stores/user'
import { useAppToast } from '~/composables/useAppToast'
import { getStoreBranchShortLabel } from '~/utils/store-branch-label'
import {
  getStoreSwitcherPrimaryLabel,
  getStoreSwitcherSecondaryLabel,
} from '~/utils/branch-name'

type BranchLike = {
  id?: string
  name?: string | null
  address?: string | null
  description?: string | null
}

/** Branch list + switching, shared by every branch switcher UI. */
export function useBranchSwitcher() {
  const storesStore = useStoresStore()
  const userStore = useUserStore()
  const toast = useAppToast()
  const { canManageBranches } = useBusinessCapabilities()
  const { eligibleStores } = usePlanEligibleStores()

  const switchingStore = ref(false)
  const loading = computed(() => storesStore.loading)
  const isStaff = computed(() => userStore.userData?.role === 'staff')
  const stores = computed(() =>
    userStore.userData?.role === 'superAdmin' ? eligibleStores.value : storesStore.stores
  )
  const currentStore = computed(() => storesStore.currentStore)

  function storePrimaryLabel(store: BranchLike) {
    return getStoreSwitcherPrimaryLabel(store, stores.value)
  }

  function storeSecondaryLabel(store: BranchLike) {
    return getStoreSwitcherSecondaryLabel(store, stores.value)
  }

  async function switchStore(storeId: string) {
    if (switchingStore.value || storeId === storesStore.currentStoreId) return

    if (userStore.userData?.role === 'superAdmin' && !canManageBranches.value) {
      toast.error(
        'Branches are not available on your workspace style. Enable multi-location in Settings.'
      )
      return
    }

    try {
      switchingStore.value = true

      const [departmentsModule, staffModule, inventoryModule, receiptsModule, customersModule] =
        await Promise.all([
          import('~/stores/departments'),
          import('~/stores/staff'),
          import('~/stores/inventory'),
          import('~/stores/receipts'),
          import('~/stores/customers'),
        ])

      departmentsModule.useDepartmentsStore().loading = true
      staffModule.useStaffStore().loading = true
      inventoryModule.useInventoryStore().loading = true
      receiptsModule.useReceiptsStore().loading = true
      customersModule.useCustomersStore().loading = true

      await storesStore.setCurrentStore(storeId)

      const label = getStoreBranchShortLabel(storesStore.getStoreById(storeId)?.name) || 'store'
      toast.success(`Showing data for ${label}. Lists and metrics are scoped to this branch.`)
    } catch (err: any) {
      console.error('Error switching store:', err)
      toast.error(err?.message || 'Failed to switch store')
    } finally {
      switchingStore.value = false
    }
  }

  return {
    stores,
    currentStore,
    loading,
    isStaff,
    switchingStore,
    switchStore,
    storePrimaryLabel,
    storeSecondaryLabel,
  }
}
