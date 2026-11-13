import { describe, expect, it } from 'vitest'
import type { StockLoanStatus } from '~/types/stock-loans'
import {
  availableStockLoanActions,
  canApproveStockLoans,
  decideStockLoanAction,
  initialStockLoanStatus,
  type StockLoanActor,
} from '~/utils/stock-loan-policy'

const loan = (status: StockLoanStatus, createdBy = 'cashier') => ({ status, createdBy })

const approver: StockLoanActor = {
  uid: 'admin',
  isOwner: false,
  canApprove: true,
  canEdit: true,
  canMarkSold: true,
}
const cashier: StockLoanActor = {
  uid: 'cashier',
  isOwner: false,
  canApprove: false,
  canEdit: true,
  canMarkSold: false,
}
const owner: StockLoanActor = { ...approver, uid: 'owner', isOwner: true }

describe('stock loan policy', () => {
  it('holds loans from staff who cannot approve, and lets approvers lend straight away', () => {
    expect(initialStockLoanStatus(cashier)).toBe('pending_approval')
    expect(initialStockLoanStatus(approver)).toBe('active')
    expect(initialStockLoanStatus(owner)).toBe('active')
  })

  it('treats only the owner and admins with the extra as approvers', () => {
    const grants = (on: boolean) => ({ stockLoanApprovals: on })
    expect(
      canApproveStockLoans({ isOwner: true, isAdmin: false, adminGrants: grants(false) })
    ).toBe(true)
    expect(canApproveStockLoans({ isOwner: false, isAdmin: true, adminGrants: grants(true) })).toBe(
      true
    )
    expect(
      canApproveStockLoans({ isOwner: false, isAdmin: true, adminGrants: grants(false) })
    ).toBe(false)
    // A grant left behind on a demoted admin counts for nothing.
    expect(
      canApproveStockLoans({ isOwner: false, isAdmin: false, adminGrants: grants(true) })
    ).toBe(false)
  })

  it('releases a pending loan only on an approver’s say-so', () => {
    expect(decideStockLoanAction(loan('pending_approval'), 'approve', approver)).toEqual({
      ok: true,
      to: 'active',
    })
    expect(decideStockLoanAction(loan('pending_approval'), 'approve', cashier)).toMatchObject({
      ok: false,
      code: 'FORBIDDEN',
    })
  })

  it('stops an approver from approving their own request', () => {
    expect(
      decideStockLoanAction(loan('pending_approval', 'admin'), 'approve', approver)
    ).toMatchObject({ ok: false, code: 'SELF_APPROVAL' })
  })

  it('needs a reason to reject, and keeps pending loans out of return and mark-sold', () => {
    expect(decideStockLoanAction(loan('pending_approval'), 'reject', approver)).toMatchObject({
      ok: false,
      code: 'REASON_REQUIRED',
    })
    expect(decideStockLoanAction(loan('pending_approval'), 'reject', approver, 'Owes us')).toEqual({
      ok: true,
      to: 'rejected',
    })
    expect(decideStockLoanAction(loan('pending_approval'), 'return', owner).ok).toBe(false)
    expect(decideStockLoanAction(loan('pending_approval'), 'mark_sold', owner).ok).toBe(false)
  })

  it('keeps the existing rules for active loans', () => {
    expect(decideStockLoanAction(loan('active'), 'return', cashier).ok).toBe(true)
    expect(decideStockLoanAction(loan('active'), 'mark_sold', cashier)).toMatchObject({
      ok: false,
      code: 'FORBIDDEN',
    })
    expect(decideStockLoanAction(loan('returned'), 'return', owner)).toMatchObject({
      ok: false,
      code: 'INVALID_TRANSITION',
    })
  })

  it('offers each person only what the server would accept', () => {
    expect(availableStockLoanActions(loan('pending_approval'), approver)).toEqual([
      'approve',
      'reject',
      'cancel',
    ])
    expect(availableStockLoanActions(loan('pending_approval'), cashier)).toEqual(['cancel'])
    expect(availableStockLoanActions(loan('pending_approval', 'someone-else'), cashier)).toEqual([])
  })
})
