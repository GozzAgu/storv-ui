import { describe, expect, it } from 'vitest'
import { useTimeGreeting } from '~/composables/useTimeGreeting'

describe('useTimeGreeting', () => {
  it('formats greeting with name', () => {
    const { formatGreeting, greeting } = useTimeGreeting()
    expect(greeting.value).toMatch(/^Good (morning|afternoon|evening)$/)
    expect(formatGreeting('Franklin')).toMatch(/^Good (morning|afternoon|evening), Franklin$/)
  })

  it('returns greeting only when name is empty', () => {
    const { formatGreeting, greeting } = useTimeGreeting()
    expect(formatGreeting('')).toBe(greeting.value)
    expect(formatGreeting('   ')).toBe(greeting.value)
  })
})
