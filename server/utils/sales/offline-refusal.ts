import { FieldValue, type Firestore } from 'firebase-admin/firestore'
import { staffName } from './actor'

const ID = /^[A-Za-z0-9_-]{1,128}$/

export interface RefusedOfflineSale {
  authUid: string
  ownerUserId: unknown
  storeId: unknown
  saleId: unknown
  /** What the server said, e.g. "Not enough USB cable in stock." */
  message: string
  code: string | null
  /** The till's own short label, e.g. "2 items · ₦45,000". */
  summary?: unknown
  clientCreatedAt?: unknown
}

/**
 * Tells the store when a sale a till saved offline is refused on sync (sold elsewhere, too old,
 * access removed), so the money doesn't go unaccounted for with only the cashier seeing a toast.
 *
 * Only people who are, or were, on the store's team can leave this note, and each sale leaves at
 * most one (the notification ID comes from the sale ID). Never throws.
 */
export async function recordRefusedOfflineSale(
  db: Firestore,
  input: RefusedOfflineSale
): Promise<boolean> {
  try {
    const { authUid, ownerUserId, storeId, saleId } = input
    if (
      ![authUid, ownerUserId, storeId, saleId].every((v) => typeof v === 'string' && ID.test(v))
    ) {
      return false
    }
    const owner = db.collection('users').doc(ownerUserId as string)
    const store = owner.collection('stores').doc(storeId as string)

    let who = 'The owner'
    if (authUid !== ownerUserId) {
      // A removed member still has a member document (status not active); a stranger has none.
      const member = await store.collection('members').doc(authUid).get()
      if (!member.exists) return false
      const data = member.data() ?? {}
      who = 'A staff member'
      if (data.staffId && data.departmentId) {
        const staff = await store
          .collection('departments')
          .doc(String(data.departmentId))
          .collection('staff')
          .doc(String(data.staffId))
          .get()
        who = staffName(staff.data()) ?? who
      }
      if (data.status !== 'active') who = `${who} (no longer active)`
    } else if (!(await store.get()).exists) {
      return false
    }

    const summary =
      typeof input.summary === 'string'
        ? input.summary.replace(/\s+/g, ' ').trim().slice(0, 120)
        : ''
    const when =
      typeof input.clientCreatedAt === 'string' &&
      Number.isFinite(Date.parse(input.clientCreatedAt))
        ? new Date(input.clientCreatedAt).toISOString()
        : null

    await store
      .collection('notifications')
      .doc(`offline-refused-${saleId}`)
      .create({
        type: 'offline_sale_refused',
        title: 'Offline sale not recorded',
        message: `${who} made a sale offline${
          summary ? ` (${summary})` : ''
        } that couldn’t be recorded: ${input.message}`.slice(0, 500),
        userId: ownerUserId,
        actorId: authUid,
        read: false,
        metadata: {
          saleId: saleId as string,
          code: input.code ?? null,
          recordedOnTillAt: when,
        },
        source: 'server',
        createdAt: FieldValue.serverTimestamp(),
      })
    return true
  } catch (err) {
    // Already recorded for this sale (a retry), or the store is gone: nothing more to do.
    const code = (err as { code?: number | string })?.code
    if (code !== 6 && code !== 'already-exists') {
      console.error('[sales] offline refusal note failed', err instanceof Error ? err.message : err)
    }
    return false
  }
}
