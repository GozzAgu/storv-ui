import { FieldValue, Timestamp, type Firestore } from 'firebase-admin/firestore'
import type {
  TradeAction,
  TradeConnectionStatus,
  TradeConnectionView,
  TradeLookupResult,
  TradePartnerCard,
  TradeProfileView,
} from '~/types/trade'
import { normalizeTradeHandle, suggestTradeHandle, tradeHandleProblem } from '~/utils/trade-handle'
import { payoutDocId } from '../payment-links'
import { storeDocRef } from '../payments/audit-log'
import { PAYOUTS_COLLECTION } from '../payments/payout'

export const TRADE_PROFILES = 'tradeProfiles'
export const TRADE_HANDLES = 'tradeHandles'
export const TRADE_CONNECTIONS = 'tradeConnections'

/** Active plus pending connections one store may hold. */
export const MAX_TRADE_CONNECTIONS = 200
/** After a decline, the same requester waits this long before asking again. */
export const DECLINE_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000
const DISPLAY_NAME_MAX = 80

export class TradeError extends Error {
  constructor(readonly code: string, readonly statusCode: number, message: string) {
    super(message)
    this.name = 'TradeError'
  }
}

/** Same wording whether the other side blocked, declined recently or is at capacity. */
const NOT_ACCEPTING = () =>
  new TradeError('NOT_ACCEPTING', 409, 'This business is not accepting a request from you right now.')

export interface TradeScope {
  ownerId: string
  storeId: string
}

export interface StoredTradeProfile {
  ownerUid: string
  storeId: string
  handle: string
  displayName: string
}

interface StoredConnection {
  parties: [string, string]
  status: TradeConnectionStatus
  requestedBy: string
  blockedBy?: string | null
  declinedAt?: Timestamp | null
  acceptedAt?: Timestamp | null
  createdAt?: Timestamp
  updatedAt?: Timestamp
}

export function tradeKey(scope: TradeScope): string {
  return payoutDocId(scope.ownerId, scope.storeId)
}

export function connectionId(a: string, b: string): string {
  return [a, b].sort().join('~')
}

function otherParty(conn: StoredConnection, me: string): string {
  return conn.parties[0] === me ? conn.parties[1] : conn.parties[0]
}

function millis(value: unknown): number {
  return value instanceof Timestamp ? value.toMillis() : 0
}

function cleanDisplayName(value: unknown): string {
  return String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, DISPLAY_NAME_MAX)
}

async function storeNameAndSlug(db: Firestore, scope: TradeScope) {
  const store = storeDocRef(db, scope.ownerId, scope.storeId)
  const [storeSnap, sfSnap] = await Promise.all([
    store.get(),
    store.collection('storefrontConfig').doc('settings').get(),
  ])
  if (!storeSnap.exists) throw new TradeError('NOT_FOUND', 404, 'Not found')
  return {
    name: cleanDisplayName(storeSnap.data()?.name) || 'My business',
    slug: String(sfSnap.data()?.slug || ''),
  }
}

async function bankVerifiedKeys(db: Firestore, keys: string[]): Promise<Set<string>> {
  if (!keys.length) return new Set()
  const snaps = await db.getAll(...keys.map((k) => db.collection(PAYOUTS_COLLECTION).doc(k)))
  return new Set(snaps.filter((s) => s.data()?.connected === true).map((s) => s.id))
}

async function readProfiles(db: Firestore, keys: string[]) {
  const map = new Map<string, StoredTradeProfile>()
  if (!keys.length) return map
  const snaps = await db.getAll(...keys.map((k) => db.collection(TRADE_PROFILES).doc(k)))
  for (const s of snaps) if (s.exists) map.set(s.id, s.data() as StoredTradeProfile)
  return map
}

function toCard(profile: StoredTradeProfile | undefined, verified: boolean): TradePartnerCard {
  return {
    handle: profile?.handle || '',
    displayName: profile?.displayName || 'Business',
    bankVerified: verified,
  }
}

export async function getTradeProfile(db: Firestore, scope: TradeScope): Promise<TradeProfileView> {
  const key = tradeKey(scope)
  const [snap, store, verified] = await Promise.all([
    db.collection(TRADE_PROFILES).doc(key).get(),
    storeNameAndSlug(db, scope),
    bankVerifiedKeys(db, [key]),
  ])
  const data = snap.data() as StoredTradeProfile | undefined
  return {
    handle: data?.handle || null,
    displayName: data?.displayName || store.name,
    suggestedHandle: data?.handle || suggestTradeHandle(store.slug, store.name),
    bankVerified: verified.has(key),
  }
}

/**
 * Claim or change the store's handle. A handle that another store already holds, or that is
 * another store's storefront address, is taken, so nobody can pose as a shop customers know.
 */
export async function saveTradeProfile(
  db: Firestore,
  scope: TradeScope,
  input: { handle: unknown; displayName: unknown }
): Promise<TradeProfileView> {
  const handle = normalizeTradeHandle(input.handle)
  const problem = tradeHandleProblem(handle)
  if (problem) throw new TradeError('INVALID_HANDLE', 400, problem)
  const store = await storeNameAndSlug(db, scope)
  const displayName = cleanDisplayName(input.displayName) || store.name
  const key = tradeKey(scope)

  const storefront = (await db.collection('storefronts').doc(handle).get()).data()
  if (
    storefront &&
    (storefront.ownerUid !== scope.ownerId || storefront.storeId !== scope.storeId)
  ) {
    throw new TradeError('HANDLE_TAKEN', 409, 'That handle is taken. Try another.')
  }

  await db.runTransaction(async (tx) => {
    const handleRef = db.collection(TRADE_HANDLES).doc(handle)
    const profileRef = db.collection(TRADE_PROFILES).doc(key)
    const [handleSnap, profileSnap] = await Promise.all([tx.get(handleRef), tx.get(profileRef)])
    if (handleSnap.exists && handleSnap.data()?.key !== key) {
      throw new TradeError('HANDLE_TAKEN', 409, 'That handle is taken. Try another.')
    }
    const previous = (profileSnap.data() as StoredTradeProfile | undefined)?.handle
    if (previous && previous !== handle) tx.delete(db.collection(TRADE_HANDLES).doc(previous))
    if (!handleSnap.exists) {
      tx.set(handleRef, {
        key,
        ownerUid: scope.ownerId,
        storeId: scope.storeId,
        createdAt: FieldValue.serverTimestamp(),
      })
    }
    tx.set(
      profileRef,
      {
        ownerUid: scope.ownerId,
        storeId: scope.storeId,
        handle,
        displayName,
        updatedAt: FieldValue.serverTimestamp(),
        ...(profileSnap.exists ? {} : { createdAt: FieldValue.serverTimestamp() }),
      },
      { merge: true }
    )
  })
  return getTradeProfile(db, scope)
}

async function keyForHandle(db: Firestore, rawHandle: unknown): Promise<string> {
  const handle = normalizeTradeHandle(rawHandle)
  const snap = tradeHandleProblem(handle) ? null : await db.collection(TRADE_HANDLES).doc(handle).get()
  const key = snap?.data()?.key
  if (typeof key !== 'string' || !key) {
    throw new TradeError('HANDLE_NOT_FOUND', 404, 'No business uses that handle.')
  }
  return key
}

function relationFor(conn: StoredConnection | undefined, me: string): TradeLookupResult['relation'] {
  if (!conn) return 'none'
  if (conn.status === 'active') return 'active'
  if (conn.status === 'pending') return conn.requestedBy === me ? 'outgoing' : 'incoming'
  return 'none'
}

export async function lookupTradeHandle(
  db: Firestore,
  scope: TradeScope,
  rawHandle: unknown
): Promise<TradeLookupResult> {
  const me = tradeKey(scope)
  const them = await keyForHandle(db, rawHandle)
  const [profiles, verified, connSnap] = await Promise.all([
    readProfiles(db, [them]),
    bankVerifiedKeys(db, [them]),
    them === me ? null : db.collection(TRADE_CONNECTIONS).doc(connectionId(me, them)).get(),
  ])
  return {
    partner: toCard(profiles.get(them), verified.has(them)),
    relation: them === me ? 'self' : relationFor(connSnap?.data() as StoredConnection | undefined, me),
  }
}

/** Single-field query (no composite index); one store holds a few hundred docs at most. */
async function openConnectionCount(db: Firestore, key: string): Promise<number> {
  const snap = await db
    .collection(TRADE_CONNECTIONS)
    .where('parties', 'array-contains', key)
    .select('status')
    .get()
  return snap.docs.filter((d) => ['pending', 'active'].includes(d.data().status)).length
}

export interface InviteResult {
  connectionId: string
  relation: 'outgoing' | 'active'
  /** True when this request created or accepted something, so the other side is told once. */
  changed: boolean
  partner: TradePartnerCard
  partnerScope: TradeScope
}

/**
 * Ask another business to connect. If they already asked us, this accepts their request.
 * Blocks, recent declines and full partner lists all give the same answer so nothing leaks.
 */
export async function inviteTradePartner(
  db: Firestore,
  scope: TradeScope,
  rawHandle: unknown,
  now = Date.now()
): Promise<InviteResult> {
  const me = tradeKey(scope)
  const myProfile = (await db.collection(TRADE_PROFILES).doc(me).get()).data()
  if (!myProfile?.handle) {
    throw new TradeError('NO_HANDLE', 409, 'Choose your trade handle before adding partners.')
  }
  const them = await keyForHandle(db, rawHandle)
  if (them === me) throw new TradeError('SELF', 400, 'That is your own handle.')
  const [theirProfile] = [...(await readProfiles(db, [them])).values()]
  if (!theirProfile) throw new TradeError('HANDLE_NOT_FOUND', 404, 'No business uses that handle.')

  const [myCount, theirCount] = await Promise.all([
    openConnectionCount(db, me),
    openConnectionCount(db, them),
  ])

  const id = connectionId(me, them)
  const ref = db.collection(TRADE_CONNECTIONS).doc(id)
  const outcome = await db.runTransaction(async (tx) => {
    const conn = (await tx.get(ref)).data() as StoredConnection | undefined
    if (conn?.status === 'active') return { relation: 'active' as const, changed: false }
    if (conn?.status === 'pending' && conn.requestedBy === me) {
      return { relation: 'outgoing' as const, changed: false }
    }
    if (conn?.status === 'pending' && conn.requestedBy === them) {
      tx.update(ref, {
        status: 'active',
        acceptedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      })
      return { relation: 'active' as const, changed: true }
    }
    if (conn?.status === 'blocked') throw NOT_ACCEPTING()
    if (
      conn?.status === 'declined' &&
      conn.requestedBy === me &&
      now - millis(conn.declinedAt) < DECLINE_COOLDOWN_MS
    ) {
      throw NOT_ACCEPTING()
    }
    if (myCount >= MAX_TRADE_CONNECTIONS) {
      throw new TradeError(
        'LIMIT',
        409,
        `You can have up to ${MAX_TRADE_CONNECTIONS} partners and requests. Remove some first.`
      )
    }
    if (theirCount >= MAX_TRADE_CONNECTIONS) throw NOT_ACCEPTING()
    tx.set(ref, {
      parties: [me, them].sort(),
      status: 'pending',
      requestedBy: me,
      blockedBy: null,
      declinedAt: null,
      acceptedAt: null,
      createdAt: conn?.createdAt ?? FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    })
    return { relation: 'outgoing' as const, changed: true }
  })

  const verified = await bankVerifiedKeys(db, [them])
  return {
    connectionId: id,
    ...outcome,
    partner: toCard(theirProfile, verified.has(them)),
    partnerScope: { ownerId: theirProfile.ownerUid, storeId: theirProfile.storeId },
  }
}

const TRANSITIONS: Record<
  TradeAction,
  { from: TradeConnectionStatus[]; who: 'requester' | 'recipient' | 'either' | 'blocker'; to: TradeConnectionStatus }
> = {
  accept: { from: ['pending'], who: 'recipient', to: 'active' },
  decline: { from: ['pending'], who: 'recipient', to: 'declined' },
  cancel: { from: ['pending'], who: 'requester', to: 'cancelled' },
  remove: { from: ['active'], who: 'either', to: 'removed' },
  block: { from: ['pending', 'active', 'declined', 'cancelled', 'removed'], who: 'either', to: 'blocked' },
  unblock: { from: ['blocked'], who: 'blocker', to: 'removed' },
}

export function isTradeAction(value: unknown): value is TradeAction {
  return typeof value === 'string' && value in TRANSITIONS
}

export interface RespondResult {
  status: TradeConnectionStatus
  partnerScope: TradeScope | null
  partner: TradePartnerCard
}

export async function respondToConnection(
  db: Firestore,
  scope: TradeScope,
  id: string,
  action: TradeAction
): Promise<RespondResult> {
  const me = tradeKey(scope)
  const rule = TRANSITIONS[action]
  const ref = db.collection(TRADE_CONNECTIONS).doc(id)
  const conn = await db.runTransaction(async (tx) => {
    const data = (await tx.get(ref)).data() as StoredConnection | undefined
    if (!data || !data.parties.includes(me)) throw new TradeError('NOT_FOUND', 404, 'Not found')
    const allowed =
      rule.from.includes(data.status) &&
      (rule.who === 'either' ||
        (rule.who === 'requester' && data.requestedBy === me) ||
        (rule.who === 'recipient' && data.requestedBy !== me) ||
        (rule.who === 'blocker' && data.blockedBy === me))
    if (!allowed) {
      throw new TradeError('INVALID_STATE', 409, 'This request has already changed. Refresh and try again.')
    }
    tx.update(ref, {
      status: rule.to,
      blockedBy: rule.to === 'blocked' ? me : null,
      ...(rule.to === 'active' ? { acceptedAt: FieldValue.serverTimestamp() } : {}),
      ...(rule.to === 'declined' ? { declinedAt: FieldValue.serverTimestamp() } : {}),
      updatedAt: FieldValue.serverTimestamp(),
    })
    return data
  })
  const them = otherParty(conn, me)
  const [profiles, verified] = await Promise.all([
    readProfiles(db, [them]),
    bankVerifiedKeys(db, [them]),
  ])
  const profile = profiles.get(them)
  return {
    status: rule.to,
    partner: toCard(profile, verified.has(them)),
    partnerScope: profile ? { ownerId: profile.ownerUid, storeId: profile.storeId } : null,
  }
}

const STATE_ORDER: Record<TradeConnectionView['state'], number> = {
  incoming: 0,
  outgoing: 1,
  active: 2,
  blocked: 3,
}

export async function listTradeConnections(
  db: Firestore,
  scope: TradeScope
): Promise<TradeConnectionView[]> {
  const me = tradeKey(scope)
  const snap = await db.collection(TRADE_CONNECTIONS).where('parties', 'array-contains', me).get()
  const rows: { id: string; conn: StoredConnection; state: TradeConnectionView['state'] }[] = []
  for (const doc of snap.docs) {
    const conn = doc.data() as StoredConnection
    let state: TradeConnectionView['state'] | null = null
    if (conn.status === 'active') state = 'active'
    else if (conn.status === 'pending') state = conn.requestedBy === me ? 'outgoing' : 'incoming'
    else if (conn.status === 'blocked' && conn.blockedBy === me) state = 'blocked'
    if (state) rows.push({ id: doc.id, conn, state })
  }
  const keys = rows.map((r) => otherParty(r.conn, me))
  const [profiles, verified] = await Promise.all([readProfiles(db, keys), bankVerifiedKeys(db, keys)])
  return rows
    .map(({ id, conn, state }) => {
      const them = otherParty(conn, me)
      return {
        id,
        state,
        partner: toCard(profiles.get(them), verified.has(them)),
        sinceMs: millis(state === 'active' ? conn.acceptedAt : conn.updatedAt),
      }
    })
    .sort(
      (a, b) =>
        STATE_ORDER[a.state] - STATE_ORDER[b.state] ||
        a.partner.displayName.localeCompare(b.partner.displayName)
    )
}

/** "Name (@handle)" for messages to the other side. */
export async function tradeLabel(db: Firestore, scope: TradeScope): Promise<string> {
  const p = (await db.collection(TRADE_PROFILES).doc(tradeKey(scope)).get()).data()
  return p?.handle ? `${p.displayName || 'A business'} (@${p.handle})` : 'A business'
}

/**
 * Server-written feed entry for the other store's owner. Only names and handles, which both
 * sides already see. Failures are logged, never thrown: the connection change has committed.
 */
export async function notifyTradeOwner(
  db: Firestore,
  target: TradeScope,
  input: { type: 'trade_invite' | 'trade_accepted'; title: string; message: string; actorUid: string; connectionId: string }
): Promise<void> {
  try {
    await storeDocRef(db, target.ownerId, target.storeId).collection('notifications').add({
      type: input.type,
      title: input.title,
      message: input.message,
      userId: target.ownerId,
      actorId: input.actorUid,
      recipientUids: [target.ownerId],
      read: false,
      metadata: { connectionId: input.connectionId },
      source: 'trade',
      createdAt: FieldValue.serverTimestamp(),
    })
  } catch (err) {
    console.error(
      JSON.stringify({
        tag: 'trade-notify-failed',
        type: input.type,
        error: err instanceof Error ? err.message : 'unknown',
      })
    )
  }
}
