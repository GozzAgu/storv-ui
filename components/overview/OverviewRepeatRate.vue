<template>
  <SCard title="Repeat customer rate" class="s-overview-repeat">
    <template #actions>
      <SButton variant="ghost" size="sm" to="/dashboard/customers">Customers</SButton>
    </template>

    <div class="s-overview-repeat__gauge">
      <svg viewBox="0 0 200 108" class="s-overview-repeat__dial" aria-hidden="true">
        <line
          v-for="tick in ticks"
          :key="tick.index"
          :x1="tick.x1"
          :y1="tick.y1"
          :x2="tick.x2"
          :y2="tick.y2"
          class="s-overview-repeat__tick"
          :class="{ 's-overview-repeat__tick--on': tick.on }"
        />
      </svg>
      <div class="s-overview-repeat__readout">
        <span class="s-overview-repeat__value">{{ rate === null ? '-' : `${rate}%` }}</span>
        <span class="s-overview-repeat__caption">{{ caption }}</span>
      </div>
    </div>
  </SCard>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import SButton from '~/components/s/SButton.vue'
import SCard from '~/components/s/SCard.vue'

const TICKS = 31
const CENTER_X = 100
const CENTER_Y = 100
const INNER_R = 78
const OUTER_R = 94

const props = defineProps<{
  rate: number | null
  returning: number
  total: number
}>()

const ticks = computed(() => {
  const lit = props.rate === null ? 0 : Math.round((props.rate / 100) * TICKS)
  return Array.from({ length: TICKS }, (_, index) => {
    const angle = Math.PI - (index / (TICKS - 1)) * Math.PI
    const cos = Math.cos(angle)
    const sin = Math.sin(angle)
    return {
      index,
      on: index < lit,
      x1: CENTER_X + INNER_R * cos,
      y1: CENTER_Y - INNER_R * sin,
      x2: CENTER_X + OUTER_R * cos,
      y2: CENTER_Y - OUTER_R * sin,
    }
  })
})

const caption = computed(() => {
  if (props.total === 0) return 'Add a phone or email to sales to track this'
  return `${props.returning} of ${props.total} ${
    props.total === 1 ? 'customer' : 'customers'
  } bought again`
})
</script>
