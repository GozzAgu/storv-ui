<template>
  <section class="mk-section" :aria-labelledby="titleId">
    <div class="mk-container">
      <div class="mk-cta mk-reveal">
        <div class="mk-cta__copy">
          <h2 :id="titleId" class="mk-h2">
            {{ title }}
            <span v-if="accent" class="mk-accent">{{ accent }}</span>
          </h2>
          <p v-if="lede" class="mk-lede">{{ lede }}</p>
          <div class="mk-actions">
            <NuxtLink :to="primary.to" class="mk-cta__btn mk-cta__btn--primary" data-mk-primary>
              {{ primary.label }}
              <ArrowRight :size="16" aria-hidden="true" />
            </NuxtLink>
            <NuxtLink v-if="secondary" :to="secondary.to" class="mk-cta__link">
              or {{ secondary.label.charAt(0).toLowerCase() + secondary.label.slice(1) }}
            </NuxtLink>
          </div>
          <ul class="mk-cta__notes" aria-label="Good to know">
            <li><Check :size="14" aria-hidden="true" />Free forever for one store</li>
            <li><Check :size="14" aria-hidden="true" />No card needed</li>
            <li><Check :size="14" aria-hidden="true" />Cancel any time</li>
          </ul>
        </div>
        <div class="mk-cta__shot" aria-hidden="true">
          <img
            src="/marketing/app/sales.webp"
            alt=""
            width="1440"
            height="900"
            loading="lazy"
            decoding="async"
          />
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useId } from 'vue'
import { ArrowRight, Check } from '@lucide/vue'

defineProps<{
  title: string
  /** Last words of the title, shown on a second, softer line. */
  accent?: string
  lede?: string
  primary: { label: string; to: string }
  secondary?: { label: string; to: string }
}>()

const titleId = useId()
</script>
