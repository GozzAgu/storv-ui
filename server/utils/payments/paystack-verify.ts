import { PAYMENTS_V2_CURRENCY } from '~/utils/money-kobo'

/** What we stored when the checkout started; the verify response must match all of it. */
export interface ExpectedCharge {
  reference: string
  amountKobo: number
  subaccountCode: string
}

export interface VerifiedCharge {
  reference: string
  amountKobo: number
  transactionId: string
  channel: string
  paidAt: string
  feesKobo: number | null
}

export type VerifyFailure =
  | 'NOT_SUCCESSFUL'
  | 'STILL_PENDING'
  | 'REFERENCE_MISMATCH'
  | 'CURRENCY_MISMATCH'
  | 'AMOUNT_MISMATCH'
  | 'SUBACCOUNT_MISSING'
  | 'SUBACCOUNT_MISMATCH'
  | 'MALFORMED'

export type VerifyCheck =
  | { ok: true; charge: VerifiedCharge }
  | { ok: false; code: VerifyFailure; retryable: boolean; paystackStatus: string | null }

/** Paystack statuses that may still turn into `success`; Paystack will send the event again. */
const IN_FLIGHT = new Set(['pending', 'ongoing', 'processing', 'queued'])

const fail = (
  code: VerifyFailure,
  paystackStatus: string | null,
  retryable = false
): VerifyCheck => ({
  ok: false,
  code,
  retryable,
  paystackStatus,
})

/**
 * Checks GET /transaction/verify/:reference `data` against the stored attempt. Paystack's docs
 * show `subaccount: {}` for an unsplit charge and do not document the split shape, so the
 * subaccount is read from `subaccount.subaccount_code` (decision 2026-10-09) and anything missing
 * or different fails closed. `amount` must equal the link amount exactly: a charge with fees
 * passed to the customer goes to review instead of confirming.
 */
export function checkVerifiedCharge(raw: unknown, expected: ExpectedCharge): VerifyCheck {
  if (!raw || typeof raw !== 'object') return fail('MALFORMED', null)
  const data = raw as Record<string, unknown>
  const status = typeof data.status === 'string' ? data.status : null
  if (status !== 'success') {
    return fail(
      status && IN_FLIGHT.has(status) ? 'STILL_PENDING' : 'NOT_SUCCESSFUL',
      status,
      status !== null && IN_FLIGHT.has(status)
    )
  }
  if (data.reference !== expected.reference) return fail('REFERENCE_MISMATCH', status)
  if (data.currency !== PAYMENTS_V2_CURRENCY) return fail('CURRENCY_MISMATCH', status)
  const amount = data.amount
  if (
    typeof amount !== 'number' ||
    !Number.isSafeInteger(amount) ||
    amount !== expected.amountKobo
  ) {
    return fail('AMOUNT_MISMATCH', status)
  }
  const sub = data.subaccount as Record<string, unknown> | null | undefined
  const code = sub && typeof sub === 'object' ? sub.subaccount_code : undefined
  if (typeof code !== 'string' || !code) return fail('SUBACCOUNT_MISSING', status)
  if (code !== expected.subaccountCode) return fail('SUBACCOUNT_MISMATCH', status)

  const id = data.id
  if (!(typeof id === 'number' || typeof id === 'string') || String(id) === '') {
    return fail('MALFORMED', status)
  }
  const paidAt = [data.paid_at, data.paidAt].find((v): v is string => typeof v === 'string')
  const fees = data.fees
  return {
    ok: true,
    charge: {
      reference: expected.reference,
      amountKobo: amount,
      // For reference only: IDs above 2^53 (Paystack changelog) may already be rounded by JSON parsing.
      transactionId: String(id),
      channel: typeof data.channel === 'string' ? data.channel.slice(0, 40) : 'unknown',
      paidAt: paidAt && !Number.isNaN(Date.parse(paidAt)) ? new Date(paidAt).toISOString() : '',
      feesKobo: typeof fees === 'number' && Number.isSafeInteger(fees) ? fees : null,
    },
  }
}
