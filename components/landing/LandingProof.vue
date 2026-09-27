<template>
  <section
    id="proof"
    ref="sectionRef"
    data-section-id="landing-proof"
    class="landing-proof scroll-animate scroll-animate-up"
    aria-labelledby="landing-proof-heading"
  >
    <div class="landing-proof__inner">
      <header class="landing-proof__header">
        <div class="landing-proof__header-copy">
          <p class="landing-label landing-label--blue">Trusted by modern retailers</p>
          <h2 id="landing-proof-heading" class="landing-proof__title">
            Built for businesses that outgrow spreadsheets
          </h2>
          <p class="landing-proof__lede">
            From Solo owner-operators on Micro to multi-branch Enterprise teams: pick the workspace
            that fits how you run the shop, then scale plans as you grow.
          </p>
        </div>
        <img
          src="/marketing/illustrations/analytics-illustration.png"
          alt="An analytics dashboard with revenue charts and a stopwatch, representing fast reporting"
          class="landing-proof__header-visual"
          loading="lazy"
          width="360"
          height="288"
        />
      </header>

      <div class="landing-proof__pulse" aria-label="Platform highlights">
        <button
          v-for="(stat, index) in stats"
          :key="stat.id"
          type="button"
          class="landing-proof__pulse-tile"
          :class="[
            `landing-proof__pulse-tile--${stat.id}`,
            { 'landing-proof__pulse-tile--open': openStat === stat.id },
          ]"
          :aria-expanded="openStat === stat.id"
          :aria-label="`${stat.end}${stat.suffix} ${stat.label}${stat.tag ? `. ${stat.tag}` : ''}. Tap to see what's included.`"
          @click="onStatTap(stat.id, index)"
          @mouseenter="openStat = stat.id"
          @mouseleave="openStat = null"
          @focus="openStat = stat.id"
          @blur="openStat = null"
          @pointermove="onTilePointer"
        >
          <span class="landing-proof__pulse-glow" aria-hidden="true" />
          <span class="landing-proof__pulse-value" aria-hidden="true">
            <span class="landing-proof__pulse-num">{{ counts[index] }}</span>
            <span v-if="stat.suffix" class="landing-proof__pulse-suffix">{{ stat.suffix }}</span>
          </span>
          <span class="landing-proof__pulse-label">{{ stat.label }}</span>
          <span v-if="stat.tag" class="landing-proof__pulse-tag">
            <span class="landing-proof__soon-dot" aria-hidden="true" />
            {{ stat.tag }}
          </span>
          <span class="landing-proof__pulse-chips" aria-hidden="true">
            <span
              v-for="(chip, chipIndex) in stat.chips"
              :key="chip"
              class="landing-proof__pulse-chip"
              :style="{ transitionDelay: openStat === stat.id ? `${chipIndex * 40}ms` : '0ms' }"
            >
              {{ chip }}
            </span>
            <span
              v-for="(chip, chipIndex) in stat.soonChips"
              :key="chip"
              class="landing-proof__pulse-chip landing-proof__pulse-chip--soon"
              :style="{
                transitionDelay:
                  openStat === stat.id ? `${(stat.chips.length + chipIndex) * 40}ms` : '0ms',
              }"
            >
              {{ chip }}
            </span>
          </span>
          <span class="landing-proof__pulse-hint" aria-hidden="true">
            {{ openStat === stat.id ? 'Tap to replay' : 'Hover or tap' }}
          </span>
        </button>
      </div>

      <div class="landing-proof__grid">
        <article
          v-for="card in proofCards"
          :key="card.title"
          class="landing-proof__card"
          :class="{ 'landing-proof__card--soon': card.comingSoon }"
        >
          <div class="landing-proof__card-top">
            <span class="landing-proof__card-icon" aria-hidden="true">
              <MarketingFeatureIcon :name="card.iconKey" size="md" />
            </span>
            <span v-if="card.comingSoon" class="landing-proof__soon-badge">Coming soon</span>
          </div>
          <p class="landing-proof__metric">{{ card.metric }}</p>
          <h3 class="landing-proof__card-title">{{ card.title }}</h3>
          <p class="landing-proof__card-desc">{{ card.description }}</p>
          <p v-if="card.soonNote" class="landing-proof__soon-note">
            <span class="landing-proof__soon-dot" aria-hidden="true" />
            {{ card.soonNote }}
          </p>
        </article>
      </div>

      <aside class="landing-proof__roadmap" aria-label="On the roadmap">
        <span class="landing-proof__roadmap-icon" aria-hidden="true">
          <MarketingFeatureIcon name="storefront" size="md" />
        </span>
        <p class="landing-proof__roadmap-copy">
          <strong>Storefront, payment links, and our iOS and Android apps are on the way.</strong>
          They aren't available yet. We're building them right now and can't wait to bring them
          to your shop.
        </p>
      </aside>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import type { MarketingFeatureIconKey } from '~/utils/marketing-feature-icons'
import { useLandingReducedMotion } from '~/composables/useLandingHeroMotion'

const sectionRef = ref<HTMLElement | null>(null)
const prefersReducedMotion = useLandingReducedMotion()

const stats = [
  {
    id: 'workflows',
    end: 8,
    suffix: '+',
    label: 'Core retail workflows in one workspace',
    tag: null,
    soonChips: [],
    chips: [
      'Inventory',
      'Sales',
      'Buybacks',
      'Stock loans',
      'Sales leads',
      'Multi-store sync',
      'Analytics',
      'Activity logs',
    ],
  },
  {
    id: 'plans',
    end: 3,
    suffix: '',
    label: 'Plans from free Micro to Enterprise',
    tag: null,
    soonChips: [],
    chips: ['Micro · free', 'Medium', 'Enterprise'],
  },
  {
    id: 'surfaces',
    end: 3,
    suffix: '',
    label: 'Platforms · live on the web today',
    tag: 'iOS & Android apps coming soon',
    soonChips: ['iOS · soon', 'Android · soon'],
    chips: ['Web dashboard · live'],
  },
] as const

type StatId = (typeof stats)[number]['id']

const counts = ref<number[]>(stats.map(() => 0))
const openStat = ref<StatId | null>(null)
const frames = new Map<number, number>()

function countUp(index: number, durationMs = 1100) {
  const end = stats[index]!.end
  if (prefersReducedMotion.value) {
    counts.value[index] = end
    return
  }
  const pending = frames.get(index)
  if (pending) cancelAnimationFrame(pending)
  const start = performance.now()
  const step = (now: number) => {
    const t = Math.min(1, (now - start) / durationMs)
    counts.value[index] = Math.round(end * (1 - Math.pow(1 - t, 3)))
    if (t < 1) frames.set(index, requestAnimationFrame(step))
    else frames.delete(index)
  }
  counts.value[index] = 0
  frames.set(index, requestAnimationFrame(step))
}

function onStatTap(id: StatId, index: number) {
  openStat.value = id
  countUp(index, 800)
}

function onTilePointer(event: PointerEvent) {
  const el = event.currentTarget as HTMLElement
  const rect = el.getBoundingClientRect()
  el.style.setProperty('--pulse-x', `${event.clientX - rect.left}px`)
  el.style.setProperty('--pulse-y', `${event.clientY - rect.top}px`)
}

const proofCards: Array<{
  metric: string
  iconKey: MarketingFeatureIconKey
  title: string
  description: string
  comingSoon?: boolean
  soonNote?: string
}> = [
  {
    metric: 'Stock',
    iconKey: 'inventory',
    title: 'Live inventory per branch',
    description:
      'Serial or quantity modes, subcategories, buybacks, and low-stock alerts before shelves run empty.',
  },
  {
    metric: 'Sales',
    iconKey: 'receipts',
    title: 'Receipts, leads & checkout',
    description:
      'Wizard or Quick Sale checkout, part payments and balances, plus a sales leads pipeline.',
    soonNote: 'Payment links for remote customers are coming soon.',
  },
  {
    metric: 'Storefront',
    iconKey: 'storefront',
    title: 'Public showroom from your stock',
    description:
      "We're building a guest catalogue from your stock, with enquiries and reservations that turn into sales.",
    comingSoon: true,
  },
  {
    metric: 'Insights',
    iconKey: 'analytics',
    title: 'Analytics & audit trail',
    description: 'Feature insights, exports, and activity logs on Medium and Enterprise.',
  },
]

let observer: IntersectionObserver | null = null

onMounted(() => {
  if (!import.meta.client || !sectionRef.value) return
  observer = new IntersectionObserver(
    (entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        stats.forEach((_, index) => setTimeout(() => countUp(index), index * 140))
        observer?.disconnect()
      }
    },
    { threshold: 0.35 }
  )
  observer.observe(sectionRef.value)
})

onBeforeUnmount(() => {
  observer?.disconnect()
  frames.forEach((frame) => cancelAnimationFrame(frame))
})
</script>

<style scoped>
.landing-proof {
  padding: clamp(4rem, 9vw, 7rem) 1.25rem;
  background: #f5f5f7;
}

.landing-proof__inner {
  max-width: 72rem;
  margin: 0 auto;
}

.landing-proof__header {
  display: flex;
  flex-direction: column-reverse;
  align-items: flex-start;
  gap: 1.75rem;
}

@media (min-width: 900px) {
  .landing-proof__header {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    gap: 2.5rem;
  }
}

.landing-proof__header-copy {
  max-width: 34rem;
}

.landing-proof__header-visual {
  flex: 0 0 auto;
  width: 11rem;
  height: auto;
  border-radius: 1.25rem;
  object-fit: contain;
  background: #ffffff;
  padding: 0.5rem;
}

@media (min-width: 900px) {
  .landing-proof__header-visual {
    width: 14rem;
  }
}

html.dark .landing-proof__header-visual {
  background: #1e1e1e;
}

.landing-proof .landing-label {
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgb(15 23 42 / 0.55);
}

.landing-proof__title {
  margin-top: 0.5rem;
  font-size: clamp(1.5rem, 3.2vw, 2.125rem);
  font-weight: 800;
  letter-spacing: -0.02em;
  line-height: 1.15;
  color: var(--landing-section-heading, #0f172a);
}

.landing-proof__lede {
  margin-top: 0.75rem;
  font-size: 0.9375rem;
  line-height: 1.6;
  color: var(--landing-section-body, #334155);
}

.landing-proof__grid {
  margin-top: 2rem;
  display: grid;
  gap: 1rem;
}

@media (min-width: 768px) {
  .landing-proof__grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 1.25rem;
  }
}

@media (min-width: 1100px) {
  .landing-proof__grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

.landing-proof__card {
  border-radius: 1rem;
  border: 0;
  background: #ffffff;
  padding: 1.25rem 1.35rem;
}

.landing-proof__card-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  margin-bottom: 0.75rem;
  border-radius: 0.625rem;
  background: #f4f4f5;
  color: rgb(15 23 42 / 0.55);
}

.landing-proof__metric {
  font-size: 0.9375rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: rgb(15 23 42 / 0.55);
}

.landing-proof__card-title {
  margin-top: 0.5rem;
  font-size: 1rem;
  font-weight: 700;
  color: var(--landing-section-heading, #0f172a);
}

.landing-proof__card-desc {
  margin-top: 0.5rem;
  font-size: 0.875rem;
  line-height: 1.6;
  color: var(--landing-section-body, #475569);
}

/* ── Interactive highlight numbers ── */
.landing-proof__pulse {
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid rgb(15 23 42 / 0.06);
  display: grid;
  gap: 0.875rem;
}

@media (min-width: 768px) {
  .landing-proof__pulse {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 1.25rem;
  }
}

.landing-proof__pulse-tile {
  --pulse-accent: 20 63 141;
  --pulse-x: 50%;
  --pulse-y: 0%;
  position: relative;
  isolation: isolate;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  min-height: 11.5rem;
  padding: 1.35rem 1.4rem 1.2rem;
  border: 1px solid rgb(15 23 42 / 0.06);
  border-radius: 1.25rem;
  background: #ffffff;
  text-align: left;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition:
    transform 0.35s cubic-bezier(0.22, 1, 0.36, 1),
    box-shadow 0.35s cubic-bezier(0.22, 1, 0.36, 1),
    border-color 0.35s ease;
}

.landing-proof__pulse-tile--plans {
  --pulse-accent: 91 127 224;
}

.landing-proof__pulse-tile--surfaces {
  --pulse-accent: 27 42 107;
}

.landing-proof__pulse-tile:hover,
.landing-proof__pulse-tile--open {
  transform: translateY(-4px);
  border-color: rgb(var(--pulse-accent) / 0.28);
  box-shadow:
    0 2px 6px rgb(15 23 42 / 0.05),
    0 24px 48px -18px rgb(var(--pulse-accent) / 0.35);
}

.landing-proof__pulse-tile:active {
  transform: translateY(-1px) scale(0.99);
}

.landing-proof__pulse-tile:focus-visible {
  outline: 2px solid rgb(var(--pulse-accent) / 0.6);
  outline-offset: 3px;
}

.landing-proof__pulse-glow {
  position: absolute;
  inset: 0;
  z-index: -1;
  opacity: 0;
  background: radial-gradient(
    260px circle at var(--pulse-x) var(--pulse-y),
    rgb(var(--pulse-accent) / 0.14),
    transparent 70%
  );
  transition: opacity 0.35s ease;
}

.landing-proof__pulse-tile:hover .landing-proof__pulse-glow,
.landing-proof__pulse-tile--open .landing-proof__pulse-glow {
  opacity: 1;
}

.landing-proof__pulse-value {
  display: inline-flex;
  align-items: flex-start;
  line-height: 1;
}

.landing-proof__pulse-num {
  font-size: clamp(3rem, 6vw, 4.25rem);
  font-weight: 800;
  letter-spacing: -0.05em;
  font-variant-numeric: tabular-nums;
  background: linear-gradient(135deg, rgb(var(--pulse-accent)) 0%, rgb(var(--pulse-accent) / 0.55) 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  transition: transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.landing-proof__pulse-tile:hover .landing-proof__pulse-num,
.landing-proof__pulse-tile--open .landing-proof__pulse-num {
  transform: scale(1.06);
}

.landing-proof__pulse-suffix {
  margin-left: 0.125rem;
  font-size: clamp(1.5rem, 3vw, 2rem);
  font-weight: 800;
  color: rgb(var(--pulse-accent) / 0.75);
}

.landing-proof__pulse-label {
  margin-top: 0.625rem;
  font-size: 0.875rem;
  font-weight: 600;
  line-height: 1.4;
  color: var(--landing-section-heading, #0f172a);
}

.landing-proof__pulse-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
  margin-top: 0.75rem;
}

.landing-proof__pulse-chip {
  padding: 0.25rem 0.55rem;
  border-radius: 9999px;
  background: rgb(var(--pulse-accent) / 0.08);
  font-size: 0.6875rem;
  font-weight: 600;
  color: rgb(var(--pulse-accent));
  opacity: 0;
  transform: translateY(6px);
  transition:
    opacity 0.3s ease,
    transform 0.3s cubic-bezier(0.22, 1, 0.36, 1);
}

.landing-proof__pulse-tile:hover .landing-proof__pulse-chip,
.landing-proof__pulse-tile--open .landing-proof__pulse-chip {
  opacity: 1;
  transform: translateY(0);
}

.landing-proof__pulse-hint {
  margin-top: auto;
  padding-top: 0.75rem;
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: rgb(15 23 42 / 0.38);
}

.landing-proof__pulse-tag {
  display: inline-flex;
  align-items: center;
  align-self: flex-start;
  gap: 0.45rem;
  margin-top: 0.6rem;
  padding: 0.3rem 0.65rem;
  border-radius: 9999px;
  background: rgb(72 118 199 / 0.12);
  font-size: 0.72rem;
  font-weight: 700;
  color: #143f8d;
}

.landing-proof__pulse-chip--soon {
  border: 1px dashed rgb(47 95 184 / 0.45);
  background: rgb(72 118 199 / 0.08);
  color: #143f8d;
}

/* Touch screens have no hover, so show what each number covers up front */
@media (hover: none) {
  .landing-proof__pulse-chip {
    opacity: 1;
    transform: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .landing-proof__pulse-tile,
  .landing-proof__pulse-num,
  .landing-proof__pulse-chip {
    transition: none;
  }
}

/* ── Coming soon ── */
.landing-proof__card {
  position: relative;
}

.landing-proof__card-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.5rem;
}

.landing-proof__soon-badge {
  padding: 0.25rem 0.6rem;
  border-radius: 9999px;
  background: rgb(72 118 199 / 0.14);
  font-size: 0.6875rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  color: #143f8d;
  white-space: nowrap;
}

.landing-proof__card.landing-proof__card--soon {
  background: repeating-linear-gradient(
      135deg,
      transparent 0 10px,
      rgb(72 118 199 / 0.035) 10px 20px
    ),
    #ffffff !important;
  outline: 1px dashed rgb(72 118 199 / 0.45);
  outline-offset: -1px;
}

.landing-proof__soon-note {
  display: flex;
  align-items: flex-start;
  gap: 0.45rem;
  margin-top: 0.75rem;
  font-size: 0.8125rem;
  font-weight: 600;
  line-height: 1.45;
  color: #143f8d;
}

.landing-proof__soon-dot {
  flex-shrink: 0;
  width: 0.45rem;
  height: 0.45rem;
  margin-top: 0.35rem;
  border-radius: 9999px;
  background: #5b7fe0;
  box-shadow: 0 0 0 0 rgb(72 118 199 / 0.5);
  animation: landing-proof-soon-ping 2s ease-out infinite;
}

@keyframes landing-proof-soon-ping {
  0% {
    box-shadow: 0 0 0 0 rgb(72 118 199 / 0.5);
  }
  70%,
  100% {
    box-shadow: 0 0 0 7px rgb(72 118 199 / 0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .landing-proof__soon-dot {
    animation: none;
  }
}

.landing-proof__roadmap {
  display: flex;
  align-items: center;
  gap: 0.875rem;
  margin-top: 1.25rem;
  padding: 1rem 1.25rem;
  border: 1px dashed rgb(72 118 199 / 0.5);
  border-radius: 1rem;
  background: rgb(238 242 251 / 0.9);
}

.landing-proof__roadmap-icon {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 0.625rem;
  background: rgb(72 118 199 / 0.16);
  color: #143f8d;
}

.landing-proof__roadmap-copy {
  font-size: 0.875rem;
  line-height: 1.55;
  color: #0c2c66;
}

.landing-proof__roadmap-copy strong {
  font-weight: 700;
}

html.dark .landing-proof__pulse {
  border-top-color: rgb(255 255 255 / 0.08);
}

html.dark .landing-proof__pulse-tile {
  border-color: rgb(255 255 255 / 0.06);
  background: #1e1e1e;
}

html.dark .landing-proof__pulse-tile--workflows {
  --pulse-accent: 120 160 230;
}

html.dark .landing-proof__pulse-tile--plans {
  --pulse-accent: 169 188 245;
}

html.dark .landing-proof__pulse-tile--surfaces {
  --pulse-accent: 110 148 214;
}

html.dark .landing-proof__pulse-label {
  color: #f5f5f7;
}

html.dark .landing-proof__pulse-hint {
  color: rgb(255 255 255 / 0.38);
}

html.dark .landing-proof__card.landing-proof__card--soon {
  background: repeating-linear-gradient(
      135deg,
      transparent 0 10px,
      rgb(72 118 199 / 0.05) 10px 20px
    ),
    #1e1e1e !important;
}

html.dark .landing-proof__soon-badge,
html.dark .landing-proof__soon-note,
html.dark .landing-proof__pulse-tag,
html.dark .landing-proof__pulse-chip--soon {
  color: #a9bcf5;
}

html.dark .landing-proof__roadmap {
  background: rgb(72 118 199 / 0.08);
}

html.dark .landing-proof__roadmap-icon {
  color: #a9bcf5;
}

html.dark .landing-proof__roadmap-copy {
  color: #c7d5f0;
}

html.dark .landing-proof {
  background: #080808;
}

html.dark .landing-proof__card {
  background: #1e1e1e;
}

html.dark .landing-proof__card-icon {
  background: #282828;
  color: rgb(255 255 255 / 0.62);
}

html.dark .landing-proof .landing-label,
html.dark .landing-proof__metric {
  color: rgb(255 255 255 / 0.62);
}
</style>
