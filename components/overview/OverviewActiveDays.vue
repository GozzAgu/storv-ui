<template>
  <SCard title="Most active day" :description="description" class="s-overview-days">
    <p v-if="busiest === null" class="s-overview-days__empty">
      Sales from the last 30 days will show which day is busiest.
    </p>
    <ol v-else class="s-overview-days__chart">
      <li
        v-for="day in days"
        :key="day.day"
        class="s-overview-days__col"
        :class="{ 's-overview-days__col--peak': day.day === busiest.day }"
      >
        <span class="s-overview-days__track" aria-hidden="true">
          <span class="s-overview-days__bar" :style="{ height: `${barHeight(day.count)}%` }">
            <span v-if="day.day === busiest.day" class="s-overview-days__value">
              {{ day.count }}
            </span>
          </span>
        </span>
        <span class="s-overview-days__label">
          {{ day.label }}<span class="ds-sr-only">: {{ salesLabel(day.count) }}</span>
        </span>
      </li>
    </ol>
  </SCard>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import SCard from '~/components/s/SCard.vue'
import type { DashboardWeekdayActivity } from '~/composables/useDashboardInsights'

const FULL_DAY = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

const props = defineProps<{
  days: DashboardWeekdayActivity[]
}>()

const max = computed(() => Math.max(0, ...props.days.map((d) => d.count)))

const busiest = computed(() =>
  max.value > 0 ? props.days.find((d) => d.count === max.value) ?? null : null
)

const description = computed(() =>
  busiest.value
    ? `${FULL_DAY[busiest.value.day]} is your busiest day, last 30 days`
    : 'Sales by weekday, last 30 days'
)

/** Empty days keep a short stub so the week still reads as seven columns. */
function barHeight(count: number) {
  if (max.value === 0) return 12
  return Math.max(12, Math.round((count / max.value) * 100))
}

function salesLabel(count: number) {
  return `${count} ${count === 1 ? 'sale' : 'sales'}`
}
</script>
