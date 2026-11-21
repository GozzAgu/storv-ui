import { defineStore } from 'pinia'
import { getDocs, limit, orderBy, query } from 'firebase/firestore'
import { useFirestore } from '~/composables/useFirestore'
import { useAuthStore } from '~/stores/auth'
import type { InventoryFolder, InventoryItem } from '~/stores/inventory'
import { getQueryUserId, getStockRemovalsCollection } from '~/composables/useFirestorePaths'
import { getCurrentStoreId } from '~/composables/useCurrentStore'
import { useSalesApi } from '~/composables/useSalesApi'
import { countReductionRecord, demoDeletionRecord } from '~/utils/stock-removal-records'
import {
  STOCK_REMOVAL_REASON_LABELS,
  type CountReductionWhy,
  type DeleteWhy,
  type StockRemoval,
  type StockRemovalKind,
  type StockRemovalReason,
} from '~/types/stock-removals'

/** Products deleted, removed with a category, or counted down, for the current branch. */

const FETCH_LIMIT = 500
const KINDS: StockRemovalKind[] = ['deleted', 'category_deleted', 'count_reduced']

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

export function mapStockRemovalDoc(id: string, data: Record<string, unknown>): StockRemoval {
  const item = (data.item ?? {}) as Record<string, unknown>
  const reason = str(data.reason) as StockRemovalReason
  return {
    id,
    storeId: str(data.storeId),
    kind: KINDS.includes(data.kind as StockRemovalKind)
      ? (data.kind as StockRemovalKind)
      : 'deleted',
    reason: reason in STOCK_REMOVAL_REASON_LABELS ? reason : 'other',
    note: str(data.note),
    quantity: num(data.quantity) ?? 1,
    before: num(data.before),
    after: num(data.after),
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
    restoredAt: iso(data.restoredAt),
    createdAt: iso(data.createdAt),
    createdByName: str(data.createdByName),
  }
}

export const useStockRemovalsStore = defineStore('stockRemovals', {
  state: () => ({
    removals: [] as StockRemoval[],
    loading: false,
    error: null as string | null,
    lastFetchedStoreId: null as string | null,
  }),

  actions: {
    async fetchRemovals(force = false) {
      const storeId = (await getCurrentStoreId()) || ''
      const { isDemoModeActive } = await import('~/utils/demo-mode')
      if (isDemoModeActive()) {
        if (this.lastFetchedStoreId !== storeId) {
          this.removals = this.removals.filter((r) => !r.storeId || r.storeId === storeId)
          this.lastFetchedStoreId = storeId
        }
        return
      }
      const db = useFirestore().getFirestoreInstance()
      const userId = await getQueryUserId()
      if (!db || !useAuthStore().currentUser || !userId || !storeId) {
        this.removals = []
        return
      }
      if (!force && this.lastFetchedStoreId === storeId) return
      this.loading = true
      this.error = null
      try {
        const snap = await getDocs(
          query(
            getStockRemovalsCollection(db, userId, storeId),
            orderBy('createdAt', 'desc'),
            limit(FETCH_LIMIT)
          )
        )
        this.removals = snap.docs.map((d) => mapStockRemovalDoc(d.id, d.data()))
        this.lastFetchedStoreId = storeId
      } catch (err) {
        console.error('[stockRemovals] fetch failed', err)
        this.error = 'We couldn’t load the stock out log.'
      } finally {
        this.loading = false
      }
    },

    /** Puts a deleted product back into inventory from its saved copy. */
    async restore(removalId: string) {
      const row = this.removals.find((r) => r.id === removalId)
      const { isDemoModeActive } = await import('~/utils/demo-mode')
      if (isDemoModeActive()) {
        throw new Error('Restoring deleted products isn’t available in the demo.')
      }
      await useSalesApi().restoreRemoval(removalId)
      if (row) {
        const { useInventoryStore } = await import('~/stores/inventory')
        const { invalidateFolderItemCaches } = await import('~/utils/inventory-items-firestore')
        invalidateFolderItemCaches(row.item.folderId)
        delete useInventoryStore().items[row.item.folderId]
      }
      await this.fetchRemovals(true)
    },

    markStale() {
      this.lastFetchedStoreId = null
    },

    /** Demo mode: what the server would record for a delete. */
    addLocalDeletion(
      item: InventoryItem,
      folder: InventoryFolder | null | undefined,
      why: DeleteWhy
    ) {
      this.removals.unshift(demoDeletionRecord(item, folder, why))
    },

    /** Demo mode: what the app records with an edit that lowers a count. */
    addLocalReduction(
      before: InventoryItem,
      after: InventoryItem,
      folder: InventoryFolder | null | undefined,
      why: CountReductionWhy
    ) {
      const record = countReductionRecord(before, after, folder, why, {
        storeId: String(before.storeId || ''),
        uid: 'demo',
        name: 'You',
      })
      if (!record) return
      this.removals.unshift(
        mapStockRemovalDoc(`local-cr-${Date.now()}`, {
          ...record,
          createdAt: new Date().toISOString(),
        })
      )
    },

    clearForStoreSwitch() {
      this.removals = []
      this.lastFetchedStoreId = null
      this.error = null
    },
  },
})
