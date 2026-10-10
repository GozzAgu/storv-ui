import type { Firestore } from 'firebase-admin/firestore'
import type { PaymentRecord } from '~/types/payments-v2'
import { appendAuditEvents, readChainHead, storeDocRef } from './audit-log'
import { assertDocId, type PaymentsAccess } from './access'
import { PaymentServiceError, TX_OPTIONS } from './records'
import { IMAGE_UPLOAD_MAX_BYTES, IMAGE_UPLOAD_TYPE } from '~/utils/image-upload-rules'

export const PROOF_URL_TTL_MS = 5 * 60 * 1000
const PROOF_RETENTION_MONTHS = 12
const PROOF_FILE_PATTERN = /^proof\.(webp|pdf)$/
/** Photos are converted to WebP of at most 30 KB on the device; PDFs are not images. */
const PROOF_LIMITS: Record<string, { contentType: string; maxBytes: number }> = {
  'proof.webp': { contentType: IMAGE_UPLOAD_TYPE, maxBytes: IMAGE_UPLOAD_MAX_BYTES },
  'proof.pdf': { contentType: 'application/pdf', maxBytes: 5 * 1024 * 1024 },
}

export interface ProofStorage {
  stat(path: string): Promise<{ exists: boolean; size?: number; contentType?: string }>
  signedReadUrl(path: string, expiresAt: Date): Promise<string>
  remove(path: string): Promise<void>
}

export function proofPathFor(
  ownerId: string,
  storeId: string,
  paymentId: string,
  fileName: string
): string {
  return `paymentProofs/${ownerId}/${storeId}/${paymentId}/${fileName}`
}

/**
 * The recorder uploads straight to Storage (rules: recorder only, awaiting only, create once,
 * WebP up to 30 KB or PDF up to 5 MB), then calls this so the server checks the object and links it.
 */
export async function attachProof(
  db: Firestore,
  storage: ProofStorage,
  access: PaymentsAccess,
  input: { paymentId: unknown; fileName: unknown }
): Promise<{ proofPath: string }> {
  const paymentId = assertDocId(input.paymentId, 'paymentId')
  if (typeof input.fileName !== 'string' || !PROOF_FILE_PATTERN.test(input.fileName)) {
    throw new PaymentServiceError('INVALID_INPUT', 400, 'fileName must be proof.webp or proof.pdf')
  }
  const limits = PROOF_LIMITS[input.fileName]!
  const path = proofPathFor(access.ownerId, access.storeId, paymentId, input.fileName)
  const object = await storage.stat(path)
  if (!object.exists) throw new PaymentServiceError('PROOF_MISSING', 409, 'Upload the file first')
  if (!object.size || object.size > limits.maxBytes || object.contentType !== limits.contentType) {
    throw new PaymentServiceError(
      'PROOF_INVALID',
      400,
      'Proof must be a WebP photo up to 30 KB or a PDF up to 5 MB'
    )
  }

  const store = storeDocRef(db, access.ownerId, access.storeId)
  const ref = store.collection('payments').doc(paymentId)
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref)
    if (!snap.exists) throw new PaymentServiceError('NOT_FOUND', 404, 'Not found')
    const p = snap.data() as PaymentRecord
    if (p.recordedBy !== access.actor.uid) {
      throw new PaymentServiceError(
        'FORBIDDEN',
        403,
        'Only the person who recorded this payment can add proof'
      )
    }
    if (p.status !== 'awaiting_confirmation') {
      throw new PaymentServiceError(
        'INVALID_TRANSITION',
        409,
        'Proof can only be added while the payment awaits confirmation'
      )
    }
    if (p.proofPath)
      throw new PaymentServiceError('PROOF_EXISTS', 409, 'This payment already has proof')
    const head = await readChainHead(tx, store)
    const now = new Date().toISOString()
    tx.update(ref, { proofPath: path, proofUploadedAt: now, updatedAt: now })
    appendAuditEvents(tx, store, head, [
      {
        type: 'proof_attached',
        paymentId,
        receiptId: p.receiptId,
        linkId: null,
        actorUid: access.actor.uid,
        actorKind: access.actor.role,
        amountKobo: null,
        currency: null,
        fromStatus: null,
        toStatus: null,
        reason: null,
        flags: [],
        at: now,
        subjectUid: null,
      },
    ])
  }, TX_OPTIONS)
  return { proofPath: path }
}

/** Short-lived signed URL. Owner, payments.view/confirm holders, and the recorder. */
export async function proofReadUrl(
  db: Firestore,
  storage: ProofStorage,
  access: PaymentsAccess,
  input: { paymentId: unknown },
  now: Date = new Date()
): Promise<{ url: string; expiresAt: string }> {
  const paymentId = assertDocId(input.paymentId, 'paymentId')
  const snap = await storeDocRef(db, access.ownerId, access.storeId)
    .collection('payments')
    .doc(paymentId)
    .get()
  if (!snap.exists) throw new PaymentServiceError('NOT_FOUND', 404, 'Not found')
  const p = snap.data() as PaymentRecord
  if (!access.canView && p.recordedBy !== access.actor.uid) {
    throw new PaymentServiceError('FORBIDDEN', 403, 'You cannot view this proof')
  }
  if (!p.proofPath) throw new PaymentServiceError('NOT_FOUND', 404, 'Not found')
  const expiresAt = new Date(now.getTime() + PROOF_URL_TTL_MS)
  return {
    url: await storage.signedReadUrl(p.proofPath, expiresAt),
    expiresAt: expiresAt.toISOString(),
  }
}

/** Retention cron: delete proofs 12 months after the confirm or reject decision. */
export async function runProofRetention(
  db: Firestore,
  storage: ProofStorage,
  now: Date = new Date(),
  limit = 200
): Promise<{ deleted: number; failed: number }> {
  const due = await db
    .collectionGroup('payments')
    .where('proofDeleteAfter', '<=', now.toISOString())
    .limit(limit)
    .get()
  let deleted = 0
  let failed = 0
  for (const doc of due.docs) {
    const p = doc.data() as PaymentRecord
    const store = doc.ref.parent.parent
    if (!store || !p.proofPath) continue
    try {
      await storage.remove(p.proofPath)
      await db.runTransaction(async (tx) => {
        const head = await readChainHead(tx, store)
        const at = new Date().toISOString()
        tx.update(doc.ref, {
          proofPath: null,
          proofDeleteAfter: null,
          proofDeletedAt: at,
          updatedAt: at,
        })
        appendAuditEvents(tx, store, head, [
          {
            type: 'proof_deleted',
            paymentId: doc.id,
            receiptId: p.receiptId,
            linkId: null,
            actorUid: 'system:cron',
            actorKind: 'system',
            amountKobo: null,
            currency: null,
            fromStatus: null,
            toStatus: null,
            reason: `retention ${PROOF_RETENTION_MONTHS} months`,
            flags: [],
            at,
            subjectUid: null,
          },
        ])
      }, TX_OPTIONS)
      deleted += 1
    } catch (err) {
      failed += 1
      console.error(
        JSON.stringify({
          tag: 'payments-proof-retention-failed',
          paymentId: doc.id,
          error: err instanceof Error ? err.message : 'unknown',
        })
      )
    }
  }
  return { deleted, failed }
}

export function bucketProofStorage(bucket: import('@google-cloud/storage').Bucket): ProofStorage {
  return {
    async stat(path) {
      const file = bucket.file(path)
      const [exists] = await file.exists()
      if (!exists) return { exists: false }
      const [meta] = await file.getMetadata()
      return { exists: true, size: Number(meta.size) || 0, contentType: meta.contentType }
    },
    async signedReadUrl(path, expiresAt) {
      const [url] = await bucket
        .file(path)
        .getSignedUrl({ version: 'v4', action: 'read', expires: expiresAt })
      return url
    },
    async remove(path) {
      await bucket.file(path).delete({ ignoreNotFound: true })
    },
  }
}
