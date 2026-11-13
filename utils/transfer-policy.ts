import { deny, hasReason, type Decision } from '~/utils/approval-decision'
import {
  TRANSFER_ACTIONS,
  type TransferAction,
  type TransferApprovalFields,
  type TransferStatus,
} from '~/types/transfers'

/**
 * Who is acting on a transfer, from the two branches' point of view. Built by the server from
 * member docs and by the UI from the signed-in staff record; the policy below never reads
 * Firestore, so both sides get the same answer.
 */
export interface TransferActor {
  uid: string
  isOwner: boolean
  /** Active admin of the transfer's receiving branch. */
  isDestinationAdmin: boolean
  /** May run transfers (multiStoreSync.edit; for admins, with the stock-transfers extra). */
  canManageTransfers: boolean
}

interface Rule {
  from: readonly TransferStatus[]
  /** Where the transfer ends up; `receive` may land on `partial` instead (see the service). */
  to: TransferStatus | null
  check: (t: TransferApprovalFields, a: TransferActor, reason?: string | null) => Decision<object>
}

const ok = { ok: true } as const

const manager: Rule['check'] = (_t, a) =>
  a.isOwner || a.canManageTransfers
    ? ok
    : deny('FORBIDDEN', 'You don’t have permission to change transfers.')

/** Only the receiving branch says what enters its stock. The owner can act for any branch. */
const receivingAdmin =
  (needsReason: boolean): Rule['check'] =>
  (t, a, reason) => {
    if (!a.isOwner && !a.isDestinationAdmin) {
      return deny('FORBIDDEN', 'Only an admin of the receiving branch can approve this transfer.')
    }
    if (!a.isOwner && a.uid === t.createdBy) {
      return deny('SELF_APPROVAL', 'Someone other than the requester must approve this transfer.')
    }
    if (needsReason && !hasReason(reason)) {
      return deny('REASON_REQUIRED', 'Add a reason so the sending branch knows what went wrong.')
    }
    return ok
  }

const RULES: Record<TransferAction, Rule> = {
  dispatch: { from: ['pending_approval'], to: 'in_transit', check: manager },
  receive: { from: ['in_transit'], to: 'completed', check: receivingAdmin(false) },
  reject: { from: ['in_transit'], to: 'rejected', check: receivingAdmin(true) },
  cancel: {
    from: ['pending_approval', 'in_transit'],
    to: 'cancelled',
    check: (t, a) =>
      a.isOwner || a.canManageTransfers || a.uid === t.createdBy
        ? ok
        : deny('FORBIDDEN', 'You don’t have permission to cancel this transfer.'),
  },
  track: { from: ['in_transit'], to: null, check: manager },
}

export type TransferDecision = Decision<{ to: TransferStatus | null }>

export function decideTransferAction(
  transfer: TransferApprovalFields,
  action: TransferAction,
  actor: TransferActor,
  reason?: string | null
): TransferDecision {
  const rule = RULES[action]
  if (!rule) return deny('INVALID_TRANSITION', 'Unknown transfer action.')
  if (!rule.from.includes(transfer.status)) {
    return deny('INVALID_TRANSITION', `This transfer can’t be changed that way any more.`)
  }
  const verdict = rule.check(transfer, actor, reason)
  return verdict.ok ? { ok: true, to: rule.to } : verdict
}

/** Actions to offer in the UI. `reject` is offered without a reason; the dialog asks for one. */
export function availableTransferActions(
  transfer: TransferApprovalFields,
  actor: TransferActor
): TransferAction[] {
  return TRANSFER_ACTIONS.filter(
    (action) => decideTransferAction(transfer, action, actor, 'offered').ok
  )
}

export function isTransferAction(value: unknown): value is TransferAction {
  return typeof value === 'string' && (TRANSFER_ACTIONS as readonly string[]).includes(value)
}
