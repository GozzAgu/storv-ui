<template>
  <section
    id="security"
    data-section-id="security-teaser"
    class="landing-sec scroll-animate scroll-animate-up scroll-mt-[4.75rem] lg:scroll-mt-28"
    aria-labelledby="landing-sec-title"
  >
    <div class="landing-sec__panel">
      <div class="landing-sec__grid-bg" aria-hidden="true" />

      <div class="landing-sec__shield" aria-hidden="true">
        <span class="landing-sec__ring landing-sec__ring--1" />
        <span class="landing-sec__ring landing-sec__ring--2" />
        <span class="landing-sec__ring landing-sec__ring--3" />
        <span class="landing-sec__shield-core">
          <ShieldCheckIcon class="h-9 w-9" />
        </span>
      </div>

      <div class="landing-sec__body">
        <p class="landing-sec__eyebrow">
          <LockClosedIcon class="h-3.5 w-3.5" aria-hidden="true" />
          Peace of mind
        </p>
        <h2 id="landing-sec-title" class="landing-sec__title">
          Your business data deserves protection.
        </h2>
        <p class="landing-sec__lede">
          Secure authentication, role-based permissions, and cloud infrastructure, built for retail
          teams who cannot afford downtime or data loss.
        </p>

        <ul class="landing-sec__pillars">
          <li v-for="pillar in pillars" :key="pillar.title" class="landing-sec__pillar">
            <span class="landing-sec__pillar-icon">
              <component :is="pillar.icon" class="h-4 w-4" aria-hidden="true" />
            </span>
            <span>
              <span class="landing-sec__pillar-title">{{ pillar.title }}</span>
              <span class="landing-sec__pillar-desc">{{ pillar.description }}</span>
            </span>
          </li>
        </ul>

        <NuxtLink to="/security" class="landing-sec__cta">
          Read our security overview
          <ArrowRightIcon class="h-4 w-4" aria-hidden="true" />
        </NuxtLink>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import {
  ArrowRightIcon,
  CloudArrowUpIcon,
  FingerPrintIcon,
  LockClosedIcon,
  ShieldCheckIcon,
  UserGroupIcon,
} from '~/utils/app-icons'

const pillars = [
  {
    title: 'Safe when you sign in',
    description: 'Secure authentication for every account.',
    icon: FingerPrintIcon,
  },
  {
    title: 'Each person sees what they need',
    description: 'Roles for owners, managers, and staff.',
    icon: UserGroupIcon,
  },
  {
    title: 'Built to stay online',
    description: 'Cloud infrastructure your shop can rely on.',
    icon: CloudArrowUpIcon,
  },
] as const
</script>

<style scoped>
.landing-sec {
  padding: clamp(3rem, 7vw, 5.5rem) 1.25rem;
  background: #f5f5f7;
}

.landing-sec__panel {
  position: relative;
  overflow: hidden;
  max-width: 68rem;
  margin: 0 auto;
  display: grid;
  gap: 2.5rem;
  align-items: center;
  padding: clamp(2rem, 5vw, 3.5rem);
  border-radius: 2rem;
  background: linear-gradient(150deg, #0f1f47 0%, #143f8d 55%, #1b2a6b 100%);
  color: #ffffff;
  box-shadow: 0 40px 80px -40px rgb(20 63 141 / 0.6);
}

@media (min-width: 860px) {
  .landing-sec__panel {
    grid-template-columns: 16rem minmax(0, 1fr);
    gap: 3.5rem;
  }
}

.landing-sec__grid-bg {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgb(255 255 255 / 0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgb(255 255 255 / 0.05) 1px, transparent 1px);
  background-size: 36px 36px;
  mask-image: radial-gradient(ellipse 60% 80% at 20% 50%, #000 20%, transparent 75%);
  -webkit-mask-image: radial-gradient(ellipse 60% 80% at 20% 50%, #000 20%, transparent 75%);
  pointer-events: none;
}

.landing-sec__shield {
  position: relative;
  display: grid;
  place-items: center;
  width: 12rem;
  height: 12rem;
  margin: 0 auto;
}

.landing-sec__ring {
  position: absolute;
  inset: 0;
  border-radius: 9999px;
  border: 1px solid rgb(169 188 245 / 0.35);
  animation: landing-sec-pulse 3.6s ease-out infinite;
}

.landing-sec__ring--2 {
  animation-delay: 1.2s;
}

.landing-sec__ring--3 {
  animation-delay: 2.4s;
}

@keyframes landing-sec-pulse {
  0% {
    transform: scale(0.45);
    opacity: 0.9;
  }
  100% {
    transform: scale(1.15);
    opacity: 0;
  }
}

.landing-sec__shield-core {
  position: relative;
  display: grid;
  place-items: center;
  width: 5.5rem;
  height: 5.5rem;
  border-radius: 1.75rem;
  background: linear-gradient(145deg, #ffffff, #e9eff8);
  color: #143f8d;
  box-shadow:
    0 0 0 8px rgb(255 255 255 / 0.08),
    0 20px 40px -12px rgb(0 0 0 / 0.5);
}

.landing-sec__body {
  position: relative;
}

.landing-sec__eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.35rem 0.8rem;
  border-radius: 9999px;
  background: rgb(255 255 255 / 0.1);
  color: #c7d5f0;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.landing-sec__title {
  margin-top: 0.9rem;
  font-size: clamp(1.6rem, 3.4vw, 2.35rem);
  font-weight: 800;
  letter-spacing: -0.03em;
  line-height: 1.12;
  color: #ffffff;
}

.landing-sec__lede {
  margin-top: 0.8rem;
  max-width: 36rem;
  font-size: 1rem;
  line-height: 1.6;
  color: rgb(255 255 255 / 0.75);
}

.landing-sec__pillars {
  margin-top: 1.6rem;
  display: grid;
  gap: 0.75rem;
}

@media (min-width: 640px) {
  .landing-sec__pillars {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

.landing-sec__pillar {
  display: flex;
  align-items: flex-start;
  gap: 0.7rem;
  padding: 0.9rem;
  border-radius: 1rem;
  background: rgb(255 255 255 / 0.07);
  box-shadow: inset 0 0 0 1px rgb(255 255 255 / 0.1);
  transition: background-color 240ms ease, transform 240ms ease;
}

.landing-sec__pillar:hover {
  background: rgb(255 255 255 / 0.12);
  transform: translateY(-2px);
}

.landing-sec__pillar-icon {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 2rem;
  height: 2rem;
  border-radius: 0.65rem;
  background: rgb(169 188 245 / 0.18);
  color: #c7d5f0;
}

.landing-sec__pillar-title {
  display: block;
  font-size: 0.85rem;
  font-weight: 700;
  line-height: 1.3;
  color: #ffffff;
}

.landing-sec__pillar-desc {
  display: block;
  margin-top: 0.2rem;
  font-size: 0.78rem;
  line-height: 1.4;
  color: rgb(255 255 255 / 0.6);
}

.landing-sec__cta {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 1.75rem;
  padding: 0.8rem 1.4rem;
  border-radius: 9999px;
  background: #ffffff;
  color: #0f172a;
  font-size: 0.9rem;
  font-weight: 600;
  transition: transform 200ms ease, box-shadow 200ms ease;
}

.landing-sec__cta:hover {
  transform: translateY(-2px);
  box-shadow: 0 14px 28px -12px rgb(0 0 0 / 0.5);
}

html.dark .landing-sec {
  background: #080808;
}

html.dark .landing-sec__panel {
  background: linear-gradient(150deg, #0b1330 0%, #11295c 55%, #0f1f47 100%);
  box-shadow: 0 0 0 1px rgb(255 255 255 / 0.06);
}

@media (prefers-reduced-motion: reduce) {
  .landing-sec__ring {
    animation: none;
    opacity: 0.35;
  }

  .landing-sec__ring--1 {
    transform: scale(0.6);
  }

  .landing-sec__ring--2 {
    transform: scale(0.8);
  }

  .landing-sec__pillar,
  .landing-sec__cta {
    transition: none;
  }
}
</style>
