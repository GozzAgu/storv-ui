import { computed } from 'vue'
import { useStoresStore } from '~/stores/stores'
import { useSubscriptionFeatures } from '~/composables/useSubscriptionFeatures'
import { getEligibleStoresForPlan } from '~/types/subscription'
import type { Store } from '~/composables/useStores'

/**
 * Super-admin store list respecting subscription maxStores (oldest branches kept after downgrade).
 * Staff still uses full `storesStore` assignment from their membership.
 */
export function usePlanEligibleStores() {
 const storesStore = useStoresStore()
 const { plan } = useSubscriptionFeatures()

 const eligibleStores = computed<Store[]>(() => getEligibleStoresForPlan(storesStore.stores, plan.value))

 const hiddenStoreCount = computed(() =>
 Math.max(0, storesStore.stores.length - eligibleStores.value.length)
 )

 return { eligibleStores, hiddenStoreCount, plan }
}
