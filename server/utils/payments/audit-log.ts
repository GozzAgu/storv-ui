import {
  FieldValue,
  type DocumentReference,
  type Firestore,
  type Transaction,
} from 'firebase-admin/firestore'
import {
  buildAuditEvent,
  GENESIS_HASH,
  verifyChain,
  type AuditEventBody,
  type ChainAnchor,
  type ChainHead,
  type ChainVerifyResult,
} from './audit-hash'

export const AUDIT_ANCHORS_COLLECTION = 'paymentAuditAnchors'

export function storeDocRef(db: Firestore, ownerId: string, storeId: string): DocumentReference {
  return db.collection('users').doc(ownerId).collection('stores').doc(storeId)
}

const headRef = (store: DocumentReference) => store.collection('paymentAudit').doc('head')
const eventRef = (store: DocumentReference, seq: number) =>
  store.collection('paymentEvents').doc(String(seq).padStart(12, '0'))

/** Must run before any transaction write (Firestore requires reads first). */
export async function readChainHead(tx: Transaction, store: DocumentReference): Promise<ChainHead> {
  const snap = await tx.get(headRef(store))
  const data = snap.data()
  return data
    ? { seq: Number(data.seq) || 0, hash: String(data.hash) }
    : { seq: 0, hash: GENESIS_HASH }
}

export type AuditEventInput = Omit<AuditEventBody, 'seq'>

/** Appends events after `head` and moves the head, all inside the caller's transaction. */
export function appendAuditEvents(
  tx: Transaction,
  store: DocumentReference,
  head: ChainHead,
  inputs: readonly AuditEventInput[]
): ChainHead {
  let current = head
  for (const input of inputs) {
    const event = buildAuditEvent(current.hash, { ...input, seq: current.seq + 1 })
    tx.create(eventRef(store, event.seq), { ...event, createdAt: FieldValue.serverTimestamp() })
    current = { seq: event.seq, hash: event.hash }
  }
  tx.set(headRef(store), { ...current, updatedAt: FieldValue.serverTimestamp() })
  return current
}

export interface ActivityMirrorInput {
  actorUid: string
  actorName: string
  storeId: string
  paymentId: string
  summaryText: string
  isCreate: boolean
}

/**
 * Mirrors a payment event into the store's activity log (server-written, so it lands on every
 * plan; the Activity page is still Medium+). Never include customer names or account numbers.
 */
export function mirrorToActivityLog(
  tx: Transaction,
  store: DocumentReference,
  input: ActivityMirrorInput
): void {
  tx.create(store.collection('activityLogs').doc(), {
    userId: input.actorUid,
    userDisplayName: input.actorName,
    action: input.isCreate ? 'created' : 'updated',
    entityType: 'payment',
    entityId: input.paymentId,
    entityName: input.summaryText,
    storeId: input.storeId,
    source: 'payments_v2',
    createdAt: FieldValue.serverTimestamp(),
  })
}

export async function verifyStoreAuditChain(
  db: Firestore,
  ownerId: string,
  storeId: string
): Promise<ChainVerifyResult> {
  const store = storeDocRef(db, ownerId, storeId)
  const [eventsSnap, headSnap, anchorsSnap] = await Promise.all([
    store.collection('paymentEvents').orderBy('seq').get(),
    headRef(store).get(),
    db
      .collection(AUDIT_ANCHORS_COLLECTION)
      .where('ownerId', '==', ownerId)
      .where('storeId', '==', storeId)
      .get(),
  ])
  const headData = headSnap.data()
  return verifyChain(
    eventsSnap.docs.map((d) => d.data()),
    {
      head: headData ? { seq: Number(headData.seq), hash: String(headData.hash) } : null,
      anchors: anchorsSnap.docs.map((d) => d.data() as ChainAnchor),
    }
  )
}

export function utcDateKey(date: Date = new Date()): string {
  return date.toISOString().slice(0, 10)
}

/**
 * Daily anchor: copies the store's chain head into a separate append-only collection and the
 * server log, so rewriting the chain afterwards no longer matches. One per store per day.
 */
export async function createDailyAnchor(
  db: Firestore,
  ownerId: string,
  storeId: string,
  date: string = utcDateKey()
): Promise<{ created: boolean; anchor: ChainAnchor }> {
  const head = await headRef(storeDocRef(db, ownerId, storeId)).get()
  const data = head.data()
  const anchor: ChainAnchor = {
    date,
    seq: data ? Number(data.seq) : 0,
    hash: data ? String(data.hash) : GENESIS_HASH,
  }
  try {
    await db
      .collection(AUDIT_ANCHORS_COLLECTION)
      .doc(`${ownerId}__${storeId}__${date}`)
      .create({ ...anchor, ownerId, storeId, createdAt: FieldValue.serverTimestamp() })
  } catch (err) {
    if ((err as { code?: number }).code === 6) return { created: false, anchor }
    throw err
  }
  console.info(JSON.stringify({ tag: 'payments-audit-anchor', ownerId, storeId, ...anchor }))
  return { created: true, anchor }
}
