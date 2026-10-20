<template>
  <section class="mkh" aria-labelledby="home-title">
    <div class="mkh__backdrop" aria-hidden="true" />

    <div class="mk-container">
      <div class="mkh__copy">
        <NuxtLink to="/features" class="mkh__announce mkh-in" style="--i: 0">
          <span class="mkh__announce-tag">New</span>
          <span
            >Keep selling when the internet drops<span class="mkh__announce-more"
              >, it syncs when you're back</span
            ></span
          >
          <ChevronRight :size="14" aria-hidden="true" />
        </NuxtLink>

        <h1 id="home-title" class="mkh__title mkh-in" style="--i: 1">
          <span class="mkh__line">Sell and track stock</span>
          <span class="mkh__line mkh__line--soft">in every branch.</span>
        </h1>

        <p class="mkh__lede mkh-in" style="--i: 2">
          Storvv is the point of sale and inventory system for gadget stores, electronics shops,
          supermarkets and dealers. Ring up a sale and your stock, receipts and customer balances
          update at once.
        </p>

        <div class="mkh__actions mkh-in" style="--i: 3">
          <NuxtLink :to="signupUrl" class="mkh__btn" data-mk-primary
            >Create your free store</NuxtLink
          >
          <NuxtLink to="/demo/dashboard" class="mkh__demo">
            Try the live demo
            <ArrowRight :size="16" aria-hidden="true" />
          </NuxtLink>
        </div>

        <ul class="mkh__notes mkh-in" style="--i: 4" aria-label="Good to know">
          <li><Check :size="14" aria-hidden="true" />Micro is free forever</li>
          <li><Check :size="14" aria-hidden="true" />No card needed</li>
          <li><Check :size="14" aria-hidden="true" />Works in your browser</li>
        </ul>
      </div>
    </div>

    <div class="mk-container mkh__stage-wrap mkh-in" style="--i: 5">
      <div class="mkh__stage">
        <MkFrame
          src="/marketing/app/overview.webp"
          alt="The Storvv dashboard showing today's revenue, sales, top products and low-stock alerts"
          url="app.storvv.com/dashboard"
          eager
        />

        <div class="mkh__card mkh__card--sale" aria-hidden="true">
          <span class="mkh__card-icon mkh__card-icon--success"><ReceiptText :size="16" /></span>
          <span class="mkh__card-body">
            <span class="mkh__card-title">Sale completed · ₦485,000</span>
            <span class="mkh__card-text">Receipt sent on WhatsApp</span>
          </span>
        </div>

        <div class="mkh__card mkh__card--stock" aria-hidden="true">
          <span class="mkh__card-icon mkh__card-icon--warning"><PackageMinus :size="16" /></span>
          <span class="mkh__card-body">
            <span class="mkh__card-title">Low stock · AirPods Pro</span>
            <span class="mkh__card-text">2 left at Ikeja branch</span>
          </span>
        </div>
      </div>
    </div>

    <div class="mk-container">
      <div class="mkh__proof">
        <div class="mkh__proof-group">
          <p class="mkh__proof-label">Built for shops that sell</p>
          <ul class="mkh__chips">
            <li v-for="trade in trades" :key="trade.label" class="mkh__chip">
              <component :is="trade.icon" :size="16" :stroke-width="1.75" aria-hidden="true" />
              {{ trade.label }}
            </li>
          </ul>
        </div>
        <div class="mkh__proof-group">
          <p class="mkh__proof-label">Record every way you get paid</p>
          <ul class="mkh__chips">
            <li v-for="method in payments" :key="method" class="mkh__chip">{{ method }}</li>
          </ul>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import {
  ArrowRight,
  Car,
  Check,
  ChevronRight,
  PackageCheck,
  PackageMinus,
  ReceiptText,
  ShoppingBasket,
  Smartphone,
  Tv,
} from '@lucide/vue'
import MkFrame from '~/components/marketing/MkFrame.vue'
import { useMarketingSignupUrl } from '~/composables/useMarketingSite'

const signupUrl = useMarketingSignupUrl()

const trades = [
  { icon: Smartphone, label: 'Gadget stores' },
  { icon: Tv, label: 'Electronics' },
  { icon: ShoppingBasket, label: 'Supermarkets' },
  { icon: Car, label: 'Car dealers' },
  { icon: PackageCheck, label: 'Procurement' },
]

const payments = ['Cash', 'Transfer', 'Card', 'OPay', 'Moniepoint', 'Palmpay', 'USSD']
</script>
