import type {
  NewTradeRequestInput,
  TradeAction,
  TradeConnectionView,
  TradeLookupResult,
  TradeOverview,
  TradePartnerCard,
  TradeReceiptView,
  TradeReplyInput,
  TradeRequestView,
  TradeRequestsList,
  TradeSaleLine,
  TradeSaleView,
} from '~/types/trade'
import { DEFAULT_CATEGORY_KIND, inferCategoryKind } from '~/utils/category-kinds'
import { normalizeTradeHandle, tradeHandleProblem } from '~/utils/trade-handle'

/** Fictional partners for the demo; kept in memory for the tab. */
const DIRECTORY: TradePartnerCard[] = [
  { handle: 'ikeja-phone-hub', displayName: 'Ikeja Phone Hub', bankVerified: true },
  { handle: 'kano-wholesale', displayName: 'Kano Wholesale Depot', bankVerified: true },
  { handle: 'abuja-accessories', displayName: 'Abuja Accessories', bankVerified: false },
  { handle: 'ph-electronics', displayName: 'PH Electronics', bankVerified: true },
  { handle: 'yaba-gadgets', displayName: 'Yaba Gadgets', bankVerified: false },
]

const DAY = 24 * 60 * 60 * 1000

function seed(): TradeOverview {
  const now = Date.now()
  const card = (handle: string) => DIRECTORY.find((d) => d.handle === handle)!
  return {
    profile: {
      handle: 'lagos-demo-store',
      displayName: 'Lagos Demo Store',
      suggestedHandle: 'lagos-demo-store',
      bankVerified: true,
    },
    canManage: true,
    canTrade: true,
    sellBlocker: null,
    connections: [
      { id: 'demo~abuja', state: 'incoming', partner: card('abuja-accessories'), sinceMs: now - DAY / 4 },
      { id: 'demo~ph', state: 'outgoing', partner: card('ph-electronics'), sinceMs: now - 2 * DAY },
      { id: 'demo~ikeja', state: 'active', partner: card('ikeja-phone-hub'), sinceMs: now - 40 * DAY },
      { id: 'demo~kano', state: 'active', partner: card('kano-wholesale'), sinceMs: now - 12 * DAY },
    ],
  }
}

let state: TradeOverview | null = null

function current(): TradeOverview {
  state ??= seed()
  return state
}

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

export function getDemoTradeOverview(): TradeOverview {
  return clone(current())
}

export function saveDemoTradeProfile(handle: string, displayName: string): TradeOverview {
  const clean = normalizeTradeHandle(handle)
  const problem = tradeHandleProblem(clean)
  if (problem) throw new Error(problem)
  if (DIRECTORY.some((d) => d.handle === clean)) throw new Error('That handle is taken. Try another.')
  const s = current()
  s.profile = { ...s.profile, handle: clean, suggestedHandle: clean, displayName: displayName.trim() || s.profile.displayName }
  return clone(s)
}

export function lookupDemoTradeHandle(handle: string): TradeLookupResult {
  const clean = normalizeTradeHandle(handle)
  const s = current()
  if (clean === s.profile.handle) {
    return {
      relation: 'self',
      partner: { handle: clean, displayName: s.profile.displayName, bankVerified: s.profile.bankVerified },
    }
  }
  const partner = DIRECTORY.find((d) => d.handle === clean)
  if (!partner) throw new Error('No business uses that handle.')
  const conn = s.connections.find((c) => c.partner.handle === clean)
  const relation = !conn || conn.state === 'blocked' ? 'none' : conn.state
  return { partner: { ...partner }, relation }
}

export function inviteDemoTradePartner(handle: string): TradeOverview {
  const { partner, relation } = lookupDemoTradeHandle(handle)
  const s = current()
  if (relation === 'self') throw new Error('That is your own handle.')
  if (relation === 'incoming') return respondDemoTrade(s.connections.find((c) => c.partner.handle === partner.handle)!.id, 'accept')
  if (relation === 'none') {
    s.connections = s.connections.filter((c) => c.partner.handle !== partner.handle)
    s.connections.push({ id: `demo~${partner.handle}`, state: 'outgoing', partner, sinceMs: Date.now() })
  }
  return clone(s)
}

export function respondDemoTrade(id: string, action: TradeAction): TradeOverview {
  const s = current()
  const conn = s.connections.find((c) => c.id === id)
  if (!conn) throw new Error('Not found')
  const next: Partial<Record<TradeAction, TradeConnectionView['state'] | null>> = {
    accept: 'active',
    decline: null,
    cancel: null,
    remove: null,
    block: 'blocked',
    unblock: null,
  }
  const to = next[action]
  if (to) Object.assign(conn, { state: to, sinceMs: Date.now() })
  else s.connections = s.connections.filter((c) => c.id !== id)
  return clone(s)
}

const HOUR = 60 * 60 * 1000
let requests: TradeRequestsList | null = null

function requestBase(
  id: string,
  direction: TradeRequestView['direction'],
  item: string,
  quantity: number,
  hoursAgo: number,
  from: TradePartnerCard
): TradeRequestView {
  const createdAtMs = Date.now() - hoursAgo * HOUR
  return {
    id,
    direction,
    item,
    quantity,
    note: '',
    categoryKind: inferCategoryKind(item) ?? DEFAULT_CATEGORY_KIND,
    state: 'open',
    createdAtMs,
    expiresAtMs: createdAtMs + 48 * HOUR,
    from,
    recipientCount: 2,
    haveCount: 0,
    replyCount: 0,
    myReply: null,
    replies: [],
  }
}

function seedRequests(): TradeRequestsList {
  const card = (handle: string) => DIRECTORY.find((d) => d.handle === handle)!
  const me = current().profile
  const self = { handle: me.handle || '', displayName: me.displayName, bankVerified: me.bankVerified }
  const asked = requestBase('demo-r1', 'outgoing', 'iPhone 15 Pro Max 256GB', 2, 3, self)
  asked.note = 'Natural titanium if possible'
  asked.replies = [
    {
      partner: card('ikeja-phone-hub'),
      status: 'have',
      priceKobo: 1_450_000_00,
      quantity: 2,
      note: 'Sealed, can deliver today',
      atMs: Date.now() - 2 * HOUR,
    },
    { partner: card('kano-wholesale'), status: 'dont_have', priceKobo: null, quantity: null, note: '', atMs: Date.now() - HOUR },
  ]
  asked.haveCount = 1
  asked.replyCount = 2
  const incoming = requestBase('demo-r2', 'incoming', 'Samsung 25W chargers', 20, 5, card('kano-wholesale'))
  incoming.note = 'Original only'
  const older = requestBase('demo-r3', 'incoming', 'AirPods Pro (2nd gen)', 1, 30, card('ikeja-phone-hub'))
  older.myReply = { status: 'have', priceKobo: 185_000_00, quantity: 1, note: '' }
  return { incoming: [incoming, older], outgoing: [asked] }
}

function currentRequests(): TradeRequestsList {
  requests ??= seedRequests()
  return requests
}

export function getDemoTradeRequests(): TradeRequestsList {
  return clone(currentRequests())
}

export function askDemoPartners(input: NewTradeRequestInput): void {
  const item = input.item.replace(/\s+/g, ' ').trim()
  if (item.length < 2) throw new Error('Say what you are looking for.')
  const partners = current().connections.filter((c) => c.state === 'active')
  if (!partners.length) throw new Error('Add a partner before asking for stock.')
  const me = current().profile
  const req = requestBase(
    `demo-r${Date.now()}`,
    'outgoing',
    item,
    input.quantity || 1,
    0,
    { handle: me.handle || '', displayName: me.displayName, bankVerified: me.bankVerified }
  )
  req.note = input.note.trim()
  req.recipientCount = input.to.length || partners.length
  currentRequests().outgoing.unshift(req)
}

export function replyDemoTradeRequest(id: string, input: TradeReplyInput): void {
  const req = currentRequests().incoming.find((r) => r.id === id)
  if (!req || req.state !== 'open') throw new Error('This request has closed.')
  req.myReply = { ...input }
}

export function closeDemoTradeRequest(id: string): void {
  const req = currentRequests().outgoing.find((r) => r.id === id)
  if (req) req.state = 'closed'
}

let sales: TradeSaleView[] | null = null

function line(name: string, quantity: number, unitPriceKobo: number, serial = ''): TradeSaleLine {
  return { name, quantity, unitPriceKobo, brand: '', model: '', serial }
}

function seedSales(): TradeSaleView[] {
  const card = (handle: string) => DIRECTORY.find((d) => d.handle === handle)!
  const now = Date.now()
  return [
    {
      id: 'demo-s1',
      direction: 'buying',
      partner: card('ikeja-phone-hub'),
      requestId: 'demo-r1',
      receiptNumber: 'REC-204118',
      amountKobo: 2_900_000_00,
      lines: [
        line('iPhone 15 Pro Max 256GB', 1, 1_450_000_00, '356938035643809'),
        line('iPhone 15 Pro Max 256GB', 1, 1_450_000_00, '356938035643817'),
      ],
      state: 'awaiting_payment',
      createdAtMs: now - HOUR,
      expiresAtMs: now + 47 * HOUR,
      paidAtMs: 0,
      stockAdded: false,
    },
    {
      id: 'demo-s2',
      direction: 'selling',
      partner: card('ikeja-phone-hub'),
      requestId: 'demo-r3',
      receiptNumber: 'REC-203977',
      amountKobo: 185_000_00,
      lines: [line('AirPods Pro (2nd gen)', 1, 185_000_00)],
      state: 'paid',
      createdAtMs: now - 20 * HOUR,
      expiresAtMs: now + 28 * HOUR,
      paidAtMs: now - 18 * HOUR,
      stockAdded: false,
    },
  ]
}

function currentSales(): TradeSaleView[] {
  sales ??= seedSales()
  return sales
}

export function getDemoTradeSales(): TradeSaleView[] {
  return clone(currentSales())
}

export function billDemoPartner(requestId: string, receiptId: string): { id: string; url: string } {
  const req = currentRequests().incoming.find((r) => r.id === requestId)
  if (!req) throw new Error('Not found')
  if (req.myReply?.status !== 'have') throw new Error('Reply that you have it before billing them.')
  const quantity = req.myReply.quantity || req.quantity
  const unit = req.myReply.priceKobo ?? 0
  const id = `demo-s${Date.now()}`
  currentSales().unshift({
    id,
    direction: 'selling',
    partner: req.from,
    requestId,
    receiptNumber: `REC-${receiptId.slice(-6).toUpperCase()}`,
    amountKobo: unit * quantity,
    lines: [line(req.item, quantity, unit)],
    state: 'awaiting_payment',
    createdAtMs: Date.now(),
    expiresAtMs: Date.now() + 48 * HOUR,
    paidAtMs: 0,
    stockAdded: false,
  })
  return { id, url: `https://storvv.com/pay/demo-${id}` }
}

function buyingSale(id: string): TradeSaleView {
  const sale = currentSales().find((s) => s.id === id && s.direction === 'buying')
  if (!sale) throw new Error('Not found')
  return sale
}

export function payDemoTradeSale(id: string): void {
  const sale = buyingSale(id)
  if (sale.state !== 'awaiting_payment') throw new Error('This bill can no longer be paid.')
  Object.assign(sale, { state: 'paid', paidAtMs: Date.now() })
}

export function getDemoTradeReceipt(id: string): TradeReceiptView {
  const sale = buyingSale(id)
  if (sale.state !== 'paid') throw new Error('This bill has not been paid yet.')
  return {
    receiptNumber: sale.receiptNumber,
    sellerName: sale.partner.displayName,
    date: new Date(sale.paidAtMs).toISOString(),
    items: sale.lines.map((l) => ({
      itemName: l.name,
      quantity: l.quantity,
      price: l.unitPriceKobo / 100,
    })),
    total: sale.amountKobo / 100,
  }
}

export function claimDemoTradeStock(id: string, action: 'claim' | 'release'): TradeSaleLine[] {
  const sale = buyingSale(id)
  if (action === 'release') {
    sale.stockAdded = false
    return []
  }
  if (sale.state !== 'paid') throw new Error('This bill has not been paid yet.')
  if (sale.stockAdded) throw new Error('These items were already added.')
  sale.stockAdded = true
  return clone(sale.lines)
}
