import type { Store } from '~/composables/useStores'

/** Solo/simple experience: one store only; no branch switching or multi-location UI. */
export function filterStoresForBusinessExperience(
  stores: Store[],
  options: {
    canManageBranches: boolean
    currentStoreId?: string | null
  }
): Store[] {
  if (options.canManageBranches || stores.length <= 1) return stores

  const current = options.currentStoreId
    ? stores.find((store) => store.id === options.currentStoreId)
    : undefined

  const fallback = current ?? stores[0]
  return fallback ? [fallback] : []
}
