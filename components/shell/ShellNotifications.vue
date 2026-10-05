<template>
  <SPopover
    label="Notifications"
    header-menu-id="notifications"
    bare
    panel-class="s-popover-host--notifications"
  >
    <template #trigger="{ open, toggle }">
      <SIconButton
        label="Notifications"
        :badge="unreadCount"
        aria-haspopup="dialog"
        :aria-expanded="open"
        @click.stop="toggle"
      >
        <Bell :size="20" :stroke-width="1.75" aria-hidden="true" />
      </SIconButton>
    </template>
    <template #default="{ close }">
      <NotificationsPanel variant="dropdown" @close="close" />
    </template>
  </SPopover>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Bell } from '@lucide/vue'
import NotificationsPanel from '~/components/notifications/NotificationsPanel.vue'
import SPopover from '~/components/s/SPopover.vue'
import SIconButton from '~/components/s/SIconButton.vue'
import { useNotificationsStore } from '~/stores/notifications'

const notificationsStore = useNotificationsStore()
const unreadCount = computed(() => notificationsStore.unreadCount)
</script>
