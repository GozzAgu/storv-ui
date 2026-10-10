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
}

export interface TradeLookupResult {
  partner: TradePartnerCard
  /** Relationship from the caller's side; `none` covers anything that can be (re)requested. */
  relation: 'self' | 'none' | 'incoming' | 'outgoing' | 'active'
}
