import { branchApproverUids, notifyUsers } from '~/server/utils/approvals/notify'
import type { Firestore } from 'firebase-admin/firestore'
import type { StoreActor } from './actor'

/**
 * Requested → the branch's loan approvers hear about it. Approved / rejected → the requester does.
 * Written after the loan change commits; failures never undo it.
 */
export async function notifyStockLoanChange(
  db: Firestore,
  actor: StoreActor,
  input: {
    loanId: string
    event: 'requested' | 'approved' | 'rejected'
    partyName: string
    itemCount: number
    createdBy: string
    reason?: string
  }
): Promise<void> {
  const items = `${input.itemCount} item${input.itemCount === 1 ? '' : 's'}`
  const base = {
    ownerId: actor.ownerId,
    storeId: actor.storeId,
    actorUid: actor.uid,
    metadata: { loanId: input.loanId },
  }
  if (input.event === 'requested') {
    await notifyUsers(db, {
      ...base,
      recipientUids: await branchApproverUids(
        db,
        actor.ownerId,
        actor.storeId,
        'stockLoanApprovals'
      ),
      type: 'stock_loan_awaiting_approval',
      title: 'Stock loan to approve',
      message: `${actor.displayName} wants to lend ${items} to ${input.partyName}. The goods stay in stock until you approve.`,
    })
    return
  }
  const approved = input.event === 'approved'
  await notifyUsers(db, {
    ...base,
    recipientUids: [input.createdBy],
    type: approved ? 'stock_loan_approved' : 'stock_loan_rejected',
    title: approved ? 'Stock loan approved' : 'Stock loan rejected',
    message: approved
      ? `${actor.displayName} approved your loan of ${items} to ${input.partyName}. You can hand the goods over.`
      : `${actor.displayName} rejected your loan of ${items} to ${input.partyName}: ${input.reason}. The items are back in stock.`,
  })
}
