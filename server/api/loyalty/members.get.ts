import { defineLoyaltyRoute } from '~/server/utils/loyalty/http'
import { loyaltyRefs } from '~/server/utils/loyalty/sync'
import {
  loyaltyCustomerKey,
  loyaltyNextTier,
  loyaltySpendLast12Months,
  loyaltyTierFor,
  readLoyaltySettings,
  type LoyaltySettings,
} from '~/utils/loyalty'

export interface LoyaltyMemberDto {
  key: string
  name: string
  phone: string | null
  email: string | null
  points: number
  spend12m: number
  tier: { id: string; name: string; multiplier: number }
  next: { name: string; remaining: number } | null
}

function toDto(
  data: Record<string, unknown>,
  settings: LoyaltySettings,
  now: Date
): LoyaltyMemberDto {
  const spend12m = loyaltySpendLast12Months(data.spendByMonth as Record<string, number>, now)
  const tier = loyaltyTierFor(spend12m, settings.tiers)
  const next = loyaltyNextTier(spend12m, settings.tiers)
  return {
    key: String(data.key ?? ''),
    name: String(data.name ?? 'Customer'),
    phone: (data.phone as string | null) ?? null,
    email: (data.email as string | null) ?? null,
    points: Math.max(0, Number(data.points) || 0),
    spend12m,
    tier: { id: tier.id, name: tier.name, multiplier: tier.multiplier },
    next: next ? { name: next.tier.name, remaining: next.remaining } : null,
  }
}

/** Top customers by points, or one customer by phone or email (`phone` / `email` query). */
export default defineLoyaltyRoute(
  { method: 'GET', rateLimit: { id: 'loyalty:read', limit: 120, windowMs: 60_000 } },
  async ({ db, ownerId, input }) => {
    const refs = loyaltyRefs(db, ownerId)
    const settings = readLoyaltySettings((await refs.settings.get()).data())
    const now = new Date()

    if (input.phone || input.email) {
      const key = loyaltyCustomerKey({
        customerPhone: typeof input.phone === 'string' ? input.phone : '',
        customerEmail: typeof input.email === 'string' ? input.email : '',
      })
      if (!key) return { member: null }
      const snap = await refs.members.doc(key).get()
      return { member: snap.exists ? toDto(snap.data()!, settings, now) : null }
    }

    const limit = Math.min(50, Math.max(1, Number(input.limit) || 10))
    const snap = await refs.members
      .where('points', '>', 0)
      .orderBy('points', 'desc')
      .limit(limit)
      .get()
    return { members: snap.docs.map((d) => toDto(d.data(), settings, now)) }
  }
)
