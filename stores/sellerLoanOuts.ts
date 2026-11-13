import { defineStore } from 'pinia'
import { assertPlanWritable } from '~/utils/plan-view-only'
import { getDocs, query, orderBy, limit } from 'firebase/firestore'

import { useFirestore } from '~/composables/useFirestore'
import { useAuthStore } from '~/stores/auth'
import { getQueryUserId, getSellerLoanOutsCollection } from '~/composables/useFirestorePaths'
import { getCurrentStoreId } from '~/composables/useCurrentStore'
import { invalidateFolderItemCaches } from '~/utils/inventory-items-firestore'
import type { StockItemDetails } from '~/utils/stock-item-details'
import {
  OPEN_STOCK_LOAN_STATUSES,
  normalizeStockLoanStatus,
  type StockLoanAction,
  type StockLoanStatus,
} from '~/types/stock-loans'
import { decideStockLoanAction } from '~/utils/stock-loan-policy'

/** Max writes per Firestore batch (loan doc + item updates stay in one batch). */
export const SELLER_LOAN_OUT_BATCH_CAP = 450

export interface SellerLoanLineSnapshot {
  inventoryItemId: string
  folderId: string
  itemSummary: string
  /** Serial, IMEI, colour, condition… captured when lent (loans from before this have none). */
  details?: StockItemDetails
}

export interface SellerLoanOut {
  id: string
  storeId: string
  status: StockLoanStatus
  partyName: string
  partyPhone: string
  partyNotes: string
  lines: SellerLoanLineSnapshot[]
  createdAt?: Date
  updatedAt?: Date
  returnedAt?: Date
  /** When all units were recorded as sold (e.g. borrower sold off-site). */
  soldAt?: Date
  approvedAt?: Date
  approvedBy?: string
  /** The creator could approve loans, so it went out without waiting. */
  autoApproved?: boolean
  rejectedAt?: Date
  rejectionReason?: string
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
  return {
    id,
    storeId: (data.storeId as string) || '',
    status: normalizeStockLoanStatus(data.status),
    partyName: (data.partyName as string) || '',
    partyPhone: (data.partyPhone as string) ?? '',
    partyNotes: (data.partyNotes as string) || '',
    lines: Array.isArray(data.lines) ? (data.lines as SellerLoanLineSnapshot[]) : [],
    createdAt: snapshotToDate(data.createdAt),
    updatedAt: snapshotToDate(data.updatedAt),
    returnedAt: snapshotToDate(data.returnedAt),
    soldAt: snapshotToDate(data.soldAt),
    approvedAt: snapshotToDate(data.approvedAt),
    approvedBy: typeof data.approvedBy === 'string' ? data.approvedBy : undefined,
    autoApproved: data.autoApproved === true,
    rejectedAt: snapshotToDate(data.rejectedAt),
    rejectionReason: typeof data.rejectionReason === 'string' ? data.rejectionReason : undefined,
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

    /** A sale can only change a loan that is still open, so skip the re-read when none are */
    async refreshAfterSale() {
      if (!this.loans.some((loan) => OPEN_STOCK_LOAN_STATUSES.has(loan.status))) return
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
        // The demo user is the owner, whose loans go out without waiting.
        return { loanId, status: 'active' as StockLoanStatus }
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
      const created = await useSalesApi().createStockLoan({
        partyName: name,
        partyPhone: params.partyPhone.trim(),
        partyNotes: (params.partyNotes || '').trim(),
        itemIds: lines.map((l) => l.inventoryItemId),
      })
      new Set(lines.map((l) => l.folderId)).forEach((fid) => invalidateFolderItemCaches(fid))
      await this.fetchSellerLoanOuts(true)
      return created
    },

    /**
     * Approve, reject, cancel, return or mark sold. The server decides (utils/stock-loan-policy.ts);
     * demo mode applies the same transition locally as the owner.
     */
    async runLoanAction(loanId: string, action: StockLoanAction, reason?: string) {
      assertPlanWritable()
      const loan = this.loans.find((l) => l.id === loanId)
      const { isDemoModeActive } = await import('~/utils/demo-mode')
      if (isDemoModeActive()) {
        if (!loan) throw new Error('Loan not found')
        const decision = decideStockLoanAction(
          loan,
          action,
          {
            uid: loan.createdBy,
            isOwner: true,
            canApprove: true,
            canEdit: true,
            canMarkSold: true,
          },
          reason
        )
        if (!decision.ok) throw new Error(decision.message)
        const now = new Date()
        loan.status = decision.to
        loan.updatedAt = now
        if (action === 'approve') loan.approvedAt = now
        if (action === 'reject') Object.assign(loan, { rejectedAt: now, rejectionReason: reason })
        if (action === 'return') loan.returnedAt = now
        if (action === 'mark_sold') loan.soldAt = now
        const { setDemoExtrasLoansForStore } = await import('~/utils/demo-extras')
        setDemoExtrasLoansForStore(loan.storeId, this.loans)
        return
      }

      const { useSalesApi } = await import('~/composables/useSalesApi')
      const api = useSalesApi()
      const calls: Record<StockLoanAction, () => Promise<unknown>> = {
        approve: () => api.approveStockLoan(loanId),
        reject: () => api.rejectStockLoan(loanId, reason ?? ''),
        cancel: () => api.cancelStockLoan(loanId),
        return: () => api.returnStockLoan(loanId),
        mark_sold: () => api.markStockLoanSold(loanId),
      }
      await calls[action]()
      // Approving keeps the items reserved; every other move frees or removes them.
      new Set(loan?.lines.map((l) => l.folderId) ?? []).forEach((fid) =>
        invalidateFolderItemCaches(fid)
      )
      await this.fetchSellerLoanOuts(true)
    },

    returnSellerLoanOut(loanId: string) {
      return this.runLoanAction(loanId, 'return')
    },

    /** Borrower sold all units off the till: they leave stock with no sale recorded here. */
    markSellerLoanOutSold(loanId: string) {
      return this.runLoanAction(loanId, 'mark_sold')
    },
  },
})
