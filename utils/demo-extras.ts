/**
 * Durable demo-mode extras (notifications, activity, staff, buybacks, loans, profile).
 * Kept separate from core inventory/sales seed so mutations survive store switches + sync.
 */
import type { ActivityLog } from '~/composables/useActivityLog'
import type { Notification } from '~/stores/notifications'
import type { CustomerBuyback } from '~/stores/customerBuybacks'
import type { SellerLoanOut } from '~/stores/sellerLoanOuts'
import type { Staff } from '~/composables/useStaff'
import type { UserData } from '~/composables/useUser'
import {
  DEMO_STORE_ABUJA,
  DEMO_STORE_LAGOS,
  DEMO_STORE_PH,
  DEMO_USER_UID,
} from '~/utils/demo-mode'

export const DEMO_EXTRAS_KEY = 'storvv-demo-extras-v1'

type IsoStaff = Omit<Staff, 'createdAt' | 'updatedAt' | 'removedAt' | 'hireDate'> & {
  hireDate: string
  createdAt: string
  updatedAt: string
  removedAt?: string
}

type IsoNotification = Omit<Notification, 'createdAt'> & { createdAt: string }

type IsoActivityLog = Omit<ActivityLog, 'createdAt'> & { createdAt: string }

type IsoBuyback = Omit<CustomerBuyback, 'createdAt' | 'updatedAt'> & {
  createdAt: string
  updatedAt: string
}

type IsoLoan = Omit<SellerLoanOut, 'createdAt' | 'updatedAt' | 'returnedAt' | 'soldAt'> & {
  createdAt: string
  updatedAt: string
  returnedAt?: string
  soldAt?: string
}

export interface DemoExtrasState {
  version: 1
  notifications: IsoNotification[]
  activityLogs: IsoActivityLog[]
  staffByStore: Record<string, IsoStaff[]>
  buybacks: IsoBuyback[]
  loans: IsoLoan[]
  userOverrides: {
    name?: string
    storePhone?: string
    storeDetails?: UserData['storeDetails']
  }
}

function nowIso() {
  return new Date().toISOString()
}

function seedStaff(storeId: string): IsoStaff[] {
  const base = {
    storeId,
    hireDate: '2025-01-15',
    status: 'active' as const,
    createdAt: nowIso(),
    updatedAt: nowIso(),
    createdBy: DEMO_USER_UID,
  }
  return [
    {
      ...base,
      id: `${storeId}_staff_amaka`,
      firstName: 'Amaka',
      lastName: 'Nwosu',
      email: 'amaka@storvv.app',
      phone: '0803 111 0001',
      departmentId: 'demo_dept_sales',
      departmentName: 'Sales',
      position: 'Sales lead',
      role: 'manager',
      canManageInventory: true,
    },
    {
      ...base,
      id: `${storeId}_staff_chidi`,
      firstName: 'Chidi',
      lastName: 'Eze',
      email: 'chidi@storvv.app',
      departmentId: 'demo_dept_sales',
      departmentName: 'Sales',
      position: 'Sales associate',
      role: 'staff',
    },
    {
      ...base,
      id: `${storeId}_staff_bisi`,
      firstName: 'Bisi',
      lastName: 'Adeyemi',
      email: 'bisi@storvv.app',
      departmentId: 'demo_dept_sales',
      departmentName: 'Sales',
      position: 'Cashier',
      role: 'staff',
    },
    {
      ...base,
      id: `${storeId}_staff_ibrahim`,
      firstName: 'Ibrahim',
      lastName: 'Kabir',
      email: 'ibrahim@storvv.app',
      phone: '0805 222 0002',
      departmentId: 'demo_dept_ops',
      departmentName: 'Operations',
      position: 'Operations lead',
      role: 'manager',
      canManageInventory: true,
    },
    {
      ...base,
      id: `${storeId}_staff_femi`,
      firstName: 'Femi',
      lastName: 'Johnson',
      email: 'femi@storvv.app',
      departmentId: 'demo_dept_ops',
      departmentName: 'Operations',
      position: 'Stock associate',
      role: 'staff',
    },
    {
      ...base,
      id: `${storeId}_staff_tola`,
      firstName: 'Tola',
      lastName: 'Bakare',
      email: 'tola@storvv.app',
      departmentId: 'demo_dept_sales',
      departmentName: 'Sales',
      position: 'Former cashier',
      role: 'staff',
      status: 'inactive',
      removedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      removedBy: DEMO_USER_UID,
    },
  ]
}

function seedNotifications(): IsoNotification[] {
  return [
    {
      id: 'demo_notif_1',
      type: 'item_updated',
      title: 'Low stock alert',
      message: 'Silicone phone case is running low at Lagos, Lekki.',
      userId: DEMO_USER_UID,
      actorId: DEMO_USER_UID,
      read: false,
      metadata: { storeId: DEMO_STORE_LAGOS },
      createdAt: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: 'demo_notif_2',
      type: 'receipt_created',
      title: 'Sale completed',
      message: 'Receipt DEMO-1002 recorded ₦25,000 in cash.',
      userId: DEMO_USER_UID,
      actorId: DEMO_USER_UID,
      read: false,
      metadata: { storeId: DEMO_STORE_LAGOS },
      createdAt: new Date(Date.now() - 7200000).toISOString(),
    },
    {
      id: 'demo_notif_3',
      type: 'import_completed',
      title: 'Transfer pending',
      message: 'Port Harcourt → Lagos transfer awaits approval.',
      userId: DEMO_USER_UID,
      actorId: DEMO_USER_UID,
      read: true,
      metadata: { storeId: DEMO_STORE_PH },
      createdAt: new Date(Date.now() - 12 * 3600000).toISOString(),
    },
  ]
}

function seedActivityLogs(): IsoActivityLog[] {
  const stores = [
    { id: DEMO_STORE_LAGOS, name: 'Lagos, Lekki' },
    { id: DEMO_STORE_ABUJA, name: 'Abuja, Wuse' },
    { id: DEMO_STORE_PH, name: 'Port Harcourt, GRA' },
  ]
  const logs: IsoActivityLog[] = []
  for (const store of stores) {
    logs.push(
      {
        id: `demo_log_${store.id}_1`,
        userId: DEMO_USER_UID,
        userDisplayName: 'Demo User',
        action: 'created',
        entityType: 'item',
        entityId: `rcpt_${store.id}`,
        entityName: `Sale recorded at ${store.name}`,
        storeId: store.id,
        createdAt: new Date(Date.now() - 3600000).toISOString(),
      },
      {
        id: `demo_log_${store.id}_2`,
        userId: DEMO_USER_UID,
        userDisplayName: 'Demo User',
        action: 'updated',
        entityType: 'item',
        entityId: `stock_${store.id}`,
        entityName: `Stock updated at ${store.name}`,
        storeId: store.id,
        createdAt: new Date(Date.now() - 7200000).toISOString(),
      }
    )
  }
  return logs
}

function seedBuybacks(): IsoBuyback[] {
  const now = Date.now()
  const day = 24 * 60 * 60 * 1000
  return [
    {
      id: 'demo_buyback_lagos_1',
      storeId: DEMO_STORE_LAGOS,
      status: 'completed',
      customerName: 'Kemi Ade',
      customerPhone: '0809 333 4455',
      customerEmail: '',
      folderId: 'folder_lagos_smartphones',
      inventoryItemId: 'item_lagos_iphone',
      purchasePrice: 180000,
      paymentMethod: 'Transfer',
      itemSummary: 'iPhone 12 64GB trade-in',
      notes: 'Demo buyback',
      createdAt: new Date(now - day * 8).toISOString(),
      updatedAt: new Date(now - day * 8).toISOString(),
      createdBy: DEMO_USER_UID,
    },
    {
      id: 'demo_buyback_lagos_2',
      storeId: DEMO_STORE_LAGOS,
      status: 'completed',
      customerName: 'Tunde Bello',
      customerPhone: '0805 444 5566',
      customerEmail: '',
      folderId: 'folder_lagos_accessories',
      inventoryItemId: 'item_lagos_case',
      purchasePrice: 3500,
      paymentMethod: 'Cash',
      itemSummary: 'Used silicone case bundle',
      notes: 'Demo buyback',
      createdAt: new Date(now - day * 2).toISOString(),
      updatedAt: new Date(now - day * 2).toISOString(),
      createdBy: DEMO_USER_UID,
    },
    {
      id: 'demo_buyback_abuja_1',
      storeId: DEMO_STORE_ABUJA,
      status: 'completed',
      customerName: 'Fatima Yusuf',
      customerPhone: '0802 777 8899',
      customerEmail: '',
      folderId: 'folder_abuja_laptops',
      inventoryItemId: 'item_abuja_hp',
      purchasePrice: 210000,
      paymentMethod: 'Transfer',
      itemSummary: 'Used HP Pavilion trade-in',
      notes: 'Demo buyback',
      createdAt: new Date(now - day * 5).toISOString(),
      updatedAt: new Date(now - day * 5).toISOString(),
      createdBy: DEMO_USER_UID,
    },
    {
      id: 'demo_buyback_ph_1',
      storeId: DEMO_STORE_PH,
      status: 'completed',
      customerName: 'Grace Etim',
      customerPhone: '0807 222 3344',
      customerEmail: '',
      folderId: 'folder_ph_accessories',
      inventoryItemId: 'item_ph_powerbank',
      purchasePrice: 8000,
      paymentMethod: 'Cash',
      itemSummary: 'Used power bank trade-in',
      notes: 'Demo buyback',
      createdAt: new Date(now - day * 3).toISOString(),
      updatedAt: new Date(now - day * 3).toISOString(),
      createdBy: DEMO_USER_UID,
    },
  ]
}

function seedLoans(): IsoLoan[] {
  const now = Date.now()
  const day = 24 * 60 * 60 * 1000
  return [
    {
      id: 'demo_loan_lagos_active',
      storeId: DEMO_STORE_LAGOS,
      status: 'active',
      partyName: 'Emeka Traders',
      partyPhone: '0803 555 0101',
      partyNotes: 'Reseller - settles weekly',
      lines: [
        {
          inventoryItemId: 'item_lagos_case',
          folderId: 'folder_lagos_accessories',
          itemSummary: 'Silicone phone case',
        },
      ],
      createdAt: new Date(now - day * 3).toISOString(),
      updatedAt: new Date(now - day * 3).toISOString(),
      createdBy: DEMO_USER_UID,
    },
    {
      id: 'demo_loan_lagos_returned',
      storeId: DEMO_STORE_LAGOS,
      status: 'returned',
      partyName: 'Gadget Hub',
      partyPhone: '0805 555 0202',
      partyNotes: 'Returned unsold units',
      lines: [
        {
          inventoryItemId: 'item_lagos_charger',
          folderId: 'folder_lagos_accessories',
          itemSummary: '20W USB-C charger',
        },
      ],
      createdAt: new Date(now - day * 8).toISOString(),
      updatedAt: new Date(now - day * 5).toISOString(),
      returnedAt: new Date(now - day * 5).toISOString(),
      createdBy: DEMO_USER_UID,
    },
    {
      id: 'demo_loan_abuja_active',
      storeId: DEMO_STORE_ABUJA,
      status: 'active',
      partyName: 'Wuse Gadgets',
      partyPhone: '0809 111 2233',
      partyNotes: 'Demo loan',
      lines: [
        {
          inventoryItemId: 'item_abuja_hp',
          folderId: 'folder_abuja_laptops',
          itemSummary: 'HP Laptop 15',
        },
      ],
      createdAt: new Date(now - day * 2).toISOString(),
      updatedAt: new Date(now - day * 2).toISOString(),
      createdBy: DEMO_USER_UID,
    },
    {
      id: 'demo_loan_ph_active',
      storeId: DEMO_STORE_PH,
      status: 'active',
      partyName: 'GRA Mobile',
      partyPhone: '0806 444 5566',
      partyNotes: 'Demo loan',
      lines: [
        {
          inventoryItemId: 'item_ph_cable',
          folderId: 'folder_ph_accessories',
          itemSummary: 'USB-C cable 2m',
        },
      ],
      createdAt: new Date(now - day).toISOString(),
      updatedAt: new Date(now - day).toISOString(),
      createdBy: DEMO_USER_UID,
    },
  ]
}

function createSeedExtras(): DemoExtrasState {
  return {
    version: 1,
    notifications: seedNotifications(),
    activityLogs: seedActivityLogs(),
    staffByStore: {
      [DEMO_STORE_LAGOS]: seedStaff(DEMO_STORE_LAGOS),
      [DEMO_STORE_ABUJA]: seedStaff(DEMO_STORE_ABUJA),
      [DEMO_STORE_PH]: seedStaff(DEMO_STORE_PH),
    },
    buybacks: seedBuybacks(),
    loans: seedLoans(),
    userOverrides: {},
  }
}

function reviveStaff(row: IsoStaff): Staff {
  return {
    ...row,
    hireDate: row.hireDate,
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
    removedAt: row.removedAt ? new Date(row.removedAt) : undefined,
  } as Staff
}

function serializeStaff(row: Staff): IsoStaff {
  return {
    ...row,
    hireDate:
      typeof row.hireDate === 'string'
        ? row.hireDate
        : row.hireDate
          ? new Date(row.hireDate as Date).toISOString().slice(0, 10)
          : '2025-01-15',
    createdAt: new Date(row.createdAt as Date).toISOString(),
    updatedAt: new Date(row.updatedAt as Date).toISOString(),
    removedAt: row.removedAt ? new Date(row.removedAt as Date).toISOString() : undefined,
  } as IsoStaff
}

let cache: DemoExtrasState | null = null

export function loadDemoExtras(): DemoExtrasState {
  if (cache) return cache
  if (!import.meta.client) {
    cache = createSeedExtras()
    return cache
  }
  try {
    const raw = localStorage.getItem(DEMO_EXTRAS_KEY)
    if (!raw) {
      cache = createSeedExtras()
      saveDemoExtras(cache)
      return cache
    }
    const parsed = JSON.parse(raw) as DemoExtrasState
    if (!parsed || parsed.version !== 1 || !Array.isArray(parsed.notifications)) {
      cache = createSeedExtras()
      saveDemoExtras(cache)
      return cache
    }
    cache = parsed
    return cache
  } catch {
    cache = createSeedExtras()
    return cache
  }
}

export function saveDemoExtras(state: DemoExtrasState = loadDemoExtras()) {
  cache = state
  if (!import.meta.client) return
  localStorage.setItem(DEMO_EXTRAS_KEY, JSON.stringify(state))
}

export function resetDemoExtras() {
  cache = createSeedExtras()
  saveDemoExtras(cache)
  return cache
}

export function getDemoExtrasNotifications(): Notification[] {
  return loadDemoExtras().notifications.map((n) => ({
    ...n,
    createdAt: new Date(n.createdAt),
  }))
}

export function setDemoExtrasNotifications(list: Notification[]) {
  const extras = loadDemoExtras()
  extras.notifications = list.map((n) => ({
    ...n,
    createdAt: new Date(n.createdAt as Date).toISOString(),
  }))
  saveDemoExtras(extras)
}

export function getDemoExtrasActivityLogs(storeId?: string): ActivityLog[] {
  const logs = loadDemoExtras().activityLogs.map((l) => ({
    ...l,
    createdAt: new Date(l.createdAt),
  }))
  if (!storeId) return logs
  return logs.filter((l) => l.storeId === storeId)
}

export function appendDemoActivityLog(
  entry: Omit<ActivityLog, 'id' | 'createdAt'> & { id?: string }
) {
  const extras = loadDemoExtras()
  extras.activityLogs.unshift({
    id: entry.id || `demo_log_${Math.random().toString(36).slice(2, 9)}`,
    userId: entry.userId,
    userDisplayName: entry.userDisplayName,
    action: entry.action,
    entityType: entry.entityType,
    entityId: entry.entityId,
    entityName: entry.entityName,
    storeId: entry.storeId,
    createdAt: nowIso(),
  })
  extras.activityLogs = extras.activityLogs.slice(0, 200)
  saveDemoExtras(extras)
}

export function getDemoExtrasStaff(storeId: string, status: 'active' | 'inactive' | 'all' = 'active'): Staff[] {
  const extras = loadDemoExtras()
  if (!extras.staffByStore[storeId]) {
    extras.staffByStore[storeId] = seedStaff(storeId)
    saveDemoExtras(extras)
  }
  const list = (extras.staffByStore[storeId] || []).map(reviveStaff)
  if (status === 'all') return list
  return list.filter((s) => s.status === status)
}

export function setDemoExtrasStaff(storeId: string, staff: Staff[]) {
  const extras = loadDemoExtras()
  extras.staffByStore[storeId] = staff.map(serializeStaff)
  saveDemoExtras(extras)
}

export function getDemoExtrasBuybacks(storeId: string): CustomerBuyback[] {
  return loadDemoExtras()
    .buybacks.filter((b) => b.storeId === storeId)
    .map((b) => ({
      ...b,
      createdAt: new Date(b.createdAt),
      updatedAt: new Date(b.updatedAt),
    }))
}

export function setDemoExtrasBuybacksForStore(storeId: string, buybacks: CustomerBuyback[]) {
  const extras = loadDemoExtras()
  extras.buybacks = [
    ...extras.buybacks.filter((b) => b.storeId !== storeId),
    ...buybacks.map((b) => ({
      ...b,
      createdAt: new Date(b.createdAt as Date).toISOString(),
      updatedAt: new Date(b.updatedAt as Date).toISOString(),
    })),
  ]
  saveDemoExtras(extras)
}

export function getDemoExtrasLoans(storeId: string): SellerLoanOut[] {
  return loadDemoExtras()
    .loans.filter((l) => l.storeId === storeId)
    .map((l) => ({
      ...l,
      createdAt: new Date(l.createdAt),
      updatedAt: new Date(l.updatedAt),
      returnedAt: l.returnedAt ? new Date(l.returnedAt) : undefined,
      soldAt: l.soldAt ? new Date(l.soldAt) : undefined,
    }))
}

export function setDemoExtrasLoansForStore(storeId: string, loans: SellerLoanOut[]) {
  const extras = loadDemoExtras()
  extras.loans = [
    ...extras.loans.filter((l) => l.storeId !== storeId),
    ...loans.map((l) => ({
      ...l,
      createdAt: new Date(l.createdAt as Date).toISOString(),
      updatedAt: new Date(l.updatedAt as Date).toISOString(),
      returnedAt: l.returnedAt ? new Date(l.returnedAt as Date).toISOString() : undefined,
      soldAt: l.soldAt ? new Date(l.soldAt as Date).toISOString() : undefined,
    })),
  ]
  saveDemoExtras(extras)
}

export function getDemoUserOverrides() {
  return loadDemoExtras().userOverrides
}

export function patchDemoUserOverrides(patch: DemoExtrasState['userOverrides']) {
  const extras = loadDemoExtras()
  extras.userOverrides = {
    ...extras.userOverrides,
    ...patch,
    storeDetails: patch.storeDetails
      ? { ...extras.userOverrides.storeDetails, ...patch.storeDetails }
      : extras.userOverrides.storeDetails,
  }
  saveDemoExtras(extras)
}
