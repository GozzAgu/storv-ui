<template>
  <section
    ref="sectionRef"
    class="mk-section mk-section--tight-top"
    aria-labelledby="mk-stats-title"
  >
    <div class="mk-container">
      <div class="mk-stats-head mk-reveal">
        <div class="mk-stats-head__title">
          <p class="mk-eyebrow">Trusted by modern retailers</p>
          <h2 id="mk-stats-title" class="mk-h2">
            Built for businesses that <span class="mk-accent">outgrow spreadsheets.</span>
          </h2>
        </div>
        <p class="mk-lede mk-muted">
          From a solo counter on Micro to multi-branch teams on Enterprise. Pick the workspace that
          fits, and scale when you're ready.
        </p>
      </div>

      <ul class="mk-stats">
        <li v-for="(stat, i) in stats" :key="stat.id" class="mk-stat mk-reveal">
          <p class="mk-stat__value">
            <span class="ds-sr-only">{{ stat.end }}{{ stat.suffix }}</span>
            <span aria-hidden="true">{{ counts[i] }}</span>
            <span v-if="stat.suffix" class="mk-stat__suffix" aria-hidden="true">{{
              stat.suffix
            }}</span>
          </p>
          <p class="mk-stat__label">{{ stat.label }}</p>
          <ul class="mk-stat__chips" :aria-label="`${stat.label}: details`">
            <li
              v-for="chip in stat.chips"
              :key="chip.label"
              class="mk-tag"
              :class="{ 'mk-tag--accent': chip.live }"
            >
              <span v-if="chip.live" class="mk-stat__live" aria-hidden="true" />
              {{ chip.label }}
            </li>
          </ul>
        </li>
      </ul>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

type Chip = { label: string; live?: boolean }

const stats: { id: string; end: number; suffix: string; label: string; chips: Chip[] }[] = [
  {
    id: 'workflows',
    end: 8,
    suffix: '+',
    label: 'Core retail workflows in one workspace',
    chips: [
      { label: 'Inventory' },
      { label: 'Sales' },
      { label: 'Customers' },
      { label: 'Buybacks' },
      { label: 'Stock loans' },
      { label: 'Sales leads' },
      { label: 'Transfers' },
      { label: 'Analytics' },
    ],
  },
  {
    id: 'plans',
    end: 3,
    suffix: '',
    label: 'Plans, from free Micro to Enterprise',
    chips: [{ label: 'Micro · free' }, { label: 'Medium' }, { label: 'Enterprise' }],
  },
  {
    id: 'platforms',
    end: 3,
    suffix: '',
    label: 'Platforms, live on the web today',
    chips: [{ label: 'Web', live: true }, { label: 'iOS · soon' }, { label: 'Android · soon' }],
  },
]

const sectionRef = ref<HTMLElement | null>(null)
const counts = ref(stats.map((stat) => stat.end))
const frames: number[] = []
let observer: IntersectionObserver | null = null

function countUp(index: number) {
  const end = stats[index]!.end
  const duration = 900
  const start = performance.now()
  const step = (now: number) => {
    const t = Math.min(1, (now - start) / duration)
    counts.value[index] = Math.round(end * (1 - Math.pow(1 - t, 3)))
    if (t < 1) frames[index] = requestAnimationFrame(step)
  }
  frames[index] = requestAnimationFrame(step)
}

onMounted(() => {
  if (!sectionRef.value || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  counts.value = stats.map(() => 0)
  observer = new IntersectionObserver(
    (entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return
      stats.forEach((_, i) => countUp(i))
      observer?.disconnect()
    },
    { threshold: 0.3 }
  )
  observer.observe(sectionRef.value)
})

onBeforeUnmount(() => {
  observer?.disconnect()
  frames.forEach((frame) => cancelAnimationFrame(frame))
})
</script>
