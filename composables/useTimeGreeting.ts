import { computed } from 'vue'

export type GreetingPeriod = 'morning' | 'afternoon' | 'evening'

/** Visual sky mood used by the dashboard greeting icon. */
export type SkyCondition = 'sunny' | 'partly-cloudy' | 'cloudy' | 'clear-night'

const GREETINGS: Record<GreetingPeriod, string> = {
  morning: 'Good morning',
  afternoon: 'Good afternoon',
  evening: 'Good evening',
}

export function greetingPeriod(hour: number): GreetingPeriod {
  if (hour < 12) return 'morning'
  if (hour < 17) return 'afternoon'
  return 'evening'
}

/**
 * Time-of-day sky with light day-stable variety (no weather API).
 * Same calendar day + hour band keeps a consistent icon across refreshes.
 */
export function skyConditionForDate(date = new Date()): SkyCondition {
  const hour = date.getHours()
  const daySeed = date.getDate() + date.getMonth() * 31
  const roll = (daySeed * 17 + Math.floor(hour / 3)) % 10

  if (hour >= 5 && hour < 8) {
    return roll < 7 ? 'sunny' : 'partly-cloudy'
  }
  if (hour >= 8 && hour < 17) {
    if (roll < 5) return 'sunny'
    if (roll < 8) return 'partly-cloudy'
    return 'cloudy'
  }
  if (hour >= 17 && hour < 20) {
    return roll < 5 ? 'partly-cloudy' : 'clear-night'
  }
  return roll < 3 ? 'cloudy' : 'clear-night'
}

export function useTimeGreeting() {
  const now = computed(() => new Date())

  const period = computed(() => greetingPeriod(now.value.getHours()))

  const greeting = computed(() => GREETINGS[period.value])

  const skyCondition = computed(() => skyConditionForDate(now.value))

  function formatGreeting(name: string) {
    const trimmed = name.trim()
    return trimmed ? `${greeting.value}, ${trimmed}` : greeting.value
  }

  return { greeting, period, skyCondition, formatGreeting }
}
