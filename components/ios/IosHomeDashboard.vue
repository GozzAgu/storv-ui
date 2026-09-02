<template>
  <div class="ios-home-dashboard">
    <header class="ios-home-dashboard__header">
      <div class="ios-home-dashboard__greeting-row">
        <div class="ios-home-dashboard__intro">
          <h1 class="ios-home-dashboard__greeting">Hey, {{ displayName }}</h1>
          <p v-if="storeLabel" class="ios-home-dashboard__store">{{ storeLabel }}</p>
        </div>
        <div class="ios-home-dashboard__header-actions">
          <button
            type="button"
            class="ios-home-dashboard__icon-btn"
            aria-label="Search"
            @click="openSearch"
          >
            <MagnifyingGlassIcon aria-hidden="true" />
          </button>
        </div>
      </div>
    </header>

    <ul v-if="alerts.length > 0" class="ios-home-dashboard__alerts">
      <li v-for="alert in alerts" :key="alert.id">
        <NuxtLink :to="alert.href" class="ios-home-dashboard__alert">
          <span class="ios-home-dashboard__alert-title">{{ alert.title }}</span>
          <span>{{ alert.description }}</span>
        </NuxtLink>
      </li>
    </ul>

    <section class="ios-home-dashboard__section">
      <div class="ios-home-dashboard__section-head">
        <h2 class="ios-home-dashboard__section-title">Store activity</h2>
        <button
          type="button"
          class="ios-home-dashboard__section-btn"
          aria-label="Store activity options"
          @click="menuOpen = true"
        >
          <EllipsisVerticalIcon aria-hidden="true" />
        </button>
      </div>
      <div class="ios-home-dashboard__metrics-grid">
        <IosHomeMetricCard
          v-for="metric in metrics"
          :key="metric.id"
          :label="metric.label"
          :value="metric.value"
          :href="metric.href"
          :tone="metric.tone"
          :icon="metric.icon"
        />
      </div>
    </section>

    <section class="ios-home-dashboard__section">
      <div class="ios-home-dashboard__section-head">
        <h2 class="ios-home-dashboard__section-title">Recent sales</h2>
        <div class="ios-home-dashboard__section-actions">
          <button
            type="button"
            class="ios-home-dashboard__section-btn"
            aria-label="Recent sales options"
            @click="navigateTo('/dashboard/receipts')"
          >
            <EllipsisVerticalIcon aria-hidden="true" />
          </button>
          <NuxtLink
            to="/dashboard/receipts"
            class="ios-home-dashboard__add-btn"
            aria-label="Record a sale"
          >
            <PlusIcon aria-hidden="true" />
          </NuxtLink>
        </div>
      </div>

      <div v-if="recentSales.length > 0" class="ios-home-dashboard__feed">
        <IosHomeFeedCard
          v-for="sale in recentSales"
          :key="sale.id"
          :title="sale.title"
          :subtitle="sale.subtitle"
          :body="sale.body"
          :time-label="sale.timeLabel"
          :value-label="sale.valueLabel"
          :initials="sale.initials"
          :badge="sale.badge"
          :href="sale.href"
        />
      </div>

      <div v-else class="ios-home-dashboard__feed-empty">
        <ReceiptPercentIcon aria-hidden="true" />
        <p>No sales yet</p>
        <NuxtLink to="/dashboard/receipts" class="ios-home-dashboard__feed-empty-link">
          Record your first sale
        </NuxtLink>
      </div>
    </section>

    <section v-if="lowStockPreview.length > 0" class="ios-home-dashboard__section">
      <div class="ios-home-dashboard__section-head">
        <h2 class="ios-home-dashboard__section-title">Low stock</h2>
        <NuxtLink to="/dashboard/inventory" class="ios-home-dashboard__section-link">
          View all
        </NuxtLink>
      </div>
      <div class="ios-home-dashboard__feed">
        <IosHomeFeedCard
          v-for="item in lowStockPreview"
          :key="item.id"
          :title="item.title"
          :subtitle="item.subtitle"
          :body="item.body"
          :time-label="item.timeLabel"
          :value-label="item.valueLabel"
          :initials="item.initials"
          :href="item.href"
        />
      </div>
    </section>

    <IosDrawer
      v-model="menuOpen"
      title="Menu"
      variant="menu"
      footer-variant="menu"
      mount="body"
      :show-close="true"
      body-padding="p-0"
      aria-label="Quick menu"
      backdrop-label="Close menu"
    >
      <div class="ios-drawer-menu">
        <section class="ios-drawer-menu__section">
          <p class="ios-drawer-menu__section-label">Shortcuts</p>
          <div class="ios-drawer-menu__group">
            <ul class="ios-drawer-menu__list">
              <li v-for="item in menuItems" :key="item.href">
                <NuxtLink
                  :to="item.href"
                  class="ios-drawer-menu__row"
                  @click="menuOpen = false"
                >
                  <span class="ios-drawer-menu__label">{{ item.label }}</span>
                  <ChevronRightIcon class="ios-drawer-menu__chevron" aria-hidden="true" />
                </NuxtLink>
              </li>
            </ul>
          </div>
        </section>
      </div>
    </IosDrawer>
  </div>
</template>

<script setup lang="ts">
import { ref, type Component } from 'vue'
import {
  ChevronRightIcon,
  EllipsisVerticalIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  ReceiptPercentIcon,
} from '~/utils/app-icons'
import IosDrawer from '~/components/ios/IosDrawer.vue'
import IosHomeFeedCard from '~/components/ios/IosHomeFeedCard.vue'
import IosHomeMetricCard from '~/components/ios/IosHomeMetricCard.vue'
import { useSearchStore } from '~/stores/search'

export interface IosHomeAlert {
  id: string
  title: string
  description: string
  href: string
}

export type IosHomeMetricTone = 'warning' | 'danger' | 'success'

export interface IosHomeMetric {
  id: string
  label: string
  value: string
  href?: string
  tone?: IosHomeMetricTone
  icon?: Component
}

export interface IosHomeFeedItem {
  id: string
  title: string
  subtitle: string
  body?: string
  timeLabel: string
  valueLabel: string
  initials: string
  badge?: string
  href: string
}

withDefaults(
  defineProps<{
    displayName: string
    storeLabel?: string
    metrics: IosHomeMetric[]
    recentSales: IosHomeFeedItem[]
    lowStockPreview?: IosHomeFeedItem[]
    alerts?: IosHomeAlert[]
  }>(),
  {
    lowStockPreview: () => [],
    alerts: () => [],
  }
)

const menuOpen = ref(false)
const searchStore = useSearchStore()

const menuItems = [
  { label: 'Payment links', href: '/dashboard/payment-links' },
  { label: 'Buybacks', href: '/dashboard/buybacks' },
  { label: 'Analytics', href: '/dashboard/analytics' },
  { label: 'Activity logs', href: '/dashboard/activity' },
  { label: 'Settings', href: '/dashboard/settings' },
  { label: 'Help center', href: '/dashboard/help' },
]

function openSearch() {
  searchStore.openSearch()
}
</script>
