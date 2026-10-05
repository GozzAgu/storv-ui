import { computed, ref, watch } from 'vue'
import { useStoresStore } from '~/stores/stores'
import { useUserStore } from '~/stores/user'
import { useAppToast } from '~/composables/useAppToast'
import { usePreferences, regions } from '~/composables/usePreferences'
import { usePlanEligibleStores } from '~/composables/usePlanEligibleStores'
import { useSubscriptionFeatures } from '~/composables/useSubscriptionFeatures'
import type { Store } from '~/composables/useStores'
import { resolveEffectiveSubscriptionPlan } from '~/types/subscription'
import { getCitiesForRegion, isCityInRegion } from '~/utils/region-cities'
import { formatBranchDisplayName, parseBranchDisplayName } from '~/utils/branch-name'

type BranchForm = {
  name: string
  description: string
  sellScreenNote: string
  address: string
  phone: string
  email: string
  isActive: boolean
}

function emptyBranchForm(): BranchForm {
  return {
    name: '',
    description: '',
    sellScreenNote: '',
    address: '',
    phone: '',
    email: '',
    isActive: true,
  }
}

/** Branch (store) CRUD, switching and the region-based name picker. Shared by Branches and iOS Settings. */
export function useBranchManagement() {
  const storesStore = useStoresStore()
  const userStore = useUserStore()
  const toast = useAppToast()
  const { limits } = useSubscriptionFeatures()
  const { eligibleStores, hiddenStores, hiddenStoreCount } = usePlanEligibleStores()
  const { canManageBranches } = useBusinessCapabilities()

  const storesLoading = computed(() => storesStore.loading)
  const storesError = computed(() => storesStore.error)
  const currentStore = computed(() => storesStore.currentStore)

  const isMicroSubscription = computed(
    () => resolveEffectiveSubscriptionPlan(userStore.userData) === 'storvv_micro'
  )
  const hiddenStoreNames = computed(() =>
    hiddenStores.value.map((store) => store.name).filter(Boolean)
  )

  /** Negative means unlimited. */
  const maxStores = computed(() => limits.value.maxStores)
  const canAddStore = computed(() => {
    if (maxStores.value < 0) return true
    return storesStore.stores.length < maxStores.value
  })

  const showCreateModal = ref(false)
  const showDeleteModal = ref(false)
  const showStoreSelectionModal = ref(false)
  const editingStore = ref<Store | null>(null)
  const storeToDelete = ref<Store | null>(null)
  const isSubmittingStore = ref(false)
  const isDeletingStore = ref(false)
  const newlyCreatedStoreId = ref<string | null>(null)
  const storeForm = ref<BranchForm>(emptyBranchForm())

  const { preferences } = usePreferences()
  const branchCity = ref('')
  const branchLocality = ref('')
  const useCustomBranchName = ref(false)

  const accountRegion = computed(() => preferences.value.region || 'US')
  const availableBranchCities = computed(() => getCitiesForRegion(accountRegion.value))
  const branchRegionLabel = computed(() => {
    const region = regions.find((r) => r.code === accountRegion.value)
    return region ? `${region.flag} ${region.name}` : 'your region'
  })
  const useRegionBranchPicker = computed(
    () => availableBranchCities.value.length > 0 && !useCustomBranchName.value
  )

  watch([branchCity, branchLocality], () => {
    if (!useRegionBranchPicker.value) return
    storeForm.value.name = formatBranchDisplayName(branchCity.value, branchLocality.value)
  })

  function resetBranchNameFields() {
    branchCity.value = ''
    branchLocality.value = ''
    useCustomBranchName.value = false
  }

  function loadBranchNameFields(name: string) {
    resetBranchNameFields()
    if (availableBranchCities.value.length === 0) {
      storeForm.value.name = name
      return
    }

    const parsed = parseBranchDisplayName(name)
    if (isCityInRegion(parsed.city, accountRegion.value)) {
      branchCity.value = parsed.city
      branchLocality.value = parsed.locality
      storeForm.value.name = formatBranchDisplayName(parsed.city, parsed.locality)
      return
    }

    useCustomBranchName.value = true
    storeForm.value.name = name
  }

  const switchStore = async (storeId: string) => {
    if (!canManageBranches.value && storeId !== storesStore.currentStoreId) {
      toast.error(
        'Branches are not available on your workspace style. Enable multi-location in Settings.'
      )
      return
    }

    try {
      toast.info('Switching store...')
      await storesStore.setCurrentStore(storeId)
      toast.success('Store switched successfully')
    } catch (err: any) {
      toast.error(err.message || 'Failed to switch store')
    }
  }

  const closeStoreModal = () => {
    showCreateModal.value = false
    editingStore.value = null
    resetBranchNameFields()
    storeForm.value = emptyBranchForm()
  }

  const editStore = (store: Store) => {
    editingStore.value = store
    storeForm.value = {
      name: store.name,
      description: store.description || '',
      sellScreenNote: store.sellScreenNote || '',
      address: store.address || '',
      phone: store.phone || '',
      email: store.email || '',
      isActive: store.isActive,
    }
    loadBranchNameFields(store.name)
    showCreateModal.value = true
  }

  const openCreateStoreModal = () => {
    if (!canAddStore.value) {
      toast.error(
        'Storvv Micro allows 1 store. Upgrade your plan in the Account section to add more.'
      )
      return
    }
    resetBranchNameFields()
    showCreateModal.value = true
  }

  const handleStoreSubmit = async () => {
    if (!storeForm.value.name) return
    if (!editingStore.value && !canAddStore.value) {
      toast.error('Storvv Micro allows 1 store. Upgrade your plan to add more.')
      return
    }

    isSubmittingStore.value = true
    try {
      const storePayload = {
        name: storeForm.value.name,
        description: storeForm.value.description,
        sellScreenNote: storeForm.value.sellScreenNote.trim(),
        address: storeForm.value.address,
        phone: storeForm.value.phone,
        email: storeForm.value.email,
        isActive: storeForm.value.isActive,
      }
      if (editingStore.value) {
        await storesStore.updateStore(editingStore.value.id, storePayload)
        toast.success('Store updated successfully')
        closeStoreModal()
      } else {
        const wasFirstStore = storesStore.stores.length === 0
        const logoUrl = userStore.userData?.storeLogoUrl || ''
        const newStoreId = await storesStore.createStore({ ...storePayload, logoUrl })
        toast.success('Store created successfully')
        closeStoreModal()
        await storesStore.fetchStores()

        if (wasFirstStore) {
          newlyCreatedStoreId.value = newStoreId
          showStoreSelectionModal.value = true
        }
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to save store')
    } finally {
      isSubmittingStore.value = false
    }
  }

  const handleStoreSelection = async (storeId: string) => {
    try {
      await storesStore.setCurrentStore(storeId)
      toast.success('Store selected successfully')
      showStoreSelectionModal.value = false
      newlyCreatedStoreId.value = null
    } catch (err: any) {
      toast.error(err.message || 'Failed to select store')
    }
  }

  const confirmDelete = (store: Store) => {
    storeToDelete.value = store
    showDeleteModal.value = true
  }

  const handleStoreDelete = async () => {
    if (!storeToDelete.value) return

    isDeletingStore.value = true
    try {
      await storesStore.deleteStore(storeToDelete.value.id)
      toast.success('Store deleted successfully')
      showDeleteModal.value = false
      storeToDelete.value = null
      await storesStore.fetchStores()
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete store')
    } finally {
      isDeletingStore.value = false
    }
  }

  return {
    storesLoading,
    storesError,
    currentStore,
    eligibleStores,
    hiddenStoreCount,
    hiddenStoreNames,
    isMicroSubscription,
    maxStores,
    canAddStore,
    canManageBranches,
    showCreateModal,
    showDeleteModal,
    showStoreSelectionModal,
    editingStore,
    storeToDelete,
    isSubmittingStore,
    isDeletingStore,
    newlyCreatedStoreId,
    storeForm,
    branchCity,
    branchLocality,
    availableBranchCities,
    branchRegionLabel,
    useRegionBranchPicker,
    switchStore,
    closeStoreModal,
    editStore,
    openCreateStoreModal,
    handleStoreSubmit,
    handleStoreSelection,
    confirmDelete,
    handleStoreDelete,
  }
}
