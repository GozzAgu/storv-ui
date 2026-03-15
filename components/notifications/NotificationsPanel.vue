<template>
  <div
    :class="[
      'rounded-xl border border-gray-200/80 dark:border-gray-700/60 overflow-hidden bg-white dark:bg-gray-800/90 shadow-sm flex flex-col',
      variant === 'dropdown' ? 'max-h-[min(85vh,28rem)] w-[min(100vw-1.5rem,22rem)]' : ''
    ]"
  >
    <!-- Header: title + Mark all as read -->
    <div class="flex items-center justify-between px-4 sm:px-5 pt-4 pb-3 border-b border-gray-100 dark:border-gray-700/80 shrink-0">
      <h2 class="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100 tracking-tight">
        Notifications
      </h2>
      <button
        v-if="unreadCount > 0"
        type="button"
        :disabled="notificationsStore.loading"
        @click="handleMarkAllAsRead"
        class="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 disabled:opacity-50 transition-colors"
      >
        Mark all as read
      </button>
    </div>

    <!-- Tabs: Inbox (with badge) / Read + eye -->
    <div class="flex items-center gap-1 border-b border-gray-100 dark:border-gray-700/80 px-4 sm:px-5 shrink-0">
      <button
        type="button"
        :class="[
          'relative flex items-center gap-1.5 px-3 py-3 text-sm font-medium transition-colors border-b-2 -mb-px',
          activeTab === 'inbox'
            ? 'text-primary-600 dark:text-primary-400 border-primary-500 dark:border-primary-400'
            : 'text-gray-500 dark:text-gray-400 border-transparent hover:text-gray-700 dark:hover:text-gray-300'
        ]"
        @click="activeTab = 'inbox'"
      >
        Inbox
        <span
          v-if="unreadCount > 0"
          class="min-w-[1.25rem] h-5 px-1.5 rounded-full bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 text-xs font-medium flex items-center justify-center"
        >
          {{ unreadCount > 99 ? '99+' : unreadCount }}
        </span>
      </button>
      <button
        type="button"
        :class="[
          'relative flex items-center gap-1.5 px-3 py-3 text-sm font-medium transition-colors border-b-2 -mb-px',
          activeTab === 'read'
            ? 'text-primary-600 dark:text-primary-400 border-primary-500 dark:border-primary-400'
            : 'text-gray-500 dark:text-gray-400 border-transparent hover:text-gray-700 dark:hover:text-gray-300'
        ]"
        @click="activeTab = 'read'"
      >
        Read
        <span
          v-if="readCount > 0"
          class="min-w-[1.25rem] h-5 px-1.5 rounded-full bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 text-xs font-medium flex items-center justify-center"
        >
          {{ readCount > 99 ? '99+' : readCount }}
        </span>
      </button>
      <div class="ml-auto flex items-center">
        <span class="p-2 text-gray-400 dark:text-gray-500" aria-hidden="true">
          <EyeIcon class="w-4 h-4" stroke-width="1.5" />
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
        <div v-for="i in 5" :key="i" class="flex items-center gap-3 px-4 sm:px-5 py-3">
          <div class="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse shrink-0" />
          <div class="flex-1 min-w-0 space-y-2">
            <div class="h-3.5 bg-gray-200 dark:bg-gray-700 rounded w-2/3 animate-pulse" />
            <div class="h-2.5 bg-gray-200 dark:bg-gray-700 rounded w-full animate-pulse" />
            <div class="h-2.5 bg-gray-200 dark:bg-gray-700 rounded w-1/4 animate-pulse" />
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div
        v-else-if="filteredNotifications.length === 0"
        class="flex flex-col items-center justify-center py-12 px-4 text-center"
      >
        <div class="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700/50 flex items-center justify-center mb-3">
          <BellIcon class="w-5 h-5 text-gray-400 dark:text-gray-500" stroke-width="1.5" />
        </div>
        <h3 class="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">
          {{ activeTab === 'inbox' ? 'No notifications yet' : 'No read notifications' }}
        </h3>
        <p class="text-xs text-gray-500 dark:text-gray-400 max-w-sm">
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
          class="w-full flex items-start gap-3 px-4 sm:px-5 py-3 text-left transition-colors hover:bg-gray-50/80 dark:hover:bg-gray-700/40"
        >
          <div
            :class="[
              'relative shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold text-white',
              getAvatarBgClass(notification)
            ]"
          >
            {{ getAvatarInitial(notification) }}
          </div>
          <div class="flex-1 min-w-0 pr-2">
            <p class="text-sm text-gray-900 dark:text-gray-100 leading-snug">
              <span class="font-semibold">{{ notification.title }}</span>
              <span class="font-normal text-gray-600 dark:text-gray-400"> — {{ notification.message }}</span>
            </p>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {{ formatTime(notification.createdAt) }}
            </p>
          </div>
          <span
            v-if="!notification.read"
            class="shrink-0 w-2 h-2 rounded-full bg-violet-500 dark:bg-violet-400 mt-1.5"
            aria-hidden="true"
          />
        </button>
      </div>

      <!-- Load More -->
      <div
        v-if="notificationsStore.hasMore && filteredNotifications.length > 0"
        class="border-t border-gray-100 dark:border-gray-700/80 px-4 sm:px-5 py-2.5 flex justify-center shrink-0"
      >
        <button
          type="button"
          @click="loadMoreNotifications"
          :disabled="notificationsStore.loading"
          class="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 disabled:opacity-50 transition-colors"
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
import { useToast } from '~/composables/useToast'

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
const toast = useToast()

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
  'bg-amber-600',
  'bg-emerald-600',
  'bg-violet-500',
  'bg-cyan-600',
  'bg-rose-500',
  'bg-indigo-500',
  'bg-teal-600',
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
