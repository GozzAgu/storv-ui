import { createError } from 'h3'
import { FieldValue, Timestamp, type Firestore } from 'firebase-admin/firestore'
import { planHasFeature } from '~/types/subscription'
import { customerAccountDocId, getCustomerContactKey } from '~/utils/customer-key'
import { normalizeEntityName } from '~/utils/capitalize-text'
import { roundMoney } from '~/utils/receipt-balance'
import { hasAnyModuleManageAccess } from '~/utils/staff-permissions'
import { forbid, type StoreActor } from './actor'
import { logSaleActivity } from './records'

export type LedgerEntryType = 'charge' | 'payment' | 'adjustment'

function bad(message: string): never {
  throw createError({ statusCode: 400, message })
}

/**
 * Adds an entry to a customer's balance. The balance is worked out here from the stored one, and
 * the entry records who made it. Cashiers can charge and take payments; only managers can adjust.
 */
export async function applyLedgerEntry(
  db: Firestore,
  actor: StoreActor,
  input: Record<string, unknown>
) {
  if (actor.plan === 'storvv_micro') forbid('Customer balances need the Medium plan or above.')
  if (!actor.isOwner && !actor.permissions.receipts.create)
    forbid('You can’t change customer balances.')

  const type = input.type as LedgerEntryType
  if (type !== 'charge' && type !== 'payment' && type !== 'adjustment') bad('type is invalid')
  if (type === 'adjustment' && !actor.isOwner && !hasAnyModuleManageAccess(actor.permissions)) {
    forbid('Only managers can adjust a customer’s balance.')
  }
  const raw = roundMoney(Number(input.amount))
  if (!Number.isFinite(raw) || raw === 0 || Math.abs(raw) > 1e12) bad('Enter an amount')
  // A charge adds to what is owed, a payment takes from it; the sign is not the client's to pick.
  const amount = type === 'charge' ? Math.abs(raw) : type === 'payment' ? -Math.abs(raw) : raw

  const customerName =
    normalizeEntityName(String(input.customerName ?? '')).slice(0, 120) ||
    String(input.customerName ?? '')
      .trim()
      .slice(0, 120)
  const email =
    typeof input.email === 'string' ? input.email.toLowerCase().trim().slice(0, 200) : ''
  const phone = typeof input.phone === 'string' ? input.phone.trim().slice(0, 40) : ''
  if (!customerName && !email && !phone) bad('Choose a customer')
  const contactKey = getCustomerContactKey({ name: customerName, email, phone })
  const note = typeof input.note === 'string' ? input.note.trim().slice(0, 300) : ''
  const ref = actor.store.collection('customerAccounts').doc(customerAccountDocId(contactKey))

  return db.runTransaction(async (tx) => {
    const snap = await tx.get(ref)
    const data = snap.data() ?? {}
    const balance = Number(data.accountBalance) || 0
    if (amount < 0 && Math.abs(amount) > balance + 0.01) {
      bad(`That is more than the ${balance.toLocaleString()} this customer owes.`)
    }
    const entry = {
      id: ref.collection('_').doc().id,
      type,
      amount,
      ...(note && { note }),
      createdAt: Timestamp.now(),
      createdBy: actor.uid,
      createdByName: actor.displayName,
    }
    const accountBalance = roundMoney(Math.max(0, balance + amount))
    const next = {
      contactKey,
      customerName: customerName || data.customerName || '',
      ...((email || data.email) && { email: email || data.email }),
      ...((phone || data.phone) && { phone: phone || data.phone }),
      storeId: actor.storeId,
      accountBalance,
      // Appended, never trimmed: the full history stays as it always has.
      balanceLedger: snap.exists ? FieldValue.arrayUnion(entry) : [entry],
      updatedAt: FieldValue.serverTimestamp(),
    }
    if (snap.exists) tx.update(ref, next)
    else tx.set(ref, { ...next, createdAt: FieldValue.serverTimestamp(), createdBy: actor.ownerId })
    if (planHasFeature(actor.plan, 'activity_logs')) {
      logSaleActivity(tx, actor, {
        action: 'updated',
        entityType: 'customer_balance',
        entityId: ref.id,
        entityName: `${
          type === 'charge' ? 'Charged' : type === 'payment' ? 'Payment from' : 'Adjusted'
        } ${customerName || 'customer'}: ${amount.toLocaleString()}`,
      })
    }
    return {
      id: ref.id,
      contactKey,
      accountBalance,
      entry: { ...entry, createdAt: entry.createdAt.toDate().toISOString() },
    }
  })
}
