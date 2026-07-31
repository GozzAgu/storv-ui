import { computed, ref } from 'vue'
import type { InventoryFolder } from '~/stores/inventory'
import { useInventoryStore } from '~/stores/inventory'
import {
  buildFolderDisplayRows,
  folderHasChildren,
  getChildFolders,
  getFolderParent,
  getRootFolders,
  rollupFolderStats,
  type InventoryFolderDisplayRow,
} from '~/utils/inventory-folder-tree'

/** Parent → subcategory navigation for Create New Sale (matches Inventory hub flow). */
export function useReceiptCategoryPicker() {
  const inventoryStore = useInventoryStore()

  const selectedParentFolder = ref<InventoryFolder | null>(null)
  const selectedFolder = ref<InventoryFolder | null>(null)
  const folderSearchQuery = ref('')
  const subcategorySearchQuery = ref('')
  /** True when step 0 picked a leaf root and step 1 was skipped. */
  const skippedSubcategoryStep = ref(false)

  const allFolders = computed(() => inventoryStore.folders)

  const parentCategoryRows = computed((): InventoryFolderDisplayRow[] => {
    const query = folderSearchQuery.value.trim()
    if (query) {
      return buildFolderDisplayRows(allFolders.value, { searchQuery: query })
    }
    return getRootFolders(allFolders.value).map((folder) => ({
      folder,
      depth: 0 as const,
    }))
  })

  const subcategoryFolders = computed(() => {
    const parent = selectedParentFolder.value
    if (!parent) return [] as InventoryFolder[]
    let list = getChildFolders(allFolders.value, parent.id)
    const query = subcategorySearchQuery.value.trim().toLowerCase()
    if (query) {
      list = list.filter(
        (folder) =>
          folder.name.toLowerCase().includes(query) ||
          (folder.description || '').toLowerCase().includes(query)
      )
    }
    return [...list].sort((a, b) => a.name.localeCompare(b.name))
  })

  function isCategoryHub(folder: InventoryFolder): boolean {
    return folderHasChildren(allFolders.value, folder.id)
  }

  function folderPickerMeta(folder: InventoryFolder): string {
    if (isCategoryHub(folder)) {
      const count = getChildFolders(allFolders.value, folder.id).length
      return `${count} subcategor${count === 1 ? 'y' : 'ies'}`
    }
    const stats = rollupFolderStats(folder, allFolders.value)
    const count = stats.itemCount ?? 0
    return `${count} ${count === 1 ? 'item' : 'items'}`
  }

  function isParentRowSelected(folder: InventoryFolder): boolean {
    if (isCategoryHub(folder)) {
      return selectedParentFolder.value?.id === folder.id && !selectedFolder.value
    }
    return selectedFolder.value?.id === folder.id
  }

  function isSubcategoryRowSelected(folder: InventoryFolder): boolean {
    return selectedFolder.value?.id === folder.id
  }

  function selectParentHub(folder: InventoryFolder) {
    selectedParentFolder.value = folder
    selectedFolder.value = null
    skippedSubcategoryStep.value = false
  }

  function selectLeafCategory(folder: InventoryFolder) {
    selectedFolder.value = folder
    selectedParentFolder.value = getFolderParent(allFolders.value, folder)
    skippedSubcategoryStep.value = false
  }

  function onParentCategoryRowClick(row: InventoryFolderDisplayRow) {
    if (isCategoryHub(row.folder)) {
      selectParentHub(row.folder)
      return
    }
    selectLeafCategory(row.folder)
  }

  function onSubcategoryClick(folder: InventoryFolder) {
    selectLeafCategory(folder)
  }

  function resetCategoryPicker() {
    selectedParentFolder.value = null
    selectedFolder.value = null
    folderSearchQuery.value = ''
    subcategorySearchQuery.value = ''
    skippedSubcategoryStep.value = false
  }

  function canProceedParentStep(): boolean {
    return selectedParentFolder.value !== null || selectedFolder.value !== null
  }

  function canProceedSubcategoryStep(): boolean {
    return selectedFolder.value !== null
  }

  /** Advance from parent step; returns next step index (1 or 2). */
  function nextStepFromParent(): number {
    if (selectedFolder.value && !isCategoryHub(selectedFolder.value)) {
      skippedSubcategoryStep.value = true
      return 2
    }
    skippedSubcategoryStep.value = false
    return 1
  }

  /** Step index when going back from items. */
  function previousStepFromItems(): number {
    return skippedSubcategoryStep.value ? 0 : 1
  }

  return {
    selectedParentFolder,
    selectedFolder,
    folderSearchQuery,
    subcategorySearchQuery,
    skippedSubcategoryStep,
    parentCategoryRows,
    subcategoryFolders,
    isCategoryHub,
    folderPickerMeta,
    isParentRowSelected,
    isSubcategoryRowSelected,
    onParentCategoryRowClick,
    onSubcategoryClick,
    selectParentHub,
    selectLeafCategory,
    resetCategoryPicker,
    canProceedParentStep,
    canProceedSubcategoryStep,
    nextStepFromParent,
    previousStepFromItems,
  }
}
