import { describe, expect, it } from 'vitest'
import { humanizeFieldKey, sanitizeActivityDetails } from '~/utils/activity-details'
import { itemChanges, itemSnapshotFacts } from '~/utils/inventory-activity'

describe('sanitizeActivityDetails', () => {
  it('keeps known fields, drops empty facts and unknown keys', () => {
    const out = sanitizeActivityDetails({
      facts: [
        { label: 'Total', value: 9000000, money: true },
        { label: 'Empty', value: '' },
        { label: '', value: 'no label' },
      ],
      changes: [{ label: 'Price', from: 9000000, to: 7000000, money: true }],
      lines: [{ name: 'Honda', qty: 1, amount: 7000000, was: 9000000, note: 'Price changed' }],
      evil: '<script>',
    })
    expect(out).toEqual({
      facts: [{ label: 'Total', value: 9000000, money: true }],
      changes: [{ label: 'Price', from: 9000000, to: 7000000, money: true }],
      lines: [{ name: 'Honda', qty: 1, amount: 7000000, was: 9000000, note: 'Price changed' }],
    })
  })

  it('only allows in-app links', () => {
    expect(sanitizeActivityDetails({ link: { label: 'x', path: 'https://evil.test' } })).toBeNull()
    expect(sanitizeActivityDetails({ link: { label: 'x', path: '//evil.test' } })).toBeNull()
    expect(
      sanitizeActivityDetails({ link: { label: 'Sale', path: '/receipts?receipt=a' } })
    ).toEqual({
      link: { label: 'Sale', path: '/receipts?receipt=a' },
    })
  })

  it('caps sizes and turns dates into ISO strings', () => {
    const out = sanitizeActivityDetails({
      lines: Array.from({ length: 100 }, (_, i) => ({ name: `Item ${i}` })),
      facts: [{ label: 'When', value: new Date('2026-11-19T10:00:00Z') }],
    })
    expect(out?.lines).toHaveLength(60)
    expect(out?.facts?.[0]?.value).toBe('2026-11-19T10:00:00.000Z')
  })
})

describe('item activity diff', () => {
  const folder = {
    name: 'Sedan',
    template: {
      fields: [
        { name: 'price', label: 'Unit Price', type: 'currency' },
        { name: 'colour', label: 'Colour', type: 'text' },
        { name: 'serialNo', label: 'Serial', type: 'text' },
      ],
    },
  }

  it('lists only fields that really changed, with the category labels', () => {
    const changes = itemChanges(
      { price: 9000000, colour: 'Black', serialNo: 'SN4' },
      { price: '9500000', colour: 'Black', serialNo: 'SN4', updatedAt: new Date() },
      folder
    )
    expect(changes).toEqual([{ label: 'Unit Price', from: 9000000, to: 9500000, money: true }])
  })

  it('labels fields the template does not know', () => {
    expect(itemChanges({}, { engineNumber: '432wl' })).toEqual([
      { label: 'Engine number', from: null, to: '432wl' },
    ])
    expect(humanizeFieldKey('chasis_number')).toBe('Chasis number')
  })

  it('snapshots an item in template order', () => {
    const facts = itemSnapshotFacts({ colour: 'Red', price: 100, serialNo: 'SN1' }, folder)
    expect(facts.map((f) => f.label)).toEqual(['Category', 'Unit Price', 'Colour', 'Serial'])
    expect(facts[1]).toMatchObject({ value: 100, money: true })
  })
})
