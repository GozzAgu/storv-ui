import {
  FieldValue,
  Timestamp,
  type DocumentReference,
  type Firestore,
} from 'firebase-admin/firestore'
import type {
  NewTradeLoanInput,
  TradeLendBlocker,
  TradeLoanEventAction,
  TradeLoanLineState,
  TradeLoanView,
} from '~/types/trade'
import type { PaymentLinkV2 } from '~/types/payments-v2'
import type { InventoryFolder } from '~/stores/inventory'
import { folderHasSerialNumbers } from '~/utils/receipt-multi-folder'
import { assertDocId, type PaymentsAccess } from '../payments/access'
import { storeDocRef } from '../payments/audit-log'
import { hashLinkToken } from '../payments/link-token'
import {
  createPaymentLink,
  LINKS_COLLECTION,
  normalizeOwnerPlan,
  startCheckout,
  type StartCheckoutDeps,
} from '../payments/links'
import { formatNaira } from '../payments/records'
import {
  bankVerifiedKeys,
  connectionId,
  keyForHandle,
  millis,
  readProfiles,
  toCard,
  TRADE_CONNECTIONS,
  TradeError,
  tradeKey,
  type TradeScope,
} from './partners'
import { notifyTeam, TRADE_REQUESTS, type StoredRequest } from './requests'

export const TRADE_LOANS = 'tradeLoans'
/** Inventory rows lent to a partner carry `sellerLoanOutId: trade~<loan id>`. */
export const PARTNER_LOAN_FLAG_PREFIX = 'trade~'
export const MAX_LOAN_LINES = 50
export const MAX_LOAN_DAYS = 90
/** A started payment stays open this long; the borrower can resume it until then. */
export const LOAN_PAY_LINK_HOURS = 24
/** Overdue reminders repeat this often until the loan is settled. */
export const LOAN_REMINDER_EVERY_MS = 3 * 24 * 60 * 60 * 1000
/** Settled loans stay listed this long after they were created. */
const LOAN_HISTORY_MS = 90 * 24 * 60 * 60 * 1000
const MAX_EVENTS = 200
const MAX_LIST = 100
/** ₦1bn per unit. */
const PRICE_MAX_KOBO = 100_000_000_000
const DAY_MS = 24 * 60 * 60 * 1000
const SYSTEM_TRADE_UID = 'system:trade'

type StoredLineState = 'out' | 'return_marked' | 'returned' | 'paid'

interface StoredLoanLine {
  id: string
  itemId: string
  folderId: string
  name: string
  serial: string
  priceKobo: number
  state: StoredLineState
  /** Lender-side sale created when the borrower started paying for this line. */
  payReceiptId: string | null
  payLinkId: string | null
  /** SHA-256 of the link token; checkout takes the hash, so the token itself is never stored. */
  payTokenHash: string | null
  settledAt: Timestamp | null
}

interface StoredLoanEvent {
  at: Timestamp
  by: 'lender' | 'borrower' | 'system'
  byUid: string
  action: TradeLoanEventAction
  lineIds: string[]
}

interface StoredLoan {
  lenderKey: string
  lenderOwnerUid: string
  lenderStoreId: string
  borrowerKey: string
  borrowerOwnerUid: string
  borrowerStoreId: string
  requestId: string | null
  status: 'active' | 'settled'
  createdAt: Timestamp
  createdByUid: string
  dueAt: Timestamp
  lines: StoredLoanLine[]
  events: StoredLoanEvent[]
  /** Every link ever started on this loan, so a paid link finds its loan. */
  payLinkIds: string[]
  lastRemindedAt: Timestamp | null
}

export const partnerLoanFlag = (loanId: string) => `${PARTNER_LOAN_FLAG_PREFIX}${loanId}`

const LOAN_ID = /^[A-Za-z0-9_-]{1,260}~[A-Za-z0-9_-]{1,128}$/
const DUE_DATE = /^\d{4}-\d{2}-\d{2}$/

const SETTLED: ReadonlySet<StoredLineState> = new Set(['returned', 'paid'])
const isSettled = (loan: Pick<StoredLoan, 'lines'>) => loan.lines.every((l) => SETTLED.has(l.state))

function text(v: unknown, max: number): string {
  return typeof v === 'string' ? v.replace(/\s+/g, ' ').trim().slice(0, max) : ''
}

function firstText(data: Record<string, unknown>, keys: string[], max: number): string {
  for (const k of keys) {
    const v = text(data[k], max)
    if (v) return v
  }
  return ''
}

const itemName = (d: Record<string, unknown>) =>
  firstText(d, ['name', 'Name', 'itemName', 'productName', 'title'], 120) || 'Item'
const itemSerial = (d: Record<string, unknown>) =>
  firstText(d, ['serialNo', 'serialNumber', 'imei', 'IMEI', 'serial'], 80)

const isLinkLive = (link: PaymentLinkV2 | undefined, nowMs: number) =>
  !!link && link.status === 'active' && Date.parse(link.expiresAt) > nowMs

function lineState(
  line: StoredLoanLine,
  links: Map<string, PaymentLinkV2 | undefined>,
  nowMs: number
): TradeLoanLineState {
  if (line.state !== 'out' || !line.payLinkId) return line.state
  const link = links.get(line.payLinkId)
  if (link?.status === 'paid') return 'paid'
  return isLinkLive(link, nowMs) ? 'paying' : 'out'
}

async function readLinks(db: Firestore, ids: string[]) {
  const unique = [...new Set(ids.filter(Boolean))]
  const map = new Map<string, PaymentLinkV2 | undefined>()
  if (!unique.length) return map
  const snaps = await db.getAll(...unique.map((id) => db.collection(LINKS_COLLECTION).doc(id)))
  for (const s of snaps) map.set(s.id, s.data() as PaymentLinkV2 | undefined)
  return map
}

function event(
  by: StoredLoanEvent['by'],
  byUid: string,
  action: TradeLoanEventAction,
  lineIds: string[],
  at: Date
): StoredLoanEvent {
  return { at: Timestamp.fromDate(at), by, byUid, action, lineIds }
}

const withEvent = (loan: StoredLoan, ev: StoredLoanEvent) => [...loan.events, ev].slice(-MAX_EVENTS)

const units = (n: number) => `${n} item${n === 1 ? '' : 's'}`

async function ownerPlan(db: Firestore, ownerUid: string): Promise<string> {
  return normalizeOwnerPlan((await db.collection('users').doc(ownerUid).get()).data()?.subscription)
}

/** Lending to partners is Enterprise, like Stock loans. The borrower can be on any plan. */
export async function tradeLendBlocker(
  db: Firestore,
  scope: TradeScope
): Promise<TradeLendBlocker | null> {
  return (await ownerPlan(db, scope.ownerId)) === 'storvv_enterprise' ? null : 'no_plan'
}

/** Activity log entry in a store, when its plan keeps one. Never throws. */
async function logActivity(
  db: Firestore,
  scope: TradeScope,
  entry: {
    userId: string
    userDisplayName: string
    action: 'created' | 'updated'
    loanId: string
    text: string
  }
): Promise<void> {
  try {
    if ((await ownerPlan(db, scope.ownerId)) === 'storvv_micro') return
    await storeDocRef(db, scope.ownerId, scope.storeId)
      .collection('activityLogs')
      .add({
        userId: entry.userId,
        userDisplayName: entry.userDisplayName.slice(0, 80),
        action: entry.action,
        entityType: 'items_batch',
        entityId: entry.loanId,
        entityName: entry.text.slice(0, 300),
        storeId: scope.storeId,
        createdAt: FieldValue.serverTimestamp(),
      })
  } catch (err) {
    console.error(
      JSON.stringify({
        tag: 'trade-loan-activity-log-failed',
        error: err instanceof Error ? err.message : 'unknown',
      })
    )
  }
}

async function actorName(db: Firestore, uid: string): Promise<string> {
  const data =
    (
      await db
        .collection('users')
        .doc(uid)
        .get()
        .catch(() => null)
    )?.data() ?? {}
  return (
    text(data.displayName, 80) ||
    [text(data.firstName, 40), text(data.lastName, 40)].filter(Boolean).join(' ') ||
    'Team member'
  )
}

const lenderScope = (loan: StoredLoan): TradeScope => ({
  ownerId: loan.lenderOwnerUid,
  storeId: loan.lenderStoreId,
})
const borrowerScope = (loan: StoredLoan): TradeScope => ({
  ownerId: loan.borrowerOwnerUid,
  storeId: loan.borrowerStoreId,
})

/** The lender's end of the due date, in Lagos time. */
function parseDueDate(raw: unknown, now: Date): Timestamp {
  const s = typeof raw === 'string' ? raw.trim() : ''
  const ms = DUE_DATE.test(s) ? Date.parse(`${s}T23:59:59.999+01:00`) : NaN
  if (!Number.isFinite(ms) || ms < now.getTime() || ms > now.getTime() + MAX_LOAN_DAYS * DAY_MS) {
    throw new TradeError(
      'INVALID_DUE_DATE',
      400,
      `Choose a due date between today and ${MAX_LOAN_DAYS} days from now.`
    )
  }
  return Timestamp.fromMillis(ms)
}

function parseLines(raw: unknown): { itemId: string; folderId: string; priceKobo: number }[] {
  if (!Array.isArray(raw) || !raw.length || raw.length > MAX_LOAN_LINES) {
    throw new TradeError('INVALID_LINES', 400, `Choose between 1 and ${MAX_LOAN_LINES} items.`)
  }
  const seen = new Set<string>()
  return raw.map((r) => {
    const line = (r ?? {}) as Record<string, unknown>
    const itemId = assertDocId(line.itemId, 'itemId')
    const folderId = assertDocId(line.folderId, 'folderId')
    const priceKobo = Number(line.priceKobo)
    if (!Number.isSafeInteger(priceKobo) || priceKobo <= 0 || priceKobo > PRICE_MAX_KOBO) {
      throw new TradeError('INVALID_PRICE', 400, 'Every item needs an agreed price.')
    }
    if (seen.has(itemId)) throw new TradeError('INVALID_LINES', 400, 'An item is listed twice.')
    seen.add(itemId)
    return { itemId, folderId, priceKobo }
  })
}

/**
 * Lends serial items to an active partner at agreed prices until a due date. The items stay in
 * the lender's inventory, flagged `trade~<loan id>` so they cannot be sold or lent again, and the
 * loan is shown to both businesses.
 */
export async function createTradeLoan(
  db: Firestore,
  scope: TradeScope,
  actorUid: string,
  raw: Partial<Record<keyof NewTradeLoanInput, unknown>>,
  now = new Date()
): Promise<{ id: string }> {
  const me = tradeKey(scope)
  if (await tradeLendBlocker(db, scope)) {
    throw new TradeError('PLAN_REQUIRED', 403, 'Lending to partners is on the Enterprise plan.')
  }
  const them = await keyForHandle(db, raw.to)
  if (them === me) throw new TradeError('NOT_FOUND', 404, 'Not found')
  const conn = (await db.collection(TRADE_CONNECTIONS).doc(connectionId(me, them)).get()).data()
  if (conn?.status !== 'active')
    throw new TradeError('NOT_PARTNERS', 409, 'You can only lend to an active partner.')

  let requestId: string | null = null
  if (raw.requestId !== null && raw.requestId !== undefined && raw.requestId !== '') {
    requestId = assertDocId(raw.requestId, 'requestId')
    const req = (await db.collection(TRADE_REQUESTS).doc(requestId).get()).data() as
      | StoredRequest
      | undefined
    if (!req || !req.recipients.includes(me) || req.fromKey !== them) {
      throw new TradeError('NOT_FOUND', 404, 'Not found')
    }
  }
  const dueAt = parseDueDate(raw.dueDate, now)
  const wanted = parseLines(raw.lines)

  const profiles = await readProfiles(db, [them, me])
  const borrower = profiles.get(them)
  if (!borrower) throw new TradeError('NOT_FOUND', 404, 'Not found')
  const borrowerName = borrower.displayName || 'Partner'

  const store = storeDocRef(db, scope.ownerId, scope.storeId)
  const ref = db.collection(TRADE_LOANS).doc(`${me}~${db.collection(TRADE_LOANS).doc().id}`)
  const flag = partnerLoanFlag(ref.id)

  await db.runTransaction(async (tx) => {
    const folderIds = [...new Set(wanted.map((l) => l.folderId))]
    const [folderSnaps, itemSnaps] = await Promise.all([
      tx.getAll(...folderIds.map((id) => store.collection('inventoryFolders').doc(id))),
      tx.getAll(...wanted.map((l) => store.collection('inventoryItems').doc(l.itemId))),
    ])
    const folders = new Map(folderSnaps.map((s) => [s.id, s.data() as InventoryFolder | undefined]))
    const lines: StoredLoanLine[] = wanted.map((w, i) => {
      const snap = itemSnaps[i]!
      const data = (snap.data() ?? {}) as Record<string, unknown>
      const folder = folders.get(w.folderId)
      if (!snap.exists || !folder || (data.folderId && data.folderId !== w.folderId)) {
        throw new TradeError(
          'ITEM_NOT_FOUND',
          404,
          'One of these items is no longer in your inventory.'
        )
      }
      if (!folderHasSerialNumbers(folder)) {
        throw new TradeError(
          'NOT_SERIAL',
          409,
          'Only items from serial-number categories can be lent to partners.'
        )
      }
      const name = itemName(data)
      if (data.dateOut) throw new TradeError('ITEM_UNAVAILABLE', 409, `${name} is already sold.`)
      if (text(data.pendingSaleReceiptId, 200)) {
        throw new TradeError(
          'ITEM_UNAVAILABLE',
          409,
          `${name} is held for a sale awaiting payment.`
        )
      }
      if (text(data.sellerLoanOutId, 300)) {
        throw new TradeError('ITEM_UNAVAILABLE', 409, `${name} is already out on a loan.`)
      }
      return {
        id: `l${i + 1}`,
        itemId: w.itemId,
        folderId: w.folderId,
        name,
        serial: itemSerial(data),
        priceKobo: w.priceKobo,
        state: 'out',
        payReceiptId: null,
        payLinkId: null,
        payTokenHash: null,
        settledAt: null,
      }
    })
    const loan: StoredLoan = {
      lenderKey: me,
      lenderOwnerUid: scope.ownerId,
      lenderStoreId: scope.storeId,
      borrowerKey: them,
      borrowerOwnerUid: borrower.ownerUid,
      borrowerStoreId: borrower.storeId,
      requestId,
      status: 'active',
      createdAt: Timestamp.fromDate(now),
      createdByUid: actorUid,
      dueAt,
      lines,
      events: [
        event(
          'lender',
          actorUid,
          'lent',
          lines.map((l) => l.id),
          now
        ),
      ],
      payLinkIds: [],
      lastRemindedAt: null,
    }
    tx.create(ref, loan)
    for (const snap of itemSnaps) {
      tx.update(snap.ref, {
        sellerLoanOutId: flag,
        sellerLoanPartyName: borrowerName,
        sellerLoanPartyPhone: '',
        sellerLoanOutAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      })
    }
  })

  const lenderName = profiles.get(me)?.displayName || 'A partner'
  const due = dueLabel(dueAt.toMillis())
  await Promise.all([
    notifyTeam(
      db,
      { ownerId: borrower.ownerUid, storeId: borrower.storeId },
      {
        type: 'trade_loan',
        title: 'Stock lent to you',
        message: `${lenderName} lent you ${units(wanted.length)}, due back ${due}.`,
        actorUid,
        requestId,
        loanId: ref.id,
      }
    ),
    logActivity(db, scope, {
      userId: actorUid,
      userDisplayName: await actorName(db, actorUid),
      action: 'created',
      loanId: ref.id,
      text: `Lent ${units(wanted.length)} to partner ${borrowerName}, due ${due}`,
    }),
    logActivity(
      db,
      { ownerId: borrower.ownerUid, storeId: borrower.storeId },
      {
        userId: SYSTEM_TRADE_UID,
        userDisplayName: `${lenderName} (partner)`,
        action: 'created',
        loanId: ref.id,
        text: `Borrowed ${units(wanted.length)} from partner ${lenderName}, due ${due}`,
      }
    ),
  ])
  return { id: ref.id }
}

const dueFormat = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  timeZone: 'Africa/Lagos',
})
const dueLabel = (ms: number) => dueFormat.format(ms)

function toView(
  id: string,
  loan: StoredLoan,
  me: string,
  links: Map<string, PaymentLinkV2 | undefined>,
  partner: TradeLoanView['partner'],
  nowMs: number
): TradeLoanView {
  const lines = loan.lines.map((l) => ({
    id: l.id,
    name: l.name,
    serial: l.serial,
    priceKobo: l.priceKobo,
    state: lineState(l, links, nowMs),
  }))
  const settled = lines.every((l) => l.state === 'returned' || l.state === 'paid')
  const dueAtMs = millis(loan.dueAt)
  return {
    id,
    direction: loan.lenderKey === me ? 'lent' : 'borrowed',
    partner,
    requestId: loan.requestId,
    createdAtMs: millis(loan.createdAt),
    dueAtMs,
    settled,
    overdue: !settled && dueAtMs < nowMs,
    outstandingKobo: lines
      .filter((l) => l.state !== 'returned' && l.state !== 'paid')
      .reduce((n, l) => n + l.priceKobo, 0),
    lines,
    events: loan.events.map((e) => ({
      atMs: millis(e.at),
      by: e.by,
      action: e.action,
      lineIds: e.lineIds,
    })),
  }
}

/** Loans from both sides: every open one, plus settled ones from the last 90 days. */
export async function listTradeLoans(
  db: Firestore,
  scope: TradeScope,
  now = Date.now()
): Promise<TradeLoanView[]> {
  const me = tradeKey(scope)
  const since = Timestamp.fromMillis(now - LOAN_HISTORY_MS)
  const col = db.collection(TRADE_LOANS)
  const snaps = await Promise.all(
    (['lenderKey', 'borrowerKey'] as const).flatMap((field) => [
      col.where(field, '==', me).where('status', '==', 'active').limit(MAX_LIST).get(),
      col.where(field, '==', me).where('createdAt', '>', since).limit(MAX_LIST).get(),
    ])
  )
  const byId = new Map<string, StoredLoan>()
  for (const snap of snaps) for (const d of snap.docs) byId.set(d.id, d.data() as StoredLoan)
  if (!byId.size) return []

  const loans = [...byId.entries()]
  const links = await readLinks(
    db,
    loans.flatMap(([, l]) => l.lines.map((line) => line.payLinkId ?? ''))
  )
  const others = [
    ...new Set(loans.map(([, l]) => (l.lenderKey === me ? l.borrowerKey : l.lenderKey))),
  ]
  const [profiles, verified] = await Promise.all([
    readProfiles(db, others),
    bankVerifiedKeys(db, others),
  ])
  return loans
    .map(([id, loan]) => {
      const other = loan.lenderKey === me ? loan.borrowerKey : loan.lenderKey
      return toView(id, loan, me, links, toCard(profiles.get(other), verified.has(other)), now)
    })
    .sort((a, b) => Number(a.settled) - Number(b.settled) || a.dueAtMs - b.dueAtMs)
}

async function loanFor(db: Firestore, scope: TradeScope, rawId: unknown) {
  if (typeof rawId !== 'string' || !LOAN_ID.test(rawId)) {
    throw new TradeError('NOT_FOUND', 404, 'Not found')
  }
  const me = tradeKey(scope)
  const ref = db.collection(TRADE_LOANS).doc(rawId)
  const loan = (await ref.get()).data() as StoredLoan | undefined
  if (!loan || (loan.lenderKey !== me && loan.borrowerKey !== me)) {
    throw new TradeError('NOT_FOUND', 404, 'Not found')
  }
  return { ref, loan, side: loan.lenderKey === me ? ('lender' as const) : ('borrower' as const) }
}

function pickLineIds(loan: StoredLoan, raw: unknown): string[] {
  if (!Array.isArray(raw) || !raw.length || raw.length > MAX_LOAN_LINES) {
    throw new TradeError('INVALID_LINES', 400, 'Choose the items first.')
  }
  const known = new Set(loan.lines.map((l) => l.id))
  const ids = [...new Set(raw)]
  if (!ids.every((id): id is string => typeof id === 'string' && known.has(id))) {
    throw new TradeError('INVALID_LINES', 400, 'Choose the items first.')
  }
  return ids
}

/**
 * Returns: the borrower says items are back (`return_marked`); the lender confirms, which puts
 * them back in stock. The lender may also confirm without the borrower marking first. Items with
 * a payment under way cannot be returned until it finishes or expires.
 */
export async function returnTradeLoanItems(
  db: Firestore,
  scope: TradeScope,
  actorUid: string,
  raw: { loanId: unknown; lineIds: unknown },
  now = new Date()
): Promise<{ side: 'lender' | 'borrower' }> {
  const { ref, loan: first, side } = await loanFor(db, scope, raw.loanId)
  const lineIds = pickLineIds(first, raw.lineIds)
  const nowMs = now.getTime()
  let settledNow = false

  await db.runTransaction(async (tx) => {
    const loan = (await tx.get(ref)).data() as StoredLoan
    const chosen = loan.lines.filter((l) => lineIds.includes(l.id))
    const linkSnaps = await Promise.all(
      chosen
        .filter((l) => l.payLinkId)
        .map((l) => tx.get(db.collection(LINKS_COLLECTION).doc(l.payLinkId!)))
    )
    const links = new Map(linkSnaps.map((s) => [s.id, s.data() as PaymentLinkV2 | undefined]))
    const allowed: StoredLineState[] = side === 'lender' ? ['out', 'return_marked'] : ['out']
    for (const line of chosen) {
      const state = lineState(line, links, nowMs)
      if (state === 'paying') {
        throw new TradeError('PAYING', 409, `A payment for ${line.name} is in progress.`)
      }
      if (!allowed.includes(line.state) || state === 'paid') {
        throw new TradeError('LINE_SETTLED', 409, `${line.name} is already settled.`)
      }
    }

    const store = storeDocRef(db, loan.lenderOwnerUid, loan.lenderStoreId)
    const itemSnaps =
      side === 'lender'
        ? await tx.getAll(...chosen.map((l) => store.collection('inventoryItems').doc(l.itemId)))
        : []

    const target: StoredLineState = side === 'lender' ? 'returned' : 'return_marked'
    const lines = loan.lines.map((l) =>
      lineIds.includes(l.id)
        ? { ...l, state: target, settledAt: target === 'returned' ? Timestamp.fromDate(now) : null }
        : l
    )
    settledNow = side === 'lender' && isSettled({ lines })
    tx.update(ref, {
      lines,
      events: withEvent(
        loan,
        event(side, actorUid, side === 'lender' ? 'returned' : 'return_marked', lineIds, now)
      ),
      ...(settledNow ? { status: 'settled' } : {}),
    })

    const flag = partnerLoanFlag(ref.id)
    itemSnaps.forEach((snap, i) => {
      const data = snap.data()
      if (!snap.exists || data?.sellerLoanOutId !== flag) return
      const update: Record<string, unknown> = {
        sellerLoanOutId: FieldValue.delete(),
        sellerLoanPartyName: FieldValue.delete(),
        sellerLoanPartyPhone: FieldValue.delete(),
        sellerLoanOutAt: FieldValue.delete(),
        updatedAt: FieldValue.serverTimestamp(),
      }
      const payReceiptId = chosen[i]!.payReceiptId
      if (payReceiptId && data.pendingSaleReceiptId === payReceiptId) {
        update.pendingSaleReceiptId = FieldValue.delete()
        update.pendingSaleAt = FieldValue.delete()
      }
      tx.update(snap.ref, update)
    })
  })

  const profiles = await readProfiles(db, [first.lenderKey, first.borrowerKey])
  const lenderName = profiles.get(first.lenderKey)?.displayName || 'Your partner'
  const borrowerName = profiles.get(first.borrowerKey)?.displayName || 'Your partner'
  const count = units(lineIds.length)
  if (side === 'borrower') {
    await notifyTeam(db, lenderScope(first), {
      type: 'trade_loan',
      title: 'Items coming back',
      message: `${borrowerName} says ${count} you lent them ${
        lineIds.length === 1 ? 'is' : 'are'
      } back. Confirm when you have ${lineIds.length === 1 ? 'it' : 'them'}.`,
      actorUid,
      requestId: first.requestId,
      loanId: ref.id,
    })
    await logActivity(db, scope, {
      userId: actorUid,
      userDisplayName: await actorName(db, actorUid),
      action: 'updated',
      loanId: ref.id,
      text: `Marked ${count} borrowed from ${lenderName} as returned`,
    })
  } else {
    await Promise.all([
      notifyTeam(db, borrowerScope(first), {
        type: 'trade_loan',
        title: settledNow ? 'Loan settled' : 'Return confirmed',
        message: `${lenderName} confirmed ${count} ${lineIds.length === 1 ? 'is' : 'are'} back.${
          settledNow ? ' Nothing more is owed on this loan.' : ''
        }`,
        actorUid,
        requestId: first.requestId,
        loanId: ref.id,
      }),
      logActivity(db, scope, {
        userId: actorUid,
        userDisplayName: await actorName(db, actorUid),
        action: 'updated',
        loanId: ref.id,
        text: `Partner loan to ${borrowerName}: ${count} returned to stock`,
      }),
      logActivity(db, borrowerScope(first), {
        userId: SYSTEM_TRADE_UID,
        userDisplayName: `${lenderName} (partner)`,
        action: 'updated',
        loanId: ref.id,
        text: `${lenderName} confirmed ${count} returned`,
      }),
    ])
  }
  return { side }
}

/** Payments V2 rules for links created on the lender's behalf when the borrower pays. */
function lenderLinkAccess(loan: StoredLoan): PaymentsAccess {
  return {
    ownerId: loan.lenderOwnerUid,
    storeId: loan.lenderStoreId,
    isOwner: false,
    actor: { uid: SYSTEM_TRADE_UID, name: 'Partner loan', role: 'system', canManageLinks: true },
    canRecord: true,
    canView: false,
    canConfirm: false,
    canRefund: false,
  }
}

function payReceiptNumber(now: Date): string {
  return `PL-${now.getTime().toString(36).toUpperCase().slice(-6)}${Math.random()
    .toString(36)
    .toUpperCase()
    .slice(2, 4)}`
}

/**
 * The borrower sold some items and pays the lender for them. The server records a balance-due
 * sale in the lender's store for those items at the agreed prices, puts a payment link on it
 * (paid to the lender's payout account) and starts a checkout to the borrower's own email. When
 * Paystack confirms, the lender's items are marked sold and the lines settle.
 */
export async function startTradeLoanPayment(
  db: Firestore,
  scope: TradeScope,
  actorUid: string,
  email: string | undefined,
  raw: { loanId: unknown; lineIds: unknown },
  deps: StartCheckoutDeps & { env: NodeJS.ProcessEnv; now?: Date }
): Promise<{ authorizationUrl: string }> {
  const { ref, loan: first, side } = await loanFor(db, scope, raw.loanId)
  if (side !== 'borrower') throw new TradeError('NOT_FOUND', 404, 'Not found')
  if (!email) throw new TradeError('NO_EMAIL', 409, 'Your account needs an email address to pay.')
  const lineIds = pickLineIds(first, raw.lineIds)
  const now = deps.now ?? new Date()
  const nowMs = now.getTime()

  // Resume: every chosen line is on the same live link.
  const chosenFirst = first.lines.filter((l) => lineIds.includes(l.id))
  const firstLinks = await readLinks(
    db,
    chosenFirst.map((l) => l.payLinkId ?? '')
  )
  const live = chosenFirst.filter((l) => lineState(l, firstLinks, nowMs) === 'paying')
  if (live.length) {
    const linkId = live[0]!.payLinkId
    const sameLink = live.length === chosenFirst.length && live.every((l) => l.payLinkId === linkId)
    const hash = live[0]!.payTokenHash
    if (!sameLink || !hash) {
      throw new TradeError('PAYING', 409, 'Some of these items already have a payment in progress.')
    }
    const { authorizationUrl } = await startCheckout(db, hash, { email }, deps)
    return { authorizationUrl }
  }

  const store = storeDocRef(db, first.lenderOwnerUid, first.lenderStoreId)
  const receiptRef = store.collection('receipts').doc()
  const flag = partnerLoanFlag(ref.id)
  const borrower = (await readProfiles(db, [first.borrowerKey])).get(first.borrowerKey)

  await db.runTransaction(async (tx) => {
    const loan = (await tx.get(ref)).data() as StoredLoan
    const chosen = loan.lines.filter((l) => lineIds.includes(l.id))
    const linkSnaps = await Promise.all(
      chosen
        .filter((l) => l.payLinkId)
        .map((l) => tx.get(db.collection(LINKS_COLLECTION).doc(l.payLinkId!)))
    )
    const links = new Map(linkSnaps.map((s) => [s.id, s.data() as PaymentLinkV2 | undefined]))
    for (const line of chosen) {
      if (line.state !== 'out' || lineState(line, links, nowMs) !== 'out') {
        throw new TradeError('LINE_SETTLED', 409, `${line.name} is already settled or being paid.`)
      }
    }
    const itemSnaps = await tx.getAll(
      ...chosen.map((l) => store.collection('inventoryItems').doc(l.itemId))
    )
    itemSnaps.forEach((snap, i) => {
      const data = snap.data() ?? {}
      const line = chosen[i]!
      const pending = text(data.pendingSaleReceiptId, 200)
      if (
        !snap.exists ||
        data.sellerLoanOutId !== flag ||
        data.dateOut ||
        (pending && pending !== line.payReceiptId)
      ) {
        throw new TradeError(
          'LENDER_RECORD_CHANGED',
          409,
          `Your partner's record for ${line.name} has changed. Ask them to check the loan.`
        )
      }
    })

    const total = chosen.reduce((n, l) => n + l.priceKobo, 0) / 100
    const folderIds = [...new Set(chosen.map((l) => l.folderId))]
    tx.create(receiptRef, {
      receiptNumber: payReceiptNumber(now),
      customerName: borrower?.displayName || 'Partner',
      customerEmail: '',
      date: Timestamp.fromDate(now),
      items: chosen.map((l) => ({
        itemId: l.itemId,
        folderId: l.folderId,
        quantity: 1,
        price: l.priceKobo / 100,
        itemName: l.name,
        ...(l.serial ? { serialNo: l.serial } : {}),
      })),
      itemsCount: chosen.length,
      total,
      paymentMethod: 'Payment link',
      status: 'balance_due',
      amountPaid: 0,
      balanceDue: total,
      payments: [],
      paymentsV2: true,
      notes: `Partner loan: sold by @${borrower?.handle || 'partner'}`,
      hasSerialNumbers: true,
      folderId: folderIds.length === 1 ? folderIds[0] : '',
      folderIds,
      itemIds: chosen.map((l) => l.itemId),
      storeId: loan.lenderStoreId,
      source: 'trade_loan',
      tradeLoanId: ref.id,
      createdByUserName: 'Partner loan',
      createdBy: loan.lenderOwnerUid,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    })
    for (const snap of itemSnaps) {
      tx.update(snap.ref, {
        pendingSaleReceiptId: receiptRef.id,
        pendingSaleAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      })
    }
    tx.update(ref, {
      lines: loan.lines.map((l) =>
        lineIds.includes(l.id)
          ? { ...l, payReceiptId: receiptRef.id, payLinkId: null, payTokenHash: null }
          : l
      ),
    })
  })

  let link: Awaited<ReturnType<typeof createPaymentLink>>
  try {
    link = await createPaymentLink(
      db,
      lenderLinkAccess(first),
      { receiptId: receiptRef.id, expiresInHours: LOAN_PAY_LINK_HOURS },
      { env: deps.env, appOrigin: deps.appOrigin, now }
    )
  } catch (err) {
    await undoPayStart(db, ref, receiptRef.id, lineIds).catch((undoErr) =>
      console.error(
        JSON.stringify({
          tag: 'trade-loan-pay-undo-failed',
          loanId: ref.id,
          error: undoErr instanceof Error ? undoErr.message : 'unknown',
        })
      )
    )
    throw err
  }
  const token = link.url.slice(link.url.lastIndexOf('/') + 1)
  const tokenHash = hashLinkToken(token)
  await db.runTransaction(async (tx) => {
    const loan = (await tx.get(ref)).data() as StoredLoan
    tx.update(ref, {
      lines: loan.lines.map((l) =>
        lineIds.includes(l.id) && l.payReceiptId === receiptRef.id
          ? { ...l, payLinkId: link.linkId, payTokenHash: tokenHash }
          : l
      ),
      payLinkIds: FieldValue.arrayUnion(link.linkId),
      events: withEvent(loan, event('borrower', actorUid, 'pay_started', lineIds, now)),
    })
  })

  const { authorizationUrl } = await startCheckout(db, tokenHash, { email }, deps)
  return { authorizationUrl }
}

/** The link could not be created: remove the sale and holds it was for. */
async function undoPayStart(
  db: Firestore,
  ref: DocumentReference,
  receiptId: string,
  lineIds: string[]
): Promise<void> {
  await db.runTransaction(async (tx) => {
    const loan = (await tx.get(ref)).data() as StoredLoan
    const store = storeDocRef(db, loan.lenderOwnerUid, loan.lenderStoreId)
    const chosen = loan.lines.filter((l) => lineIds.includes(l.id))
    const itemSnaps = await tx.getAll(
      ...chosen.map((l) => store.collection('inventoryItems').doc(l.itemId))
    )
    for (const snap of itemSnaps) {
      if (snap.data()?.pendingSaleReceiptId !== receiptId) continue
      tx.update(snap.ref, {
        pendingSaleReceiptId: FieldValue.delete(),
        pendingSaleAt: FieldValue.delete(),
        updatedAt: FieldValue.serverTimestamp(),
      })
    }
    tx.delete(store.collection('receipts').doc(receiptId))
    tx.update(ref, {
      lines: loan.lines.map((l) =>
        l.payReceiptId === receiptId
          ? { ...l, payReceiptId: null, payLinkId: null, payTokenHash: null }
          : l
      ),
    })
  })
}

/**
 * Called after a link payment is applied (the lender's items are already marked sold by the
 * stock commit). Settles the loan lines that link paid for and tells both sides. Never throws.
 */
export async function settleTradeLoanPayment(
  db: Firestore,
  linkId: string,
  now = new Date()
): Promise<void> {
  try {
    const snap = await db
      .collection(TRADE_LOANS)
      .where('payLinkIds', 'array-contains', linkId)
      .limit(1)
      .get()
    const doc = snap.docs[0]
    if (!doc) return
    let paidIds: string[] = []
    let settledNow = false
    let amountKobo = 0
    await db.runTransaction(async (tx) => {
      const [loanSnap, linkSnap] = await Promise.all([
        tx.get(doc.ref),
        tx.get(db.collection(LINKS_COLLECTION).doc(linkId)),
      ])
      const loan = loanSnap.data() as StoredLoan
      if ((linkSnap.data() as PaymentLinkV2 | undefined)?.status !== 'paid') return
      paidIds = loan.lines
        .filter((l) => l.payLinkId === linkId && l.state !== 'paid')
        .map((l) => l.id)
      if (!paidIds.length) return
      amountKobo = loan.lines
        .filter((l) => paidIds.includes(l.id))
        .reduce((n, l) => n + l.priceKobo, 0)
      const lines = loan.lines.map((l) =>
        paidIds.includes(l.id)
          ? { ...l, state: 'paid' as const, settledAt: Timestamp.fromDate(now) }
          : l
      )
      settledNow = isSettled({ lines })
      tx.update(doc.ref, {
        lines,
        events: withEvent(loan, event('system', 'system:paystack', 'paid', paidIds, now)),
        ...(settledNow ? { status: 'settled' } : {}),
      })
    })
    if (!paidIds.length) return

    const loan = doc.data() as StoredLoan
    const profiles = await readProfiles(db, [loan.lenderKey, loan.borrowerKey])
    const lenderName = profiles.get(loan.lenderKey)?.displayName || 'your partner'
    const borrowerName = profiles.get(loan.borrowerKey)?.displayName || 'Your partner'
    const count = units(paidIds.length)
    const done = settledNow ? ' The loan is settled.' : ''
    await Promise.all([
      notifyTeam(db, lenderScope(loan), {
        type: 'trade_loan',
        title: 'Loan payment received',
        message: `${borrowerName} paid ${formatNaira(amountKobo)} for ${count} they sold.${done}`,
        actorUid: 'system:paystack',
        requestId: loan.requestId,
        loanId: doc.id,
      }),
      notifyTeam(db, borrowerScope(loan), {
        type: 'trade_loan',
        title: 'Payment sent',
        message: `Your payment of ${formatNaira(
          amountKobo
        )} to ${lenderName} for ${count} went through.${done}`,
        actorUid: 'system:paystack',
        requestId: loan.requestId,
        loanId: doc.id,
      }),
      logActivity(db, lenderScope(loan), {
        userId: 'system:paystack',
        userDisplayName: 'Paystack',
        action: 'updated',
        loanId: doc.id,
        text: `Partner loan to ${borrowerName}: ${count} sold and paid (${formatNaira(
          amountKobo
        )})`,
      }),
      logActivity(db, borrowerScope(loan), {
        userId: 'system:paystack',
        userDisplayName: 'Paystack',
        action: 'updated',
        loanId: doc.id,
        text: `Paid ${lenderName} ${formatNaira(amountKobo)} for ${count} borrowed`,
      }),
    ])
  } catch (err) {
    console.error(
      JSON.stringify({
        tag: 'trade-loan-paid-settle-failed',
        error: err instanceof Error ? err.message : 'unknown',
      })
    )
  }
}

export interface LoanReminderRun {
  checked: number
  reminded: number
  settled: number
  failed: number
}

/**
 * Daily: loans due today or overdue get a reminder to both businesses, then again every 3 days
 * until settled. Loans whose lines all settled since are closed instead.
 */
export async function remindDueTradeLoans(
  db: Firestore,
  opts: { now?: Date; limit?: number } = {}
): Promise<LoanReminderRun> {
  const now = opts.now ?? new Date()
  const nowMs = now.getTime()
  const snap = await db
    .collection(TRADE_LOANS)
    .where('status', '==', 'active')
    .where('dueAt', '<=', Timestamp.fromMillis(nowMs + DAY_MS))
    .orderBy('dueAt')
    .limit(opts.limit ?? 200)
    .get()
  const run: LoanReminderRun = { checked: snap.size, reminded: 0, settled: 0, failed: 0 }
  for (const doc of snap.docs) {
    const loan = doc.data() as StoredLoan
    try {
      if (isSettled(loan)) {
        await doc.ref.update({ status: 'settled' })
        run.settled += 1
        continue
      }
      const last = millis(loan.lastRemindedAt)
      // A little slack so a run a few minutes early still counts as three days.
      if (last && nowMs - last < LOAN_REMINDER_EVERY_MS - 2 * 60 * 60 * 1000) continue
      await doc.ref.update({ lastRemindedAt: Timestamp.fromDate(now) })

      const dueMs = millis(loan.dueAt)
      const open = loan.lines.filter((l) => !SETTLED.has(l.state))
      const owed = formatNaira(open.reduce((n, l) => n + l.priceKobo, 0))
      const when = dueMs >= nowMs ? 'due back today' : `overdue since ${dueLabel(dueMs)}`
      const profiles = await readProfiles(db, [loan.lenderKey, loan.borrowerKey])
      const lenderName = profiles.get(loan.lenderKey)?.displayName || 'your partner'
      const borrowerName = profiles.get(loan.borrowerKey)?.displayName || 'Your partner'
      await Promise.all([
        notifyTeam(db, lenderScope(loan), {
          type: 'trade_loan_due',
          title: dueMs >= nowMs ? 'Loan due today' : 'Loan overdue',
          message: `${borrowerName} still has ${units(open.length)} of yours, ${when} (${owed}).`,
          actorUid: 'system:cron',
          requestId: loan.requestId,
          loanId: doc.id,
        }),
        notifyTeam(db, borrowerScope(loan), {
          type: 'trade_loan_due',
          title: dueMs >= nowMs ? 'Loan due today' : 'Loan overdue',
          message: `${units(open.length)} from ${lenderName} ${
            open.length === 1 ? 'is' : 'are'
          } ${when}. Return them or pay ${owed}.`,
          actorUid: 'system:cron',
          requestId: loan.requestId,
          loanId: doc.id,
        }),
      ])
      run.reminded += 1
    } catch (err) {
      run.failed += 1
      console.error(
        JSON.stringify({
          tag: 'trade-loan-reminder-failed',
          loanId: doc.id,
          error: err instanceof Error ? err.message : 'unknown',
        })
      )
    }
  }
  return run
}
