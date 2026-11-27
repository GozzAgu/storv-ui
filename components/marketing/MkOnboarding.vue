<template>
  <section class="mk-section mko" aria-labelledby="mko-title">
    <div class="mk-container">
      <MkSectionHead
        title-id="mko-title"
        eyebrow="Getting started"
        title="Set up in an afternoon,"
        accent="with help when you need it."
        lede="Bring the stock list you already have, add your team and start selling. If you get stuck, we reply the same day."
      />

      <ul class="mko__rows">
        <li
          v-for="(row, i) in rows"
          :key="row.area"
          class="mkor mk-reveal"
          :style="{ '--i': i, '--row': row.colour }"
        >
          <!-- Coloured panel: the area, one line, and what it works with -->
          <div class="mkor__panel">
            <div>
              <h3 class="mkor__area">{{ row.area }}</h3>
              <p class="mkor__blurb">{{ row.blurb }}</p>
            </div>
            <div class="mkor__with">
              <p class="mkor__with-label">{{ row.withLabel }}</p>
              <p class="mkor__with-value">
                <component :is="row.withIcon" :size="30" :stroke-width="1.6" aria-hidden="true" />
                {{ row.withValue }}
              </p>
            </div>
          </div>

          <!-- What it does, and where to go next -->
          <div class="mkor__body">
            <div>
              <p class="mkor__title">{{ row.title }}</p>
              <p class="mkor__text">{{ row.text }}</p>
            </div>
            <div class="mkor__actions">
              <template v-for="link in row.links" :key="link.label">
                <a
                  v-if="link.href"
                  :href="link.href"
                  target="_blank"
                  rel="noopener"
                  class="mko-btn"
                  :class="{ 'mko-btn--primary': link.primary }"
                  >{{ link.label }}</a
                >
                <NuxtLink
                  v-else
                  :to="link.to"
                  class="mko-btn"
                  :class="{ 'mko-btn--primary': link.primary }"
                  >{{ link.label }}</NuxtLink
                >
              </template>
            </div>
          </div>

          <!-- A ranked list from a sample shop, like a small leaderboard -->
          <div class="mkor__board" aria-label="Example from a sample shop">
            <p class="mkor__board-label">{{ row.boardLabel }}</p>
            <ol class="mko-board">
              <li v-for="item in row.board" :key="item.name" class="mko-board__item">
                <div class="mko-board__line">
                  <component
                    :is="item.icon"
                    :size="20"
                    :stroke-width="1.75"
                    class="mko-board__icon"
                    aria-hidden="true"
                  />
                  <span class="mko-board__name">{{ item.name }}</span>
                  <span class="mko-board__meta">{{ item.meta }}</span>
                  <span
                    class="mko-board__value"
                    :class="{ 'mko-board__value--text': item.share === undefined }"
                    >{{ item.value }}</span
                  >
                </div>
                <span v-if="item.share !== undefined" class="mko-board__bar" aria-hidden="true">
                  <span :style="{ width: `${item.share}%` }" />
                </span>
              </li>
            </ol>
          </div>
        </li>
      </ul>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { Component } from 'vue'
import {
  CircleUserRound,
  CircleX,
  FileSpreadsheet,
  Headset,
  Laptop,
  LifeBuoy,
  Mail,
  MessageCircle,
  Monitor,
  CalendarDays,
  Shirt,
  ShoppingBasket,
  Smartphone,
  Tablet,
  TabletSmartphone,
  Users,
} from '~/icons'
import MkSectionHead from '~/components/marketing/MkSectionHead.vue'
import { useMarketingSignupUrl } from '~/composables/useMarketingSite'
import { storvvWhatsappLink } from '~/utils/storvv-whatsapp'

const signupUrl = useMarketingSignupUrl()
const whatsappUrl = storvvWhatsappLink('Hi Storvv, I need help setting up.')

interface BoardItem {
  icon: Component
  name: string
  meta: string
  value: string
  /** Bar length, 0–100. Left out for rows that aren't a measure. */
  share?: number
}

interface Row {
  area: string
  blurb: string
  /** Panel and bar colour. */
  colour: string
  withLabel: string
  withIcon: Component
  withValue: string
  title: string
  text: string
  links: { label: string; to?: string; href?: string; primary?: boolean }[]
  boardLabel: string
  board: BoardItem[]
}

const rows: Row[] = [
  {
    area: 'Stock',
    blurb: 'Bring the list you already keep. Every item lands in the right category.',
    colour: '#16171d',
    withLabel: 'Works with',
    withIcon: FileSpreadsheet,
    withValue: 'Excel and CSV',
    title: 'Bring your stock list',
    text: 'Import an Excel file into any category, from phones and laptops to provisions and fashion. Storvv shows what was added and what was skipped, so nothing goes missing.',
    links: [
      { label: 'Start free', to: signupUrl.value, primary: true },
      { label: 'Import guide', to: '/help#help-inventory' },
    ],
    boardLabel: 'Sample import · items added by category',
    board: [
      { icon: Smartphone, name: 'Phones', meta: 'Serial · IMEI', value: '112', share: 42 },
      { icon: Laptop, name: 'Laptops', meta: 'Serial', value: '69', share: 26 },
      { icon: ShoppingBasket, name: 'Provisions', meta: 'Quantity', value: '54', share: 20 },
      { icon: Shirt, name: 'Fashion', meta: 'Quantity', value: '31', share: 12 },
      { icon: CircleX, name: 'Skipped', meta: 'Duplicates', value: '3', share: 1 },
    ],
  },
  {
    area: 'Team',
    blurb: 'Every branch, every person, with the access their job needs and no more.',
    colour: '#3149d8',
    withLabel: 'Roles across',
    withIcon: Users,
    withValue: 'Every branch',
    title: 'Add your branches and team',
    text: 'Give each person a role, so cashiers sell, managers approve and only you see the profit. Every action is logged with a name.',
    links: [
      { label: 'Start free', to: signupUrl.value, primary: true },
      { label: 'Roles explained', to: '/help#help-team' },
    ],
    boardLabel: 'Sample day · sales by staff',
    board: [
      {
        icon: CircleUserRound,
        name: 'Amaka',
        meta: 'Cashier · Ikeja',
        value: '₦184,000',
        share: 92,
      },
      {
        icon: CircleUserRound,
        name: 'Tunde',
        meta: 'Manager · Lekki',
        value: '₦152,500',
        share: 76,
      },
      {
        icon: CircleUserRound,
        name: 'Chidi',
        meta: 'Cashier · Abuja',
        value: '₦97,000',
        share: 49,
      },
      {
        icon: CircleUserRound,
        name: 'Ifeoma',
        meta: 'Cashier · Lekki',
        value: '₦64,000',
        share: 32,
      },
      { icon: CircleUserRound, name: 'Musa', meta: 'Sales · Ikeja', value: '₦41,500', share: 21 },
    ],
  },
  {
    area: 'Selling',
    blurb: 'No till to buy and nothing to install. Open Storvv and ring up the sale.',
    colour: '#0c6b3e',
    withLabel: 'Runs on',
    withIcon: TabletSmartphone,
    withValue: 'Any device',
    title: 'Sell from the devices you have',
    text: 'Storvv runs in the browser on any phone, tablet or laptop. Staff sign in on their own device and pick up where the counter left off.',
    links: [
      { label: 'Start free', to: signupUrl.value, primary: true },
      { label: 'Try the demo', to: '/demo/dashboard' },
    ],
    boardLabel: 'Sample week · share of sales by device',
    board: [
      { icon: Smartphone, name: 'Phone', meta: 'Android, iPhone', value: '48%', share: 48 },
      { icon: Laptop, name: 'Laptop', meta: 'Any browser', value: '29%', share: 29 },
      { icon: Tablet, name: 'Tablet', meta: 'Counter stand', value: '15%', share: 15 },
      { icon: Monitor, name: 'Desktop', meta: 'Back office', value: '8%', share: 8 },
    ],
  },
  {
    area: 'Support',
    blurb: 'Real people who know shops. Ask in your own words and get a straight answer.',
    colour: '#5b34c7',
    withLabel: 'Reach us on',
    withIcon: MessageCircle,
    withValue: 'WhatsApp',
    title: 'Answers the same day',
    text: 'Ask us anything on WhatsApp or by email, book a walkthrough, or follow step-by-step guides in the help centre.',
    links: [
      { label: 'WhatsApp us', href: whatsappUrl, primary: true },
      { label: 'Help centre', to: '/help' },
    ],
    boardLabel: 'Ways to get help',
    board: [
      { icon: MessageCircle, name: 'WhatsApp', meta: '', value: 'Same day' },
      { icon: Mail, name: 'Email', meta: '', value: 'Same day' },
      { icon: CalendarDays, name: 'Walkthrough', meta: '', value: 'Book a time' },
      { icon: LifeBuoy, name: 'Help centre', meta: '', value: 'Any time' },
      { icon: Headset, name: 'Setup help', meta: '', value: 'Free' },
    ],
  },
]
</script>
