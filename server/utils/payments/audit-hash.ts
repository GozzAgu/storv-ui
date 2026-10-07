/**
 * Tamper-evident hash chain for payment events (not tamper-proof: Admin SDK access can still
 * write, but any edit, deletion or reorder breaks the chain and is reported by verifyChain).
 *
 * No path aliases here: scripts/payments/verify-audit-chain.mjs loads this file directly.
 */
import { createHash } from 'node:crypto'

export const GENESIS_HASH = '0'.repeat(64)

/** Fields covered by the hash. Anything else on the Firestore doc is ignored. */
export const AUDIT_BODY_KEYS = [
  'seq',
  'type',
  'paymentId',
  'receiptId',
  'linkId',
  'actorUid',
  'actorKind',
  'amountKobo',
  'currency',
  'fromStatus',
  'toStatus',
  'reason',
  'flags',
  'at',
] as const

export interface AuditEventBody {
  seq: number
  type: string
  paymentId: string | null
  receiptId: string | null
  linkId: string | null
  actorUid: string
  actorKind: string
  amountKobo: number | null
  currency: string | null
  fromStatus: string | null
  toStatus: string | null
  reason: string | null
  flags: string[]
  /** ISO time set by the server before hashing (not a serverTimestamp sentinel). */
  at: string
}

export interface AuditEventRecord extends AuditEventBody {
  prevHash: string
  hash: string
}

export interface ChainHead {
  seq: number
  hash: string
}

export interface ChainAnchor {
  date: string
  seq: number
  hash: string
}

export type ChainBreakReason =
  | 'seq_gap'
  | 'prev_hash_mismatch'
  | 'hash_mismatch'
  | 'head_mismatch'
  | 'anchor_mismatch'

export interface ChainBreak {
  seq: number
  reason: ChainBreakReason
}

export type ChainVerifyResult =
  | { ok: true; checked: number; head: ChainHead }
  | { ok: false; checked: number; firstBreak: ChainBreak }

/** Deterministic JSON: object keys sorted at every level, undefined dropped. */
export function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value)
  if (Array.isArray(value)) return `[${value.map((v) => canonicalJson(v ?? null)).join(',')}]`
  const obj = value as Record<string, unknown>
  const entries = Object.keys(obj)
    .filter((k) => obj[k] !== undefined)
    .sort()
    .map((k) => `${JSON.stringify(k)}:${canonicalJson(obj[k])}`)
  return `{${entries.join(',')}}`
}

export function pickAuditBody(record: Record<string, unknown>): AuditEventBody {
  const body: Record<string, unknown> = {}
  for (const key of AUDIT_BODY_KEYS) body[key] = record[key] ?? (key === 'flags' ? [] : null)
  return body as unknown as AuditEventBody
}

export function computeEventHash(prevHash: string, body: AuditEventBody): string {
  return createHash('sha256')
    .update(
      `${prevHash}\n${canonicalJson(pickAuditBody(body as unknown as Record<string, unknown>))}`
    )
    .digest('hex')
}

export function buildAuditEvent(prevHash: string, body: AuditEventBody): AuditEventRecord {
  return { ...body, prevHash, hash: computeEventHash(prevHash, body) }
}

/**
 * Walks events in seq order from genesis and reports the first broken link. Optionally checks
 * the stored chain head and daily anchors against the recomputed chain.
 */
export function verifyChain(
  events: readonly Record<string, unknown>[],
  options: { head?: ChainHead | null; anchors?: readonly ChainAnchor[] } = {}
): ChainVerifyResult {
  const sorted = [...events].sort((a, b) => Number(a.seq) - Number(b.seq))
  const hashBySeq = new Map<number, string>()
  let prevHash = GENESIS_HASH
  let expectedSeq = 1

  for (const raw of sorted) {
    const seq = Number(raw.seq)
    if (seq !== expectedSeq) {
      return {
        ok: false,
        checked: hashBySeq.size,
        firstBreak: { seq: expectedSeq, reason: 'seq_gap' },
      }
    }
    if (raw.prevHash !== prevHash) {
      return {
        ok: false,
        checked: hashBySeq.size,
        firstBreak: { seq, reason: 'prev_hash_mismatch' },
      }
    }
    const recomputed = computeEventHash(prevHash, pickAuditBody(raw))
    if (raw.hash !== recomputed) {
      return { ok: false, checked: hashBySeq.size, firstBreak: { seq, reason: 'hash_mismatch' } }
    }
    hashBySeq.set(seq, recomputed)
    prevHash = recomputed
    expectedSeq += 1
  }

  const head: ChainHead = { seq: expectedSeq - 1, hash: prevHash }
  if (options.head && (options.head.seq !== head.seq || options.head.hash !== head.hash)) {
    // A head ahead of the events means events were deleted from the end.
    const seq = Math.min(options.head.seq, head.seq + 1)
    return { ok: false, checked: hashBySeq.size, firstBreak: { seq, reason: 'head_mismatch' } }
  }
  for (const anchor of [...(options.anchors ?? [])].sort((a, b) => a.seq - b.seq)) {
    if (anchor.seq === 0) continue
    if (hashBySeq.get(anchor.seq) !== anchor.hash) {
      return {
        ok: false,
        checked: hashBySeq.size,
        firstBreak: { seq: anchor.seq, reason: 'anchor_mismatch' },
      }
    }
  }
  return { ok: true, checked: hashBySeq.size, head }
}
