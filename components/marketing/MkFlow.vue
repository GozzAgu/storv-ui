<template>
  <section id="how-it-works" class="mk-section mkf" aria-labelledby="mkf-title">
    <div class="mk-container">
      <MkSectionHead
        title-id="mkf-title"
        eyebrow="How it works"
        title="From delivery to daily report,"
        accent="in one system."
        lede="Follow your stock from the day it arrives to the report that shows it sold. Nothing is typed twice."
      />

      <ol class="mkf__rail" aria-label="Steps">
        <li
          v-for="(step, i) in steps"
          :key="step.id"
          class="mkf__rail-item"
          :class="`mk-tint--${step.tint}`"
        >
          <a :href="`#flow-${step.id}`" class="mkf__rail-link">
            <span class="mkf__rail-num">{{ i + 1 }}</span>
            {{ step.short }}
          </a>
        </li>
      </ol>

      <ol class="mkf__grid">
        <li
          v-for="(step, i) in steps"
          :id="`flow-${step.id}`"
          :key="step.id"
          class="mkf__card mk-reveal"
          :class="[`mk-tint--${step.tint}`, { 'mkf__card--wide': i < 2 }]"
          :style="{ '--i': i }"
        >
          <div class="mkf__body">
            <span class="mkf__num">Step {{ i + 1 }}</span>
            <h3 class="mkf__title">{{ step.title }}</h3>
            <p class="mkf__text">{{ step.text }}</p>
            <span v-if="step.plan" class="mk-tag">{{ step.plan }}</span>
          </div>
          <div class="mkf__shot">
            <img
              :src="step.src"
              :alt="step.alt"
              width="1440"
              height="900"
              loading="lazy"
              decoding="async"
            />
          </div>
        </li>
      </ol>
    </div>
  </section>
</template>

<script setup lang="ts">
import MkSectionHead from '~/components/marketing/MkSectionHead.vue'

const steps = [
  {
    id: 'stock',
    tint: 'sand',
    short: 'Add stock',
    title: 'Add and organise your stock',
    text: 'Type products in, scan barcodes with your phone camera, or import an Excel list. Group them by category for each branch and set a low-stock level.',
    src: '/marketing/app/inventory.webp',
    alt: 'Storvv inventory for the Lagos branch: categories with stock value, item counts and a low-stock flag',
  },
  {
    id: 'sell',
    tint: 'peach',
    short: 'Sell',
    title: 'Ring it up at the till',
    text: "Take cash, transfer, card or a split and send the receipt on WhatsApp. If the internet drops, keep selling: sales sync when you're back online.",
    src: '/marketing/app/sales.webp',
    alt: 'Storvv sales: receipts with customers, items, totals, profit and payment status',
  },
  {
    id: 'update',
    tint: 'rose',
    short: 'Everything updates',
    title: 'Everything updates at once',
    text: "Stock drops, the receipt goes out and the customer's balance changes the moment you finish a sale.",
    plan: 'Balances on Medium',
    src: '/marketing/app/customers.webp',
    alt: 'Storvv customers with orders, total spent and the balance each one owes',
  },
  {
    id: 'move',
    tint: 'sage',
    short: 'Transfer & reorder',
    title: 'Move stock where it sells',
    text: 'Send stock between branches with approvals, and export a reorder list of everything running low.',
    plan: 'Transfers on Enterprise',
    src: '/marketing/app/branches.webp',
    alt: 'Storvv transfers: stock moving between branches with approval status',
  },
  {
    id: 'report',
    tint: 'sky',
    short: 'Reports',
    title: 'See what is working',
    text: "Today's revenue, top products and low stock on every plan, with full reports by branch and staff on Medium.",
    src: '/marketing/app/overview.webp',
    alt: "Storvv overview with today's revenue, recent sales and items that need attention",
  },
]
</script>
