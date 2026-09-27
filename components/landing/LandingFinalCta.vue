<template>
  <section
    id="get-started"
    data-section-id="landing-final-cta"
    class="landing-go scroll-animate scroll-animate-up"
    aria-labelledby="landing-final-cta-title"
  >
    <div class="landing-go__panel">
      <div class="landing-go__orb landing-go__orb--a" aria-hidden="true" />
      <div class="landing-go__orb landing-go__orb--b" aria-hidden="true" />
      <div class="landing-go__grid-bg" aria-hidden="true" />

      <div class="landing-go__content">
        <p class="landing-go__eyebrow">
          <span class="landing-go__live" aria-hidden="true" />
          Free forever on Micro
        </p>
        <h2 id="landing-final-cta-title" class="landing-go__title">
          Ready to simplify your <span class="landing-go__accent">retail business?</span>
        </h2>
        <p class="landing-go__lede">
          Set up your shop in minutes. Track stock, ring up sales, and see what's selling, right
          from your browser.
        </p>

        <div class="landing-go__actions">
          <a :href="appUrl" class="landing-go__cta">
            Start free
            <ArrowRightIcon class="landing-go__cta-arrow" aria-hidden="true" />
          </a>
          <NuxtLink to="/demo/dashboard" class="landing-go__cta landing-go__cta--ghost">
            Try demo
          </NuxtLink>
        </div>

        <ul class="landing-go__proof">
          <li v-for="point in proofPoints" :key="point.label">
            <span v-if="point.soon" class="landing-go__soon-dot" aria-hidden="true" />
            <CheckIcon v-else class="landing-go__check" aria-hidden="true" />
            {{ point.label }}
          </li>
        </ul>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ArrowRightIcon, CheckIcon } from '~/utils/app-icons'

defineProps<{
  appUrl: string
}>()

const proofPoints = [
  { label: '1 store free, forever', soon: false },
  { label: 'Upgrade only when you grow', soon: false },
  { label: 'iOS & Android apps coming soon', soon: true },
]
</script>

<style scoped>
.landing-go {
  padding: clamp(3.5rem, 8vw, 6rem) 1.25rem;
  background: #f5f5f7;
}

.landing-go__panel {
  position: relative;
  overflow: hidden;
  max-width: 68rem;
  margin: 0 auto;
  padding: clamp(3rem, 7vw, 5rem) clamp(1.5rem, 5vw, 4rem);
  border-radius: 2rem;
  background: #0b1020;
  text-align: center;
  box-shadow: 0 40px 90px -40px rgb(20 63 141 / 0.7);
}

.landing-go__orb {
  position: absolute;
  width: 28rem;
  aspect-ratio: 1;
  border-radius: 9999px;
  filter: blur(60px);
  opacity: 0.55;
  pointer-events: none;
  animation: landing-go-drift 14s ease-in-out infinite alternate;
}

.landing-go__orb--a {
  top: -45%;
  left: -10%;
  background: radial-gradient(circle, #143f8d, transparent 65%);
}

.landing-go__orb--b {
  bottom: -55%;
  right: -12%;
  background: radial-gradient(circle, #5b7fe0, transparent 65%);
  animation-delay: -7s;
}

@keyframes landing-go-drift {
  to {
    transform: translate(8%, 10%) scale(1.1);
  }
}

.landing-go__grid-bg {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgb(255 255 255 / 0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgb(255 255 255 / 0.05) 1px, transparent 1px);
  background-size: 44px 44px;
  mask-image: radial-gradient(ellipse 70% 70% at 50% 50%, #000 10%, transparent 75%);
  -webkit-mask-image: radial-gradient(ellipse 70% 70% at 50% 50%, #000 10%, transparent 75%);
  pointer-events: none;
}

.landing-go__content {
  position: relative;
  max-width: 40rem;
  margin: 0 auto;
}

.landing-go__eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 0.9rem;
  border-radius: 9999px;
  background: rgb(255 255 255 / 0.08);
  box-shadow: inset 0 0 0 1px rgb(255 255 255 / 0.12);
  color: rgb(255 255 255 / 0.85);
  font-size: 0.78rem;
  font-weight: 600;
}

.landing-go__live {
  position: relative;
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 9999px;
  background: #34d399;
}

.landing-go__live::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: #34d399;
  animation: landing-go-ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;
}

@keyframes landing-go-ping {
  75%,
  100% {
    transform: scale(2.4);
    opacity: 0;
  }
}

.landing-go__title {
  margin-top: 1.1rem;
  font-size: clamp(2rem, 5vw, 3.25rem);
  font-weight: 800;
  letter-spacing: -0.035em;
  line-height: 1.05;
  color: #ffffff;
}

.landing-go__accent {
  background: linear-gradient(90deg, #a9bcf5, #c7d5f0, #a9bcf5);
  background-size: 200% auto;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  animation: landing-go-shine 6s linear infinite;
}

@keyframes landing-go-shine {
  to {
    background-position: 200% center;
  }
}

.landing-go__lede {
  margin: 1rem auto 0;
  max-width: 32rem;
  font-size: 1.0625rem;
  line-height: 1.6;
  color: rgb(255 255 255 / 0.7);
}

.landing-go__actions {
  margin-top: 2rem;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.75rem;
}

.landing-go__cta {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.95rem 1.8rem;
  border-radius: 9999px;
  background: #ffffff;
  color: #0f172a;
  font-size: 0.95rem;
  font-weight: 700;
  box-shadow: 0 12px 30px -10px rgb(169 188 245 / 0.55);
  transition: transform 200ms ease, box-shadow 200ms ease;
}

.landing-go__cta:hover {
  transform: translateY(-2px);
  box-shadow: 0 18px 40px -10px rgb(169 188 245 / 0.7);
}

.landing-go__cta-arrow {
  width: 1rem;
  height: 1rem;
  transition: transform 200ms ease;
}

.landing-go__cta:hover .landing-go__cta-arrow {
  transform: translateX(3px);
}

.landing-go__cta--ghost {
  background: rgb(255 255 255 / 0.06);
  color: #ffffff;
  box-shadow: inset 0 0 0 1px rgb(255 255 255 / 0.25);
}

.landing-go__cta--ghost:hover {
  background: rgb(255 255 255 / 0.12);
  box-shadow: inset 0 0 0 1px rgb(255 255 255 / 0.4);
}

.landing-go__proof {
  margin-top: 1.75rem;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.6rem 1.5rem;
  font-size: 0.85rem;
  color: rgb(255 255 255 / 0.7);
}

.landing-go__proof li {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
}

.landing-go__check {
  width: 1rem;
  height: 1rem;
  padding: 0.15rem;
  border-radius: 9999px;
  background: rgb(52 211 153 / 0.18);
  color: #34d399;
  stroke-width: 3;
}

.landing-go__soon-dot {
  width: 0.5rem;
  height: 0.5rem;
  margin: 0 0.25rem;
  border-radius: 9999px;
  background: #a9bcf5;
  box-shadow: 0 0 0 3px rgb(154 181 227 / 0.2);
}

html.dark .landing-go {
  background: #080808;
}

html.dark .landing-go__panel {
  box-shadow: 0 0 0 1px rgb(255 255 255 / 0.06);
}

@media (prefers-reduced-motion: reduce) {
  .landing-go__orb,
  .landing-go__accent,
  .landing-go__live::after {
    animation: none;
  }

  .landing-go__cta,
  .landing-go__cta-arrow {
    transition: none;
  }
}
</style>
