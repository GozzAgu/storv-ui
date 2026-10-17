import { describe, expect, it } from 'vitest'
import { Timestamp, serverTimestamp } from 'firebase/firestore'
import { stripUndefinedDeep } from '~/utils/firestore-clean'
import { receiptEmailErrorMessage } from '~/utils/receipt-email-error'

describe('stripUndefinedDeep', () => {
  it('drops undefined inside sale lines, where Firestore cannot name the field', () => {
    const cleaned = stripUndefinedDeep({
      total: 1000,
      customerPhone: undefined,
      items: [
        { itemId: 'a', serialNo: undefined, brand: 'Apple', productDetails: { colour: undefined } },
        undefined,
      ],
    })
    expect(cleaned).toEqual({
      total: 1000,
      items: [{ itemId: 'a', brand: 'Apple', productDetails: {} }],
    })
  })

  it('keeps timestamps, dates and server timestamp sentinels as they are', () => {
    const ts = Timestamp.fromMillis(1_000)
    const date = new Date(2_000)
    const sentinel = serverTimestamp()
    const cleaned = stripUndefinedDeep({ ts, date, createdAt: sentinel, nested: [{ ts }] })
    expect(cleaned.ts).toBe(ts)
    expect(cleaned.date).toBe(date)
    expect(cleaned.createdAt).toBe(sentinel)
    expect(cleaned.nested[0]!.ts).toBe(ts)
  })
})

describe('receiptEmailErrorMessage', () => {
  it('explains a switched-off email service without server details', () => {
    const message = receiptEmailErrorMessage({
      statusCode: 503,
      data: { message: 'Add RESEND_API_KEY' },
    })
    expect(message).toContain('WhatsApp')
    expect(message).not.toContain('RESEND')
  })

  it('passes other server messages through', () => {
    expect(
      receiptEmailErrorMessage({
        statusCode: 400,
        data: { message: 'A valid customer email is required' },
      })
    ).toBe('A valid customer email is required')
  })
})
