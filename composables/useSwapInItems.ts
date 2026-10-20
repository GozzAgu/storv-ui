import { computed, ref } from 'vue'
import { useInventoryStore, type InventoryItem } from '~/stores/inventory'
import { swapInNeedsPrice } from '~/utils/inventory-item-price'

// Shared across the Inventory page and its Swap-ins tab so the tab count shows before the tab opens
// and a price set from the tab clears it straight away.
const items = ref<InventoryItem[]>([])
const loading = ref(false)
const loaded = ref(false)
const loadError = ref<string | null>(null)
let inflight: Promise<void> | null = null

/** Swap-in items for the active store, plus the unsold ones still waiting for a Unit Price. */
export function useSwapInItems() {
  const inventoryStore = useInventoryStore()

  async function load(options?: { force?: boolean }) {
    if (inflight) return inflight
    if (loaded.value && !options?.force) return
    loading.value = true
    loadError.value = null
    inflight = (async () => {
      try {
        items.value = await inventoryStore.fetchSwapInItems()
        loaded.value = true
      } catch (error) {
        console.error('[inventory] Swap-ins load failed:', error)
        loadError.value = error instanceof Error ? error.message : 'Please try again.'
      } finally {
        loading.value = false
        inflight = null
      }
    })()
    return inflight
  }

  /** Apply a saved change to the cached item so lists and counts update without a reload. */
  function patchItem(itemId: string, updates: Partial<InventoryItem>) {
    items.value = items.value.map((item) => (item.id === itemId ? { ...item, ...updates } : item))
  }

  /** Forget the cache, e.g. after switching store. */
  function reset() {
    items.value = []
    loaded.value = false
  }

  const needsPrice = computed(() => items.value.filter(swapInNeedsPrice))

  return { items, loading, loaded, loadError, needsPrice, load, patchItem, reset }
}
