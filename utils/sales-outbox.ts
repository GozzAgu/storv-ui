/**
 * Sales a till recorded while offline, kept on this device until the server accepts them.
 * Each keeps its sale ID, so sending one twice records it once. Stored per signed-in user.
 */

export interface QueuedSale {
  saleId: string
  ownerUserId: string
  storeId: string
  /** The create-sale request, minus scope. Never contains an approval PIN. */
  body: Record<string, unknown>
  /** When the till recorded it (sent as clientCreatedAt). */
  queuedAt: string
  /** Short label for messages, e.g. "2 items · ₦45,000". */
  summary: string
  attempts: number
  lastError?: string
}

export interface FailedSale extends QueuedSale {
  failedAt: string
}

const key = (uid: string, kind: 'queue' | 'failed') => `storvv:sales-outbox:${kind}:${uid}`

function read<T>(storageKey: string): T[] {
  try {
    const raw = globalThis.localStorage?.getItem(storageKey)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? (parsed as T[]) : []
  } catch {
    return []
  }
}

function write<T>(storageKey: string, list: T[]): void {
  try {
    globalThis.localStorage?.setItem(storageKey, JSON.stringify(list))
  } catch {
    /* storage full or blocked: the sale stays in memory for this session only */
  }
}

export function listQueuedSales(uid: string): QueuedSale[] {
  return read<QueuedSale>(key(uid, 'queue'))
}

export function listFailedSales(uid: string): FailedSale[] {
  return read<FailedSale>(key(uid, 'failed'))
}

export function enqueueSale(uid: string, sale: QueuedSale): void {
  const list = listQueuedSales(uid).filter((s) => s.saleId !== sale.saleId)
  write(key(uid, 'queue'), [...list, sale])
}

export function removeQueuedSale(uid: string, saleId: string): void {
  write(
    key(uid, 'queue'),
    listQueuedSales(uid).filter((s) => s.saleId !== saleId)
  )
}

export function updateQueuedSale(uid: string, saleId: string, patch: Partial<QueuedSale>): void {
  write(
    key(uid, 'queue'),
    listQueuedSales(uid).map((s) => (s.saleId === saleId ? { ...s, ...patch } : s))
  )
}

/** The server refused it (sold elsewhere, too old, ...): keep it so the owner can re-enter it. */
export function markSaleFailed(uid: string, sale: QueuedSale, error: string): void {
  removeQueuedSale(uid, sale.saleId)
  const failed = listFailedSales(uid).filter((s) => s.saleId !== sale.saleId)
  write(
    key(uid, 'failed'),
    [...failed, { ...sale, lastError: error, failedAt: new Date().toISOString() }].slice(-50)
  )
}

export function dismissFailedSale(uid: string, saleId: string): void {
  write(
    key(uid, 'failed'),
    listFailedSales(uid).filter((s) => s.saleId !== saleId)
  )
}

const ID_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'

/** A Firestore-style document ID, made on the till so retries keep the same sale. */
export function newSaleId(): string {
  const bytes = new Uint8Array(20)
  globalThis.crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => ID_CHARS[b % ID_CHARS.length]).join('')
}
