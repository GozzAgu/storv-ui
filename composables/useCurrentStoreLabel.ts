import { computed } from 'vue'
import { useStoresStore } from '~/stores/stores'
import { getStoreBranchShortLabel } from '~/utils/store-branch-label'

/** Short branch label for page titles / toolbars (e.g. "Kano"). */
export function useCurrentStoreLabel() {
  const storesStore = useStoresStore()

  const currentStoreLabel = computed(() => {
    const store = storesStore.currentStore
    if (!store?.name) return ''
    return getStoreBranchShortLabel(store.name) || store.name
  })

  /** "Kano · Inventory" style titles when a branch is active. */
  function branchPageTitle(pageName: string): string {
    const branch = currentStoreLabel.value
    return branch ? `${branch} · ${pageName}` : pageName
  }

  return { currentStoreLabel, branchPageTitle }
}
