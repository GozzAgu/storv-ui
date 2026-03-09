<template>
  <div class="space-y-6 pb-6 sm:pb-8">
    <!-- Page Header -->
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">Notifications</h1>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Activity and updates from your store
        </p>
      </div>
      <Button
        v-if="unreadNotifications.length > 0"
        variant="outline"
        size="sm"
        :disabled="notificationsStore.loading"
        @click="handleMarkAllAsRead"
        extra-class="!rounded-full shrink-0"
      >
        Mark all as read
      </Button>
    </div>

    <!-- Loading State -->
    <div
      v-if="notificationsStore.loading && notifications.length === 0"
      class="rounded-xl ring-1 ring-gray-200/60 dark:ring-gray-700/60 overflow-hidden bg-white dark:bg-gray-800/80"
    >
      <div class="divide-y divide-gray-200/80 dark:divide-gray-700/80">
        <div v-for="i in 5" :key="i" class="flex items-start gap-4 px-4 sm:px-5 py-4">
          <div class="w-10 h-10 rounded-xl bg-gray-200 dark:bg-gray-700 animate-pulse shrink-0" />
          <div class="flex-1 min-w-0 space-y-2">
            <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded-lg w-2/3 animate-pulse" />
            <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full animate-pulse" />
            <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4 animate-pulse" />
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div
      v-else-if="notifications.length === 0"
      class="rounded-xl ring-1 ring-gray-200/60 dark:ring-gray-700/60 bg-white dark:bg-gray-800/80 overflow-hidden"
    >
      <div class="flex flex-col items-center justify-center py-16 px-6 text-center">
        <div class="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-gray-700/50 flex items-center justify-center mb-4">
          <BellIcon class="w-7 h-7 text-gray-400 dark:text-gray-500" stroke-width="1.5" />
        </div>
        <h3 class="text-base font-semibold text-gray-900 dark:text-gray-100 mb-1.5">
          No notifications yet
        </h3>
        <p class="text-sm text-gray-500 dark:text-gray-400 max-w-sm">
          Receipts, inventory, and team activity will show up here
        </p>
      </div>
    </div>

    <!-- Notifications List -->
    <div
      v-else
      class="rounded-xl ring-1 ring-gray-200/60 dark:ring-gray-700/60 overflow-hidden bg-white dark:bg-gray-800/80"
    >
      <div class="divide-y divide-gray-200/80 dark:divide-gray-700/80">
        <button
          v-for="(notification, index) in notifications"
          :key="notification.id"
          type="button"
          @click="handleNotificationClick(notification)"
          :class="[
            'w-full flex items-start gap-4 px-4 sm:px-5 py-4 text-left transition-colors',
            !notification.read
              ? 'bg-primary-50/40 dark:bg-primary-900/10 hover:bg-primary-50/60 dark:hover:bg-primary-900/15'
              : 'hover:bg-gray-50/80 dark:hover:bg-gray-700/50'
          ]"
        >
          <!-- Icon -->
          <div
            :class="[
              'shrink-0 w-10 h-10 rounded-xl flex items-center justify-center',
              getIconClasses(notification.type)
            ]"
          >
            <component :is="getIcon(notification.type)" class="w-5 h-5" stroke-width="1.75" />
          </div>

          <!-- Content -->
          <div class="flex-1 min-w-0">
            <div class="flex items-start justify-between gap-2">
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-0.5">
                  <span class="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                    {{ notification.title }}
                  </span>
                  <span
                    v-if="!notification.read"
                    class="shrink-0 w-2 h-2 rounded-full bg-primary-500"
                    aria-hidden="true"
                  />
                </div>
                <p class="text-sm text-gray-600 dark:text-gray-400 leading-relaxed line-clamp-2">
                  {{ notification.message }}
                </p>
                <p class="text-xs text-gray-500 dark:text-gray-500 mt-1.5">
                  {{ formatTime(notification.createdAt) }}
                </p>
              </div>
            </div>
          </div>
        </button>
      </div>

      <!-- Load More -->
      <div
        v-if="notificationsStore.hasMore"
        class="border-t border-gray-200/80 dark:border-gray-700/80 px-4 sm:px-5 py-3 flex justify-center"
      >
        <button
          type="button"
          @click="loadMoreNotifications"
          :disabled="notificationsStore.loading"
          class="text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {{ notificationsStore.loading ? 'Loading…' : 'Load more' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import {
  BellIcon,
  ReceiptPercentIcon,
  CubeIcon,
  FolderIcon,
  UserPlusIcon,
  BuildingOfficeIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  TagIcon,
  XMarkIcon,
  ArrowPathIcon,
  TrashIcon,
  PencilSquareIcon,
} from '@heroicons/vue/24/outline'
import { useNotificationsStore, type Notification, type NotificationType } from '~/stores/notifications'
import { useRouter } from 'vue-router'
import { useToast } from '~/composables/useToast'
import Button from '~/components/ui/Button.vue'

definePageMeta({
  layout: 'dashboard',
  middleware: 'auth',
})

const notificationsStore = useNotificationsStore()
const router = useRouter()
const toast = useToast()

const notifications = computed(() => notificationsStore.notifications)
const unreadNotifications = computed(() => notificationsStore.unreadNotifications)

const getIcon = (type: NotificationType) => {
  const iconMap: Record<NotificationType, any> = {
    receipt_created: ReceiptPercentIcon,
    receipt_refunded: ArrowPathIcon,
    receipt_deleted: TrashIcon,
    item_created: CubeIcon,
    item_updated: PencilSquareIcon,
    item_deleted: TrashIcon,
    item_discount_applied: TagIcon,
    item_discount_removed: XMarkIcon,
    folder_created: FolderIcon,
    folder_updated: PencilSquareIcon,
    folder_deleted: TrashIcon,
    staff_created: UserPlusIcon,
    staff_updated: PencilSquareIcon,
    staff_deleted: TrashIcon,
    department_created: BuildingOfficeIcon,
    department_updated: PencilSquareIcon,
    department_deleted: TrashIcon,
    import_completed: ArrowUpTrayIcon,
    export_completed: ArrowDownTrayIcon,
    swap_in_completed: ArrowPathIcon,
  }
  return iconMap[type] || BellIcon
}

const getIconClasses = (type: NotificationType) => {
  const classMap: Record<string, string> = {
    receipt_created: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
    receipt_refunded: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
    receipt_deleted: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
    item_created: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    item_updated: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400',
    item_deleted: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
    item_discount_applied: 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400',
    item_discount_removed: 'bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400',
    folder_created: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400',
    folder_updated: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400',
    folder_deleted: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
    staff_created: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
    staff_updated: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400',
    staff_deleted: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
    department_created: 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400',
    department_updated: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400',
    department_deleted: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
    import_completed: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
    export_completed: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    swap_in_completed: 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400',
  }
  return classMap[type] || 'bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400'
}

const formatTime = (date: Date | any) => {
  if (!date) return 'Just now'

  const now = new Date()
  const notificationDate = date instanceof Date ? date : new Date(date)
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

const handleNotificationClick = async (notification: Notification) => {
  if (!notification.read) {
    try {
      await notificationsStore.markAsRead(notification.id)
    } catch (error: any) {
      toast.error(error.message || 'Failed to mark notification as read')
    }
  }

  if (notification.metadata) {
    if (notification.metadata.receiptId) {
      router.push(`/dashboard/receipts`)
    } else if (notification.metadata.folderId) {
      router.push(`/dashboard/inventory/${notification.metadata.folderId}`)
    } else if (notification.metadata.departmentId) {
      router.push(`/dashboard/departments/${notification.metadata.departmentId}`)
    }
  }
}

const handleMarkAllAsRead = async () => {
  try {
    await notificationsStore.markAllAsRead()
    toast.success('All notifications marked as read')
  } catch (error: any) {
    toast.error(error.message || 'Failed to mark all notifications as read')
  }
}

const loadMoreNotifications = async () => {
  try {
    await notificationsStore.fetchNotifications(true)
  } catch (error: any) {
    toast.error(error.message || 'Failed to load more notifications')
  }
}

onMounted(async () => {
  if (notifications.value.length === 0) {
    await notificationsStore.fetchNotifications()
  }
})
</script>
