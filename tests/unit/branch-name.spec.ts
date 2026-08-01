import { describe, expect, it } from 'vitest'
import { formatBranchDisplayName, parseBranchDisplayName } from '~/utils/branch-name'

describe('branch-name', () => {
  it('formats city-only branch names', () => {
    expect(formatBranchDisplayName('Lagos')).toBe('Lagos')
    expect(formatBranchDisplayName('Lagos', '')).toBe('Lagos')
  })

  it('formats city with locality', () => {
    expect(formatBranchDisplayName('Lagos', 'Lekki')).toBe('Lagos, Lekki')
    expect(formatBranchDisplayName(' Port Harcourt ', ' GRA ')).toBe('Port Harcourt, GRA')
  })

  it('parses city-only names', () => {
    expect(parseBranchDisplayName('Lagos')).toEqual({ city: 'Lagos', locality: '' })
    expect(parseBranchDisplayName('Port Harcourt')).toEqual({
      city: 'Port Harcourt',
      locality: '',
    })
  })

  it('parses city with locality', () => {
    expect(parseBranchDisplayName('Lagos, Lekki')).toEqual({ city: 'Lagos', locality: 'Lekki' })
    expect(parseBranchDisplayName('Port Harcourt, GRA')).toEqual({
      city: 'Port Harcourt',
      locality: 'GRA',
    })
  })

  it('parses custom branch names without known cities', () => {
    expect(parseBranchDisplayName('My Branch')).toEqual({ city: 'My Branch', locality: '' })
  })
})
