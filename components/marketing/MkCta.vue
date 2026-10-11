<template>
  <section class="mk-section" :aria-labelledby="titleId">
    <div class="mk-container">
      <div class="mk-cta mk-reveal">
        <span class="mk-cta__mark">
          <img
            src="/brand/storvv-symbol.png"
            alt=""
            class="mk-cta__symbol"
            width="40"
            height="40"
          />
        </span>
        <h2 :id="titleId" class="mk-h2">{{ title }}</h2>
        <p v-if="lede" class="mk-lede">{{ lede }}</p>
        <div class="mk-actions mk-actions--center">
          <SButton variant="primary" size="lg" class="mk-btn" :to="primary.to">
            {{ primary.label }}
            <template #trailing><ArrowRight :size="16" aria-hidden="true" /></template>
          </SButton>
          <SButton v-if="secondary" variant="secondary" size="lg" class="mk-btn" :to="secondary.to">
            {{ secondary.label }}
          </SButton>
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
import SButton from '~/components/s/SButton.vue'

defineProps<{
  title: string
  lede?: string
  primary: { label: string; to: string }
  secondary?: { label: string; to: string }
}>()

const titleId = useId()
</script>
