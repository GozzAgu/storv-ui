import { describe, expect, it } from 'vitest'
import type { TransferApprovalFields, TransferStatus } from '~/types/transfers'
import {
  availableTransferActions,
  decideTransferAction,
  type TransferActor,
} from '~/utils/transfer-policy'

const transfer = (status: TransferStatus, createdBy = 'sender'): TransferApprovalFields => ({
  status,
  sourceStoreId: 'lagos',
  destinationStoreId: 'ph',
  createdBy,
})

const owner: TransferActor = {
  uid: 'owner',
  isOwner: true,
  isDestinationAdmin: false,
  canManageTransfers: true,
}
const receivingAdmin: TransferActor = {
  uid: 'ph-admin',
  isOwner: false,
  isDestinationAdmin: true,
  canManageTransfers: false,
}
const sendingManager: TransferActor = {
  uid: 'sender',
  isOwner: false,
  isDestinationAdmin: false,
  canManageTransfers: true,
}
const cashier: TransferActor = {
  uid: 'cashier',
  isOwner: false,
  isDestinationAdmin: false,
  canManageTransfers: false,
}

describe('transfer policy', () => {
  it('only lets the receiving branch’s admin (or the owner) put stock into its inventory', () => {
    expect(decideTransferAction(transfer('in_transit'), 'receive', receivingAdmin)).toEqual({
      ok: true,
      to: 'completed',
    })
    expect(decideTransferAction(transfer('in_transit'), 'receive', owner).ok).toBe(true)
    const sender = decideTransferAction(transfer('in_transit'), 'receive', sendingManager)
    expect(sender).toMatchObject({ ok: false, code: 'FORBIDDEN' })
    expect(decideTransferAction(transfer('in_transit'), 'receive', cashier).ok).toBe(false)
  })

  it('stops an admin from approving a transfer they requested themselves', () => {
    const own = transfer('in_transit', 'ph-admin')
    expect(decideTransferAction(own, 'receive', receivingAdmin)).toMatchObject({
      ok: false,
      code: 'SELF_APPROVAL',
    })
    // The owner may still act on anything.
    expect(decideTransferAction(transfer('in_transit', 'owner'), 'receive', owner).ok).toBe(true)
  })

  it('cannot receive stock that has not been dispatched, or twice', () => {
    for (const status of [
      'pending_approval',
      'completed',
      'partial',
      'rejected',
      'cancelled',
    ] as const) {
      expect(decideTransferAction(transfer(status), 'receive', owner)).toMatchObject({
        ok: false,
        code: 'INVALID_TRANSITION',
      })
    }
  })

  it('needs a reason to reject', () => {
    expect(
      decideTransferAction(transfer('in_transit'), 'reject', receivingAdmin, '  ')
    ).toMatchObject({ ok: false, code: 'REASON_REQUIRED' })
    expect(
      decideTransferAction(transfer('in_transit'), 'reject', receivingAdmin, 'Damaged')
    ).toEqual({ ok: true, to: 'rejected' })
  })

  it('lets transfer managers dispatch and track, and the requester cancel', () => {
    expect(decideTransferAction(transfer('pending_approval'), 'dispatch', sendingManager)).toEqual({
      ok: true,
      to: 'in_transit',
    })
    expect(decideTransferAction(transfer('pending_approval'), 'dispatch', cashier).ok).toBe(false)
    expect(decideTransferAction(transfer('in_transit'), 'track', sendingManager)).toEqual({
      ok: true,
      to: null,
    })
    expect(
      decideTransferAction(transfer('pending_approval', 'cashier'), 'cancel', cashier).ok
    ).toBe(true)
  })

  it('offers each person only the actions the server would accept', () => {
    expect(availableTransferActions(transfer('in_transit'), receivingAdmin)).toEqual([
      'receive',
      'reject',
    ])
    expect(availableTransferActions(transfer('in_transit'), sendingManager)).toEqual([
      'cancel',
      'track',
    ])
    expect(availableTransferActions(transfer('completed'), owner)).toEqual([])
  })
})
