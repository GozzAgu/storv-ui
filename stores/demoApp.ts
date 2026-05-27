import { defineStore } from 'pinia'
import type { Receipt } from '~/stores/receipts'
import type {
  DemoCustomer,
  DemoItem,
  DemoReceipt,
  DemoReceiptLine,
  DemoState,
  DemoStoreRecord,
} from '~/types/demo'
import { DEMO_STORAGE_KEY } from '~/utils/demo-mode'
import { sanitizeDemoDisplayDashes } from '~/utils/demo-display-text'
import { createDemoSeedState, demoId, nextDemoReceiptNumber } from '~/utils/demo-seed'

function normalizeDemoState(state: DemoState): DemoState {
  for (const store of state.stores) {
    store.name = sanitizeDemoDisplayDashes(store.name)
    if (store.address) {
      store.address = sanitizeDemoDisplayDashes(store.address)
    }
  }
  state.version = 3
  return state
}

function isValidDemoState(value: unknown): value is DemoState {
  const state = value as DemoState
  return (
    (state?.version === 2 || state?.version === 3) &&
    Array.isArray(state.stores) &&
    state.stores.length > 0
  )
}

function loadState(): DemoState {
  if (!import.meta.client) return createDemoSeedState()
  try {
    const raw = localStorage.getItem(DEMO_STORAGE_KEY)
    if (!raw) return createDemoSeedState()
    const parsed = JSON.parse(raw) as DemoState
    if (!isValidDemoState(parsed)) {
      return createDemoSeedState()
    }
    const namesBefore = parsed.stores.map((s) => s.name).join('\0')
    const state = normalizeDemoState(parsed)
    const namesAfter = state.stores.map((s) => s.name).join('\0')
    if (parsed.version < 3 || namesBefore !== namesAfter) {
      saveState(state)
    }
    return state
  } catch {
    return createDemoSeedState()
  }
}

function saveState(state: DemoState) {
  if (!import.meta.client) return
  localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(state))
}

function resolveCurrentStore(state: DemoState): DemoStoreRecord {
  return state.stores.find((s) => s.id === state.currentStoreId) ?? state.stores[0]!
}

export const useDemoAppStore = defineStore('demoApp', {
  state: () => ({
    hydrated: false,
    state: createDemoSeedState() as DemoState,
  }),

  getters: {
    currentStore(): DemoStoreRecord {
      return resolveCurrentStore(this.state)
    },

    folders(): DemoStoreRecord['folders'] {
      return this.currentStore.folders
    },
    items(): DemoItem[] {
      return this.currentStore.items
    },
    customers(): DemoStoreRecord['customers'] {
      return this.currentStore.customers
    },
    receipts(): DemoReceipt[] {
      return this.currentStore.receipts
    },
    storeName(): string {
      return this.currentStore.name
    },
    currencySymbol(): string {
      return this.state.currencySymbol
    },
    allReceipts(): DemoReceipt[] {
      return this.state.stores.flatMap((store) => store.receipts)
    },

    availableItems(): DemoItem[] {
      return this.currentStore.items.filter((i) => i.quantity - i.sold > 0)
    },

    completedReceipts(): DemoReceipt[] {
      return this.currentStore.receipts.filter((r) => r.status === 'completed')
    },

    todaySales(): number {
      const today = new Date().toDateString()
      return this.completedReceipts
        .filter((r) => new Date(r.date).toDateString() === today)
        .reduce((sum, r) => sum + r.total, 0)
    },

    monthSales(): number {
      const now = new Date()
      return this.completedReceipts
        .filter((r) => {
          const d = new Date(r.date)
          return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
        })
        .reduce((sum, r) => sum + r.total, 0)
    },

    totalStockValue(): number {
      return this.currentStore.items.reduce(
        (sum, i) => sum + Math.max(0, i.quantity - i.sold) * i.price,
        0,
      )
    },

    lowStockItems(): DemoItem[] {
      return this.currentStore.items.filter((i) => {
        const left = i.quantity - i.sold
        return left > 0 && left <= 3
      })
    },
  },

  actions: {
    hydrate() {
      if (this.hydrated && import.meta.client) return
      this.state = loadState()
      this.hydrated = true
    },

    persist() {
      saveState(this.state)
    },

    reset() {
      this.state = createDemoSeedState()
      this.persist()
    },

    setCurrentStore(storeId: string) {
      if (!this.state.stores.some((s) => s.id === storeId)) {
        throw new Error('Store not found')
      }
      this.state.currentStoreId = storeId
      this.persist()
    },

    getStore(storeId: string) {
      return this.state.stores.find((s) => s.id === storeId)
    },

    itemsInFolder(folderId: string) {
      return this.currentStore.items.filter((i) => i.folderId === folderId)
    },

    stockLeft(item: DemoItem) {
      return Math.max(0, item.quantity - item.sold)
    },

    findOrCreateCustomer(name: string, phone?: string) {
      const trimmed = name.trim() || 'Walk-in customer'
      const existing = this.currentStore.customers.find(
        (c) => c.name.toLowerCase() === trimmed.toLowerCase() && (!phone || c.phone === phone),
      )
      if (existing) return existing
      const customer: DemoCustomer = {
        id: demoId('cust'),
        storeId: this.state.currentStoreId,
        name: trimmed,
        phone: phone?.trim() || undefined,
        totalOrders: 0,
        totalSpent: 0,
      }
      this.currentStore.customers.push(customer)
      return customer
    },

    addFolder(name: string) {
      const folder = {
        id: demoId('folder'),
        name: name.trim() || 'New folder',
        description: '',
      }
      this.currentStore.folders.push(folder)
      this.persist()
      return folder.id
    },

    deleteInventoryItem(itemId: string) {
      const idx = this.currentStore.items.findIndex((i) => i.id === itemId)
      if (idx >= 0) {
        this.currentStore.items.splice(idx, 1)
        this.persist()
      }
    },

    deleteFolder(folderId: string) {
      this.currentStore.folders = this.currentStore.folders.filter((f) => f.id !== folderId)
      this.currentStore.items = this.currentStore.items.filter((i) => i.folderId !== folderId)
      this.persist()
    },

    addInventoryItem(payload: {
      folderId: string
      name: string
      price: number
      quantity: number
      sku?: string
    }) {
      const item: DemoItem = {
        id: demoId('item'),
        folderId: payload.folderId,
        storeId: this.state.currentStoreId,
        name: payload.name.trim(),
        price: Math.max(0, payload.price),
        quantity: Math.max(0, Math.floor(payload.quantity)),
        sold: 0,
        sku: payload.sku?.trim() || undefined,
      }
      this.currentStore.items.push(item)
      this.persist()
      return item
    },

    completeSale(payload: {
      lines: DemoReceiptLine[]
      customerName: string
      customerPhone?: string
      paymentMethod: string
      folderId: string
    }) {
      if (!payload.lines.length) {
        throw new Error('Add at least one item to the sale.')
      }

      for (const line of payload.lines) {
        const item = this.currentStore.items.find((i) => i.id === line.itemId)
        if (!item) throw new Error('An item in the cart is no longer available.')
        const left = item.quantity - item.sold
        if (line.quantity > left) {
          throw new Error(`Not enough stock for ${item.name}. Only ${left} left.`)
        }
      }

      const total = payload.lines.reduce((sum, l) => sum + l.price * l.quantity, 0)
      const customer = this.findOrCreateCustomer(payload.customerName, payload.customerPhone)
      customer.totalOrders += 1
      customer.totalSpent += total

      for (const line of payload.lines) {
        const item = this.currentStore.items.find((i) => i.id === line.itemId)!
        item.sold += line.quantity
      }

      const receipt: DemoReceipt = {
        id: demoId('rcpt'),
        storeId: this.state.currentStoreId,
        receiptNumber: nextDemoReceiptNumber(this.allReceipts),
        customerName: customer.name,
        customerPhone: customer.phone,
        date: new Date().toISOString(),
        items: payload.lines.map((l) => ({ ...l })),
        total,
        paymentMethod: payload.paymentMethod,
        status: 'completed',
        folderId: payload.folderId,
      }
      this.currentStore.receipts.unshift(receipt)
      this.persist()
      return receipt
    },

    importDashboardReceipt(
      receiptData: Omit<Receipt, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>,
    ) {
      const receipt: DemoReceipt = {
        id: demoId('rcpt'),
        storeId: receiptData.storeId || this.state.currentStoreId,
        receiptNumber: receiptData.receiptNumber,
        customerName: receiptData.customerName,
        customerPhone: receiptData.customerPhone,
        date: new Date(receiptData.date || Date.now()).toISOString(),
        items: receiptData.items.map((line) => ({
          itemId: line.itemId,
          itemName: line.itemName,
          quantity: line.quantity,
          price: line.price,
        })),
        total: receiptData.total,
        paymentMethod: receiptData.paymentMethod,
        status: receiptData.status === 'refunded' ? 'refunded' : 'completed',
        folderId: receiptData.folderId,
      }
      const store = this.getStore(receipt.storeId) ?? this.currentStore
      store.receipts.unshift(receipt)
      this.persist()
      return receipt.id
    },

    applySaleLines(lines: { itemId: string; quantitySold: number }[]) {
      for (const line of lines) {
        const item = this.state.stores
          .flatMap((s) => s.items)
          .find((i) => i.id === line.itemId)
        if (!item) throw new Error(`Item not found: ${line.itemId}`)
        const left = item.quantity - item.sold
        if (line.quantitySold > left) {
          throw new Error(`Insufficient stock for ${item.name}`)
        }
        item.sold += line.quantitySold
      }
      this.persist()
    },

    syncCustomerFromReceipt(
      receiptId: string,
      receiptData: {
        customerName: string
        customerEmail?: string
        customerPhone?: string
        total: number
      },
    ) {
      const customer = this.findOrCreateCustomer(
        receiptData.customerName,
        receiptData.customerPhone,
      )
      customer.totalOrders += 1
      customer.totalSpent += receiptData.total
      if (receiptData.customerEmail) customer.email = receiptData.customerEmail
      this.persist()
      return customer.id
    },

    refundReceipt(receiptId: string) {
      const receipt = this.currentStore.receipts.find((r) => r.id === receiptId)
      if (!receipt || receipt.status === 'refunded') return

      for (const line of receipt.items) {
        const item = this.currentStore.items.find((i) => i.id === line.itemId)
        if (item) item.sold = Math.max(0, item.sold - line.quantity)
      }

      const customer = this.currentStore.customers.find((c) => c.name === receipt.customerName)
      if (customer) {
        customer.totalOrders = Math.max(0, customer.totalOrders - 1)
        customer.totalSpent = Math.max(0, customer.totalSpent - receipt.total)
      }

      receipt.status = 'refunded'
      this.persist()
    },
  },
})
