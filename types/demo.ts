export interface DemoFolder {
  id: string
  name: string
  storeId: string
  parentId?: string | null
  usesSubcategories?: boolean
}

export interface DemoItem {
  id: string
  folderId: string
  storeId: string
  name: string
  price: number
  quantity: number
  sold: number
  sku?: string
  /** Unit cost for profit analytics in demo. */
  unitCost?: number
}

export interface DemoCustomer {
  id: string
  storeId: string
  name: string
  phone?: string
  email?: string
  totalOrders: number
  totalSpent: number
}

export interface DemoReceiptLine {
  itemId: string
  itemName: string
  quantity: number
  price: number
}

export interface DemoReceipt {
  id: string
  storeId: string
  receiptNumber: string
  customerName: string
  customerPhone?: string
  date: string
  items: DemoReceiptLine[]
  total: number
  paymentMethod: string
  status: 'completed' | 'refunded' | 'balance_due' | 'pending'
  folderId: string
  amountPaid?: number
  balanceDue?: number
  refundReason?: string
}

export interface DemoStoreRecord {
  id: string
  name: string
  address: string
  folders: DemoFolder[]
  items: DemoItem[]
  customers: DemoCustomer[]
  receipts: DemoReceipt[]
}

export interface DemoTransferItem {
  itemId: string
  quantity: number
  itemName: string
  serialNumber?: string | null
}

export interface DemoTransfer {
  id: string
  sourceStoreId: string
  destinationStoreId: string
  folderId: string
  destinationFolderId: string
  items: DemoTransferItem[]
  itemsCount: number
  hasSerialNumbers: boolean
  notes: string
  status: 'pending_approval' | 'approved' | 'in_transit' | 'completed' | 'rejected' | 'cancelled'
  createdBy: string
  createdAt: string
  carrier?: string
  trackingNumber?: string
}

export interface DemoState {
  version: 2 | 3 | 4 | 5
  currentStoreId: string
  currencyCode: string
  currencySymbol: string
  stores: DemoStoreRecord[]
  transfers: DemoTransfer[]
}

export type DemoView = 'overview' | 'inventory' | 'sell' | 'receipts' | 'customers'
