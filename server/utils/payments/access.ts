import type { Firestore } from 'firebase-admin/firestore'
import type { PaymentPermissions } from '~/types/payments-v2'
import { resolveStaffPermissions, type LegacyStaffAccessFields } from '~/utils/staff-permissions'
import { storeDocRef } from './audit-log'
import { PaymentServiceError } from './records'
import type { PaymentActor } from './state-machine'

export interface PaymentsAccess {
  ownerId: string
  storeId: string
  isOwner: boolean
  actor: PaymentActor
  canRecord: boolean
  canView: boolean
  canConfirm: boolean
  canRefund: boolean
}

const ID_PATTERN = /^[A-Za-z0-9_-]{1,128}$/

/** Firestore IDs from the client: no slashes or dots, so they cannot walk to another path. */
export function assertDocId(value: unknown, field: string): string {
  if (typeof value !== 'string' || !ID_PATTERN.test(value)) {
    throw new PaymentServiceError('INVALID_ID', 400, `${field} is invalid`)
  }
  return value
}

export function readPaymentPermissions(raw: unknown): PaymentPermissions {
  const p = (raw ?? {}) as Partial<Record<keyof PaymentPermissions, unknown>>
  return { view: p.view === true, confirm: p.confirm === true, refund: p.refund === true }
}

function staffName(data: Record<string, unknown> | undefined): string | null {
  const name = [data?.firstName, data?.lastName]
    .filter((v) => typeof v === 'string' && v.trim())
    .join(' ')
    .trim()
  return name ? name.slice(0, 80) : null
}

/**
 * Who the caller is in this store. A missing store, or a caller who is not an active member,
 * gets 404 (not 403) so store and record IDs from other stores reveal nothing.
 */
export async function resolvePaymentsAccess(
  db: Firestore,
  uid: string,
  ownerId: string,
  storeId: string
): Promise<PaymentsAccess> {
  const store = storeDocRef(
    db,
    assertDocId(ownerId, 'ownerUserId'),
    assertDocId(storeId, 'storeId')
  )
  const storeSnap = await store.get()
  if (!storeSnap.exists) throw new PaymentServiceError('NOT_FOUND', 404, 'Not found')

  if (uid === ownerId) {
    return {
      ownerId,
      storeId,
      isOwner: true,
      actor: {
        uid,
        name: 'Owner',
        role: 'owner',
        canConfirm: true,
        canRefund: true,
        canManageLinks: true,
      },
      canRecord: true,
      canView: true,
      canConfirm: true,
      canRefund: true,
    }
  }

  const memberSnap = await store.collection('members').doc(uid).get()
  const member = memberSnap.data() as
    | (LegacyStaffAccessFields & {
        status?: string
        staffId?: string
        departmentId?: string
        permissions?: { payments?: unknown }
      })
    | undefined
  if (!member || member.status !== 'active') {
    throw new PaymentServiceError('NOT_FOUND', 404, 'Not found')
  }

  const staff = resolveStaffPermissions(member)
  const payments = readPaymentPermissions(member.permissions?.payments)
  let name: string | null = null
  if (member.staffId && member.departmentId) {
    const staffSnap = await store
      .collection('departments')
      .doc(String(member.departmentId))
      .collection('staff')
      .doc(String(member.staffId))
      .get()
    name = staffName(staffSnap.data())
  }
  const canRecord = staff.receipts.create === true
  return {
    ownerId,
    storeId,
    isOwner: false,
    actor: {
      uid,
      name: name ?? 'Staff',
      role: 'member',
      canConfirm: payments.confirm,
      canRefund: payments.refund,
      canManageLinks: canRecord,
    },
    canRecord,
    canView: payments.view || payments.confirm,
    canConfirm: payments.confirm,
    canRefund: payments.refund,
  }
}

export function requireAccess(ok: boolean, message: string): void {
  if (!ok) throw new PaymentServiceError('FORBIDDEN', 403, message)
}
