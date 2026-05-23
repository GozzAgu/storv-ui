<template>
  <div class="w-full max-w-none space-y-5 pb-6 sm:space-y-6 sm:pb-8">
    <DashboardPageHeader>
      <template #eyebrow>
        <p :class="eyebrowClass">Inbox</p>
      </template>
      <template #title>
        <h1 :class="pageTitleClass">Notifications</h1>
      </template>
      <template #description>
        <p :class="descriptionClass">Alerts and updates for your store and account.</p>
      </template>
    </DashboardPageHeader>

    <NotificationsPanel variant="page" />
  </div>
</template>

<script setup lang="ts">
import NotificationsPanel from '~/components/notifications/NotificationsPanel.vue'
import { useNotificationsStore } from '~/stores/notifications'

definePageMeta({
  layout: 'dashboard',
  middleware: 'auth',
})

const { eyebrowClass, pageTitleClass, descriptionClass } = useDashboardPageChrome()
const notificationsStore = useNotificationsStore()
</script>
