<template>
  <div class="pb-6 sm:pb-8">
    <NotificationsPanel variant="page" />
  </div>
</template>

<script setup lang="ts">
import NotificationsPanel from '~/components/notifications/NotificationsPanel.vue'

definePageMeta({
  layout: 'dashboard',
  middleware: 'auth',
})
</script>
