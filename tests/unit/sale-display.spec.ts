import { describe, expect, it } from 'vitest'
import {
  formatSaleWhen,
  isWalkInCustomer,
  paymentKind,
  summarizeSaleItems,
} from '~/utils/sale-display'

const now = new Date(2026, 10, 25, 15, 0) // 25 Nov 2026, 3:00 pm

describe('formatSaleWhen', () => {
  it('shows the time for today and yesterday', () => {
    expect(formatSaleWhen(new Date(2026, 10, 25, 14, 15), now).label).toBe('Today, 2:15 pm')
    expect(formatSaleWhen(new Date(2026, 10, 24, 9, 4), now).label).toBe('Yesterday, 9:04 am')
  })

  it('shows a short date this year and adds the year for older sales', () => {
    expect(formatSaleWhen(new Date(2026, 10, 21, 10, 0), now).label).toBe('Nov 21')
    expect(formatSaleWhen(new Date(2025, 0, 3, 10, 0), now).label).toBe('Jan 3, 2025')
  })

  it('keeps the full timestamp for the tooltip and copes with missing dates', () => {
    expect(formatSaleWhen(new Date(2026, 10, 21, 10, 0), now).title).toContain('2026')
    expect(formatSaleWhen(null, now)).toEqual({ label: '—', title: '' })
    expect(formatSaleWhen('not a date', now)).toEqual({ label: '—', title: '' })
  })
})

describe('isWalkInCustomer', () => {
  it('treats blank and the walk-in placeholder as walk-ins', () => {
    expect(isWalkInCustomer('')).toBe(true)
    expect(isWalkInCustomer(undefined)).toBe(true)
    expect(isWalkInCustomer('Walk-in Customer')).toBe(true)
    expect(isWalkInCustomer('Walk-in customer')).toBe(true)
    expect(isWalkInCustomer('Ada Okonkwo')).toBe(false)
  })
})

describe('summarizeSaleItems', () => {
  it('returns the first item and how many more', () => {
    expect(summarizeSaleItems([{ itemName: 'Hyundai' }])).toEqual({ first: 'Hyundai', more: 0 })
    expect(
      summarizeSaleItems([{ itemName: 'Phone case' }, { itemName: 'Charger' }, { itemName: '' }])
    ).toEqual({ first: 'Phone case', more: 1 })
    expect(summarizeSaleItems(undefined)).toEqual({ first: '', more: 0 })
  })
})

describe('paymentKind', () => {
  it('groups the default tenders', () => {
    expect(paymentKind('Cash')).toBe('cash')
    expect(paymentKind('Card (POS)')).toBe('card')
    expect(paymentKind('Bank Transfer')).toBe('transfer')
    expect(paymentKind('OPay')).toBe('mobile')
    expect(paymentKind('Moniepoint')).toBe('mobile')
    expect(paymentKind('USSD')).toBe('ussd')
    expect(paymentKind('Cash + Transfer')).toBe('split')
    expect(paymentKind('Store credit')).toBe('other')
    expect(paymentKind('')).toBe('other')
  })
})
