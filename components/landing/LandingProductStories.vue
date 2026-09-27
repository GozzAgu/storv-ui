<template>
  <section id="product" class="pstory-section" aria-label="Product capabilities">
    <header class="pstory-intro scroll-animate scroll-animate-up">
      <p class="pstory-intro__eyebrow">
        <PlayCircle class="h-3.5 w-3.5" aria-hidden="true" />
        Product tour
      </p>
      <h2 class="pstory-intro__title">
        See Storvv <span class="pstory-intro__accent">in action.</span>
      </h2>
      <nav class="pstory-nav" aria-label="Jump to a product area">
        <a
          v-for="(story, i) in stories"
          :key="story.id"
          :href="`#${story.id}`"
          class="pstory-nav__chip"
          :class="[`pstory-tone--${story.tone}`, { 'pstory-nav__chip--active': activeStoryId === story.id }]"
        >
          <span class="pstory-nav__num">0{{ i + 1 }}</span>
          <component :is="story.icon" class="h-4 w-4" aria-hidden="true" />
          {{ story.eyebrow }}
          <span v-if="story.comingSoon" class="pstory-nav__soon">Soon</span>
        </a>
      </nav>
    </header>

    <article
      v-for="(story, index) in stories"
      :id="story.id"
      :key="story.id"
      :ref="(el) => setStoryRef(story.id, el)"
      :data-section-id="`landing-story-${story.id}`"
      class="pstory scroll-animate scroll-animate-up scroll-mt-24"
      :class="[`pstory-tone--${story.tone}`, { 'pstory--reverse': index % 2 === 1 }]"
    >
      <div class="pstory__inner">
        <div class="pstory__copy">
          <div class="pstory__meta">
            <span class="pstory__num">0{{ index + 1 }}</span>
            <span class="pstory__eyebrow">
              <component :is="story.icon" class="h-3.5 w-3.5" aria-hidden="true" />
              {{ story.eyebrow }}
            </span>
            <span v-if="story.comingSoon" class="pstory__soon">
              <span class="pstory__soon-dot" aria-hidden="true" />
              Coming soon
            </span>
          </div>
          <h2 class="pstory__title">
            {{ story.title }} <span class="pstory__accent">{{ story.accent }}</span>
          </h2>
          <p class="pstory__lede">{{ story.lede }}</p>
          <ul class="pstory__bullets">
            <li v-for="bullet in story.bullets" :key="bullet" class="pstory__bullet">
              <span class="pstory__bullet-icon">
                <Clock v-if="story.comingSoon" class="h-3 w-3" aria-hidden="true" />
                <Check v-else class="h-3 w-3" aria-hidden="true" />
              </span>
              {{ bullet }}
            </li>
          </ul>
        </div>

        <div
          class="pstory__visual"
          @mouseenter="paused = true"
          @mouseleave="paused = false"
        >
          <div class="pstory__glow" aria-hidden="true" />

          <div class="pstory__stage" :class="{ 'pstory__stage--soon': story.comingSoon }">
            <div class="pstory__bar" aria-hidden="true">
              <span class="pstory__dot" />
              <span class="pstory__dot" />
              <span class="pstory__dot" />
              <span class="pstory__url">app.storvv.com/{{ story.path }}</span>
            </div>

            <div class="pstory__frame">
              <img
                v-for="(shot, shotIndex) in story.shots"
                :key="shot.src"
                :src="shot.src"
                :alt="`${story.eyebrow}: ${shot.label} screen`"
                class="pstory__shot"
                :class="{ 'pstory__shot--active': shotIndexFor(story.id) === shotIndex }"
                loading="lazy"
                width="960"
                height="640"
              />
              <div v-if="story.comingSoon" class="pstory__soon-overlay">
                <span class="pstory__soon-overlay-icon">
                  <component :is="story.icon" class="h-6 w-6" aria-hidden="true" />
                </span>
                <p class="pstory__soon-overlay-title">Storefront is on the way</p>
                <p class="pstory__soon-overlay-body">We're building it now. It isn't in the app yet.</p>
              </div>
            </div>
          </div>

          <div v-if="story.callout" class="pstory__callout" aria-hidden="true">
            <span class="pstory__callout-icon">
              <component :is="story.callout.icon" class="h-4 w-4" />
            </span>
            <span>
              <span class="pstory__callout-title">{{ story.callout.title }}</span>
              <span class="pstory__callout-sub">{{ story.callout.sub }}</span>
            </span>
          </div>

          <div
            v-if="story.shots.length > 1 && !story.comingSoon"
            class="pstory__tabs"
            role="tablist"
            :aria-label="`${story.eyebrow} screens`"
          >
            <button
              v-for="(shot, shotIndex) in story.shots"
              :key="shot.label"
              type="button"
              role="tab"
              class="pstory__tab"
              :class="{ 'pstory__tab--active': shotIndexFor(story.id) === shotIndex }"
              :aria-selected="shotIndexFor(story.id) === shotIndex"
              @click="selectShot(story.id, shotIndex)"
            >
              {{ shot.label }}
              <span
                v-if="activeStoryId === story.id && shotIndexFor(story.id) === shotIndex && autoplay"
                :key="`${story.id}-${shotIndex}-${cycle}`"
                class="pstory__tab-progress"
                :class="{ 'pstory__tab-progress--paused': paused }"
                aria-hidden="true"
              />
            </button>
          </div>
        </div>
      </div>
    </article>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import {
  ArrowLeftRight,
  BellRing,
  Boxes,
  Check,
  CircleCheck,
  Clock,
  PlayCircle,
  ReceiptText,
  Store,
} from '@lucide/vue'
import { useLandingReducedMotion } from '~/composables/useLandingHeroMotion'

const SHOT_MS = 4000

const stories = [
  {
    id: 'inventory',
    eyebrow: 'Inventory',
    icon: Boxes,
    tone: 'navy',
    path: 'inventory',
    title: 'Categories, serials, and',
    accent: 'stock you can trust.',
    lede:
      'Organize products in folders with optional subcategories, custom fields, and serial or quantity tracking per branch.',
    bullets: [
      'One-level subcategories (for example Toyota → Corolla)',
      'Serial lines or bulk counts with low-stock alerts',
      'Customer buybacks add trade-in stock at cost',
      'Department-scoped folder access for staff',
    ],
    shots: [
      { src: '/marketing/screenshots/inventory.png', label: 'Categories' },
      { src: '/marketing/screenshots/buybacks.png', label: 'Buybacks' },
    ],
    callout: { icon: BellRing, title: 'Low-stock alert', sub: 'Reorder before shelves run empty' },
  },
  {
    id: 'sales',
    eyebrow: 'Sales & customers',
    icon: ReceiptText,
    tone: 'teal',
    path: 'sales',
    title: 'From enquiry to receipt,',
    accent: 'in one workspace.',
    lede:
      'Ring up sales with the full wizard or Quick Sale, follow up leads, and keep every customer balance in one place.',
    bullets: [
      'Create New Sale and Quick Sale with barcode support',
      'Sales leads pipeline (Medium+) before the receipt exists',
      'Customer balance ledger, refunds, and WhatsApp receipts',
      'Part payments with balances tracked automatically',
    ],
    shots: [
      { src: '/marketing/screenshots/receipts.png', label: 'Receipts' },
      { src: '/marketing/screenshots/sales-leads.png', label: 'Sales leads' },
      { src: '/marketing/screenshots/receipts-customers.png', label: 'Customers' },
    ],
    callout: { icon: CircleCheck, title: 'Receipt sent', sub: 'Delivered on WhatsApp' },
  },
  {
    id: 'storefront',
    eyebrow: 'Storefront',
    icon: Store,
    tone: 'amber',
    path: 'storefront',
    comingSoon: true,
    title: 'A public showroom',
    accent: 'backed by your real stock.',
    lede:
      "We're building a guest catalogue from your inventory. Shoppers will browse, enquire, or reserve, and you'll confirm in the dashboard.",
    bullets: [
      'Share a storefront link or QR code',
      'Guest enquiries and reservations in one inbox',
      'Complete & sell creates a receipt and updates stock',
    ],
    shots: [{ src: '/marketing/screenshots/dashboard.png', label: 'Preview' }],
    callout: null,
  },
  {
    id: 'solutions',
    eyebrow: 'Multi-store',
    icon: ArrowLeftRight,
    tone: 'violet',
    path: 'multi-store-sync',
    title: 'One business. Every branch.',
    accent: 'One login.',
    lede:
      'Switch stores instantly, transfer stock on Enterprise, and copy category templates across branches without copying live quantities.',
    bullets: [
      'Region-aware branch names from your onboarding country',
      'Stock transfers with approval and transfer history',
      'Copy from branch for Enterprise template rollout',
      'Stock loans for serial inventory lent to borrowers',
    ],
    shots: [
      { src: '/marketing/screenshots/multi-store-sync.png', label: 'Transfers' },
      { src: '/marketing/screenshots/seller-loans.png', label: 'Stock loans' },
      { src: '/marketing/screenshots/analytics.png', label: 'Analytics' },
    ],
    callout: { icon: CircleCheck, title: 'Transfer approved', sub: 'Lagos → Abuja' },
  },
]

const prefersReducedMotion = useLandingReducedMotion()
const autoplay = computed(() => !prefersReducedMotion.value)

const activeStoryId = ref(stories[0].id)
const shotIndexes = reactive<Record<string, number>>(Object.fromEntries(stories.map((s) => [s.id, 0])))
const paused = ref(false)
const cycle = ref(0)

const storyEls = new Map<string, Element>()
function setStoryRef(id: string, el: unknown) {
  if (el && el instanceof Element) storyEls.set(id, el)
  else storyEls.delete(id)
}

function shotIndexFor(id: string) {
  return shotIndexes[id] ?? 0
}

function selectShot(id: string, index: number) {
  shotIndexes[id] = index
  cycle.value++
  restartTimer()
}

let shotTimer: ReturnType<typeof setTimeout> | null = null
let observer: IntersectionObserver | null = null

function restartTimer() {
  if (shotTimer) clearTimeout(shotTimer)
  if (!autoplay.value) return
  shotTimer = setTimeout(advance, SHOT_MS)
}

function advance() {
  const story = stories.find((s) => s.id === activeStoryId.value)
  if (story && story.shots.length > 1 && !story.comingSoon && !paused.value) {
    shotIndexes[story.id] = (shotIndexFor(story.id) + 1) % story.shots.length
    cycle.value++
  }
  restartTimer()
}

onMounted(() => {
  if (!import.meta.client) return

  void nextTick(() => {
    observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
        const id = (visible?.target as HTMLElement | undefined)?.id
        if (id && id !== activeStoryId.value) {
          activeStoryId.value = id
          cycle.value++
          restartTimer()
        }
      },
      { threshold: [0.35, 0.55] }
    )
    storyEls.forEach((el) => observer?.observe(el))
  })

  restartTimer()
})

onBeforeUnmount(() => {
  if (shotTimer) clearTimeout(shotTimer)
  observer?.disconnect()
})
</script>

<style scoped>
.pstory-section {
  background: #f5f5f7;
}

.pstory-tone--navy {
  --tone: 20 63 141;
}

.pstory-tone--teal {
  --tone: 27 42 107;
}

.pstory-tone--amber {
  --tone: 47 95 184;
}

.pstory-tone--violet {
  --tone: 91 127 224;
}

/* Intro + chip nav */
.pstory-intro {
  max-width: 68rem;
  margin: 0 auto;
  padding: clamp(4rem, 8vw, 6rem) 1.25rem 0;
  text-align: center;
}

.pstory-intro__eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.35rem 0.8rem;
  border-radius: 9999px;
  background: rgb(20 63 141 / 0.08);
  color: #143f8d;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.pstory-intro__title {
  margin-top: 0.9rem;
  font-size: clamp(1.9rem, 4vw, 2.75rem);
  font-weight: 800;
  letter-spacing: -0.03em;
  color: #0f172a;
}

.pstory-intro__accent {
  background: linear-gradient(90deg, #143f8d, #5b7fe0);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.pstory-nav {
  margin-top: 1.5rem;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.5rem;
}

.pstory-nav__chip {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.5rem 0.95rem;
  border-radius: 9999px;
  background: #ffffff;
  border: 1px solid rgb(15 23 42 / 0.08);
  font-size: 0.85rem;
  font-weight: 600;
  color: #475569;
  transition: all 240ms ease;
}

.pstory-nav__chip:hover {
  color: rgb(var(--tone));
  border-color: rgb(var(--tone) / 0.35);
  transform: translateY(-1px);
}

.pstory-nav__chip--active {
  background: rgb(var(--tone));
  border-color: rgb(var(--tone));
  color: #ffffff;
  box-shadow: 0 10px 22px -10px rgb(var(--tone) / 0.7);
}

.pstory-nav__chip--active:hover {
  color: #ffffff;
}

.pstory-nav__num {
  font-size: 0.65rem;
  font-weight: 800;
  opacity: 0.55;
}

.pstory-nav__soon {
  padding: 0.05rem 0.4rem;
  border-radius: 9999px;
  background: rgb(72 118 199 / 0.18);
  color: #143f8d;
  font-size: 0.6rem;
  font-weight: 800;
  text-transform: uppercase;
}

.pstory-nav__chip--active .pstory-nav__soon {
  background: rgb(255 255 255 / 0.25);
  color: #ffffff;
}

/* Story */
.pstory {
  padding: clamp(3.5rem, 7vw, 5.5rem) 1.25rem;
}

.pstory__inner {
  max-width: 68rem;
  margin: 0 auto;
  display: grid;
  gap: 2.5rem;
  align-items: center;
}

@media (min-width: 960px) {
  .pstory__inner {
    grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr);
    gap: 4rem;
  }

  .pstory--reverse .pstory__copy {
    order: 2;
  }
}

.pstory__meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.6rem;
}

.pstory__num {
  font-size: 2.25rem;
  font-weight: 800;
  letter-spacing: -0.04em;
  line-height: 1;
  background: linear-gradient(180deg, rgb(var(--tone)), rgb(var(--tone) / 0.25));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.pstory__eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.35rem 0.75rem;
  border-radius: 9999px;
  background: rgb(var(--tone) / 0.1);
  color: rgb(var(--tone));
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.pstory__soon {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.3rem 0.7rem;
  border-radius: 9999px;
  border: 1px dashed rgb(47 95 184 / 0.5);
  background: rgb(72 118 199 / 0.1);
  color: #143f8d;
  font-size: 0.72rem;
  font-weight: 700;
}

.pstory__soon-dot {
  position: relative;
  width: 0.45rem;
  height: 0.45rem;
  border-radius: 9999px;
  background: #5b7fe0;
}

.pstory__soon-dot::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: #5b7fe0;
  animation: pstory-ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;
}

@keyframes pstory-ping {
  75%,
  100% {
    transform: scale(2.4);
    opacity: 0;
  }
}

.pstory__title {
  margin-top: 1rem;
  font-size: clamp(1.85rem, 3.8vw, 2.75rem);
  font-weight: 800;
  letter-spacing: -0.035em;
  line-height: 1.08;
  color: #0f172a;
}

.pstory__accent {
  background: linear-gradient(90deg, rgb(var(--tone)), rgb(var(--tone) / 0.65));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.pstory__lede {
  margin-top: 1rem;
  font-size: 1.02rem;
  line-height: 1.65;
  color: #475569;
}

.pstory__bullets {
  margin-top: 1.5rem;
  display: grid;
  gap: 0.55rem;
}

.pstory__bullet {
  display: flex;
  align-items: flex-start;
  gap: 0.7rem;
  padding: 0.7rem 0.85rem;
  border-radius: 0.9rem;
  background: #ffffff;
  border: 1px solid rgb(15 23 42 / 0.06);
  font-size: 0.9rem;
  line-height: 1.45;
  color: #334155;
  transition: transform 220ms ease, border-color 220ms ease, box-shadow 220ms ease;
}

.pstory__bullet:hover {
  transform: translateX(4px);
  border-color: rgb(var(--tone) / 0.3);
  box-shadow: 0 10px 24px -16px rgb(var(--tone) / 0.5);
}

.pstory__bullet-icon {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 1.3rem;
  height: 1.3rem;
  margin-top: 0.05rem;
  border-radius: 9999px;
  background: rgb(var(--tone) / 0.12);
  color: rgb(var(--tone));
}

/* Visual */
.pstory__visual {
  position: relative;
}

.pstory__glow {
  position: absolute;
  inset: 8% 6% -4%;
  border-radius: 2rem;
  background: radial-gradient(60% 60% at 50% 50%, rgb(var(--tone) / 0.28), transparent 75%);
  filter: blur(30px);
  pointer-events: none;
}

.pstory__stage {
  position: relative;
  overflow: hidden;
  border-radius: 1.25rem;
  background: #ffffff;
  border: 1px solid rgb(15 23 42 / 0.14);
  box-shadow:
    0 0 0 8px #ffffff,
    0 0 0 9px rgb(15 23 42 / 0.08),
    0 36px 80px -24px rgb(var(--tone) / 0.45),
    0 16px 36px -12px rgb(15 23 42 / 0.18);
  transition: transform 400ms cubic-bezier(0.22, 1, 0.36, 1);
}

.pstory__visual:hover .pstory__stage {
  transform: translateY(-4px) rotate(-0.3deg);
}

.pstory__bar {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.6rem 0.9rem;
  border-bottom: 1px solid rgb(15 23 42 / 0.06);
  background: #f8fafc;
}

.pstory__dot {
  width: 0.55rem;
  height: 0.55rem;
  border-radius: 9999px;
  background: rgb(15 23 42 / 0.12);
}

.pstory__dot:nth-child(1) {
  background: #fca5a5;
}

.pstory__dot:nth-child(2) {
  background: #c7d5f0;
}

.pstory__dot:nth-child(3) {
  background: #86efac;
}

.pstory__url {
  margin-left: 0.75rem;
  padding: 0.2rem 0.75rem;
  border-radius: 9999px;
  background: #ffffff;
  box-shadow: inset 0 0 0 1px rgb(15 23 42 / 0.08);
  font-size: 0.68rem;
  font-weight: 600;
  color: #64748b;
}

.pstory__frame {
  position: relative;
  aspect-ratio: 16 / 10;
  background: #f1f4f9;
}

.pstory__shot {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: top left;
  opacity: 0;
  transform: scale(1.02);
  transition: opacity 600ms ease, transform 900ms cubic-bezier(0.22, 1, 0.36, 1);
}

.pstory__shot--active {
  opacity: 1;
  transform: none;
}

.pstory__stage--soon .pstory__shot {
  filter: blur(6px) saturate(0.6);
}

.pstory__soon-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  padding: 1.5rem;
  text-align: center;
  background:
    repeating-linear-gradient(135deg, transparent 0 14px, rgb(72 118 199 / 0.06) 14px 28px),
    rgb(255 255 255 / 0.55);
}

.pstory__soon-overlay-icon {
  display: grid;
  place-items: center;
  width: 3.25rem;
  height: 3.25rem;
  margin-bottom: 0.35rem;
  border-radius: 1rem;
  background: #ffffff;
  color: #2f5fb8;
  box-shadow: 0 12px 28px -12px rgb(47 95 184 / 0.6);
}

.pstory__soon-overlay-title {
  font-size: 1.15rem;
  font-weight: 800;
  color: #0f172a;
}

.pstory__soon-overlay-body {
  font-size: 0.85rem;
  color: #475569;
}

.pstory__callout {
  position: absolute;
  z-index: 2;
  bottom: 4.25rem;
  left: -0.75rem;
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.65rem 0.9rem 0.65rem 0.65rem;
  border-radius: 1rem;
  background: #ffffff;
  box-shadow:
    0 0 0 1px rgb(15 23 42 / 0.06),
    0 18px 36px -14px rgb(15 23 42 / 0.35);
  animation: pstory-float 5s ease-in-out infinite;
}

.pstory--reverse .pstory__callout {
  left: auto;
  right: -0.75rem;
}

@keyframes pstory-float {
  50% {
    transform: translateY(-6px);
  }
}

.pstory__callout-icon {
  display: grid;
  place-items: center;
  width: 2rem;
  height: 2rem;
  border-radius: 0.65rem;
  background: rgb(var(--tone) / 0.12);
  color: rgb(var(--tone));
}

.pstory__callout-title {
  display: block;
  font-size: 0.8rem;
  font-weight: 700;
  color: #0f172a;
}

.pstory__callout-sub {
  display: block;
  font-size: 0.72rem;
  color: #64748b;
}

.pstory__tabs {
  position: relative;
  margin-top: 1.5rem;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.4rem;
}

.pstory__tab {
  position: relative;
  overflow: hidden;
  padding: 0.5rem 1rem;
  border-radius: 9999px;
  background: #ffffff;
  border: 1px solid rgb(15 23 42 / 0.08);
  font-size: 0.8rem;
  font-weight: 600;
  color: #475569;
  transition: all 220ms ease;
}

.pstory__tab:hover {
  color: rgb(var(--tone));
}

.pstory__tab--active {
  background: #0f172a;
  border-color: #0f172a;
  color: #ffffff;
}

.pstory__tab--active:hover {
  color: #ffffff;
}

.pstory__tab-progress {
  position: absolute;
  left: 0;
  bottom: 0;
  height: 2px;
  width: 100%;
  background: rgb(var(--tone));
  transform-origin: left;
  animation: pstory-progress 4000ms linear forwards;
}

.pstory__tab-progress--paused {
  animation-play-state: paused;
}

@keyframes pstory-progress {
  from {
    transform: scaleX(0);
  }
  to {
    transform: scaleX(1);
  }
}

/* Dark */
html.dark .pstory-section {
  background: #080808;
}

html.dark .pstory-tone--navy {
  --tone: 112 144 240;
}

html.dark .pstory-tone--teal {
  --tone: 110 148 214;
}

html.dark .pstory-tone--amber {
  --tone: 154 181 227;
}

html.dark .pstory-tone--violet {
  --tone: 169 188 245;
}

html.dark .pstory-intro__eyebrow {
  background: rgb(112 144 240 / 0.12);
  color: #a9bcf5;
}

html.dark .pstory-intro__title,
html.dark .pstory__title,
html.dark .pstory__callout-title,
html.dark .pstory__soon-overlay-title {
  color: #ffffff;
}

html.dark .pstory-intro__accent {
  background-image: linear-gradient(90deg, #a9bcf5, #c7d5f0);
}

html.dark .pstory__lede,
html.dark .pstory__bullet,
html.dark .pstory__soon-overlay-body {
  color: rgb(255 255 255 / 0.72);
}

html.dark .pstory-nav__chip,
html.dark .pstory__bullet,
html.dark .pstory__tab {
  background: #161616;
  border-color: rgb(255 255 255 / 0.08);
  color: rgb(255 255 255 / 0.7);
}

html.dark .pstory-nav__chip--active {
  background: rgb(var(--tone));
  border-color: rgb(var(--tone));
  color: #0b0b0b;
}

html.dark .pstory__tab--active {
  background: #ffffff;
  border-color: #ffffff;
  color: #0f172a;
}

html.dark .pstory__stage {
  background: #161616;
  border-color: rgb(255 255 255 / 0.1);
  box-shadow:
    0 0 0 1px rgb(255 255 255 / 0.04),
    0 36px 80px -24px rgb(var(--tone) / 0.35);
}

html.dark .pstory__bar {
  background: #1c1c1c;
  border-bottom-color: rgb(255 255 255 / 0.06);
}

html.dark .pstory__url {
  background: #111111;
  color: rgb(255 255 255 / 0.5);
}

html.dark .pstory__callout {
  background: #1c1c1c;
}

html.dark .pstory__callout-sub {
  color: rgb(255 255 255 / 0.55);
}

html.dark .pstory__soon-overlay {
  background:
    repeating-linear-gradient(135deg, transparent 0 14px, rgb(72 118 199 / 0.07) 14px 28px),
    rgb(10 10 10 / 0.6);
}

html.dark .pstory__soon,
html.dark .pstory-nav__soon {
  color: #a9bcf5;
}

@media (prefers-reduced-motion: reduce) {
  .pstory__shot,
  .pstory__stage,
  .pstory__bullet,
  .pstory-nav__chip {
    transition: none;
  }

  .pstory__callout,
  .pstory__soon-dot::after {
    animation: none;
  }

  .pstory__visual:hover .pstory__stage {
    transform: none;
  }
}
</style>
