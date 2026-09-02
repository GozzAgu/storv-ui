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
  ClockIcon,
  ChevronUpIcon,
  ShieldCheckIcon,
  SparklesIcon,
  BuildingStorefrontIcon,
  RocketLaunchIcon,
  CreditCardIcon,
  DevicePhoneMobileIcon,
  UserGroupIcon,
  ChartBarIcon,
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
      'All plans include the dashboard, full inventory and sales for one active branch (Micro limits you to one store), receipts, returns, customers, notifications, settings, profile, Help center, Storvv Assistant, and Paystack payment links. Micro includes up to 2 staff, 1 department, and 10 WhatsApp receipt sends per month. On signup you choose <strong>Solo</strong> (focused owner workspace) or <strong>Business</strong> (full team layout), independent from your paid plan.',
    icon: SparklesIcon,
  },
  {
    question: 'How quickly can I get started?',
    answer:
      'Most stores are running within minutes: create your account, complete onboarding (country, currency, first branch), add a category, and record your first sale. No coding required.',
    icon: ClockIcon,
  },
  {
    question: 'What are Micro, Medium, and Enterprise?',
    answer:
      '<strong>Micro (free):</strong> 1 store, 1 department, 2 staff, full inventory and sales, payment links, no analytics or activity logs. Upgrade anytime in Settings.<br><br><strong>Medium:</strong> 2 stores, 10 departments, 25 staff, analytics and exports, activity logs, sales leads, customer balance ledger, unlimited WhatsApp, duplicate category within a branch. Billed monthly, quarterly, or yearly through Paystack with auto-renew.<br><br><strong>Enterprise:</strong> Unlimited stores, staff, and departments; multi-store sync and stock transfers; copy-from-branch; stock loans for serial inventory; priority support. Same Paystack billing and renewal options as Medium.',
    icon: BuildingStorefrontIcon,
  },
  {
    question: 'What is Solo vs Business workspace?',
    answer:
      '<strong>Solo (Just me)</strong> is a simplified workspace for owner-operators: inventory, sales, and customers stay front and center while team, branch, and multi-store admin screens stay tucked away until you turn them on in Advanced features. <strong>Business (Growing business)</strong> shows the full Storvv navigation: staff, departments, branches, payment links, and admin tools, as your plan allows.<br><br>Both are free to switch and independent from your paid plan. Pick Solo or Business during onboarding, or change anytime in Settings. Existing accounts default to Business; new accounts choose on signup.',
    icon: SparklesIcon,
  },
  {
    question: 'How does subscription billing work?',
    answer:
      'Super admins upgrade in Settings with a live price preview for the billing cycle you choose (monthly, quarterly, or yearly). Paystack handles checkout and auto-renewal. You can view billing history, see renewal status, and cancel auto-renew anytime. If you cancel, paid features stay active until the end of the current billing period, then your account moves to Micro. Past-due payments show a billing notice in the dashboard until resolved.',
    icon: CreditCardIcon,
  },
  {
    question: 'What is workspace style vs subscription plan?',
    answer:
      'Your <strong>plan</strong> (Micro, Medium, Enterprise) controls what you pay for: branch limits, analytics, leads, transfers, and other paid features. <strong>Solo</strong> and <strong>Business</strong> workspace styles control how much navigation we show, not what you pay. You can switch between Solo and Business in Settings without changing your plan. Solo hides admin complexity until you enable it; Business shows the full workspace when your plan includes those features.',
    icon: UserGroupIcon,
  },
  {
    question: 'Can I use Storvv on my phone?',
    answer:
      'Yes. Storvv runs in the browser at app.storvv.com and as a native iOS app with bottom tabs for Home, Stock, Sales, and Analytics, plus a More menu for buybacks, leads, settings, and help. The same login, store data, Solo/Business workspace switcher, and subscription management work on web and iOS.',
    icon: DevicePhoneMobileIcon,
  },
  {
    question: 'Do you support payment links and remote sales?',
    answer:
      'Yes. All plans can create Paystack checkout links, connect payout accounts, and track link status. Dashboard and Analytics show a payment links summary. Remote customers pay online; you manage fulfillment in Sales.',
    icon: CreditCardIcon,
  },
  {
    question: 'What about buybacks, leads, and stock loans?',
    answer:
      '<strong>Customer buybacks:</strong> super admins record trade-ins that add inventory at purchase cost.<br><br><strong>Sales leads:</strong> Medium+ pipeline for enquiries before they become receipts.<br><br><strong>Stock loans:</strong> Enterprise only, for serial inventory lent to borrowers until sold or returned.',
    icon: UserGroupIcon,
  },
  {
    question: 'What analytics and reporting are included?',
    answer:
      'Analytics (Medium+) includes period summaries, feature insight cards, revenue and category charts, peak hours, traffic heatmaps, low-stock tables, and PDF/Excel export. Activity logs (Medium+) provide an audit trail of changes. Enterprise adds consolidated multi-store reporting and transfer history.',
    icon: ChartBarIcon,
  },
  {
    question: 'Is my data secure?',
    answer:
      'Storvv uses secure authentication, optional two-factor authentication, role-based permissions (super admin, manager, staff), and encrypted cloud infrastructure. The Assistant explains workflows but cannot read your live stock or sales data.',
    icon: ShieldCheckIcon,
  },
  {
    question: 'Can I try before signing up?',
    answer:
      'Yes. Open the interactive demo with fictional Enterprise sample data stored locally in your browser. Explore inventory, sales, buybacks, stock loans, analytics, and the demo Assistant without creating an account.',
    icon: RocketLaunchIcon,
  },
]
</script>
