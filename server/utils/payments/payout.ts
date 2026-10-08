import { FieldValue, type Firestore } from 'firebase-admin/firestore'
import { payoutDocId } from '../payment-links'
import { appendAuditEvents, readChainHead, storeDocRef } from './audit-log'
import { PaymentServiceError, TX_OPTIONS } from './records'

export const PAYOUTS_COLLECTION = 'merchantPayouts'
/** Storvv keeps nothing from link payments during the beta (approved decision). */
export const PAYOUT_PERCENTAGE_CHARGE = 0

export type PaystackCall = <T>(
  path: string,
  init: { method: 'GET' | 'POST' | 'PUT'; body?: Record<string, unknown> }
) => Promise<T>

export interface StoredPayout {
  ownerUserId: string
  storeId: string
  connected: boolean
  bankName: string
  bankCode: string
  accountNumberLast4: string
  accountName: string
  subaccountCode: string
  percentageCharge: number
  /** Only on docs written before Step 3; removed on the next connect. */
  accountNumber?: string
}

export interface PayoutView {
  connected: boolean
  bankName: string
  accountName: string
  accountNumberLast4: string
  percentageCharge: number
}

export { payoutDocId }

export function payoutLast4(data: Partial<StoredPayout> | undefined): string {
  return String(data?.accountNumberLast4 || data?.accountNumber || '').slice(-4)
}

export function toPayoutView(data: Partial<StoredPayout> | undefined): PayoutView {
  if (!data?.connected) {
    return { connected: false, bankName: '', accountName: '', accountNumberLast4: '', percentageCharge: 0 }
  }
  return {
    connected: true,
    bankName: data.bankName || '',
    accountName: data.accountName || '',
    accountNumberLast4: payoutLast4(data),
    percentageCharge: Number(data.percentageCharge) || 0,
  }
}

export function normalizeAccountInput(input: { bankCode?: unknown; accountNumber?: unknown }) {
  const bankCode = typeof input.bankCode === 'string' ? input.bankCode.trim() : ''
  const accountNumber =
    typeof input.accountNumber === 'string' ? input.accountNumber.replace(/\D/g, '') : ''
  if (!/^[0-9A-Za-z-]{2,20}$/.test(bankCode) || accountNumber.length !== 10) {
    throw new PaymentServiceError(
      'INVALID_INPUT',
      400,
      'A 10-digit account number and bank are required'
    )
  }
  return { bankCode, accountNumber }
}

/** Account holder name as Paystack reports it; the client's copy is never trusted. */
export async function resolveAccountName(
  paystack: PaystackCall,
  bankCode: string,
  accountNumber: string
): Promise<string> {
  let name = ''
  try {
    const data = await paystack<{ account_name?: string }>(
      `/bank/resolve?account_number=${encodeURIComponent(accountNumber)}&bank_code=${encodeURIComponent(bankCode)}`,
      { method: 'GET' }
    )
    name = String(data?.account_name || '').trim()
  } catch {
    name = ''
  }
  if (!name) {
    throw new PaymentServiceError(
      'ACCOUNT_NOT_RESOLVED',
      422,
      'Could not verify this account. Check the number and bank.'
    )
  }
  return name.slice(0, 120)
}

export interface ConnectPayoutInput {
  ownerId: string
  storeId: string
  actorUid: string
  bankCode: string
  bankName: string
  accountNumber: string
  businessName: string
}

export interface ConnectPayoutResult {
  payout: PayoutView
  replaced: boolean
  previousLast4: string
}

/**
 * Owner-only (the route enforces owner, verified email and a fresh 2FA code). Updates the
 * existing Paystack subaccount rather than creating a second one, so links already shared keep
 * settling to the store, and records the change in the store's payment audit chain.
 */
export async function connectPayout(
  db: Firestore,
  paystack: PaystackCall,
  input: ConnectPayoutInput
): Promise<ConnectPayoutResult> {
  const accountName = await resolveAccountName(paystack, input.bankCode, input.accountNumber)
  const ref = db.collection(PAYOUTS_COLLECTION).doc(payoutDocId(input.ownerId, input.storeId))
  const existing = (await ref.get()).data() as Partial<StoredPayout> | undefined
  const existingCode = existing?.subaccountCode || ''
  const businessName = (input.businessName.trim() || accountName).slice(0, 100)
  const body = {
    business_name: businessName,
    settlement_bank: input.bankCode,
    account_number: input.accountNumber,
    percentage_charge: PAYOUT_PERCENTAGE_CHARGE,
  }

  let subaccountCode = existingCode
  try {
    if (existingCode) {
      await paystack(`/subaccount/${encodeURIComponent(existingCode)}`, { method: 'PUT', body })
    } else {
      const created = await paystack<{ subaccount_code?: string }>('/subaccount', {
        method: 'POST',
        body,
      })
      subaccountCode = String(created?.subaccount_code || '')
    }
  } catch {
    throw new PaymentServiceError(
      'PAYSTACK_UNAVAILABLE',
      502,
      'Paystack could not save this payout account. Nothing was changed.'
    )
  }
  if (!subaccountCode) {
    throw new PaymentServiceError(
      'PAYSTACK_UNAVAILABLE',
      502,
      'Paystack did not return a subaccount. Nothing was changed.'
    )
  }

  const last4 = input.accountNumber.slice(-4)
  const store = storeDocRef(db, input.ownerId, input.storeId)
  await db.runTransaction(async (tx) => {
    const head = await readChainHead(tx, store)
    const now = new Date().toISOString()
    tx.set(
      ref,
      {
        ownerUserId: input.ownerId,
        storeId: input.storeId,
        connected: true,
        bankName: input.bankName.trim().slice(0, 100),
        bankCode: input.bankCode,
        accountNumberLast4: last4,
        accountNumber: FieldValue.delete(),
        accountName,
        subaccountCode,
        percentageCharge: PAYOUT_PERCENTAGE_CHARGE,
        updatedBy: input.actorUid,
        updatedAt: FieldValue.serverTimestamp(),
        ...(existing ? {} : { createdAt: FieldValue.serverTimestamp() }),
      },
      { merge: true }
    )
    appendAuditEvents(tx, store, head, [
      {
        type: 'payout_changed',
        paymentId: null,
        receiptId: null,
        linkId: null,
        actorUid: input.actorUid,
        actorKind: 'owner',
        amountKobo: null,
        currency: null,
        fromStatus: existing?.connected ? 'connected' : null,
        toStatus: 'connected',
        reason: existing?.connected ? 'payout account replaced' : 'payout account connected',
        flags: [],
        at: now,
        subjectUid: null,
      },
    ])
  }, TX_OPTIONS)

  return {
    payout: toPayoutView({
      connected: true,
      bankName: input.bankName.trim().slice(0, 100),
      accountName,
      accountNumberLast4: last4,
      percentageCharge: PAYOUT_PERCENTAGE_CHARGE,
    }),
    replaced: Boolean(existing?.connected),
    previousLast4: payoutLast4(existing),
  }
}
