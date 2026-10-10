export type TradeConnectionStatus =
  | 'pending'
  | 'active'
  | 'declined'
  | 'cancelled'
  | 'removed'
  | 'blocked'

export type TradeAction = 'accept' | 'decline' | 'cancel' | 'remove' | 'block' | 'unblock'

/** What one business may see of another. Never stock, sales or contact details. */
export interface TradePartnerCard {
  handle: string
  displayName: string
  bankVerified: boolean
}

/** A connection from the caller's side. */
export interface TradeConnectionView {
  id: string
  /** `incoming`/`outgoing` are pending requests; `blocked` is only shown to the blocker. */
  state: 'incoming' | 'outgoing' | 'active' | 'blocked'
  partner: TradePartnerCard
  sinceMs: number
}

export interface TradeProfileView {
  handle: string | null
  displayName: string
  suggestedHandle: string
  bankVerified: boolean
}

export interface TradeOverview {
  profile: TradeProfileView
  connections: TradeConnectionView[]
  /** Only the owner connects, removes or blocks partners and edits the handle. */
  canManage: boolean
  /** Owner, or staff who can make sales: may ask partners for stock and reply. */
  canTrade: boolean
  /** Why this caller cannot bill a partner yet; null when they can. */
  sellBlocker: TradeSellBlocker | null
  /** Why this store cannot lend to partners; null when it can. */
  lendBlocker: TradeLendBlocker | null
}

export type TradeSellBlocker = 'no_access' | 'payments_off' | 'no_payout'

/** Lending to partners is on the Enterprise plan, like Stock loans. */
export type TradeLendBlocker = 'no_plan'

/**
 * One unit on a partner loan. `paying`: a payment for it has started and not finished.
 * `return_marked`: the borrower says it is back; the lender has not confirmed yet.
 */
export type TradeLoanLineState = 'out' | 'return_marked' | 'paying' | 'returned' | 'paid'

export interface TradeLoanLineView {
  id: string
  name: string
  serial: string
  priceKobo: number
  state: TradeLoanLineState
}

export type TradeLoanEventAction = 'lent' | 'return_marked' | 'returned' | 'pay_started' | 'paid'

export interface TradeLoanEventView {
  atMs: number
  /** Which business acted; `system` for payments confirmed by Paystack. */
  by: 'lender' | 'borrower' | 'system'
  action: TradeLoanEventAction
  lineIds: string[]
}

export interface TradeLoanView {
  id: string
  /** `lent`: your stock is with the partner. `borrowed`: their stock is with you. */
  direction: 'lent' | 'borrowed'
  partner: TradePartnerCard
  requestId: string | null
  createdAtMs: number
  dueAtMs: number
  /** Every line is returned or paid for. */
  settled: boolean
  overdue: boolean
  /** What is still out (not returned or paid), at the agreed prices. */
  outstandingKobo: number
  lines: TradeLoanLineView[]
  events: TradeLoanEventView[]
}

export interface NewTradeLoanInput {
  /** Partner handle. */
  to: string
  /** The stock request this answers, if any. */
  requestId: string | null
  /** Local date, YYYY-MM-DD. */
  dueDate: string
  lines: { itemId: string; folderId: string; priceKobo: number }[]
}

/** One line of a partner sale, copied from the seller's receipt. Prices in kobo. */
export interface TradeSaleLine {
  name: string
  quantity: number
  unitPriceKobo: number
  brand: string
  model: string
  /** Serial number or IMEI, for one-per-unit stock. */
  serial: string
}

export type TradeSaleState = 'awaiting_payment' | 'paid' | 'expired' | 'cancelled'

export interface TradeSaleView {
  id: string
  /** `selling`: you billed a partner. `buying`: a partner billed you. */
  direction: 'selling' | 'buying'
  partner: TradePartnerCard
  requestId: string
  receiptNumber: string
  amountKobo: number
  lines: TradeSaleLine[]
  state: TradeSaleState
  createdAtMs: number
  expiresAtMs: number
  paidAtMs: number
  /** Buying only: the items were already added to inventory. */
  stockAdded: boolean
}

export interface TradeReceiptView {
  receiptNumber: string
  sellerName: string
  date: string | null
  items: { itemName: string; quantity: number; price: number }[]
  /** Naira, as stored on the seller's receipt. */
  total: number
}

export type TradeReplyStatus = 'have' | 'dont_have'

export interface TradeReplyInput {
  status: TradeReplyStatus
  /** Unit price in kobo; only with `have`. */
  priceKobo: number | null
  /** How many they can supply; only with `have`. */
  quantity: number | null
  note: string
}

export interface TradeReplyView extends TradeReplyInput {
  partner: TradePartnerCard
  atMs: number
}

export type TradeRequestState = 'open' | 'closed' | 'expired'

export interface TradeRequestView {
  id: string
  direction: 'incoming' | 'outgoing'
  item: string
  quantity: number
  note: string
  categoryKind: string
  state: TradeRequestState
  createdAtMs: number
  expiresAtMs: number
  /** Incoming: who is asking. Outgoing: your own store. */
  from: TradePartnerCard
  recipientCount: number
  haveCount: number
  replyCount: number
  /** Incoming only: your reply, if any. */
  myReply: TradeReplyInput | null
  /** Outgoing only: every reply, `have` first. */
  replies: TradeReplyView[]
}

export interface TradeRequestsList {
  incoming: TradeRequestView[]
  outgoing: TradeRequestView[]
}

export interface NewTradeRequestInput {
  item: string
  quantity: number
  note: string
  /** Partner handles, or empty for every active partner. */
  to: string[]
}

export interface TradeLookupResult {
  partner: TradePartnerCard
  /** Relationship from the caller's side; `none` covers anything that can be (re)requested. */
  relation: 'self' | 'none' | 'incoming' | 'outgoing' | 'active'
}
