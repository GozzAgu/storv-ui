import { describe, expect, it } from 'vitest'
import {
  formatBranchDisplayName,
  getStoreSwitcherPrimaryLabel,
  getStoreSwitcherSecondaryLabel,
  parseBranchDisplayName,
} from '~/utils/branch-name'

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

describe('store switcher labels', () => {
  const phGra = { id: 'a1', name: 'Port Harcourt, GRA', address: '12 Aba Road' }
  const phDiobu = { id: 'b2', name: 'Port Harcourt, Diobu' }
  const kano = { id: 'c3', name: 'Kano' }

  it('keeps short city labels when each city appears once', () => {
    expect(getStoreSwitcherPrimaryLabel(phGra, [phGra, kano])).toBe('Port Harcourt')
    expect(getStoreSwitcherPrimaryLabel(kano, [phGra, kano])).toBe('Kano')
  })

  it('shows full names when two stores share a city short label', () => {
    expect(getStoreSwitcherPrimaryLabel(phGra, [phGra, phDiobu])).toBe('Port Harcourt, GRA')
    expect(getStoreSwitcherPrimaryLabel(phDiobu, [phGra, phDiobu])).toBe('Port Harcourt, Diobu')
  })

  it('prefers locality, then address, for the secondary line', () => {
    expect(getStoreSwitcherSecondaryLabel(phGra)).toBe('GRA')
    expect(
      getStoreSwitcherSecondaryLabel({ id: 'x', name: 'Port Harcourt', address: '12 Aba Road' })
    ).toBe('12 Aba Road')
  })

  it('falls back to a short id tip when duplicate city names have no locality or address', () => {
    const one = { id: 'abcd1234', name: 'Port Harcourt' }
    const two = { id: 'efgh5678', name: 'Port Harcourt' }
    expect(getStoreSwitcherSecondaryLabel(one, [one, two])).toBe('Branch · 1234')
  })
})
