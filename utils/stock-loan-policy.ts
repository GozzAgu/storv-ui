import { deny, hasReason, type Decision } from '~/utils/approval-decision'
import { STOCK_LOAN_ACTIONS, type StockLoanAction, type StockLoanStatus } from '~/types/stock-loans'

/** Who is acting on a stock loan. Built from the store actor on the server and in the UI. */
export interface StockLoanActor {
  uid: string
  isOwner: boolean
  /** Owner, or a branch admin given the "approve stock loans" extra. */
  canApprove: boolean
  /** sellerLoans.edit: return loans to stock. */
  canEdit: boolean
  /** Owner or manager (receipts.edit): stock leaves without a sale here. */
  canMarkSold: boolean
}

export interface StockLoanApprovalFields {
  status: StockLoanStatus
  createdBy: string
}

export function canApproveStockLoans(actor: {
  isOwner: boolean
  isAdmin: boolean
  adminGrants: { stockLoanApprovals: boolean }
}): boolean {
  return actor.isOwner || (actor.isAdmin && actor.adminGrants.stockLoanApprovals)
}

/** A new loan waits for approval unless its creator could approve it anyway. */
export function initialStockLoanStatus(actor: StockLoanActor): StockLoanStatus {
  return actor.canApprove ? 'active' : 'pending_approval'
}

interface Rule {
  from: readonly StockLoanStatus[]
  to: StockLoanStatus
  check: (l: StockLoanApprovalFields, a: StockLoanActor, reason?: string | null) => Decision<object>
}

const ok = { ok: true } as const

const approver =
  (needsReason: boolean): Rule['check'] =>
  (l, a, reason) => {
    if (!a.canApprove) {
      return deny(
        'FORBIDDEN',
        'Only the owner or an admin allowed to approve stock loans can do this.'
      )
    }
    if (!a.isOwner && a.uid === l.createdBy) {
      return deny(
        'SELF_APPROVAL',
        'Someone other than the person who created this loan must approve it.'
      )
    }
    if (needsReason && !hasReason(reason)) {
      return deny('REASON_REQUIRED', 'Add a reason so the requester knows why.')
    }
    return ok
  }

const RULES: Record<StockLoanAction, Rule> = {
  approve: { from: ['pending_approval'], to: 'active', check: approver(false) },
  reject: { from: ['pending_approval'], to: 'rejected', check: approver(true) },
  cancel: {
    from: ['pending_approval'],
    to: 'cancelled',
    check: (l, a) =>
      a.canApprove || a.uid === l.createdBy
        ? ok
        : deny('FORBIDDEN', 'Only the person who created this loan or an approver can cancel it.'),
  },
  return: {
    from: ['active'],
    to: 'returned',
    check: (_l, a) =>
      a.isOwner || a.canEdit ? ok : deny('FORBIDDEN', 'You can’t update stock loans.'),
  },
  mark_sold: {
    from: ['active'],
    to: 'sold',
    check: (_l, a) =>
      a.canMarkSold
        ? ok
        : deny('FORBIDDEN', 'Only the owner or a manager can mark loaned stock as sold.'),
  },
}

export type StockLoanDecision = Decision<{ to: StockLoanStatus }>

export function decideStockLoanAction(
  loan: StockLoanApprovalFields,
  action: StockLoanAction,
  actor: StockLoanActor,
  reason?: string | null
): StockLoanDecision {
  const rule = RULES[action]
  if (!rule) return deny('INVALID_TRANSITION', 'Unknown stock loan action.')
  if (!rule.from.includes(loan.status)) {
    return deny('INVALID_TRANSITION', 'This loan can’t be changed that way any more.')
  }
  const verdict = rule.check(loan, actor, reason)
  return verdict.ok ? { ok: true, to: rule.to } : verdict
}

export function availableStockLoanActions(
  loan: StockLoanApprovalFields,
  actor: StockLoanActor
): StockLoanAction[] {
  return STOCK_LOAN_ACTIONS.filter(
    (action) => decideStockLoanAction(loan, action, actor, 'offered').ok
  )
}

export function isStockLoanAction(value: unknown): value is StockLoanAction {
  return typeof value === 'string' && (STOCK_LOAN_ACTIONS as readonly string[]).includes(value)
}
