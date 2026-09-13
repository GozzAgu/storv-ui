<template>
  <section
    id="journey"
    ref="sectionRef"
    data-section-id="landing-journey"
    class="landing-journey scroll-animate scroll-animate-up"
    aria-labelledby="landing-journey-title"
  >
    <div class="landing-journey__inner">
      <header class="landing-journey__header">
        <p class="landing-label landing-label--blue">Everyday loop</p>
        <h2 id="landing-journey-title" class="landing-journey__title">
          Inventory → sale → insight
        </h2>
        <p class="landing-journey__lede">
          The path your shop runs every day — connected in one workspace.
        </p>
      </header>

      <div class="landing-journey__track" role="list">
        <button
          v-for="(step, index) in steps"
          :key="step.id"
          type="button"
          class="landing-journey__step"
          :class="{ 'landing-journey__step--active': activeIndex === index }"
          role="listitem"
          :aria-current="activeIndex === index ? 'step' : undefined"
          @click="activeIndex = index"
        >
          <span class="landing-journey__step-index">{{ index + 1 }}</span>
          <span class="landing-journey__step-copy">
            <span class="landing-journey__step-title">{{ step.title }}</span>
            <span class="landing-journey__step-desc">{{ step.description }}</span>
          </span>
        </button>
      </div>

      <div class="landing-journey__stage landing-glass">
        <div class="landing-journey__progress" aria-hidden="true">
          <span class="landing-journey__progress-bar" :style="{ width: `${progressPct}%` }" />
        </div>
        <div class="landing-journey__frame">
          <img
            v-for="(step, index) in steps"
            :key="step.id"
            :src="step.image"
            :alt="step.title"
            class="landing-journey__shot"
            :class="{ 'landing-journey__shot--active': activeIndex === index }"
            loading="lazy"
            width="960"
            height="640"
          />
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useLandingReducedMotion } from '~/composables/useLandingHeroMotion'

const steps = [
  {
    id: 'inventory',
    title: 'Inventory',
    description: 'Categories, serials, and stock levels stay branch-true.',
    image: '/marketing/screenshots/inventory.png',
  },
  {
    id: 'sale',
    title: 'Sale',
    description: 'Checkout, leads, and payment links close the loop.',
    image: '/marketing/screenshots/receipts.png',
  },
  {
    id: 'analytics',
    title: 'Analytics',
    description: 'See what moved - and what to reorder next.',
    image: '/marketing/screenshots/analytics.png',
  },
] as const

const sectionRef = ref<HTMLElement | null>(null)
const activeIndex = ref(0)
const prefersReducedMotion = useLandingReducedMotion()
const progressPct = computed(() => ((activeIndex.value + 1) / steps.length) * 100)

let observer: IntersectionObserver | null = null
let autoTimer: ReturnType<typeof setInterval> | null = null

function startAuto() {
  if (prefersReducedMotion.value || autoTimer) return
  autoTimer = setInterval(() => {
    activeIndex.value = (activeIndex.value + 1) % steps.length
  }, 4200)
}

onMounted(() => {
  if (!import.meta.client || !sectionRef.value) return
  observer = new IntersectionObserver(
    (entries) => {
      const entry = entries[0]
      if (!entry) return
      if (entry.isIntersecting) startAuto()
      else if (autoTimer) {
        clearInterval(autoTimer)
        autoTimer = null
      }
    },
    { threshold: 0.35 }
  )
  observer.observe(sectionRef.value)
})

watch(prefersReducedMotion, (reduced) => {
  if (reduced && autoTimer) {
    clearInterval(autoTimer)
    autoTimer = null
  }
})

onBeforeUnmount(() => {
  if (autoTimer) clearInterval(autoTimer)
  observer?.disconnect()
})
</script>
