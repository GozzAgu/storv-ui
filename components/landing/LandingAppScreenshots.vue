<template>
  <section
    id="screenshots"
    data-section-id="landing-screenshots"
    class="landing-screenshots scroll-animate scroll-animate-up"
    aria-labelledby="landing-screenshots-heading"
  >
    <div class="landing-screenshots__aurora" aria-hidden="true" />
    <div class="landing-screenshots__grid-bg landing-line-grid" aria-hidden="true" />

    <div class="landing-screenshots__inner">
      <header class="landing-screenshots__header">
        <p class="landing-label landing-label--blue">Mobile app</p>
        <h2 id="landing-screenshots-heading" class="landing-screenshots__title">
          Manage your business
          <span class="landing-screenshots__accent">anywhere.</span>
        </h2>
        <p class="landing-screenshots__lede">
          Dashboard, inventory, sales, and analytics on iPhone. The same Storvv experience in your
          pocket.
        </p>
      </header>

      <div
        class="landing-screenshots__theater"
        @mouseenter="pauseAutoplay"
        @mouseleave="resumeAutoplay"
        @focusin="pauseAutoplay"
        @focusout="resumeAutoplay"
      >
        <button
          type="button"
          class="landing-screenshots__side-nav landing-screenshots__side-nav--prev"
          aria-label="Previous screenshot"
          @click="goPrev"
        >
          <ChevronLeftIcon class="h-5 w-5" stroke-width="2" />
        </button>

        <div class="landing-screenshots__stage">
          <div class="landing-screenshots__stage-ring" aria-hidden="true" />
          <div class="landing-screenshots__stack" role="group" aria-label="App screenshot slideshow">
            <button
              v-for="(shot, index) in MARKETING_SCREENSHOTS"
              :key="shot.id"
              type="button"
              class="landing-screenshots__card"
              :class="stackClass(index)"
              :style="stackStyle(index)"
              :aria-label="`View ${shot.title} fullscreen`"
              @click="openFullscreen(index)"
            >
              <div class="landing-screenshots__frame">
                <img
                  :src="shot.src"
                  :alt="`${shot.title}, Storvv demo`"
                  class="landing-screenshots__img"
                  :loading="index === 0 ? 'eager' : 'lazy'"
                  :fetchpriority="index === activeIndex ? 'high' : 'auto'"
                  decoding="async"
                  width="2880"
                  height="1800"
                  draggable="false"
                />
              </div>
              <div
                v-if="stackOrder(index) === 0"
                class="landing-screenshots__progress"
                aria-hidden="true"
              >
                <span
                  class="landing-screenshots__progress-bar"
                  :class="{ 'landing-screenshots__progress-bar--paused': autoplayPaused || fullscreenOpen }"
                  :key="progressKey"
                />
              </div>
              <div v-if="stackOrder(index) === 0" class="landing-screenshots__expand-hint" aria-hidden="true">
                <ArrowsPointingOutIcon class="h-3.5 w-3.5" stroke-width="2" />
                <span>Fullscreen</span>
              </div>
            </button>
          </div>
          <div class="landing-screenshots__reflection" aria-hidden="true" />
        </div>

        <button
          type="button"
          class="landing-screenshots__side-nav landing-screenshots__side-nav--next"
          aria-label="Next screenshot"
          @click="goNext"
        >
          <ChevronRightIcon class="h-5 w-5" stroke-width="2" />
        </button>
      </div>

      <div class="landing-screenshots__tabs" role="tablist" aria-label="Screenshots">
        <button
          v-for="(shot, index) in MARKETING_SCREENSHOTS"
          :key="shot.id"
          type="button"
          role="tab"
          class="landing-screenshots__tab"
          :class="{ 'landing-screenshots__tab--active': index === activeIndex }"
          :aria-selected="index === activeIndex"
          @click="goTo(index)"
        >
          <MarketingFeatureIcon :name="shot.iconKey" size="xs" />
          <span>{{ shot.title }}</span>
        </button>
      </div>

      <div class="landing-screenshots__caption" aria-live="polite">
        <p class="landing-screenshots__caption-title">{{ activeShot.title }}</p>
        <p class="landing-screenshots__caption-desc">{{ activeShot.description }}</p>
      </div>

      <div class="landing-screenshots__cta">
        <NuxtLink to="/demo/dashboard" class="landing-pill-cta">Try demo</NuxtLink>
        <a :href="appUrl" class="landing-screenshots__secondary">Start free on Micro →</a>
      </div>
    </div>

    <Teleport to="body">
      <Transition name="landing-screenshots-modal">
        <div
          v-if="fullscreenOpen"
          class="landing-screenshots-modal"
          role="dialog"
          aria-modal="true"
          :aria-label="`${activeShot.title} fullscreen view`"
          tabindex="-1"
          ref="modalRef"
          @keydown.esc="closeFullscreen"
          @keydown.left.prevent="goPrev"
          @keydown.right.prevent="goNext"
        >
          <button
            type="button"
            class="landing-screenshots-modal__backdrop"
            aria-label="Close fullscreen"
            @click="closeFullscreen"
          />

          <div class="landing-screenshots-modal__shell">
            <header class="landing-screenshots-modal__header">
              <div class="landing-screenshots-modal__header-copy">
                <MarketingFeatureIcon :name="activeShot.iconKey" size="sm" />
                <div>
                  <p class="landing-screenshots-modal__title">{{ activeShot.title }}</p>
                  <p class="landing-screenshots-modal__desc">{{ activeShot.description }}</p>
                </div>
              </div>
              <div class="landing-screenshots-modal__header-actions">
                <span class="landing-screenshots-modal__counter">
                  {{ activeIndex + 1 }} / {{ MARKETING_SCREENSHOTS.length }}
                </span>
                <button
                  type="button"
                  class="landing-screenshots-modal__icon-btn"
                  aria-label="Previous screenshot"
                  @click="goPrev"
                >
                  <ChevronLeftIcon class="h-5 w-5" stroke-width="2" />
                </button>
                <button
                  type="button"
                  class="landing-screenshots-modal__icon-btn"
                  aria-label="Next screenshot"
                  @click="goNext"
                >
                  <ChevronRightIcon class="h-5 w-5" stroke-width="2" />
                </button>
                <button
                  type="button"
                  class="landing-screenshots-modal__icon-btn landing-screenshots-modal__icon-btn--close"
                  aria-label="Close fullscreen"
                  @click="closeFullscreen"
                >
                  <XMarkIcon class="h-5 w-5" stroke-width="2" />
                </button>
              </div>
            </header>

            <div class="landing-screenshots-modal__viewport">
              <Transition :name="slideTransition" mode="out-in">
                <img
                  :key="activeShot.id"
                  :src="activeShot.src"
                  :alt="`${activeShot.title}, Storvv demo`"
                  class="landing-screenshots-modal__img"
                  decoding="async"
                  width="2880"
                  height="1800"
                  draggable="false"
                />
              </Transition>
            </div>

            <div class="landing-screenshots-modal__thumbs" role="tablist" aria-label="Choose screenshot">
              <button
                v-for="(shot, index) in MARKETING_SCREENSHOTS"
                :key="`fs-${shot.id}`"
                type="button"
                role="tab"
                class="landing-screenshots-modal__thumb"
                :class="{ 'landing-screenshots-modal__thumb--active': index === activeIndex }"
                :aria-selected="index === activeIndex"
                :aria-label="shot.title"
                @click="goTo(index)"
              >
                <img :src="shot.src" alt="" aria-hidden="true" loading="lazy" draggable="false" />
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import {
  ArrowsPointingOutIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon,
} from '~/utils/app-icons'
import { MARKETING_SCREENSHOTS } from '~/utils/marketing-screenshots'

defineProps<{
  appUrl: string
}>()

const AUTOPLAY_MS = 5200
const count = MARKETING_SCREENSHOTS.length

const activeIndex = ref(0)
const fullscreenOpen = ref(false)
const slideDirection = ref<'next' | 'prev'>('next')
const autoplayPaused = ref(false)
const progressKey = ref(0)
const modalRef = ref<HTMLElement | null>(null)

function preloadShot(index: number) {
  const shot = MARKETING_SCREENSHOTS[index]
  if (!shot || preloadedSrcs.has(shot.src)) return
  preloadedSrcs.add(shot.src)
  const img = new Image()
  img.src = shot.src
}

function preloadNeighbors(center: number) {
  preloadShot(center)
  preloadShot((center + 1) % count)
  preloadShot((center - 1 + count) % count)
}

const preloadedSrcs = new Set<string>()
let autoplayTimer: ReturnType<typeof setInterval> | null = null

const activeShot = computed(() => MARKETING_SCREENSHOTS[activeIndex.value]!)
const slideTransition = computed(() =>
  slideDirection.value === 'next' ? 'landing-screenshots-slide-next' : 'landing-screenshots-slide-prev'
)

function stackOrder(index: number) {
  return (index - activeIndex.value + count) % count
}

function stackClass(index: number) {
  const order = stackOrder(index)
  return {
    'landing-screenshots__card--front': order === 0,
    'landing-screenshots__card--back': order > 0,
  }
}

function stackStyle(index: number) {
  const order = stackOrder(index)
  if (order === 0) {
    return {
      zIndex: 40,
      transform: 'translate3d(0, 0, 0) scale(1)',
      opacity: 1,
    }
  }
  const offsetX = order * 22
  const offsetY = order * 6
  const scale = 1 - order * 0.035
  return {
    zIndex: 40 - order * 10,
    transform: `translate3d(${offsetX}px, ${offsetY}px, 0) scale(${scale})`,
    opacity: Math.max(0.4, 1 - order * 0.16),
  }
}

function restartProgress() {
  progressKey.value += 1
}

function goTo(index: number) {
  if (index === activeIndex.value) return
  slideDirection.value =
    index > activeIndex.value || (activeIndex.value === count - 1 && index === 0) ? 'next' : 'prev'
  activeIndex.value = index
  restartProgress()
  preloadNeighbors(index)
}

function goNext() {
  slideDirection.value = 'next'
  activeIndex.value = (activeIndex.value + 1) % count
  restartProgress()
  preloadNeighbors(activeIndex.value)
}

function goPrev() {
  slideDirection.value = 'prev'
  activeIndex.value = (activeIndex.value - 1 + count) % count
  restartProgress()
  preloadNeighbors(activeIndex.value)
}

function openFullscreen(index: number) {
  goTo(index)
  fullscreenOpen.value = true
}

function closeFullscreen() {
  fullscreenOpen.value = false
}

function pauseAutoplay() {
  autoplayPaused.value = true
}

function resumeAutoplay() {
  if (!fullscreenOpen.value) autoplayPaused.value = false
}

function startAutoplay() {
  stopAutoplay()
  autoplayTimer = setInterval(() => {
    if (!autoplayPaused.value && !fullscreenOpen.value) goNext()
  }, AUTOPLAY_MS)
}

function stopAutoplay() {
  if (autoplayTimer) {
    clearInterval(autoplayTimer)
    autoplayTimer = null
  }
}

watch(fullscreenOpen, async (open) => {
  if (!import.meta.client) return
  document.body.style.overflow = open ? 'hidden' : ''
  if (open) {
    pauseAutoplay()
    await nextTick()
    modalRef.value?.focus()
  } else {
    resumeAutoplay()
  }
})

onMounted(() => {
  for (let i = 0; i < Math.min(3, count); i++) preloadShot(i)
  startAutoplay()
})

onUnmounted(() => {
  stopAutoplay()
  if (import.meta.client) document.body.style.overflow = ''
})
</script>

<style scoped>
.landing-screenshots {
  --shot-ratio: 16 / 9;
  position: relative;
  overflow: hidden;
  padding: clamp(4.5rem, 10vw, 7.5rem) 1.25rem;
  background:
    radial-gradient(ellipse 90% 70% at 50% -10%, rgba(72, 118, 199, 0.22), transparent 55%),
    linear-gradient(180deg, #020617 0%, #0b1224 45%, #0f172a 100%);
  color: #e2e8f0;
}

.landing-screenshots__aurora {
  pointer-events: none;
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse 55% 45% at 15% 55%, rgba(20, 63, 141, 0.35), transparent 60%),
    radial-gradient(ellipse 50% 40% at 88% 35%, rgba(110, 148, 214, 0.2), transparent 58%);
  filter: blur(2px);
}

.landing-screenshots__grid-bg {
  pointer-events: none;
  position: absolute;
  inset: 0;
  opacity: 0.22;
  mask-image: linear-gradient(180deg, transparent, #000 18%, #000 82%, transparent);
}

.landing-screenshots__inner {
  position: relative;
  z-index: 1;
  max-width: 72rem;
  margin: 0 auto;
  text-align: center;
}

.landing-screenshots .landing-label {
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #9ab5e3;
}

.landing-screenshots__title {
  margin-top: 0.55rem;
  font-size: clamp(1.75rem, 4vw, 2.75rem);
  font-weight: 800;
  letter-spacing: -0.03em;
  line-height: 1.08;
  color: #f8fafc;
}

.landing-screenshots__accent {
  background: linear-gradient(120deg, #9ab5e3 0%, #6e94d6 45%, #4876c7 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.landing-screenshots__lede {
  margin: 1rem auto 0;
  max-width: 34rem;
  font-size: 1rem;
  line-height: 1.65;
  color: #94a3b8;
}

.landing-screenshots__theater {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 0.75rem;
  margin-top: clamp(2rem, 5vw, 3rem);
}

@media (max-width: 640px) {
  .landing-screenshots__theater {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
}

.landing-screenshots__side-nav {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.75rem;
  height: 2.75rem;
  border-radius: 999px;
  border: 1px solid rgba(154, 181, 227, 0.28);
  background: rgba(15, 23, 42, 0.65);
  color: #e2e8f0;
  backdrop-filter: blur(10px);
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.35);
  transition: transform 0.2s ease, background 0.2s ease, border-color 0.2s ease;
}

.landing-screenshots__side-nav:hover {
  transform: translateY(-2px);
  background: rgba(72, 118, 199, 0.35);
  border-color: rgba(154, 181, 227, 0.55);
}

@media (max-width: 640px) {
  .landing-screenshots__side-nav {
    display: none;
  }
}

.landing-screenshots__stage {
  position: relative;
  min-width: 0;
}

.landing-screenshots__stage-ring {
  position: absolute;
  inset: -1.25rem -0.5rem;
  border-radius: 1.35rem;
  background: linear-gradient(
    135deg,
    rgba(154, 181, 227, 0.45) 0%,
    rgba(72, 118, 199, 0.12) 40%,
    rgba(110, 148, 214, 0.35) 100%
  );
  opacity: 0.55;
  filter: blur(18px);
}

.landing-screenshots__stack {
  position: relative;
  width: 100%;
  aspect-ratio: var(--shot-ratio);
  padding-right: clamp(2rem, 6vw, 4.5rem);
  padding-bottom: clamp(1rem, 3vw, 2rem);
}

.landing-screenshots__card {
  position: absolute;
  inset: 0;
  margin: 0;
  padding: 0;
  border: none;
  text-align: left;
  cursor: pointer;
  border-radius: 0.9rem;
  overflow: hidden;
  background: #0a101a;
  box-shadow:
    0 24px 60px rgba(0, 0, 0, 0.5),
    0 0 0 1px rgba(154, 181, 227, 0.14);
  transition:
    transform 0.6s cubic-bezier(0.22, 1, 0.36, 1),
    opacity 0.45s ease,
    box-shadow 0.35s ease;
  will-change: transform, opacity;
}

.landing-screenshots__card--front {
  box-shadow:
    0 32px 80px rgba(0, 0, 0, 0.55),
    0 0 0 1px rgba(154, 181, 227, 0.28),
    0 0 60px rgba(72, 118, 199, 0.18);
}

.landing-screenshots__card--front:hover {
  transform: translate3d(0, -6px, 0) scale(1.008) !important;
}

.landing-screenshots__card--back {
  pointer-events: none;
}

.landing-screenshots__frame {
  position: absolute;
  inset: 0;
  overflow: hidden;
  background: #050508;
}

.landing-screenshots__img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
  object-position: center top;
  background: #07080c;
}

.landing-screenshots__progress {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 3;
  height: 3px;
  background: rgba(255, 255, 255, 0.08);
}

.landing-screenshots__progress-bar {
  display: block;
  height: 100%;
  width: 0;
  background: linear-gradient(90deg, #4876c7, #9ab5e3);
  animation: landing-screenshots-progress 5.2s linear forwards;
}

.landing-screenshots__progress-bar--paused {
  animation-play-state: paused;
}

@keyframes landing-screenshots-progress {
  from {
    width: 0;
  }
  to {
    width: 100%;
  }
}

.landing-screenshots__expand-hint {
  position: absolute;
  right: 0.85rem;
  bottom: 0.85rem;
  z-index: 3;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.4rem 0.7rem;
  border-radius: 999px;
  font-size: 0.6875rem;
  font-weight: 600;
  color: #f8fafc;
  background: rgba(15, 23, 42, 0.88);
  border: 1px solid rgba(154, 181, 227, 0.35);
  backdrop-filter: blur(10px);
  opacity: 0;
  transform: translateY(6px);
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.landing-screenshots__card--front:hover .landing-screenshots__expand-hint,
.landing-screenshots__card--front:focus-visible .landing-screenshots__expand-hint {
  opacity: 1;
  transform: translateY(0);
}

.landing-screenshots__reflection {
  position: absolute;
  left: 5%;
  right: 5%;
  bottom: -1.5rem;
  height: 3rem;
  border-radius: 999px;
  background: radial-gradient(ellipse at center, rgba(110, 148, 214, 0.35), transparent 70%);
  filter: blur(16px);
  opacity: 0.7;
}

.landing-screenshots__tabs {
  display: flex;
  flex-wrap: nowrap;
  justify-content: flex-start;
  gap: 0.5rem;
  margin-top: clamp(1.75rem, 4vw, 2.5rem);
  padding: 0.15rem 0 0.5rem;
  overflow-x: auto;
  overscroll-behavior-x: contain;
  scrollbar-width: thin;
  scrollbar-color: rgba(110, 148, 214, 0.45) transparent;
  mask-image: linear-gradient(90deg, transparent, #000 3%, #000 97%, transparent);
}

.landing-screenshots__tab {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  flex: 0 0 auto;
  padding: 0.5rem 0.85rem;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.2);
  background: rgba(15, 23, 42, 0.55);
  color: #94a3b8;
  font-size: 0.75rem;
  font-weight: 600;
  transition:
    color 0.2s ease,
    border-color 0.2s ease,
    background 0.2s ease,
    transform 0.2s ease;
}

.landing-screenshots__tab:hover {
  color: #e2e8f0;
  border-color: rgba(154, 181, 227, 0.35);
}

.landing-screenshots__tab--active {
  color: #f8fafc;
  border-color: rgba(110, 148, 214, 0.65);
  background: linear-gradient(135deg, rgba(72, 118, 199, 0.45), rgba(20, 63, 141, 0.35));
  transform: translateY(-1px);
  box-shadow: 0 8px 24px rgba(20, 63, 141, 0.25);
}

.landing-screenshots__caption {
  margin: 1.25rem auto 0;
  max-width: 32rem;
  padding: 1rem 1.25rem;
  border-radius: 1rem;
  border: 1px solid rgba(154, 181, 227, 0.16);
  background: rgba(255, 255, 255, 0.04);
  backdrop-filter: blur(12px);
}

.landing-screenshots__caption-title {
  font-size: 0.9375rem;
  font-weight: 700;
  color: #f1f5f9;
}

.landing-screenshots__caption-desc {
  margin-top: 0.35rem;
  font-size: 0.8125rem;
  line-height: 1.6;
  color: #94a3b8;
}

.landing-screenshots__cta {
  margin-top: 1.75rem;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 0.85rem 1.25rem;
}

.landing-screenshots__secondary {
  font-size: 0.875rem;
  font-weight: 600;
  color: #9ab5e3;
}

/* Fullscreen landscape viewer */
.landing-screenshots-modal {
  position: fixed;
  inset: 0;
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem;
}

.landing-screenshots-modal__backdrop {
  position: absolute;
  inset: 0;
  border: none;
  background: rgba(2, 6, 14, 0.92);
  backdrop-filter: blur(12px);
}

.landing-screenshots-modal__shell {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  width: min(96vw, 88rem);
  max-height: min(96dvh, 52rem);
  border-radius: 1rem;
  overflow: hidden;
  border: 1px solid rgba(154, 181, 227, 0.22);
  background: #070b14;
  box-shadow:
    0 40px 120px rgba(0, 0, 0, 0.6),
    0 0 0 1px rgba(255, 255, 255, 0.04) inset;
}

.landing-screenshots-modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  background: rgba(15, 23, 42, 0.95);
}

.landing-screenshots-modal__header-copy {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-width: 0;
  color: #9ab5e3;
}

.landing-screenshots-modal__title {
  font-size: 0.9375rem;
  font-weight: 700;
  color: #f8fafc;
  text-align: left;
}

.landing-screenshots-modal__desc {
  margin-top: 0.1rem;
  font-size: 0.75rem;
  color: #94a3b8;
  text-align: left;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 42vw;
}

.landing-screenshots-modal__header-actions {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  flex-shrink: 0;
}

.landing-screenshots-modal__counter {
  margin-right: 0.35rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: #64748b;
}

.landing-screenshots-modal__icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 0.55rem;
  border: 1px solid rgba(148, 163, 184, 0.18);
  background: rgba(255, 255, 255, 0.04);
  color: #e2e8f0;
  transition: background 0.2s ease;
}

.landing-screenshots-modal__icon-btn:hover {
  background: rgba(72, 118, 199, 0.25);
}

.landing-screenshots-modal__icon-btn--close {
  margin-left: 0.15rem;
}

.landing-screenshots-modal__viewport {
  position: relative;
  flex: 1;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  aspect-ratio: 16 / 9;
  padding: 0.5rem 0.75rem;
  background:
    radial-gradient(circle at 50% 20%, rgba(72, 118, 199, 0.12), transparent 55%),
    #030508;
}

.landing-screenshots-modal__img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
  object-position: center;
  border-radius: 0.25rem;
}

.landing-screenshots-modal__thumbs {
  display: flex;
  gap: 0.5rem;
  padding: 0.65rem 1rem 0.85rem;
  overflow-x: auto;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  background: rgba(15, 23, 42, 0.95);
}

.landing-screenshots-modal__thumb {
  flex: 0 0 auto;
  width: 6.5rem;
  aspect-ratio: 16 / 9;
  padding: 0;
  border-radius: 0.45rem;
  overflow: hidden;
  border: 2px solid transparent;
  opacity: 0.55;
  transition: opacity 0.2s ease, border-color 0.2s ease, transform 0.2s ease;
}

.landing-screenshots-modal__thumb img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
  object-position: center top;
  background: #07080c;
}

.landing-screenshots-modal__thumb--active {
  opacity: 1;
  border-color: #6e94d6;
  transform: translateY(-2px);
}

.landing-screenshots-modal-enter-active,
.landing-screenshots-modal-leave-active {
  transition: opacity 0.28s ease;
}

.landing-screenshots-modal-enter-from,
.landing-screenshots-modal-leave-to {
  opacity: 0;
}

.landing-screenshots-slide-next-enter-active,
.landing-screenshots-slide-next-leave-active,
.landing-screenshots-slide-prev-enter-active,
.landing-screenshots-slide-prev-leave-active {
  transition:
    opacity 0.28s ease,
    transform 0.32s cubic-bezier(0.22, 1, 0.36, 1);
}

.landing-screenshots-slide-next-enter-from {
  opacity: 0;
  transform: translateX(32px);
}

.landing-screenshots-slide-next-leave-to {
  opacity: 0;
  transform: translateX(-32px);
}

.landing-screenshots-slide-prev-enter-from {
  opacity: 0;
  transform: translateX(-32px);
}

.landing-screenshots-slide-prev-leave-to {
  opacity: 0;
  transform: translateX(32px);
}

@media (max-width: 640px) {
  .landing-screenshots-modal {
    padding: 0;
  }

  .landing-screenshots-modal__shell {
    width: 100%;
    max-height: 100dvh;
    height: 100dvh;
    border-radius: 0;
  }

  .landing-screenshots-modal__desc {
    max-width: 52vw;
  }

  .landing-screenshots__tab span {
    display: none;
  }

  .landing-screenshots__tab {
    padding: 0.55rem;
  }
}
</style>
