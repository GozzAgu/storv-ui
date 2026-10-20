<template>
  <section id="product" class="mk-section mkb" aria-labelledby="mkb-title">
    <div class="mk-container">
      <div class="mkb__band">
        <MkSectionHead
          title-id="mkb-title"
          eyebrow="Built for retail"
          title="Made for the way"
          accent="Nigerian shops sell."
        />

        <ul class="mkb__grid">
          <li v-for="item in items" :key="item.title" class="mkb__item">
            <span class="mkb__icon">
              <component :is="item.icon" :size="22" :stroke-width="1.75" aria-hidden="true" />
            </span>
            <h3 class="mkb__title">{{ item.title }}</h3>
            <p class="mkb__text">{{ item.text }}</p>
          </li>
        </ul>

        <div class="mkb__more">
          <NuxtLink to="/features" class="mk-pill-link">See every feature</NuxtLink>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { Building2, HandCoins, MessageCircle, Repeat, ShieldCheck, WifiOff } from '@lucide/vue'
import MkSectionHead from '~/components/marketing/MkSectionHead.vue'

const items = [
  {
    icon: WifiOff,
    title: 'Keeps selling offline',
    text: "Sales made without internet are saved on the device and recorded when you're back online.",
  },
  {
    icon: MessageCircle,
    title: 'Receipts on WhatsApp',
    text: "Send the receipt to the customer's WhatsApp, or share it as a PDF.",
  },
  {
    icon: HandCoins,
    title: 'Part payments and balances',
    text: 'Take deposits, record each payment and see who still owes you.',
  },
  {
    icon: Repeat,
    title: 'Trade-ins and buybacks',
    text: 'Take a device in, grade and price it, and put it back on sale.',
  },
  {
    icon: Building2,
    title: 'Every branch, one login',
    text: 'Switch branch in a tap and compare how each one is selling.',
  },
  {
    icon: ShieldCheck,
    title: 'Staff roles',
    text: 'Decide who can edit stock, give discounts or see reports.',
  },
]
</script>
