<template>
  <section
    id="faq"
    data-section-id="faq"
    class="scroll-animate scroll-animate-up scroll-mt-[4.75rem] bg-[#f5f7f9] py-16 dark:bg-slate-900/55 lg:scroll-mt-28 lg:py-20 sm:py-20"
  >
    <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
      <p
        class="text-xs sm:text-[0.8125rem] uppercase tracking-[0.16em] font-semibold text-gray-600 dark:text-gray-300 text-center"
      >
        Resources
      </p>
      <h2
        class="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100 text-center"
      >
        Quick answers
      </h2>
      <p class="mt-2 text-center text-base text-gray-600 dark:text-gray-300">
        Setup, plans, and how Storvv fits your store.
      </p>
      <div class="mt-8 space-y-3">
        <div
          v-for="(item, index) in faqItems"
          :key="item.question"
          :data-section-id="`faq-${index + 1}`"
          class="scroll-animate scroll-animate-scale rounded-xl bg-white/55 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/40 overflow-hidden"
          :class="`stagger-${index + 1}`"
        >
          <button
            type="button"
            class="w-full p-4 sm:p-5 flex items-center gap-3 sm:gap-4 text-left group"
            @click="toggleFaq(index)"
          >
            <div
              class="shrink-0 flex h-8 w-8 items-center justify-center rounded-md bg-white/70 backdrop-blur-sm dark:border-white/10 dark:bg-white/[0.08]"
            >
              <component :is="item.icon" class="w-4 h-4 text-gray-500 shrink-0" stroke-width="1.5" />
            </div>
            <div class="flex-1 min-w-0">
              <h3 class="text-sm sm:text-base font-semibold text-gray-900 dark:text-gray-50 pr-8">
                {{ item.question }}
              </h3>
            </div>
            <ChevronUpIcon
              :class="[
                'w-4 h-4 text-gray-400 shrink-0 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none',
                openFaqItems.has(index) ? 'rotate-180' : '',
              ]"
            />
          </button>
          <div
            class="grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none"
            :class="openFaqItems.has(index) ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'"
          >
            <div class="min-h-0 overflow-hidden">
              <div class="px-4 sm:px-5 pb-4 sm:pb-5">
                <div class="pl-11 sm:pl-12">
                  <p
                    class="text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed"
                    v-html="item.answer"
                  />
                </div>
              </div>
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
    question: 'How quickly can I get started?',
    answer:
      'Most stores are up and running within minutes. Create your store profile, set up your first inventory folder, and you are ready to sell. No coding required.',
    icon: ClockIcon,
  },
  {
    question: 'Can I manage multiple stores?',
    answer:
      'Yes. Medium and Enterprise plans support multiple branches. Each store has its own inventory and receipts, managed from one dashboard.',
    icon: BuildingStorefrontIcon,
  },
  {
    question: 'What are the plan differences?',
    answer:
      '<strong>Micro (free):</strong> One store, up to 2 staff, full inventory and sales.<br><br><strong>Medium:</strong> Two stores, analytics, activity logs, and customer balances.<br><br><strong>Enterprise:</strong> Unlimited stores, stock transfers, copy-from-branch, and stock loans.',
    icon: SparklesIcon,
  },
  {
    question: 'Is my data secure?',
    answer:
      'Storvv uses secure authentication, role-based permissions, and encrypted cloud infrastructure. Your business data stays private.',
    icon: ShieldCheckIcon,
  },
  {
    question: 'Can I try before signing up?',
    answer:
      'Yes. Open the interactive demo with sample multi-branch data. No account required.',
    icon: RocketLaunchIcon,
  },
]
</script>
