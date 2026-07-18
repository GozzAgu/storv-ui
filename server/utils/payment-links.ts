import { randomBytes, createHmac } from 'node:crypto'
import { createError } from 'h3'
import { resolvePaystackSecretKey } from '~/server/utils/paystack-validation'

export const PAYMENT_LINK_CURRENCY = 'NGN'
/** Unpaid payment links expire after this many minutes. */
export const PAYMENT_LINK_TTL_MINUTES = 60

export type PaymentLinkStatus = 'unpaid' | 'paid' | 'failed' | 'expired'

export interface PaymentLinkItem {
  itemId: string
  folderId: string
  name: string
  unitPrice: number // naira
  quantity: number
}

export interface PaymentLinkDoc {
  token: string
  ownerUserId: string
  storeId: string
  businessName: string
  invoiceNumber: string
  customerName: string
  customerPhone: string
  customerEmail?: string
  items: PaymentLinkItem[]
  amount: number // kobo (locked server-side)
  currency: string
  status: PaymentLinkStatus
  reference?: string
  channel?: string
  receiptId?: string
  inventoryApplied?: boolean
  createdAt?: FirebaseFirestore.Timestamp | FirebaseFirestore.FieldValue
  paidAt?: FirebaseFirestore.Timestamp | FirebaseFirestore.FieldValue
  expiresAt: Date | FirebaseFirestore.Timestamp
  createdBy: string
}

export interface MerchantPayoutDoc {
  ownerUserId: string
  storeId: string
  connected: boolean
  bankName: string
  bankCode: string
  accountNumber: string
  accountName: string
  subaccountCode: string
  percentageCharge: number // platform fee % retained by the platform
  createdAt?: FirebaseFirestore.FieldValue
  updatedAt?: FirebaseFirestore.FieldValue
}

/** Unguessable public token for a payment link. */
export function generatePaymentToken(): string {
  return randomBytes(20).toString('hex')
}

/** Paystack transaction reference (idempotency anchor). */
export function generateReference(token: string): string {
  return `storvv_pl_${token}_${Date.now()}`
}

export function nairaToKobo(naira: number): number {
  return Math.round((Number(naira) || 0) * 100)
}

export function koboToNaira(kobo: number): number {
  return Math.round(Number(kobo) || 0) / 100
}

/** Document id for a merchant's per-store payout config (server-only collection). */
export function payoutDocId(ownerUserId: string, storeId: string): string {
  return `${ownerUserId}__${storeId}`
}

export function getPaystackSecret(config: { paystackSecretKey?: string }): string {
  const secret = resolvePaystackSecretKey(config)
  if (!secret) {
    throw createError({
      statusCode: 503,
      message: 'Paystack is not configured. Set PAYSTACK_SECRET_KEY.',
    })
  }
  return secret
}

type PaystackResponse<T> = { status?: boolean; message?: string; data?: T }

/** Authenticated call to the Paystack REST API. Throws createError on failure. */
export async function paystackRequest<T = unknown>(
  path: string,
  opts: {
    method?: 'GET' | 'POST' | 'PUT'
    body?: Record<string, unknown>
    secretKey: string
  }
): Promise<T> {
  let res: PaystackResponse<T>
  try {
    res = await $fetch<PaystackResponse<T>>(`https://api.paystack.co${path}`, {
      method: opts.method || 'GET',
      headers: {
        Authorization: `Bearer ${opts.secretKey}`,
        'Content-Type': 'application/json',
      },
      ...(opts.body ? { body: opts.body } : {}),
    })
  } catch (err: unknown) {
    const message =
      (err as { data?: { message?: string } })?.data?.message ||
      (err as Error)?.message ||
      'Paystack request failed'
    throw createError({ statusCode: 502, message: `Paystack: ${message}` })
  }
  if (res?.status === false) {
    throw createError({
      statusCode: 502,
      message: `Paystack: ${res.message || 'request rejected'}`,
    })
  }
  return res.data as T
}

/** Verify Paystack webhook signature (HMAC SHA512 of raw body with secret key). */
export function isValidPaystackSignature(
  rawBody: string,
  signature: string,
  secretKey: string
): boolean {
  if (!signature) return false
  const hash = createHmac('sha512', secretKey).update(rawBody).digest('hex')
  return hash === signature
}
