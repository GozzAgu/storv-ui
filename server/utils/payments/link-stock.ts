import {
  FieldValue,
  type DocumentReference,
  type DocumentSnapshot,
  type Transaction,
} from 'firebase-admin/firestore'
import type { InventoryFolder } from '~/stores/inventory'
import { resolveBulkStockFieldAndValueFromMap } from '~/utils/inventory-bulk-quantity'
import { folderHasSerialNumbers } from '~/utils/receipt-multi-folder'

export type StockIssueReason =
  | 'already_sold'
  | 'held_by_other'
  | 'insufficient_stock'
  | 'missing_item'
  | 'on_loan'

export interface StockIssue {
  itemId: string
  reason: StockIssueReason
}

/** Stock that is gone (sold elsewhere) rather than needing a manual check. */
const SOLD_REASONS: ReadonlySet<StockIssueReason> = new Set([
  'already_sold',
  'held_by_other',
  'insufficient_stock',
])

export const isOversold = (issues: readonly StockIssue[]) =>
  issues.some((i) => SOLD_REASONS.has(i.reason))

export interface StockPlan {
  issues: StockIssue[]
  /** Writes for the lines that can be committed; call after every read in the transaction. */
  apply: (tx: Transaction) => void
}

const MAX_LINES = 200
const ID_PATTERN = /^[A-Za-z0-9_-]{1,128}$/

interface Line {
  itemId: string
  folderId: string
  quantity: number
}

/** Same folder fallback as the in-store finalize (stores/receipts.ts). */
function saleLines(receipt: Record<string, unknown>): Line[] {
  const folderIds = Array.isArray(receipt.folderIds) ? receipt.folderIds.filter(Boolean) : []
  const fallbackFolder =
    typeof receipt.folderId === 'string' && receipt.folderId
      ? receipt.folderId
      : folderIds.length === 1 && typeof folderIds[0] === 'string'
      ? folderIds[0]
      : ''
  const items = Array.isArray(receipt.items) ? receipt.items.slice(0, MAX_LINES) : []
  const lines: Line[] = []
  for (const raw of items) {
    const line = raw as Record<string, unknown>
    const itemId = typeof line.itemId === 'string' ? line.itemId : ''
    const folderId =
      typeof line.folderId === 'string' && line.folderId ? line.folderId : fallbackFolder
    if (!ID_PATTERN.test(itemId)) continue
    lines.push({
      itemId,
      folderId: ID_PATTERN.test(folderId) ? folderId : '',
      quantity: Math.max(1, Math.floor(Number(line.quantity) || 1)),
    })
  }
  return lines
}

/**
 * Reads what a held sale needs and plans committing it: serial rows get `dateOut`, bulk rows
 * lose the sold quantity, and this sale's hold is cleared. Rows already sold, held by another
 * sale, short of stock, missing or out on a stock loan are not touched and come back as issues
 * (the payment is still confirmed; the owner is alerted). Never drives stock below zero. A
 * partner-loan sale (`tradeLoanId`) may sell rows on that loan and clears their loan fields.
 */
export async function planStockCommit(
  tx: Transaction,
  store: DocumentReference,
  receiptId: string,
  receipt: Record<string, unknown>,
  opts: { write: boolean }
): Promise<StockPlan> {
  const lines = saleLines(receipt)
  if (!lines.length) return { issues: [], apply: () => undefined }

  const folderIds = [...new Set(lines.map((l) => l.folderId).filter(Boolean))]
  const itemIds = [...new Set(lines.map((l) => l.itemId))]
  const [folderSnaps, itemSnaps] = await Promise.all([
    folderIds.length
      ? tx.getAll(...folderIds.map((id) => store.collection('inventoryFolders').doc(id)))
      : Promise.resolve([] as DocumentSnapshot[]),
    tx.getAll(...itemIds.map((id) => store.collection('inventoryItems').doc(id))),
  ])
  const folders = new Map(folderSnaps.map((s) => [s.id, s.data() as InventoryFolder | undefined]))
  const items = new Map(itemSnaps.map((s) => [s.id, s]))

  const needed = new Map<string, { quantity: number; serial: boolean; folder?: InventoryFolder }>()
  /** Lines with no folder: the in-store finalize changes no stock for them either. */
  const holdOnly = new Set<string>()
  for (const line of lines) {
    if (!line.folderId) {
      holdOnly.add(line.itemId)
      continue
    }
    const folder = folders.get(line.folderId)
    const serial = folderHasSerialNumbers(folder)
    const prev = needed.get(line.itemId)
    needed.set(line.itemId, {
      quantity: (prev?.quantity ?? 0) + (serial ? 1 : line.quantity),
      serial: prev?.serial || serial,
      folder: prev?.folder ?? folder,
    })
  }

  const issues: StockIssue[] = []
  const writes: { ref: DocumentReference; data: Record<string, unknown> }[] = []
  const clearHold = {
    pendingSaleReceiptId: FieldValue.delete(),
    pendingSaleAt: FieldValue.delete(),
    updatedAt: FieldValue.serverTimestamp(),
  }
  // A partner-loan sale (server-written) sells the very items on that loan, ending it for them.
  const partnerLoan =
    typeof receipt.tradeLoanId === 'string' && receipt.tradeLoanId
      ? `trade~${receipt.tradeLoanId}`
      : null
  const clearLoan = {
    sellerLoanOutId: FieldValue.delete(),
    sellerLoanPartyName: FieldValue.delete(),
    sellerLoanPartyPhone: FieldValue.delete(),
    sellerLoanOutAt: FieldValue.delete(),
  }

  for (const [itemId, need] of needed) {
    const snap = items.get(itemId)
    if (!snap?.exists) {
      issues.push({ itemId, reason: 'missing_item' })
      continue
    }
    const data = snap.data() ?? {}
    const pending = String(data.pendingSaleReceiptId || '')
    const ours = pending === receiptId
    if (pending && !ours) {
      issues.push({ itemId, reason: 'held_by_other' })
      continue
    }
    const loan = data.sellerLoanOutId
    const onLoan = loan !== undefined && loan !== null && `${loan}`.trim() !== ''
    const onThisLoan = onLoan && partnerLoan !== null && loan === partnerLoan
    if (onLoan && !onThisLoan) {
      issues.push({ itemId, reason: 'on_loan' })
      if (ours) writes.push({ ref: snap.ref, data: clearHold })
      continue
    }
    const sold = onThisLoan ? { ...clearHold, ...clearLoan } : clearHold
    if (need.serial) {
      if (data.dateOut) {
        issues.push({ itemId, reason: 'already_sold' })
        if (ours) writes.push({ ref: snap.ref, data: clearHold })
        continue
      }
      writes.push({ ref: snap.ref, data: { ...sold, dateOut: FieldValue.serverTimestamp() } })
      continue
    }
    const stock = resolveBulkStockFieldAndValueFromMap(data, need.folder?.template?.fields)
    if (!stock || stock.value < need.quantity) {
      issues.push({ itemId, reason: 'insufficient_stock' })
      if (ours) writes.push({ ref: snap.ref, data: clearHold })
      continue
    }
    writes.push({
      ref: snap.ref,
      data: {
        ...sold,
        [stock.fieldKey]: stock.value - need.quantity,
        dateOut: FieldValue.delete(),
      },
    })
  }

  for (const itemId of holdOnly) {
    if (needed.has(itemId)) continue
    const snap = items.get(itemId)
    if (snap?.exists && String(snap.data()?.pendingSaleReceiptId || '') === receiptId) {
      writes.push({ ref: snap.ref, data: clearHold })
    }
  }

  return {
    issues,
    apply: (tx) => {
      if (!opts.write) return
      for (const w of writes) tx.update(w.ref, w.data)
    },
  }
}
