<template>
  <section
    id="security"
    data-section-id="security"
    class="landing-security scroll-animate scroll-animate-up"
    aria-labelledby="landing-security-title"
  >
    <div class="landing-security__bg" aria-hidden="true" />
    <div class="landing-security__grid landing-line-grid" aria-hidden="true" />
    <div class="landing-security__scan" aria-hidden="true" />

    <div class="landing-security__inner">
      <header class="landing-security__header">
        <div class="landing-security__badge" role="status">
          <span class="landing-security__badge-dot" aria-hidden="true" />
          <span>Your store data is looked after</span>
        </div>
        <p class="landing-label landing-label--blue">Peace of mind</p>
        <h2 id="landing-security-title" class="landing-security__title">
          Security with <span class="landing-security__title-accent">backbone</span>
        </h2>
        <p class="landing-security__lede">
          Stock, sales, and team access should feel safe without you needing a tech manual. Storvv
          is built that way from the start.
        </p>
        <ul class="landing-security__pillars" aria-label="How we keep you safe">
          <li v-for="pillar in pillars" :key="pillar">{{ pillar }}</li>
        </ul>
      </header>

      <div class="landing-security__cards">
        <article
          v-for="(item, idx) in trustCards"
          :key="item.title"
          class="landing-security__card landing-security-animate"
          :style="{ '--sec-i': idx }"
        >
          <div class="landing-security__card-top">
            <span class="landing-security__card-num">{{ item.num }}</span>
            <span class="landing-security__icon-wrap" aria-hidden="true">
              <component :is="item.icon" class="landing-security__icon" stroke-width="1.5" />
            </span>
          </div>
          <h3 class="landing-security__card-title">{{ item.title }}</h3>
          <p class="landing-security__card-desc">{{ item.description }}</p>
          <p class="landing-security__card-tag">{{ item.tag }}</p>
        </article>
      </div>

      <p class="landing-security__footer">
        <NuxtLink to="/privacy" class="landing-security__link">Privacy policy</NuxtLink>
        <span class="landing-security__footer-sep" aria-hidden="true">·</span>
        <NuxtLink to="/terms" class="landing-security__link">Terms of service</NuxtLink>
      </p>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { Component } from 'vue'
import { KeyIcon, LockClosedIcon, ShieldCheckIcon } from '@heroicons/vue/24/outline'

const pillars = [
  'Safe when you sign in',
  'Each person sees what they need',
  'Built to stay online',
] as const

const trustCards = [
  {
    num: '01',
    icon: ShieldCheckIcon as Component,
    title: 'Safe sign-in',
    description:
      'When you or your team use Storvv, your connection is private. We run the app on reliable systems so your shop can keep working.',
    tag: 'Private while you work',
  },
  {
    num: '02',
    icon: KeyIcon as Component,
    title: 'The right access for each person',
    description:
      'Owners, managers, and staff only see what their job needs. Important settings stay with the people in charge, not one shared password.',
    tag: 'No shared logins',
  },
  {
    num: '03',
    icon: LockClosedIcon as Component,
    title: 'Your store information stays yours',
    description:
      'Your sales and stock records belong to you. We use them to run Storvv for you, not to sell them on. Read more in the links below.',
    tag: 'You stay in control',
  },
] as const
</script>
