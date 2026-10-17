import { computed } from 'vue'
import { useStoresStore } from '~/stores/stores'
import { useSubscriptionFeatures } from '~/composables/useSubscriptionFeatures'
import { getEligibleStoresForPlan } from '~/types/subscription'
import { filterStoresForBusinessExperience } from '~/utils/branch-experience'
import type { Store } from '~/composables/useStores'

/**
 * Super-admin store list. Branches past the plan's store count stay listed and openable, but
 * view only (the oldest branches keep full use). Solo/simple experience without multi-location
 * unlock: current store only. Staff still uses full `storesStore` assignment from their membership.
 */
export function usePlanEligibleStores() {
  const storesStore = useStoresStore()
  const { plan, addOns } = useSubscriptionFeatures()
  const { canManageBranches } = useBusinessCapabilities()

  const eligibleStores = computed<Store[]>(() =>
    filterStoresForBusinessExperience(storesStore.stores, {
      canManageBranches: canManageBranches.value,
      currentStoreId: storesStore.currentStoreId,
    })
  )

  const viewOnlyStores = computed<Store[]>(() => {
    const fullIds = new Set(
      getEligibleStoresForPlan(storesStore.stores, plan.value, addOns.value).map((s) => s.id)
    )
    return storesStore.stores.filter((store) => !fullIds.has(store.id))
  })

  const viewOnlyStoreCount = computed(() => viewOnlyStores.value.length)

  function isViewOnlyStore(storeId: string | null | undefined): boolean {
    return !!storeId && viewOnlyStores.value.some((store) => store.id === storeId)
  }

  return { eligibleStores, viewOnlyStores, viewOnlyStoreCount, isViewOnlyStore, plan }
}
