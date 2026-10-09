import {
  FieldValue,
  type DocumentSnapshot,
  type Firestore,
} from 'firebase-admin/firestore'
import type {
  PaymentLinkAttempt,
  PaymentLinkStatus,
  PaymentLinkTokenEntry,
  PaymentLinkV2,
} from '~/types/payments-v2'
import { PAYMENTS_V2_CURRENCY } from '~/utils/money-kobo'
import { computePaymentSummary } from '~/utils/payment-summary'
import { appendAuditEvents, readChainHead, storeDocRef, type AuditEventInput } from './audit-log'
import { assertDocId, requireAccess, type PaymentsAccess } from './access'
import { paymentLinksAllowedForPlan } from './config'
import {
  generateLinkToken,
  MAX_ACTIVE_TOKENS_PER_LINK,
  newCheckoutReference,
  parseCheckoutReference,
  resolveLinkExpiry,
} from './link-token'
import { notifyLinkSaleCancelled } from './notify'
import { PAYOUTS_COLLECTION, payoutDocId, type PaystackCall, type StoredPayout } from './payout'
import {
  PaymentServiceError,
  readReceiptContext,
  recordPayments,
  transitionPaymentsBatch,
  TX_OPTIONS,
} from './records'
import type { PaymentActor } from './state-machine'

export const LINKS_COLLECTION = 'paymentLinksV2'
export const LINK_TOKENS_COLLECTION = 'paymentLinkTokens'
/** Checkout attempts per link: per rolling hour, and over the link's life. */
export const MAX_ATTEMPTS_PER_HOUR = 10
export const MAX_ATTEMPTS_TOTAL = 30
/** Refuse to start a checkout this close to expiry; the customer would likely pay late. */
export const CHECKOUT_MIN_REMAINING_MS = 2 * 60_000
const MAX_HOLD_ITEMS = 200

export const SYSTEM_CRON_ACTOR: PaymentActor = { uid: 'system:cron', name: 'Storvv', role: 'system' }

const linkRef = (db: Firestore, linkId: string) => db.collection(LINKS_COLLECTION).doc(linkId)
const tokenRef = (db: Firestore, hash: string) => db.collection(LINK_TOKENS_COLLECTION).doc(hash)

/** Same mapping as `normalizedOwnerPlan` in firestore.rules. */
export function normalizeOwnerPlan(raw: unknown): string {
  if (raw === 'storvv_medium' || raw === 'medium') return 'storvv_medium'
  if (raw === 'storvv_enterprise' || raw === 'enterprise') return 'storvv_enterprise'
  return 'storvv_micro'
}

function linkEvent(
  type: string,
  link: { id: string; receiptId: string },
  actor: PaymentActor,
  now: string,
  reason: string | null
): AuditEventInput {
  return {
    type,
    paymentId: null,
    receiptId: link.receiptId,
    linkId: link.id,
    actorUid: actor.uid,
    actorKind: actor.role,
    amountKobo: null,
    currency: null,
    fromStatus: null,
    toStatus: null,
    reason,
    flags: [],
    at: now,
    subjectUid: null,
  }
}

function ownedLink(
  snap: DocumentSnapshot,
  scope: { ownerId: string; storeId: string }
): PaymentLinkV2 {
  const link = snap.data() as PaymentLinkV2 | undefined
  // Another store's link looks exactly like a missing one.
  if (!link || link.ownerId !== scope.ownerId || link.storeId !== scope.storeId) {
    throw new PaymentServiceError('NOT_FOUND', 404, 'Not found')
  }
  return link
}

const isExpired = (link: Pick<PaymentLinkV2, 'expiresAt'>, nowMs: number) =>
  Date.parse(link.expiresAt) <= nowMs

const payUrl = (appOrigin: string, token: string) =>
  `${appOrigin.replace(/\/$/, '')}/pay/${token}`

// ---------------------------------------------------------------- create

export interface CreateLinkInput {
  receiptId: unknown
  amountKobo?: unknown
  expiresInHours?: unknown
}

export interface CreatedLink {
  linkId: string
  paymentId: string
  amountKobo: number
  expiresAt: string
  linkSale: boolean
  /** Shown once. Only its SHA-256 is stored. */
  url: string
}

/**
 * Creates a link for what the sale has left to pay, or a smaller amount. The link's money is a
 * pending payment on the receipt, so the cap (active links + confirmed + awaiting never above
 * the total) is enforced by the same transaction that writes the link and its first token.
 */
export async function createPaymentLink(
  db: Firestore,
  access: PaymentsAccess,
  input: CreateLinkInput,
  deps: { env: NodeJS.ProcessEnv; appOrigin: string; now?: Date }
): Promise<CreatedLink> {
  requireAccess(access.actor.canManageLinks === true, 'You cannot create payment links')
  const receiptId = assertDocId(input.receiptId, 'receiptId')
  const fixedAmount = input.amountKobo != null && input.amountKobo !== ''
  if (
    fixedAmount &&
    (typeof input.amountKobo !== 'number' ||
      !Number.isSafeInteger(input.amountKobo) ||
      input.amountKobo <= 0)
  ) {
    throw new PaymentServiceError('INVALID_AMOUNT', 400, 'Amount must be a whole number of kobo')
  }
  const nowDate = deps.now ?? new Date()
  let expiresAt: string
  try {
    expiresAt = resolveLinkExpiry(input.expiresInHours, nowDate)
  } catch (err) {
    throw new PaymentServiceError('INVALID_EXPIRY', 400, (err as Error).message)
  }

  const [ownerSnap, storeSnap, payoutSnap] = await Promise.all([
    db.collection('users').doc(access.ownerId).get(),
    storeDocRef(db, access.ownerId, access.storeId).get(),
    db.collection(PAYOUTS_COLLECTION).doc(payoutDocId(access.ownerId, access.storeId)).get(),
  ])
  if (!paymentLinksAllowedForPlan(normalizeOwnerPlan(ownerSnap.data()?.subscription), deps.env)) {
    throw new PaymentServiceError('PLAN_REQUIRED', 403, 'Payment links are not on your plan')
  }
  const payout = payoutSnap.data() as Partial<StoredPayout> | undefined
  if (!payout?.connected || !payout.subaccountCode) {
    throw new PaymentServiceError(
      'PAYOUT_NOT_CONNECTED',
      409,
      'The store owner needs to connect a payout account first'
    )
  }
  const subaccountCode = payout.subaccountCode
  const storeName = String(storeSnap.data()?.name || 'Store').slice(0, 80)

  const ref = db.collection(LINKS_COLLECTION).doc()
  const { token, hash } = generateLinkToken()
  let result: Omit<CreatedLink, 'url'> | null = null

  await recordPayments(db, {
    ownerId: access.ownerId,
    storeId: access.storeId,
    receiptId,
    currency: PAYMENTS_V2_CURRENCY,
    actor: access.actor,
    linkId: ref.id,
    fillOutstanding: !fixedAmount,
    tenders: [
      {
        kind: 'paystack_link',
        methodLabel: 'Payment link',
        amountKobo: fixedAmount ? (input.amountKobo as number) : 0,
      },
    ],
    stage: (tx, { ctx, before, added, now }) => {
      const payment = added[0]!
      const linkSale =
        ctx.legacyStatus === 'balance_due' &&
        before.netPaidKobo === 0 &&
        before.awaitingKobo === 0 &&
        before.pendingKobo === 0
      const link: PaymentLinkV2 = {
        ownerId: access.ownerId,
        storeId: access.storeId,
        receiptId,
        paymentId: payment.id,
        amountKobo: payment.amountKobo,
        currency: PAYMENTS_V2_CURRENCY,
        status: 'active',
        subaccountCode,
        storeName,
        receiptNumber: ctx.receiptNumber.slice(0, 40),
        linkSale,
        expiresAt,
        createdAt: now,
        createdBy: access.actor.uid,
        updatedAt: now,
        paidAt: null,
        endedAt: null,
        endedBy: null,
        endReason: null,
        holdReleasedAt: null,
        checkoutAttempts: 0,
        version: 1,
      }
      tx.create(ref, link)
      const entry: PaymentLinkTokenEntry = {
        linkId: ref.id,
        ownerId: access.ownerId,
        storeId: access.storeId,
        status: 'active',
        createdAt: now,
        createdBy: access.actor.uid,
        expiresAt,
        revokedAt: null,
        revokedBy: null,
      }
      tx.create(tokenRef(db, hash), entry)
      result = {
        linkId: ref.id,
        paymentId: payment.id,
        amountKobo: payment.amountKobo,
        expiresAt,
        linkSale,
      }
    },
  })

  const created = result as Omit<CreatedLink, 'url'> | null
  if (!created) throw new PaymentServiceError('INTERNAL', 500, 'Link was not created')
  return { ...created, url: payUrl(deps.appOrigin, token) }
}

// ---------------------------------------------------------------- tokens

/** "Copy again": a fresh token for the same link. Each can be revoked on its own. */
export async function issueLinkToken(
  db: Firestore,
  access: PaymentsAccess,
  input: { linkId: unknown },
  deps: { appOrigin: string; now?: Date }
): Promise<{ url: string; tokenId: string; expiresAt: string }> {
  requireAccess(access.actor.canManageLinks === true, 'You cannot share payment links')
  const linkId = assertDocId(input.linkId, 'linkId')
  const store = storeDocRef(db, access.ownerId, access.storeId)
  const { token, hash } = generateLinkToken()
  let expiresAt = ''

  await db.runTransaction(async (tx) => {
    const ref = linkRef(db, linkId)
    const link = ownedLink(await tx.get(ref), access)
    const active = await tx.get(
      db
        .collection(LINK_TOKENS_COLLECTION)
        .where('linkId', '==', linkId)
        .where('status', '==', 'active')
    )
    const head = await readChainHead(tx, store)
    const nowMs = (deps.now ?? new Date()).getTime()
    if (link.status !== 'active' || isExpired(link, nowMs)) {
      throw new PaymentServiceError('LINK_NOT_ACTIVE', 409, 'This link is no longer active')
    }
    if (active.size >= MAX_ACTIVE_TOKENS_PER_LINK) {
      throw new PaymentServiceError(
        'TOO_MANY_TOKENS',
        409,
        'This link has been shared too many times. Revoke an old copy first.'
      )
    }
    const now = new Date(nowMs).toISOString()
    expiresAt = link.expiresAt
    const entry: PaymentLinkTokenEntry = {
      linkId,
      ownerId: access.ownerId,
      storeId: access.storeId,
      status: 'active',
      createdAt: now,
      createdBy: access.actor.uid,
      expiresAt: link.expiresAt,
      revokedAt: null,
      revokedBy: null,
    }
    tx.create(tokenRef(db, hash), entry)
    appendAuditEvents(tx, store, head, [
      linkEvent('link_token_issued', { id: linkId, receiptId: link.receiptId }, access.actor, now, null),
    ])
  }, TX_OPTIONS)

  return { url: payUrl(deps.appOrigin, token), tokenId: hash, expiresAt }
}

/** Kills one shared copy of a link; the link and its other copies stay usable. */
export async function revokeLinkToken(
  db: Firestore,
  access: PaymentsAccess,
  input: { linkId: unknown; tokenId: unknown }
): Promise<void> {
  requireAccess(access.actor.canManageLinks === true, 'You cannot revoke payment links')
  const linkId = assertDocId(input.linkId, 'linkId')
  if (typeof input.tokenId !== 'string' || !/^[a-f0-9]{64}$/.test(input.tokenId)) {
    throw new PaymentServiceError('INVALID_ID', 400, 'tokenId is invalid')
  }
  const tokenId = input.tokenId
  const store = storeDocRef(db, access.ownerId, access.storeId)

  await db.runTransaction(async (tx) => {
    const link = ownedLink(await tx.get(linkRef(db, linkId)), access)
    const tRef = tokenRef(db, tokenId)
    const entry = (await tx.get(tRef)).data() as PaymentLinkTokenEntry | undefined
    const head = await readChainHead(tx, store)
    if (!entry || entry.linkId !== linkId) throw new PaymentServiceError('NOT_FOUND', 404, 'Not found')
    if (entry.status !== 'active') return
    const now = new Date().toISOString()
    tx.update(tRef, { status: 'revoked', revokedAt: now, revokedBy: access.actor.uid })
    appendAuditEvents(tx, store, head, [
      linkEvent('link_token_revoked', { id: linkId, receiptId: link.receiptId }, access.actor, now, null),
    ])
  }, TX_OPTIONS)
}

// ---------------------------------------------------------------- revoke / expire

export interface EndLinkResult {
  linkId: string
  status: Extract<PaymentLinkStatus, 'expired' | 'revoked'>
  saleCancelled: boolean
}

/**
 * Ends an active link: its pending payment moves to expired (event `revoked` for a person,
 * `expired` for the cron), every token dies, and, for a link sale with nothing else paid or
 * pending, the order is cancelled and its reserved stock released, all in one transaction that
 * rechecks the link and payment status (a link paid a moment earlier is left alone).
 */
async function endLink(
  db: Firestore,
  scope: { ownerId: string; storeId: string; actor: PaymentActor },
  linkId: string,
  mode: 'expired' | 'revoked',
  reason: string,
  now: Date
): Promise<EndLinkResult> {
  let saleCancelled = false
  let receiptId = ''
  let receiptNumber = ''

  await transitionPaymentsBatch(db, scope, async (tx, store) => {
    const ref = linkRef(db, linkId)
    const link = ownedLink(await tx.get(ref), scope)
    if (link.status !== 'active') {
      throw new PaymentServiceError('LINK_NOT_ACTIVE', 409, 'This link is no longer active')
    }
    if (mode === 'expired' && !isExpired(link, now.getTime())) {
      throw new PaymentServiceError('LINK_NOT_DUE', 409, 'This link has not expired yet')
    }
    const tokens = await tx.get(db.collection(LINK_TOKENS_COLLECTION).where('linkId', '==', linkId))
    const ctx = await readReceiptContext(tx, store, link.receiptId, { allowClosed: true })
    const payment = ctx.payments.find((p) => p.id === link.paymentId)
    if (!payment || payment.status !== 'pending') {
      throw new PaymentServiceError('LINK_SETTLED', 409, 'This link has already been paid')
    }
    const rest = computePaymentSummary(
      ctx.totalKobo,
      ctx.payments.filter((p) => p.id !== payment.id)
    )
    const cancel =
      link.linkSale &&
      ctx.legacyStatus === 'balance_due' &&
      rest.netPaidKobo === 0 &&
      rest.awaitingKobo === 0 &&
      rest.pendingKobo === 0

    let heldItems: DocumentSnapshot[] = []
    if (cancel) {
      const receipt = (await tx.get(ctx.ref)).data() ?? {}
      const itemIds = [
        ...new Set(
          (Array.isArray(receipt.itemIds) ? receipt.itemIds : []).filter(
            (id: unknown): id is string => typeof id === 'string' && /^[A-Za-z0-9_-]{1,128}$/.test(id)
          )
        ),
      ].slice(0, MAX_HOLD_ITEMS)
      if (itemIds.length) {
        heldItems = await tx.getAll(
          ...itemIds.map((id) => store.collection('inventoryItems').doc(id))
        )
      }
    }
    saleCancelled = cancel
    receiptId = link.receiptId
    receiptNumber = ctx.receiptNumber

    return {
      items: [{ paymentId: payment.id, to: 'expired', reason }],
      extraWrites: (w, at) => {
        w.update(ref, {
          status: mode,
          endedAt: at,
          endedBy: scope.actor.uid,
          endReason: reason,
          holdReleasedAt: cancel ? at : null,
          updatedAt: at,
          version: (link.version || 1) + 1,
        })
        for (const t of tokens.docs) {
          if (t.data().status === 'active') w.update(t.ref, { status: 'dead' })
        }
        if (!cancel) return
        for (const item of heldItems) {
          if (item.exists && String(item.data()?.pendingSaleReceiptId || '') === link.receiptId) {
            w.update(item.ref, {
              pendingSaleReceiptId: FieldValue.delete(),
              pendingSaleAt: FieldValue.delete(),
              updatedAt: FieldValue.serverTimestamp(),
            })
          }
        }
        w.update(ctx.ref, {
          status: 'cancelled',
          balanceDue: 0,
          cancelReason: mode === 'expired' ? 'Payment link expired' : 'Payment link revoked',
          updatedAt: new Date(at),
        })
      },
      extraEvents: (at) =>
        cancel
          ? [
              {
                ...linkEvent('sale_cancelled', { id: linkId, receiptId: link.receiptId }, scope.actor, at, reason),
                fromStatus: ctx.legacyStatus,
                toStatus: 'cancelled',
              },
            ]
          : [],
    }
  })

  if (saleCancelled) {
    await notifyLinkSaleCancelled(
      db,
      { ownerId: scope.ownerId, storeId: scope.storeId, actorUid: scope.actor.uid },
      receiptId,
      receiptNumber,
      mode
    )
  }
  return { linkId, status: mode, saleCancelled }
}

export async function revokePaymentLink(
  db: Firestore,
  access: PaymentsAccess,
  input: { linkId: unknown; reason: unknown }
): Promise<EndLinkResult> {
  requireAccess(access.actor.canManageLinks === true, 'You cannot revoke payment links')
  const linkId = assertDocId(input.linkId, 'linkId')
  const reason =
    typeof input.reason === 'string' && input.reason.trim()
      ? input.reason.trim().slice(0, 500)
      : null
  if (!reason) throw new PaymentServiceError('REASON_REQUIRED', 400, 'A reason is required')
  return endLink(
    db,
    { ownerId: access.ownerId, storeId: access.storeId, actor: access.actor },
    linkId,
    'revoked',
    reason,
    new Date()
  )
}

export type ExpiryRunResult = {
  checked: number
  expired: number
  salesCancelled: number
  skipped: number
  failed: number
}

/** Cron: ends every active link past its expiry. Each link is its own transaction. */
export async function expireDueLinks(
  db: Firestore,
  opts: { now?: Date; limit?: number } = {}
): Promise<ExpiryRunResult> {
  const now = opts.now ?? new Date()
  const snap = await db
    .collection(LINKS_COLLECTION)
    .where('status', '==', 'active')
    .where('expiresAt', '<=', now.toISOString())
    .orderBy('expiresAt')
    .limit(opts.limit ?? 200)
    .get()
  const result: ExpiryRunResult = { checked: snap.size, expired: 0, salesCancelled: 0, skipped: 0, failed: 0 }
  for (const doc of snap.docs) {
    const link = doc.data() as PaymentLinkV2
    try {
      const ended = await endLink(
        db,
        { ownerId: link.ownerId, storeId: link.storeId, actor: SYSTEM_CRON_ACTOR },
        doc.id,
        'expired',
        'link expired',
        now
      )
      result.expired += 1
      if (ended.saleCancelled) result.salesCancelled += 1
    } catch (err) {
      const code = err instanceof PaymentServiceError ? err.code : 'UNKNOWN'
      if (code === 'LINK_NOT_ACTIVE' || code === 'LINK_SETTLED' || code === 'LINK_NOT_DUE') {
        result.skipped += 1
        continue
      }
      result.failed += 1
      console.error(
        JSON.stringify({
          tag: 'payments-link-expiry-failed',
          linkId: doc.id,
          ownerId: link.ownerId,
          storeId: link.storeId,
          code,
        })
      )
    }
  }
  return result
}

// ---------------------------------------------------------------- staff list

export interface LinkTokenDto {
  tokenId: string
  status: PaymentLinkTokenEntry['status']
  createdAt: string
  createdBy: string
}

export interface LinkDto {
  id: string
  receiptId: string
  amountKobo: number
  status: PaymentLinkStatus
  expiresAt: string
  createdAt: string
  createdBy: string
  linkSale: boolean
  endedAt: string | null
  endReason: string | null
  tokens: LinkTokenDto[]
}

/** Links on one sale, with their shared copies (IDs are token hashes, never tokens). */
export async function listReceiptLinks(
  db: Firestore,
  access: PaymentsAccess,
  input: { receiptId: unknown }
): Promise<LinkDto[]> {
  requireAccess(access.canRecord || access.canView, 'You cannot view payment links')
  const receiptId = assertDocId(input.receiptId, 'receiptId')
  const snap = await db
    .collection(LINKS_COLLECTION)
    .where('ownerId', '==', access.ownerId)
    .where('storeId', '==', access.storeId)
    .where('receiptId', '==', receiptId)
    .limit(50)
    .get()
  const links = await Promise.all(
    snap.docs.map(async (d) => {
      const l = d.data() as PaymentLinkV2
      const tokens = await db
        .collection(LINK_TOKENS_COLLECTION)
        .where('linkId', '==', d.id)
        .limit(MAX_ACTIVE_TOKENS_PER_LINK * 3)
        .get()
      return {
        id: d.id,
        receiptId: l.receiptId,
        amountKobo: l.amountKobo,
        status: l.status,
        expiresAt: l.expiresAt,
        createdAt: l.createdAt,
        createdBy: l.createdBy,
        linkSale: l.linkSale,
        endedAt: l.endedAt,
        endReason: l.endReason,
        tokens: tokens.docs
          .map((t) => {
            const e = t.data() as PaymentLinkTokenEntry
            return { tokenId: t.id, status: e.status, createdAt: e.createdAt, createdBy: e.createdBy }
          })
          .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
      }
    })
  )
  return links.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

// ---------------------------------------------------------------- public

export type PublicLinkView =
  | {
      status: 'active'
      amountKobo: number
      currency: string
      storeName: string
      receiptNumber: string
      expiresAt: string
    }
  | { status: 'paid' | 'expired'; storeName: string }

const NOT_FOUND = () => new PaymentServiceError('NOT_FOUND', 404, 'This link is not valid')

/**
 * Public, no sign-in: the minimum a customer needs to pay. Unknown, revoked and malformed tokens
 * all look the same. No customer data, IDs or payout details.
 */
export async function readPublicLink(
  db: Firestore,
  tokenHash: string | null,
  now: Date = new Date()
): Promise<PublicLinkView> {
  if (!tokenHash) throw NOT_FOUND()
  const entry = (await tokenRef(db, tokenHash).get()).data() as PaymentLinkTokenEntry | undefined
  if (!entry || entry.status === 'revoked') throw NOT_FOUND()
  const link = (await linkRef(db, entry.linkId).get()).data() as PaymentLinkV2 | undefined
  if (!link) throw NOT_FOUND()
  if (link.status === 'paid') return { status: 'paid', storeName: link.storeName }
  if (link.status === 'revoked' || entry.status === 'dead') throw NOT_FOUND()
  if (link.status === 'expired' || isExpired(link, now.getTime())) {
    return { status: 'expired', storeName: link.storeName }
  }
  return {
    status: 'active',
    amountKobo: link.amountKobo,
    currency: link.currency,
    storeName: link.storeName,
    receiptNumber: link.receiptNumber,
    expiresAt: link.expiresAt,
  }
}

const EMAIL_PATTERN = /^[^\s@<>()[\]\\,;:"]{1,64}@[A-Za-z0-9.-]{1,190}\.[A-Za-z]{2,24}$/

export interface StartCheckoutDeps {
  paystack: PaystackCall
  appOrigin: string
  ipHash: string
  now?: Date
}

/**
 * Public: starts a Paystack hosted checkout. Amount, currency and subaccount come from the link
 * (never the request). The customer's email goes to Paystack only and is not stored. The
 * callback carries the reference, never the token.
 */
export async function startCheckout(
  db: Firestore,
  tokenHash: string | null,
  input: { email: unknown },
  deps: StartCheckoutDeps
): Promise<{ authorizationUrl: string; reference: string }> {
  if (!tokenHash) throw NOT_FOUND()
  const email = typeof input.email === 'string' ? input.email.trim().toLowerCase() : ''
  if (!EMAIL_PATTERN.test(email) || email.length > 254) {
    throw new PaymentServiceError('INVALID_EMAIL', 400, 'Enter a valid email for your receipt')
  }
  const nowDate = deps.now ?? new Date()
  const nowMs = nowDate.getTime()
  const entryRef = tokenRef(db, tokenHash)

  const prepared = await db.runTransaction(async (tx) => {
    const entry = (await tx.get(entryRef)).data() as PaymentLinkTokenEntry | undefined
    if (!entry || entry.status !== 'active') throw NOT_FOUND()
    const ref = linkRef(db, entry.linkId)
    const link = (await tx.get(ref)).data() as PaymentLinkV2 | undefined
    if (!link) throw NOT_FOUND()
    if (link.status === 'paid') {
      throw new PaymentServiceError('LINK_PAID', 409, 'This link has already been paid')
    }
    if (link.status !== 'active') throw NOT_FOUND()
    if (Date.parse(link.expiresAt) - nowMs < CHECKOUT_MIN_REMAINING_MS) {
      throw new PaymentServiceError('LINK_EXPIRED', 410, 'This link has expired')
    }
    const payment = (
      await tx.get(storeDocRef(db, link.ownerId, link.storeId).collection('payments').doc(link.paymentId))
    ).data()
    if (!payment || payment.status !== 'pending') {
      throw new PaymentServiceError('LINK_PAID', 409, 'This link has already been paid')
    }
    const recent = await tx.get(
      ref.collection('attempts').where('createdAt', '>=', new Date(nowMs - 3_600_000).toISOString())
    )
    if (recent.size >= MAX_ATTEMPTS_PER_HOUR || (link.checkoutAttempts || 0) >= MAX_ATTEMPTS_TOTAL) {
      throw new PaymentServiceError(
        'TOO_MANY_ATTEMPTS',
        429,
        'Too many payment attempts on this link. Please contact the shop.'
      )
    }
    const reference = newCheckoutReference(entry.linkId)
    const attempt: PaymentLinkAttempt = {
      reference,
      amountKobo: link.amountKobo,
      currency: PAYMENTS_V2_CURRENCY,
      subaccountCode: link.subaccountCode,
      status: 'initializing',
      createdAt: nowDate.toISOString(),
      ipHash: deps.ipHash,
    }
    tx.create(ref.collection('attempts').doc(reference), attempt)
    tx.update(ref, { checkoutAttempts: FieldValue.increment(1) })
    return { linkId: entry.linkId, link, reference }
  }, TX_OPTIONS)

  const attemptRef = linkRef(db, prepared.linkId).collection('attempts').doc(prepared.reference)
  let authorizationUrl = ''
  try {
    const data = await deps.paystack<{ authorization_url?: string }>('/transaction/initialize', {
      method: 'POST',
      body: {
        email,
        amount: prepared.link.amountKobo,
        currency: PAYMENTS_V2_CURRENCY,
        reference: prepared.reference,
        subaccount: prepared.link.subaccountCode,
        bearer: 'subaccount',
        callback_url: `${deps.appOrigin.replace(/\/$/, '')}/pay/return?ref=${prepared.reference}`,
        metadata: { linkId: prepared.linkId, paymentId: prepared.link.paymentId, source: 'storvv_link_v2' },
      },
    })
    authorizationUrl = String(data?.authorization_url || '')
  } catch {
    authorizationUrl = ''
  }
  if (!/^https:\/\/checkout\.paystack\.com\//.test(authorizationUrl)) {
    await attemptRef.update({ status: 'failed' }).catch(() => undefined)
    throw new PaymentServiceError(
      'PAYSTACK_UNAVAILABLE',
      502,
      'Payment could not be started. Please try again in a moment.'
    )
  }
  await attemptRef.update({ status: 'initialized' })
  return { authorizationUrl, reference: prepared.reference }
}

export type ReturnStatus = 'paid' | 'pending' | 'expired' | 'unavailable'

/** Public return page after Paystack: status only, looked up by reference. */
export async function readReturnStatus(
  db: Firestore,
  rawReference: unknown
): Promise<{ status: ReturnStatus; storeName: string }> {
  const parsed = parseCheckoutReference(rawReference)
  if (!parsed) throw NOT_FOUND()
  const ref = linkRef(db, parsed.linkId)
  const [linkSnap, attemptSnap] = await Promise.all([
    ref.get(),
    ref.collection('attempts').doc(parsed.reference).get(),
  ])
  const link = linkSnap.data() as PaymentLinkV2 | undefined
  if (!link || !attemptSnap.exists) throw NOT_FOUND()
  const status: ReturnStatus =
    link.status === 'paid'
      ? 'paid'
      : link.status === 'active'
        ? 'pending'
        : link.status === 'expired'
          ? 'expired'
          : 'unavailable'
  return { status, storeName: link.storeName }
}
