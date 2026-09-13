<template>
  <div class="landing-showcase">
    <section
      id="hero"
      ref="heroRef"
      data-section-id="landing-hero"
      class="landing-hero landing-hero--alive scroll-animate scroll-animate-up"
      aria-labelledby="landing-hero-title"
      :style="styleVars"
      @pointermove="onPointerMove"
      @pointerleave="onPointerLeave"
    >
      <div class="landing-hero__aurora" aria-hidden="true">
        <span class="landing-hero__aurora-blob landing-hero__aurora-blob--a" />
        <span class="landing-hero__aurora-blob landing-hero__aurora-blob--b" />
      </div>
      <div class="landing-hero__spotlight" aria-hidden="true" />

      <div class="landing-hero__inner landing-hero__inner--split">
        <div class="landing-hero__copy">
          <p class="landing-hero__badge landing-hero__reveal" style="--hero-i: 0">
            <span class="landing-hero__badge-dot" aria-hidden="true" />
            Retail OS · Web &amp; iOS
          </p>
          <h1 id="landing-hero-title" class="landing-hero__title landing-hero__title--premium">
            <span class="landing-hero__line landing-hero__reveal" style="--hero-i: 1"
              >Run your entire retail business</span
            >
            <span class="landing-hero__line landing-hero__reveal" style="--hero-i: 2">
              from one
              <span class="landing-hero__accent">intelligent platform.</span>
            </span>
          </h1>
          <p
            class="landing-hero__role landing-hero__role--premium landing-hero__reveal"
            style="--hero-i: 3"
          >
            Stock, sales, and a public storefront in one workspace. Start with
            <strong>Solo</strong> or scale into the full <strong>Business</strong> experience.
          </p>

          <div class="landing-hero__actions landing-hero__reveal" style="--hero-i: 4">
            <div class="landing-hero__cta-row">
              <a :href="appUrl" class="landing-pill-cta landing-pill-cta--hero">Start for free</a>
              <NuxtLink to="/demo/dashboard" class="landing-pill-cta landing-pill-cta--ghost">
                Try demo
              </NuxtLink>
            </div>
          </div>
        </div>

        <div class="landing-hero-mock landing-hero__visual landing-hero__reveal" style="--hero-i: 5">
          <div class="landing-hero-mock__stage">
            <div class="landing-hero-mock__card landing-hero-mock__card--video">
              <div class="landing-hero-video">
                <div class="landing-hero-video__frame">
                  <video
                    v-if="!prefersReducedMotion"
                    ref="videoRef"
                    class="landing-hero-video__media"
                    src="/marketing/video/hero-loop.mp4"
                    poster="/marketing/video/hero-poster.jpg"
                    muted
                    loop
                    playsinline
                    preload="metadata"
                    aria-label="Storvv product walkthrough: inventory, sales, and analytics"
                  />
                  <img
                    v-else
                    class="landing-hero-video__media"
                    src="/marketing/video/hero-poster.jpg"
                    alt="Storvv dashboard overview"
                    width="1280"
                    height="720"
                  />
                  <div class="landing-hero-video__veil" aria-hidden="true" />
                </div>
                <div class="landing-hero-video__footer" aria-hidden="true">
                  <Transition name="landing-stage" mode="out-in">
                    <p :key="stageLabel" class="landing-hero-video__stage">{{ stageLabel }}</p>
                  </Transition>
                  <div class="landing-hero-video__pips">
                    <span
                      v-for="(stage, i) in stages"
                      :key="stage"
                      class="landing-hero-video__pip"
                      :class="{ 'landing-hero-video__pip--on': i === stageIndex }"
                    />
                  </div>
                </div>
              </div>
            </div>

            <aside
              class="landing-hero-float-card landing-hero-float-card--primary"
              aria-hidden="true"
            >
              <span class="landing-hero-float-card__pulse" />
              <div>
                <p class="landing-hero-float-card__eyebrow">{{ floatLabel }}</p>
                <p class="landing-hero-float-card__value">{{ floatValue }}</p>
              </div>
            </aside>
          </div>
        </div>

        <a
          href="#proof"
          class="landing-hero__scroll-hint landing-hero__reveal landing-hero__scroll-hint--split"
          style="--hero-i: 6"
        >
          <span class="landing-hero__scroll-hint-text">Scroll</span>
          <ChevronDownIcon class="landing-hero__scroll-hint-icon h-4 w-4" aria-hidden="true" />
        </a>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ChevronDownIcon } from '~/utils/app-icons'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useLandingHeroMotion } from '~/composables/useLandingHeroMotion'

const props = defineProps<{
  logoSrc: string
  darkLogoSrc: string
  appUrl: string
}>()

const heroRef = ref<HTMLElement | null>(null)
const videoRef = ref<HTMLVideoElement | null>(null)
const {
  prefersReducedMotion,
  styleVars,
  onPointerMove,
  onPointerLeave,
} = useLandingHeroMotion(heroRef)

const stageIndex = ref(0)
const stages = ['Inventory', 'Sales', 'Analytics'] as const
const stageDetails = [
  { label: 'Inventory', value: 'Live stock sync' },
  { label: 'Sales', value: 'Receipt completed' },
  { label: 'Analytics', value: 'Branch insights' },
] as const

const stageLabel = computed(() => stages[stageIndex.value] ?? stages[0])
const floatLabel = computed(() => stageDetails[stageIndex.value]?.label ?? 'Inventory')
const floatValue = computed(() => stageDetails[stageIndex.value]?.value ?? 'Live stock sync')

let stageTimer: ReturnType<typeof setInterval> | null = null
let videoObserver: IntersectionObserver | null = null

function startStageLoop() {
  if (prefersReducedMotion.value) return
  stageTimer = setInterval(() => {
    stageIndex.value = (stageIndex.value + 1) % stages.length
  }, 3600)
}

async function playWhenVisible(entry: IntersectionObserverEntry) {
  const video = videoRef.value
  if (!video || prefersReducedMotion.value) return
  if (entry.isIntersecting) {
    try {
      await video.play()
    } catch {
      /* autoplay may be blocked; poster remains */
    }
  } else {
    video.pause()
  }
}

onMounted(() => {
  startStageLoop()
  if (!import.meta.client) return
  videoObserver = new IntersectionObserver(
    (entries) => {
      const entry = entries[0]
      if (entry) void playWhenVisible(entry)
    },
    { threshold: 0.35 }
  )
  if (heroRef.value) videoObserver.observe(heroRef.value)
})

watch(prefersReducedMotion, (reduced) => {
  if (reduced) {
    if (stageTimer) clearInterval(stageTimer)
    stageTimer = null
    videoRef.value?.pause()
  } else if (!stageTimer) {
    startStageLoop()
  }
})

onBeforeUnmount(() => {
  if (stageTimer) clearInterval(stageTimer)
  videoObserver?.disconnect()
})
</script>
