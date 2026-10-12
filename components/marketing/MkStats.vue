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

      <div class="mk-band mk-reveal">
        <svg
          class="mk-band__waves"
          viewBox="0 0 1200 360"
          preserveAspectRatio="xMidYMid slice"
          aria-hidden="true"
          focusable="false"
        >
          <defs>
            <linearGradient id="mk-band-ribbon" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stop-color="#fff" stop-opacity="0" />
              <stop offset="0.45" stop-color="#fff" stop-opacity="0.55" />
              <stop offset="1" stop-color="#fff" stop-opacity="0" />
            </linearGradient>
            <linearGradient id="mk-band-deep" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stop-color="#0a1a8f" stop-opacity="0.75" />
              <stop offset="1" stop-color="#0a1a8f" stop-opacity="0" />
            </linearGradient>
          </defs>
          <path
            class="mk-band__fold"
            d="M-40 300 C 220 120, 420 360, 700 200 S 1100 40, 1260 120 L 1260 400 L -40 400 Z"
            fill="url(#mk-band-deep)"
          />
          <path
            class="mk-band__sheen"
            d="M-40 240 C 220 60, 440 320, 720 160 S 1100 10, 1260 80 L 1260 130 C 1100 60, 900 150, 740 230 S 260 140, -40 300 Z"
            fill="url(#mk-band-ribbon)"
          />
          <path
            class="mk-band__ribbon"
            d="M-40 250 C 220 70, 440 330, 720 170 S 1100 20, 1260 90"
            stroke="url(#mk-band-ribbon)"
            stroke-width="2"
          />
          <path
            class="mk-band__ribbon mk-band__ribbon--b"
            d="M-40 290 C 240 120, 460 360, 740 210 S 1100 70, 1260 140"
            stroke="url(#mk-band-ribbon)"
            stroke-width="1"
          />
          <path
            class="mk-band__ribbon mk-band__ribbon--c"
            d="M-40 120 C 260 -20, 520 220, 800 90 S 1120 -10, 1260 40"
            stroke="url(#mk-band-ribbon)"
            stroke-width="1"
          />
        </svg>

        <div class="mk-band__lead">
          <p class="mk-band__lead-value">
            <span class="ds-sr-only">8+</span>
            <span aria-hidden="true">{{ workflows }}+</span>
          </p>
          <p class="mk-band__lead-title">Retail workflows in one place</p>
          <p class="mk-band__lead-text">
            Inventory, sales, customers, buybacks, stock loans, sales leads, transfers and
            analytics.
          </p>
        </div>

        <ul class="mk-band__stats">
          <li v-for="stat in stats" :key="stat.value" class="mk-band__stat">
            <p class="mk-band__value">{{ stat.value }}</p>
            <p class="mk-band__text">{{ stat.text }}</p>
          </li>
        </ul>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

const stats = [
  { value: 'Free', text: 'Micro is free forever for one store. No card needed.' },
  { value: '5 stores', text: 'On Enterprise, with up to 10 staff in each store.' },
  { value: '3 platforms', text: 'Live on the web today. iOS and Android are on the way.' },
]

const sectionRef = ref<HTMLElement | null>(null)
const workflows = ref(8)
let frame = 0
let observer: IntersectionObserver | null = null

function countUp() {
  const start = performance.now()
  const step = (now: number) => {
    const t = Math.min(1, (now - start) / 900)
    workflows.value = Math.round(8 * (1 - Math.pow(1 - t, 3)))
    if (t < 1) frame = requestAnimationFrame(step)
  }
  frame = requestAnimationFrame(step)
}

onMounted(() => {
  if (!sectionRef.value || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  workflows.value = 0
  observer = new IntersectionObserver(
    (entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return
      countUp()
      observer?.disconnect()
    },
    { threshold: 0.3 }
  )
  observer.observe(sectionRef.value)
})

onBeforeUnmount(() => {
  observer?.disconnect()
  cancelAnimationFrame(frame)
})
</script>
