import { describe, expect, it } from 'vitest'
import {
  LOYALTY_DEFAULT_SETTINGS,
  loyaltyCustomerKey,
  loyaltyPaidAmount,
  loyaltyPoints,
  loyaltySpendLast12Months,
  loyaltyTierFor,
  parseLoyaltySettings,
  planLoyaltyAward,
  readLoyaltySettings,
  type LoyaltyAward,
  type LoyaltyReceipt,
  type LoyaltySettings,
} from '~/utils/loyalty'

const ON: LoyaltySettings = { ...LOYALTY_DEFAULT_SETTINGS, enabled: true }
const NOW = new Date('2026-10-13T12:00:00Z')

const sale = (over: Partial<LoyaltyReceipt> = {}): LoyaltyReceipt => ({
  status: 'completed',
  total: 25_000,
  date: new Date('2026-10-12T10:00:00Z'),
  customerName: 'Ada',
  customerPhone: '0803 546 5454',
  ...over,
})

function plan(
  receipt: LoyaltyReceipt | null,
  award: LoyaltyAward | null = null,
  settings = ON,
  memberSpend12m = 0
) {
  return planLoyaltyAward({
    storeId: 's1',
    receiptId: 'r1',
    receipt,
    settings,
    award,
    memberSpend12m,
    now: NOW,
  })
}

/** Apply plans one after another, as repeated server syncs would. */
function run(receipts: (LoyaltyReceipt | null)[], settings = ON) {
  let award: LoyaltyAward | null = null
  const totals = new Map<string, number>()
  for (const receipt of receipts) {
    const p = plan(receipt, award, settings)
    for (const c of p.changes)
      totals.set(c.customerKey, (totals.get(c.customerKey) ?? 0) + c.points)
    if (p.award !== undefined) award = p.award
  }
  return { award, totals }
}

describe('loyaltyCustomerKey', () => {
  it('treats local and international forms of a Nigerian number as one customer', () => {
    const keys = ['0803 546 5454', '+234 803 546 5454', '2348035465454', '00234-803-546-5454'].map(
      (customerPhone) => loyaltyCustomerKey({ customerPhone })
    )
    expect(new Set(keys)).toEqual(new Set(['p_2348035465454']))
  })

  it('falls back to a lower-cased email, and refuses walk-ins', () => {
    expect(loyaltyCustomerKey({ customerEmail: ' Ada@Shop.NG ' })).toBe('e_ada@shop.ng')
    expect(loyaltyCustomerKey({ customerPhone: '123', customerEmail: 'not-an-email' })).toBeNull()
    expect(loyaltyCustomerKey({})).toBeNull()
  })

  it('never produces a key that could leave the collection', () => {
    expect(loyaltyCustomerKey({ customerEmail: 'a/b@x.com' })).toBeNull()
  })
})

describe('loyaltyPaidAmount', () => {
  it('counts what has been paid, not what was billed', () => {
    expect(loyaltyPaidAmount(sale())).toEqual({ amount: 25_000, verified: false })
    expect(loyaltyPaidAmount(sale({ status: 'balance_due', amountPaid: 10_000 })).amount).toBe(
      10_000
    )
    expect(loyaltyPaidAmount(sale({ status: 'balance_due', amountPaid: 99_000 })).amount).toBe(
      25_000
    )
    expect(loyaltyPaidAmount(sale({ status: 'pending' })).amount).toBe(0)
    expect(loyaltyPaidAmount(sale({ status: 'refunded' })).amount).toBe(0)
    expect(loyaltyPaidAmount(sale({ status: 'cancelled' })).amount).toBe(0)
    expect(loyaltyPaidAmount(null).amount).toBe(0)
  })

  it('uses the server-confirmed amount for Payments V2 sales, capped at the total', () => {
    expect(
      loyaltyPaidAmount(sale({ paymentSummary: { netPaidKobo: 1_500_000, totalKobo: 2_500_000 } }))
    ).toEqual({ amount: 15_000, verified: true })
    expect(
      loyaltyPaidAmount(sale({ paymentSummary: { netPaidKobo: 3_000_000, totalKobo: 2_500_000 } }))
        .amount
    ).toBe(25_000)
  })
})

describe('points and tiers', () => {
  it('gives 1 point per 1,000 by default, rounded down', () => {
    expect(loyaltyPoints(25_000, 1000, 1)).toBe(25)
    expect(loyaltyPoints(999, 1000, 1)).toBe(0)
    expect(loyaltyPoints(10_000, 1000, 1.5)).toBe(15)
    expect(loyaltyPoints(-5, 1000, 1)).toBe(0)
  })

  it('places customers by spend in the last 12 calendar months', () => {
    const spend = { '2026-10': 300_000, '2025-11': 250_000, '2025-10': 9_000_000 }
    expect(loyaltySpendLast12Months(spend, NOW)).toBe(550_000)
    expect(loyaltyTierFor(550_000, ON.tiers).id).toBe('silver')
    expect(loyaltyTierFor(0, ON.tiers).id).toBe('bronze')
    expect(loyaltyTierFor(2_000_000, ON.tiers).id).toBe('gold')
    expect(loyaltyTierFor(5_000_000, ON.tiers).id).toBe('platinum')
    expect(loyaltyTierFor(12_000_000, ON.tiers).id).toBe('diamond')
  })
})

describe('planLoyaltyAward', () => {
  it('awards a paid sale once; running it again changes nothing', () => {
    const first = plan(sale())
    expect(first.changes).toEqual([
      {
        customerKey: 'p_2348035465454',
        points: 25,
        amount: 25_000,
        month: '2026-10',
        type: 'earn',
      },
    ])
    const again = plan(sale(), first.award!)
    expect(again.changes).toEqual([])
    expect(again.award).toBeUndefined()
  })

  it('takes every point back on refund, and on delete', () => {
    const { totals, award } = run([sale(), sale({ status: 'refunded' })])
    expect(totals.get('p_2348035465454')).toBe(0)
    expect(award?.points).toBe(0)
    expect(run([sale(), null]).totals.get('p_2348035465454')).toBe(0)
  })

  it('earns on a part-paid sale as payments come in, and never twice', () => {
    const { totals, award } = run([
      sale({ status: 'balance_due', amountPaid: 10_000 }),
      sale({ status: 'balance_due', amountPaid: 10_000 }),
      sale({ status: 'balance_due', amountPaid: 20_000 }),
      sale({ status: 'completed', amountPaid: 25_000 }),
      sale({ status: 'completed', amountPaid: 25_000 }),
    ])
    expect(totals.get('p_2348035465454')).toBe(25)
    expect(award).toMatchObject({ amount: 25_000, points: 25 })
  })

  it('handles a partial refund on a Payments V2 sale', () => {
    const paid = sale({ paymentSummary: { netPaidKobo: 2_500_000, totalKobo: 2_500_000 } })
    const partRefund = sale({ paymentSummary: { netPaidKobo: 1_000_000, totalKobo: 2_500_000 } })
    expect(run([paid, partRefund]).totals.get('p_2348035465454')).toBe(10)
  })

  it('keeps the rate a sale earned at when the owner changes the rules later', () => {
    const first = plan(sale())
    const cheaper = { ...ON, spendPerPoint: 100 }
    expect(plan(sale(), first.award!, cheaper).changes).toEqual([])
    expect(plan(sale({ total: 30_000 }), first.award!, cheaper).changes[0]?.points).toBe(5)
  })

  it('applies the tier multiplier the customer had when the sale first earned', () => {
    expect(plan(sale({ total: 10_000 }), null, ON, 2_500_000).changes[0]?.points).toBe(15)
  })

  it('moves points when the sale is re-assigned to another customer', () => {
    const first = plan(sale())
    const moved = plan(sale({ customerPhone: '08099999999' }), first.award!)
    expect(moved.changes.map((c) => [c.customerKey, c.points])).toEqual([
      ['p_2348035465454', -25],
      ['p_2348099999999', 25],
    ])
  })

  it('gives nothing while rewards are off, to walk-ins, or for unpaid sales', () => {
    expect(plan(sale(), null, LOYALTY_DEFAULT_SETTINGS).changes).toEqual([])
    expect(plan(sale({ customerPhone: '', customerEmail: '' })).changes).toEqual([])
    expect(plan(sale({ status: 'pending' })).changes).toEqual([])
  })

  it('still takes points back after rewards are switched off', () => {
    const first = plan(sale())
    const off = { ...ON, enabled: false }
    expect(plan(sale({ status: 'refunded' }), first.award!, off).changes[0]?.points).toBe(-25)
  })

  it('earns only on confirmed payments when the owner chooses so', () => {
    const confirmedOnly = { ...ON, earnFrom: 'confirmed' as const }
    expect(plan(sale(), null, confirmedOnly).changes).toEqual([])
    const v2 = sale({ paymentSummary: { netPaidKobo: 2_500_000, totalKobo: 2_500_000 } })
    expect(plan(v2, null, confirmedOnly).changes[0]).toMatchObject({ points: 25 })
    expect(plan(v2, null, confirmedOnly).award?.verified).toBe(true)
  })
})

describe('parseLoyaltySettings', () => {
  const valid = {
    enabled: true,
    spendPerPoint: 500,
    earnFrom: 'all',
    tiers: [
      { name: 'Regular', minSpend: 123, multiplier: 1 },
      { name: 'VIP', minSpend: 100_000, multiplier: 1.333 },
      { name: 'Elite', minSpend: 1_000_000, multiplier: 2 },
      { name: 'Prestige', minSpend: 3_000_000, multiplier: 2.5 },
      { name: 'Icon', minSpend: 8_000_000, multiplier: 3 },
    ],
  }
  const rest = valid.tiers.slice(3)

  it('accepts the owner’s own rules, fixing the first tier at zero', () => {
    const s = parseLoyaltySettings(valid)
    expect(s.tiers.map((t) => [t.id, t.name, t.minSpend, t.multiplier])).toEqual([
      ['bronze', 'Regular', 0, 1],
      ['silver', 'VIP', 100_000, 1.33],
      ['gold', 'Elite', 1_000_000, 2],
      ['platinum', 'Prestige', 3_000_000, 2.5],
      ['diamond', 'Icon', 8_000_000, 3],
    ])
  })

  it.each([
    [{ ...valid, enabled: 'yes' }, /enabled/],
    [{ ...valid, spendPerPoint: 0 }, /at least 1/],
    [{ ...valid, earnFrom: 'some' }, /which sales/],
    [{ ...valid, tiers: valid.tiers.slice(0, 2) }, /all 5 tiers/],
    [
      {
        ...valid,
        tiers: [valid.tiers[0], { ...valid.tiers[1], name: '' }, valid.tiers[2], ...rest],
      },
      /name/,
    ],
    [{ ...valid, tiers: [valid.tiers[0], valid.tiers[2], valid.tiers[1], ...rest] }, /more spend/],
    [
      {
        ...valid,
        tiers: [valid.tiers[0], { ...valid.tiers[1], multiplier: 9 }, valid.tiers[2], ...rest],
      },
      /1× and 5×/,
    ],
  ])('rejects bad input %#', (input, message) => {
    expect(() => parseLoyaltySettings(input)).toThrow(message)
  })

  it('falls back to defaults (off) for missing or damaged stored settings', () => {
    expect(readLoyaltySettings(undefined).enabled).toBe(false)
    expect(readLoyaltySettings({ enabled: true, spendPerPoint: -1 }).enabled).toBe(false)
  })

  it('keeps settings saved with three tiers, adding Platinum and Diamond at Gold’s rate', () => {
    const s = readLoyaltySettings({ ...valid, tiers: valid.tiers.slice(0, 3) })
    expect(s.enabled).toBe(true)
    expect(s.spendPerPoint).toBe(500)
    expect(s.tiers.map((t) => [t.id, t.name, t.minSpend, t.multiplier])).toEqual([
      ['bronze', 'Regular', 0, 1],
      ['silver', 'VIP', 100_000, 1.33],
      ['gold', 'Elite', 1_000_000, 2],
      ['platinum', 'Platinum', 5_000_000, 2],
      ['diamond', 'Diamond', 10_000_000, 2],
    ])
  })

  it('puts the added tiers above a high Gold threshold', () => {
    const tiers = [
      valid.tiers[0],
      valid.tiers[1],
      { name: 'Gold', minSpend: 8_000_000, multiplier: 1.5 },
    ]
    const s = readLoyaltySettings({ ...valid, tiers })
    expect(s.tiers.slice(3).map((t) => t.minSpend)).toEqual([20_000_000, 40_000_000])
  })
})
