import { describe, it, expect } from 'vitest'
import {
  getLiveSubscriptionAddOns,
  getPlanLimits,
  getStaffLimitForStore,
  staffLimitReachedMessage,
  storeLimitReachedMessage,
  summarizeSubscriptionAddOns,
} from '~/types/subscription'

const NOW = Date.parse('2026-10-06T12:00:00.000Z')

describe('plan limits', () => {
  it('medium allows 2 stores and 5 staff per store', () => {
    expect(getPlanLimits('storvv_medium')).toMatchObject({ maxStores: 2, maxStaffPerStore: 5 })
  })

  it('enterprise allows 5 stores and 10 staff per store', () => {
    expect(getPlanLimits('storvv_enterprise')).toMatchObject({ maxStores: 5, maxStaffPerStore: 10 })
  })
})

describe('subscription add-ons', () => {
  const raw = [
    { id: 's1', kind: 'store', status: 'active' },
    { id: 's2', kind: 'store', status: 'past_due' },
    { id: 'st1', kind: 'staff', storeId: 'lekki', status: 'active' },
    {
      id: 'st2',
      kind: 'staff',
      storeId: 'lekki',
      status: 'canceled',
      endsAt: '2026-10-20T00:00:00.000Z',
    },
    {
      id: 'st3',
      kind: 'staff',
      storeId: 'lekki',
      status: 'canceled',
      endsAt: '2026-09-01T00:00:00.000Z',
    },
    { id: 'bad', kind: 'staff', status: 'active' },
  ]

  it('drops expired and malformed rows', () => {
    expect(getLiveSubscriptionAddOns(raw, NOW).map((a) => a.id)).toEqual(['s1', 's2', 'st1', 'st2'])
    expect(getLiveSubscriptionAddOns('nope', NOW)).toEqual([])
  })

  it('totals extra stores and per-store seats', () => {
    expect(summarizeSubscriptionAddOns(raw, NOW)).toEqual({
      extraStores: 2,
      extraStaffByStore: { lekki: 2 },
    })
  })

  it('raises enterprise limits only', () => {
    const totals = summarizeSubscriptionAddOns(raw, NOW)
    expect(getPlanLimits('storvv_enterprise', totals).maxStores).toBe(7)
    expect(getStaffLimitForStore('storvv_enterprise', 'lekki', totals)).toBe(12)
    expect(getStaffLimitForStore('storvv_enterprise', 'ikeja', totals)).toBe(10)
    expect(getPlanLimits('storvv_medium', totals).maxStores).toBe(2)
    expect(getStaffLimitForStore('storvv_medium', 'lekki', totals)).toBe(5)
  })

  it('points each plan at the right next step', () => {
    expect(staffLimitReachedMessage('storvv_medium', 5)).toContain(
      'Upgrade to Enterprise for 10 per store'
    )
    expect(staffLimitReachedMessage('storvv_enterprise', 10)).toContain('₦2,000/month')
    expect(storeLimitReachedMessage('storvv_medium', 2)).toContain('up to 5')
    expect(storeLimitReachedMessage('storvv_enterprise', 5)).toContain('₦5,000/month')
  })
})
