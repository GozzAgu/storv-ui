import { defineStore } from 'pinia'
import {
  doc,
  getDocs,
  query,
  orderBy,
  limit,
  where,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore'

import { useFirestore } from '~/composables/useFirestore'
import { useAuthStore } from '~/stores/auth'
import { getQueryUserId } from '~/composables/useFirestorePaths'
import {
  getSocialLeadsCollection,
  getSocialLeadDocument,
  getSocialEventsCollection,
} from '~/composables/social-sales/useSocialSalesPaths'
import { getCurrentStoreId } from '~/composables/useCurrentStore'
import { getCurrentUserDisplayName } from '~/composables/useActivityLog'
import { createMockSocialEvents, createMockSocialLeads } from '~/composables/social-sales/mock-data'
import {
  mapSocialEventDoc,
  mapSocialLeadDoc,
  socialLeadToFirestore,
} from '~/utils/social-sales-firestore'
import type { SocialEvent, SocialLead, SocialLeadStatus, SocialSalesPlatform } from '~/types/social-sales'
import { socialLeadStatusLabel } from '~/types/social-sales'

export interface SocialLeadFilters {
  search: string
  platform: SocialSalesPlatform | 'all'
  status: SocialLeadStatus | 'all'
}

export interface CreateSocialLeadInput {
  customerName: string
  customerPhone?: string
  whatsappNumber?: string
  instagramUsername?: string
  platform: SocialSalesPlatform
  productName: string
  productId?: string
  estimatedValue: number
  assignedTo?: string
  assignedToName?: string
  notes?: string
}

export const useSocialSalesLeadsStore = defineStore('socialSalesLeads', {
  state: () => ({
    leads: [] as SocialLead[],
    events: [] as SocialEvent[],
    eventsLoadedForLeadIds: [] as string[],
    loading: false,
    eventsLoading: false,
    saving: false,
    error: null as string | null,
    lastFetchedStoreId: null as string | null,
    filters: {
      search: '',
      platform: 'all',
      status: 'all',
    } as SocialLeadFilters,
  }),

  getters: {
    filteredLeads(state): SocialLead[] {
      const q = state.filters.search.trim().toLowerCase()
      return state.leads.filter((lead) => {
        if (state.filters.platform !== 'all' && lead.platform !== state.filters.platform) {
          return false
        }
        if (state.filters.status !== 'all' && lead.status !== state.filters.status) {
          return false
        }
        if (!q) return true
        const haystack = [
          lead.customerName,
          lead.productName,
          lead.customerPhone,
          lead.instagramUsername,
          lead.whatsappNumber,
          lead.assignedToName,
          lead.notes,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
        return haystack.includes(q)
      })
    },

    getLeadById: (state) => (id: string) => state.leads.find((l) => l.id === id),

    getEventsForLead: (state) => (leadId: string) =>
      [...state.events]
        .filter((e) => e.leadId === leadId)
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()),
  },

  actions: {
    clearForUiStoreSwitch() {
      this.leads = []
      this.events = []
      this.eventsLoadedForLeadIds = []
      this.lastFetchedStoreId = null
      this.error = null
    },

    setFilters(partial: Partial<SocialLeadFilters>) {
      this.filters = { ...this.filters, ...partial }
    },

    async _resolveContext() {
      const { isDemoModeActive } = await import('~/utils/demo-mode')
      if (isDemoModeActive()) {
        const storeId = (await getCurrentStoreId()) || ''
        return { demo: true as const, storeId, userId: null, db: null, authUid: null }
      }

      const db = useFirestore().getFirestoreInstance()
      const authStore = useAuthStore()
      if (!db || !authStore.currentUser) {
        return { demo: false as const, storeId: null, userId: null, db: null, authUid: null }
      }

      const userId = await getQueryUserId()
      const storeId = await getCurrentStoreId()
      if (!userId || !storeId) {
        return { demo: false as const, storeId: null, userId: null, db: null, authUid: null }
      }

      return {
        demo: false as const,
        storeId,
        userId,
        db,
        authUid: authStore.currentUser.uid,
      }
    },

    async fetchLeads(force = false) {
      const ctx = await this._resolveContext()
      if (!ctx.storeId) {
        this.clearForUiStoreSwitch()
        return
      }
      if (!force && this.lastFetchedStoreId === ctx.storeId && this.leads.length > 0) {
        return
      }

      this.loading = true
      this.error = null
      try {
        if (ctx.demo) {
          this.leads = createMockSocialLeads(ctx.storeId)
          this.events = createMockSocialEvents()
          this.eventsLoadedForLeadIds = this.leads.map((l) => l.id)
          this.lastFetchedStoreId = ctx.storeId
          return
        }

        if (!ctx.db || !ctx.userId) {
          this.leads = []
          return
        }

        const col = getSocialLeadsCollection(ctx.db, ctx.userId, ctx.storeId)
        const snap = await getDocs(query(col, orderBy('createdAt', 'desc'), limit(500)))
        this.leads = snap.docs.map((d) => mapSocialLeadDoc(d.id, d.data() as Record<string, unknown>))
        this.events = []
        this.eventsLoadedForLeadIds = []
        this.lastFetchedStoreId = ctx.storeId
      } catch (e: unknown) {
        this.error = e instanceof Error ? e.message : 'Could not load social leads'
        console.warn('[socialSalesLeads] fetch failed:', e)
        this.leads = []
      } finally {
        this.loading = false
      }
    },

    async fetchEventsForLead(leadId: string, force = false) {
      if (!leadId) return
      if (!force && this.eventsLoadedForLeadIds.includes(leadId)) return

      const ctx = await this._resolveContext()
      if (!ctx.storeId) return

      this.eventsLoading = true
      try {
        if (ctx.demo) {
          if (this.events.length === 0) {
            this.events = createMockSocialEvents()
          }
          if (!this.eventsLoadedForLeadIds.includes(leadId)) {
            this.eventsLoadedForLeadIds.push(leadId)
          }
          return
        }

        if (!ctx.db || !ctx.userId) return

        const col = getSocialEventsCollection(ctx.db, ctx.userId, ctx.storeId)
        const snap = await getDocs(
          query(col, where('leadId', '==', leadId), orderBy('timestamp', 'desc'), limit(100))
        )
        const fetched = snap.docs.map((d) =>
          mapSocialEventDoc(d.id, d.data() as Record<string, unknown>)
        )
        this.events = [...this.events.filter((e) => e.leadId !== leadId), ...fetched]
        if (!this.eventsLoadedForLeadIds.includes(leadId)) {
          this.eventsLoadedForLeadIds.push(leadId)
        }
      } catch (e: unknown) {
        console.warn('[socialSalesLeads] fetchEventsForLead failed:', e)
      } finally {
        this.eventsLoading = false
      }
    },

    async createLead(input: CreateSocialLeadInput) {
      const name = input.customerName.trim()
      if (!name) throw new Error('Customer name is required')
      const productName = input.productName.trim()
      if (!productName) throw new Error('Product name is required')

      const ctx = await this._resolveContext()
      if (!ctx.storeId || !ctx.authUid) throw new Error('Select a store to create a lead')

      const estimatedValue = Number(input.estimatedValue)
      if (!Number.isFinite(estimatedValue) || estimatedValue < 0) {
        throw new Error('Enter a valid estimated value')
      }

      this.saving = true
      try {
        const actorName = await getCurrentUserDisplayName().catch(() => 'Staff')

        if (ctx.demo) {
          const id = `lead-demo-${Date.now()}`
          const now = new Date()
          const lead: SocialLead = {
            id,
            storeId: ctx.storeId,
            customerName: name,
            customerPhone: input.customerPhone?.trim() || undefined,
            whatsappNumber: input.whatsappNumber?.trim() || undefined,
            instagramUsername: input.instagramUsername?.trim() || undefined,
            platform: input.platform,
            productId: input.productId,
            productName,
            estimatedValue,
            status: 'new',
            assignedTo: input.assignedTo,
            assignedToName: input.assignedToName,
            notes: input.notes?.trim() || undefined,
            source: input.platform,
            createdAt: now,
            updatedAt: now,
            createdBy: ctx.authUid,
          }
          this.leads.unshift(lead)
          this.events.unshift({
            id: `evt-demo-${Date.now()}`,
            leadId: id,
            type: 'created',
            description: 'Lead created.',
            createdBy: ctx.authUid,
            createdByName: actorName,
            timestamp: now,
          })
          return lead
        }

        if (!ctx.db || !ctx.userId) throw new Error('Could not connect to Firestore')

        const batch = writeBatch(ctx.db)
        const leadsCol = getSocialLeadsCollection(ctx.db, ctx.userId, ctx.storeId)
        const leadRef = doc(leadsCol)
        const payload = socialLeadToFirestore({
          storeId: ctx.storeId,
          createdBy: ctx.authUid,
          customerName: name,
          customerPhone: input.customerPhone?.trim(),
          whatsappNumber: input.whatsappNumber?.trim(),
          instagramUsername: input.instagramUsername?.trim(),
          platform: input.platform,
          productId: input.productId,
          productName,
          estimatedValue,
          status: 'new',
          assignedTo: input.assignedTo,
          assignedToName: input.assignedToName,
          notes: input.notes?.trim(),
          source: input.platform,
        })

        batch.set(leadRef, {
          ...payload,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        })

        const eventsCol = getSocialEventsCollection(ctx.db, ctx.userId, ctx.storeId)
        const eventRef = doc(eventsCol)
        batch.set(eventRef, {
          leadId: leadRef.id,
          storeId: ctx.storeId,
          type: 'created',
          description: 'Lead created.',
          createdBy: ctx.authUid,
          createdByName: actorName,
          timestamp: serverTimestamp(),
        })

        await batch.commit()

        const lead: SocialLead = {
          id: leadRef.id,
          storeId: ctx.storeId,
          customerName: name,
          customerPhone: input.customerPhone?.trim() || undefined,
          whatsappNumber: input.whatsappNumber?.trim() || undefined,
          instagramUsername: input.instagramUsername?.trim() || undefined,
          platform: input.platform,
          productId: input.productId,
          productName,
          estimatedValue,
          status: 'new',
          assignedTo: input.assignedTo,
          assignedToName: input.assignedToName,
          notes: input.notes?.trim() || undefined,
          source: input.platform,
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: ctx.authUid,
        }
        this.leads.unshift(lead)
        this.events.unshift({
          id: eventRef.id,
          leadId: leadRef.id,
          type: 'created',
          description: 'Lead created.',
          createdBy: ctx.authUid,
          createdByName: actorName,
          timestamp: new Date(),
        })
        return lead
      } finally {
        this.saving = false
      }
    },

    async updateLeadStatus(leadId: string, status: SocialLeadStatus, actorName: string) {
      const lead = this.leads.find((l) => l.id === leadId)
      if (!lead || lead.status === status) return

      const ctx = await this._resolveContext()
      if (!ctx.storeId || !ctx.authUid) return

      const label = socialLeadStatusLabel(status)
      const description = `Status changed to ${label}.`

      if (ctx.demo) {
        lead.status = status
        lead.updatedAt = new Date()
        this.events.unshift({
          id: `evt-local-${Date.now()}`,
          leadId,
          type: 'status_change',
          description,
          createdBy: ctx.authUid,
          createdByName: actorName,
          timestamp: new Date(),
        })
        return
      }

      if (!ctx.db || !ctx.userId) return

      this.saving = true
      try {
        const batch = writeBatch(ctx.db)
        const leadRef = getSocialLeadDocument(ctx.db, ctx.userId, ctx.storeId, leadId)
        batch.update(leadRef, { status, updatedAt: serverTimestamp() })

        const eventsCol = getSocialEventsCollection(ctx.db, ctx.userId, ctx.storeId)
        const eventRef = doc(eventsCol)
        batch.set(eventRef, {
          leadId,
          storeId: ctx.storeId,
          type: 'status_change',
          description,
          createdBy: ctx.authUid,
          createdByName: actorName,
          timestamp: serverTimestamp(),
        })

        await batch.commit()
        lead.status = status
        lead.updatedAt = new Date()
        this.events.unshift({
          id: eventRef.id,
          leadId,
          type: 'status_change',
          description,
          createdBy: ctx.authUid,
          createdByName: actorName,
          timestamp: new Date(),
        })
      } finally {
        this.saving = false
      }
    },

    async addLeadNote(leadId: string, description: string, actorName: string) {
      const lead = this.leads.find((l) => l.id === leadId)
      if (!lead) return
      const trimmed = description.trim()
      if (!trimmed) return

      const ctx = await this._resolveContext()
      if (!ctx.storeId || !ctx.authUid) return

      if (ctx.demo) {
        lead.notes = lead.notes ? `${lead.notes}\n${trimmed}` : trimmed
        lead.updatedAt = new Date()
        this.events.unshift({
          id: `evt-note-${Date.now()}`,
          leadId,
          type: 'note',
          description: trimmed,
          createdBy: ctx.authUid,
          createdByName: actorName,
          timestamp: new Date(),
        })
        return
      }

      if (!ctx.db || !ctx.userId) return

      this.saving = true
      try {
        const batch = writeBatch(ctx.db)
        const leadRef = getSocialLeadDocument(ctx.db, ctx.userId, ctx.storeId, leadId)
        const nextNotes = lead.notes ? `${lead.notes}\n${trimmed}` : trimmed
        batch.update(leadRef, { notes: nextNotes, updatedAt: serverTimestamp() })

        const eventsCol = getSocialEventsCollection(ctx.db, ctx.userId, ctx.storeId)
        const eventRef = doc(eventsCol)
        batch.set(eventRef, {
          leadId,
          storeId: ctx.storeId,
          type: 'note',
          description: trimmed,
          createdBy: ctx.authUid,
          createdByName: actorName,
          timestamp: serverTimestamp(),
        })

        await batch.commit()
        lead.notes = nextNotes
        lead.updatedAt = new Date()
        this.events.unshift({
          id: eventRef.id,
          leadId,
          type: 'note',
          description: trimmed,
          createdBy: ctx.authUid,
          createdByName: actorName,
          timestamp: new Date(),
        })
      } finally {
        this.saving = false
      }
    },

    async linkLeadToCustomer(leadId: string, customerId: string, customerName: string, actorName: string) {
      const lead = this.leads.find((l) => l.id === leadId)
      if (!lead || lead.customerId === customerId) return

      const ctx = await this._resolveContext()
      if (!ctx.storeId || !ctx.authUid) return

      const description = `Linked to customer ${customerName}.`

      if (ctx.demo) {
        lead.customerId = customerId
        lead.updatedAt = new Date()
        this.events.unshift({
          id: `evt-link-${Date.now()}`,
          leadId,
          type: 'customer_linked',
          description,
          createdBy: ctx.authUid,
          createdByName: actorName,
          timestamp: new Date(),
        })
        return
      }

      if (!ctx.db || !ctx.userId) return

      this.saving = true
      try {
        const batch = writeBatch(ctx.db)
        const leadRef = getSocialLeadDocument(ctx.db, ctx.userId, ctx.storeId, leadId)
        batch.update(leadRef, { customerId, updatedAt: serverTimestamp() })

        const eventsCol = getSocialEventsCollection(ctx.db, ctx.userId, ctx.storeId)
        const eventRef = doc(eventsCol)
        batch.set(eventRef, {
          leadId,
          storeId: ctx.storeId,
          type: 'customer_linked',
          description,
          createdBy: ctx.authUid,
          createdByName: actorName,
          timestamp: serverTimestamp(),
        })

        await batch.commit()
        lead.customerId = customerId
        lead.updatedAt = new Date()
        this.events.unshift({
          id: eventRef.id,
          leadId,
          type: 'customer_linked',
          description,
          createdBy: ctx.authUid,
          createdByName: actorName,
          timestamp: new Date(),
        })
      } finally {
        this.saving = false
      }
    },

    async markLeadConverted(
      leadId: string,
      receiptId: string,
      wonRevenue: number,
      actorName: string
    ) {
      const lead = this.leads.find((l) => l.id === leadId)
      if (!lead) throw new Error('Lead not found')

      const ctx = await this._resolveContext()
      if (!ctx.storeId || !ctx.authUid) throw new Error('Select a store first')

      const description = `Converted to sale · receipt ${receiptId.slice(-6)}`

      if (ctx.demo) {
        lead.status = 'won'
        lead.receiptId = receiptId
        lead.wonRevenue = wonRevenue
        lead.updatedAt = new Date()
        this.events.unshift({
          id: `evt-conv-${Date.now()}`,
          leadId,
          type: 'converted_to_sale',
          description,
          createdBy: ctx.authUid,
          createdByName: actorName,
          timestamp: new Date(),
        })
        return
      }

      if (!ctx.db || !ctx.userId) throw new Error('Could not connect to Firestore')

      this.saving = true
      try {
        const batch = writeBatch(ctx.db)
        const leadRef = getSocialLeadDocument(ctx.db, ctx.userId, ctx.storeId, leadId)
        batch.update(leadRef, {
          status: 'won',
          receiptId,
          wonRevenue,
          updatedAt: serverTimestamp(),
        })

        const eventsCol = getSocialEventsCollection(ctx.db, ctx.userId, ctx.storeId)
        const eventRef = doc(eventsCol)
        batch.set(eventRef, {
          leadId,
          storeId: ctx.storeId,
          type: 'converted_to_sale',
          description,
          createdBy: ctx.authUid,
          createdByName: actorName,
          timestamp: serverTimestamp(),
        })

        await batch.commit()
        lead.status = 'won'
        lead.receiptId = receiptId
        lead.wonRevenue = wonRevenue
        lead.updatedAt = new Date()
        this.events.unshift({
          id: eventRef.id,
          leadId,
          type: 'converted_to_sale',
          description,
          createdBy: ctx.authUid,
          createdByName: actorName,
          timestamp: new Date(),
        })
      } finally {
        this.saving = false
      }
    },
  },
})
