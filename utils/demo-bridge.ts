import type { User } from 'firebase/auth'
import type { Customer } from '~/stores/customers'
import type { InventoryFolder, InventoryItem, Template } from '~/stores/inventory'
import type { Receipt, ReceiptItem } from '~/stores/receipts'
import type { DemoItem, DemoReceipt, DemoState, DemoStoreRecord } from '~/types/demo'
import type { UserData } from '~/composables/useUser'
import type { Store } from '~/composables/useStores'
import type { Department } from '~/composables/useDepartments'
import type { ActivityLog } from '~/composables/useActivityLog'
import type { Staff } from '~/composables/useStaff'
import type { SellerLoanOut } from '~/stores/sellerLoanOuts'
import type { CustomerBuyback } from '~/stores/customerBuybacks'
import type { Notification } from '~/stores/notifications'
import type { SavedSearch } from '~/stores/search'
import { DEMO_SAVED_SEARCHES_KEY } from '~/utils/demo-mode'
import { sanitizeDemoDisplayDashes } from '~/utils/demo-display-text'
import { normalizeEntityName } from '~/utils/capitalize-text'
import { demoId } from '~/utils/demo-seed'
import { DEMO_USER_UID, isDemoModeActive, markDemoSessionActive } from '~/utils/demo-mode'
import {
  getDemoExtrasActivityLogs,
  getDemoExtrasBuybacks,
  getDemoExtrasLoans,
  getDemoExtrasNotifications,
  getDemoExtrasStaff,
  getDemoUserOverrides,
  patchDemoUserOverrides,
  resetDemoExtras,
} from '~/utils/demo-extras'
import { useDemoAppStore } from '~/stores/demoApp'
import { useAuthStore } from '~/stores/auth'
import { useUserStore } from '~/stores/user'
import { useStoresStore } from '~/stores/stores'
import { useInventoryStore } from '~/stores/inventory'
import { useReceiptsStore } from '~/stores/receipts'
import { useCustomersStore } from '~/stores/customers'
import { useDepartmentsStore } from '~/stores/departments'
import { useStaffStore } from '~/stores/staff'
import { useNotificationsStore } from '~/stores/notifications'

export const DEMO_PRODUCT_TEMPLATE: Template = {
  id: 'demo_standard_template',
  name: 'Standard product',
  description: 'Demo inventory template',
  fields: [
    { id: 'name', name: 'name', label: 'Product name', type: 'text', required: true },
    { id: 'price', name: 'price', label: 'Price', type: 'currency', required: true },
    {
      id: 'quantity',
      name: 'quantity',
      label: 'Quantity in stock',
      type: 'number',
      required: true,
    },
    { id: 'sku', name: 'sku', label: 'SKU', type: 'text', required: false },
  ],
}

/** Demo staff roster (exported for the staff store's demo branches). */
export function getDemoStaff(storeId: string): Staff[] {
  return getDemoExtrasStaff(storeId, 'active')
}

function getDemoStaffMembers(storeId: string): Staff[] {
  return getDemoStaff(storeId)
}

/** Dummy buyback records for demo analytics and buybacks page. */
export function getDemoBuybacks(storeId: string): CustomerBuyback[] {
  return getDemoExtrasBuybacks(storeId)
}

/** Dummy stock-loan records for the demo. */
export function getDemoSellerLoans(storeId: string): SellerLoanOut[] {
  return getDemoExtrasLoans(storeId)
}

function getDemoDepartments(storeId: string): Department[] {
  return [
    {
      id: 'demo_dept_sales',
      name: 'Sales',
      description: 'Front desk and floor sales',
      departmentType: 'Sales',
      staffCount: 3,
      manager: 'Amaka N.',
      storeId,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: DEMO_USER_UID,
    },
    {
      id: 'demo_dept_ops',
      name: 'Operations',
      description: 'Stock and fulfilment',
      departmentType: 'Operations',
      staffCount: 2,
      manager: 'Ibrahim K.',
      storeId,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: DEMO_USER_UID,
    },
  ]
}

let demoAuthReady = false

export function ensureDemoMode(): boolean {
  return isDemoModeActive()
}

export function initDemoAuth() {
  if (!import.meta.client || demoAuthReady) return
  markDemoSessionActive()

  const authStore = useAuthStore()
  const mockUser = {
    uid: DEMO_USER_UID,
    email: 'demo@storvv.app',
    displayName: 'Demo User',
    emailVerified: true,
  } as User

  authStore.$patch({
    currentUser: mockUser,
    loading: false,
  })
  demoAuthReady = true
}

export function getDemoUserData(state: DemoState): UserData {
  const current = state.stores.find((s) => s.id === state.currentStoreId) ?? state.stores[0]
  const overrides = getDemoUserOverrides()
  return {
    uid: DEMO_USER_UID,
    email: 'demo@storvv.app',
    name: overrides.name || 'Demo User',
    role: 'superAdmin',
    subscription: 'storvv_enterprise',
    hasCompletedOnboarding: true,
    hasCompletedTutorial: true,
    preferences: {
      currency: state.currencyCode,
      currencySymbol: state.currencySymbol,
      region: 'NG',
      language: 'en',
      timezone: 'Africa/Lagos',
      dateFormat: 'DD/MM/YYYY',
      timeFormat: '24h',
    },
    storeDetails: {
      storeName: overrides.storeDetails?.storeName || current?.name || 'Demo store',
      storePhone: overrides.storePhone || overrides.storeDetails?.storePhone || '0800 000 0000',
      settings: overrides.storeDetails?.settings || {
        receipt: { prefix: 'DEMO', nextNumber: 1004 },
        payment: { paymentMethods: ['Cash', 'Transfer', 'Card'] },
      },
      ...overrides.storeDetails,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  }
}

export function demoStoreToStore(record: DemoStoreRecord): Store {
  const name = sanitizeDemoDisplayDashes(record.name)
  return {
    id: record.id,
    name,
    branchName: name,
    address: record.address,
    phone: '0800 000 0000',
    isActive: true,
    ownerId: DEMO_USER_UID,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: DEMO_USER_UID,
  } as Store
}

function availableQty(item: DemoItem) {
  return Math.max(0, item.quantity - item.sold)
}

export function demoItemToInventoryItem(item: DemoItem): InventoryItem {
  const left = availableQty(item)
  const unitCost = item.unitCost ?? Math.round(item.price * 0.65)
  return {
    id: item.id,
    folderId: item.folderId,
    storeId: item.storeId,
    name: item.name,
    price: item.price,
    unitCost,
    quantity: left,
    sku: item.sku ?? '',
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: DEMO_USER_UID,
  }
}

export function demoReceiptToReceipt(r: DemoReceipt): Receipt {
  const items: ReceiptItem[] = r.items.map((line) => ({
    itemId: line.itemId,
    itemName: line.itemName,
    quantity: line.quantity,
    price: line.price,
    sku: '',
  }))
  const status: Receipt['status'] =
    r.status === 'refunded'
      ? 'refunded'
      : r.status === 'balance_due'
        ? 'balance_due'
        : r.status === 'pending'
          ? 'pending'
          : 'completed'
  return {
    id: r.id,
    receiptNumber: r.receiptNumber,
    customerName: r.customerName,
    customerEmail: '',
    customerPhone: r.customerPhone,
    date: new Date(r.date),
    items,
    itemsCount: items.reduce((n, l) => n + l.quantity, 0),
    total: r.total,
    paymentMethod: r.paymentMethod,
    status,
    amountPaid: r.amountPaid,
    balanceDue: r.balanceDue,
    refundReason: r.refundReason,
    folderId: r.folderId,
    itemIds: r.items.map((i) => i.itemId),
    storeId: r.storeId,
    createdAt: new Date(r.date),
    updatedAt: new Date(r.date),
    createdBy: DEMO_USER_UID,
    actualCreator: DEMO_USER_UID,
    createdByUserName: 'Demo User',
  }
}

export function demoCustomerToCustomer(c: DemoState['stores'][0]['customers'][0]): Customer {
  const demo = useDemoAppStore()
  const receiptIds = demo.state.stores
    .flatMap((s) => s.receipts)
    .filter((r) => r.customerName === c.name && r.storeId === c.storeId)
    .map((r) => r.id)
  return {
    id: c.id,
    name: c.name,
    phone: c.phone,
    email: c.email,
    totalOrders: c.totalOrders,
    totalSpent: c.totalSpent,
    receipts: receiptIds,
    storeId: c.storeId,
    lastOrderDate: new Date(),
    firstOrderDate: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: DEMO_USER_UID,
  }
}

function folderStats(store: DemoStoreRecord, folderId: string) {
  const inFolder = store.items.filter((i) => i.folderId === folderId)
  const itemCount = inFolder.length
  const totalValue = inFolder.reduce((sum, i) => sum + availableQty(i) * i.price, 0)
  const lowStockCount = inFolder.filter((i) => {
    const left = availableQty(i)
    return left > 0 && left <= 3
  }).length
  return { itemCount, totalValue, lowStockCount }
}

function buildInventoryForStore(store: DemoStoreRecord) {
  const folders: InventoryFolder[] = store.folders.map((f) => {
    const stats = folderStats(store, f.id)
    return {
      id: f.id,
      name: f.name,
      description: '',
      type: 'products',
      color: '#143f8d',
      hasSerialNumbers: false,
      template: DEMO_PRODUCT_TEMPLATE,
      parentId: f.parentId ?? null,
      usesSubcategories: f.usesSubcategories === true,
      itemCount: stats.itemCount,
      totalValue: stats.totalValue,
      lowStockCount: stats.lowStockCount,
      storeId: store.id,
      createdAt: new Date(),
      createdBy: DEMO_USER_UID,
    }
  })

  const itemsByFolder: Record<string, InventoryItem[]> = {}
  for (const folder of store.folders) {
    itemsByFolder[folder.id] = store.items
      .filter((i) => i.folderId === folder.id)
      .map(demoItemToInventoryItem)
  }

  return { folders, itemsByFolder }
}

export function getDemoSampleNotifications(): Notification[] {
  return getDemoExtrasNotifications()
}

export function getDemoActivityLogs(storeId: string): ActivityLog[] {
  return getDemoExtrasActivityLogs(storeId)
}

export function applyDemoUserDocumentUpdate(updates: Partial<UserData>) {
  patchDemoUserOverrides({
    name: updates.name,
    storePhone: updates.storeDetails?.storePhone,
    storeDetails: updates.storeDetails,
  })
  const demo = useDemoAppStore()
  demo.hydrate()
  const next = getDemoUserData(demo.state)
  useUserStore().$patch({ userData: next })
  return next
}

export function resetDemoExtrasData() {
  resetDemoExtras()
}

export async function syncDemoToPinia() {
  if (!ensureDemoMode()) return

  const demo = useDemoAppStore()
  demo.hydrate()
  const state = demo.state
  const current = demo.currentStore

  const userStore = useUserStore()
  userStore.$patch({
    userData: getDemoUserData(state),
    loading: false,
    error: null,
  })

  const storesStore = useStoresStore()
  storesStore.$patch({
    stores: state.stores.map(demoStoreToStore),
    currentStoreId: state.currentStoreId,
    loading: false,
    error: null,
  })

  if (import.meta.client) {
    localStorage.setItem('currentStoreId', state.currentStoreId)
  }

  const { folders, itemsByFolder } = buildInventoryForStore(current)
  const inventoryStore = useInventoryStore()
  inventoryStore.$patch({
    folders,
    items: itemsByFolder,
    loading: false,
    error: null,
  })
  for (const folder of current.folders) {
    const list = itemsByFolder[folder.id] ?? []
    inventoryStore.itemsPagination[folder.id] = {
      page: 1,
      pageSize: list.length || 25,
      total: list.length,
    }
    inventoryStore.itemsLoadedFully[folder.id] = true
    inventoryStore.itemsLoading[folder.id] = false
  }

  const receiptsStore = useReceiptsStore()
  receiptsStore.$patch({
    receipts: current.receipts.map(demoReceiptToReceipt),
    loading: false,
    error: null,
  })

  const customersStore = useCustomersStore()
  customersStore.$patch({
    customers: current.customers.map(demoCustomerToCustomer),
    loading: false,
    error: null,
  })

  const departmentsStore = useDepartmentsStore()
  departmentsStore.$patch({
    departments: getDemoDepartments(state.currentStoreId),
    loading: false,
    error: null,
  })

  const staffStore = useStaffStore()
  staffStore.$patch((s) => {
    s.staff = getDemoStaffMembers(state.currentStoreId)
    s.loading = false
    s.error = null
  })

  const notificationsStore = useNotificationsStore()
  const sample = getDemoSampleNotifications()
  notificationsStore.$patch({
    notifications: sample,
    unreadCount: sample.filter((n) => !n.read).length,
    loading: false,
    error: null,
  })

  const { usePreferences } = await import('~/composables/usePreferences')
  const prefs = usePreferences()
  prefs.initializeLocalOnly()
}

export async function applyDemoInventoryItemCreate(
  folderId: string,
  itemData: Partial<InventoryItem>
): Promise<string> {
  const demo = useDemoAppStore()
  const item = demo.addInventoryItem({
    folderId,
    name: normalizeEntityName(String(itemData.name ?? 'New item')) || 'New Item',
    price: Number(itemData.price ?? 0),
    quantity: Number(itemData.quantity ?? 0),
    sku: itemData.sku ? String(itemData.sku) : undefined,
  })
  await syncDemoToPinia()
  return item.id
}

export async function applyDemoInventoryItemUpdate(
  itemId: string,
  updates: Partial<InventoryItem>
) {
  const demo = useDemoAppStore()
  const item = demo.state.stores.flatMap((s) => s.items).find((i) => i.id === itemId)
  if (!item) return
  if (updates.name !== undefined) {
    item.name = normalizeEntityName(String(updates.name)) || String(updates.name).trim()
  }
  if (updates.price !== undefined) item.price = Number(updates.price)
  if (updates.quantity !== undefined) {
    const available = Number(updates.quantity)
    item.quantity = item.sold + Math.max(0, available)
  }
  if (updates.sku !== undefined) item.sku = String(updates.sku)
  demo.persist()
  await syncDemoToPinia()
}

export async function applyDemoCreateReceipt(
  receiptData: Omit<Receipt, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>
) {
  const id = useDemoAppStore().importDashboardReceipt(receiptData)
  await syncDemoToPinia()
  return id
}

export async function applyDemoReceiptSale(lines: { itemId: string; quantitySold: number }[]) {
  useDemoAppStore().applySaleLines(lines)
  await syncDemoToPinia()
}

export async function applyDemoCustomerFromReceipt(
  receiptId: string,
  receiptData: {
    customerName: string
    customerEmail?: string
    customerPhone?: string
    total: number
  }
) {
  const id = useDemoAppStore().syncCustomerFromReceipt(receiptId, receiptData)
  await syncDemoToPinia()
  return id
}

export async function applyDemoReceiptRefund(receiptId: string) {
  useDemoAppStore().refundReceipt(receiptId)
  await syncDemoToPinia()
}

export async function applyDemoReceiptUpdate(receiptId: string, updates: Partial<Receipt>) {
  const demo = useDemoAppStore()
  const receipt = demo.currentStore.receipts.find((r) => r.id === receiptId)
  if (!receipt) throw new Error('Receipt not found')
  if (updates.customerName !== undefined) {
    receipt.customerName =
      normalizeEntityName(updates.customerName) || updates.customerName.trim()
  }
  if (updates.status === 'refunded') {
    demo.refundReceipt(receiptId)
  }
  await syncDemoToPinia()
}

export async function applyDemoSetCurrentStore(storeId: string) {
  useDemoAppStore().setCurrentStore(storeId)
  await syncDemoToPinia()
}

export function getDemoUserDocument(uid?: string): UserData | null {
  if (uid && uid !== DEMO_USER_UID) return null
  const demo = useDemoAppStore()
  demo.hydrate()
  return getDemoUserData(demo.state)
}

export async function applyDemoCreateFolder(
  folderData: Pick<
    InventoryFolder,
    | 'name'
    | 'description'
    | 'type'
    | 'color'
    | 'hasSerialNumbers'
    | 'template'
    | 'trackProfit'
    | 'parentId'
    | 'usesSubcategories'
    | 'allowedDepartments'
  >
): Promise<string> {
  const id = useDemoAppStore().addFolder({
    name: normalizeEntityName(folderData.name) || folderData.name.trim(),
    parentId: folderData.parentId ?? null,
    usesSubcategories: folderData.usesSubcategories,
  })
  await syncDemoToPinia()
  return id
}

export async function applyDemoDeleteItem(itemId: string) {
  useDemoAppStore().deleteInventoryItem(itemId)
  await syncDemoToPinia()
}

export async function applyDemoDeleteFolder(folderId: string) {
  useDemoAppStore().deleteFolder(folderId)
  await syncDemoToPinia()
}

function loadDemoSavedSearches(): SavedSearch[] {
  if (!import.meta.client) return []
  try {
    const raw = localStorage.getItem(DEMO_SAVED_SEARCHES_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as SavedSearch[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function persistDemoSavedSearches(searches: SavedSearch[]) {
  if (!import.meta.client) return
  localStorage.setItem(DEMO_SAVED_SEARCHES_KEY, JSON.stringify(searches))
}

export function getDemoSavedSearches(): SavedSearch[] {
  return loadDemoSavedSearches()
}

export function saveDemoSearch(
  name: string,
  query: string,
  filters: SavedSearch['filters']
): string {
  const id = demoId('search')
  const entry: SavedSearch = {
    id,
    name: name.trim(),
    query,
    filters: { ...filters },
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: DEMO_USER_UID,
  }
  const list = [entry, ...loadDemoSavedSearches()]
  persistDemoSavedSearches(list)
  return id
}

export function deleteDemoSavedSearch(searchId: string) {
  persistDemoSavedSearches(loadDemoSavedSearches().filter((s) => s.id !== searchId))
}

export function getDemoFolderTemplatesForStore(storeId: string): InventoryFolder[] {
  const demo = useDemoAppStore()
  demo.hydrate()
  const store = demo.getStore(storeId)
  if (!store) throw new Error('Branch not found.')
  return buildInventoryForStore(store).folders
}

export async function applyDemoDuplicateFolderTemplatesBetweenStores(
  sourceStoreId: string,
  targetStoreId: string,
  options: {
    folderIds: string[]
    includeSubfolders?: boolean
    onExistingName?: 'skip' | 'suffix'
  }
): Promise<{ createdCount: number; skippedCount: number }> {
  if (sourceStoreId === targetStoreId) {
    throw new Error('Choose a branch other than the current one.')
  }

  const demo = useDemoAppStore()
  demo.hydrate()
  const source = demo.getStore(sourceStoreId)
  const target = demo.getStore(targetStoreId)
  if (!source || !target) throw new Error('Branch not found.')

  const { expandFolderTemplatesToCopy, normalizeParentId, partitionFoldersForCopy } =
    await import('~/utils/inventory-folder-tree')

  const onExistingName = options.onExistingName ?? 'skip'
  const includeSubfolders = options.includeSubfolders ?? false
  const requestedUnique = [...new Set(options.folderIds.filter(Boolean))]
  if (requestedUnique.length === 0) {
    throw new Error('Select at least one folder to copy.')
  }

  const sourceFolders = buildInventoryForStore(source).folders
  const missing = requestedUnique.filter((id) => !sourceFolders.some((f) => f.id === id))
  if (missing.length > 0) {
    throw new Error(
      'Some selected folders are no longer on the source branch. Refresh the list and try again.'
    )
  }

  const foldersToCopy = expandFolderTemplatesToCopy(
    sourceFolders,
    requestedUnique,
    includeSubfolders
  )
  if (foldersToCopy.length === 0) {
    throw new Error('Select at least one folder to copy.')
  }

  const existingNamesLower = new Set(
    target.folders.map((f) => f.name.trim().toLowerCase()).filter(Boolean)
  )

  const takeUniqueName = (baseRaw: string) => {
    const base = (baseRaw || '').trim() || 'Folder'
    let name = base
    let n = 0
    while (existingNamesLower.has(name.toLowerCase())) {
      n += 1
      name = n === 1 ? `${base} (copy)` : `${base} (copy ${n})`
    }
    existingNamesLower.add(name.toLowerCase())
    return name
  }

  let skippedCount = 0
  let createdCount = 0
  const sourceIdToTargetId = new Map<string, string>()
  const { roots, children } = partitionFoldersForCopy(foldersToCopy)

  const queueFolderCopy = (src: InventoryFolder, parentId: string | null) => {
    const candidate = (src.name || '').trim() || 'Folder'
    const candLower = candidate.toLowerCase()
    let finalName = candidate

    if (existingNamesLower.has(candLower)) {
      if (onExistingName === 'skip') {
        skippedCount += 1
        return
      }
      finalName = takeUniqueName(candidate)
    } else {
      existingNamesLower.add(candLower)
    }

    const newId = demoId('folder')
    sourceIdToTargetId.set(src.id, newId)
    target.folders.push({
      id: newId,
      name: finalName,
      storeId: targetStoreId,
      parentId: parentId ?? null,
      ...(src.usesSubcategories === true && !parentId ? { usesSubcategories: true } : {}),
    })
    createdCount += 1
  }

  for (const src of roots) {
    queueFolderCopy(src, null)
  }
  for (const src of children) {
    const parentSourceId = normalizeParentId(src.parentId)
    if (!parentSourceId) {
      queueFolderCopy(src, null)
      continue
    }
    const targetParentId = sourceIdToTargetId.get(parentSourceId)
    if (!targetParentId) {
      skippedCount += 1
      continue
    }
    queueFolderCopy(src, targetParentId)
  }

  demo.persist()
  await syncDemoToPinia()
  return { createdCount, skippedCount }
}

export async function applyDemoCreateStore(payload: {
  name: string
  address?: string
  phone?: string
  setAsCurrent?: boolean
}): Promise<string> {
  const demo = useDemoAppStore()
  demo.hydrate()
  const id = demo.addStore({
    name: payload.name,
    address: payload.address,
    phone: payload.phone,
  })
  if (payload.setAsCurrent) {
    demo.setCurrentStore(id)
  }
  await syncDemoToPinia()
  return id
}

export async function applyDemoUpdateStore(
  storeId: string,
  updates: { name?: string; address?: string; phone?: string }
) {
  const demo = useDemoAppStore()
  demo.hydrate()
  demo.updateStoreRecord(storeId, updates)
  await syncDemoToPinia()
}

export async function applyDemoDeleteStore(storeId: string) {
  const demo = useDemoAppStore()
  demo.hydrate()
  demo.removeStoreRecord(storeId)
  await syncDemoToPinia()
}
