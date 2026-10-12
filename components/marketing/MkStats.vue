<template>
  <section
    ref="sectionRef"
    class="mk-section mk-section--tight-top"
    :data-live="live ? '' : undefined"
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
        <li
          v-for="(stat, i) in stats"
          :key="stat.id"
          class="mk-stat mk-reveal"
          :style="{ '--i': i }"
        >
          <!-- Workflows: one tile per workflow -->
          <ul
            v-if="stat.id === 'workflows'"
            class="mk-stat__viz mk-stat-flows"
            aria-label="Workflows"
          >
            <li
              v-for="(flow, f) in workflows"
              :key="flow.label"
              class="mk-stat-flows__item"
              :style="{ '--f': f }"
            >
              <component :is="flow.icon" :size="16" :stroke-width="1.75" aria-hidden="true" />
              {{ flow.label }}
            </li>
          </ul>

          <!-- Plans: room to grow, in stores per plan -->
          <ul v-else-if="stat.id === 'plans'" class="mk-stat__viz mk-stat-plans" aria-label="Plans">
            <li
              v-for="(plan, p) in plans"
              :key="plan.name"
              class="mk-stat-plans__item"
              :style="{ '--h': plan.stores / 5, '--p': p }"
            >
              <span class="mk-stat-plans__bar">
                <span class="mk-stat-plans__stores">{{ plan.stores }}</span>
              </span>
              <span class="mk-stat-plans__name">{{ plan.name }}</span>
              <span class="mk-stat-plans__note">{{ plan.note }}</span>
            </li>
          </ul>

          <!-- Platforms: where Storvv runs -->
          <ul v-else class="mk-stat__viz mk-stat-devices" aria-label="Platforms">
            <li
              v-for="device in devices"
              :key="device.name"
              class="mk-stat-devices__item"
              :class="{ 'is-live': device.live }"
            >
              <span class="mk-stat-devices__icon">
                <component :is="device.icon" :size="22" :stroke-width="1.5" aria-hidden="true" />
              </span>
              <span class="mk-stat-devices__name">{{ device.name }}</span>
              <span class="mk-stat-devices__status">
                <span v-if="device.live" class="mk-stat__live" aria-hidden="true" />
                {{ device.live ? 'Live' : 'Soon' }}
              </span>
            </li>
          </ul>

          <div class="mk-stat__foot">
            <p class="mk-stat__value">
              <span class="ds-sr-only">{{ stat.end }}{{ stat.suffix }}</span>
              <span aria-hidden="true">{{ counts[i] }}</span>
              <span v-if="stat.suffix" class="mk-stat__suffix" aria-hidden="true">{{
                stat.suffix
              }}</span>
            </p>
            <p class="mk-stat__label">
              <span class="mk-stat__kicker">{{ stat.kicker }}</span>
              {{ stat.label }}
            </p>
          </div>
        </li>
      </ul>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import {
  ArrowLeftRight,
  BarChart3,
  Boxes,
  Handshake,
  Monitor,
  Repeat,
  ShoppingCart,
  Smartphone,
  TabletSmartphone,
  Target,
  Users,
} from '@lucide/vue'

const stats = [
  {
    id: 'workflows',
    kicker: 'Workflows',
    end: 8,
    suffix: '+',
    label: 'Core retail jobs in one workspace',
  },
  { id: 'plans', kicker: 'Plans', end: 3, suffix: '', label: 'Start free, grow to 5 stores' },
  {
    id: 'platforms',
    kicker: 'Platforms',
    end: 3,
    suffix: '',
    label: 'Live on the web, apps on the way',
  },
]

const workflows = [
  { label: 'Inventory', icon: Boxes },
  { label: 'Sales', icon: ShoppingCart },
  { label: 'Customers', icon: Users },
  { label: 'Buybacks', icon: Repeat },
  { label: 'Stock loans', icon: Handshake },
  { label: 'Sales leads', icon: Target },
  { label: 'Transfers', icon: ArrowLeftRight },
  { label: 'Analytics', icon: BarChart3 },
]

const plans = [
  { name: 'Micro', note: '1 store · free', stores: 1 },
  { name: 'Medium', note: '2 stores', stores: 2 },
  { name: 'Enterprise', note: '5 stores', stores: 5 },
]

const devices = [
  { name: 'Web', icon: Monitor, live: true },
  { name: 'iOS', icon: Smartphone, live: false },
  { name: 'Android', icon: TabletSmartphone, live: false },
]

const sectionRef = ref<HTMLElement | null>(null)
const live = ref(false)
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
  if (!sectionRef.value || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    live.value = true
    return
  }
  counts.value = stats.map(() => 0)
  observer = new IntersectionObserver(
    (entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return
      live.value = true
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
