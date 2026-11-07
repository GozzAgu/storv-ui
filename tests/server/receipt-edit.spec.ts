import { describe, expect, it } from 'vitest'
import { canEditSales, cleanEditReason, planReceiptEdit } from '~/server/utils/sales/edit'
import { EMPTY_STAFF_PERMISSIONS, FULL_STAFF_PERMISSIONS } from '~/utils/staff-permissions'
import type { StoreActor } from '~/server/utils/sales/actor'

const receipt = {
  customerName: 'Jane Doe',
  customerPhone: '0801',
  customerEmail: 'jane@example.com',
  notes: '',
  total: 5000,
}

function actor(overrides: Partial<StoreActor>): StoreActor {
  return {
    isOwner: false,
    permissions: EMPTY_STAFF_PERMISSIONS,
    ...overrides,
  } as StoreActor
}

describe('canEditSales', () => {
  it('lets the owner and receipts.edit holders edit, nobody else', () => {
    expect(canEditSales(actor({ isOwner: true }))).toBe(true)
    expect(canEditSales(actor({ permissions: FULL_STAFF_PERMISSIONS }))).toBe(true)
    expect(canEditSales(actor({}))).toBe(false)
    expect(
      canEditSales(
        actor({
          permissions: {
            ...EMPTY_STAFF_PERMISSIONS,
            receipts: { view: true, create: true, edit: false, delete: false, refund: true },
          },
        })
      )
    ).toBe(false)
  })
})

describe('planReceiptEdit', () => {
  it('records only what changed, with the old and new value', () => {
    const { patch, changes } = planReceiptEdit(receipt, {
      customerName: 'Jane Doe',
      customerPhone: ' 0802 ',
      notes: 'Delivered to office',
    })
    expect(patch).toEqual({ customerPhone: '0802', notes: 'Delivered to office' })
    expect(changes).toEqual([
      { field: 'customerPhone', from: '0801', to: '0802' },
      { field: 'notes', from: '', to: 'Delivered to office' },
    ])
  })

  it('ignores money and stock fields even if sent', () => {
    const { patch } = planReceiptEdit(receipt, { total: 1, items: [], notes: 'x' })
    expect(patch).toEqual({ notes: 'x' })
  })

  it('refuses an edit that changes nothing', () => {
    expect(() => planReceiptEdit(receipt, { customerName: 'Jane Doe' })).toThrow(/Nothing/)
    expect(() => planReceiptEdit(receipt, null)).toThrow(/Nothing/)
  })

  it('keeps a customer name and checks emails', () => {
    expect(() => planReceiptEdit(receipt, { customerName: '  ' })).toThrow(/customer name/)
    expect(() => planReceiptEdit(receipt, { customerEmail: 'not-an-email' })).toThrow(/email/)
  })

  it('refuses non-string and over-long values', () => {
    expect(() => planReceiptEdit(receipt, { notes: { $gt: '' } })).toThrow(/invalid/)
    expect(() => planReceiptEdit(receipt, { notes: 'a'.repeat(1001) })).toThrow(/too long/)
  })
})

describe('cleanEditReason', () => {
  it('requires a short reason', () => {
    expect(() => cleanEditReason('')).toThrow(/why/)
    expect(() => cleanEditReason('ok')).toThrow(/why/)
    expect(cleanEditReason('  Wrong phone number ')).toBe('Wrong phone number')
    expect(() => cleanEditReason('a'.repeat(301))).toThrow(/too long/)
  })
})
