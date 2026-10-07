import type {
  PaymentEventType,
  PaymentFlag,
  PaymentKind,
  PaymentRecord,
  PaymentStatus,
} from '~/types/payments-v2'

export interface PaymentActor {
  /** Firebase uid, or `system:paystack` / `system:cron` for server-originated moves. */
  uid: string
  name: string
  role: 'owner' | 'member' | 'system'
  canConfirm?: boolean
  canRefund?: boolean
  canManageLinks?: boolean
}

export type TransitionErrorCode =
  | 'INVALID_TRANSITION'
  | 'FORBIDDEN'
  | 'SELF_CONFIRM'
  | 'REASON_REQUIRED'
  | 'FLAG_REQUIRED'
  | 'INVALID_REFUND'

export const TRANSITION_ERROR_STATUS: Record<TransitionErrorCode, number> = {
  INVALID_TRANSITION: 409,
  FORBIDDEN: 403,
  SELF_CONFIRM: 403,
  REASON_REQUIRED: 400,
  FLAG_REQUIRED: 400,
  INVALID_REFUND: 400,
}

export interface TransitionRequest {
  payment: Pick<PaymentRecord, 'status' | 'recordedBy' | 'amountKobo' | 'refundedKobo'>
  to: PaymentStatus
  actor: PaymentActor
  reason?: string | null
  flags?: readonly PaymentFlag[]
  /** Refund transitions only: the amount refunded by this step. */
  refundKobo?: number
}

export type TransitionResult =
  | { ok: true; event: PaymentEventType; refundedKobo: number }
  | { ok: false; code: TransitionErrorCode; message: string }

const fail = (code: TransitionErrorCode, message: string): TransitionResult => ({
  ok: false,
  code,
  message,
})

const hasReason = (reason?: string | null) => typeof reason === 'string' && reason.trim().length > 0
const isSystem = (a: PaymentActor) => a.role === 'system'
const canCheck = (a: PaymentActor) =>
  a.role === 'owner' || (a.role === 'member' && a.canConfirm === true)
const canRefund = (a: PaymentActor) =>
  isSystem(a) || a.role === 'owner' || (a.role === 'member' && a.canRefund === true)
const canManageLinks = (a: PaymentActor) =>
  a.role === 'owner' || (a.role === 'member' && a.canManageLinks === true)

type Rule = (req: TransitionRequest) => TransitionResult

const REFUND_FROM: ReadonlySet<PaymentStatus> = new Set(['confirmed', 'partially_refunded'])

function refundRule(req: TransitionRequest): TransitionResult {
  if (!canRefund(req.actor)) return fail('FORBIDDEN', 'You cannot refund payments')
  if (!isSystem(req.actor) && !hasReason(req.reason)) {
    return fail('REASON_REQUIRED', 'A reason is required for a manual refund')
  }
  const step = req.refundKobo
  if (typeof step !== 'number' || !Number.isSafeInteger(step) || step <= 0) {
    return fail('INVALID_REFUND', 'Refund amount must be a positive whole number of kobo')
  }
  const refundedKobo = (req.payment.refundedKobo ?? 0) + step
  if (refundedKobo > req.payment.amountKobo) {
    return fail('INVALID_REFUND', 'Refund exceeds the payment amount')
  }
  if (req.to === 'refunded' && refundedKobo !== req.payment.amountKobo) {
    return fail('INVALID_REFUND', 'A full refund must cover the whole remaining amount')
  }
  if (req.to === 'partially_refunded' && refundedKobo === req.payment.amountKobo) {
    return fail('INVALID_REFUND', 'This refund covers the whole amount; use a full refund')
  }
  return { ok: true, event: 'refunded', refundedKobo }
}

function checkerRule(event: 'confirmed' | 'rejected'): Rule {
  return (req) => {
    if (!canCheck(req.actor)) return fail('FORBIDDEN', 'You cannot confirm payments')
    if (req.actor.uid === req.payment.recordedBy) {
      return fail('SELF_CONFIRM', 'The person who recorded a payment cannot confirm or reject it')
    }
    if (event === 'rejected' && !hasReason(req.reason)) {
      return fail('REASON_REQUIRED', 'A reason is required to reject a payment')
    }
    return { ok: true, event, refundedKobo: req.payment.refundedKobo ?? 0 }
  }
}

const systemOnly =
  (event: PaymentEventType): Rule =>
  (req) =>
    isSystem(req.actor)
      ? { ok: true, event, refundedKobo: req.payment.refundedKobo ?? 0 }
      : fail('FORBIDDEN', 'Only Storvv can make this change')

/** Every allowed move. Anything not listed is INVALID_TRANSITION. */
const TRANSITIONS: Partial<Record<PaymentStatus, Partial<Record<PaymentStatus, Rule>>>> = {
  pending: {
    confirmed: systemOnly('paid'),
    failed: systemOnly('failed'),
    expired: (req) => {
      if (isSystem(req.actor)) return { ok: true, event: 'expired', refundedKobo: 0 }
      if (canManageLinks(req.actor)) return { ok: true, event: 'revoked', refundedKobo: 0 }
      return fail('FORBIDDEN', 'You cannot revoke payment links')
    },
  },
  expired: {
    // Money really moved after expiry or revoke: confirm it, flagged, rather than hide it.
    confirmed: (req) => {
      if (!isSystem(req.actor)) return fail('FORBIDDEN', 'Only Storvv can make this change')
      const flagged = req.flags?.some((f) => f === 'paid_after_expiry' || f === 'paid_after_revoke')
      if (!flagged) return fail('FLAG_REQUIRED', 'A late payment must be flagged')
      return { ok: true, event: 'paid', refundedKobo: 0 }
    },
  },
  awaiting_confirmation: {
    confirmed: checkerRule('confirmed'),
    rejected: checkerRule('rejected'),
  },
  confirmed: {
    partially_refunded: refundRule,
    refunded: refundRule,
  },
  partially_refunded: {
    partially_refunded: refundRule,
    refunded: refundRule,
  },
}

export function checkTransition(req: TransitionRequest): TransitionResult {
  const rule = TRANSITIONS[req.payment.status]?.[req.to]
  if (!rule) {
    return fail(
      'INVALID_TRANSITION',
      `Cannot move a payment from ${req.payment.status} to ${req.to}`
    )
  }
  if (!REFUND_FROM.has(req.payment.status) && req.refundKobo !== undefined) {
    return fail('INVALID_REFUND', 'Refund amount is only valid on refunds')
  }
  return rule(req)
}

export function allowedTargets(from: PaymentStatus): PaymentStatus[] {
  return Object.keys(TRANSITIONS[from] ?? {}) as PaymentStatus[]
}

export interface CreationPlan {
  status: PaymentStatus
  events: PaymentEventType[]
  autoConfirmedReason: 'recorded_by_owner' | null
}

export type CreationResult =
  | ({ ok: true } & CreationPlan)
  | { ok: false; code: 'FORBIDDEN'; message: string }

/**
 * Initial state for a new payment. Links start pending. Manual payments (transfer, POS, cash)
 * wait for a checker, except the owner's own, which auto-confirm and are labelled.
 */
export function planCreation(kind: PaymentKind, actor: PaymentActor): CreationResult {
  if (kind === 'paystack_link') {
    if (!isSystem(actor) && !canManageLinks(actor)) {
      return { ok: false, code: 'FORBIDDEN', message: 'You cannot create payment links' }
    }
    return { ok: true, status: 'pending', events: ['created'], autoConfirmedReason: null }
  }
  if (isSystem(actor)) {
    return { ok: false, code: 'FORBIDDEN', message: 'Manual payments must be recorded by a person' }
  }
  if (actor.role === 'owner') {
    return {
      ok: true,
      status: 'confirmed',
      events: ['claimed', 'confirmed'],
      autoConfirmedReason: 'recorded_by_owner',
    }
  }
  return {
    ok: true,
    status: 'awaiting_confirmation',
    events: ['claimed'],
    autoConfirmedReason: null,
  }
}
