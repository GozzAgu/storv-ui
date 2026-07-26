import { describe, expect, it } from 'vitest'
import { getCitiesForRegion, isCityInRegion } from '~/utils/region-cities'

describe('region-cities', () => {
  it('returns sorted cities for Nigeria', () => {
    const cities = getCitiesForRegion('NG')
    expect(cities).toContain('Lagos')
    expect(cities).toContain('Abuja')
    expect(cities[0]).toBe('Aba')
  })

  it('returns empty list for unknown region', () => {
    expect(getCitiesForRegion('XX')).toEqual([])
  })

  it('checks city membership case-insensitively', () => {
    expect(isCityInRegion('lagos', 'NG')).toBe(true)
    expect(isCityInRegion('Paris', 'NG')).toBe(false)
  })
})
