<template>
  <section
    id="problem-solution"
    data-section-id="problem-solution"
    class="landing-ps scroll-animate scroll-animate-up"
    aria-labelledby="landing-ps-title"
  >
    <div class="landing-ps__inner">
      <header class="landing-ps__header">
        <p class="landing-label landing-label--blue">Sound familiar?</p>
        <h2 id="landing-ps-title" class="landing-ps__title">
          Solving your retail
          <span class="landing-ps__title-accent">chaos</span>,
          one shop floor at a time.
        </h2>
        <p class="landing-ps__lede">
          Spreadsheets, WhatsApp stock-checks, and paper receipts don't scale past your first
          branch. Storvv replaces the chaos with one calm workspace - so you stop chasing numbers
          and start growing.
        </p>
      </header>

      <div class="landing-ps__compare">
        <article class="landing-ps__card landing-ps__card--before" data-section-id="ps-before">
          <span class="landing-ps__tag landing-ps__tag--before">Without Storvv</span>
          <img
            src="/marketing/illustrations/pain-point-before.png"
            alt="An exhausted shop owner surrounded by unlabeled boxes, a lamp, and scattered belongings."
            class="landing-ps__img"
            loading="lazy"
            width="900"
            height="600"
          />
          <ul class="landing-ps__points">
            <li v-for="p in beforePoints" :key="p">{{ p }}</li>
          </ul>
        </article>

        <div class="landing-ps__arrow" aria-hidden="true">
          <ArrowRightIcon class="h-5 w-5" />
        </div>

        <article class="landing-ps__card landing-ps__card--after" data-section-id="ps-after">
          <span class="landing-ps__tag landing-ps__tag--after">With Storvv</span>
          <img
            src="/marketing/illustrations/pain-point-after.png"
            alt="A calm warehouse worker holding one labeled box beside neatly organized, evenly stocked shelves."
            class="landing-ps__img landing-ps__img--after"
            loading="lazy"
            width="640"
            height="596"
          />
          <ul class="landing-ps__points landing-ps__points--after">
            <li v-for="p in afterPoints" :key="p">{{ p }}</li>
          </ul>
        </article>
      </div>

      <div class="landing-ps__marquee" role="note" aria-label="Everything included in Storvv">
        <div class="landing-ps__marquee-track">
          <span
            v-for="(feature, i) in marqueeFeatures"
            :key="`m1-${i}`"
            class="landing-ps__pill"
            >{{ feature }}</span
          >
          <span
            v-for="(feature, i) in marqueeFeatures"
            :key="`m2-${i}`"
            class="landing-ps__pill"
            aria-hidden="true"
            >{{ feature }}</span
          >
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ArrowRightIcon } from '~/utils/app-icons'

const beforePoints = [
  'Stock counts live across three different WhatsApp groups',
  'Receipts scribbled on paper - or not written at all',
  'No idea which branch is actually making money',
  'One shared login, no record of who changed what',
] as const

const afterPoints = [
  'Every category, subcategory, and item in one place',
  'Receipts sent by WhatsApp, email, or PDF in a tap',
  'Live revenue and stock health per branch, on one screen',
  'Roles for owners, managers, and staff - with an audit trail',
] as const

const marqueeFeatures = [
  'Inventory categories',
  'Quick Sale',
  'Payment links',
  'Sales leads',
  'Customer buybacks',
  'WhatsApp receipts',
  'Analytics & exports',
  'Multi-store sync',
  'Stock loans',
  'Roles & departments',
  'Storvv Assistant',
  'iOS native app',
] as const
</script>

<style scoped>
.landing-ps {
  padding: clamp(4rem, 9vw, 7rem) 1.25rem;
  background: #f5f5f7;
  overflow: hidden;
}

.landing-ps__inner {
  max-width: 72rem;
  margin: 0 auto;
}

.landing-ps__header {
  max-width: 40rem;
}

.landing-ps .landing-label {
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--storvv-blue-light, rgb(26 21 35 / 0.55));
}

.landing-ps__title {
  margin-top: 0.5rem;
  font-size: clamp(1.75rem, 3.6vw, 2.5rem);
  font-weight: 800;
  letter-spacing: -0.02em;
  line-height: 1.15;
  color: var(--landing-section-heading, #0f172a);
}

.landing-ps__title-accent {
  color: #4876c7;
}

.landing-ps__lede {
  margin-top: 0.85rem;
  max-width: 38rem;
  font-size: 0.9375rem;
  line-height: 1.65;
  color: var(--landing-section-body, #334155);
}

.landing-ps__compare {
  margin-top: 2.75rem;
  display: grid;
  gap: 1.25rem;
  align-items: stretch;
}

@media (min-width: 900px) {
  .landing-ps__compare {
    grid-template-columns: 1fr auto 1fr;
    gap: 1.5rem;
  }
}

.landing-ps__arrow {
  display: none;
}

@media (min-width: 900px) {
  .landing-ps__arrow {
    display: flex;
    align-items: center;
    justify-content: center;
    align-self: center;
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 9999px;
    background: #ffffff;
    color: rgb(26 21 35 / 0.5);
  }
}

.landing-ps__card {
  border-radius: 1.5rem;
  border: 0;
  background: #ffffff;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  transition: transform 220ms ease-out;
}

@media (hover: hover) and (pointer: fine) {
  .landing-ps__card:hover {
    transform: translateY(-2px);
  }
}

.landing-ps__tag {
  align-self: flex-start;
  display: inline-flex;
  padding: 0.3rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.6875rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.landing-ps__tag--before {
  background: rgb(26 21 35 / 0.06);
  color: rgb(26 21 35 / 0.6);
}

.landing-ps__tag--after {
  background: rgb(72 118 199 / 0.12);
  color: #1a1523;
}

.landing-ps__img {
  margin-top: 1.1rem;
  width: 100%;
  height: auto;
  border-radius: 1rem;
  object-fit: contain;
  background: #ffffff;
}

.landing-ps__img--after {
  max-width: 15rem;
  margin-left: auto;
  margin-right: auto;
}

.landing-ps__points {
  margin-top: 1.35rem;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  font-size: 0.875rem;
  line-height: 1.5;
  color: var(--landing-section-body, #475569);
}

.landing-ps__points li {
  position: relative;
  padding-left: 1.15rem;
}

.landing-ps__points li::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0.5em;
  width: 0.4rem;
  height: 0.4rem;
  border-radius: 9999px;
  background: rgb(26 21 35 / 0.28);
}

.landing-ps__points--after li::before {
  background: #4876c7;
}

/* ── Feature marquee ── */
.landing-ps__marquee {
  margin-top: 3rem;
  overflow: hidden;
  mask-image: linear-gradient(90deg, transparent, #000 6%, #000 94%, transparent);
  -webkit-mask-image: linear-gradient(90deg, transparent, #000 6%, #000 94%, transparent);
}

.landing-ps__marquee-track {
  display: flex;
  width: max-content;
  gap: 0.625rem;
  animation: landing-ps-scroll 34s linear infinite;
}

.landing-ps__marquee:hover .landing-ps__marquee-track {
  animation-play-state: paused;
}

.landing-ps__pill {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  padding: 0.55rem 1.1rem;
  border-radius: 9999px;
  background: #ffffff;
  color: rgb(26 21 35 / 0.7);
  font-size: 0.8125rem;
  font-weight: 600;
  white-space: nowrap;
}

@keyframes landing-ps-scroll {
  from {
    transform: translateX(0);
  }
  to {
    transform: translateX(-50%);
  }
}

@media (prefers-reduced-motion: reduce) {
  .landing-ps__marquee-track {
    animation: none;
  }
}

html.dark .landing-ps {
  background: #080808;
}

html.dark .landing-ps__card,
html.dark .landing-ps__pill,
html.dark .landing-ps__arrow {
  background: #1e1e1e;
}

html.dark .landing-ps__tag--before {
  background: rgb(255 255 255 / 0.08);
  color: rgb(255 255 255 / 0.65);
}

html.dark .landing-ps__tag--after {
  background: rgb(72 118 199 / 0.2);
  color: #ffffff;
}

html.dark .landing-ps__pill {
  color: rgb(255 255 255 / 0.75);
}

html.dark .landing-ps__points li::before {
  background: rgb(255 255 255 / 0.3);
}
</style>
