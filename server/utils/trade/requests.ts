import { FieldValue, Timestamp, type Firestore } from 'firebase-admin/firestore'
import type {
  NewTradeRequestInput,
  TradeReplyInput,
  TradeReplyStatus,
  TradeRequestState,
  TradeRequestView,
  TradeRequestsList,
} from '~/types/trade'
import { DEFAULT_CATEGORY_KIND, inferCategoryKind } from '~/utils/category-kinds'
import { normalizeTradeHandle } from '~/utils/trade-handle'
import { resolveStaffPermissions, type LegacyStaffAccessFields } from '~/utils/staff-permissions'
import { storeDocRef } from '../payments/audit-log'
import { formatNaira } from '../payments/records'
import {
  bankVerifiedKeys,
  connectionId,
  millis,
  readProfiles,
  toCard,
  TRADE_CONNECTIONS,
  TRADE_PROFILES,
  TradeError,
  tradeKey,
  type StoredTradeProfile,
  type TradeScope,
} from './partners'

export const TRADE_REQUESTS = 'tradeRequests'
export const REQUEST_TTL_MS = 48 * 60 * 60 * 1000
/** Closed and expired requests stay listed this long after they expire. */
export const REQUEST_HISTORY_MS = 7 * 24 * 60 * 60 * 1000
export const MAX_REQUEST_RECIPIENTS = 50
const ITEM_MAX = 120
const NOTE_MAX = 280
const REPLY_NOTE_MAX = 200
const QTY_MAX = 100_000
/** ₦1bn per unit. */
const PRICE_MAX_KOBO = 100_000_000_000

interface StoredReply extends TradeReplyInput {
  at: Timestamp
  byUid: string
}

export interface StoredRequest {
  fromKey: string
  fromOwnerUid: string
  fromStoreId: string
  createdByUid: string
  item: string
  quantity: number
  note: string
  categoryKind: string
  recipients: string[]
  status: 'open' | 'closed'
  replies: Record<string, StoredReply>
  createdAt: Timestamp
  expiresAt: Timestamp
  closedAt?: Timestamp | null
}

function cleanText(value: unknown, max: number): string {
  return String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max)
}

function intInRange(value: unknown, min: number, max: number): number | null {
  if (value === null || value === undefined || value === '') return null
  const n = Number(value)
  return Number.isInteger(n) && n >= min && n <= max ? n : NaN
}

function stateOf(req: StoredRequest, now: number): TradeRequestState {
  if (req.status === 'closed') return 'closed'
  return millis(req.expiresAt) <= now ? 'expired' : 'open'
}

async function activePartnerKeys(db: Firestore, me: string): Promise<string[]> {
  const snap = await db.collection(TRADE_CONNECTIONS).where('parties', 'array-contains', me).get()
  return snap.docs
    .map((d) => d.data() as { parties: string[]; status: string })
    .filter((c) => c.status === 'active')
    .map((c) => (c.parties[0] === me ? c.parties[1]! : c.parties[0]!))
}

/** Owner plus active staff who can make sales: the people who ask and answer for stock. */
export async function tradeTeamUids(db: Firestore, scope: TradeScope): Promise<string[]> {
  const snap = await storeDocRef(db, scope.ownerId, scope.storeId).collection('members').get()
  const staff = snap.docs
    .filter((d) => {
      const m = d.data() as LegacyStaffAccessFields & { status?: string }
      return m.status === 'active' && resolveStaffPermissions(m).receipts.create
    })
    .map((d) => d.id)
  return [scope.ownerId, ...staff.filter((u) => u !== scope.ownerId)]
}

export async function notifyTeam(
  db: Firestore,
  target: TradeScope,
  input: {
    type: 'trade_request' | 'trade_reply' | 'trade_sale' | 'trade_paid'
    title: string
    message: string
    actorUid: string
    requestId: string
    saleId?: string
  }
): Promise<void> {
  try {
    const recipientUids = (await tradeTeamUids(db, target)).filter((u) => u !== input.actorUid)
    if (!recipientUids.length) return
    await storeDocRef(db, target.ownerId, target.storeId).collection('notifications').add({
      type: input.type,
      title: input.title,
      message: input.message,
      userId: target.ownerId,
      actorId: input.actorUid,
      recipientUids,
      read: false,
      metadata: { requestId: input.requestId, ...(input.saleId ? { saleId: input.saleId } : {}) },
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

function quantityLabel(item: string, quantity: number): string {
  return quantity > 1 ? `${quantity} × ${item}` : item
}

/** Ask active partners (all, or the named handles) whether they have an item. */
export async function createTradeRequest(
  db: Firestore,
  scope: TradeScope,
  actorUid: string,
  raw: Partial<Record<keyof NewTradeRequestInput, unknown>>,
  now = Date.now()
): Promise<{ id: string }> {
  const me = tradeKey(scope)
  const myProfile = (await db.collection(TRADE_PROFILES).doc(me).get()).data() as
    | StoredTradeProfile
    | undefined
  if (!myProfile?.handle) {
    throw new TradeError('NO_HANDLE', 409, 'Your business needs a trade handle before asking partners.')
  }

  const item = cleanText(raw.item, ITEM_MAX)
  if (item.length < 2) throw new TradeError('INVALID_INPUT', 400, 'Say what you are looking for.')
  const quantity = intInRange(raw.quantity ?? 1, 1, QTY_MAX)
  if (!quantity) throw new TradeError('INVALID_INPUT', 400, `Quantity must be 1 to ${QTY_MAX}.`)
  const note = cleanText(raw.note, NOTE_MAX)

  const partners = await activePartnerKeys(db, me)
  let recipients = partners
  const wanted = Array.isArray(raw.to) ? raw.to.map(normalizeTradeHandle).filter(Boolean) : []
  if (wanted.length) {
    const profiles = await readProfiles(db, partners)
    const byHandle = new Map([...profiles].map(([key, p]) => [p.handle, key]))
    recipients = [...new Set(wanted.map((h) => byHandle.get(h)).filter((k): k is string => !!k))]
    if (recipients.length !== new Set(wanted).size) {
      throw new TradeError('NOT_PARTNER', 400, 'You can only ask businesses that are your partners.')
    }
  }
  if (!recipients.length) {
    throw new TradeError('NO_PARTNERS', 409, 'Add a partner before asking for stock.')
  }
  if (recipients.length > MAX_REQUEST_RECIPIENTS) {
    throw new TradeError(
      'TOO_MANY',
      400,
      `Ask at most ${MAX_REQUEST_RECIPIENTS} partners at once. Choose who to ask.`
    )
  }

  const ref = db.collection(TRADE_REQUESTS).doc()
  await ref.set({
    fromKey: me,
    fromOwnerUid: scope.ownerId,
    fromStoreId: scope.storeId,
    createdByUid: actorUid,
    item,
    quantity,
    note,
    categoryKind: inferCategoryKind(item) ?? DEFAULT_CATEGORY_KIND,
    recipients,
    status: 'open',
    replies: {},
    createdAt: Timestamp.fromMillis(now),
    expiresAt: Timestamp.fromMillis(now + REQUEST_TTL_MS),
    closedAt: null,
  } satisfies StoredRequest)

  const label = `${myProfile.displayName} (@${myProfile.handle})`
  const profiles = await readProfiles(db, recipients)
  await Promise.all(
    [...profiles.values()].map((p) =>
      notifyTeam(db, { ownerId: p.ownerUid, storeId: p.storeId }, {
        type: 'trade_request',
        title: 'Stock request',
        message: `${label} is looking for ${quantityLabel(item, quantity)}.`,
        actorUid,
        requestId: ref.id,
      })
    )
  )
  return { id: ref.id }
}

function parseReply(raw: Partial<Record<keyof TradeReplyInput, unknown>>): TradeReplyInput {
  const status = raw.status as TradeReplyStatus
  if (status !== 'have' && status !== 'dont_have') {
    throw new TradeError('INVALID_INPUT', 400, 'Choose whether you have it.')
  }
  if (status === 'dont_have') return { status, priceKobo: null, quantity: null, note: '' }
  const priceKobo = intInRange(raw.priceKobo, 0, PRICE_MAX_KOBO)
  const quantity = intInRange(raw.quantity, 1, QTY_MAX)
  if (Number.isNaN(priceKobo)) throw new TradeError('INVALID_INPUT', 400, 'Enter a valid price.')
  if (Number.isNaN(quantity)) throw new TradeError('INVALID_INPUT', 400, `Quantity must be 1 to ${QTY_MAX}.`)
  return { status, priceKobo, quantity, note: cleanText(raw.note, REPLY_NOTE_MAX) }
}

/** A recipient answers (or changes their answer) while the request is open and you are still partners. */
export async function replyToTradeRequest(
  db: Firestore,
  scope: TradeScope,
  actorUid: string,
  requestId: string,
  raw: Partial<Record<keyof TradeReplyInput, unknown>>,
  now = Date.now()
): Promise<TradeReplyInput> {
  const me = tradeKey(scope)
  const reply = parseReply(raw)
  const ref = db.collection(TRADE_REQUESTS).doc(requestId)
  const { req, firstHave } = await db.runTransaction(async (tx) => {
    const req = (await tx.get(ref)).data() as StoredRequest | undefined
    if (!req || !req.recipients.includes(me)) throw new TradeError('NOT_FOUND', 404, 'Not found')
    if (stateOf(req, now) !== 'open') {
      throw new TradeError('CLOSED', 409, 'This request has closed.')
    }
    const conn = (await tx.get(db.collection(TRADE_CONNECTIONS).doc(connectionId(me, req.fromKey)))).data()
    if (conn?.status !== 'active') throw new TradeError('NOT_FOUND', 404, 'Not found')
    const before = req.replies?.[me]?.status
    tx.update(ref, {
      [`replies.${me}`]: { ...reply, at: Timestamp.fromMillis(now), byUid: actorUid },
    })
    return { req, firstHave: reply.status === 'have' && before !== 'have' }
  })

  if (firstHave) {
    const mine = (await db.collection(TRADE_PROFILES).doc(me).get()).data() as StoredTradeProfile | undefined
    const price = reply.priceKobo !== null ? ` at ${formatNaira(reply.priceKobo)} each` : ''
    await notifyTeam(db, { ownerId: req.fromOwnerUid, storeId: req.fromStoreId }, {
      type: 'trade_reply',
      title: 'A partner has it',
      message: `${mine?.displayName || 'A partner'} (@${mine?.handle || ''}) has ${req.item}${price}.`,
      actorUid,
      requestId,
    })
  }
  return reply
}

export async function closeTradeRequest(
  db: Firestore,
  scope: TradeScope,
  requestId: string
): Promise<void> {
  const me = tradeKey(scope)
  const ref = db.collection(TRADE_REQUESTS).doc(requestId)
  await db.runTransaction(async (tx) => {
    const req = (await tx.get(ref)).data() as StoredRequest | undefined
    if (!req || req.fromKey !== me) throw new TradeError('NOT_FOUND', 404, 'Not found')
    if (req.status === 'closed') return
    tx.update(ref, { status: 'closed', closedAt: FieldValue.serverTimestamp() })
  })
}

/**
 * Recent requests from this store's side. Incoming requests show only the caller's own reply;
 * outgoing requests show every reply. Requests from a business that is no longer a partner drop out.
 */
export async function listTradeRequests(
  db: Firestore,
  scope: TradeScope,
  now = Date.now()
): Promise<TradeRequestsList> {
  const me = tradeKey(scope)
  const since = Timestamp.fromMillis(now - REQUEST_HISTORY_MS)
  const col = db.collection(TRADE_REQUESTS)
  const [incomingSnap, outgoingSnap, partners] = await Promise.all([
    col.where('recipients', 'array-contains', me).where('expiresAt', '>', since).get(),
    col.where('fromKey', '==', me).where('expiresAt', '>', since).get(),
    activePartnerKeys(db, me),
  ])
  const partnerSet = new Set(partners)
  const incoming = incomingSnap.docs
    .map((d) => ({ id: d.id, req: d.data() as StoredRequest }))
    .filter(({ req }) => partnerSet.has(req.fromKey))
  const outgoing = outgoingSnap.docs.map((d) => ({ id: d.id, req: d.data() as StoredRequest }))

  const keys = new Set<string>([me])
  for (const { req } of incoming) keys.add(req.fromKey)
  for (const { req } of outgoing) for (const k of Object.keys(req.replies ?? {})) keys.add(k)
  const [profiles, verified] = await Promise.all([
    readProfiles(db, [...keys]),
    bankVerifiedKeys(db, [...keys]),
  ])
  const card = (key: string) => toCard(profiles.get(key), verified.has(key))

  const base = (id: string, req: StoredRequest, direction: TradeRequestView['direction']) => {
    const replies = Object.values(req.replies ?? {})
    return {
      id,
      direction,
      item: req.item,
      quantity: req.quantity,
      note: req.note,
      categoryKind: req.categoryKind || DEFAULT_CATEGORY_KIND,
      state: stateOf(req, now),
      createdAtMs: millis(req.createdAt),
      expiresAtMs: millis(req.expiresAt),
      recipientCount: req.recipients.length,
      haveCount: replies.filter((r) => r.status === 'have').length,
      replyCount: replies.length,
    }
  }
  const pickReply = (r: StoredReply): TradeReplyInput => ({
    status: r.status,
    priceKobo: r.priceKobo ?? null,
    quantity: r.quantity ?? null,
    note: r.note || '',
  })
  const newestFirst = (a: TradeRequestView, b: TradeRequestView) =>
    Number(b.state === 'open') - Number(a.state === 'open') || b.createdAtMs - a.createdAtMs

  return {
    incoming: incoming
      .map(({ id, req }) => ({
        ...base(id, req, 'incoming'),
        recipientCount: 0,
        haveCount: 0,
        replyCount: 0,
        from: card(req.fromKey),
        myReply: req.replies?.[me] ? pickReply(req.replies[me]!) : null,
        replies: [],
      }))
      .sort(newestFirst),
    outgoing: outgoing
      .map(({ id, req }) => ({
        ...base(id, req, 'outgoing'),
        from: card(me),
        myReply: null,
        replies: Object.entries(req.replies ?? {})
          .map(([key, r]) => ({ ...pickReply(r), partner: card(key), atMs: millis(r.at) }))
          .sort(
            (a, b) =>
              Number(b.status === 'have') - Number(a.status === 'have') ||
              (a.priceKobo ?? Infinity) - (b.priceKobo ?? Infinity)
          ),
      }))
      .sort(newestFirst),
  }
}
