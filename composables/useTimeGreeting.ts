import { computed } from 'vue'

const GREETINGS: Record<'morning' | 'afternoon' | 'evening', string> = {
  morning: 'Good morning',
  afternoon: 'Good afternoon',
  evening: 'Good evening',
}

function greetingPeriod(hour: number): keyof typeof GREETINGS {
  if (hour < 12) return 'morning'
  if (hour < 17) return 'afternoon'
  return 'evening'
}

export function useTimeGreeting() {
  const greeting = computed(() => {
    const hour = new Date().getHours()
    return GREETINGS[greetingPeriod(hour)]
  })

  function formatGreeting(name: string) {
    const trimmed = name.trim()
    return trimmed ? `${greeting.value}, ${trimmed}` : greeting.value
  }

  return { greeting, formatGreeting }
}
