import type { Firestore } from 'firebase-admin/firestore'
import type { PaymentRecord, PaymentSummary } from '~/types/payments-v2'
import { resolveBusinessNameFromUserData } from '~/utils/receipt-business-name'

type UserData = Parameters<typeof resolveBusinessNameFromUserData>[0]

/** Payments a customer may see on a receipt; pending, failed, expired and rejected are left out. */
const SHOWN_STATUSES = new Set(['confirmed', 'awaiting_confirmation', 'refunded'])
const MAX_ITEMS = 200
const MAX_PAYMENTS = 50

export interface ReceiptPaymentLine {
  methodLabel: string
  amountKobo: number
  status: 'confirmed' | 'awaiting_confirmation' | 'refunded'
  refundedKobo: number
}

/**
 * Receipt content for email, built only from stored data. The browser's copy is never used:
 * for a Payments V2 sale the money lines come from server-written payment records.
 */
export interface ReceiptView {
  receiptNumber: string
  customerName: string
  date: string | null
  storeName: string
  storeBranchName: string
  items: { itemName: string; quantity: number; price: number }[]
  /** Naira, as stored on the receipt. */
  total: number
  status: string
  paymentMethod: string
  v2: boolean
  payments: ReceiptPaymentLine[]
  balanceDueKobo: number | null
}

const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '')

function toIso(value: unknown): string | null {
  if (!value) return null
  const maybe = value as { toDate?: () => Date }
  const d = typeof maybe.toDate === 'function' ? maybe.toDate() : new Date(value as string)
  return Number.isNaN(d.getTime()) ? null : d.toISOString()
}

export function isV2Receipt(receipt: Record<string, unknown>): boolean {
  return Boolean(receipt.paymentSummary) || receipt.paymentsV2 === true
}

export async function buildReceiptView(
  db: Firestore,
  ownerId: string,
  storeId: string,
  receiptId: string,
  receipt: Record<string, unknown>
): Promise<ReceiptView> {
  const store = db.collection('users').doc(ownerId).collection('stores').doc(storeId)
  const v2 = isV2Receipt(receipt)
  const [ownerSnap, storeSnap, paymentsSnap] = await Promise.all([
    db.collection('users').doc(ownerId).get(),
    store.get(),
    v2
      ? store.collection('payments').where('receiptId', '==', receiptId).limit(MAX_PAYMENTS).get()
      : Promise.resolve(null),
  ])

  const branch = str(receipt.storeBranchName, 120) || str(storeSnap.data()?.name, 120)
  const businessName =
    resolveBusinessNameFromUserData(ownerSnap.data() as UserData, {
      branchName: branch,
    }) ||
    branch ||
    'Store'

  const items = (Array.isArray(receipt.items) ? receipt.items.slice(0, MAX_ITEMS) : []).map(
    (raw) => {
      const line = (raw ?? {}) as Record<string, unknown>
      return {
        itemName: str(line.itemName, 200),
        quantity: Math.max(1, Math.floor(Number(line.quantity) || 1)),
        price: Number(line.price) || 0,
      }
    }
  )

  const payments: ReceiptPaymentLine[] = (paymentsSnap?.docs ?? [])
    .map((d) => d.data() as PaymentRecord)
    .filter((p) => SHOWN_STATUSES.has(p.status))
    .map((p) => ({
      methodLabel: str(p.methodLabel, 60) || 'Payment',
      amountKobo: p.amountKobo,
      status: p.status as ReceiptPaymentLine['status'],
      refundedKobo: p.refundedKobo || 0,
    }))
  const summary = receipt.paymentSummary as PaymentSummary | undefined

  return {
    receiptNumber: str(receipt.receiptNumber, 40),
    customerName: str(receipt.customerName, 120),
    date: toIso(receipt.date) ?? toIso(receipt.createdAt),
    storeName: businessName,
    storeBranchName: branch && branch !== businessName ? branch : '',
    items,
    total: Number(receipt.total) || 0,
    status: str(receipt.status, 40),
    paymentMethod: str(receipt.paymentMethod, 60),
    v2,
    payments,
    balanceDueKobo: v2 && summary ? Math.max(0, summary.balanceKobo) : null,
  }
}
