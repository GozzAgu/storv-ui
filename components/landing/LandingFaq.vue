<template>
  <section
    data-section-id="faq"
    class="lfaq scroll-animate scroll-animate-up"
    aria-labelledby="lfaq-title"
  >
    <span id="faq" class="lfaq__anchor scroll-mt-[4.75rem] lg:scroll-mt-28" aria-hidden="true" />
    <div class="lfaq__wrap">
      <header class="lfaq__head">
        <p class="lfaq__eyebrow">
          <MessageCircleQuestion class="h-3.5 w-3.5" aria-hidden="true" />
          Quick answers
        </p>
        <h2 id="lfaq-title" class="lfaq__title">
          Questions shop owners <span class="lfaq__accent">ask us first</span>
        </h2>
        <p class="lfaq__lede">Setup, plans, and what Storvv actually includes today.</p>
      </header>

      <ul class="lfaq__list">
        <li
          v-for="(item, i) in faqItems"
          :key="item.question"
          :data-section-id="`faq-${i + 1}`"
          class="lfaq__item"
          :class="{ 'lfaq__item--open': openFaq === i }"
        >
          <button
            type="button"
            class="lfaq__q"
            :aria-expanded="openFaq === i"
            :aria-controls="`lfaq-${i}`"
            @click="openFaq = openFaq === i ? null : i"
          >
            <span class="lfaq__icon">
              <component :is="item.icon" class="h-4 w-4" aria-hidden="true" />
            </span>
            <span class="lfaq__q-text">{{ item.question }}</span>
            <span v-if="item.soon" class="lfaq__soon">Coming soon</span>
            <ChevronDown class="lfaq__chevron" aria-hidden="true" />
          </button>
          <div :id="`lfaq-${i}`" class="lfaq__a" role="region">
            <div class="lfaq__a-inner">
              <p v-html="item.answer" />
            </div>
          </div>
        </li>
      </ul>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { Component } from 'vue'
import {
  ChevronDown,
  CreditCard,
  LayoutTemplate,
  Layers,
  MessageCircleQuestion,
  PlayCircle,
  Smartphone,
  Sparkles,
  Store,
} from '@lucide/vue'

const openFaq = ref<number | null>(0)

const faqItems: Array<{ question: string; answer: string; icon: Component; soon?: boolean }> = [
  {
    question: 'What does every plan include?',
    answer:
      'Every plan includes inventory and sales, receipts, returns, customers, the Help center, and Storvv Assistant. Micro is free for one store with up to 2 staff, 1 department, and 10 WhatsApp receipt sends per month. At signup you pick a <strong>Solo</strong> or <strong>Business</strong> workspace, which is separate from your plan.',
    icon: Sparkles,
  },
  {
    question: 'What are Micro, Medium, and Enterprise?',
    answer:
      '<strong>Micro (free):</strong> 1 store with core inventory and sales.<br><br><strong>Medium:</strong> up to 2 stores, analytics, sales leads, activity logs, customer balances, and unlimited WhatsApp receipts.<br><br><strong>Enterprise:</strong> unlimited stores, stock transfers, copy-from-branch, stock loans, and priority support. See the full comparison on the <a href="/pricing">pricing page</a>.',
    icon: Layers,
  },
  {
    question: 'What is Solo vs Business workspace?',
    answer:
      '<strong>Solo</strong> is a focused layout for owners who run the shop themselves. <strong>Business</strong> shows the full team navigation. You can switch any time in Settings, and it does not change your plan.',
    icon: LayoutTemplate,
  },
  {
    question: 'Can I use Storvv on my phone?',
    answer:
      'Yes. Open app.storvv.com in your phone browser today. Native iOS and Android apps are coming soon, with the same login and store data.',
    icon: Smartphone,
  },
  {
    question: 'What is Storefront?',
    answer:
      'Storefront will be a guest catalogue built from your inventory: share a link or QR code, and shoppers can browse, enquire, or reserve while you confirm sales in the dashboard. It is not available yet; we will announce it when it launches.',
    icon: Store,
    soon: true,
  },
  {
    question: 'Do you support payment links and remote sales?',
    answer:
      'Payment links for remote invoices are on the way, alongside Storefront. Today you can record any sale in the dashboard, including split payments, and share the receipt by WhatsApp, email, or PDF.',
    icon: CreditCard,
    soon: true,
  },
  {
    question: 'Can I try before signing up?',
    answer:
      'Yes. Open the <a href="/demo/dashboard">interactive demo</a> with fictional sample data in your browser. No account required.',
    icon: PlayCircle,
  },
]
</script>

<style scoped>
.lfaq {
  position: relative;
  padding: clamp(4rem, 8vw, 6.5rem) 1.25rem;
  background: #f5f5f7;
}

.lfaq__anchor {
  position: absolute;
  top: 0;
  left: 0;
}

.lfaq__wrap {
  max-width: 50rem;
  margin: 0 auto;
}

.lfaq__head {
  text-align: center;
}

.lfaq__eyebrow {
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

.lfaq__title {
  margin-top: 0.9rem;
  font-size: clamp(1.75rem, 3.6vw, 2.5rem);
  font-weight: 800;
  letter-spacing: -0.03em;
  line-height: 1.1;
  color: #0f172a;
}

.lfaq__accent {
  background: linear-gradient(90deg, #143f8d, #5b7fe0);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.lfaq__lede {
  margin-top: 0.9rem;
  font-size: 1rem;
  line-height: 1.65;
  color: #475569;
}

.lfaq__list {
  margin-top: 2.25rem;
  display: grid;
  gap: 0.65rem;
}

.lfaq__item {
  border-radius: 1.25rem;
  background: #ffffff;
  border: 1px solid rgb(15 23 42 / 0.08);
  transition: box-shadow 260ms ease, border-color 260ms ease;
}

.lfaq__item--open {
  border-color: rgb(20 63 141 / 0.25);
  box-shadow: 0 20px 40px -26px rgb(20 63 141 / 0.45);
}

.lfaq__q {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  width: 100%;
  padding: 1.1rem 1.25rem;
  text-align: left;
}

.lfaq__icon {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 2.1rem;
  height: 2.1rem;
  border-radius: 0.7rem;
  background: rgb(20 63 141 / 0.08);
  color: #143f8d;
  transition: background-color 260ms ease, color 260ms ease;
}

.lfaq__item--open .lfaq__icon {
  background: #143f8d;
  color: #ffffff;
}

.lfaq__q-text {
  flex: 1;
  font-size: 0.95rem;
  font-weight: 700;
  color: #0f172a;
}

.lfaq__soon {
  flex-shrink: 0;
  padding: 0.2rem 0.55rem;
  border-radius: 9999px;
  border: 1px dashed rgb(91 127 224 / 0.6);
  color: #143f8d;
  font-size: 0.68rem;
  font-weight: 700;
}

.lfaq__chevron {
  flex-shrink: 0;
  width: 1.1rem;
  height: 1.1rem;
  color: #64748b;
  transition: transform 260ms ease;
}

.lfaq__item--open .lfaq__chevron {
  transform: rotate(180deg);
}

.lfaq__a {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 320ms cubic-bezier(0.22, 1, 0.36, 1);
}

.lfaq__item--open .lfaq__a {
  grid-template-rows: 1fr;
}

.lfaq__a-inner {
  overflow: hidden;
}

.lfaq__a-inner p {
  padding: 0 1.25rem 1.2rem 4.2rem;
  font-size: 0.9rem;
  line-height: 1.65;
  color: #475569;
}

.lfaq__a-inner :deep(a) {
  font-weight: 600;
  color: #143f8d;
  text-decoration: underline;
  text-underline-offset: 3px;
}

.lfaq__a-inner :deep(strong) {
  color: #0f172a;
}

@media (max-width: 520px) {
  .lfaq__a-inner p {
    padding-left: 1.25rem;
  }

  .lfaq__soon {
    display: none;
  }
}

html.dark .lfaq {
  background: #080808;
}

html.dark .lfaq__eyebrow {
  background: rgb(112 144 240 / 0.14);
  color: #a9bcf5;
}

html.dark .lfaq__title,
html.dark .lfaq__q-text,
html.dark .lfaq__a-inner :deep(strong) {
  color: #ffffff;
}

html.dark .lfaq__accent {
  background-image: linear-gradient(90deg, #a9bcf5, #7090f0);
}

html.dark .lfaq__lede,
html.dark .lfaq__a-inner p {
  color: rgb(255 255 255 / 0.7);
}

html.dark .lfaq__item {
  background: #161616;
  border-color: rgb(255 255 255 / 0.08);
}

html.dark .lfaq__item--open {
  border-color: rgb(112 144 240 / 0.35);
  box-shadow: 0 20px 40px -26px rgb(0 0 0 / 0.8);
}

html.dark .lfaq__icon {
  background: rgb(112 144 240 / 0.14);
  color: #a9bcf5;
}

html.dark .lfaq__item--open .lfaq__icon {
  background: #4876c7;
  color: #ffffff;
}

html.dark .lfaq__soon {
  color: #a9bcf5;
  border-color: rgb(169 188 245 / 0.5);
}

html.dark .lfaq__a-inner :deep(a) {
  color: #a9bcf5;
}

@media (prefers-reduced-motion: reduce) {
  .lfaq__a,
  .lfaq__chevron,
  .lfaq__item,
  .lfaq__icon {
    transition: none;
  }
}
</style>
