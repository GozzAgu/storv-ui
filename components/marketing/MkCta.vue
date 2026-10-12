<template>
  <section class="mk-section" :aria-labelledby="titleId">
    <div class="mk-container">
      <div class="mk-cta mk-reveal">
        <span class="mk-cta__ring" aria-hidden="true" />
        <span class="mk-cta__mark">
          <img
            src="/brand/storvv-symbol.png"
            alt=""
            class="mk-cta__symbol"
            width="40"
            height="40"
          />
        </span>
        <h2 :id="titleId" class="mk-h2">
          {{ title }}
          <span v-if="accent" class="mk-accent">{{ accent }}</span>
        </h2>
        <p v-if="lede" class="mk-lede">{{ lede }}</p>
        <div class="mk-actions mk-actions--center">
          <NuxtLink :to="primary.to" class="mk-cta__btn mk-cta__btn--primary">
            {{ primary.label }}
            <ArrowRight :size="16" aria-hidden="true" />
          </NuxtLink>
          <NuxtLink v-if="secondary" :to="secondary.to" class="mk-cta__btn mk-cta__btn--glass">
            {{ secondary.label }}
          </NuxtLink>
        </div>
        <ul class="mk-cta__notes" aria-label="Good to know">
          <li><Check :size="14" aria-hidden="true" />Free forever for one store</li>
          <li><Check :size="14" aria-hidden="true" />No card needed</li>
          <li><Check :size="14" aria-hidden="true" />Cancel any time</li>
        </ul>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useId } from 'vue'
import { ArrowRight, Check } from '@lucide/vue'

defineProps<{
  title: string
  /** Last words of the title, set in the italic serif accent. */
  accent?: string
  lede?: string
  primary: { label: string; to: string }
  secondary?: { label: string; to: string }
}>()

const titleId = useId()
</script>
