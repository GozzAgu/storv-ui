import {
  downloadBuybacksExport,
  downloadInventoryExport,
  downloadReceiptsExport,
  downloadStockLoansExport,
  delayBetweenDownloads,
  type StoreExportMeta,
} from '~/utils/store-data-export'
import {
  fetchAllCustomerBuybacksForExport,
  fetchAllSellerLoanOutsForExport,
} from '~/utils/store-data-export-fetch'
import { resolveBusinessNameFromUserData } from '~/utils/receipt-business-name'
import { useInventoryStore } from '~/stores/inventory'
import { useReceiptsStore } from '~/stores/receipts'
import { useUserStore } from '~/stores/user'
import { useStoresStore } from '~/stores/stores'

export interface StoreDataExportSummary {
  inventory: { folders: number; items: number; filename: string }
  receipts: { count: number; filename: string }
  buybacks: { count: number; filename: string }
  stockLoans: { count: number; filename: string }
}

export function useStoreDataExport() {
  const inventoryStore = useInventoryStore()
  const receiptsStore = useReceiptsStore()
  const userStore = useUserStore()
  const storesStore = useStoresStore()

  const exporting = ref(false)
  const exportStatus = ref('')

  function getExportMeta(): StoreExportMeta {
    return {
      storeName: resolveBusinessNameFromUserData(userStore.userData, {
        branchName: storesStore.currentStore?.name,
      }),
      branchName: storesStore.currentStore?.name || '',
    }
  }

  async function gatherInventoryForExport() {
    await inventoryStore.fetchFolders()

    const itemsByFolderId = await inventoryStore.fetchAllItemsByFolderForExport()

    const folders = await Promise.all(
      inventoryStore.folders.map(async (folder) => {
        const full = await inventoryStore.fetchFolder(folder.id)
        return full ?? folder
      })
    )

    return { folders, itemsByFolderId }
  }

  async function exportInventoryExcel() {
    const meta = getExportMeta()
    const { folders, itemsByFolderId } = await gatherInventoryForExport()
    const itemCount = Object.values(itemsByFolderId).reduce((sum, items) => sum + items.length, 0)

    if (folders.length === 0) {
      throw new Error('No inventory categories were found for this branch.')
    }
    if (itemCount === 0) {
      throw new Error('No inventory products were found to export for this branch.')
    }

    return downloadInventoryExport(folders, itemsByFolderId, meta)
  }

  async function exportReceiptsExcel() {
    await receiptsStore.fetchReceipts({ force: true })
    const meta = getExportMeta()
    return downloadReceiptsExport(receiptsStore.receipts, meta)
  }

  async function exportBuybacksExcel() {
    const buybacks = await fetchAllCustomerBuybacksForExport()
    const meta = getExportMeta()
    return downloadBuybacksExport(buybacks, meta)
  }

  async function exportStockLoansExcel() {
    const loans = await fetchAllSellerLoanOutsForExport()
    const meta = getExportMeta()
    return downloadStockLoansExport(loans, meta)
  }

  async function exportAllStoreData(): Promise<StoreDataExportSummary> {
    exporting.value = true
    try {
      exportStatus.value = 'Exporting inventory…'
      const inventory = await exportInventoryExcel()
      await delayBetweenDownloads()

      exportStatus.value = 'Exporting sales…'
      const receipts = await exportReceiptsExcel()
      await delayBetweenDownloads()

      exportStatus.value = 'Exporting buybacks…'
      const buybacks = await exportBuybacksExcel()
      await delayBetweenDownloads()

      exportStatus.value = 'Exporting stock loans…'
      const stockLoans = await exportStockLoansExcel()

      return {
        inventory: {
          folders: inventory.folders,
          items: inventory.items,
          filename: inventory.filename,
        },
        receipts: { count: receipts.count, filename: receipts.filename },
        buybacks: { count: buybacks.count, filename: buybacks.filename },
        stockLoans: { count: stockLoans.count, filename: stockLoans.filename },
      }
    } finally {
      exporting.value = false
      exportStatus.value = ''
    }
  }

  return {
    exporting,
    exportStatus,
    exportAllStoreData,
    exportInventoryExcel,
    exportReceiptsExcel,
    exportBuybacksExcel,
    exportStockLoansExcel,
  }
}
