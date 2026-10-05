<template>
  <div class="ds-root s-c s-page">
    <SPageHeader title="Notifications" description="Alerts and updates for your store and account.">
      <template #eyebrow>
        <p class="s-page-header__eyebrow">Inbox</p>
      </template>
    </SPageHeader>

    <NotificationsPanel variant="page" />
  </div>
</template>

<script setup lang="ts">
import SPageHeader from '~/components/s/SPageHeader.vue'
import NotificationsPanel from '~/components/notifications/NotificationsPanel.vue'

definePageMeta({
  layout: 'dashboard',
  middleware: 'auth',
})
</script>
