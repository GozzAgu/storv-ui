<template>
  <MkNavMenu
    label="Product"
    :heading="{ label: 'How Storvv works', to: '/#how-it-works' }"
    lede="One system for the stock room, the till and the daily report, shaped for the way your business sells."
    :items="businesses"
    :side="{
      heading: 'Problems it solves',
      lede: 'The everyday headaches Storvv takes off your plate.',
      items: problems,
      link: { label: 'Compare with a notebook', to: '/#compare' },
    }"
  />
</template>

<script setup lang="ts">
import {
  BarChart3,
  Building2,
  Car,
  HandCoins,
  PackageCheck,
  PackageSearch,
  ShieldCheck,
  ShoppingBasket,
  Smartphone,
  Tv,
  WifiOff,
  Workflow,
} from '@lucide/vue'
import MkNavMenu, {
  type MkNavMenuItem,
  type MkNavMenuSideItem,
} from '~/components/marketing/MkNavMenu.vue'

const businesses: MkNavMenuItem[] = [
  {
    icon: Smartphone,
    title: 'Gadget stores',
    tint: 'sky',
    text: 'IMEI tracking, trade-ins and part payments.',
    to: '/?trade=gadgets#use-cases',
  },
  {
    icon: Tv,
    title: 'Electronics',
    tint: 'lilac',
    text: 'Serial numbers and pay-over-time for big tickets.',
    to: '/?trade=electronics#use-cases',
  },
  {
    icon: ShoppingBasket,
    title: 'Supermarkets',
    tint: 'sage',
    text: 'Fast barcode checkout and low-stock alerts.',
    to: '/?trade=supermarkets#use-cases',
  },
  {
    icon: Car,
    title: 'Car dealers',
    tint: 'peach',
    text: 'Deposits, balances and interested buyers.',
    to: '/?trade=dealers#use-cases',
  },
  {
    icon: PackageCheck,
    title: 'Procurement',
    tint: 'sand',
    text: 'Transfers, stock loans and one count across sites.',
    to: '/?trade=procurement#use-cases',
  },
  {
    icon: Workflow,
    title: 'See it step by step',
    tint: 'rose',
    text: 'Follow a sale from delivery to the daily report.',
    to: '/#how-it-works',
  },
]

const problems: MkNavMenuSideItem[] = [
  {
    icon: PackageSearch,
    label: "Stock counts that don't add up",
    to: '/features?area=inventory#explore',
  },
  { icon: HandCoins, label: 'Losing track of who owes you', to: '/features?area=sales#explore' },
  {
    icon: WifiOff,
    label: 'Sales stuck when the internet drops',
    to: '/features?area=sales#explore',
  },
  {
    icon: Building2,
    label: "Branches you can't see from home",
    to: '/features?area=branches#explore',
  },
  {
    icon: ShieldCheck,
    label: 'Staff seeing more than they should',
    to: '/features?area=team#explore',
  },
  { icon: BarChart3, label: 'Adding up the day by hand', to: '/features?area=insights#explore' },
]
</script>
