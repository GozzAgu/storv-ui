<template>
  <MkNavMenu
    label="Features"
    :heading="{ label: 'Feature overview', to: '/features' }"
    lede="Everything a shop runs on, from the stock room to the till to the daily report."
    :items="features"
    :side="{
      heading: 'Built in',
      lede: 'No add-ons to buy or connect.',
      items: builtIn,
      link: { label: 'Try the live demo', to: '/demo/dashboard' },
    }"
  />
</template>

<script setup lang="ts">
import {
  BarChart3,
  Boxes,
  Building2,
  FileSpreadsheet,
  HandCoins,
  MessageCircle,
  ReceiptText,
  ScanBarcode,
  UserCog,
  Wallet,
  WifiOff,
} from '@lucide/vue'
import MkNavMenu, {
  type MkNavMenuItem,
  type MkNavMenuSideItem,
} from '~/components/marketing/MkNavMenu.vue'

const features: MkNavMenuItem[] = [
  {
    icon: Boxes,
    title: 'Inventory',
    tint: 'sand',
    text: "Know what's on every shelf, by category, serial or IMEI.",
    to: '/features?area=inventory#explore',
  },
  {
    icon: ReceiptText,
    title: 'Sales and receipts',
    tint: 'peach',
    text: 'Ring up a sale in seconds and send the receipt on WhatsApp.',
    to: '/features?area=sales#explore',
  },
  {
    icon: HandCoins,
    title: 'Customers and balances',
    tint: 'rose',
    text: 'Deposits, part payments and who still owes you.',
    to: '/features?area=sales#explore',
  },
  {
    icon: BarChart3,
    title: 'Reports',
    tint: 'sky',
    text: 'Revenue, top products and stock value at a glance.',
    to: '/features?area=insights#explore',
  },
  {
    icon: UserCog,
    title: 'Team and roles',
    tint: 'lilac',
    text: 'Decide who can edit stock, give discounts or see reports.',
    to: '/features?area=team#explore',
  },
  {
    icon: Building2,
    title: 'Branches and transfers',
    tint: 'sage',
    text: 'Every branch under one login, with stock moving between them.',
    to: '/features?area=branches#explore',
  },
]

const builtIn: MkNavMenuSideItem[] = [
  { icon: MessageCircle, label: 'WhatsApp and PDF receipts' },
  { icon: FileSpreadsheet, label: 'Excel import and export' },
  { icon: ScanBarcode, label: 'Camera barcode scanning' },
  { icon: WifiOff, label: 'Offline selling' },
  { icon: Wallet, label: 'Cash, transfer, OPay, Moniepoint and more' },
]
</script>
