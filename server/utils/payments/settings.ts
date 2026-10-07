import type { DocumentReference, Firestore, Transaction } from 'firebase-admin/firestore'
import type { CashConfirmationMode, PaymentKind, PaymentSettings } from '~/types/payments-v2'
import { appendAuditEvents, readChainHead, storeDocRef } from './audit-log'
import type { PaymentsAccess } from './access'
import { PaymentServiceError, TX_OPTIONS } from './records'

type ManualKind = Exclude<PaymentKind, 'paystack_link'>
const MANUAL_KINDS: readonly ManualKind[] = ['cash', 'pos', 'manual_transfer']
const MAX_TENDER_LABELS = 40

export const DEFAULT_PAYMENT_SETTINGS: PaymentSettings = {
  cashConfirmation: 'each',
  tenderKinds: {},
}

export const settingsRef = (store: DocumentReference) =>
  store.collection('paymentConfig').doc('settings')

export function normalizeTenderLabel(label: string): string {
  return label.trim().toLowerCase().replace(/\s+/g, ' ').slice(0, 60)
}

export function parsePaymentSettings(raw: unknown): PaymentSettings {
  const data = (raw ?? {}) as Partial<PaymentSettings>
  const cashConfirmation: CashConfirmationMode =
    data.cashConfirmation === 'end_of_day' ? 'end_of_day' : 'each'
  const tenderKinds: PaymentSettings['tenderKinds'] = {}
  for (const [label, kind] of Object.entries(data.tenderKinds ?? {})) {
    if (MANUAL_KINDS.includes(kind as ManualKind)) {
      tenderKinds[normalizeTenderLabel(label)] = kind as ManualKind
    }
  }
  return { cashConfirmation, tenderKinds }
}

export async function readPaymentSettings(
  store: DocumentReference,
  tx?: Transaction
): Promise<PaymentSettings> {
  const snap = tx ? await tx.get(settingsRef(store)) : await settingsRef(store).get()
  return parsePaymentSettings(snap.data())
}

/**
 * Kind for a merchant's tender label. Every manual kind needs a checker, so a wrong mapping can
 * only change whether cash goes through the till count, never skip confirmation.
 */
export function kindForTender(label: string, settings: PaymentSettings): ManualKind {
  const key = normalizeTenderLabel(label)
  const mapped = settings.tenderKinds[key]
  if (mapped) return mapped
  if (/\bcash\b/.test(key)) return 'cash'
  if (/\b(pos|card|terminal)\b/.test(key)) return 'pos'
  return 'manual_transfer'
}

export async function updatePaymentSettings(
  db: Firestore,
  access: PaymentsAccess,
  input: { cashConfirmation?: unknown; tenderKinds?: unknown }
): Promise<PaymentSettings> {
  if (!access.isOwner)
    throw new PaymentServiceError('FORBIDDEN', 403, 'Only the owner can change payment settings')
  if (input.cashConfirmation !== 'each' && input.cashConfirmation !== 'end_of_day') {
    throw new PaymentServiceError(
      'INVALID_SETTINGS',
      400,
      'Cash confirmation must be each or end_of_day'
    )
  }
  const rawKinds = (input.tenderKinds ?? {}) as Record<string, unknown>
  if (typeof rawKinds !== 'object' || Array.isArray(rawKinds)) {
    throw new PaymentServiceError('INVALID_SETTINGS', 400, 'Tender kinds must be an object')
  }
  const entries = Object.entries(rawKinds)
  if (entries.length > MAX_TENDER_LABELS) {
    throw new PaymentServiceError('INVALID_SETTINGS', 400, 'Too many tender labels')
  }
  const tenderKinds: PaymentSettings['tenderKinds'] = {}
  for (const [label, kind] of entries) {
    if (!MANUAL_KINDS.includes(kind as ManualKind) || !normalizeTenderLabel(label)) {
      throw new PaymentServiceError(
        'INVALID_SETTINGS',
        400,
        'Each tender must map to cash, pos or manual_transfer'
      )
    }
    tenderKinds[normalizeTenderLabel(label)] = kind as ManualKind
  }
  const next: PaymentSettings = { cashConfirmation: input.cashConfirmation, tenderKinds }

  const store = storeDocRef(db, access.ownerId, access.storeId)
  await db.runTransaction(async (tx) => {
    const before = await readPaymentSettings(store, tx)
    const head = await readChainHead(tx, store)
    const now = new Date().toISOString()
    tx.set(settingsRef(store), { ...next, updatedAt: now, updatedBy: access.actor.uid })
    appendAuditEvents(tx, store, head, [
      {
        type: 'settings_changed',
        paymentId: null,
        receiptId: null,
        linkId: null,
        actorUid: access.actor.uid,
        actorKind: access.actor.role,
        amountKobo: null,
        currency: null,
        fromStatus: before.cashConfirmation,
        toStatus: next.cashConfirmation,
        reason: `tender kinds: ${Object.keys(tenderKinds).length}`,
        flags: [],
        at: now,
        subjectUid: null,
      },
    ])
  }, TX_OPTIONS)
  return next
}
