import { createError } from 'h3'
import { FieldValue, type Firestore } from 'firebase-admin/firestore'
import type { InventoryFolder, InventoryItem } from '~/stores/inventory'
import { planHasFeature } from '~/types/subscription'
import { getInventoryItemDisplayName } from '~/composables/useInventoryItemDisplay'
import { folderHasSerialNumbers } from '~/utils/receipt-multi-folder'
import { actorCanApproveDiscounts, actorCanUseCategory, assertId, forbid, type StoreActor } from './actor'
import { logSaleActivity } from './records'

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
}

/** Lends items to a seller or reseller. Items must be in stock, unheld and not already lent. */
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

  const loanRef = actor.store.collection('sellerLoanOuts').doc()
  return db.runTransaction(async (tx) => {
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
      return { inventoryItemId: snap.id, folderId: String(item.folderId || ''), itemSummary: name.slice(0, 120) }
    })

    tx.create(loanRef, {
      storeId: actor.storeId,
      status: 'active',
      partyName,
      partyPhone,
      partyNotes,
      lines,
      createdBy: actor.uid,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    })
    for (const snap of snaps) {
      tx.update(snap.ref, {
        sellerLoanOutId: loanRef.id,
        sellerLoanPartyName: partyName,
        sellerLoanPartyPhone: partyPhone,
        sellerLoanOutAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      })
    }
    if (planHasFeature(actor.plan, 'activity_logs')) {
      logSaleActivity(tx, actor, {
        action: 'created',
        entityType: 'items_batch',
        entityId: loanRef.id,
        entityName: `Loaned ${lines.length} item(s) to ${partyName}`,
      })
    }
    return { loanId: loanRef.id }
  })
}

/**
 * Closes an active loan. `returned`: the items come back to stock. `sold`: the borrower sold them
 * off the till, so they leave stock with no sale here; only managers may do that.
 */
export async function closeStockLoan(
  db: Firestore,
  actor: StoreActor,
  input: Record<string, unknown>,
  outcome: 'returned' | 'sold'
) {
  requireEnterprise(actor)
  if (!actor.isOwner && !actor.permissions.sellerLoans.edit) forbid('You can’t update stock loans.')
  if (outcome === 'sold' && !actorCanApproveDiscounts(actor)) {
    forbid('Only the owner or a manager can mark loaned stock as sold.')
  }
  const loanId = assertId(input.loanId, 'loanId')
  const loanRef = actor.store.collection('sellerLoanOuts').doc(loanId)

  await db.runTransaction(async (tx) => {
    const loanSnap = await tx.get(loanRef)
    const loan = loanSnap.data()
    if (!loan) throw createError({ statusCode: 404, message: 'Loan not found' })
    if (loan.status === 'returned') conflict('This loan was already marked as returned')
    if (loan.status === 'sold') conflict('This loan was already marked as sold')
    const lines = (Array.isArray(loan.lines) ? loan.lines : []) as Array<{ inventoryItemId: string }>
    if (outcome === 'sold' && lines.length === 0) conflict('This loan has no items to mark sold')
    const ids = lines.map((l) => l.inventoryItemId).filter((id) => /^[\w-]{1,128}$/.test(id))
    const snaps = ids.length ? await tx.getAll(...ids.map((id) => actor.store.collection('inventoryItems').doc(id))) : []

    tx.update(loanRef, {
      status: outcome,
      ...(outcome === 'returned' ? { returnedAt: FieldValue.serverTimestamp() } : { soldAt: FieldValue.serverTimestamp() }),
      closedBy: actor.uid,
      updatedAt: FieldValue.serverTimestamp(),
    })
    for (const snap of snaps) {
      // Only rows still on this loan: a row sold at the till already left it.
      if (!snap.exists || snap.data()?.sellerLoanOutId !== loanId) continue
      tx.update(snap.ref, {
        ...clearLoan,
        ...(outcome === 'sold' && { dateOut: FieldValue.serverTimestamp() }),
        updatedAt: FieldValue.serverTimestamp(),
      })
    }
    if (planHasFeature(actor.plan, 'activity_logs')) {
      logSaleActivity(tx, actor, {
        action: 'updated',
        entityType: 'items_batch',
        entityId: loanId,
        entityName:
          outcome === 'returned'
            ? `Returned stock loan from ${loan.partyName || 'borrower'} (${lines.length} item(s))`
            : `Stock loan (${loan.partyName || 'borrower'}): marked ${lines.length} item(s) sold`,
      })
    }
  })
}
