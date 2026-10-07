import { describe, expect, it } from 'vitest'
import { kindForTender, parsePaymentSettings } from '~/server/utils/payments/settings'
import { lagosDayRange, lagosToday } from '~/server/utils/payments/service'

describe('kindForTender', () => {
  const defaults = parsePaymentSettings(undefined)

  it('guesses from common labels', () => {
    expect(kindForTender('Cash', defaults)).toBe('cash')
    expect(kindForTender('Card (POS)', defaults)).toBe('pos')
    expect(kindForTender('POS terminal', defaults)).toBe('pos')
    expect(kindForTender('Bank Transfer', defaults)).toBe('manual_transfer')
    expect(kindForTender('OPay', defaults)).toBe('manual_transfer')
    expect(kindForTender('Cashapp-ish', defaults)).toBe('manual_transfer')
  })

  it('uses the owner mapping first, case and spacing insensitive', () => {
    const settings = parsePaymentSettings({
      tenderKinds: { '  MoniePoint ': 'pos', Cash: 'manual_transfer' },
    })
    expect(kindForTender('moniepoint', settings)).toBe('pos')
    expect(kindForTender('CASH', settings)).toBe('manual_transfer')
  })

  it('never maps a tender to a Paystack link and defaults cash mode to each', () => {
    const settings = parsePaymentSettings({
      cashConfirmation: 'weird',
      tenderKinds: { OPay: 'paystack_link' },
    })
    expect(settings).toEqual({ cashConfirmation: 'each', tenderKinds: {} })
  })
})

describe('Lagos business day', () => {
  it('is midnight to midnight in Lagos (UTC+1)', () => {
    expect(lagosDayRange('2026-10-07')).toEqual({
      start: '2026-10-06T23:00:00.000Z',
      end: '2026-10-07T23:00:00.000Z',
    })
  })

  it('rejects malformed and impossible dates', () => {
    expect(() => lagosDayRange('07/10/2026')).toThrow()
    expect(() => lagosDayRange('2026-13-45')).toThrow()
  })

  it('rolls over at 23:00 UTC', () => {
    expect(lagosToday(new Date('2026-10-07T22:59:59Z'))).toBe('2026-10-07')
    expect(lagosToday(new Date('2026-10-07T23:00:00Z'))).toBe('2026-10-08')
  })
})
