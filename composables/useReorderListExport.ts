import { collectLowStockRows } from '~/utils/low-stock-items'
import { downloadReorderListExcel } from '~/utils/reorder-list-export'
import { resolveBusinessNameFromUserData } from '~/utils/receipt-business-name'
import { useInventoryStore } from '~/stores/inventory'
import { useUserStore } from '~/stores/user'
import { useStoresStore } from '~/stores/stores'

export function useReorderListExport() {
  const inventoryStore = useInventoryStore()
  const userStore = useUserStore()
  const storesStore = useStoresStore()
  const exporting = ref(false)

  const lowStockThreshold = computed(
    () => userStore.userData?.storeDetails?.settings?.inventory?.lowStockThreshold || 10
  )

  async function gatherLowStockRows(): Promise<ReturnType<typeof collectLowStockRows>> {
    if (inventoryStore.folders.length === 0) {
      await inventoryStore.fetchFolders()
    }

    const folders =
      inventoryStore.lowStockFolders.length > 0
        ? inventoryStore.lowStockFolders
        : inventoryStore.folders

    const itemsByFolderId: Record<string, import('~/stores/inventory').InventoryItem[]> = {}

    await Promise.all(
      folders.map(async (folder) => {
        try {
          itemsByFolderId[folder.id] = await inventoryStore.fetchItemsAllChunked(folder.id)
        } catch {
          itemsByFolderId[folder.id] = []
        }
      })
    )

    return collectLowStockRows(inventoryStore.folders, itemsByFolderId, lowStockThreshold.value)
  }

  async function exportReorderListExcel(): Promise<{ count: number }> {
    exporting.value = true
    try {
      const rows = await gatherLowStockRows()
      if (rows.length === 0) {
        throw new Error(
          'No low-stock items to export. Adjust your threshold in Settings → Inventory.'
        )
      }

      const businessName = resolveBusinessNameFromUserData(userStore.userData, {
        branchName: storesStore.currentStore?.name,
      })
      const branchName = storesStore.currentStore?.name || ''

      downloadReorderListExcel(rows, {
        storeName: businessName,
        branchName,
      })

      return { count: rows.length }
    } finally {
      exporting.value = false
    }
  }

  return {
    exporting,
    exportReorderListExcel,
    gatherLowStockRows,
  }
}
