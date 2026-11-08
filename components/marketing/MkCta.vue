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
          <div class="mk-actions mk-actions--center">
            <NuxtLink :to="primary.to" class="mk-cta-btn" data-mk-primary>
              {{ primary.label }}
            </NuxtLink>
            <NuxtLink v-if="secondary" :to="secondary.to" class="mk-cta__link">
              or {{ secondary.label.charAt(0).toLowerCase() + secondary.label.slice(1) }}
            </NuxtLink>
          </div>
          <p v-if="walkthrough" class="mk-walk">
            Prefer a guided tour?
            <button type="button" class="mk-walk__btn" @click="openWalkthrough('landing_cta')">
              <CalendarDays :size="16" aria-hidden="true" />
              Book a walkthrough
            </button>
          </p>
          <p class="mk-cta__note">Free forever for one store · No card needed · Cancel any time</p>
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
import { CalendarDays } from '@lucide/vue'
import { useWalkthrough } from '~/composables/useWalkthrough'

defineProps<{
  title: string
  /** Last words of the title, shown on a second, softer line. */
  accent?: string
  lede?: string
  primary: { label: string; to: string }
  secondary?: { label: string; to: string }
  /** Adds "Prefer a guided tour? Book a walkthrough" under the actions. */
  walkthrough?: boolean
}>()

const { open: openWalkthrough } = useWalkthrough()

const titleId = useId()
</script>
