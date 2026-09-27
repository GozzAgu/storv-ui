<template>
  <section
    id="features-teaser"
    data-section-id="features-teaser"
    class="landing-ft scroll-animate scroll-animate-up scroll-mt-[4.75rem] lg:scroll-mt-28"
    aria-labelledby="landing-ft-title"
  >
    <div class="landing-ft__inner">
      <header class="landing-ft__head">
        <div>
          <p class="landing-ft__eyebrow">
            <Squares2X2Icon class="h-3.5 w-3.5" aria-hidden="true" />
            Full product
          </p>
          <h2 id="landing-ft-title" class="landing-ft__title">
            Every capability, <span class="landing-ft__accent">without the scroll marathon.</span>
          </h2>
          <p class="landing-ft__lede">
            Browse every tool by category, with screenshots of the real app and the Storvv
            Assistant overview.
          </p>
        </div>
        <NuxtLink to="/features" class="landing-ft__cta">
          Explore all features
          <ArrowRightIcon class="h-4 w-4" aria-hidden="true" />
        </NuxtLink>
      </header>

      <ul class="landing-ft__grid">
        <li v-for="tile in tiles" :key="tile.title">
          <NuxtLink
            to="/features"
            class="landing-ft__tile"
            :class="[`landing-ft__tile--${tile.tone}`, { 'landing-ft__tile--soon': tile.soon }]"
          >
            <span class="landing-ft__icon">
              <component :is="tile.icon" class="h-5 w-5" aria-hidden="true" />
            </span>
            <span class="landing-ft__tile-title">
              {{ tile.title }}
              <span v-if="tile.soon" class="landing-ft__soon">Soon</span>
            </span>
            <span class="landing-ft__tile-desc">{{ tile.description }}</span>
            <ArrowUpRightIcon class="landing-ft__arrow" aria-hidden="true" />
          </NuxtLink>
        </li>
      </ul>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ArrowUpRight as ArrowUpRightIcon } from '@lucide/vue'
import {
  ArrowRightIcon,
  ArrowsRightLeftIcon,
  BuildingStorefrontIcon,
  ChartBarIcon,
  CubeIcon,
  ReceiptPercentIcon,
  SparklesIcon,
  Squares2X2Icon,
} from '~/utils/app-icons'

const tiles = [
  {
    title: 'Inventory',
    description: 'Categories, serials, buybacks, and low-stock alerts.',
    icon: CubeIcon,
    tone: 'navy',
  },
  {
    title: 'Sales',
    description: 'Wizard or Quick Sale, balances, and sales leads.',
    icon: ReceiptPercentIcon,
    tone: 'teal',
  },
  {
    title: 'Analytics',
    description: 'Revenue, profit, exports, and activity logs.',
    icon: ChartBarIcon,
    tone: 'violet',
  },
  {
    title: 'Multi-store',
    description: 'Branch switching, transfers, and stock loans.',
    icon: ArrowsRightLeftIcon,
    tone: 'navy',
  },
  {
    title: 'Storvv Assistant',
    description: 'Ask how any screen or workflow works.',
    icon: SparklesIcon,
    tone: 'violet',
  },
  {
    title: 'Storefront',
    description: 'A guest catalogue from your stock, on the way.',
    icon: BuildingStorefrontIcon,
    tone: 'amber',
    soon: true,
  },
] as const
</script>

<style scoped>
.landing-ft {
  padding: clamp(4rem, 8vw, 6.5rem) 1.25rem;
  background: #f5f5f7;
}

.landing-ft__inner {
  max-width: 68rem;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 2.25rem;
}

.landing-ft__head {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

@media (min-width: 860px) {
  .landing-ft__head {
    flex-direction: row;
    align-items: flex-end;
    justify-content: space-between;
    gap: 3rem;
  }
}

.landing-ft__eyebrow {
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

.landing-ft__title {
  margin-top: 0.9rem;
  max-width: 36rem;
  font-size: clamp(1.75rem, 3.6vw, 2.5rem);
  font-weight: 800;
  letter-spacing: -0.03em;
  line-height: 1.1;
  color: #0f172a;
}

.landing-ft__accent {
  background: linear-gradient(90deg, #143f8d, #5b7fe0);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.landing-ft__lede {
  margin-top: 0.8rem;
  max-width: 34rem;
  font-size: 1rem;
  line-height: 1.6;
  color: #475569;
}

.landing-ft__cta {
  display: inline-flex;
  align-items: center;
  align-self: flex-start;
  gap: 0.5rem;
  flex-shrink: 0;
  padding: 0.85rem 1.5rem;
  border-radius: 9999px;
  background: #0f172a;
  color: #ffffff;
  font-size: 0.9rem;
  font-weight: 600;
  box-shadow: 0 10px 24px -12px rgb(15 23 42 / 0.6);
  transition: transform 200ms ease, box-shadow 200ms ease;
}

@media (min-width: 860px) {
  .landing-ft__cta {
    align-self: auto;
  }
}

.landing-ft__cta:hover {
  transform: translateY(-2px);
  box-shadow: 0 16px 30px -12px rgb(15 23 42 / 0.6);
}

.landing-ft__grid {
  display: grid;
  gap: 0.9rem;
}

@media (min-width: 560px) {
  .landing-ft__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (min-width: 960px) {
  .landing-ft__grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 1.1rem;
  }
}

.landing-ft__tile {
  --tone: 20 63 141;
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  height: 100%;
  padding: 1.35rem 1.35rem 1.4rem;
  border-radius: 1.25rem;
  background: #ffffff;
  border: 1px solid rgb(15 23 42 / 0.08);
  box-shadow: 0 1px 3px rgb(15 23 42 / 0.04);
  overflow: hidden;
  transition:
    transform 280ms cubic-bezier(0.22, 1, 0.36, 1),
    box-shadow 280ms ease,
    border-color 280ms ease;
}

.landing-ft__tile::before {
  content: '';
  position: absolute;
  inset: auto -30% -60% auto;
  width: 70%;
  aspect-ratio: 1;
  border-radius: 9999px;
  background: radial-gradient(circle, rgb(var(--tone) / 0.14), transparent 70%);
  opacity: 0;
  transition: opacity 280ms ease;
  pointer-events: none;
}

.landing-ft__tile:hover,
.landing-ft__tile:focus-visible {
  transform: translateY(-4px);
  border-color: rgb(var(--tone) / 0.3);
  box-shadow: 0 22px 44px -22px rgb(var(--tone) / 0.45);
}

.landing-ft__tile:hover::before,
.landing-ft__tile:focus-visible::before {
  opacity: 1;
}

.landing-ft__tile:focus-visible {
  outline: 2px solid rgb(var(--tone));
  outline-offset: 2px;
}

.landing-ft__tile--teal {
  --tone: 27 42 107;
}

.landing-ft__tile--violet {
  --tone: 91 127 224;
}

.landing-ft__tile--amber {
  --tone: 47 95 184;
}

.landing-ft__tile--soon {
  border-style: dashed;
  border-color: rgb(47 95 184 / 0.35);
  background:
    repeating-linear-gradient(135deg, transparent 0 10px, rgb(72 118 199 / 0.04) 10px 20px),
    #ffffff;
}

.landing-ft__icon {
  display: grid;
  place-items: center;
  width: 2.5rem;
  height: 2.5rem;
  margin-bottom: 0.35rem;
  border-radius: 0.8rem;
  background: rgb(var(--tone) / 0.1);
  color: rgb(var(--tone));
  transition: transform 280ms ease;
}

.landing-ft__tile:hover .landing-ft__icon {
  transform: rotate(-6deg) scale(1.08);
}

.landing-ft__tile-title {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1rem;
  font-weight: 700;
  color: #0f172a;
}

.landing-ft__soon {
  padding: 0.12rem 0.45rem;
  border-radius: 9999px;
  background: rgb(72 118 199 / 0.15);
  color: #143f8d;
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.landing-ft__tile-desc {
  font-size: 0.85rem;
  line-height: 1.5;
  color: #64748b;
}

.landing-ft__arrow {
  position: absolute;
  top: 1.3rem;
  right: 1.3rem;
  width: 1.1rem;
  height: 1.1rem;
  color: rgb(var(--tone));
  opacity: 0;
  transform: translate(-4px, 4px);
  transition: opacity 240ms ease, transform 240ms ease;
}

.landing-ft__tile:hover .landing-ft__arrow,
.landing-ft__tile:focus-visible .landing-ft__arrow {
  opacity: 1;
  transform: none;
}

html.dark .landing-ft {
  background: #080808;
}

html.dark .landing-ft__eyebrow {
  background: rgb(112 144 240 / 0.12);
  color: #a9bcf5;
}

html.dark .landing-ft__title,
html.dark .landing-ft__tile-title {
  color: #ffffff;
}

html.dark .landing-ft__accent {
  background-image: linear-gradient(90deg, #a9bcf5, #c7d5f0);
}

html.dark .landing-ft__lede {
  color: rgb(255 255 255 / 0.7);
}

html.dark .landing-ft__tile-desc {
  color: rgb(255 255 255 / 0.55);
}

html.dark .landing-ft__cta {
  background: #ffffff;
  color: #0f172a;
}

html.dark .landing-ft__tile {
  background: #161616;
  border-color: rgb(255 255 255 / 0.08);
}

html.dark .landing-ft__tile--soon {
  border-color: rgb(72 118 199 / 0.35);
  background:
    repeating-linear-gradient(135deg, transparent 0 10px, rgb(72 118 199 / 0.05) 10px 20px),
    #161616;
}

html.dark .landing-ft__tile--navy {
  --tone: 112 144 240;
}

html.dark .landing-ft__tile--violet {
  --tone: 169 188 245;
}

html.dark .landing-ft__tile--teal {
  --tone: 110 148 214;
}

html.dark .landing-ft__tile--amber {
  --tone: 154 181 227;
}

html.dark .landing-ft__soon {
  color: #a9bcf5;
}

@media (prefers-reduced-motion: reduce) {
  .landing-ft__tile,
  .landing-ft__icon,
  .landing-ft__arrow,
  .landing-ft__cta {
    transition: none;
  }

  .landing-ft__tile:hover {
    transform: none;
  }
}
</style>
