import { describe, expect, it } from 'vitest'
import {
  cleanPhone,
  demoInterest,
  demoPageKey,
  demoPageLabel,
  normalizeDemoPath,
  validateDemoLead,
  validateDemoTrackBatch,
} from '~/utils/demo-insights'

const ID = 'a'.repeat(32)
const ID2 = 'b'.repeat(32)

describe('validateDemoLead', () => {
  it('accepts a name with a WhatsApp number and tidies it', () => {
    const result = validateDemoLead({
      name: '  Ada   Obi ',
      phone: '+234 803 000 0000',
      branches: '2-3',
      source: 'demo_exit',
      visitorId: ID,
      sessionId: ID2,
    })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data.name).toBe('Ada Obi')
    expect(result.data.phone).toBe('+2348030000000')
    expect(result.data.preferredContact).toBe('whatsapp')
    expect(result.data.branches).toBe('2-3')
    expect(result.data.source).toBe('demo_exit')
    expect(result.data.sessionId).toBe(ID2)
  })

  it('needs at least one way to reach the visitor', () => {
    const result = validateDemoLead({ name: 'Ada' })
    expect(result).toMatchObject({ ok: false, field: 'phone' })
  })

  it('rejects a bad email or phone', () => {
    expect(validateDemoLead({ name: 'Ada', email: 'nope' })).toMatchObject({
      ok: false,
      field: 'email',
    })
    expect(validateDemoLead({ name: 'Ada', phone: '12' })).toMatchObject({
      ok: false,
      field: 'phone',
    })
  })

  it('never prefers a channel with no details', () => {
    const result = validateDemoLead({ name: 'Ada', email: 'ada@shop.ng', preferredContact: 'call' })
    expect(result.ok && result.data.preferredContact).toBe('email')
  })

  it('drops unknown values, control characters and bad ids', () => {
    const result = validateDemoLead({
      name: 'Ada\u0000\nObi',
      email: 'ADA@Shop.ng',
      branches: '500',
      source: 'somewhere',
      visitorId: 'short',
      message: 'x'.repeat(900),
    })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data.name).toBe('Ada Obi')
    expect(result.data.email).toBe('ada@shop.ng')
    expect(result.data.branches).toBe('')
    expect(result.data.source).toBe('demo_banner')
    expect(result.data.visitorId).toBeNull()
    expect(result.data.message).toHaveLength(500)
  })
})

describe('demo paths', () => {
  it('folds record ids and ignores anything outside the demo', () => {
    expect(normalizeDemoPath('/demo/dashboard/inventory/Xy12abc?x=1')).toBe(
      '/demo/dashboard/inventory/:id'
    )
    expect(normalizeDemoPath('/demo/dashboard/receipts/')).toBe('/demo/dashboard/receipts')
    expect(normalizeDemoPath('/dashboard/receipts')).toBeNull()
    expect(normalizeDemoPath('/demox')).toBeNull()
    expect(normalizeDemoPath(42)).toBeNull()
  })

  it('makes Firestore-safe keys and readable labels', () => {
    expect(demoPageKey('/demo/dashboard/multi-store-sync')).toBe('dashboard~multi-store-sync')
    expect(demoPageKey('/demo/dashboard/inventory/:id')).toBe('dashboard~inventory~id')
    expect(demoPageLabel('dashboard')).toBe('Overview')
    expect(demoPageLabel('dashboard~multi-store-sync')).toBe('Multi store sync')
    expect(demoPageLabel('dashboard~inventory~id')).toBe('Inventory')
  })

  it('cleans phone numbers', () => {
    expect(cleanPhone(' +1 (555) 010-9999 ')).toBe('+15550109999')
    expect(cleanPhone('abc')).toBe('')
  })
})

describe('validateDemoTrackBatch', () => {
  it('keeps valid events and caps page time', () => {
    const batch = validateDemoTrackBatch({
      visitorId: ID,
      sessionId: ID2,
      referrerHost: 'Google.com',
      events: [
        { type: 'page', path: '/demo/dashboard', seconds: 0 },
        { type: 'page', path: '/demo/dashboard', seconds: 99999 },
        { type: 'page', path: '/dashboard', seconds: 5 },
        { type: 'action', name: 'sale_created' },
        { type: 'action', name: 'delete_everything' },
        null,
      ],
    })
    expect(batch?.referrerHost).toBe('google.com')
    expect(batch?.events).toEqual([
      { type: 'page', path: '/demo/dashboard', seconds: 0 },
      { type: 'page', path: '/demo/dashboard', seconds: 1800 },
      { type: 'action', name: 'sale_created' },
    ])
  })

  it('rejects missing or malformed ids', () => {
    expect(validateDemoTrackBatch({ visitorId: 'x', sessionId: ID2, events: [] })).toBeNull()
    expect(validateDemoTrackBatch({ visitorId: ID, sessionId: ID2 })).toBeNull()
  })

  it('caps the number of events per request', () => {
    const events = Array.from({ length: 100 }, () => ({ type: 'action', name: 'exit' }))
    expect(validateDemoTrackBatch({ visitorId: ID, sessionId: ID2, events })?.events).toHaveLength(
      40
    )
  })
})

describe('demoInterest', () => {
  it('ranks visitors by what they did', () => {
    expect(demoInterest({ hasLead: true })).toBe('hot')
    expect(demoInterest({ actions: { sale_created: 1, item_added: 1 } })).toBe('hot')
    expect(demoInterest({ activeSeconds: 700 })).toBe('hot')
    expect(demoInterest({ actions: { sale_created: 1 } })).toBe('warm')
    expect(demoInterest({ activeSeconds: 150 })).toBe('warm')
    expect(demoInterest({ activeSeconds: 20, pageCount: 2, actions: { exit: 1 } })).toBe('cold')
  })
})
