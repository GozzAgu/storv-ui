import { describe, expect, it } from 'vitest'
import { evaluatePaymentLinkItemStock } from '~/server/utils/payment-link-settle'
import { paymentLinkPendingId } from '~/server/utils/payment-links'

const item = {
  itemId: 'i1',
  folderId: 'f1',
  name: 'Phone',
  unitPrice: 100_000,
  quantity: 1,
}

describe('evaluatePaymentLinkItemStock', () => {
  it('allows serial item with our pending hold', () => {
    const token = 'abc'
    const result = evaluatePaymentLinkItemStock({
      token,
      item,
      itemData: { pendingSaleReceiptId: paymentLinkPendingId(token) },
      folder: { hasSerialNumbers: true },
    })
    expect(result).toEqual({ ok: true, usesSerial: true })
  })

  it('blocks serial item that already has dateOut', () => {
    const result = evaluatePaymentLinkItemStock({
      token: 'abc',
      item,
      itemData: { dateOut: new Date().toISOString() },
      folder: { hasSerialNumbers: true },
    })
    expect(result).toEqual({ ok: false, reason: 'already_sold' })
  })

  it('blocks serial item held by another payment link', () => {
    const result = evaluatePaymentLinkItemStock({
      token: 'abc',
      item,
      itemData: { pendingSaleReceiptId: paymentLinkPendingId('other') },
      folder: { hasSerialNumbers: true },
    })
    expect(result).toEqual({ ok: false, reason: 'held_by_other' })
  })

  it('allows bulk decrement when stock is sufficient', () => {
    const result = evaluatePaymentLinkItemStock({
      token: 'abc',
      item: { ...item, quantity: 2 },
      itemData: { quantity: 5 },
      folder: {
        hasSerialNumbers: false,
        template: { fields: [{ name: 'quantity' }] },
      },
    })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.usesSerial).toBe(false)
      expect(result.newQty).toBe(3)
    }
  })

  it('blocks bulk when stock is insufficient (no silent clamp)', () => {
    const result = evaluatePaymentLinkItemStock({
      token: 'abc',
      item: { ...item, quantity: 3 },
      itemData: { quantity: 2 },
      folder: {
        hasSerialNumbers: false,
        template: { fields: [{ name: 'quantity' }] },
      },
    })
    expect(result).toEqual({ ok: false, reason: 'insufficient_stock' })
  })

  it('blocks bulk when another checkout holds the line', () => {
    const result = evaluatePaymentLinkItemStock({
      token: 'abc',
      item,
      itemData: { quantity: 4, pendingSaleReceiptId: paymentLinkPendingId('other') },
      folder: {
        hasSerialNumbers: false,
        template: { fields: [{ name: 'quantity' }] },
      },
    })
    expect(result).toEqual({ ok: false, reason: 'held_by_other' })
  })
})
