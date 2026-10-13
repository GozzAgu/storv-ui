<template>
  <section class="mk-section mki" aria-labelledby="mk-impact-title">
    <div class="mk-container">
      <div class="mki__panel">
        <MkSectionHead
          title-id="mk-impact-title"
          eyebrow="Why it matters"
          title="Running a shop should feel"
          accent="simpler."
          lede="Fewer stock surprises, fewer unpaid balances and a day that closes itself, so you spend less time counting and more time selling."
        />

        <div class="mki__stage">
          <svg
            class="mki__wires"
            viewBox="0 0 1000 480"
            preserveAspectRatio="none"
            aria-hidden="true"
            focusable="false"
          >
            <g v-for="item in impacts" :key="item.id">
              <path class="mki__wire" :d="item.wire" />
              <path class="mki__pulse" :d="item.wire" :style="{ '--d': item.delay }" />
            </g>
          </svg>

          <div class="mki__hub" aria-hidden="true">
            <span class="mki__disc mki__disc--base" />
            <span class="mki__disc mki__disc--mid" />
            <span class="mki__disc mki__disc--top" />
            <span class="mki__mark">
              <img src="/brand/storvv-symbol.png" alt="" width="30" height="30" />
            </span>
          </div>

          <ul class="mki__cards">
            <li
              v-for="(item, i) in impacts"
              :key="item.id"
              class="mki__card mk-reveal"
              :class="`mki__card--${item.id}`"
              :style="{ '--i': i }"
            >
              <span class="mki__card-head">
                <component :is="item.icon" :size="16" :stroke-width="1.75" aria-hidden="true" />
                {{ item.title }}
              </span>
              <span class="mki__card-text">{{ item.text }}</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { Boxes, HandCoins, ShieldCheck, Sunset } from '@lucide/vue'
import MkSectionHead from '~/components/marketing/MkSectionHead.vue'

const impacts = [
  {
    id: 'stock',
    icon: Boxes,
    title: 'Know your stock, always',
    text: 'Every unit in every branch is counted the moment it sells. No more guessing.',
    wire: 'M350 90 H 435 Q 455 90 455 110 V 392',
    delay: '0s',
  },
  {
    id: 'paid',
    icon: HandCoins,
    title: "Get paid what you're owed",
    text: 'Balances and part-payments are tracked on every customer, always current.',
    wire: 'M300 290 H 395 Q 415 290 415 310 V 404',
    delay: '1.2s',
  },
  {
    id: 'close',
    icon: Sunset,
    title: 'Close the day in minutes',
    text: "Today's sales, profit and best sellers are ready without a spreadsheet.",
    wire: 'M650 90 H 565 Q 545 90 545 110 V 392',
    delay: '0.6s',
  },
  {
    id: 'trust',
    icon: ShieldCheck,
    title: 'Trust every till',
    text: 'Staff roles and an activity log show who sold, edited or discounted what.',
    wire: 'M700 290 H 605 Q 585 290 585 310 V 404',
    delay: '1.8s',
  },
]
</script>
