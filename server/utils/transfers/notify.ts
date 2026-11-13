import type { Firestore } from 'firebase-admin/firestore'
import type { TransferAction, TransferApprovalFields, TransferStatus } from '~/types/transfers'
import { branchApproverUids, notifyUsers } from '~/server/utils/approvals/notify'

const transferRef = (id: string) => `TR-${id.slice(0, 6).toUpperCase()}`

/**
 * Tells the other side what happened. Dispatch asks the receiving branch's approvers to check the
 * stock in; receive and reject tell the requester in the sending branch.
 */
export async function notifyTransferChange(
  db: Firestore,
  input: {
    ownerId: string
    transferId: string
    actorUid: string
    actorName: string
    action: TransferAction
    transfer: TransferApprovalFields & { sourceStoreName?: string; destinationStoreName?: string }
    reason: string
    result: { status: TransferStatus; moved: number; skipped: string[] }
  }
): Promise<void> {
  const { transfer, action } = input
  const ref = transferRef(input.transferId)
  const from = transfer.sourceStoreName || 'another branch'
  const to = transfer.destinationStoreName || 'the other branch'
  const metadata = { transferId: input.transferId }
  const base = { ownerId: input.ownerId, actorUid: input.actorUid, metadata }

  if (action === 'dispatch') {
    await notifyUsers(db, {
      ...base,
      storeId: transfer.destinationStoreId,
      recipientUids: await branchApproverUids(db, input.ownerId, transfer.destinationStoreId),
      type: 'transfer_awaiting_receipt',
      title: 'Stock on its way',
      message: `${ref} from ${from} is waiting for you to check it in. It won’t enter your inventory until you approve it.`,
    })
    return
  }

  if (action === 'receive' || action === 'reject') {
    const received = action === 'receive'
    await notifyUsers(db, {
      ...base,
      storeId: transfer.sourceStoreId,
      recipientUids: [transfer.createdBy, input.ownerId],
      type: received ? 'transfer_received' : 'transfer_rejected',
      title: received ? 'Transfer received' : 'Transfer rejected',
      message: received
        ? input.result.skipped.length
          ? `${input.actorName} at ${to} approved ${input.result.moved} item(s) from ${ref}; ${input.result.skipped.length} could not move.`
          : `${input.actorName} at ${to} approved ${ref} into its inventory.`
        : `${input.actorName} at ${to} rejected ${ref}: ${input.reason}. The stock stays with you.`,
    })
  }
}
