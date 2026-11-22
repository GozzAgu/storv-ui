import { describe, expect, it } from 'vitest'
import { nameInitials } from '~/utils/name-initials'

describe('nameInitials', () => {
  it('takes the first and last word, or two letters of one word', () => {
    expect(nameInitials('Polanco Sales')).toBe('PS')
    expect(nameInitials('Accounts')).toBe('AC')
    expect(nameInitials('Port Harcourt, GRA Phase 2')).toBe('PP')
    expect(nameInitials('Toyota Camry 2021')).toBe('TC')
    expect(nameInitials('2021')).toBe('20')
    expect(nameInitials('Lagos, HQ, Lekki')).toBe('LL')
  })

  it('handles empty names', () => {
    expect(nameInitials('')).toBe('?')
    expect(nameInitials(undefined)).toBe('?')
    expect(nameInitials(' , ')).toBe('?')
  })
})
