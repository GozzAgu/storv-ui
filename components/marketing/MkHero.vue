<template>
  <section class="mkh" aria-labelledby="home-title">
    <div class="mk-container">
      <div class="mkh__copy">
        <NuxtLink to="/features" class="mkh__announce mkh-in" style="--i: 0">
          Keep selling when the internet drops
          <ChevronRight :size="14" aria-hidden="true" />
        </NuxtLink>

        <h1 id="home-title" class="mkh__title mkh-in" style="--i: 1">
          <span class="mkh__line">Sell and track stock</span>
          <span class="mkh__line mkh__line--soft">in every branch.</span>
        </h1>

        <p class="mkh__lede mkh-in" style="--i: 2">
          The point of sale and inventory system for gadget stores, electronics shops, supermarkets
          and dealers. Ring up a sale and your stock, receipts and customer balances update at once.
        </p>

        <div class="mkh__actions mkh-in" style="--i: 3">
          <NuxtLink :to="signupUrl" class="mk-cta-btn" data-mk-primary>
            Create your free store
          </NuxtLink>
          <NuxtLink to="/demo/dashboard" class="mkh__demo">or try the live demo</NuxtLink>
        </div>
      </div>

      <div class="mkh__stage mkh-in" style="--i: 4">
        <MkFrame
          src="/marketing/app/overview.webp"
          alt="The Storvv dashboard showing today's revenue, sales, top products and low-stock alerts"
          url="app.storvv.com/dashboard"
          eager
        />
      </div>

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
import { Car, ChevronRight, PackageCheck, ShoppingBasket, Smartphone, Tv } from '@lucide/vue'
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
