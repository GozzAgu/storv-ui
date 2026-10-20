<template>
  <section class="mk-section mks" aria-labelledby="mk-setup-title">
    <div class="mk-container">
      <div class="mks__panel">
        <MkSectionHead
          title-id="mk-setup-title"
          eyebrow="Get started"
          title="Ready before"
          accent="your next customer."
        />

        <ol class="mks__steps" aria-label="Setup steps">
          <li v-for="(step, i) in steps" :key="step.id">
            <button
              type="button"
              class="mks__step"
              :class="{ 'is-active': active === i, 'is-done': i < active }"
              :aria-current="active === i ? 'step' : undefined"
              @click="go(i)"
            >
              <Check v-if="i < active" :size="14" aria-hidden="true" />
              <component :is="step.icon" v-else :size="14" aria-hidden="true" />
              {{ step.title }}
              <span class="mks__track" aria-hidden="true">
                <span
                  v-if="active === i"
                  :key="cycle"
                  class="mks__fill"
                  :class="{ 'is-paused': paused }"
                  @animationend="advance"
                />
              </span>
            </button>
          </li>
        </ol>

        <div class="mks__window mk-reveal" @mouseenter="paused = true" @mouseleave="paused = false">
          <Transition name="mks-swap" mode="out-in">
            <div :key="current.id" class="mks__info">
              <span class="mks__icon"><component :is="current.icon" :size="20" /></span>
              <h3 class="mks__title">{{ current.title }}</h3>
              <p class="mks__text">{{ current.text }}</p>
              <span class="mks__time"
                ><Clock :size="14" aria-hidden="true" />Step {{ active + 1 }} of 3 ·
                {{ current.time }}</span
              >
            </div>
          </Transition>

          <div class="mks__cta">
            <NuxtLink :to="signupUrl" class="mk-link mks__btn">
              Create your store
              <ArrowRight :size="16" aria-hidden="true" />
            </NuxtLink>
            <span class="mks__total"><Timer :size="16" aria-hidden="true" />About 10 minutes</span>
          </div>

          <div class="mks__main mks__main--shot">
            <Transition name="mks-swap" mode="out-in">
              <MkFrame
                :key="current.id"
                class="mks__frame"
                :src="current.shot"
                :alt="current.alt"
                :url="current.url"
              />
            </Transition>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { ArrowRight, Boxes, Check, Clock, ReceiptText, Store, Timer } from '@lucide/vue'
import MkFrame from '~/components/marketing/MkFrame.vue'
import MkSectionHead from '~/components/marketing/MkSectionHead.vue'
import { useMarketingSignupUrl } from '~/composables/useMarketingSite'

const signupUrl = useMarketingSignupUrl()

const steps = [
  {
    id: 'store',
    icon: Store,
    title: 'Create your store',
    time: '1 min',
    text: 'Name it. Micro is free forever, no card.',
    shot: '/marketing/app/overview.webp',
    url: 'app.storvv.com/dashboard',
    alt: 'Storvv dashboard after creating a store',
  },
  {
    id: 'stock',
    icon: Boxes,
    title: 'Add your stock',
    time: '5 min',
    text: 'Type it in or import a spreadsheet.',
    shot: '/marketing/app/inventory.webp',
    url: 'app.storvv.com/inventory',
    alt: 'Storvv inventory with categories and stock counts',
  },
  {
    id: 'sell',
    icon: ReceiptText,
    title: 'Start selling',
    time: 'Instant',
    text: 'Ring one up. Stock and reports move with you.',
    shot: '/marketing/app/sales.webp',
    url: 'app.storvv.com/sales',
    alt: 'Storvv sales screen with recent receipts',
  },
]

const active = ref(0)
const cycle = ref(0)
const current = computed(() => steps[active.value]!)
const paused = ref(false)

function go(i: number) {
  active.value = i
  cycle.value += 1
}

function advance() {
  go((active.value + 1) % steps.length)
}
</script>
