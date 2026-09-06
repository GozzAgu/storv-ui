<template>
  <section
    id="faq"
    data-section-id="faq"
    class="landing-faq scroll-animate scroll-animate-up scroll-mt-[4.75rem] lg:scroll-mt-28"
  >
    <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
      <p class="landing-faq__eyebrow">Resources</p>
      <h2 class="landing-faq__title">Quick answers</h2>
      <p class="landing-faq__lede">Setup, plans, and what Storvv actually includes today.</p>
      <div class="landing-faq__list">
        <div
          v-for="(item, index) in faqItems"
          :key="item.question"
          :data-section-id="`faq-${index + 1}`"
          class="landing-faq__item scroll-animate scroll-animate-scale"
          :class="`stagger-${index + 1}`"
        >
          <button type="button" class="landing-faq__q" @click="toggleFaq(index)">
            <span class="landing-faq__icon">
              <component :is="item.icon" class="w-4 h-4" stroke-width="1.5" />
            </span>
            <h3 class="landing-faq__question">{{ item.question }}</h3>
            <ChevronUpIcon
              class="landing-faq__chevron"
              :class="{ 'landing-faq__chevron--open': openFaqItems.has(index) }"
            />
          </button>
          <div
            class="grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none"
            :class="openFaqItems.has(index) ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'"
          >
            <div class="min-h-0 overflow-hidden">
              <div class="landing-faq__a" v-html="item.answer" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { Component } from 'vue'
import {
  ChevronUpIcon,
  SparklesIcon,
  BuildingStorefrontIcon,
  RocketLaunchIcon,
  CreditCardIcon,
  DevicePhoneMobileIcon,
} from '~/utils/app-icons'

const openFaqItems = ref<Set<number>>(new Set())

function toggleFaq(index: number) {
  const next = new Set(openFaqItems.value)
  if (next.has(index)) next.delete(index)
  else next.add(index)
  openFaqItems.value = next
}

const faqItems: Array<{ question: string; answer: string; icon: Component }> = [
  {
    question: 'What does every plan include?',
    answer:
      'All plans include inventory and sales for one active branch (Micro: one store), receipts, returns, customers, a <strong>public storefront</strong>, Paystack payment links, Help center, and Storvv Assistant. Micro includes up to 2 staff, 1 department, and 10 WhatsApp receipt sends per month. On signup you choose <strong>Solo</strong> or <strong>Business</strong> workspace style, independent from your paid plan.',
    icon: SparklesIcon,
  },
  {
    question: 'What is Storefront?',
    answer:
      'Storefront is your guest catalogue: publish selected inventory, share a URL or QR, and let shoppers browse, enquire, or reserve. You manage requests in the dashboard and can <strong>Complete &amp; sell</strong> so a receipt is created and private stock updates. Optional online checkout via Paystack when you enable it. Payment links stay available for one-off remote invoices.',
    icon: BuildingStorefrontIcon,
  },
  {
    question: 'What are Micro, Medium, and Enterprise?',
    answer:
      '<strong>Micro (free):</strong> 1 store, core inventory and sales, storefront, payment links.<br><br><strong>Medium:</strong> 2 stores, analytics, sales leads, activity logs, customer balances, unlimited WhatsApp.<br><br><strong>Enterprise:</strong> Unlimited stores, stock transfers, copy-from-branch, stock loans, priority support. Full plan comparison is on the <a href="/pricing">pricing page</a>.',
    icon: BuildingStorefrontIcon,
  },
  {
    question: 'What is Solo vs Business workspace?',
    answer:
      '<strong>Solo</strong> is a focused owner layout; <strong>Business</strong> shows the full team navigation. Both are free to switch in Settings and independent from Micro, Medium, or Enterprise.',
    icon: SparklesIcon,
  },
  {
    question: 'Can I use Storvv on my phone?',
    answer:
      'Yes. Use the browser at app.storvv.com or the native iOS app. Same login, store data, storefront inbox, and subscription management on both.',
    icon: DevicePhoneMobileIcon,
  },
  {
    question: 'Do you support payment links and remote sales?',
    answer:
      'Yes. Create Paystack checkout links on every plan for remote invoices. Storefront covers browse-and-enquire (and optional checkout) for your whole catalogue. Dashboard and Analytics summarize both.',
    icon: CreditCardIcon,
  },
  {
    question: 'Can I try before signing up?',
    answer:
      'Yes. Open the <a href="/demo/dashboard">interactive demo</a> with fictional sample data in your browser - no account required.',
    icon: RocketLaunchIcon,
  },
]
</script>
