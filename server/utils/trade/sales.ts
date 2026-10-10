import { Timestamp, type Firestore } from 'firebase-admin/firestore'
import type {
  TradeReceiptView,
  TradeSaleLine,
  TradeSaleState,
  TradeSaleView,
  TradeSellBlocker,
} from '~/types/trade'
import { resolveStaffPermissions, type LegacyStaffAccessFields } from '~/utils/staff-permissions'
import type { PaymentLinkV2 } from '~/types/payments-v2'
import { assertDocId, type PaymentsAccess } from '../payments/access'
import { storeDocRef } from '../payments/audit-log'
import { hashLinkToken } from '../payments/link-token'
import {
  createPaymentLink,
  LINKS_COLLECTION,
  startCheckout,
  type StartCheckoutDeps,
} from '../payments/links'
import { PAYOUTS_COLLECTION } from '../payments/payout'
import { formatNaira } from '../payments/records'
import { buildReceiptView } from '../receipt-view'
import {
  bankVerifiedKeys,
  connectionId,
  millis,
  readProfiles,
  toCard,
  TRADE_CONNECTIONS,
  TradeError,
  tradeKey,
  type TradeScope,
} from './partners'
import { notifyTeam, TRADE_REQUESTS, type StoredRequest } from './requests'

export const TRADE_SALES = 'tradeSales'
/** Partner bills stay payable for two days, like the request they answer. */
export const TRADE_SALE_LINK_HOURS = 48
/** Sales are listed this long after they were created. */
export const SALE_HISTORY_MS = 30 * 24 * 60 * 60 * 1000
const MAX_LINES = 100
const MAX_LIST = 100

interface StoredSale {
  requestId: string
  sellerKey: string
  sellerOwnerUid: string
  sellerStoreId: string
  buyerKey: string
  buyerOwnerUid: string
  buyerStoreId: string
  receiptId: string
  receiptNumber: string
  linkId: string
  paymentId: string
  /** SHA-256 of the link token; checkout takes the hash, so the token itself is never stored. */
  tokenHash: string
  amountKobo: number
  lines: TradeSaleLine[]
  status: 'creating' | 'ready'
  createdAt: Timestamp
  createdByUid: string
  stockAddedAt: Timestamp | null
  stockAddedByUid: string | null
}

const saleId = (sellerKey: string, receiptId: string) => `${sellerKey}~${receiptId}`

const text = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '')

function nairaToKobo(v: unknown): number {
  const n = Number(v)
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) : 0
}

/** Seller's receipt lines → what the buyer may see and add to stock. */
export function saleLinesFromReceipt(receipt: Record<string, unknown>): TradeSaleLine[] {
  const items = Array.isArray(receipt.items) ? receipt.items.slice(0, MAX_LINES) : []
  return items.map((raw) => {
    const line = (raw ?? {}) as Record<string, unknown>
    return {
      name: text(line.itemName, 120) || 'Item',
      quantity: Math.max(1, Math.floor(Number(line.quantity) || 1)),
      unitPriceKobo: nairaToKobo(line.price),
      brand: text(line.brand, 60),
      model: text(line.model, 60),
      serial: text(line.serialNo, 80),
    }
  })
}

/** Billing a partner needs Payments V2, link permission and the seller's payout account. */
export async function tradeSellBlocker(
  db: Firestore,
  scope: TradeScope,
  canTrade: boolean,
  paymentsEnabled: boolean
): Promise<TradeSellBlocker | null> {
  if (!canTrade) return 'no_access'
  if (!paymentsEnabled) return 'payments_off'
  const payout = (await db.collection(PAYOUTS_COLLECTION).doc(tradeKey(scope)).get()).data()
  return payout?.connected && payout.subaccountCode ? null : 'no_payout'
}

/**
 * Turns a balance-due sale into a bill for the partner who asked: a payment link on the sale
 * (amount, holds and expiry handled by Payments V2), recorded so the buyer can pay in the app.
 * One bill per sale; the seller must have answered "have" on the request.
 */
export async function createTradeSale(
  db: Firestore,
  payments: PaymentsAccess,
  actorUid: string,
  raw: { requestId: unknown; receiptId: unknown },
  deps: { env: NodeJS.ProcessEnv; appOrigin: string; now?: Date }
): Promise<{ id: string; url: string }> {
  const scope = { ownerId: payments.ownerId, storeId: payments.storeId }
  const me = tradeKey(scope)
  const requestId = assertDocId(raw.requestId, 'requestId')
  const receiptId = assertDocId(raw.receiptId, 'receiptId')
  const now = deps.now ?? new Date()

  const req = (await db.collection(TRADE_REQUESTS).doc(requestId).get()).data() as
    | StoredRequest
    | undefined
  if (!req || !req.recipients.includes(me)) throw new TradeError('NOT_FOUND', 404, 'Not found')
  if (req.status === 'closed') throw new TradeError('CLOSED', 409, 'This request has closed.')
  if (req.replies?.[me]?.status !== 'have') {
    throw new TradeError('REPLY_FIRST', 409, 'Reply that you have it before billing them.')
  }
  const conn = (
    await db.collection(TRADE_CONNECTIONS).doc(connectionId(me, req.fromKey)).get()
  ).data()
  if (conn?.status !== 'active') throw new TradeError('NOT_FOUND', 404, 'Not found')

  const receiptSnap = await storeDocRef(db, scope.ownerId, scope.storeId)
    .collection('receipts')
    .doc(receiptId)
    .get()
  const receipt = receiptSnap.data()
  if (!receipt) throw new TradeError('NOT_FOUND', 404, 'Not found')
  if (receipt.paymentsV2 !== true || receipt.status !== 'balance_due') {
    throw new TradeError('NOT_BILLABLE', 409, 'Only an unpaid sale can be sent to a partner.')
  }
  const lines = saleLinesFromReceipt(receipt)
  if (!lines.length) throw new TradeError('NOT_BILLABLE', 409, 'Add the items to the sale first.')

  const ref = db.collection(TRADE_SALES).doc(saleId(me, receiptId))
  const claim: Partial<StoredSale> = {
    requestId,
    sellerKey: me,
    sellerOwnerUid: scope.ownerId,
    sellerStoreId: scope.storeId,
    buyerKey: req.fromKey,
    buyerOwnerUid: req.fromOwnerUid,
    buyerStoreId: req.fromStoreId,
    receiptId,
    receiptNumber: text(receipt.receiptNumber, 40),
    lines,
    status: 'creating',
    createdAt: Timestamp.fromDate(now),
    createdByUid: actorUid,
    stockAddedAt: null,
    stockAddedByUid: null,
  }
  try {
    await ref.create(claim)
  } catch {
    throw new TradeError('ALREADY_BILLED', 409, 'This sale was already sent to a partner.')
  }

  let link: Awaited<ReturnType<typeof createPaymentLink>>
  try {
    link = await createPaymentLink(
      db,
      payments,
      { receiptId, expiresInHours: TRADE_SALE_LINK_HOURS },
      { env: deps.env, appOrigin: deps.appOrigin, now }
    )
  } catch (err) {
    await ref.delete().catch(() => undefined)
    throw err
  }
  const token = link.url.slice(link.url.lastIndexOf('/') + 1)
  await ref.update({
    linkId: link.linkId,
    paymentId: link.paymentId,
    tokenHash: hashLinkToken(token),
    amountKobo: link.amountKobo,
    status: 'ready',
  })

  const seller = (await readProfiles(db, [me])).get(me)
  await notifyTeam(
    db,
    { ownerId: req.fromOwnerUid, storeId: req.fromStoreId },
    {
      type: 'trade_sale',
      title: 'Ready to pay',
      message: `${seller?.displayName || 'A partner'} sent you a bill for ${
        req.item
      }: ${formatNaira(link.amountKobo)}.`,
      actorUid,
      requestId,
      saleId: ref.id,
    }
  )
  return { id: ref.id, url: link.url }
}

function saleState(
  sale: StoredSale,
  link: PaymentLinkV2 | undefined,
  nowMs: number
): TradeSaleState {
  if (!link) return 'cancelled'
  if (link.status === 'paid') return 'paid'
  if (link.status === 'revoked') return 'cancelled'
  if (link.status === 'expired' || Date.parse(link.expiresAt) <= nowMs) return 'expired'
  return 'awaiting_payment'
}

/** Partner sales from both sides, newest first. State comes from the payment link. */
export async function listTradeSales(
  db: Firestore,
  scope: TradeScope,
  now = Date.now()
): Promise<TradeSaleView[]> {
  const me = tradeKey(scope)
  const since = Timestamp.fromMillis(now - SALE_HISTORY_MS)
  const col = db.collection(TRADE_SALES)
  const [selling, buying] = await Promise.all([
    col.where('sellerKey', '==', me).where('createdAt', '>', since).limit(MAX_LIST).get(),
    col.where('buyerKey', '==', me).where('createdAt', '>', since).limit(MAX_LIST).get(),
  ])
  const sales = [...selling.docs, ...buying.docs]
    .map((d) => ({ id: d.id, sale: d.data() as StoredSale }))
    .filter(({ sale }) => sale.status === 'ready')
  if (!sales.length) return []

  const links = await db.getAll(
    ...sales.map(({ sale }) => db.collection(LINKS_COLLECTION).doc(sale.linkId))
  )
  const linkById = new Map(links.map((s) => [s.id, s.data() as PaymentLinkV2 | undefined]))
  const others = [
    ...new Set(sales.map(({ sale }) => (sale.sellerKey === me ? sale.buyerKey : sale.sellerKey))),
  ]
  const [profiles, verified] = await Promise.all([
    readProfiles(db, others),
    bankVerifiedKeys(db, others),
  ])

  return sales
    .map(({ id, sale }): TradeSaleView => {
      const selling = sale.sellerKey === me
      const other = selling ? sale.buyerKey : sale.sellerKey
      const link = linkById.get(sale.linkId)
      return {
        id,
        direction: selling ? 'selling' : 'buying',
        partner: toCard(profiles.get(other), verified.has(other)),
        requestId: sale.requestId,
        receiptNumber: sale.receiptNumber,
        amountKobo: sale.amountKobo,
        lines: sale.lines,
        state: saleState(sale, link, now),
        createdAtMs: millis(sale.createdAt),
        expiresAtMs: link ? Date.parse(link.expiresAt) : 0,
        paidAtMs: link?.paidAt ? Date.parse(link.paidAt) : 0,
        stockAdded: !selling && Boolean(sale.stockAddedAt),
      }
    })
    .sort((a, b) => b.createdAtMs - a.createdAtMs)
}

const SALE_ID = /^[A-Za-z0-9_-]{1,260}~[A-Za-z0-9_-]{1,128}$/

async function buyerSale(db: Firestore, scope: TradeScope, rawId: unknown) {
  if (typeof rawId !== 'string' || !SALE_ID.test(rawId)) {
    throw new TradeError('NOT_FOUND', 404, 'Not found')
  }
  const ref = db.collection(TRADE_SALES).doc(rawId)
  const sale = (await ref.get()).data() as StoredSale | undefined
  if (!sale || sale.status !== 'ready' || sale.buyerKey !== tradeKey(scope)) {
    throw new TradeError('NOT_FOUND', 404, 'Not found')
  }
  return { ref, sale }
}

/** The buyer pays from their dashboard: a Paystack checkout on the seller's link, to their own email. */
export async function payTradeSale(
  db: Firestore,
  scope: TradeScope,
  email: string | undefined,
  rawId: unknown,
  deps: StartCheckoutDeps
): Promise<{ authorizationUrl: string }> {
  const { sale } = await buyerSale(db, scope, rawId)
  if (!email) throw new TradeError('NO_EMAIL', 409, 'Your account needs an email address to pay.')
  const { authorizationUrl } = await startCheckout(db, sale.tokenHash, { email }, deps)
  return { authorizationUrl }
}

async function paidLink(db: Firestore, sale: StoredSale): Promise<PaymentLinkV2> {
  const link = (await db.collection(LINKS_COLLECTION).doc(sale.linkId).get()).data() as
    | PaymentLinkV2
    | undefined
  if (link?.status !== 'paid')
    throw new TradeError('NOT_PAID', 409, 'This bill has not been paid yet.')
  return link
}

/** The buyer's copy of the receipt, once paid. Built from the seller's stored sale. */
export async function tradeSaleReceipt(
  db: Firestore,
  scope: TradeScope,
  rawId: unknown
): Promise<TradeReceiptView> {
  const { sale } = await buyerSale(db, scope, rawId)
  await paidLink(db, sale)
  const receipt = (
    await storeDocRef(db, sale.sellerOwnerUid, sale.sellerStoreId)
      .collection('receipts')
      .doc(sale.receiptId)
      .get()
  ).data()
  if (!receipt) throw new TradeError('NOT_FOUND', 404, 'Not found')
  const view = await buildReceiptView(
    db,
    sale.sellerOwnerUid,
    sale.sellerStoreId,
    sale.receiptId,
    receipt
  )
  const seller = (await readProfiles(db, [sale.sellerKey])).get(sale.sellerKey)
  return {
    receiptNumber: view.receiptNumber,
    sellerName: seller?.displayName || view.storeName,
    date: view.date,
    items: view.items,
    total: view.total,
  }
}

/**
 * Adding a paid bill's items to stock happens once. The buyer claims it here (the browser then
 * creates the items with the store's own folder rules), or releases the claim if nothing was added.
 */
export async function claimTradeSaleStock(
  db: Firestore,
  scope: TradeScope,
  actorUid: string,
  rawId: unknown,
  action: unknown,
  now = new Date()
): Promise<{ lines: TradeSaleLine[] }> {
  const { ref, sale } = await buyerSale(db, scope, rawId)
  if (action === 'release') {
    await db.runTransaction(async (tx) => {
      const cur = (await tx.get(ref)).data() as StoredSale
      if (cur.stockAddedByUid === actorUid)
        tx.update(ref, { stockAddedAt: null, stockAddedByUid: null })
    })
    return { lines: [] }
  }
  if (actorUid !== scope.ownerId) {
    const member = (
      await storeDocRef(db, scope.ownerId, scope.storeId).collection('members').doc(actorUid).get()
    ).data() as (LegacyStaffAccessFields & { status?: string }) | undefined
    if (member?.status !== 'active' || !resolveStaffPermissions(member).products.create) {
      throw new TradeError('NO_ACCESS', 403, 'You need permission to add products to do this.')
    }
  }
  await paidLink(db, sale)
  await db.runTransaction(async (tx) => {
    const cur = (await tx.get(ref)).data() as StoredSale
    if (cur.stockAddedAt)
      throw new TradeError('ALREADY_ADDED', 409, 'These items were already added.')
    tx.update(ref, { stockAddedAt: Timestamp.fromDate(now), stockAddedByUid: actorUid })
  })
  return { lines: sale.lines }
}

/** Called after a link payment is applied. Tells the buyer's team; never throws. */
export async function notifyTradeSalePaid(db: Firestore, linkId: string): Promise<void> {
  try {
    const snap = await db.collection(TRADE_SALES).where('linkId', '==', linkId).limit(1).get()
    const doc = snap.docs[0]
    if (!doc) return
    const sale = doc.data() as StoredSale
    const seller = (await readProfiles(db, [sale.sellerKey])).get(sale.sellerKey)
    await notifyTeam(
      db,
      { ownerId: sale.buyerOwnerUid, storeId: sale.buyerStoreId },
      {
        type: 'trade_paid',
        title: 'Payment sent',
        message: `Your payment of ${formatNaira(sale.amountKobo)} to ${
          seller?.displayName || 'your partner'
        } went through. Add the items to your inventory.`,
        actorUid: 'system:paystack',
        requestId: sale.requestId,
        saleId: doc.id,
      }
    )
  } catch (err) {
    console.error(
      JSON.stringify({
        tag: 'trade-sale-paid-notify-failed',
        error: err instanceof Error ? err.message : 'unknown',
      })
    )
  }
}
