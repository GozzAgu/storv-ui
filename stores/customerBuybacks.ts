import { defineStore } from 'pinia'
import { doc, getDocs, query, orderBy, limit, serverTimestamp, writeBatch } from 'firebase/firestore'

import { useFirestore } from '~/composables/useFirestore'
import { useAuthStore } from '~/stores/auth'
import { useInventoryStore } from '~/stores/inventory'
import {
  getQueryUserId,
  getCustomerBuybacksCollection,
  getInventoryItemDocument,
} from '~/composables/useFirestorePaths'
import { getCurrentStoreId } from '~/composables/useCurrentStore'
import { logActivity, getCurrentUserDisplayName } from '~/composables/useActivityLog'
import { invalidateFolderItemCaches } from '~/utils/inventory-items-firestore'
import { getInventoryItemDisplayName } from '~/composables/useInventoryItemDisplay'
import { normalizeEntityName } from '~/utils/capitalize-text'

export interface CustomerBuyback {
  id: string
  storeId: string
  status: 'completed' | 'cancelled'
  customerName: string
  customerPhone: string
  customerEmail: string
  folderId: string
  inventoryItemId: string
  purchasePrice: number
  paymentMethod: string
  itemSummary: string
  notes: string
  createdAt?: Date
  updatedAt?: Date
  createdBy: string
}

function snapshotToDate(v: unknown): Date | undefined {
  if (
    v &&
    typeof v === 'object' &&
    'toDate' in v &&
    typeof (v as { toDate: () => Date }).toDate === 'function'
  ) {
    return (v as { toDate: () => Date }).toDate()
  }
  if (v instanceof Date) return v
  return undefined
}

function mapBuybackDoc(id: string, data: Record<string, unknown>): CustomerBuyback {
  const rawStatus = typeof data.status === 'string' ? data.status : 'completed'
  return {
    id,
    storeId: (data.storeId as string) || '',
    status: rawStatus === 'cancelled' ? 'cancelled' : 'completed',
    customerName: (data.customerName as string) || '',
    customerPhone: (data.customerPhone as string) ?? '',
    customerEmail: (data.customerEmail as string) ?? '',
    folderId: (data.folderId as string) || '',
    inventoryItemId: (data.inventoryItemId as string) || '',
    purchasePrice: Number(data.purchasePrice) || 0,
    paymentMethod: (data.paymentMethod as string) || '',
    itemSummary: (data.itemSummary as string) || '',
    notes: (data.notes as string) || '',
    createdAt: snapshotToDate(data.createdAt),
    updatedAt: snapshotToDate(data.updatedAt),
    createdBy: (data.createdBy as string) || '',
  }
}

export const useCustomerBuybacksStore = defineStore('customerBuybacks', {
  state: () => ({
    buybacks: [] as CustomerBuyback[],
    loading: false,
    error: null as string | null,
    lastFetchedStoreId: null as string | null,
  }),

  actions: {
    clearForUiStoreSwitch() {
      this.buybacks = []
      this.lastFetchedStoreId = null
    },

    async fetchCustomerBuybacks(force = false) {
      const { isDemoModeActive } = await import('~/utils/demo-mode')
      if (isDemoModeActive()) {
        const storeId = (await getCurrentStoreId()) || ''
        if (force || this.buybacks.length === 0 || this.lastFetchedStoreId !== storeId) {
          const { getDemoBuybacks } = await import('~/utils/demo-bridge')
          this.buybacks = getDemoBuybacks(storeId)
          this.lastFetchedStoreId = storeId
        }
        this.loading = false
        this.error = null
        return
      }

      const db = useFirestore().getFirestoreInstance()
      const authStore = useAuthStore()
      if (!db || !authStore.currentUser) {
        this.buybacks = []
        return
      }

      const userId = await getQueryUserId()
      const storeId = await getCurrentStoreId()
      if (!userId || !storeId) {
        this.buybacks = []
        return
      }

      if (!force && this.lastFetchedStoreId === storeId && this.buybacks.length > 0) {
        return
      }

      this.loading = true
      this.error = null
      try {
        const col = getCustomerBuybacksCollection(db, userId, storeId)
        const snap = await getDocs(query(col, orderBy('createdAt', 'desc'), limit(200)))
        this.buybacks = snap.docs.map((d) =>
          mapBuybackDoc(d.id, d.data() as Record<string, unknown>)
        )
        this.lastFetchedStoreId = storeId
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Failed to load buybacks'
        this.error = msg
        console.warn('[customerBuybacks] fetch failed:', e)
        this.buybacks = []
      } finally {
        this.loading = false
      }
    },

    async createCustomerBuyback(params: {
      customerName: string
      customerPhone?: string
      customerEmail?: string
      folderId: string
      itemData: Record<string, unknown>
      purchasePrice: number
      paymentMethod: string
      notes?: string
    }) {
      const name = normalizeEntityName(params.customerName) || params.customerName.trim()
      if (!name) throw new Error('Customer name is required')

      const purchasePrice = Number(params.purchasePrice)
      if (!Number.isFinite(purchasePrice) || purchasePrice <= 0) {
        throw new Error('Enter a valid purchase price')
      }

      const paymentMethod = params.paymentMethod.trim()
      if (!paymentMethod) throw new Error('Select how you paid the customer')

      const folderId = params.folderId.trim()
      if (!folderId) throw new Error('Select a category for the item')

      const inventoryStore = useInventoryStore()
      const folder = inventoryStore.getFolderById(folderId)
      if (!folder) throw new Error('Category not found')

      const itemPayload = {
        ...params.itemData,
        buyback: true,
        buybackPrice: purchasePrice,
        unitCost: purchasePrice,
      }

      const { isDemoModeActive, DEMO_USER_UID } = await import('~/utils/demo-mode')
      if (isDemoModeActive()) {
        const demoStoreId = (await getCurrentStoreId()) || ''
        const itemId = await inventoryStore.createItem(folderId, itemPayload as never)
        const summary =
          getInventoryItemDisplayName({ ...params.itemData, id: itemId, folderId } as never) ||
          folder.name
        const buybackId = `demo_buyback_${Math.random().toString(36).slice(2, 9)}`
        const row = {
          id: buybackId,
          storeId: demoStoreId,
          status: 'completed' as const,
          customerName: name,
          customerPhone: (params.customerPhone || '').trim(),
          customerEmail: (params.customerEmail || '').trim(),
          folderId,
          inventoryItemId: itemId,
          purchasePrice,
          paymentMethod,
          itemSummary: summary,
          notes: (params.notes || '').trim(),
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: DEMO_USER_UID,
        }
        this.buybacks.unshift(row)
        const { setDemoExtrasBuybacksForStore } = await import('~/utils/demo-extras')
        setDemoExtrasBuybacksForStore(demoStoreId, this.buybacks)
        return buybackId
      }

      const db = useFirestore().getFirestoreInstance()
      const authStore = useAuthStore()
      if (!db || !authStore.currentUser) {
        throw new Error('Not authenticated')
      }

      const userId = await getQueryUserId()
      const storeId = await getCurrentStoreId()
      if (!userId || !storeId) {
        throw new Error('No store selected')
      }

      const itemId = await inventoryStore.createItem(folderId, itemPayload as never)
      const summary =
        getInventoryItemDisplayName({ ...params.itemData, id: itemId, folderId } as never) ||
        folder.name

      const buybackRef = doc(getCustomerBuybacksCollection(db, userId, storeId))
      const buybackId = buybackRef.id
      const createdByUid = authStore.currentUser.uid

      const batch = writeBatch(db)
      batch.set(buybackRef, {
        storeId,
        status: 'completed',
        customerName: name,
        customerPhone: (params.customerPhone || '').trim(),
        customerEmail: (params.customerEmail || '').trim(),
        folderId,
        inventoryItemId: itemId,
        purchasePrice,
        paymentMethod,
        itemSummary: summary,
        notes: (params.notes || '').trim(),
        createdBy: createdByUid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })

      batch.update(getInventoryItemDocument(db, userId, storeId, itemId), {
        buybackId,
        updatedAt: serverTimestamp(),
      })

      await batch.commit()
      invalidateFolderItemCaches(folderId)

      const userDisplayName = await getCurrentUserDisplayName().catch(() => 'Unknown')
      await logActivity({
        action: 'created',
        entityType: 'item',
        entityId: itemId,
        entityName: summary,
        description: `Buyback from ${name} for ${purchasePrice}`,
        metadata: {
          customerName: name,
          purchasePrice,
          paymentMethod,
          inventoryItemId: itemId,
          folderId,
        },
        userDisplayName,
      }).catch(() => {})

      await this.fetchCustomerBuybacks(true)
      return buybackId
    },
  },
})
