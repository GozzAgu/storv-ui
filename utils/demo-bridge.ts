import type { User } from 'firebase/auth'
import type { Customer } from '~/stores/customers'
import type { InventoryFolder, InventoryItem, Template } from '~/stores/inventory'
import type { Receipt, ReceiptItem } from '~/stores/receipts'
import type { DemoItem, DemoReceipt, DemoState, DemoStoreRecord } from '~/types/demo'
import type { UserData } from '~/composables/useUser'
import type { Store } from '~/composables/useStores'
import type { Department } from '~/composables/useDepartments'
import type { ActivityLog } from '~/composables/useActivityLog'
import type { Notification } from '~/stores/notifications'
import type { SavedSearch } from '~/stores/search'
import { DEMO_SAVED_SEARCHES_KEY } from '~/utils/demo-mode'
import { sanitizeDemoDisplayDashes } from '~/utils/demo-display-text'
import { demoId } from '~/utils/demo-seed'
import {
  DEMO_USER_UID,
  isDemoModeActive,
  markDemoSessionActive,
} from '~/utils/demo-mode'
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
    { id: 'quantity', name: 'quantity', label: 'Quantity in stock', type: 'number', required: true },
    { id: 'sku', name: 'sku', label: 'SKU', type: 'text', required: false },
  ],
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
  return {
    uid: DEMO_USER_UID,
    email: 'demo@storvv.app',
    name: 'Demo User',
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
      storeName: current?.name ?? 'Demo store',
      storePhone: '0800 000 0000',
      settings: {
        receipt: { prefix: 'DEMO', nextNumber: 1004 },
        payment: { paymentMethods: ['Cash', 'Transfer', 'Card'] },
      },
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
  return {
    id: item.id,
    folderId: item.folderId,
    storeId: item.storeId,
    name: item.name,
    price: item.price,
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
    status: r.status === 'refunded' ? 'refunded' : 'completed',
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
  const now = new Date()
  return [
    {
      id: 'demo_notif_1',
      type: 'receipt_created',
      title: 'New receipt',
      message: 'Receipt DEMO-1001 recorded for Ada Okonkwo',
      userId: DEMO_USER_UID,
      read: false,
      createdAt: now,
    },
    {
      id: 'demo_notif_2',
      type: 'item_updated',
      title: 'Low stock',
      message: 'Silicone phone case is running low at Lagos',
      userId: DEMO_USER_UID,
      read: true,
      createdAt: new Date(now.getTime() - 3600000),
    },
  ]
}

export function getDemoActivityLogs(storeId: string): ActivityLog[] {
  const store = useDemoAppStore().getStore(storeId)
  const name = store?.name ?? 'store'
  return [
    {
      id: 'demo_log_1',
      userId: DEMO_USER_UID,
      userDisplayName: 'Demo User',
      action: 'created',
      entityType: 'receipt',
      entityId: 'rcpt_lagos_1',
      entityName: 'Receipt DEMO-1001',
      storeId,
      createdAt: new Date(),
    },
    {
      id: 'demo_log_2',
      userId: DEMO_USER_UID,
      userDisplayName: 'Demo User',
      action: 'updated',
      entityType: 'item',
      entityId: 'item_lagos_case',
      entityName: `Stock updated at ${name}`,
      storeId,
      createdAt: new Date(Date.now() - 7200000),
    },
  ]
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
  staffStore.$patch({
    staff: [],
    loading: false,
    error: null,
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
  itemData: Partial<InventoryItem>,
): Promise<string> {
  const demo = useDemoAppStore()
  const item = demo.addInventoryItem({
    folderId,
    name: String(itemData.name ?? 'New item'),
    price: Number(itemData.price ?? 0),
    quantity: Number(itemData.quantity ?? 0),
    sku: itemData.sku ? String(itemData.sku) : undefined,
  })
  await syncDemoToPinia()
  return item.id
}

export async function applyDemoInventoryItemUpdate(itemId: string, updates: Partial<InventoryItem>) {
  const demo = useDemoAppStore()
  const item = demo.state.stores.flatMap((s) => s.items).find((i) => i.id === itemId)
  if (!item) return
  if (updates.name !== undefined) item.name = String(updates.name)
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
  receiptData: Omit<Receipt, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>,
) {
  const id = useDemoAppStore().importDashboardReceipt(receiptData)
  await syncDemoToPinia()
  return id
}

export async function applyDemoReceiptSale(
  lines: { itemId: string; quantitySold: number }[],
) {
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
  },
) {
  const id = useDemoAppStore().syncCustomerFromReceipt(receiptId, receiptData)
  await syncDemoToPinia()
  return id
}

export async function applyDemoReceiptRefund(receiptId: string) {
  useDemoAppStore().refundReceipt(receiptId)
  await syncDemoToPinia()
}

export async function applyDemoReceiptUpdate(
  receiptId: string,
  updates: Partial<Receipt>,
) {
  const demo = useDemoAppStore()
  const receipt = demo.currentStore.receipts.find((r) => r.id === receiptId)
  if (!receipt) throw new Error('Receipt not found')
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
  folderData: Pick<InventoryFolder, 'name' | 'description' | 'type' | 'color' | 'hasSerialNumbers' | 'template'>,
): Promise<string> {
  const id = useDemoAppStore().addFolder(folderData.name)
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

export function saveDemoSearch(name: string, query: string, filters: SavedSearch['filters']): string {
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
