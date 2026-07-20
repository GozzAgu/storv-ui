<template>
  <div :class="variant === 'dropdown' ? panelDropdownClass : panelClass">
    <div :class="headerClass">
      <h2 :class="titleClass">Notifications</h2>
      <div class="dash-notify-panel__header-actions">
        <button
          v-if="unreadCount > 0"
          type="button"
          :class="headerActionClass"
          :disabled="notificationsStore.loading"
          @click="handleMarkAllAsRead"
        >
          Mark all read
        </button>
        <NuxtLink
          v-if="variant === 'dropdown'"
          to="/dashboard/notifications"
          :class="headerLinkClass"
          @click="emit('close')"
        >
          View all
        </NuxtLink>
      </div>
    </div>

    <div :class="tabsClass">
      <button
        type="button"
        :class="[tabClass, activeTab === 'inbox' ? tabActiveClass : '']"
        @click="activeTab = 'inbox'"
      >
        Inbox
        <span v-if="unreadCount > 0" :class="tabBadgeClass">
          {{ unreadCount > 99 ? '99+' : unreadCount }}
        </span>
      </button>
      <button
        type="button"
        :class="[tabClass, activeTab === 'read' ? tabActiveClass : '']"
        @click="activeTab = 'read'"
      >
        Read
        <span v-if="readCount > 0" :class="tabBadgeClass">
          {{ readCount > 99 ? '99+' : readCount }}
        </span>
      </button>
    </div>

    <div :class="bodyClass">
      <ul
        v-if="notificationsStore.loading && notifications.length === 0"
        :class="skeletonListClass"
      >
        <li v-for="i in 4" :key="i" :class="skeletonRowClass">
          <div class="dash-notify-skeleton-row__avatar" />
          <div class="dash-notify-skeleton-row__content">
            <div class="dash-notify-skeleton-row__line dash-notify-skeleton-row__line--medium" />
            <div class="dash-notify-skeleton-row__line dash-notify-skeleton-row__line--long" />
            <div class="dash-notify-skeleton-row__line dash-notify-skeleton-row__line--short" />
          </div>
        </li>
      </ul>

      <div v-else-if="filteredNotifications.length === 0" :class="emptyClass">
        <div :class="emptyIconClass">
          <BellIcon stroke-width="1.75" />
        </div>
        <h3 :class="emptyTitleClass">
          {{ activeTab === 'inbox' ? 'No notifications yet' : 'No read notifications' }}
        </h3>
        <p :class="emptyDescClass">
          {{
            activeTab === 'inbox'
              ? 'Receipts, inventory, and team activity will show up here.'
              : "Notifications you've read will appear here."
          }}
        </p>
      </div>

      <ul v-else :class="listClass">
        <li v-for="notification in filteredNotifications" :key="notification.id">
          <button
            type="button"
            :class="[itemClass, !notification.read ? itemUnreadClass : '']"
            @click="handleNotificationClick(notification)"
          >
            <div :class="[itemAvatarClass, getAvatarToneClass(notification)]">
              {{ getAvatarInitial(notification) }}
            </div>
            <div :class="itemContentClass">
              <p class="m-0 leading-snug">
                <span :class="itemTitleClass">{{ notification.title }}</span>
                <span :class="itemMessageClass">
                  - {{ formatMessageWithAccountCurrency(notification.message) }}
                </span>
              </p>
              <p :class="itemTimeClass">{{ formatTime(notification.createdAt) }}</p>
            </div>
            <span v-if="!notification.read" :class="itemDotClass" aria-hidden="true" />
          </button>
        </li>
      </ul>

      <div
        v-if="notificationsStore.hasMore && filteredNotifications.length > 0"
        :class="footerClass"
      >
        <button
          type="button"
          :class="footerActionClass"
          :disabled="notificationsStore.loading"
          @click="loadMoreNotifications"
        >
          {{ notificationsStore.loading ? 'Loading…' : 'Load more' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { BellIcon } from '@heroicons/vue/24/outline'
import { useNotificationsStore, type Notification } from '~/stores/notifications'
import { useRouter } from 'vue-router'
import { useAppToast } from '~/composables/useAppToast'
import { usePreferences } from '~/composables/usePreferences'
import { useDashboardNotificationsChrome } from '~/composables/useDashboardNotificationsChrome'

const props = withDefaults(
  defineProps<{
    variant?: 'page' | 'dropdown'
  }>(),
  { variant: 'page' }
)

const emit = defineEmits<{
  close: []
}>()

const {
  panelClass,
  panelDropdownClass,
  headerClass,
  titleClass,
  headerActionClass,
  headerLinkClass,
  tabsClass,
  tabClass,
  tabActiveClass,
  tabBadgeClass,
  bodyClass,
  listClass,
  itemClass,
  itemUnreadClass,
  itemAvatarClass,
  itemContentClass,
  itemTitleClass,
  itemMessageClass,
  itemTimeClass,
  itemDotClass,
  emptyClass,
  emptyIconClass,
  emptyTitleClass,
  emptyDescClass,
  footerClass,
  footerActionClass,
  skeletonListClass,
  skeletonRowClass,
} = useDashboardNotificationsChrome()

const notificationsStore = useNotificationsStore()
const router = useRouter()
const toast = useAppToast()
const { formatCurrency } = usePreferences()

const activeTab = ref<'inbox' | 'read'>('inbox')

const notifications = computed(() => notificationsStore.notifications)
const unreadNotifications = computed(() => notificationsStore.unreadNotifications)
const unreadCount = computed(() => unreadNotifications.value.length)
const readCount = computed(() => notificationsStore.readNotifications.length)

const filteredNotifications = computed(() => {
  if (activeTab.value === 'inbox') return notifications.value
  return notificationsStore.readNotifications
})

const avatarTones = [
  '',
  'dash-notify-item__avatar--tone-1',
  'dash-notify-item__avatar--tone-2',
  'dash-notify-item__avatar--tone-3',
] as const

function getAvatarInitial(notification: Notification): string {
  const t = notification.title?.trim()
  if (t) return (t[0] ?? 'N').toUpperCase()
  const type = notification.type
  if (type?.startsWith('receipt')) return 'R'
  if (type?.startsWith('item') || type?.startsWith('folder')) return 'I'
  if (type?.startsWith('staff')) return 'S'
  if (type?.startsWith('department')) return 'D'
  return 'N'
}

function getAvatarToneClass(notification: Notification): string {
  const type = notification.type
  const index = type
    ? Math.abs(type.split('').reduce((a, c) => a + c.charCodeAt(0), 0)) % avatarTones.length
    : 0
  return avatarTones[index] ?? avatarTones[0]
}

function formatMessageWithAccountCurrency(message: string): string {
  if (!message) return message
  return message.replace(/\$[0-9,]+(?:\.[0-9]{2})?/g, (match) => {
    const numStr = match.slice(1).replace(/,/g, '')
    const num = parseFloat(numStr)
    if (Number.isNaN(num)) return match
    return formatCurrency(num)
  })
}

function formatTime(date: Date | unknown): string {
  if (!date) return 'Just now'
  const now = new Date()
  const notificationDate = date instanceof Date ? date : new Date(date as string | number)
  const diffInSeconds = Math.floor((now.getTime() - notificationDate.getTime()) / 1000)
  if (diffInSeconds < 60) return 'Just now'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} min ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hr ago`
  if (diffInSeconds < 604800)
    return `${Math.floor(diffInSeconds / 86400)} day${
      Math.floor(diffInSeconds / 86400) > 1 ? 's' : ''
    } ago`
  return notificationDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

async function handleNotificationClick(notification: Notification) {
  if (!notification.read) {
    try {
      await notificationsStore.markAsRead(notification.id)
    } catch (error: unknown) {
      toast.error((error as Error).message || 'Failed to mark notification as read')
    }
  }

  const meta = notification.metadata
  if (meta) {
    if (meta.receiptId) router.push('/dashboard/receipts')
    else if (meta.folderId) router.push(`/dashboard/inventory/${meta.folderId}`)
    else if (meta.departmentId) router.push(`/dashboard/departments/${meta.departmentId}`)
    if (props.variant === 'dropdown') emit('close')
  }
}

async function handleMarkAllAsRead() {
  try {
    await notificationsStore.markAllAsRead()
    toast.success('All notifications marked as read')
  } catch (error: unknown) {
    toast.error((error as Error).message || 'Failed to mark all notifications as read')
  }
}

async function loadMoreNotifications() {
  try {
    await notificationsStore.fetchNotifications(true)
  } catch (error: unknown) {
    toast.error((error as Error).message || 'Failed to load more notifications')
  }
}

onMounted(async () => {
  if (notifications.value.length === 0) {
    await notificationsStore.fetchNotifications()
  }
})
</script>
