import type {
  TradeAction,
  TradeConnectionView,
  TradeLookupResult,
  TradeOverview,
  TradePartnerCard,
} from '~/types/trade'
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
