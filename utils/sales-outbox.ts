import { shallowRef } from 'vue'

/**
 * Sales a till recorded while offline, kept on this device until the server accepts them.
 * Each keeps its sale ID, so sending one twice records it once. Stored per signed-in user.
 */

/** How long a till may go without reaching the server and still save sales (matches the server). */
export const MAX_OFFLINE_SELLING_MS = 72 * 60 * 60_000

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
  /** The total the till showed the customer, so the server can flag a price change meanwhile. */
  clientTotal?: number
  attempts: number
  lastError?: string
}

export interface FailedSale extends QueuedSale {
  failedAt: string
}

const key = (uid: string, kind: 'queue' | 'failed') => `storvv:sales-outbox:${kind}:${uid}`
const lastReachedKey = (uid: string) => `storvv:last-server-contact:${uid}`

/** Bumped on every change, so screens showing the outbox can re-read it. */
export const outboxVersion = shallowRef(0)

if (typeof window !== 'undefined') {
  // Another tab changed the outbox.
  window.addEventListener('storage', (event) => {
    if (event.key?.startsWith('storvv:sales-outbox:')) outboxVersion.value++
  })
}

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
    if (list.length) globalThis.localStorage?.setItem(storageKey, JSON.stringify(list))
    else globalThis.localStorage?.removeItem(storageKey)
  } catch {
    /* storage full or blocked: the sale stays in memory for this session only */
  }
  outboxVersion.value++
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

/** Put a refused sale back in the queue (stock was added back, the price was fixed, ...). */
export function requeueFailedSale(uid: string, saleId: string): void {
  const failed = listFailedSales(uid).find((s) => s.saleId === saleId)
  if (!failed) return
  const { failedAt: _failedAt, ...sale } = failed
  dismissFailedSale(uid, saleId)
  enqueueSale(uid, { ...sale, attempts: 0, lastError: undefined })
}

/**
 * Forget this user's offline sales on this device (sign-out on a shared till). Waiting sales are
 * kept unless `includeQueued`, since dropping them loses money the server has never seen.
 */
export function clearSalesOutbox(uid: string, opts: { includeQueued?: boolean } = {}): void {
  write(key(uid, 'failed'), [])
  if (opts.includeQueued) write(key(uid, 'queue'), [])
}

/**
 * The server vouched for this user at `at`: it answered an authenticated request, or issued a
 * fresh sign-in token (which it refuses once the account is disabled or its sessions revoked).
 */
export function markServerReached(uid: string, at = Date.now()): void {
  if (!Number.isFinite(at) || at <= 0) return
  const known = lastServerContact(uid)
  if (known !== null && known >= at) return
  try {
    globalThis.localStorage?.setItem(lastReachedKey(uid), String(Math.min(at, Date.now())))
  } catch {
    /* storage blocked */
  }
}

/** When this device last heard from the server as this user, or null if it never recorded it. */
export function lastServerContact(uid: string): number | null {
  try {
    const value = Number(globalThis.localStorage?.getItem(lastReachedKey(uid)))
    return Number.isFinite(value) && value > 0 ? value : null
  } catch {
    return null
  }
}

/**
 * Whether this till may still save a sale offline. A device that hasn't reached the server for
 * three days stops: its sales would be refused anyway, and a member removed meanwhile can't keep
 * selling on a till that never reconnects.
 */
export function canSellOffline(uid: string, now = Date.now()): boolean {
  const last = lastServerContact(uid)
  return last === null || now - last <= MAX_OFFLINE_SELLING_MS
}

const ID_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'

/** A Firestore-style document ID, made on the till so retries keep the same sale. */
export function newSaleId(): string {
  const bytes = new Uint8Array(20)
  globalThis.crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => ID_CHARS[b % ID_CHARS.length]).join('')
}
