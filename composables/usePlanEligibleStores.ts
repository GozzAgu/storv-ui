import { computed } from 'vue'
import { useStoresStore } from '~/stores/stores'
import { useSubscriptionFeatures } from '~/composables/useSubscriptionFeatures'
import { getEligibleStoresForPlan } from '~/types/subscription'
import { filterStoresForBusinessExperience } from '~/utils/branch-experience'
import type { Store } from '~/composables/useStores'

/**
 * Super-admin store list respecting subscription maxStores (oldest branches kept after downgrade).
 * Solo/simple experience without multi-location unlock: current store only.
 * Staff still uses full `storesStore` assignment from their membership.
 */
export function usePlanEligibleStores() {
  const storesStore = useStoresStore()
  const { plan } = useSubscriptionFeatures()
  const { canManageBranches } = useBusinessCapabilities()

  const eligibleStores = computed<Store[]>(() => {
    const planEligible = getEligibleStoresForPlan(storesStore.stores, plan.value)
    return filterStoresForBusinessExperience(planEligible, {
      canManageBranches: canManageBranches.value,
      currentStoreId: storesStore.currentStoreId,
    })
  })

  const hiddenStoreCount = computed(() =>
    Math.max(0, storesStore.stores.length - eligibleStores.value.length)
  )

  const hiddenStores = computed<Store[]>(() => {
    const eligibleIds = new Set(eligibleStores.value.map((store) => store.id))
    return storesStore.stores.filter((store) => !eligibleIds.has(store.id))
  })

  return { eligibleStores, hiddenStores, hiddenStoreCount, plan }
}
