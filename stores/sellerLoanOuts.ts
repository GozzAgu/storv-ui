import { defineStore } from 'pinia'
import {
 doc,
 getDoc,
 getDocs,
 query,
 orderBy,
 limit,
 writeBatch,
 serverTimestamp,
 deleteField,
} from 'firebase/firestore'

import { useFirestore } from '~/composables/useFirestore'
import { useAuthStore } from '~/stores/auth'
import { getQueryUserId, getSellerLoanOutDocument, getSellerLoanOutsCollection, getInventoryItemDocument } from '~/composables/useFirestorePaths'
import { getCurrentStoreId } from '~/composables/useCurrentStore'
import { logActivity, getCurrentUserDisplayName } from '~/composables/useActivityLog'
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
 if (v && typeof v === 'object' && 'toDate' in v && typeof (v as { toDate: () => Date }).toDate === 'function') {
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

 async createSellerLoanOut(params: {
 partyName: string
 partyPhone: string
 partyNotes?: string
 lines: SellerLoanLineSnapshot[]
 }) {
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
 return loanId
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

 const name = params.partyName.trim()
 if (!name) {
 throw new Error('Seller or reseller name is required')
 }
 const phone = params.partyPhone.trim()
 const lines = params.lines.filter((l) => l.inventoryItemId && l.folderId)
 if (lines.length === 0) {
 throw new Error('Select at least one product')
 }
 if (lines.length > SELLER_LOAN_OUT_BATCH_CAP) {
 throw new Error(`A stock loan can include at most ${SELLER_LOAN_OUT_BATCH_CAP} items at once. Split into multiple loans.`)
 }

 const folderIds = new Set(lines.map((l) => l.folderId))
 const loanRef = doc(getSellerLoanOutsCollection(db, userId, storeId))
 const loanId = loanRef.id
 const nowPartyPhone = phone
 const createdByUid = authStore.currentUser.uid

 const batch = writeBatch(db)
 batch.set(loanRef, {
 storeId,
 status: 'active',
 partyName: name,
 partyPhone: nowPartyPhone,
 partyNotes: (params.partyNotes || '').trim(),
 lines,
 createdBy: createdByUid,
 createdAt: serverTimestamp(),
 updatedAt: serverTimestamp(),
 })

 for (const line of lines) {
 const itemRef = getInventoryItemDocument(db, userId, storeId, line.inventoryItemId)
 batch.update(itemRef, {
 sellerLoanOutId: loanId,
 sellerLoanPartyName: name,
 sellerLoanPartyPhone: nowPartyPhone,
 sellerLoanOutAt: serverTimestamp(),
 updatedAt: serverTimestamp(),
 })
 }

 await batch.commit()

 folderIds.forEach((fid) => invalidateFolderItemCaches(fid))

 const userDisplayName = await getCurrentUserDisplayName().catch(() => 'Unknown')
 await logActivity({
 action: 'created',
 entityType: 'items_batch',
 entityId: loanId,
 entityName: `Loaned ${lines.length} item(s) to ${name}`,
 storeId,
 userId: createdByUid,
 userDisplayName,
 }).catch(() => {})

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
 return
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

 const loanSnap = await getDoc(getSellerLoanOutDocument(db, userId, storeId, loanId))
 if (!loanSnap.exists()) {
 throw new Error('Loan not found')
 }
 const loanData = loanSnap.data() as Record<string, unknown>
 const status = loanData.status
 if (status === 'returned') {
 throw new Error('This loan was already marked as returned')
 }
 if (status === 'sold') {
 throw new Error('This loan was already marked as sold')
 }
 const rawLines = Array.isArray(loanData.lines) ? (loanData.lines as SellerLoanLineSnapshot[]) : []
 if (rawLines.length > SELLER_LOAN_OUT_BATCH_CAP) {
 throw new Error('This loan lists too many items to return in one operation. Contact support.')
 }

 const folderIds = new Set(rawLines.map((l) => l.folderId))

 const batch = writeBatch(db)
 const loanRef = getSellerLoanOutDocument(db, userId, storeId, loanId)
 batch.update(loanRef, {
 status: 'returned',
 returnedAt: serverTimestamp(),
 updatedAt: serverTimestamp(),
 })

 for (const line of rawLines) {
 const itemRef = getInventoryItemDocument(db, userId, storeId, line.inventoryItemId)
 batch.update(itemRef, {
 sellerLoanOutId: deleteField(),
 sellerLoanPartyName: deleteField(),
 sellerLoanPartyPhone: deleteField(),
 sellerLoanOutAt: deleteField(),
 updatedAt: serverTimestamp(),
 })
 }

 await batch.commit()

 folderIds.forEach((fid) => invalidateFolderItemCaches(fid))

 const userDisplayName = await getCurrentUserDisplayName().catch(() => 'Unknown')
 const partyNameStr = typeof loanData.partyName === 'string' ? loanData.partyName : 'borrower'
 await logActivity({
 action: 'updated',
 entityType: 'items_batch',
 entityId: loanId,
 entityName: `Returned stock loan from ${partyNameStr} (${rawLines.length} item(s))`,
 storeId,
 userId: authStore.currentUser.uid,
 userDisplayName,
 }).catch(() => {})

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
 return
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

 const loanSnap = await getDoc(getSellerLoanOutDocument(db, userId, storeId, loanId))
 if (!loanSnap.exists()) {
 throw new Error('Loan not found')
 }
 const loanData = loanSnap.data() as Record<string, unknown>
 if (loanData.status === 'returned') {
 throw new Error('This loan was already returned to the store')
 }
 if (loanData.status === 'sold') {
 throw new Error('This loan was already marked as sold')
 }

 const rawLines = Array.isArray(loanData.lines) ? (loanData.lines as SellerLoanLineSnapshot[]) : []
 if (rawLines.length === 0) {
 throw new Error('This loan has no items to mark sold')
 }
 if (rawLines.length > SELLER_LOAN_OUT_BATCH_CAP) {
 throw new Error('This loan lists too many items to update in one step. Contact support.')
 }

 const folderIds = new Set(rawLines.map((l) => l.folderId))
 const now = new Date()
 const loanRef = getSellerLoanOutDocument(db, userId, storeId, loanId)

 const batch = writeBatch(db)
 for (const line of rawLines) {
 const itemRef = getInventoryItemDocument(db, userId, storeId, line.inventoryItemId)
 batch.update(itemRef, {
 dateOut: now,
 sellerLoanOutId: deleteField(),
 sellerLoanPartyName: deleteField(),
 sellerLoanPartyPhone: deleteField(),
 sellerLoanOutAt: deleteField(),
 updatedAt: serverTimestamp(),
 })
 }
 batch.update(loanRef, {
 status: 'sold',
 soldAt: serverTimestamp(),
 updatedAt: serverTimestamp(),
 })

 await batch.commit()

 folderIds.forEach((fid) => invalidateFolderItemCaches(fid))

 const userDisplayName = await getCurrentUserDisplayName().catch(() => 'Unknown')
 const partyNameStr = typeof loanData.partyName === 'string' ? loanData.partyName : 'borrower'
 await logActivity({
 action: 'updated',
 entityType: 'items_batch',
 entityId: loanId,
 entityName: `Stock loan (${partyNameStr}): marked ${rawLines.length} item(s) sold, inventory updated`,
 storeId,
 userId: authStore.currentUser.uid,
 userDisplayName,
 }).catch(() => {})

 await this.fetchSellerLoanOuts(true)
 },
 },
})
