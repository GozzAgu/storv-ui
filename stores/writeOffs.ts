import { defineStore } from 'pinia'
import { getDocs, limit, orderBy, query } from 'firebase/firestore'
import { useFirestore } from '~/composables/useFirestore'
import { useAuthStore } from '~/stores/auth'
import { useInventoryStore } from '~/stores/inventory'
import { useInspectionHoldsStore } from '~/stores/inspectionHolds'
import { useSupplierReturnsStore } from '~/stores/supplierReturns'
import { getQueryUserId, getStockWriteOffsCollection } from '~/composables/useFirestorePaths'
import { getCurrentStoreId } from '~/composables/useCurrentStore'
import { useSalesApi } from '~/composables/useSalesApi'
import { invalidateFolderItemCaches } from '~/utils/inventory-items-firestore'
import {
  WRITE_OFF_REASON_LABELS,
  type CreateWriteOffBody,
  type StockWriteOff,
  type WriteOffReason,
  type WriteOffSource,
} from '~/types/stock-write-offs'

/**
 * Stock write-offs for the current branch. Read from Firestore; created through the server, which
 * moves the stock in the same step. Demo mode keeps them in memory.
 */

const FETCH_LIMIT = 500

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

export function mapWriteOffDoc(id: string, data: Record<string, unknown>): StockWriteOff {
  const item = (data.item ?? {}) as Record<string, unknown>
  const cr = data.customerReturn as Record<string, unknown> | null | undefined
  const sr = data.supplierReturn as Record<string, unknown> | null | undefined
  const reason = str(data.reason) as WriteOffReason
  const source = str(data.source) as WriteOffSource
  return {
    id,
    storeId: str(data.storeId),
    source: ['inventory', 'inspection', 'supplier_return'].includes(source) ? source : 'inventory',
    reason: reason in WRITE_OFF_REASON_LABELS ? reason : 'other',
    note: str(data.note),
    quantity: num(data.quantity) ?? 1,
    costValue: num(data.costValue),
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
      unitCost: num(item.unitCost),
    },
    customerReturn: cr
      ? {
          receiptNumber: str(cr.receiptNumber),
          customerName: str(cr.customerName),
          complaint: str(cr.complaint),
        }
      : null,
    supplierReturn: sr
      ? { returnId: str(sr.returnId), supplierName: str(sr.supplierName), defect: str(sr.defect) }
      : null,
    createdAt: iso(data.createdAt),
    createdByName: str(data.createdByName),
  }
}

/** What the dialog knows about the stock being written off (for the demo row and refreshes). */
export interface WriteOffContext {
  item: StockWriteOff['item']
  quantity: number
  customerReturn?: StockWriteOff['customerReturn']
  supplierReturn?: StockWriteOff['supplierReturn']
}

export const useWriteOffsStore = defineStore('writeOffs', {
  state: () => ({
    writeOffs: [] as StockWriteOff[],
    loading: false,
    error: null as string | null,
    lastFetchedStoreId: null as string | null,
  }),

  actions: {
    async fetchWriteOffs(force = false) {
      const storeId = (await getCurrentStoreId()) || ''
      const { isDemoModeActive } = await import('~/utils/demo-mode')
      if (isDemoModeActive()) {
        if (this.lastFetchedStoreId !== storeId) {
          this.writeOffs = this.writeOffs.filter((w) => !w.storeId || w.storeId === storeId)
          this.lastFetchedStoreId = storeId
        }
        return
      }
      const db = useFirestore().getFirestoreInstance()
      const authStore = useAuthStore()
      const userId = await getQueryUserId()
      if (!db || !authStore.currentUser || !userId || !storeId) {
        this.writeOffs = []
        return
      }
      if (!force && this.lastFetchedStoreId === storeId) return
      this.loading = true
      this.error = null
      try {
        const snap = await getDocs(
          query(
            getStockWriteOffsCollection(db, userId, storeId),
            orderBy('createdAt', 'desc'),
            limit(FETCH_LIMIT)
          )
        )
        this.writeOffs = snap.docs.map((d) => mapWriteOffDoc(d.id, d.data()))
        this.lastFetchedStoreId = storeId
      } catch (err) {
        console.error('[writeOffs] fetch failed', err)
        this.error = 'We couldn’t load stock losses.'
      } finally {
        this.loading = false
      }
    },

    async create(body: CreateWriteOffBody, context: WriteOffContext) {
      const holdsStore = useInspectionHoldsStore()
      const returnsStore = useSupplierReturnsStore()
      const { isDemoModeActive } = await import('~/utils/demo-mode')

      if (isDemoModeActive()) {
        const bridge = await import('~/utils/demo-bridge')
        if (body.source === 'inventory') {
          await bridge.applyDemoStockRemoval(body.itemId, body.quantity)
        } else if (body.source === 'inspection') {
          // Held units are still counted as sold in the demo; this takes them out for good.
          await bridge.applyDemoInspectionDecision(
            context.item.inventoryItemId,
            context.quantity,
            'supplier'
          )
          const hold = holdsStore.holds.find((h) => h.id === body.holdId)
          if (hold) {
            hold.status = 'written_off'
            hold.closedAt = new Date().toISOString()
            hold.closedByName = 'You'
            await holdsStore.settleReceiptIfDone(hold.sale.receiptId)
          }
        }
        const id = `local-wo-${Date.now()}`
        if (body.source === 'supplier_return') {
          const ret = returnsStore.returns.find((r) => r.id === body.returnId)
          if (ret) ret.writeOffId = id
        }
        const unitCost = context.item.unitCost
        this.writeOffs.unshift({
          id,
          storeId: (await getCurrentStoreId()) || '',
          source: body.source,
          reason: body.reason,
          note: body.note ?? '',
          quantity: context.quantity,
          costValue: unitCost === null ? null : unitCost * context.quantity,
          item: context.item,
          customerReturn: context.customerReturn ?? null,
          supplierReturn: context.supplierReturn ?? null,
          createdAt: new Date().toISOString(),
          createdByName: 'You',
        })
        return
      }

      await useSalesApi().createWriteOff(body)
      if (context.item.folderId) {
        invalidateFolderItemCaches(context.item.folderId)
        delete useInventoryStore().items[context.item.folderId]
      }
      const heldReceiptId =
        body.source === 'inspection'
          ? holdsStore.holds.find((h) => h.id === body.holdId)?.sale.receiptId
          : undefined
      await Promise.all([
        this.fetchWriteOffs(true),
        body.source === 'inspection' ? holdsStore.fetchHolds(true) : Promise.resolve(),
        body.source === 'supplier_return' ? returnsStore.fetchReturns(true) : Promise.resolve(),
      ])
      if (heldReceiptId) await holdsStore.settleReceiptIfDone(heldReceiptId)
    },

    clearForStoreSwitch() {
      this.writeOffs = []
      this.lastFetchedStoreId = null
      this.error = null
    },
  },
})
