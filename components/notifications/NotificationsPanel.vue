<template>
  <div
    :class="[ 'rounded-sm border border-gray-200/90 bg-white shadow-[0_12px_30px_-18px_rgba(15,23,42,0.3)] dark:border-gray-700/80 dark:bg-dashboard-card dark:shadow-[0_12px_28px_-16px_rgba(0,0,0,0.55)] overflow-hidden flex flex-col', variant === 'dropdown' ? 'max-h-[min(85vh,24rem)] w-full min-w-0' : '' ]"
  >
    <!-- Header: title + Mark all as read -->
    <div class="flex items-center justify-between px-3.5 pt-3 pb-2 border-b border-gray-100 dark:border-gray-700/80 shrink-0 bg-gray-50/60 dark:bg-white/[0.02]">
      <h2 class="text-xs font-semibold text-gray-900 dark:text-gray-100 tracking-tight">
        Notifications
      </h2>
      <button
        v-if="unreadCount > 0"
        type="button"
        :disabled="notificationsStore.loading"
        @click="handleMarkAllAsRead"
        class="text-[11px] font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 disabled:opacity-50 transition-colors"
      >
        Mark all as read
      </button>
    </div>

    <!-- Tabs: Inbox (with badge) / Read + eye -->
    <div class="flex items-center gap-0.5 border-b border-gray-100 dark:border-gray-700/80 px-3.5 shrink-0 bg-white/70 dark:bg-dashboard-card">
      <button
        type="button"
        :class="[ 'relative flex items-center gap-1 rounded-t-sm px-2.5 py-2 text-[11px] font-medium transition-colors border-b-2 -mb-px', activeTab === 'inbox' ? 'text-primary-600 dark:text-primary-400 border-primary-500 dark:border-primary-400 bg-primary-50/50 dark:bg-primary-500/10' : 'text-gray-500 dark:text-gray-400 border-transparent hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/[0.03]' ]"
        @click="activeTab = 'inbox'"
      >
        Inbox
        <span
          v-if="unreadCount > 0"
          class="min-w-4 h-3.5 px-0.5 rounded-full bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 text-[9px] font-medium flex items-center justify-center leading-none"
        >
          {{ unreadCount > 99 ? '99+' : unreadCount }}
        </span>
      </button>
      <button
        type="button"
        :class="[ 'relative flex items-center gap-1 rounded-t-sm px-2.5 py-2 text-[11px] font-medium transition-colors border-b-2 -mb-px', activeTab === 'read' ? 'text-primary-600 dark:text-primary-400 border-primary-500 dark:border-primary-400 bg-primary-50/50 dark:bg-primary-500/10' : 'text-gray-500 dark:text-gray-400 border-transparent hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/[0.03]' ]"
        @click="activeTab = 'read'"
      >
        Read
        <span
          v-if="readCount > 0"
          class="min-w-4 h-3.5 px-0.5 rounded-full bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 text-[9px] font-medium flex items-center justify-center leading-none"
        >
          {{ readCount > 99 ? '99+' : readCount }}
        </span>
      </button>
      <div class="ml-auto flex items-center">
        <span class="p-1 text-gray-400 dark:text-gray-500" aria-hidden="true">
          <EyeIcon class="w-3 h-3" stroke-width="1.5" />
        </span>
      </div>
    </div>

    <!-- Scrollable body -->
    <div :class="['flex-1 min-h-0 overflow-y-auto', variant === 'dropdown' ? 'overscroll-contain' : '']">
      <!-- Loading State -->
      <div
        v-if="notificationsStore.loading && notifications.length === 0"
        class="divide-y divide-gray-100 dark:divide-gray-700/80"
      >
        <div v-for="i in 5" :key="i" class="flex items-center gap-2 px-2.5 sm:px-3 py-2">
          <div class="w-6 h-6 rounded-full bg-gray-200 dark:bg-white/10 animate-pulse shrink-0" />
          <div class="flex-1 min-w-0 space-y-1">
            <div class="h-2.5 bg-gray-200 dark:bg-white/10 rounded w-2/3 animate-pulse" />
            <div class="h-2 bg-gray-200 dark:bg-white/10 rounded w-full animate-pulse" />
            <div class="h-1.5 bg-gray-200 dark:bg-white/10 rounded w-1/4 animate-pulse" />
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div
        v-else-if="filteredNotifications.length === 0"
        class="flex flex-col items-center justify-center py-6 px-2.5 text-center"
      >
        <div class="w-6 h-6 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center mb-1.5">
          <BellIcon class="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" stroke-width="1.5" />
        </div>
        <h3 class="text-[10px] font-semibold text-gray-900 dark:text-gray-100 mb-0.5">
          {{ activeTab === 'inbox' ? 'No notifications yet' : 'No read notifications' }}
        </h3>
        <p class="text-[10px] text-gray-500 dark:text-gray-400 max-w-sm leading-snug">
          {{ activeTab === 'inbox' ? 'Receipts, inventory, and team activity will show up here' : "Notifications you've read will appear here" }}
        </p>
      </div>

      <!-- Notifications List -->
      <div v-else class="divide-y divide-gray-100 dark:divide-gray-700/80">
        <button
          v-for="notification in filteredNotifications"
          :key="notification.id"
          type="button"
          @click="handleNotificationClick(notification)"
          :class="[
            'w-full flex items-start gap-2.5 px-3.5 py-2.5 text-left transition-colors',
            notification.read
              ? 'hover:bg-gray-50/80 dark:hover:bg-gray-700/35'
              : 'bg-primary-50/[0.35] dark:bg-primary-500/[0.08] hover:bg-primary-50/70 dark:hover:bg-primary-500/[0.14]'
          ]"
        >
          <div
            :class="[ 'relative shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-semibold text-white leading-none', getAvatarBgClass(notification) ]"
          >
            {{ getAvatarInitial(notification) }}
          </div>
          <div class="flex-1 min-w-0 pr-1.5">
            <p class="text-[11px] text-gray-900 dark:text-gray-100 leading-snug">
              <span class="font-semibold">{{ notification.title }}</span>
              <span class="font-normal text-gray-600 dark:text-gray-400"> - {{ formatMessageWithAccountCurrency(notification.message) }}</span>
            </p>
            <p class="text-[10px] text-gray-500 dark:text-gray-400 mt-1">
              {{ formatTime(notification.createdAt) }}
            </p>
          </div>
          <span
            v-if="!notification.read"
            class="shrink-0 w-1.5 h-1.5 rounded-full bg-primary-500 dark:bg-primary-400 mt-1.5"
            aria-hidden="true"
          />
        </button>
      </div>

      <!-- Load More -->
      <div
        v-if="notificationsStore.hasMore && filteredNotifications.length > 0"
        class="border-t border-gray-100 dark:border-gray-700/80 px-3.5 py-2 flex justify-center shrink-0 bg-gray-50/50 dark:bg-white/[0.02]"
      >
        <button
          type="button"
          @click="loadMoreNotifications"
          :disabled="notificationsStore.loading"
          class="text-[11px] font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 disabled:opacity-50 transition-colors"
        >
          {{ notificationsStore.loading ? 'Loading…' : 'Load more' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { BellIcon, EyeIcon } from '@heroicons/vue/24/outline'
import { useNotificationsStore, type Notification } from '~/stores/notifications'
import { useRouter } from 'vue-router'
import { useAppToast } from '~/composables/useAppToast'
import { usePreferences } from '~/composables/usePreferences'

const props = withDefaults(
  defineProps<{
    variant?: 'page' | 'dropdown'
  }>(),
  { variant: 'page' }
)

const emit = defineEmits<{
  close: []
}>()

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

const avatarColors = [
  'bg-blue-500',
  'bg-blue-600',
  'bg-gray-500',
  'bg-gray-600',
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

function getAvatarBgClass(notification: Notification): string {
  const type = notification.type
  const index = type ? Math.abs(type.split('').reduce((a, c) => a + c.charCodeAt(0), 0)) % avatarColors.length : 0
  return avatarColors[index] ?? avatarColors[0]
}

/** Replaces $ amounts in a notification message with the account's selected currency. */
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
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} day${Math.floor(diffInSeconds / 86400) > 1 ? 's' : ''} ago`
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
