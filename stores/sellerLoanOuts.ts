import { defineStore } from 'pinia'
import { assertPlanWritable } from '~/utils/plan-view-only'
import { getDocs, query, orderBy, limit } from 'firebase/firestore'

import { useFirestore } from '~/composables/useFirestore'
import { useAuthStore } from '~/stores/auth'
import { getQueryUserId, getSellerLoanOutsCollection } from '~/composables/useFirestorePaths'
import { getCurrentStoreId } from '~/composables/useCurrentStore'
import { invalidateFolderItemCaches } from '~/utils/inventory-items-firestore'

/** Max writes per Firestore batch (loan doc + item updates stay in one batch). */
export const SELLER_LOAN_OUT_BATCH_CAP = 450

export interface SellerLoanLineSnapshot {
  inventoryItemId: string
  folderId: string
  itemSummary: string
}

export interface SellerLoanOut {
  id: string
  storeId: string
  status: 'active' | 'returned' | 'sold'
  partyName: string
  partyPhone: string
  partyNotes: string
  lines: SellerLoanLineSnapshot[]
  createdAt?: Date
  updatedAt?: Date
  returnedAt?: Date
  /** When all units were recorded as sold (e.g. borrower sold off-site). */
  soldAt?: Date
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

function mapLoanDoc(id: string, data: Record<string, unknown>): SellerLoanOut {
  const rawStatus = typeof data.status === 'string' ? data.status : 'active'
  const status: SellerLoanOut['status'] =
    rawStatus === 'returned' ? 'returned' : rawStatus === 'sold' ? 'sold' : 'active'
  return {
    id,
    storeId: (data.storeId as string) || '',
    status,
    partyName: (data.partyName as string) || '',
    partyPhone: (data.partyPhone as string) ?? '',
    partyNotes: (data.partyNotes as string) || '',
    lines: Array.isArray(data.lines) ? (data.lines as SellerLoanLineSnapshot[]) : [],
    createdAt: snapshotToDate(data.createdAt),
    updatedAt: snapshotToDate(data.updatedAt),
    returnedAt: snapshotToDate(data.returnedAt),
    soldAt: snapshotToDate(data.soldAt),
    createdBy: (data.createdBy as string) || '',
  }
}

export const useSellerLoanOutsStore = defineStore('sellerLoanOuts', {
  state: () => ({
    loans: [] as SellerLoanOut[],
    loading: false,
    error: null as string | null,
    lastFetchedStoreId: null as string | null,
  }),

  actions: {
    clearForUiStoreSwitch() {
      this.loans = []
      this.lastFetchedStoreId = null
    },

    async fetchSellerLoanOuts(force = false) {
      const { isDemoModeActive } = await import('~/utils/demo-mode')
      if (isDemoModeActive()) {
        const storeId = (await getCurrentStoreId()) || ''
        if (force || this.loans.length === 0 || this.lastFetchedStoreId !== storeId) {
          const { getDemoSellerLoans } = await import('~/utils/demo-bridge')
          this.loans = getDemoSellerLoans(storeId)
          this.lastFetchedStoreId = storeId
        }
        this.loading = false
        this.error = null
        return
      }

      const db = useFirestore().getFirestoreInstance()
      const authStore = useAuthStore()
      if (!db || !authStore.currentUser) {
        this.loans = []
        return
      }

      const userId = await getQueryUserId()
      const storeId = await getCurrentStoreId()
      if (!userId || !storeId) {
        this.loans = []
        return
      }

      if (!force && this.lastFetchedStoreId === storeId && this.loans.length > 0) {
        return
      }

      this.loading = true
      this.error = null
      try {
        const col = getSellerLoanOutsCollection(db, userId, storeId)
        const snap = await getDocs(query(col, orderBy('createdAt', 'desc'), limit(200)))
        this.loans = snap.docs.map((d) => mapLoanDoc(d.id, d.data() as Record<string, unknown>))
        this.lastFetchedStoreId = storeId
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Failed to load stock loans'
        this.error = msg
        console.warn('[sellerLoanOuts] fetch failed:', e)
        this.loans = []
      } finally {
        this.loading = false
      }
    },

    /** A sale can only change a loan that is still active, so skip the re-read when none are */
    async refreshAfterSale() {
      if (!this.loans.some((loan) => loan.status === 'active')) return
      await this.fetchSellerLoanOuts(true)
    },

    async createSellerLoanOut(params: {
      partyName: string
      partyPhone: string
      partyNotes?: string
      lines: SellerLoanLineSnapshot[]
    }) {
      assertPlanWritable()
      const { isDemoModeActive, DEMO_USER_UID } = await import('~/utils/demo-mode')
      if (isDemoModeActive()) {
        const demoStoreId = (await getCurrentStoreId()) || ''
        const name = params.partyName.trim()
        if (!name) throw new Error('Seller or reseller name is required')
        const lines = params.lines.filter((l) => l.inventoryItemId && l.folderId)
        if (lines.length === 0) throw new Error('Select at least one product')
        const loanId = `demo_loan_${Math.random().toString(36).slice(2, 9)}`
        this.loans.unshift({
          id: loanId,
          storeId: demoStoreId,
          status: 'active',
          partyName: name,
          partyPhone: params.partyPhone.trim(),
          partyNotes: (params.partyNotes || '').trim(),
          lines,
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: DEMO_USER_UID,
        })
        const { setDemoExtrasLoansForStore } = await import('~/utils/demo-extras')
        setDemoExtrasLoansForStore(demoStoreId, this.loans)
        return loanId
      }

      const name = params.partyName.trim()
      if (!name) throw new Error('Seller or reseller name is required')
      const lines = params.lines.filter((l) => l.inventoryItemId && l.folderId)
      if (lines.length === 0) throw new Error('Select at least one product')
      if (lines.length > SELLER_LOAN_OUT_BATCH_CAP) {
        throw new Error(
          `A stock loan can include at most ${SELLER_LOAN_OUT_BATCH_CAP} items at once. Split into multiple loans.`
        )
      }

      // The server checks each item is in stock and free, and writes the loan and items together.
      const { useSalesApi } = await import('~/composables/useSalesApi')
      const { loanId } = await useSalesApi().createStockLoan({
        partyName: name,
        partyPhone: params.partyPhone.trim(),
        partyNotes: (params.partyNotes || '').trim(),
        itemIds: lines.map((l) => l.inventoryItemId),
      })
      new Set(lines.map((l) => l.folderId)).forEach((fid) => invalidateFolderItemCaches(fid))
      await this.fetchSellerLoanOuts(true)
      return loanId
    },

    async returnSellerLoanOut(loanId: string) {
      const { isDemoModeActive } = await import('~/utils/demo-mode')
      if (isDemoModeActive()) {
        const loan = this.loans.find((l) => l.id === loanId)
        if (!loan) throw new Error('Loan not found')
        if (loan.status === 'returned') throw new Error('This loan was already marked as returned')
        if (loan.status === 'sold') throw new Error('This loan was already marked as sold')
        loan.status = 'returned'
        loan.returnedAt = new Date()
        loan.updatedAt = new Date()
        const { setDemoExtrasLoansForStore } = await import('~/utils/demo-extras')
        setDemoExtrasLoansForStore(loan.storeId, this.loans)
        return
      }

      const loan = this.loans.find((l) => l.id === loanId)
      const { useSalesApi } = await import('~/composables/useSalesApi')
      await useSalesApi().returnStockLoan(loanId)
      new Set(loan?.lines.map((l) => l.folderId) ?? []).forEach((fid) =>
        invalidateFolderItemCaches(fid)
      )
      await this.fetchSellerLoanOuts(true)
    },

    /** Borrower sold all units off‑POS: mark inventory sold (dateOut), clear loan fields, close loan as sold. */
    async markSellerLoanOutSold(loanId: string) {
      const { isDemoModeActive } = await import('~/utils/demo-mode')
      if (isDemoModeActive()) {
        const loan = this.loans.find((l) => l.id === loanId)
        if (!loan) throw new Error('Loan not found')
        if (loan.status === 'returned') throw new Error('This loan was already marked as returned')
        if (loan.status === 'sold') throw new Error('This loan was already marked as sold')
        loan.status = 'sold'
        loan.soldAt = new Date()
        loan.updatedAt = new Date()
        const { setDemoExtrasLoansForStore } = await import('~/utils/demo-extras')
        setDemoExtrasLoansForStore(loan.storeId, this.loans)
        return
      }

      // Owner or managers only: the items leave stock with no sale recorded here.
      const loan = this.loans.find((l) => l.id === loanId)
      const { useSalesApi } = await import('~/composables/useSalesApi')
      await useSalesApi().markStockLoanSold(loanId)
      new Set(loan?.lines.map((l) => l.folderId) ?? []).forEach((fid) =>
        invalidateFolderItemCaches(fid)
      )
      await this.fetchSellerLoanOuts(true)
    },
  },
})
