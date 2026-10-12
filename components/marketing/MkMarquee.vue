<template>
  <div class="mk-marquee" role="region" aria-label="Storvv features">
    <div class="mk-marquee__track">
      <ul v-for="copy in 2" :key="copy" class="mk-marquee__list" :aria-hidden="copy === 2">
        <li v-for="item in items" :key="item.label" class="mk-marquee__item">
          <span class="mk-marquee__icon"
            ><component :is="item.icon" :size="16" :stroke-width="1.75"
          /></span>
          {{ item.label }}
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  ArrowLeftRight,
  BarChart3,
  BellRing,
  Boxes,
  Building2,
  HandCoins,
  Handshake,
  MessageCircle,
  ReceiptText,
  Repeat,
  ShieldCheck,
  UserCog,
  UserPlus,
} from '@lucide/vue'

const items = [
  { icon: Boxes, label: 'Inventory tracking' },
  { icon: ReceiptText, label: 'Point of sale' },
  { icon: MessageCircle, label: 'WhatsApp receipts' },
  { icon: HandCoins, label: 'Customer balances' },
  { icon: BellRing, label: 'Low-stock alerts' },
  { icon: Building2, label: 'Multiple branches' },
  { icon: ArrowLeftRight, label: 'Stock transfers' },
  { icon: Repeat, label: 'Buybacks' },
  { icon: Handshake, label: 'Stock loans' },
  { icon: UserPlus, label: 'Sales leads' },
  { icon: UserCog, label: 'Team roles' },
  { icon: BarChart3, label: 'Analytics' },
  { icon: ShieldCheck, label: 'Activity log' },
]
</script>
