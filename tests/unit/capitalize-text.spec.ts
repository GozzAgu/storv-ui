import { describe, expect, it } from 'vitest'
import {
  capitalizeFirstLetter,
  capitalizeWords,
  normalizeEntityName,
  normalizeInventoryItemNamedFields,
} from '~/utils/capitalize-text'

describe('capitalize-text', () => {
  it('capitalizes the first letter only', () => {
    expect(capitalizeFirstLetter('toyota')).toBe('Toyota')
    expect(capitalizeFirstLetter('  corolla  ')).toBe('Corolla')
  })

  it('title-cases each word', () => {
    expect(capitalizeWords('toyota corolla')).toBe('Toyota Corolla')
    expect(normalizeEntityName('alfa romeo')).toBe('Alfa Romeo')
  })

  it('normalizes inventory item name fields', () => {
    const item: Record<string, unknown> = {
      name: 'iphone 15',
      brand: 'apple',
      price: 999,
    }
    normalizeInventoryItemNamedFields(item)
    expect(item.name).toBe('Iphone 15')
    expect(item.brand).toBe('Apple')
    expect(item.price).toBe(999)
  })
})
