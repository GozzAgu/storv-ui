import { defineStore } from 'pinia'
import { getDocs, limit, orderBy, query } from 'firebase/firestore'
import { useFirestore } from '~/composables/useFirestore'
import { useAuthStore } from '~/stores/auth'
import { getQueryUserId, getSupplierReturnsCollection } from '~/composables/useFirestorePaths'
import { getCurrentStoreId } from '~/composables/useCurrentStore'
import { useSalesApi } from '~/composables/useSalesApi'
import { useInventoryStore } from '~/stores/inventory'
import { invalidateFolderItemCaches } from '~/utils/inventory-items-firestore'
import { demoReturnFromItem, type LogReturnContext } from '~/utils/supplier-return-display'
import type {
  CreateSupplierReturnBody,
  SupplierReturn,
  SupplierReturnAction,
  SupplierReturnEvent,
  SupplierReturnOutcome,
  SupplierReturnStatus,
} from '~/types/supplier-returns'
import { RESTOCK_OUTCOMES, SUPPLIER_RETURN_OUTCOME_LABELS } from '~/types/supplier-returns'

/**
 * Supplier returns for the current branch. Read straight from Firestore; every change goes
 * through the server (`useSalesApi().updateSupplierReturn`), which owns the status rules.
 * Demo mode keeps sample rows in memory instead.
 */

const FETCH_LIMIT = 500
const STATUSES: SupplierReturnStatus[] = ['ready', 'with_supplier', 'resolved', 'rejected']

function iso(v: unknown): string | null {
  if (!v) return null
  if (typeof v === 'object' && v !== null && 'toDate' in v) {
    const fn = (v as { toDate: unknown }).toDate
    if (typeof fn === 'function') return (fn.call(v) as Date).toISOString()
  }
  if (v instanceof Date) return v.toISOString()
  if (typeof v === 'string') return v
  return null
}

function str(v: unknown): string {
  return typeof v === 'string' ? v : ''
}

function num(v: unknown): number | null {
  return typeof v === 'number' && Number.isFinite(v) ? v : null
}

export function mapSupplierReturnDoc(id: string, data: Record<string, unknown>): SupplierReturn {
  const item = (data.item ?? {}) as Record<string, unknown>
  const origin = (data.origin ?? {}) as Record<string, unknown>
  const status = STATUSES.includes(data.status as SupplierReturnStatus)
    ? (data.status as SupplierReturnStatus)
    : 'ready'
  const outcome = str(data.outcome) as SupplierReturnOutcome
  const history = Array.isArray(data.history) ? (data.history as Record<string, unknown>[]) : []
  return {
    id,
    storeId: str(data.storeId),
    status,
    item: {
      inventoryItemId: str(item.inventoryItemId),
      folderId: str(item.folderId),
      folderName: str(item.folderName) || 'Inventory',
      name: str(item.name) || 'Item',
      details:
        item.details && typeof item.details === 'object'
          ? (item.details as Record<string, string | number | boolean>)
          : {},
      serial: item.serial === true,
      quantity: num(item.quantity) ?? 1,
      unitCost: num(item.unitCost),
      inventoryAction: item.inventoryAction === 'reduced' ? 'reduced' : 'removed',
    },
    origin: {
      kind: (['stock', 'transfer', 'buyback', 'swap_in'] as const).includes(origin.kind as 'stock')
        ? (origin.kind as SupplierReturn['origin']['kind'])
        : 'stock',
      addedAt: iso(origin.addedAt),
      addedByName: str(origin.addedByName) || null,
      fromBranchName: str(origin.fromBranchName) || null,
      originalAddedAt: iso(origin.originalAddedAt),
      transferId: str(origin.transferId) || undefined,
      customerName: str(origin.customerName) || null,
      buybackId: str(origin.buybackId) || undefined,
      swapInReceiptId: str(origin.swapInReceiptId) || undefined,
    },
    customerReturn: (() => {
      const cr = data.customerReturn as Record<string, unknown> | null | undefined
      if (!cr || typeof cr !== 'object') return null
      return {
        receiptId: str(cr.receiptId),
        receiptNumber: str(cr.receiptNumber),
        customerName: str(cr.customerName),
        complaint: str(cr.complaint),
        returnedAt: iso(cr.returnedAt),
      }
    })(),
    defect: str(data.defect),
    supplierName: str(data.supplierName),
    supplierReference: str(data.supplierReference),
    outcome: outcome in SUPPLIER_RETURN_OUTCOME_LABELS ? outcome : null,
    notes: str(data.notes),
    costValue: num(data.costValue),
    writeOffId: str(data.writeOffId) || null,
    restockedAt: iso(data.restockedAt),
    restockedItemId: str(data.restockedItemId) || null,
    history: history
      .map(
        (h): SupplierReturnEvent => ({
          status: STATUSES.includes(h.status as SupplierReturnStatus)
            ? (h.status as SupplierReturnStatus)
            : 'ready',
          at: iso(h.at) ?? '',
          byName: str(h.byName) || 'Someone',
          note: str(h.note) || undefined,
        })
      )
      .sort((a, b) => a.at.localeCompare(b.at)),
    createdAt: iso(data.createdAt),
    createdByName: str(data.createdByName),
    sentAt: iso(data.sentAt),
    closedAt: iso(data.closedAt),
  }
}

/** Applies a change to a demo row the way the server would. */
function applyDemoAction(row: SupplierReturn, change: SupplierReturnAction): void {
  const now = new Date().toISOString()
  const push = (status: SupplierReturnStatus, note?: string) =>
    row.history.push({ status, at: now, byName: 'You', note })
  if (change.action === 'send') {
    row.status = 'with_supplier'
    row.supplierName = change.supplierName ?? row.supplierName
    row.supplierReference = change.supplierReference ?? row.supplierReference
    row.sentAt = now
    push('with_supplier', change.note)
  } else if (change.action === 'resolve') {
    row.status = 'resolved'
    row.outcome = change.outcome
    row.closedAt = now
    push('resolved', change.note)
    if (isRestockOutcome(change.outcome)) markRestocked(row, now)
  } else if (change.action === 'restock') {
    markRestocked(row, now)
  } else if (change.action === 'reject') {
    row.status = 'rejected'
    row.outcome = null
    row.closedAt = now
    push('rejected', change.note)
  } else {
    if (change.supplierName !== undefined) row.supplierName = change.supplierName
    if (change.supplierReference !== undefined) row.supplierReference = change.supplierReference
    if (change.notes !== undefined) row.notes = change.notes
  }
}

const isRestockOutcome = (o: SupplierReturnOutcome | null) =>
  !!o && (RESTOCK_OUTCOMES as readonly string[]).includes(o)

function markRestocked(row: SupplierReturn, now: string) {
  row.restockedAt = now
  row.restockedItemId = row.item.inventoryItemId
  row.history.push({ status: 'resolved', at: now, byName: 'You', note: 'Back in stock' })
}

/** Whether a change puts stock back into inventory (so the category needs refreshing). */
function restocks(change: SupplierReturnAction) {
  return (
    change.action === 'restock' || (change.action === 'resolve' && isRestockOutcome(change.outcome))
  )
}

export const useSupplierReturnsStore = defineStore('supplierReturns', {
  state: () => ({
    returns: [] as SupplierReturn[],
    loading: false,
    error: null as string | null,
    lastFetchedStoreId: null as string | null,
  }),

  getters: {
    byId: (state) => (id: string) => state.returns.find((r) => r.id === id) ?? null,
  },

  actions: {
    async fetchReturns(force = false) {
      const storeId = (await getCurrentStoreId()) || ''
      const { isDemoModeActive } = await import('~/utils/demo-mode')
      if (isDemoModeActive()) {
        if (this.lastFetchedStoreId !== storeId) {
          // Keep returns this session's demo refunds created for this branch; add the samples.
          const { demoSupplierReturns } = await import('~/utils/demo-supplier-returns')
          const local = this.returns.filter(
            (r) => !r.id.startsWith('demo-sr-') && (!r.storeId || r.storeId === storeId)
          )
          this.returns = [...local, ...demoSupplierReturns()]
          this.lastFetchedStoreId = storeId
        }
        this.loading = false
        this.error = null
        return
      }

      const db = useFirestore().getFirestoreInstance()
      const authStore = useAuthStore()
      const userId = await getQueryUserId()
      if (!db || !authStore.currentUser || !userId || !storeId) {
        this.returns = []
        return
      }
      if (!force && this.lastFetchedStoreId === storeId && this.returns.length > 0) return

      this.loading = true
      this.error = null
      try {
        const snap = await getDocs(
          query(
            getSupplierReturnsCollection(db, userId, storeId),
            orderBy('createdAt', 'desc'),
            limit(FETCH_LIMIT)
          )
        )
        this.returns = snap.docs.map((d) => mapSupplierReturnDoc(d.id, d.data()))
        this.lastFetchedStoreId = storeId
      } catch (err) {
        console.error('[supplierReturns] fetch failed', err)
        this.error = 'We couldn’t load returns. Check your connection and try again.'
      } finally {
        this.loading = false
      }
    },

    /** Sends the change to the server, then reloads the row's new state. */
    async applyAction(id: string, change: SupplierReturnAction) {
      const { isDemoModeActive } = await import('~/utils/demo-mode')
      const row = this.returns.find((r) => r.id === id)
      if (isDemoModeActive()) {
        if (row && restocks(change)) {
          // Demo stock is per product: add the units back if the product is still listed.
          const { applyDemoStockAddition } = await import('~/utils/demo-bridge')
          await applyDemoStockAddition(row.item.inventoryItemId, row.item.quantity)
        }
        if (row) applyDemoAction(row, change)
        return
      }
      await useSalesApi().updateSupplierReturn(id, change)
      if (row) applyDemoAction(row, change) // optimistic, then confirm from the server
      if (row && restocks(change)) {
        invalidateFolderItemCaches(row.item.folderId)
        delete useInventoryStore().items[row.item.folderId]
      }
      await this.fetchReturns(true)
    },

    /**
     * Logs a defective in-stock item for its supplier. The server takes it out of stock; the
     * category's cached items are dropped so inventory shows the change.
     */
    async logReturn(body: CreateSupplierReturnBody, context: LogReturnContext) {
      const { isDemoModeActive } = await import('~/utils/demo-mode')
      if (isDemoModeActive()) {
        const { applyDemoStockRemoval } = await import('~/utils/demo-bridge')
        await applyDemoStockRemoval(body.itemId, body.quantity)
        this.returns.unshift(demoReturnFromItem(body, context))
        return
      }
      await useSalesApi().createSupplierReturn(body)
      const inventoryStore = useInventoryStore()
      invalidateFolderItemCaches(context.folderId)
      delete inventoryStore.items[context.folderId]
      this.lastFetchedStoreId = null
      await this.fetchReturns(true)
    },

    clearForStoreSwitch() {
      this.returns = []
      this.lastFetchedStoreId = null
      this.error = null
    },
  },
})
