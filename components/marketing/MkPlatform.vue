<template>
  <section id="product" class="mk-section mk-section--alt" aria-labelledby="mk-platform-title">
    <div class="mk-container">
      <div class="mk-platform-head">
        <MkSectionHead
          title-id="mk-platform-title"
          align="start"
          eyebrow="The platform"
          title="Everything the counter needs."
          accent="Nothing it doesn't."
          lede="Stock, sales, customers and reports in one place. Every answer is a tap away."
        >
          <NuxtLink to="/features" class="mk-link">
            See every feature
            <ArrowRight :size="16" aria-hidden="true" />
          </NuxtLink>
        </MkSectionHead>

        <figure class="mk-platform-head__visual mk-reveal">
          <img
            class="mk-platform-head__photo"
            src="/marketing/platform-surprise.webp"
            alt="A shop owner with her hands raised to her cheeks in surprise, surrounded by blue question marks"
            width="1024"
            height="1024"
            loading="lazy"
            decoding="async"
          />
          <ul class="mk-floats" aria-hidden="true">
            <li class="mk-float mk-float--ask-stock">
              <span class="mk-float__title">Where did that stock go?</span>
            </li>
            <li class="mk-float mk-float--ask-owed">
              <span class="mk-float__title">Who still owes me?</span>
            </li>
            <li class="mk-float mk-float--inverse mk-float--answer">
              <span class="mk-float__icon mk-float__icon--success"><Check :size="18" /></span>
              <span class="mk-float__body">
                <span class="mk-float__title">Answered in Storvv</span>
                <span class="mk-float__text">Stock, sales and balances, live</span>
              </span>
            </li>
          </ul>
        </figure>
      </div>

      <!-- How it connects -->
      <div class="mk-flow mk-reveal">
        <h3 class="mk-flow__title">One sale. Everything updates.</h3>
        <ol class="mk-flow__steps">
          <li v-for="step in flow" :key="step.label" class="mk-flow__step">
            <component :is="step.icon" :size="16" aria-hidden="true" />
            <span>
              <span class="mk-flow__label">{{ step.label }}</span>
              <span class="mk-flow__value">{{ step.value }}</span>
            </span>
          </li>
        </ol>
        <SButton variant="secondary" class="mk-btn mk-btn--compact" to="/demo/dashboard">
          Try the live demo
          <template #trailing><ArrowRight :size="16" aria-hidden="true" /></template>
        </SButton>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ArrowRight, BarChart3, Boxes, Check, ReceiptText, UsersRound } from '@lucide/vue'
import SButton from '~/components/s/SButton.vue'
import MkSectionHead from '~/components/marketing/MkSectionHead.vue'

const flow = [
  { icon: ReceiptText, label: 'Sale', value: '₦25,000' },
  { icon: Boxes, label: 'Stock', value: '−1 unit' },
  { icon: UsersRound, label: 'Customer', value: '+1 visit' },
  { icon: BarChart3, label: 'Report', value: '+₦25,000' },
]
</script>
