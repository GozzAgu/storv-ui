<template>
  <section
    data-section-id="pricing-teaser"
    class="landing-plans scroll-animate scroll-animate-up"
    aria-labelledby="landing-plans-title"
  >
    <!-- Anchor lives on an empty marker: global CSS styles every `#pricing` descendant. -->
    <span id="pricing" class="landing-plans__anchor scroll-mt-[4.75rem] lg:scroll-mt-28" aria-hidden="true" />
    <div class="landing-plans__glow" aria-hidden="true" />

    <div class="landing-plans__inner">
      <header class="landing-plans__head">
        <p class="landing-plans__eyebrow">
          <SparklesIcon class="h-3.5 w-3.5" aria-hidden="true" />
          Plans that scale
        </p>
        <h2 id="landing-plans-title" class="landing-plans__title">
          Start free. <span class="landing-plans__title-accent">Upgrade only when you outgrow it.</span>
        </h2>
        <p class="landing-plans__lede">
          Pick the plan that fits your shop today. Prices on the pricing page match your region
          automatically.
        </p>
      </header>

      <div class="landing-plans__picker" role="radiogroup" aria-label="How many stores do you run?">
        <span class="landing-plans__picker-label">How many stores do you run?</span>
        <div class="landing-plans__picker-track">
          <span
            class="landing-plans__picker-thumb"
            :style="{ transform: `translateX(${storeOptions.findIndex((o) => o.plan === selected) * 100}%)` }"
            aria-hidden="true"
          />
          <button
            v-for="option in storeOptions"
            :key="option.plan"
            type="button"
            role="radio"
            class="landing-plans__picker-option"
            :class="{ 'landing-plans__picker-option--active': selected === option.plan }"
            :aria-checked="picked === option.plan"
            @click="picked = option.plan"
          >
            {{ option.label }}
          </button>
        </div>
      </div>

      <div class="landing-plans__grid">
        <div class="landing-plans__path" aria-hidden="true">
          <span
            class="landing-plans__path-fill"
            :style="{ width: `${(plans.findIndex((p) => p.id === selected) / (plans.length - 1)) * 100}%` }"
          />
        </div>

        <article
          v-for="(plan, index) in plans"
          :key="plan.id"
          class="landing-plans__card"
          :class="[
            `landing-plans__card--${plan.id}`,
            { 'landing-plans__card--match': selected === plan.id },
          ]"
          @mouseenter="hovered = plan.id"
          @mouseleave="hovered = null"
          @focusin="hovered = plan.id"
          @focusout="hovered = null"
        >
          <span class="landing-plans__step" aria-hidden="true">{{ index + 1 }}</span>
          <span v-if="plan.badge" class="landing-plans__badge">{{ plan.badge }}</span>
          <span v-if="selected === plan.id" class="landing-plans__match">Best fit for you</span>

          <div class="landing-plans__card-head">
            <span class="landing-plans__icon">
              <component :is="plan.icon" class="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h3 class="landing-plans__name">{{ plan.name }}</h3>
              <p class="landing-plans__for">{{ plan.forWho }}</p>
            </div>
          </div>

          <p class="landing-plans__price">
            <span class="landing-plans__price-main">{{ plan.price }}</span>
            <span class="landing-plans__price-sub">{{ plan.priceNote }}</span>
          </p>

          <ul class="landing-plans__features">
            <li v-for="feature in plan.features" :key="feature" class="landing-plans__feature">
              <CheckIcon class="landing-plans__check" aria-hidden="true" />
              {{ feature }}
            </li>
          </ul>
        </article>
      </div>

      <div class="landing-plans__actions">
        <NuxtLink to="/pricing" class="landing-plans__cta">
          See full pricing & compare plans
          <ArrowRightIcon class="h-4 w-4" aria-hidden="true" />
        </NuxtLink>
        <NuxtLink to="/demo/dashboard" class="landing-plans__cta landing-plans__cta--ghost">
          Try demo
        </NuxtLink>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  ArrowRightIcon,
  BuildingOffice2Icon,
  BuildingStorefrontIcon,
  CheckIcon,
  RocketLaunchIcon,
  SparklesIcon,
} from '~/utils/app-icons'

type PlanId = 'micro' | 'medium' | 'enterprise'

const plans = [
  {
    id: 'micro',
    name: 'Micro',
    forWho: 'Solo shops getting organised',
    icon: BuildingStorefrontIcon,
    price: 'Free',
    priceNote: 'forever · 1 store',
    badge: null,
    features: ['Inventory & categories', 'Wizard and Quick Sale checkout', 'Receipts by WhatsApp, email, or PDF', 'Web dashboard, mobile apps soon'],
  },
  {
    id: 'medium',
    name: 'Medium',
    forWho: 'Growing shops opening a second branch',
    icon: RocketLaunchIcon,
    price: 'Up to 2',
    priceNote: 'stores',
    badge: 'Recommended',
    features: ['Everything in Micro', 'Analytics & exports', 'Sales leads pipeline', 'Activity logs'],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    forWho: 'Multi-branch retail teams',
    icon: BuildingOffice2Icon,
    price: 'Unlimited',
    priceNote: 'stores',
    badge: null,
    features: ['Everything in Medium', 'Stock transfers between branches', 'Stock loans', 'Copy categories from branch'],
  },
] as const

const storeOptions: { label: string; plan: PlanId }[] = [
  { label: '1 store', plan: 'micro' },
  { label: '2 stores', plan: 'medium' },
  { label: '3+ stores', plan: 'enterprise' },
]

const picked = ref<PlanId>('medium')
const hovered = ref<PlanId | null>(null)
const selected = computed<PlanId>(() => hovered.value ?? picked.value)
</script>

<style scoped>
.landing-plans {
  position: relative;
  overflow: hidden;
  padding: clamp(4rem, 9vw, 7rem) 1.25rem;
  background: #ffffff;
}

.landing-plans__anchor {
  position: absolute;
  top: 0;
  left: 0;
  width: 1px;
  height: 1px;
}

.landing-plans__glow {
  position: absolute;
  inset: -20% -10% auto;
  height: 70%;
  background:
    radial-gradient(40% 60% at 25% 30%, rgb(20 63 141 / 0.1), transparent 70%),
    radial-gradient(35% 55% at 78% 25%, rgb(91 127 224 / 0.08), transparent 70%);
  pointer-events: none;
}

.landing-plans__inner {
  position: relative;
  max-width: 68rem;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
}

.landing-plans__head {
  max-width: 40rem;
  text-align: center;
}

.landing-plans__eyebrow {
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

.landing-plans__title {
  margin-top: 1rem;
  font-size: clamp(1.75rem, 4vw, 2.75rem);
  font-weight: 800;
  letter-spacing: -0.03em;
  line-height: 1.1;
  color: #0f172a;
}

.landing-plans__title-accent {
  background: linear-gradient(90deg, #143f8d, #5b7fe0);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.landing-plans__lede {
  margin-top: 0.9rem;
  font-size: 1rem;
  line-height: 1.6;
  color: #475569;
}

/* Store-count picker */
.landing-plans__picker {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.6rem;
}

.landing-plans__picker-label {
  font-size: 0.8125rem;
  font-weight: 600;
  color: #334155;
}

.landing-plans__picker-track {
  position: relative;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  padding: 0.3rem;
  border-radius: 9999px;
  background: #f1f4f9;
  box-shadow: inset 0 0 0 1px rgb(15 23 42 / 0.06);
}

.landing-plans__picker-thumb {
  position: absolute;
  top: 0.3rem;
  bottom: 0.3rem;
  left: 0.3rem;
  width: calc((100% - 0.6rem) / 3);
  border-radius: 9999px;
  background: #0f172a;
  box-shadow: 0 6px 16px -6px rgb(15 23 42 / 0.5);
  transition: transform 320ms cubic-bezier(0.22, 1, 0.36, 1);
}

.landing-plans__picker-option {
  position: relative;
  z-index: 1;
  padding: 0.55rem 1.15rem;
  border-radius: 9999px;
  font-size: 0.8125rem;
  font-weight: 600;
  white-space: nowrap;
  color: #475569;
  transition: color 200ms ease;
}

.landing-plans__picker-option--active {
  color: #ffffff;
}

.landing-plans__picker-option:focus-visible {
  outline: 2px solid #143f8d;
  outline-offset: 2px;
}

/* Cards */
.landing-plans__grid {
  position: relative;
  display: grid;
  gap: 1rem;
  width: 100%;
}

@media (min-width: 860px) {
  .landing-plans__grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 1.25rem;
    padding-top: 1.25rem;
  }
}

.landing-plans__path {
  display: none;
}

@media (min-width: 860px) {
  .landing-plans__path {
    display: block;
    position: absolute;
    top: 1.25rem;
    left: calc(100% / 6);
    right: calc(100% / 6);
    height: 2px;
    border-radius: 9999px;
    background: rgb(15 23 42 / 0.08);
  }

  .landing-plans__path-fill {
    display: block;
    height: 100%;
    border-radius: inherit;
    background: linear-gradient(90deg, #143f8d, #5b7fe0);
    transition: width 420ms cubic-bezier(0.22, 1, 0.36, 1);
  }
}

.landing-plans__card {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
  padding: 1.75rem 1.5rem 1.5rem;
  border-radius: 1.5rem;
  background: #ffffff;
  border: 1px solid rgb(15 23 42 / 0.1);
  box-shadow: 0 2px 6px rgb(15 23 42 / 0.04);
  text-align: left;
  transition:
    transform 320ms cubic-bezier(0.22, 1, 0.36, 1),
    box-shadow 320ms ease,
    border-color 320ms ease;
}

.landing-plans__card--match {
  transform: translateY(-6px);
  border-color: rgb(20 63 141 / 0.35);
  box-shadow:
    0 0 0 4px rgb(20 63 141 / 0.08),
    0 28px 60px -24px rgb(20 63 141 / 0.45);
}

.landing-plans__card--medium {
  background: linear-gradient(160deg, #143f8d 0%, #1e2a5e 55%, #0c2c66 100%);
  border-color: transparent;
  color: #ffffff;
}

.landing-plans__card--medium.landing-plans__card--match {
  box-shadow:
    0 0 0 4px rgb(91 127 224 / 0.18),
    0 32px 70px -24px rgb(12 44 102 / 0.6);
}

.landing-plans__step {
  position: absolute;
  top: -0.8rem;
  left: 1.5rem;
  display: grid;
  place-items: center;
  width: 1.6rem;
  height: 1.6rem;
  border-radius: 9999px;
  background: #ffffff;
  border: 2px solid rgb(15 23 42 / 0.12);
  font-size: 0.72rem;
  font-weight: 800;
  color: #64748b;
  transition: all 320ms ease;
}

.landing-plans__card--match .landing-plans__step {
  background: #143f8d;
  border-color: #143f8d;
  color: #ffffff;
}

.landing-plans__badge {
  position: absolute;
  top: 1.25rem;
  right: 1.25rem;
  padding: 0.25rem 0.6rem;
  border-radius: 9999px;
  background: rgb(255 255 255 / 0.16);
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #ffffff;
}

.landing-plans__match {
  position: absolute;
  top: -0.7rem;
  right: 1.25rem;
  padding: 0.2rem 0.6rem;
  border-radius: 9999px;
  background: #10b981;
  font-size: 0.68rem;
  font-weight: 700;
  color: #ffffff;
  box-shadow: 0 6px 14px -6px rgb(16 185 129 / 0.7);
  animation: landing-plans-pop 360ms cubic-bezier(0.22, 1, 0.36, 1);
}

@keyframes landing-plans-pop {
  from {
    opacity: 0;
    transform: translateY(4px) scale(0.9);
  }
}

.landing-plans__card-head {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  padding-right: 5.5rem;
}

.landing-plans__icon {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 2.6rem;
  height: 2.6rem;
  border-radius: 0.85rem;
  background: rgb(20 63 141 / 0.08);
  color: #143f8d;
  transition: transform 320ms ease;
}

.landing-plans__card--match .landing-plans__icon {
  transform: rotate(-6deg) scale(1.06);
}

.landing-plans__card--medium .landing-plans__icon {
  background: rgb(255 255 255 / 0.14);
  color: #ffffff;
}

.landing-plans__card--enterprise .landing-plans__icon {
  background: rgb(91 127 224 / 0.1);
  color: #5b7fe0;
}

.landing-plans__name {
  font-size: 1.125rem;
  font-weight: 800;
  color: #0f172a;
}

.landing-plans__for {
  margin-top: 0.1rem;
  font-size: 0.8rem;
  line-height: 1.35;
  color: #64748b;
}

.landing-plans__card--medium .landing-plans__name {
  color: #ffffff;
}

.landing-plans__card--medium .landing-plans__for {
  color: rgb(255 255 255 / 0.7);
}

.landing-plans__price {
  display: flex;
  align-items: baseline;
  gap: 0.4rem;
  padding-bottom: 1.1rem;
  border-bottom: 1px dashed rgb(15 23 42 / 0.12);
}

.landing-plans__card--medium .landing-plans__price {
  border-bottom-color: rgb(255 255 255 / 0.2);
}

.landing-plans__price-main {
  font-size: 2rem;
  font-weight: 800;
  letter-spacing: -0.03em;
  color: #0f172a;
}

.landing-plans__price-sub {
  font-size: 0.85rem;
  font-weight: 600;
  color: #64748b;
}

.landing-plans__card--medium .landing-plans__price-main {
  color: #ffffff;
}

.landing-plans__card--medium .landing-plans__price-sub {
  color: rgb(255 255 255 / 0.7);
}

.landing-plans__features {
  display: grid;
  gap: 0.6rem;
}

.landing-plans__feature {
  display: flex;
  align-items: flex-start;
  gap: 0.55rem;
  font-size: 0.875rem;
  line-height: 1.4;
  color: #334155;
}

.landing-plans__check {
  flex-shrink: 0;
  width: 1.1rem;
  height: 1.1rem;
  margin-top: 0.05rem;
  padding: 0.18rem;
  border-radius: 9999px;
  background: rgb(16 185 129 / 0.12);
  color: #059669;
  stroke-width: 3;
}

.landing-plans__card--medium .landing-plans__feature {
  color: rgb(255 255 255 / 0.9);
}

.landing-plans__card--medium .landing-plans__check {
  background: rgb(255 255 255 / 0.18);
  color: #ffffff;
}

/* Actions */
.landing-plans__actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.75rem;
}

.landing-plans__cta {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.85rem 1.6rem;
  border-radius: 9999px;
  background: #0f172a;
  color: #ffffff;
  font-size: 0.9rem;
  font-weight: 600;
  box-shadow: 0 10px 24px -12px rgb(15 23 42 / 0.6);
  transition:
    transform 200ms ease,
    box-shadow 200ms ease;
}

.landing-plans__cta:hover {
  transform: translateY(-2px);
  box-shadow: 0 16px 30px -12px rgb(15 23 42 / 0.6);
}

.landing-plans__cta--ghost {
  background: #ffffff;
  color: #0f172a;
  box-shadow: inset 0 0 0 1px rgb(15 23 42 / 0.15);
}

.landing-plans__cta--ghost:hover {
  box-shadow: inset 0 0 0 1px rgb(15 23 42 / 0.3);
}

/* Dark */
html.dark .landing-plans {
  background: #0d0d0d;
}

html.dark .landing-plans__glow {
  background:
    radial-gradient(40% 60% at 25% 30%, rgb(91 127 224 / 0.12), transparent 70%),
    radial-gradient(35% 55% at 78% 25%, rgb(91 127 224 / 0.12), transparent 70%);
}

html.dark .landing-plans__eyebrow {
  background: rgb(112 144 240 / 0.12);
  color: #a9bcf5;
}

html.dark .landing-plans__title,
html.dark .landing-plans__name,
html.dark .landing-plans__price-main {
  color: #ffffff;
}

html.dark .landing-plans__title-accent {
  background-image: linear-gradient(90deg, #a9bcf5, #c7d5f0);
}

html.dark .landing-plans__lede,
html.dark .landing-plans__picker-label,
html.dark .landing-plans__feature {
  color: rgb(255 255 255 / 0.72);
}

html.dark .landing-plans__picker-track {
  background: #1a1a1a;
  box-shadow: inset 0 0 0 1px rgb(255 255 255 / 0.08);
}

html.dark .landing-plans__picker-thumb {
  background: #ffffff;
}

html.dark .landing-plans__picker-option {
  color: rgb(255 255 255 / 0.65);
}

html.dark .landing-plans__picker-option--active {
  color: #0f172a;
}

html.dark .landing-plans__path {
  background: rgb(255 255 255 / 0.1);
}

html.dark .landing-plans__card:not(.landing-plans__card--medium) {
  background: #161616;
  border-color: rgb(255 255 255 / 0.08);
}

html.dark .landing-plans__card--match:not(.landing-plans__card--medium) {
  border-color: rgb(169 188 245 / 0.4);
  box-shadow:
    0 0 0 4px rgb(169 188 245 / 0.08),
    0 28px 60px -24px rgb(0 0 0 / 0.8);
}

html.dark .landing-plans__step {
  background: #161616;
  border-color: rgb(255 255 255 / 0.15);
  color: rgb(255 255 255 / 0.6);
}

html.dark .landing-plans__card--match .landing-plans__step {
  background: #4876c7;
  border-color: #4876c7;
  color: #ffffff;
}

html.dark .landing-plans__for,
html.dark .landing-plans__price-sub {
  color: rgb(255 255 255 / 0.55);
}

html.dark .landing-plans__price {
  border-bottom-color: rgb(255 255 255 / 0.1);
}

html.dark .landing-plans__icon {
  background: rgb(112 144 240 / 0.12);
  color: #a9bcf5;
}

html.dark .landing-plans__card--enterprise .landing-plans__icon {
  background: rgb(169 188 245 / 0.14);
  color: #c7d5f0;
}

html.dark .landing-plans__cta {
  background: #ffffff;
  color: #0f172a;
}

html.dark .landing-plans__cta--ghost {
  background: transparent;
  color: #ffffff;
  box-shadow: inset 0 0 0 1px rgb(255 255 255 / 0.2);
}

@media (prefers-reduced-motion: reduce) {
  .landing-plans__card,
  .landing-plans__picker-thumb,
  .landing-plans__path-fill,
  .landing-plans__icon,
  .landing-plans__cta {
    transition: none;
  }

  .landing-plans__card--match {
    transform: none;
  }

  .landing-plans__match {
    animation: none;
  }
}
</style>
