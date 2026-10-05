<template>
  <section class="mk-section mk-section--tight-top" aria-labelledby="mk-intro-title">
    <div class="mk-container">
      <div class="mk-intro mk-reveal">
        <header class="mk-intro__title">
          <p class="mk-eyebrow">Who it's for</p>
          <h2 id="mk-intro-title" class="mk-h2">
            One workspace,
            <span class="mk-accent">however you sell.</span>
          </h2>
        </header>
        <div class="mk-intro__aside">
          <p class="mk-intro__text">
            Stock, sales, receipts and customers in one dashboard, built for the way your trade
            actually works.
          </p>
          <NuxtLink to="/demo/dashboard" class="mk-link">
            Try the live demo
            <ArrowRight :size="16" aria-hidden="true" />
          </NuxtLink>
        </div>
      </div>
    </div>

    <ul class="mk-trades mk-reveal" aria-label="Businesses that run on Storvv">
      <li
        v-for="(trade, i) in trades"
        :key="trade.label"
        class="mk-trade"
        :class="{ 'mk-trade--active': active === i }"
        tabindex="0"
        @mouseenter="active = i"
        @focus="active = i"
      >
        <img
          class="mk-trade__img"
          :src="trade.src"
          :alt="trade.alt"
          width="864"
          height="1152"
          loading="lazy"
          decoding="async"
        />
        <div class="mk-trade__body">
          <span class="mk-trade__icon" aria-hidden="true">
            <component :is="trade.icon" :size="18" />
          </span>
          <h3 class="mk-trade__title">{{ trade.label }}</h3>
          <ul class="mk-trade__tags">
            <li v-for="tag in trade.tags" :key="tag" class="mk-trade__tag">{{ tag }}</li>
          </ul>
        </div>
      </li>
    </ul>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ArrowRight, Car, PackageCheck, ShoppingBasket, Smartphone, Tv } from '@lucide/vue'

const trades = [
  {
    src: '/marketing/people/car-dealer.webp',
    label: 'Car dealers',
    icon: Car,
    tags: ['Deposits', 'Sales leads'],
    alt: 'A smiling car dealer holding up a key fob and a tablet in front of a white SUV in his showroom',
  },
  {
    src: '/marketing/people/gadget-store.webp',
    label: 'Gadget stores',
    icon: Smartphone,
    tags: ['IMEI tracking', 'Buybacks'],
    alt: 'A gadget store attendant showing a smartwatch to a customer across a table of phones',
  },
  {
    src: '/marketing/people/electronics.webp',
    label: 'Electronics',
    icon: Tv,
    tags: ['Serial numbers', 'Part payments'],
    alt: 'An electronics store owner holding a tablet beside shelves of TVs and boxed speakers',
  },
  {
    src: '/marketing/people/supermarket.webp',
    label: 'Supermarkets',
    icon: ShoppingBasket,
    tags: ['Low-stock alerts', 'Fast checkout'],
    alt: 'A supermarket manager scanning stock on a shelf of fresh produce',
  },
  {
    src: '/marketing/people/procurement.webp',
    label: 'Procurement',
    icon: PackageCheck,
    tags: ['Transfers', 'Stock loans'],
    alt: 'A procurement officer checking an order on a tablet beside pallets of cartons in a warehouse',
  },
]

const active = ref(1)
</script>
