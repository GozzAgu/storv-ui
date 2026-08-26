import { defineStore } from 'pinia'
import {
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore'

import { useFirestore } from '~/composables/useFirestore'
import { useAuthStore } from '~/stores/auth'
import {
  getQueryUserId,
  getSalesLeadsCollection,
  getSalesLeadDocument,
  getLeadEventsCollection,
} from '~/composables/useFirestorePaths'
import { getCurrentStoreId } from '~/composables/useCurrentStore'
import type {
  SalesLead,
  SalesLeadEvent,
  SalesLeadEventType,
  SalesLeadSource,
  SalesLeadStatus,
} from '~/types/leads'
import {
  SALES_LEAD_SOURCE_LABELS,
  SALES_LEAD_STATUS_LABELS,
} from '~/types/leads'
import { findDuplicateOpenLead } from '~/composables/leads/findDuplicateOpenLead'
import { logActivity } from '~/composables/useActivityLog'

export type CreateSalesLeadParams = {
  customerName: string
  customerPhone?: string
  customerEmail?: string
  productName: string
  inventoryItemId?: string
  estimatedValue?: number
  source: SalesLeadSource
  notes?: string
}

export type UpdateSalesLeadParams = {
  customerPhone?: string
  productName?: string
  estimatedValue?: number
  inventoryItemId?: string | null
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

function mapLeadDoc(id: string, data: Record<string, unknown>): SalesLead {
  const rawStatus = typeof data.status === 'string' ? data.status : 'new'
  const status = (['new', 'contacted', 'negotiating', 'won', 'lost'] as const).includes(
    rawStatus as SalesLeadStatus
  )
    ? (rawStatus as SalesLeadStatus)
    : 'new'

  const rawSource = typeof data.source === 'string' ? data.source : 'other'
  const source = (
    ['walk_in', 'phone', 'whatsapp', 'referral', 'other'] as const
  ).includes(rawSource as SalesLeadSource)
    ? (rawSource as SalesLeadSource)
    : 'other'

  return {
    id,
    storeId: (data.storeId as string) || '',
    customerName: (data.customerName as string) || '',
    customerPhone: (data.customerPhone as string) || undefined,
    customerEmail: (data.customerEmail as string) || undefined,
    productName: (data.productName as string) || '',
    inventoryItemId: (data.inventoryItemId as string) || undefined,
    estimatedValue:
      typeof data.estimatedValue === 'number' ? data.estimatedValue : undefined,
    status,
    source,
    notes: (data.notes as string) || undefined,
    assignedTo: (data.assignedTo as string) || undefined,
    receiptId: (data.receiptId as string) || undefined,
    wonRevenue: typeof data.wonRevenue === 'number' ? data.wonRevenue : undefined,
    lostReason: (data.lostReason as string) || undefined,
    createdBy: (data.createdBy as string) || '',
    createdAt: snapshotToDate(data.createdAt),
    updatedAt: snapshotToDate(data.updatedAt),
  }
}

function mapEventDoc(id: string, data: Record<string, unknown>): SalesLeadEvent {
  const rawType = typeof data.type === 'string' ? data.type : 'note'
  const type = (['status_change', 'note', 'converted', 'lost'] as const).includes(
    rawType as SalesLeadEventType
  )
    ? (rawType as SalesLeadEventType)
    : 'note'

  return {
    id,
    storeId: (data.storeId as string) || '',
    leadId: (data.leadId as string) || '',
    type,
    description: (data.description as string) || '',
    createdBy: (data.createdBy as string) || '',
    createdAt: snapshotToDate(data.createdAt),
  }
}

export const useSalesLeadsStore = defineStore('salesLeads', {
  state: () => ({
    leads: [] as SalesLead[],
    currentLead: null as SalesLead | null,
    events: [] as SalesLeadEvent[],
    loading: false,
    detailLoading: false,
    error: null as string | null,
    lastFetchedStoreId: null as string | null,
  }),

  getters: {
    openLeads: (state) => state.leads.filter((l) => l.status !== 'won' && l.status !== 'lost'),
    openLeadsCount: (state) =>
      state.leads.filter((l) => l.status !== 'won' && l.status !== 'lost').length,
    openPipelineValue: (state) =>
      state.leads
        .filter((l) => l.status !== 'won' && l.status !== 'lost')
        .reduce((sum, lead) => sum + (lead.estimatedValue ?? 0), 0),
  },

  actions: {
    async notifyLeadEvent(
      type: 'lead_created' | 'lead_converted',
      title: string,
      message: string,
      metadata: { leadId: string; receiptId?: string },
      actorId?: string
    ) {
      try {
        const { useNotificationsStore } = await import('~/stores/notifications')
        const notificationsStore = useNotificationsStore()
        await notificationsStore.createNotification(type, title, message, metadata, actorId)
      } catch {
        // Non-blocking
      }
    },

    async writeLeadActivityLog(
      action: 'created' | 'updated' | 'deleted',
      lead: Pick<SalesLead, 'id' | 'customerName' | 'storeId'>,
      detail?: string
    ) {
      const authStore = useAuthStore()
      const { useUserStore } = await import('~/stores/user')
      const userStore = useUserStore()
      const displayName =
        userStore.userData?.name?.trim() ||
        authStore.currentUser?.displayName?.trim() ||
        authStore.currentUser?.email?.split('@')[0] ||
        'User'
      const entityName = detail
        ? `${lead.customerName} — ${detail}`
        : `Lead: ${lead.customerName}`

      await logActivity({
        action,
        entityType: 'lead',
        entityId: lead.id,
        entityName,
        storeId: lead.storeId,
        userId: authStore.currentUser?.uid || '',
        userDisplayName: displayName,
      })
    },
    clearForUiStoreSwitch() {
      this.leads = []
      this.currentLead = null
      this.events = []
      this.lastFetchedStoreId = null
    },

    async fetchSalesLeads(force = false) {
      const { isDemoModeActive } = await import('~/utils/demo-mode')
      if (isDemoModeActive()) {
        const { getDemoExtrasSalesLeads } = await import('~/utils/demo-extras')
        const { getCurrentStoreId } = await import('~/composables/useCurrentStore')
        const storeId = (await getCurrentStoreId()) ?? ''
        this.leads = getDemoExtrasSalesLeads(storeId)
        this.loading = false
        this.error = null
        this.lastFetchedStoreId = storeId || null
        return
      }

      const db = useFirestore().getFirestoreInstance()
      const authStore = useAuthStore()
      if (!db || !authStore.currentUser) {
        this.leads = []
        return
      }

      const userId = await getQueryUserId()
      const storeId = await getCurrentStoreId()
      if (!userId || !storeId) {
        this.leads = []
        return
      }

      if (!force && this.lastFetchedStoreId === storeId && this.leads.length > 0) {
        return
      }

      this.loading = true
      this.error = null
      try {
        const col = getSalesLeadsCollection(db, userId, storeId)
        const snap = await getDocs(query(col, orderBy('createdAt', 'desc'), limit(200)))
        this.leads = snap.docs.map((d) => mapLeadDoc(d.id, d.data() as Record<string, unknown>))
        this.lastFetchedStoreId = storeId
      } catch (e: unknown) {
        this.error = e instanceof Error ? e.message : 'Failed to load sales leads'
        this.leads = []
      } finally {
        this.loading = false
      }
    },

    async fetchLeadById(leadId: string) {
      const { isDemoModeActive } = await import('~/utils/demo-mode')
      if (isDemoModeActive()) {
        const { getDemoExtrasSalesLeads } = await import('~/utils/demo-extras')
        const { getCurrentStoreId } = await import('~/composables/useCurrentStore')
        const storeId = (await getCurrentStoreId()) ?? ''
        const lead = getDemoExtrasSalesLeads(storeId).find((row) => row.id === leadId) ?? null
        this.currentLead = lead
        this.events = lead
          ? [
              {
                id: `${leadId}_created`,
                storeId,
                leadId,
                type: 'note',
                description: 'Lead created',
                createdBy: lead.createdBy,
                createdAt: lead.createdAt,
              },
            ]
          : []
        if (!lead) this.error = 'Lead not found for this store.'
        return lead
      }

      const db = useFirestore().getFirestoreInstance()
      const authStore = useAuthStore()
      if (!db || !authStore.currentUser) return null

      const userId = await getQueryUserId()
      const storeId = await getCurrentStoreId()
      if (!userId || !storeId) return null

      this.detailLoading = true
      this.error = null
      try {
        const leadRef = getSalesLeadDocument(db, userId, storeId, leadId)
        const leadSnap = await getDoc(leadRef)
        if (!leadSnap.exists()) {
          const cached = this.leads.find((l) => l.id === leadId) ?? null
          this.currentLead = cached
          this.events = []
          if (!cached) {
            this.error = 'Lead not found for this store.'
          }
          return cached
        }

        const lead = mapLeadDoc(leadSnap.id, leadSnap.data() as Record<string, unknown>)
        this.currentLead = lead

        const idx = this.leads.findIndex((l) => l.id === leadId)
        if (idx >= 0) this.leads[idx] = lead
        else this.leads.unshift(lead)

        await this.fetchLeadEvents(leadId, userId, storeId)

        return lead
      } catch (e: unknown) {
        this.error = e instanceof Error ? e.message : 'Failed to load lead'
        const cached = this.leads.find((l) => l.id === leadId) ?? null
        this.currentLead = cached
        this.events = []
        return cached
      } finally {
        this.detailLoading = false
      }
    },

    async fetchLeadEvents(leadId: string, userId?: string, storeId?: string) {
      const db = useFirestore().getFirestoreInstance()
      if (!db) {
        this.events = []
        return
      }

      const ownerId = userId ?? (await getQueryUserId())
      const branchId = storeId ?? (await getCurrentStoreId())
      if (!ownerId || !branchId) {
        this.events = []
        return
      }

      const eventsCol = getLeadEventsCollection(db, ownerId, branchId)
      try {
        const eventsSnap = await getDocs(
          query(
            eventsCol,
            where('leadId', '==', leadId),
            orderBy('createdAt', 'desc'),
            limit(100)
          )
        )
        this.events = eventsSnap.docs.map((d) =>
          mapEventDoc(d.id, d.data() as Record<string, unknown>)
        )
      } catch (indexError: unknown) {
        const err = indexError as { code?: string; message?: string }
        if (err.code !== 'failed-precondition' && !err.message?.includes('index')) {
          throw indexError
        }

        const fallbackSnap = await getDocs(
          query(eventsCol, where('leadId', '==', leadId), limit(100))
        )
        this.events = fallbackSnap.docs
          .map((d) => mapEventDoc(d.id, d.data() as Record<string, unknown>))
          .sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0))
      }
    },

    async createSalesLead(params: CreateSalesLeadParams) {
      const { isDemoModeActive } = await import('~/utils/demo-mode')
      const authStore = useAuthStore()
      if (!authStore.currentUser) {
        throw new Error('Sign in to add a sales lead.')
      }

      const customerName = params.customerName.trim()
      const productName = params.productName.trim()
      if (!customerName || !productName) {
        throw new Error('Customer name and product interest are required.')
      }

      if (!isDemoModeActive()) {
        if (this.leads.length === 0) {
          await this.fetchSalesLeads(true)
        }
        const duplicate = findDuplicateOpenLead(this.leads, {
          phone: params.customerPhone,
          email: params.customerEmail,
        })
        if (duplicate) {
          throw new Error(
            `An open lead already exists for this contact (${duplicate.customerName}). Open it from the leads list instead.`
          )
        }
      }

      const userId = await getQueryUserId()
      const storeId = await getCurrentStoreId()
      if (!userId || !storeId) {
        throw new Error('Select a store before adding a lead.')
      }

      if (isDemoModeActive()) {
        const { appendDemoSalesLead } = await import('~/utils/demo-extras')
        const leadId = appendDemoSalesLead({
          storeId,
          customerName,
          customerPhone: params.customerPhone?.trim() || '',
          customerEmail: params.customerEmail?.trim() || '',
          productName,
          inventoryItemId: params.inventoryItemId?.trim() || '',
          estimatedValue:
            typeof params.estimatedValue === 'number' && params.estimatedValue >= 0
              ? params.estimatedValue
              : 0,
          status: 'new',
          source: params.source,
          notes: params.notes?.trim() || '',
          createdBy: authStore.currentUser.uid,
        })
        await this.fetchSalesLeads(true)
        const lead = this.leads.find((l) => l.id === leadId)
        if (lead) {
          await this.writeLeadActivityLog('created', lead)
          await this.notifyLeadEvent(
            'lead_created',
            'New sales lead',
            `${customerName} enquired about ${productName}`,
            { leadId },
            authStore.currentUser.uid
          )
        }
        return leadId
      }

      const db = useFirestore().getFirestoreInstance()
      if (!db) {
        throw new Error('Cloud storage is unavailable.')
      }

      const ref = doc(getSalesLeadsCollection(db, userId, storeId))
      const payload: Record<string, unknown> = {
        storeId,
        customerName,
        customerPhone: params.customerPhone?.trim() || '',
        customerEmail: params.customerEmail?.trim() || '',
        productName,
        estimatedValue:
          typeof params.estimatedValue === 'number' && params.estimatedValue >= 0
            ? params.estimatedValue
            : 0,
        status: 'new' as SalesLeadStatus,
        source: params.source,
        notes: params.notes?.trim() || '',
        createdBy: authStore.currentUser.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }
      if (params.inventoryItemId?.trim()) {
        payload.inventoryItemId = params.inventoryItemId.trim()
      }

      await setDoc(ref, payload)
      await this.appendLeadEvent(ref.id, 'note', 'Lead created', userId, storeId)

      const leadSnapshot = mapLeadDoc(ref.id, {
        ...payload,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      await this.writeLeadActivityLog('created', leadSnapshot)
      await this.notifyLeadEvent(
        'lead_created',
        'New sales lead',
        `${customerName} enquired about ${productName}`,
        { leadId: ref.id },
        authStore.currentUser.uid
      )

      await this.fetchSalesLeads(true)
      this.currentLead =
        this.leads.find((l) => l.id === ref.id) ?? leadSnapshot
      return ref.id
    },

    async updateSalesLead(leadId: string, params: UpdateSalesLeadParams) {
      const authStore = useAuthStore()
      if (!authStore.currentUser) {
        throw new Error('Sign in to update this lead.')
      }

      const userId = await getQueryUserId()
      const storeId = await getCurrentStoreId()
      if (!userId || !storeId) {
        throw new Error('Select a store first.')
      }

      const updates: Record<string, unknown> = { updatedAt: serverTimestamp() }
      if (params.customerPhone !== undefined) {
        updates.customerPhone = params.customerPhone.trim()
      }
      if (params.productName !== undefined) {
        const trimmed = params.productName.trim()
        if (!trimmed) throw new Error('Product interest is required.')
        updates.productName = trimmed
      }
      if (params.estimatedValue !== undefined) {
        updates.estimatedValue =
          typeof params.estimatedValue === 'number' && params.estimatedValue >= 0
            ? params.estimatedValue
            : 0
      }
      if (params.inventoryItemId !== undefined) {
        const id = params.inventoryItemId?.trim()
        updates.inventoryItemId = id || ''
      }

      const { isDemoModeActive } = await import('~/utils/demo-mode')
      if (isDemoModeActive()) {
        const { updateDemoSalesLead } = await import('~/utils/demo-extras')
        updateDemoSalesLead(storeId, leadId, updates)
        await this.fetchLeadById(leadId)
        await this.fetchSalesLeads(true)
        return
      }

      const db = useFirestore().getFirestoreInstance()
      if (!db) throw new Error('Cloud storage is unavailable.')

      const leadRef = getSalesLeadDocument(db, userId, storeId, leadId)
      await updateDoc(leadRef, updates)
      await this.fetchLeadById(leadId)
    },

    async assignLead(leadId: string, assignedTo: string | null) {
      const authStore = useAuthStore()
      if (!authStore.currentUser) {
        throw new Error('Sign in to assign this lead.')
      }

      const userId = await getQueryUserId()
      const storeId = await getCurrentStoreId()
      if (!userId || !storeId) {
        throw new Error('Select a store first.')
      }

      const { isDemoModeActive } = await import('~/utils/demo-mode')
      if (isDemoModeActive()) {
        const { updateDemoSalesLead } = await import('~/utils/demo-extras')
        updateDemoSalesLead(storeId, leadId, { assignedTo: assignedTo || '' })
        await this.fetchLeadById(leadId)
        await this.fetchSalesLeads(true)
        return
      }

      const db = useFirestore().getFirestoreInstance()
      if (!db) throw new Error('Cloud storage is unavailable.')

      const leadRef = getSalesLeadDocument(db, userId, storeId, leadId)
      await updateDoc(leadRef, {
        assignedTo: assignedTo || '',
        updatedAt: serverTimestamp(),
      })

      const label = assignedTo ? 'Lead assigned' : 'Assignment cleared'
      await this.appendLeadEvent(leadId, 'note', label, userId, storeId)
      await this.fetchLeadById(leadId)
    },

    async deleteSalesLead(leadId: string) {
      const authStore = useAuthStore()
      if (!authStore.currentUser) {
        throw new Error('Sign in to delete this lead.')
      }

      const userId = await getQueryUserId()
      const storeId = await getCurrentStoreId()
      if (!userId || !storeId) {
        throw new Error('Select a store first.')
      }

      const existing =
        this.leads.find((l) => l.id === leadId) ??
        (this.currentLead?.id === leadId ? this.currentLead : null)

      const { isDemoModeActive } = await import('~/utils/demo-mode')
      if (isDemoModeActive()) {
        const { deleteDemoSalesLead } = await import('~/utils/demo-extras')
        deleteDemoSalesLead(storeId, leadId)
        this.leads = this.leads.filter((l) => l.id !== leadId)
        if (this.currentLead?.id === leadId) this.currentLead = null
        return
      }

      const db = useFirestore().getFirestoreInstance()
      if (!db) throw new Error('Cloud storage is unavailable.')

      const leadRef = getSalesLeadDocument(db, userId, storeId, leadId)
      await deleteDoc(leadRef)

      if (existing) {
        await this.writeLeadActivityLog('deleted', existing)
      }

      this.leads = this.leads.filter((l) => l.id !== leadId)
      if (this.currentLead?.id === leadId) this.currentLead = null
    },

    async updateLeadStatus(leadId: string, status: SalesLeadStatus) {
      const db = useFirestore().getFirestoreInstance()
      const authStore = useAuthStore()
      if (!db || !authStore.currentUser) {
        throw new Error('Sign in to update this lead.')
      }

      const userId = await getQueryUserId()
      const storeId = await getCurrentStoreId()
      if (!userId || !storeId) {
        throw new Error('Select a store first.')
      }

      const leadRef = getSalesLeadDocument(db, userId, storeId, leadId)
      await updateDoc(leadRef, {
        status,
        updatedAt: serverTimestamp(),
      })

      const label = SALES_LEAD_STATUS_LABELS[status]
      await this.appendLeadEvent(leadId, 'status_change', `Status changed to ${label}`, userId, storeId)
      await this.fetchLeadById(leadId)
    },

    async addLeadNote(leadId: string, note: string) {
      const trimmed = note.trim()
      if (!trimmed) return

      const db = useFirestore().getFirestoreInstance()
      const authStore = useAuthStore()
      if (!db || !authStore.currentUser) {
        throw new Error('Sign in to add a note.')
      }

      const userId = await getQueryUserId()
      const storeId = await getCurrentStoreId()
      if (!userId || !storeId) {
        throw new Error('Select a store first.')
      }

      const leadRef = getSalesLeadDocument(db, userId, storeId, leadId)
      await updateDoc(leadRef, {
        notes: trimmed,
        updatedAt: serverTimestamp(),
      })

      await this.appendLeadEvent(leadId, 'note', trimmed, userId, storeId)
      await this.fetchLeadById(leadId)
    },

    async markLeadConverted(leadId: string, receiptId: string, wonRevenue: number) {
      const authStore = useAuthStore()
      if (!authStore.currentUser) return

      const userId = await getQueryUserId()
      const storeId = await getCurrentStoreId()
      if (!userId || !storeId) return

      const existing =
        this.leads.find((l) => l.id === leadId) ??
        (this.currentLead?.id === leadId ? this.currentLead : null)

      const { isDemoModeActive } = await import('~/utils/demo-mode')
      if (isDemoModeActive()) {
        const { updateDemoSalesLead } = await import('~/utils/demo-extras')
        updateDemoSalesLead(storeId, leadId, {
          status: 'won',
          receiptId,
          wonRevenue,
        })
        await this.fetchLeadById(leadId)
        await this.fetchSalesLeads(true)
        const lead = this.currentLead
        if (lead) {
          await this.writeLeadActivityLog('updated', lead, 'converted to sale')
          await this.notifyLeadEvent(
            'lead_converted',
            'Lead marked won',
            `${lead.customerName} converted to a sale`,
            { leadId, receiptId },
            authStore.currentUser.uid
          )
        }
        return
      }

      const db = useFirestore().getFirestoreInstance()
      if (!db) return

      const leadRef = getSalesLeadDocument(db, userId, storeId, leadId)
      await updateDoc(leadRef, {
        status: 'won',
        receiptId,
        wonRevenue,
        updatedAt: serverTimestamp(),
      })

      await this.appendLeadEvent(
        leadId,
        'converted',
        `Converted to sale (${receiptId})`,
        userId,
        storeId
      )

      await this.fetchLeadById(leadId)

      const lead = this.currentLead ?? existing
      if (lead) {
        await this.writeLeadActivityLog('updated', lead, 'converted to sale')
        await this.notifyLeadEvent(
          'lead_converted',
          'Lead marked won',
          `${lead.customerName} converted to a sale`,
          { leadId, receiptId },
          authStore.currentUser.uid
        )
      }
    },

    async markLeadLost(leadId: string, reason?: string) {
      const db = useFirestore().getFirestoreInstance()
      const authStore = useAuthStore()
      if (!db || !authStore.currentUser) {
        throw new Error('Sign in to update this lead.')
      }

      const userId = await getQueryUserId()
      const storeId = await getCurrentStoreId()
      if (!userId || !storeId) {
        throw new Error('Select a store first.')
      }

      const trimmedReason = reason?.trim() || ''
      const leadRef = getSalesLeadDocument(db, userId, storeId, leadId)
      await updateDoc(leadRef, {
        status: 'lost',
        lostReason: trimmedReason,
        updatedAt: serverTimestamp(),
      })

      await this.appendLeadEvent(
        leadId,
        'lost',
        trimmedReason ? `Marked lost: ${trimmedReason}` : 'Marked lost',
        userId,
        storeId
      )
      await this.fetchLeadById(leadId)
    },

    async appendLeadEvent(
      leadId: string,
      type: SalesLeadEventType,
      description: string,
      userId?: string,
      storeId?: string
    ) {
      const db = useFirestore().getFirestoreInstance()
      const authStore = useAuthStore()
      if (!db || !authStore.currentUser) return

      const ownerId = userId ?? (await getQueryUserId())
      const branchId = storeId ?? (await getCurrentStoreId())
      if (!ownerId || !branchId) return

      const ref = doc(getLeadEventsCollection(db, ownerId, branchId))
      await setDoc(ref, {
        storeId: branchId,
        leadId,
        type,
        description,
        createdBy: authStore.currentUser.uid,
        createdAt: serverTimestamp(),
      })
    },
  },
})

export { SALES_LEAD_SOURCE_LABELS, SALES_LEAD_STATUS_LABELS }
