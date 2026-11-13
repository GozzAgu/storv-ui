/**
 * Stock transfers between branches: `users/{ownerId}/storeTransfers/{transferId}`.
 *
 *   pending_approval ──dispatch──▶ in_transit ──receive──▶ completed | partial
 *          │                          │  └────reject───▶ rejected
 *          └──────cancel──────────────┴─────cancel────▶ cancelled
 *
 * Stock only moves on `receive`, which an admin of the receiving branch (or the owner) must do,
 * so nothing lands in a branch's inventory without that branch confirming it. Every move after
 * creation runs on the server; see utils/transfer-policy.ts for who may do what.
 */

export type TransferStatus =
  | 'pending_approval'
  | 'in_transit'
  | 'completed'
  | 'partial'
  | 'rejected'
  | 'cancelled'

export type TransferAction = 'dispatch' | 'receive' | 'reject' | 'cancel' | 'track'

export const TRANSFER_ACTIONS: readonly TransferAction[] = [
  'dispatch',
  'receive',
  'reject',
  'cancel',
  'track',
]

/** Statuses whose items are still spoken for and cannot join another transfer. */
export const OPEN_TRANSFER_STATUSES: ReadonlySet<TransferStatus> = new Set([
  'pending_approval',
  'in_transit',
])

export interface TransferLine {
  itemId: string
  quantity: number
  itemName: string
  serialNumber?: string | null
  details?: Record<string, string>
}

/** The fields the approval workflow reads. Firestore docs carry more (names, tracking, notes). */
export interface TransferApprovalFields {
  status: TransferStatus
  sourceStoreId: string
  destinationStoreId: string
  createdBy: string
}

/** Most lines one transfer may carry: each line is two writes when it is received. */
export const TRANSFER_MAX_LINES = 200

export function normalizeTransferStatus(raw: unknown): TransferStatus {
  switch (raw) {
    case 'in_transit':
    case 'completed':
    case 'partial':
    case 'rejected':
    case 'cancelled':
      return raw
    case 'completed_partial':
      return 'partial'
    default:
      return 'pending_approval'
  }
}

export const TRANSFER_STATUS_LABELS: Record<TransferStatus, string> = {
  pending_approval: 'Awaiting dispatch',
  in_transit: 'Awaiting receipt',
  completed: 'Received',
  partial: 'Partly received',
  rejected: 'Rejected',
  cancelled: 'Cancelled',
}

export const TRANSFER_STATUS_TONES: Record<
  TransferStatus,
  'warning' | 'info' | 'success' | 'error' | 'neutral'
> = {
  pending_approval: 'warning',
  in_transit: 'info',
  completed: 'success',
  partial: 'success',
  rejected: 'error',
  cancelled: 'neutral',
}
