import { createError } from 'h3'
import {
  FieldValue,
  type DocumentReference,
  type DocumentSnapshot,
  type Firestore,
  type Transaction,
} from 'firebase-admin/firestore'
import { planHasFeature } from '~/types/subscription'
import {
  TRANSFER_MAX_LINES,
  normalizeTransferStatus,
  type TransferAction,
  type TransferApprovalFields,
  type TransferLine,
  type TransferStatus,
} from '~/types/transfers'
import { normalizeReason } from '~/utils/approval-decision'
import { decideTransferAction, isTransferAction, type TransferActor } from '~/utils/transfer-policy'
import { enforce } from '~/server/utils/approvals/enforce'
import { assertId, resolveStoreActor, type StoreActor } from '~/server/utils/sales/actor'
import { notifyTransferChange } from './notify'

export interface TransferActionInput {
  ownerUserId: unknown
  transferId: unknown
  action: unknown
  reason?: unknown
  carrier?: unknown
  trackingNumber?: unknown
}

export interface TransferActionResult {
  status: TransferStatus
  moved: number
  skipped: string[]
}

interface StoredTransfer extends TransferApprovalFields {
  folderId: string
  destinationFolderId: string
  hasSerialNumbers: boolean
  items: TransferLine[]
  sourceStoreName?: string
  destinationStoreName?: string
}

function conflict(message: string): never {
  throw createError({ statusCode: 409, message })
}

function readTransfer(snap: DocumentSnapshot): StoredTransfer {
  const data = snap.data()
  if (!data) throw createError({ statusCode: 404, message: 'Transfer not found' })
  return {
    status: normalizeTransferStatus(data.status),
    sourceStoreId: String(data.sourceStoreId ?? data.fromStoreId ?? ''),
    destinationStoreId: String(data.destinationStoreId ?? data.toStoreId ?? ''),
    createdBy: String(data.createdBy ?? ''),
    folderId: String(data.folderId ?? ''),
    destinationFolderId: String(data.destinationFolderId ?? ''),
    hasSerialNumbers: data.hasSerialNumbers === true,
    items: Array.isArray(data.items) ? (data.items as TransferLine[]) : [],
    sourceStoreName: typeof data.sourceStoreName === 'string' ? data.sourceStoreName : undefined,
    destinationStoreName:
      typeof data.destinationStoreName === 'string' ? data.destinationStoreName : undefined,
  }
}

/** The caller as seen by one branch, or null when they are not an active member there. */
async function actorIn(
  db: Firestore,
  uid: string,
  ownerId: string,
  storeId: string
): Promise<StoreActor | null> {
  if (!storeId) return null
  try {
    return await resolveStoreActor(db, uid, ownerId, storeId)
  } catch (err) {
    if ((err as { statusCode?: number }).statusCode === 404) return null
    throw err
  }
}

/** Resolves the caller against both branches; someone in neither gets 404, like any foreign id. */
async function resolveTransferActor(
  db: Firestore,
  uid: string,
  ownerId: string,
  transfer: StoredTransfer
): Promise<{ actor: TransferActor; plan: StoreActor['plan'] }> {
  const [source, destination] = await Promise.all([
    actorIn(db, uid, ownerId, transfer.sourceStoreId),
    actorIn(db, uid, ownerId, transfer.destinationStoreId),
  ])
  const any = destination ?? source
  if (!any) throw createError({ statusCode: 404, message: 'Not found' })
  return {
    plan: any.plan,
    actor: {
      uid,
      isOwner: any.isOwner,
      isDestinationAdmin: destination?.isAdmin === true,
      canManageTransfers:
        any.isOwner ||
        source?.permissions.multiStoreSync.edit === true ||
        destination?.permissions.multiStoreSync.edit === true,
    },
  }
}

/** Strips fields that describe the source copy rather than the stock itself. */
function portableItemData(data: Record<string, unknown>): Record<string, unknown> {
  const {
    id: _id,
    createdBy: _createdBy,
    createdAt: _createdAt,
    updatedAt: _updatedAt,
    dateOut: _dateOut,
    isTransferred: _isTransferred,
    transferredTo: _transferredTo,
    transferredFrom: _transferredFrom,
    transferredFromFolder: _transferredFromFolder,
    transferredAt: _transferredAt,
    ...rest
  } = data
  return rest
}

const quantityOf = (data: Record<string, unknown> | undefined): number =>
  Number(data?.quantity ?? data?.Quantity ?? 0) || 0

const lineName = (line: TransferLine, data?: Record<string, unknown>) =>
  String(data?.name || data?.itemName || line.itemName || 'An item').slice(0, 120)

/**
 * Moves the transfer's stock into the receiving branch in one transaction: every line either
 * moves or is reported as skipped, and the transfer's status changes with it. Lines that can no
 * longer move (sold, lent out, short) are skipped and the transfer ends `partial`; if none can
 * move nothing is written and the admin is told to reject it instead.
 */
async function receiveStock(
  tx: Transaction,
  ctx: {
    owner: DocumentReference
    transferRef: DocumentReference
    transfer: StoredTransfer
    actorUid: string
  }
): Promise<TransferActionResult> {
  const { owner, transfer } = ctx
  const lines = transfer.items.filter((l) => /^[\w-]{1,128}$/.test(String(l?.itemId ?? '')))
  if (lines.length === 0) conflict('This transfer has no items to receive.')
  if (lines.length > TRANSFER_MAX_LINES) {
    conflict(`A transfer can carry at most ${TRANSFER_MAX_LINES} items. Split it and try again.`)
  }

  const sourceItems = owner
    .collection('stores')
    .doc(transfer.sourceStoreId)
    .collection('inventoryItems')
  const destStore = owner.collection('stores').doc(transfer.destinationStoreId)
  const destItems = destStore.collection('inventoryItems')

  // Reads first: Firestore transactions refuse reads after writes.
  const destFolder = await tx.get(
    destStore.collection('inventoryFolders').doc(transfer.destinationFolderId || '-')
  )
  if (!destFolder.exists) {
    conflict(
      'The destination category no longer exists. Reject this transfer and request it again.'
    )
  }
  const sourceSnaps = await tx.getAll(...lines.map((l) => sourceItems.doc(l.itemId)))
  const bulkNames = transfer.hasSerialNumbers
    ? []
    : [
        ...new Set(
          sourceSnaps.map((s) => String(s.data()?.name || s.data()?.itemName || '')).filter(Boolean)
        ),
      ]
  const existingByName = new Map<string, DocumentSnapshot>()
  for (const name of bulkNames) {
    const match = await tx.get(
      destItems
        .where('folderId', '==', transfer.destinationFolderId)
        .where('name', '==', name)
        .limit(1)
    )
    if (match.docs[0]) existingByName.set(name, match.docs[0])
  }

  const now = FieldValue.serverTimestamp()
  const provenance = {
    storeId: transfer.destinationStoreId,
    folderId: transfer.destinationFolderId,
    transferredFrom: transfer.sourceStoreId,
    transferredFromFolder: transfer.folderId,
    transferredAt: now,
    updatedAt: now,
  }
  const moved: TransferLine[] = []
  const skipped: string[] = []
  const skip = (message: string): void => {
    skipped.push(message)
  }
  // Bulk lines that land on the same destination row add up instead of overwriting each other.
  const bulkTargets = new Map<
    string,
    { ref: DocumentReference; base: number; add: number; create?: Record<string, unknown> }
  >()

  lines.forEach((line, index) => {
    const snap = sourceSnaps[index]!
    const data = snap.data()
    const name = lineName(line, data)
    if (!data) return skip(`${name} is no longer in the sending branch`)
    if (data.dateOut) return skip(`${name} has been sold`)
    if (String(data.sellerLoanOutId ?? '').trim()) return skip(`${name} is out on a stock loan`)
    if (String(data.pendingSaleReceiptId ?? '').trim()) return skip(`${name} is held on an order`)

    const quantity = Math.max(1, Math.floor(Number(line.quantity) || 1))
    if (transfer.hasSerialNumbers) {
      const ref = destItems.doc()
      tx.create(ref, {
        ...portableItemData(data),
        ...provenance,
        id: ref.id,
        dateIn: data.dateIn ?? data.DateIn ?? null,
        createdBy: ctx.actorUid,
        createdAt: now,
      })
      tx.delete(snap.ref)
      moved.push({ ...line, itemName: name, quantity: 1 })
      return
    }

    const available = quantityOf(data)
    if (available < quantity) return skip(`${name}: only ${available} left to send`)
    if (available - quantity <= 0) tx.delete(snap.ref)
    else
      tx.update(snap.ref, {
        quantity: available - quantity,
        Quantity: available - quantity,
        updatedAt: now,
      })

    const key = String(data.name || data.itemName || snap.id)
    const target = bulkTargets.get(key)
    if (target) target.add += quantity
    else {
      const existing = existingByName.get(String(data.name || data.itemName || ''))
      bulkTargets.set(
        key,
        existing
          ? { ref: existing.ref, base: quantityOf(existing.data()), add: quantity }
          : {
              ref: destItems.doc(),
              base: 0,
              add: quantity,
              create: { ...portableItemData(data), dateIn: data.dateIn ?? data.DateIn ?? null },
            }
      )
    }
    moved.push({ ...line, itemName: name, quantity })
  })

  if (moved.length === 0) {
    conflict(`Nothing in this transfer can be received: ${skipped.join('; ')}. Reject it instead.`)
  }

  for (const t of bulkTargets.values()) {
    const qty = t.base + t.add
    if (t.create) {
      tx.create(t.ref, {
        ...t.create,
        ...provenance,
        id: t.ref.id,
        quantity: qty,
        Quantity: qty,
        createdBy: ctx.actorUid,
        createdAt: now,
      })
    } else {
      tx.update(t.ref, { quantity: qty, Quantity: qty, transferredAt: now, updatedAt: now })
    }
  }

  const status: TransferStatus = skipped.length ? 'partial' : 'completed'
  tx.update(ctx.transferRef, {
    status,
    items: moved,
    itemsCount: moved.length,
    ...(skipped.length && { skippedItems: skipped.slice(0, 50) }),
    receivedAt: now,
    receivedBy: ctx.actorUid,
    // Older screens read these names.
    completedAt: now,
    completedBy: ctx.actorUid,
  })
  return { status, moved: moved.length, skipped }
}

/**
 * Runs one workflow action on a transfer. The decision is made from the transfer as read inside
 * the transaction, so two admins acting at once cannot both succeed.
 */
export async function runTransferAction(
  db: Firestore,
  uid: string,
  input: TransferActionInput
): Promise<TransferActionResult> {
  const ownerId = assertId(input.ownerUserId, 'ownerUserId')
  const transferId = assertId(input.transferId, 'transferId')
  if (!isTransferAction(input.action)) {
    throw createError({ statusCode: 400, message: 'Unknown transfer action' })
  }
  const action: TransferAction = input.action
  const reason = normalizeReason(input.reason)

  const owner = db.collection('users').doc(ownerId)
  const transferRef = owner.collection('storeTransfers').doc(transferId)
  const before = readTransfer(await transferRef.get())
  const { actor, plan } = await resolveTransferActor(db, uid, ownerId, before)
  if (!planHasFeature(plan, 'multi_store_sync')) {
    throw createError({ statusCode: 403, message: 'Transfers need the Enterprise plan.' })
  }

  const result = await db.runTransaction(async (tx) => {
    const transfer = readTransfer(await tx.get(transferRef))
    if (
      transfer.sourceStoreId !== before.sourceStoreId ||
      transfer.destinationStoreId !== before.destinationStoreId
    ) {
      conflict('This transfer changed while you were looking at it. Refresh and try again.')
    }
    const decision = decideTransferAction(transfer, action, actor, reason)
    enforce(decision)

    const now = FieldValue.serverTimestamp()
    switch (action) {
      case 'receive':
        return receiveStock(tx, { owner, transferRef, transfer, actorUid: uid })
      case 'dispatch':
        tx.update(transferRef, {
          status: decision.to,
          // `approved*` kept for screens and reports that predate the receiving step.
          dispatchedAt: now,
          dispatchedBy: uid,
          approvedAt: now,
          approvedBy: uid,
        })
        break
      case 'reject':
        tx.update(transferRef, {
          status: decision.to,
          rejectedAt: now,
          rejectedBy: uid,
          rejectionReason: reason,
        })
        break
      case 'cancel':
        tx.update(transferRef, { status: decision.to, cancelledAt: now, cancelledBy: uid })
        break
      case 'track':
        tx.update(transferRef, {
          carrier:
            String(input.carrier ?? '')
              .trim()
              .slice(0, 80) || null,
          trackingNumber:
            String(input.trackingNumber ?? '')
              .trim()
              .slice(0, 80) || null,
        })
        return { status: transfer.status, moved: 0, skipped: [] }
    }
    return { status: decision.to ?? transfer.status, moved: 0, skipped: [] }
  })

  await notifyTransferChange(db, {
    ownerId,
    transferId,
    actorUid: uid,
    action,
    transfer: before,
    reason,
    result,
  })
  return result
}
