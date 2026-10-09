import { describe, expect, it } from 'vitest'
import {
  buildSaleTenders,
  isV2Sale,
  lagosDate,
  runSequential,
  saleOutstandingKobo,
} from '~/utils/payments-v2-tenders'
import { kindForTender, normalizeTenderLabel } from '~/utils/payment-tender-kind'
import { isNotificationForUser } from '~/stores/notifications'
import { DASHBOARD_NAV_DEFINITIONS, filterDashboardNavItems } from '~/utils/dashboard-nav-filter'
import type { PaymentSummary } from '~/types/payments-v2'

describe('buildSaleTenders', () => {
  it('records the full total on one tender', () => {
    expect(
      buildSaleTenders({ total: 1500.5, isBalanceDue: false, deposit: 0, method: 'Cash' })
    ).toEqual([{ methodLabel: 'Cash', amountKobo: 150050 }])
  })

  it('records only the deposit for balance-due sales, and nothing for a zero deposit', () => {
    expect(
      buildSaleTenders({ total: 1000, isBalanceDue: true, deposit: 250, method: 'POS' })
    ).toEqual([{ methodLabel: 'POS', amountKobo: 25000 }])
    expect(
      buildSaleTenders({ total: 1000, isBalanceDue: true, deposit: 0, method: 'POS' })
    ).toEqual([])
  })

  it('splits, drops empty lines and trims a rounding overshoot off the last line', () => {
    expect(
      buildSaleTenders({
        total: 100,
        isBalanceDue: false,
        deposit: 0,
        method: 'x',
        split: [
          { method: 'Cash', amount: 33.335 },
          { method: '', amount: 0 },
          { method: 'Transfer', amount: 66.665 },
        ],
      })
    ).toEqual([
      { methodLabel: 'Cash', amountKobo: 3334 },
      { methodLabel: 'Transfer', amountKobo: 6666 },
    ])
  })

  it('leaves a real overpayment for the server to refuse', () => {
    const t = buildSaleTenders({
      total: 100,
      isBalanceDue: false,
      deposit: 0,
      method: 'x',
      split: [{ method: 'Cash', amount: 150 }],
    })
    expect(t).toEqual([{ methodLabel: 'Cash', amountKobo: 15000 }])
  })

  it('covers a fully swap-credited sale with no tenders', () => {
    expect(buildSaleTenders({ total: 0, isBalanceDue: false, deposit: 0, method: 'Cash' })).toEqual(
      []
    )
  })
})

describe('V2 sale helpers', () => {
  const summary = {
    totalKobo: 10000,
    netPaidKobo: 3000,
    awaitingKobo: 2000,
    pendingKobo: 1000,
  } as PaymentSummary

  it('knows a V2 sale by its marker or rollup', () => {
    expect(isV2Sale({ total: 1 })).toBe(false)
    expect(isV2Sale({ total: 1, paymentsV2: true })).toBe(true)
    expect(isV2Sale({ total: 1, paymentSummary: summary })).toBe(true)
  })

  it('outstanding is the rollup when present, else the whole total', () => {
    expect(saleOutstandingKobo({ total: 100, paymentSummary: summary })).toBe(4000)
    expect(saleOutstandingKobo({ total: 100, paymentsV2: true })).toBe(10000)
  })

  it('business day is Lagos time', () => {
    expect(lagosDate(new Date('2026-10-07T23:30:00Z'))).toBe('2026-10-08')
  })

  it('runSequential keeps going after a failure', async () => {
    const res = await runSequential(['a', 'b', 'c'], async (id) => {
      if (id === 'b') throw new Error('nope')
    })
    expect(res.ok).toBe(2)
    expect(res.failed.map((f) => f.id)).toEqual(['b'])
  })
})

describe('tender kinds (shared with the server)', () => {
  it('uses the owner mapping first, then guesses', () => {
    expect(kindForTender('Cash', { tenderKinds: {} })).toBe('cash')
    expect(kindForTender('Card POS', { tenderKinds: {} })).toBe('pos')
    expect(kindForTender('OPay', { tenderKinds: {} })).toBe('manual_transfer')
    expect(kindForTender(' OPay ', { tenderKinds: { opay: 'pos' } })).toBe('pos')
    expect(normalizeTenderLabel('  Bank   Transfer ')).toBe('bank transfer')
  })
})

describe('notification recipients', () => {
  it('untargeted notifications reach everyone; targeted ones only recipients', () => {
    expect(isNotificationForUser(undefined, 'u1')).toBe(true)
    expect(isNotificationForUser(['u1'], 'u1')).toBe(true)
    expect(isNotificationForUser(['u2'], 'u1')).toBe(false)
    expect(isNotificationForUser(['u1'], undefined)).toBe(false)
  })
})

describe('Awaiting payments nav item', () => {
  const base = {
    isSuperAdmin: true,
    isManager: true,
    canUseFeature: () => true,
  }
  const names = (opts: Parameters<typeof filterDashboardNavItems>[1]) =>
    filterDashboardNavItems(DASHBOARD_NAV_DEFINITIONS, opts).map((i) => i.name)

  it('shows only to confirmers reported by the server', () => {
    expect(names(base)).not.toContain('Awaiting payments')
    expect(names({ ...base, canConfirmPayments: false })).not.toContain('Awaiting payments')
    expect(names({ ...base, isSuperAdmin: false, canConfirmPayments: true })).toContain(
      'Awaiting payments'
    )
  })
})
