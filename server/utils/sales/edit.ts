import { createError } from 'h3'
import { FieldValue, type Firestore } from 'firebase-admin/firestore'
import { normalizeEntityName } from '~/utils/capitalize-text'
import {
  RECEIPT_EDITABLE_FIELDS,
  RECEIPT_EDIT_LIMITS,
  type ReceiptEditableField,
  type ReceiptEditChange,
} from '~/utils/receipt-edit'
import { assertId, forbid, type StoreActor } from './actor'
import { logSaleActivity, notifyStore } from './records'

/**
 * Editing a recorded sale. Only details that don't move money or stock can change here: who the
 * customer is and the notes. Prices, items and payments stay as recorded (refund and sell again
 * to change those). Every edit is kept: the receipt is marked edited and an entry with the old
 * and new values, who made it and why goes into `receipts/{id}/edits`, which nobody can write
 * from the app.
 */

function bad(message: string, code = 'INVALID_INPUT'): never {
  throw createError({ statusCode: 400, message, data: { code } })
}

export function canEditSales(actor: StoreActor): boolean {
  return actor.isOwner || actor.permissions.receipts.edit === true
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Trims and checks one field the way it is stored on a new sale. */
export function cleanEditValue(field: ReceiptEditableField, raw: unknown): string {
  if (raw !== undefined && raw !== null && typeof raw !== 'string') bad(`${field} is invalid`)
  const value = String(raw ?? '').trim()
  if (value.length > RECEIPT_EDIT_LIMITS[field]) bad(`${field} is too long`)
  if (field === 'customerName') return normalizeEntityName(value) || value
  if (field === 'customerEmail') {
    const email = value.toLowerCase()
    if (email && !EMAIL_PATTERN.test(email)) bad('Enter a valid email address')
    return email
  }
  return value
}

export function cleanEditReason(raw: unknown): string {
  const reason = typeof raw === 'string' ? raw.trim() : ''
  if (reason.length < 3) bad('Say why this sale is being edited', 'REASON_REQUIRED')
  if (reason.length > RECEIPT_EDIT_LIMITS.reason) bad('The reason is too long')
  return reason
}

/**
 * What would change, compared with the receipt as stored. Fields the client didn't send are left
 * alone; unknown fields are ignored. A sale must keep a customer name.
 */
export function planReceiptEdit(
  receipt: Record<string, unknown>,
  changesRaw: unknown
): { patch: Partial<Record<ReceiptEditableField, string>>; changes: ReceiptEditChange[] } {
  if (!changesRaw || typeof changesRaw !== 'object' || Array.isArray(changesRaw)) {
    bad('Nothing to change', 'NO_CHANGES')
  }
  const input = changesRaw as Record<string, unknown>
  const patch: Partial<Record<ReceiptEditableField, string>> = {}
  const changes: ReceiptEditChange[] = []
  for (const field of RECEIPT_EDITABLE_FIELDS) {
    if (!(field in input)) continue
    const next = cleanEditValue(field, input[field])
    const prev = typeof receipt[field] === 'string' ? (receipt[field] as string) : ''
    if (next === prev.trim()) continue
    patch[field] = next
    changes.push({ field, from: prev, to: next })
  }
  if (patch.customerName !== undefined && !patch.customerName) {
    bad('A sale needs a customer name')
  }
  if (changes.length === 0) bad('Nothing has changed', 'NO_CHANGES')
  return { patch, changes }
}

export async function editSale(
  db: Firestore,
  actor: StoreActor,
  input: { receiptId: unknown; changes: unknown; reason: unknown }
): Promise<{ editCount: number; changes: ReceiptEditChange[] }> {
  if (!canEditSales(actor)) forbid('You don’t have permission to edit sales.')
  const receiptId = assertId(input.receiptId, 'receiptId')
  const reason = cleanEditReason(input.reason)
  const ref = actor.store.collection('receipts').doc(receiptId)

  const result = await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref)
    if (!snap.exists) throw createError({ statusCode: 404, message: 'Receipt not found' })
    const receipt = snap.data() ?? {}
    const { patch, changes } = planReceiptEdit(receipt, input.changes)
    const editCount = (Number(receipt.editCount) || 0) + 1
    const now = FieldValue.serverTimestamp()

    tx.update(ref, {
      ...patch,
      edited: true,
      editCount,
      lastEditedAt: now,
      lastEditedBy: actor.uid,
      lastEditedByName: actor.displayName,
      lastEditReason: reason,
      updatedAt: now,
    })
    tx.create(ref.collection('edits').doc(), {
      receiptId,
      storeId: actor.storeId,
      changes,
      reason,
      editedBy: actor.uid,
      editedByName: actor.displayName,
      editNumber: editCount,
      editedAt: now,
    })
    logSaleActivity(tx, actor, {
      action: 'updated',
      entityType: 'receipt',
      entityId: receiptId,
      entityName: `Edited sale #${receipt.receiptNumber ?? receiptId}: ${reason}`,
    })
    return { editCount, changes, receiptNumber: String(receipt.receiptNumber ?? receiptId) }
  })

  if (!actor.isOwner) {
    await notifyStore(actor.store, {
      ownerId: actor.ownerId,
      actorUid: actor.uid,
      type: 'receipt_edited',
      title: 'Sale edited',
      message: `${actor.displayName} edited sale #${result.receiptNumber}: ${reason}`,
      metadata: { receiptId },
    })
  }
  return { editCount: result.editCount, changes: result.changes }
}
