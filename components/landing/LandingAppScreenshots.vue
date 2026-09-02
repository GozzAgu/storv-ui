<template>
  <section
    id="screenshots"
    data-section-id="landing-screenshots"
    class="landing-screenshots scroll-animate scroll-animate-up"
    aria-labelledby="landing-screenshots-heading"
  >
    <div class="landing-screenshots__inner">
      <header class="landing-screenshots__header">
        <p class="landing-label">Product tour</p>
        <h2 id="landing-screenshots-heading" class="landing-screenshots__title">
          See every major feature in the app
        </h2>
        <p class="landing-screenshots__lede">
          Inventory, sales, payment links, analytics, and multi-store tools — captured from the live
          demo.
        </p>
      </header>

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
          {{ shot.title }}
        </button>
      </div>

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
          <ChevronLeftIcon class="h-5 w-5" stroke-width="1.75" />
        </button>

        <button
          type="button"
          class="landing-screenshots__preview"
          :aria-label="`View ${activeShot.title} fullscreen`"
          @click="openFullscreen(activeIndex)"
        >
          <Transition :name="slideTransition" mode="out-in">
            <img
              :key="activeShot.id"
              :src="activeShot.src"
              :alt="`${activeShot.title}, Storvv demo`"
              class="landing-screenshots__img"
              width="2880"
              height="1800"
              decoding="async"
              draggable="false"
            />
          </Transition>
          <span class="landing-screenshots__progress" aria-hidden="true">
            <span
              class="landing-screenshots__progress-bar"
              :class="{ 'landing-screenshots__progress-bar--paused': autoplayPaused || fullscreenOpen }"
              :key="progressKey"
            />
          </span>
        </button>

        <button
          type="button"
          class="landing-screenshots__side-nav landing-screenshots__side-nav--next"
          aria-label="Next screenshot"
          @click="goNext"
        >
          <ChevronRightIcon class="h-5 w-5" stroke-width="1.75" />
        </button>
      </div>

      <div class="landing-screenshots__caption" aria-live="polite">
        <p class="landing-screenshots__caption-title">{{ activeShot.title }}</p>
        <p class="landing-screenshots__caption-desc">{{ activeShot.description }}</p>
      </div>

      <div class="landing-screenshots__cta">
        <NuxtLink to="/demo/dashboard" class="landing-pill-cta">Try demo</NuxtLink>
        <a :href="appUrl" class="landing-screenshots__secondary">Start free</a>
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
  position: relative;
  padding: clamp(4rem, 8vw, 6.5rem) 1.25rem;
  background: #f5f5f7;
  color: #1a1523;
}

.landing-screenshots__inner {
  max-width: 56rem;
  margin: 0 auto;
  text-align: center;
}

.landing-screenshots .landing-label {
  margin: 0;
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: rgb(26 21 35 / 0.45);
}

.landing-screenshots__title {
  margin: 0.5rem 0 0;
  font-size: clamp(1.625rem, 3.5vw, 2.25rem);
  font-weight: 650;
  letter-spacing: -0.03em;
  line-height: 1.15;
  color: #1a1523;
}

.landing-screenshots__lede {
  margin: 0.75rem auto 0;
  max-width: 28rem;
  font-size: 0.9375rem;
  line-height: 1.55;
  color: rgb(26 21 35 / 0.55);
}

.landing-screenshots__tabs {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.375rem;
  margin: 1.75rem auto 0;
  max-width: 40rem;
}

.landing-screenshots__tab {
  display: inline-flex;
  align-items: center;
  padding: 0.375rem 0.75rem;
  border: 0;
  border-radius: 9999px;
  background: transparent;
  color: rgb(26 21 35 / 0.5);
  font-size: 0.75rem;
  font-weight: 550;
  line-height: 1.2;
  cursor: pointer;
}

.landing-screenshots__tab:hover {
  color: #1a1523;
  background: #eeeeef;
}

.landing-screenshots__tab--active {
  background: #1a1523;
  color: #ffffff;
}

.landing-screenshots__theater {
  position: relative;
  margin-top: 1.5rem;
}

.landing-screenshots__preview {
  position: relative;
  display: block;
  width: 100%;
  margin: 0;
  padding: 0;
  overflow: hidden;
  border: 0;
  border-radius: 1.5rem;
  background: #ffffff;
  cursor: zoom-in;
  aspect-ratio: 16 / 9;
}

.landing-screenshots__img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: top center;
  background: #ffffff;
}

.landing-screenshots__progress {
  position: absolute;
  left: 1.25rem;
  right: 1.25rem;
  bottom: 0.85rem;
  z-index: 2;
  height: 2px;
  overflow: hidden;
  border-radius: 9999px;
  background: rgb(26 21 35 / 0.08);
  pointer-events: none;
}

.landing-screenshots__progress-bar {
  display: block;
  height: 100%;
  width: 0;
  border-radius: inherit;
  background: #1a1523;
  animation: landing-screenshots-progress 5.2s linear forwards;
}

.landing-screenshots__progress-bar--paused {
  animation-play-state: paused;
}

@keyframes landing-screenshots-progress {
  from { width: 0; }
  to { width: 100%; }
}

.landing-screenshots__side-nav {
  position: absolute;
  top: 50%;
  z-index: 3;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  padding: 0;
  border: 0;
  border-radius: 9999px;
  background: #ffffff;
  color: #1a1523;
  cursor: pointer;
  transform: translateY(-50%);
}

.landing-screenshots__side-nav:hover {
  background: #f4f4f5;
}

.landing-screenshots__side-nav--prev {
  left: 0.75rem;
}

.landing-screenshots__side-nav--next {
  right: 0.75rem;
}

.landing-screenshots__caption {
  margin: 1.25rem auto 0;
  max-width: 26rem;
}

.landing-screenshots__caption-title {
  margin: 0;
  font-size: 0.9375rem;
  font-weight: 600;
  letter-spacing: -0.015em;
  color: var(--portfolio-ink, #1a1523);
}

.landing-screenshots__caption-desc {
  margin: 0.25rem 0 0;
  font-size: 0.8125rem;
  line-height: 1.5;
  color: var(--portfolio-muted, rgb(26 21 35 / 0.58));
}

.landing-screenshots__cta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 0.75rem 1.25rem;
  margin-top: 1.5rem;
}

.landing-screenshots__secondary {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--portfolio-muted, rgb(26 21 35 / 0.58));
  text-decoration: none;
}

.landing-screenshots__secondary:hover {
  color: var(--portfolio-ink, #1a1523);
}

.landing-screenshots-modal {
  position: fixed;
  inset: 0;
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.landing-screenshots-modal__backdrop {
  position: absolute;
  inset: 0;
  border: none;
  background: rgb(17 24 39 / 0.35);
}

.landing-screenshots-modal__shell {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  width: min(96vw, 72rem);
  max-height: min(94dvh, 52rem);
  overflow: hidden;
  border-radius: 1.5rem;
  background: #ffffff;
}

.landing-screenshots-modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.875rem 1rem;
}

.landing-screenshots-modal__header-copy {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-width: 0;
  color: rgb(26 21 35 / 0.5);
}

.landing-screenshots-modal__title {
  margin: 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: #1a1523;
  text-align: left;
}

.landing-screenshots-modal__desc {
  margin: 0.1rem 0 0;
  max-width: 42vw;
  overflow: hidden;
  font-size: 0.75rem;
  color: rgb(26 21 35 / 0.55);
  text-align: left;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.landing-screenshots-modal__header-actions {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: 0.25rem;
}

.landing-screenshots-modal__counter {
  margin-right: 0.35rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: rgb(26 21 35 / 0.45);
}

.landing-screenshots-modal__icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  border: 0;
  border-radius: 9999px;
  background: #f5f5f7;
  color: #1a1523;
}

.landing-screenshots-modal__icon-btn:hover {
  background: #eeeeef;
}

.landing-screenshots-modal__viewport {
  position: relative;
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  min-height: 0;
  aspect-ratio: 16 / 9;
  background: #f5f5f7;
}

.landing-screenshots-modal__img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
  object-position: center top;
}

.landing-screenshots-modal__thumbs {
  display: flex;
  gap: 0.5rem;
  padding: 0.75rem 1rem 1rem;
  overflow-x: auto;
}

.landing-screenshots-modal__thumb {
  flex: 0 0 auto;
  width: 5.5rem;
  padding: 0;
  overflow: hidden;
  aspect-ratio: 16 / 10;
  border: 0;
  border-radius: 0.75rem;
  opacity: 0.45;
}

.landing-screenshots-modal__thumb img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center top;
  background: #f5f5f7;
}

.landing-screenshots-modal__thumb--active {
  opacity: 1;
}

.landing-screenshots-modal-enter-active,
.landing-screenshots-modal-leave-active {
  transition: opacity 0.2s ease;
}

.landing-screenshots-modal-enter-from,
.landing-screenshots-modal-leave-to {
  opacity: 0;
}

.landing-screenshots-slide-next-enter-active,
.landing-screenshots-slide-next-leave-active,
.landing-screenshots-slide-prev-enter-active,
.landing-screenshots-slide-prev-leave-active {
  transition: opacity 0.22s ease;
}

.landing-screenshots-slide-next-enter-from,
.landing-screenshots-slide-next-leave-to,
.landing-screenshots-slide-prev-enter-from,
.landing-screenshots-slide-prev-leave-to {
  opacity: 0;
}

@media (max-width: 640px) {
  .landing-screenshots__side-nav {
    display: none;
  }

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
}

:global(html.dark) .landing-screenshots {
  background: #080808;
  color: #ffffff;
}

:global(html.dark) .landing-screenshots__title,
:global(html.dark) .landing-screenshots__caption-title,
:global(html.dark) .landing-screenshots-modal__title {
  color: #ffffff;
}

:global(html.dark) .landing-screenshots .landing-label,
:global(html.dark) .landing-screenshots__lede,
:global(html.dark) .landing-screenshots__caption-desc,
:global(html.dark) .landing-screenshots__secondary,
:global(html.dark) .landing-screenshots-modal__desc {
  color: rgb(255 255 255 / 0.58);
}

:global(html.dark) .landing-screenshots__tab {
  color: rgb(255 255 255 / 0.5);
}

:global(html.dark) .landing-screenshots__tab:hover {
  background: #282828;
  color: #ffffff;
}

:global(html.dark) .landing-screenshots__tab--active {
  background: #ffffff;
  color: #1a1523;
}

:global(html.dark) .landing-screenshots__preview,
:global(html.dark) .landing-screenshots-modal__shell {
  background: #1e1e1e;
}

:global(html.dark) .landing-screenshots__img {
  background: #1e1e1e;
}

:global(html.dark) .landing-screenshots__side-nav,
:global(html.dark) .landing-screenshots-modal__icon-btn {
  background: #282828;
  color: #ffffff;
}

:global(html.dark) .landing-screenshots__side-nav:hover,
:global(html.dark) .landing-screenshots-modal__icon-btn:hover {
  background: #3f3f46;
}

:global(html.dark) .landing-screenshots__progress {
  background: rgb(255 255 255 / 0.12);
}

:global(html.dark) .landing-screenshots__progress-bar {
  background: #ffffff;
}

:global(html.dark) .landing-screenshots-modal__backdrop {
  background: rgb(0 0 0 / 0.55);
}

:global(html.dark) .landing-screenshots-modal__viewport,
:global(html.dark) .landing-screenshots-modal__thumb img {
  background: #080808;
}

:global(html.dark) .landing-screenshots-modal__counter {
  color: rgb(255 255 255 / 0.45);
}
</style>
