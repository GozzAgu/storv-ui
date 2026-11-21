import { defineStore } from 'pinia'
import { getDocs, limit, orderBy, query } from 'firebase/firestore'
import { useFirestore } from '~/composables/useFirestore'
import { useAuthStore } from '~/stores/auth'
import { useInventoryStore } from '~/stores/inventory'
import { useSupplierReturnsStore } from '~/stores/supplierReturns'
import { useReceiptsStore } from '~/stores/receipts'
import { getInspectionHoldsCollection, getQueryUserId } from '~/composables/useFirestorePaths'
import { getCurrentStoreId } from '~/composables/useCurrentStore'
import { useSalesApi } from '~/composables/useSalesApi'
import { invalidateFolderItemCaches } from '~/utils/inventory-items-firestore'
import { demoSupplierReturnFromHold } from '~/utils/supplier-return-display'
import type {
  InspectionDecision,
  InspectionHold,
  InspectionHoldStatus,
} from '~/types/inspection-holds'

/**
 * Customer-returned items waiting for inspection, for the current branch. Read from Firestore;
 * decisions go through the server. Demo mode keeps held items in memory.
 */

const FETCH_LIMIT = 300
const STATUSES: InspectionHoldStatus[] = ['held', 'restocked', 'to_supplier', 'written_off']

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

const str = (v: unknown) => (typeof v === 'string' ? v : '')
const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : null)

export function mapInspectionHoldDoc(id: string, data: Record<string, unknown>): InspectionHold {
  const item = (data.item ?? {}) as Record<string, unknown>
  const sale = (data.sale ?? {}) as Record<string, unknown>
  return {
    id,
    storeId: str(data.storeId),
    status: STATUSES.includes(data.status as InspectionHoldStatus)
      ? (data.status as InspectionHoldStatus)
      : 'held',
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
    },
    sale: {
      receiptId: str(sale.receiptId),
      receiptNumber: str(sale.receiptNumber),
      customerName: str(sale.customerName) || 'Walk-in Customer',
      customerPhone: str(sale.customerPhone) || undefined,
      soldAt: iso(sale.soldAt),
      amount: num(sale.amount) ?? 0,
    },
    complaint: str(data.complaint),
    heldAt: iso(data.heldAt),
    heldByName: str(data.heldByName),
    closedAt: iso(data.closedAt),
    closedByName: str(data.closedByName),
    supplierReturnId: str(data.supplierReturnId) || null,
  }
}

export const useInspectionHoldsStore = defineStore('inspectionHolds', {
  state: () => ({
    holds: [] as InspectionHold[],
    loading: false,
    error: null as string | null,
    lastFetchedStoreId: null as string | null,
  }),

  getters: {
    /** Waiting for a decision, oldest first: the longest-waiting item is checked first. */
    open: (state) =>
      state.holds
        .filter((h) => h.status === 'held')
        .sort((a, b) => (a.heldAt ?? '').localeCompare(b.heldAt ?? '')),
  },

  actions: {
    async fetchHolds(force = false) {
      const storeId = (await getCurrentStoreId()) || ''
      const { isDemoModeActive } = await import('~/utils/demo-mode')
      if (isDemoModeActive()) {
        // Demo holds only exist for this session; keep the ones for this branch.
        if (this.lastFetchedStoreId !== storeId) {
          this.holds = this.holds.filter((h) => !h.storeId || h.storeId === storeId)
          this.lastFetchedStoreId = storeId
        }
        return
      }
      const db = useFirestore().getFirestoreInstance()
      const authStore = useAuthStore()
      const userId = await getQueryUserId()
      if (!db || !authStore.currentUser || !userId || !storeId) {
        this.holds = []
        return
      }
      if (!force && this.lastFetchedStoreId === storeId) return
      this.loading = true
      this.error = null
      try {
        const snap = await getDocs(
          query(
            getInspectionHoldsCollection(db, userId, storeId),
            orderBy('heldAt', 'desc'),
            limit(FETCH_LIMIT)
          )
        )
        this.holds = snap.docs.map((d) => mapInspectionHoldDoc(d.id, d.data()))
        this.lastFetchedStoreId = storeId
      } catch (err) {
        console.error('[inspectionHolds] fetch failed', err)
        this.error = 'We couldn’t load items waiting for inspection.'
      } finally {
        this.loading = false
      }
    },

    /** Back on sale, or return to the supplier. Refreshes returns and the item's category. */
    async decide(holdId: string, decision: InspectionDecision) {
      const hold = this.holds.find((h) => h.id === holdId)
      if (!hold) throw new Error('Held item not found')
      const returnsStore = useSupplierReturnsStore()
      const { isDemoModeActive } = await import('~/utils/demo-mode')
      if (isDemoModeActive()) {
        const { applyDemoInspectionDecision } = await import('~/utils/demo-bridge')
        await applyDemoInspectionDecision(
          hold.item.inventoryItemId,
          hold.item.quantity,
          decision.action
        )
        hold.status = decision.action === 'restock' ? 'restocked' : 'to_supplier'
        hold.closedAt = new Date().toISOString()
        hold.closedByName = 'You'
        if (decision.action === 'supplier') {
          const row = demoSupplierReturnFromHold(hold, decision)
          hold.supplierReturnId = row.id
          returnsStore.returns.unshift(row)
        }
        await this.settleReceiptIfDone(hold.sale.receiptId)
        return
      }
      await useSalesApi().resolveInspectionHold(holdId, decision)
      const inventoryStore = useInventoryStore()
      invalidateFolderItemCaches(hold.item.folderId)
      delete inventoryStore.items[hold.item.folderId]
      await Promise.all([
        this.fetchHolds(true),
        decision.action === 'supplier' ? returnsStore.fetchReturns(true) : Promise.resolve(),
      ])
      await this.settleReceiptIfDone(hold.sale.receiptId)
    },

    /**
     * Once no item from a sale is still held, it stops reading "Return pending" (the server
     * clears the flag; this mirrors it locally, and is the only update in the demo).
     */
    async settleReceiptIfDone(receiptId: string) {
      if (
        !receiptId ||
        this.holds.some((h) => h.status === 'held' && h.sale.receiptId === receiptId)
      ) {
        return
      }
      const receiptsStore = useReceiptsStore()
      const { isDemoModeActive } = await import('~/utils/demo-mode')
      if (isDemoModeActive()) {
        await receiptsStore.updateReceipt(receiptId, { inspectionPending: false })
        return
      }
      const i = receiptsStore.receipts.findIndex((r) => r.id === receiptId)
      if (i > -1)
        receiptsStore.receipts[i] = { ...receiptsStore.receipts[i]!, inspectionPending: false }
    },

    /** Demo refunds: held lines appear in the inspection list for the session. */
    addLocal(rows: InspectionHold[]) {
      this.holds.unshift(...rows)
    },

    /** After a real refund that held items. */
    markStale() {
      this.lastFetchedStoreId = null
    },

    clearForStoreSwitch() {
      this.holds = []
      this.lastFetchedStoreId = null
      this.error = null
    },
  },
})
