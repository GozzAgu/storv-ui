import type { PaymentsCurrency } from '~/utils/money-kobo'

/** Payments V2 record states. Only server code moves a payment between them. */
export type PaymentStatus =
  | 'pending'
  | 'awaiting_confirmation'
  | 'confirmed'
  | 'failed'
  | 'expired'
  | 'rejected'
  | 'partially_refunded'
  | 'refunded'

export const PAYMENT_STATUSES: readonly PaymentStatus[] = [
  'pending',
  'awaiting_confirmation',
  'confirmed',
  'failed',
  'expired',
  'rejected',
  'partially_refunded',
  'refunded',
]

export type PaymentKind = 'paystack_link' | 'manual_transfer' | 'pos' | 'cash'

export type PaymentFlag =
  | 'overpaid'
  | 'paid_after_expiry'
  | 'paid_after_revoke'
  | 'duplicate_payment'
  | 'oversold'

export type PaymentEventType =
  | 'created'
  | 'claimed'
  | 'paid'
  | 'confirmed'
  | 'rejected'
  | 'failed'
  | 'expired'
  | 'revoked'
  | 'refunded'

export interface PaymentStatusChange {
  from: PaymentStatus | null
  to: PaymentStatus
  at: string
  by: string
  reason: string | null
}

export interface PaymentRecord {
  id: string
  ownerId: string
  storeId: string
  receiptId: string
  kind: PaymentKind
  methodLabel: string
  amountKobo: number
  currency: PaymentsCurrency
  status: PaymentStatus
  refundedKobo: number
  flags: PaymentFlag[]
  recordedBy: string
  recordedByName: string
  /** Set when the owner recorded it and it auto-confirmed ("Recorded by owner"). */
  autoConfirmedReason: 'recorded_by_owner' | null
  confirmedBy: string | null
  confirmedAt: string | null
  rejectedBy: string | null
  rejectedAt: string | null
  rejectionReason: string | null
  linkId: string | null
  reference: string | null
  statusHistory: PaymentStatusChange[]
  createdAt: string
  updatedAt: string
  version: number
  /** Storage path under paymentProofs/, set by the server once the recorder's upload checks out. */
  proofPath?: string | null
  proofUploadedAt?: string | null
  /** Confirm or reject time. */
  decidedAt?: string | null
  /** Proofs are deleted 12 months after the decision (retention cron). */
  proofDeleteAfter?: string | null
  proofDeletedAt?: string | null
}

/** Audit events that are not a payment state change. */
export type PaymentAdminEventType =
  | 'permission_granted'
  | 'permission_revoked'
  | 'settings_changed'
  | 'till_counted'
  | 'proof_attached'
  | 'proof_deleted'
  | 'sale_cancelled'
  | 'payout_changed'
  | 'link_token_issued'
  | 'link_token_revoked'

export type PaymentLinkStatus = 'active' | 'paid' | 'expired' | 'revoked'

/** Server-only: paymentLinksV2/{linkId}. One pending payment record per link. */
export interface PaymentLinkV2 {
  ownerId: string
  storeId: string
  receiptId: string
  paymentId: string
  amountKobo: number
  currency: PaymentsCurrency
  status: PaymentLinkStatus
  /** Paystack subaccount at creation; checkout always settles here. */
  subaccountCode: string
  /** Shown on the public page: the store's name and receipt number, nothing about the customer. */
  storeName: string
  receiptNumber: string
  /**
   * The order was opened for this link with nothing paid. When its last link dies with no money
   * recorded, the server cancels the order and releases the reserved stock.
   */
  linkSale: boolean
  expiresAt: string
  createdAt: string
  createdBy: string
  updatedAt: string
  paidAt: string | null
  endedAt: string | null
  endedBy: string | null
  endReason: string | null
  /** Set when the expiry or revoke cancelled the order and released its stock. */
  holdReleasedAt: string | null
  checkoutAttempts: number
  version: number
}

export type PaymentLinkTokenStatus = 'active' | 'revoked' | 'dead'

/** Server-only: paymentLinkTokens/{sha256(token)}. The token itself is never stored. */
export interface PaymentLinkTokenEntry {
  linkId: string
  ownerId: string
  storeId: string
  status: PaymentLinkTokenStatus
  createdAt: string
  createdBy: string
  expiresAt: string
  revokedAt: string | null
  revokedBy: string | null
}

/** Server-only: paymentLinksV2/{linkId}/attempts/{reference}. No customer email is kept. */
export interface PaymentLinkAttempt {
  reference: string
  amountKobo: number
  currency: PaymentsCurrency
  subaccountCode: string
  status: 'initializing' | 'initialized' | 'failed'
  createdAt: string
  ipHash: string
}

export type CashConfirmationMode = 'each' | 'end_of_day'

/** Server-only: users/{owner}/stores/{store}/paymentConfig/settings */
export interface PaymentSettings {
  cashConfirmation: CashConfirmationMode
  /** Tender label (lower-cased) → kind. Labels not listed fall back to a name-based guess. */
  tenderKinds: Record<string, Exclude<PaymentKind, 'paystack_link'>>
}

export const PAYMENT_PERMISSION_ACTIONS = ['view', 'confirm', 'refund'] as const
export type PaymentPermissionAction = (typeof PAYMENT_PERMISSION_ACTIONS)[number]
export type PaymentPermissions = Record<PaymentPermissionAction, boolean>

/** Server-only: users/{owner}/stores/{store}/tillCounts/{id} */
export interface TillCountRecord {
  businessDate: string
  countedKobo: number
  expectedKobo: number
  confirmedKobo: number
  rejectedKobo: number
  /** countedKobo − confirmedKobo. Non-zero alerts the owner. */
  differenceKobo: number
  confirmedPaymentIds: string[]
  rejectedPaymentIds: string[]
  countedBy: string
  countedByName: string
  note: string | null
  createdAt: string
}

/** Derived sale payment status, written by the server onto `receipts/{id}.paymentSummary`. */
export type SalePaymentStatus =
  | 'unpaid'
  | 'partially_paid'
  | 'awaiting_confirmation'
  | 'paid'
  | 'overpaid'
  | 'partially_refunded'
  | 'refunded'

export interface PaymentSummary {
  status: SalePaymentStatus
  currency: PaymentsCurrency
  totalKobo: number
  /** Confirmed money, before refunds. */
  confirmedKobo: number
  refundedKobo: number
  /** confirmedKobo − refundedKobo */
  netPaidKobo: number
  awaitingKobo: number
  pendingKobo: number
  balanceKobo: number
  overpaidKobo: number
  paymentCount: number
  lastPaymentAt: string | null
  version: number
}
