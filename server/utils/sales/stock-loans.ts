import { createError } from 'h3'
import { FieldValue, type Firestore } from 'firebase-admin/firestore'
import type { InventoryFolder, InventoryItem } from '~/stores/inventory'
import { planHasFeature } from '~/types/subscription'
import { getInventoryItemDisplayName } from '~/composables/useInventoryItemDisplay'
import { folderHasSerialNumbers } from '~/utils/receipt-multi-folder'
import { snapshotStockItemDetails } from '~/utils/stock-item-details'
import { normalizeStockLoanStatus, type StockLoanAction } from '~/types/stock-loans'
import { normalizeReason } from '~/utils/approval-decision'
import {
  canApproveStockLoans,
  decideStockLoanAction,
  initialStockLoanStatus,
  isStockLoanAction,
  type StockLoanActor,
} from '~/utils/stock-loan-policy'
import { enforce } from '~/server/utils/approvals/enforce'
import { actorCanApproveDiscounts, actorCanUseCategory, assertId, forbid, type StoreActor } from './actor'
import { logSaleActivity } from './records'
import { notifyStockLoanChange } from './stock-loan-notify'

/** Loan doc plus one write per item must fit in one transaction. */
export const STOCK_LOAN_MAX_LINES = 450

function bad(message: string): never {
  throw createError({ statusCode: 400, message })
}
function conflict(message: string): never {
  throw createError({ statusCode: 409, message })
}

function requireEnterprise(actor: StoreActor) {
  if (actor.plan !== 'storvv_enterprise') forbid('Stock loans need the Enterprise plan.')
}

const clearLoan = {
  sellerLoanOutId: FieldValue.delete(),
  sellerLoanPartyName: FieldValue.delete(),
  sellerLoanPartyPhone: FieldValue.delete(),
  sellerLoanOutAt: FieldValue.delete(),
  sellerLoanPending: FieldValue.delete(),
}

/** The store actor in the stock-loan policy's terms. */
export function toStockLoanActor(actor: StoreActor): StockLoanActor {
  return {
    uid: actor.uid,
    isOwner: actor.isOwner,
    canApprove: canApproveStockLoans(actor),
    canEdit: actor.permissions.sellerLoans.edit === true,
    canMarkSold: actorCanApproveDiscounts(actor),
  }
}

/**
 * Lends items to a seller or reseller. Items must be in stock, unheld and not already lent. A loan
 * from someone who can't approve loans waits for approval: its items are reserved straight away
 * (so they can't be sold or lent twice) but marked pending until an approver releases them.
 */
export async function createStockLoan(db: Firestore, actor: StoreActor, input: Record<string, unknown>) {
  requireEnterprise(actor)
  if (!actor.isOwner && !actor.permissions.sellerLoans.create) forbid('You can’t create stock loans.')
  const partyName = String(input.partyName ?? '').trim().slice(0, 120)
  const partyPhone = String(input.partyPhone ?? '').trim().slice(0, 40)
  const partyNotes = String(input.partyNotes ?? '').trim().slice(0, 500)
  if (!partyName) bad('Seller or reseller name is required')
  const itemIds = [...new Set((Array.isArray(input.itemIds) ? input.itemIds : []).map((id) => assertId(id, 'itemId')))]
  if (itemIds.length === 0) bad('Select at least one product')
  if (itemIds.length > STOCK_LOAN_MAX_LINES) {
    bad(`A stock loan can include at most ${STOCK_LOAN_MAX_LINES} items at once. Split into multiple loans.`)
  }

  const status = initialStockLoanStatus(toStockLoanActor(actor))
  const pending = status === 'pending_approval'
  const loanRef = actor.store.collection('sellerLoanOuts').doc()
  // Big loans keep fewer details per unit so the loan stays well inside one document.
  const detailBudget = itemIds.length > 150 ? 6 : 16
  const result = await db.runTransaction(async (tx) => {
    const snaps = await tx.getAll(...itemIds.map((id) => actor.store.collection('inventoryItems').doc(id)))
    const folderIds = [...new Set(snaps.map((s) => String(s.data()?.folderId || '')).filter(Boolean))]
    const folderSnaps = folderIds.length
      ? await tx.getAll(...folderIds.map((id) => actor.store.collection('inventoryFolders').doc(id)))
      : []
    const folders = new Map(folderSnaps.map((s) => [s.id, s.data() as InventoryFolder | undefined]))

    const lines = snaps.map((snap) => {
      if (!snap.exists) conflict('A product in this loan no longer exists.')
      const item = { id: snap.id, ...(snap.data() as Record<string, unknown>) } as InventoryItem
      const name = getInventoryItemDisplayName(item) || 'A product'
      const folder = folders.get(String(item.folderId || ''))
      if (!actorCanUseCategory(actor, folder)) forbid(`You can’t lend from ${folder?.name || 'that category'}.`)
      if (item.sellerLoanOutId) conflict(`${name} is already out on a loan.`)
      if (item.pendingSaleReceiptId) conflict(`${name} is held on an outstanding order.`)
      if (folderHasSerialNumbers(folder) && item.dateOut) conflict(`${name} has already been sold.`)
      return {
        inventoryItemId: snap.id,
        folderId: String(item.folderId || ''),
        itemSummary: name.slice(0, 120),
        // Serial, IMEI, colour, condition… so the loan shows exactly which units went out.
        details: snapshotStockItemDetails(item, { maxKeys: detailBudget }),
      }
    })

    tx.create(loanRef, {
      storeId: actor.storeId,
      status,
      partyName,
      partyPhone,
      partyNotes,
      lines,
      createdBy: actor.uid,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      // An approver's own loan is approved by creating it; say so rather than leave it blank.
      ...(!pending && {
        approvedBy: actor.uid,
        approvedAt: FieldValue.serverTimestamp(),
        autoApproved: true,
      }),
    })
    for (const snap of snaps) {
      tx.update(snap.ref, {
        sellerLoanOutId: loanRef.id,
        sellerLoanPartyName: partyName,
        sellerLoanPartyPhone: partyPhone,
        sellerLoanOutAt: FieldValue.serverTimestamp(),
        ...(pending && { sellerLoanPending: true }),
        updatedAt: FieldValue.serverTimestamp(),
      })
    }
    if (planHasFeature(actor.plan, 'activity_logs')) {
      logSaleActivity(tx, actor, {
        action: 'created',
        entityType: 'items_batch',
        entityId: loanRef.id,
        entityName: pending
          ? `Requested a stock loan of ${lines.length} item(s) to ${partyName}`
          : `Loaned ${lines.length} item(s) to ${partyName}`,
      })
    }
    return { loanId: loanRef.id, status, itemCount: lines.length }
  })

  if (pending) {
    await notifyStockLoanChange(db, actor, {
      loanId: result.loanId,
      event: 'requested',
      partyName,
      itemCount: result.itemCount,
      createdBy: actor.uid,
    })
  }
  return { loanId: result.loanId, status: result.status }
}

const ACTIVITY_TEXT: Record<StockLoanAction, (party: string, n: number) => string> = {
  approve: (party, n) => `Approved stock loan to ${party} (${n} item(s))`,
  reject: (party, n) => `Rejected stock loan to ${party} (${n} item(s))`,
  cancel: (party, n) => `Cancelled stock loan request to ${party} (${n} item(s))`,
  return: (party, n) => `Returned stock loan from ${party} (${n} item(s))`,
  mark_sold: (party, n) => `Stock loan (${party}): marked ${n} item(s) sold`,
}

/**
 * Moves a loan through its workflow (see utils/stock-loan-policy.ts):
 *  - approve: the reserved items go out to the borrower.
 *  - reject / cancel: the reservation is released and the items are back in stock.
 *  - return: the borrower brought the items back.
 *  - mark_sold: the borrower sold them off the till, so they leave stock with no sale here.
 * The decision is taken on the loan as read inside the transaction, so concurrent approvers
 * cannot both succeed.
 */
export async function runStockLoanAction(
  db: Firestore,
  actor: StoreActor,
  input: Record<string, unknown>,
  actionRaw: unknown
) {
  requireEnterprise(actor)
  if (!isStockLoanAction(actionRaw)) bad('Unknown stock loan action')
  const action: StockLoanAction = actionRaw
  const loanId = assertId(input.loanId, 'loanId')
  const reason = normalizeReason(input.reason)
  const loanRef = actor.store.collection('sellerLoanOuts').doc(loanId)

  const outcome = await db.runTransaction(async (tx) => {
    const loanSnap = await tx.get(loanRef)
    const loan = loanSnap.data()
    if (!loan) throw createError({ statusCode: 404, message: 'Loan not found' })
    const createdBy = String(loan.createdBy || '')
    const decision = decideStockLoanAction(
      { status: normalizeStockLoanStatus(loan.status), createdBy },
      action,
      toStockLoanActor(actor),
      reason
    )
    enforce(decision)

    const lines = (Array.isArray(loan.lines) ? loan.lines : []) as Array<{ inventoryItemId: string }>
    if (action === 'mark_sold' && lines.length === 0) conflict('This loan has no items to mark sold')
    const ids = lines.map((l) => l.inventoryItemId).filter((id) => /^[\w-]{1,128}$/.test(id))
    const snaps = ids.length
      ? await tx.getAll(...ids.map((id) => actor.store.collection('inventoryItems').doc(id)))
      : []

    const now = FieldValue.serverTimestamp()
    const stamp: Record<StockLoanAction, Record<string, unknown>> = {
      approve: { approvedAt: now, approvedBy: actor.uid },
      reject: { rejectedAt: now, rejectedBy: actor.uid, rejectionReason: reason },
      cancel: { cancelledAt: now, closedBy: actor.uid },
      return: { returnedAt: now, closedBy: actor.uid },
      mark_sold: { soldAt: now, closedBy: actor.uid },
    }
    tx.update(loanRef, { status: decision.to, ...stamp[action], updatedAt: now })

    for (const snap of snaps) {
      // Only rows still on this loan: a row sold at the till already left it.
      if (!snap.exists || snap.data()?.sellerLoanOutId !== loanId) continue
      const itemUpdate =
        action === 'approve'
          ? { sellerLoanPending: FieldValue.delete(), sellerLoanOutAt: now }
          : { ...clearLoan, ...(action === 'mark_sold' && { dateOut: now }) }
      tx.update(snap.ref, { ...itemUpdate, updatedAt: now })
    }
    if (planHasFeature(actor.plan, 'activity_logs')) {
      logSaleActivity(tx, actor, {
        action: 'updated',
        entityType: 'items_batch',
        entityId: loanId,
        entityName: ACTIVITY_TEXT[action](String(loan.partyName || 'borrower'), lines.length),
      })
    }
    return {
      status: decision.to,
      partyName: String(loan.partyName || 'the borrower'),
      itemCount: lines.length,
      createdBy,
    }
  })

  if (action === 'approve' || action === 'reject') {
    await notifyStockLoanChange(db, actor, {
      loanId,
      event: action === 'approve' ? 'approved' : 'rejected',
      partyName: outcome.partyName,
      itemCount: outcome.itemCount,
      createdBy: outcome.createdBy,
      reason,
    })
  }
  return { status: outcome.status }
}

/** Closes an active loan; kept for the return and mark-sold routes. */
export async function closeStockLoan(
  db: Firestore,
  actor: StoreActor,
  input: Record<string, unknown>,
  outcome: 'returned' | 'sold'
) {
  await runStockLoanAction(db, actor, input, outcome === 'returned' ? 'return' : 'mark_sold')
}
