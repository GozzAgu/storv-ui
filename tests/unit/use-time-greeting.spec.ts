import { describe, expect, it } from 'vitest'
import {
  greetingPeriod,
  skyConditionForDate,
  useTimeGreeting,
} from '~/composables/useTimeGreeting'

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

  it('maps hours to greeting periods', () => {
    expect(greetingPeriod(7)).toBe('morning')
    expect(greetingPeriod(13)).toBe('afternoon')
    expect(greetingPeriod(20)).toBe('evening')
  })

  it('returns a sky condition for daytime and nighttime', () => {
    const morning = skyConditionForDate(new Date(2026, 0, 8, 9, 0, 0))
    const night = skyConditionForDate(new Date(2026, 0, 8, 22, 0, 0))
    expect(['sunny', 'partly-cloudy', 'cloudy']).toContain(morning)
    expect(['cloudy', 'clear-night']).toContain(night)
  })

  it('exposes skyCondition from the composable', () => {
    const { skyCondition, period } = useTimeGreeting()
    expect(['sunny', 'partly-cloudy', 'cloudy', 'clear-night']).toContain(skyCondition.value)
    expect(['morning', 'afternoon', 'evening']).toContain(period.value)
  })
})
