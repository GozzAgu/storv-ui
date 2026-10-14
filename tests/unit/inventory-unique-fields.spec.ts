import { describe, expect, it } from 'vitest'
import {
  canFieldBeUnique,
  findUniqueValueClashInBatch,
  normalizeUniqueValue,
  uniqueTemplateFields,
} from '~/utils/inventory-unique-fields'

const engine = { name: 'engine_number', label: 'Engine Number', type: 'text', unique: true }
const chassis = { name: 'chassis_number', label: 'Chassis Number', type: 'text', unique: true }
const colour = { name: 'colour', label: 'Colour', type: 'text' }

describe('canFieldBeUnique', () => {
  it('allows text and number columns', () => {
    expect(canFieldBeUnique({ name: 'imei', type: 'text' })).toBe(true)
    expect(canFieldBeUnique({ name: 'tag', type: 'number' })).toBe(true)
  })

  it('refuses other types and the product-line columns', () => {
    expect(canFieldBeUnique({ name: 'price', type: 'currency' })).toBe(false)
    expect(canFieldBeUnique({ name: 'when', type: 'date' })).toBe(false)
    expect(canFieldBeUnique({ name: 'brand', type: 'text' })).toBe(false)
    expect(canFieldBeUnique({ name: 'serialNo', type: 'text' })).toBe(false)
  })
})

describe('uniqueTemplateFields', () => {
  it('keeps only columns marked unique that can be unique', () => {
    const stale = { name: 'price', label: 'Price', type: 'currency', unique: true }
    expect(uniqueTemplateFields([engine, colour, stale, chassis])).toEqual([engine, chassis])
  })
})

describe('normalizeUniqueValue', () => {
  it('ignores case, spaces and dashes', () => {
    expect(normalizeUniqueValue(' ghs-1847 3829 ')).toBe('GHS18473829')
    expect(normalizeUniqueValue('GHS18473829')).toBe('GHS18473829')
  })

  it('treats empty values as blank', () => {
    expect(normalizeUniqueValue(undefined)).toBe('')
    expect(normalizeUniqueValue(null)).toBe('')
    expect(normalizeUniqueValue('  ')).toBe('')
  })

  it('stringifies numbers', () => {
    expect(normalizeUniqueValue(12345)).toBe('12345')
  })
})

describe('findUniqueValueClashInBatch', () => {
  it('returns null when every value is distinct', () => {
    const items = [
      { engine_number: 'E1', chassis_number: 'C1' },
      { engine_number: 'E2', chassis_number: 'C2' },
    ]
    expect(findUniqueValueClashInBatch(items, [engine, chassis])).toBeNull()
  })

  it('finds a repeat even when written differently', () => {
    const items = [{ engine_number: 'abc-123' }, { engine_number: 'ABC 123' }]
    expect(findUniqueValueClashInBatch(items, [engine])).toEqual({
      fieldName: 'engine_number',
      fieldLabel: 'Engine Number',
      value: 'ABC 123',
    })
  })

  it('ignores blanks and columns that are not unique', () => {
    const items = [
      { engine_number: '', colour: 'Black' },
      { engine_number: '', colour: 'Black' },
    ]
    expect(findUniqueValueClashInBatch(items, [engine, colour])).toBeNull()
  })
})
