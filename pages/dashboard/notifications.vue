<template>
  <div class="space-y-3">
    <!-- Page Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100">Notifications</h1>
        <p class="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          Track all activities and updates in your store
        </p>
      </div>
      <button
        v-if="unreadNotifications.length > 0"
        @click="handleMarkAllAsRead"
        :disabled="notificationsStore.loading"
        class="px-3 py-1.5 text-xs font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Mark all as read
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="notificationsStore.loading && notifications.length === 0" class="space-y-2">
      <div v-for="i in 5" :key="i" class="flex items-start gap-3 p-3 border-b border-gray-100 dark:border-gray-800">
        <div class="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 animate-pulse flex-shrink-0"></div>
        <div class="flex-1 space-y-1.5">
          <div class="h-3 bg-gray-100 dark:bg-gray-800 rounded w-3/4 animate-pulse"></div>
          <div class="h-2.5 bg-gray-100 dark:bg-gray-800 rounded w-full animate-pulse"></div>
          <div class="h-2.5 bg-gray-100 dark:bg-gray-800 rounded w-1/4 animate-pulse"></div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else-if="notifications.length === 0" class="text-center py-8">
      <div class="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
        <BellIcon class="w-6 h-6 text-gray-400 dark:text-gray-500 stroke-1" stroke-width="1.5" />
      </div>
      <h3 class="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">
        No notifications yet
      </h3>
      <p class="text-xs text-gray-500 dark:text-gray-400">
        Your activity notifications will appear here
      </p>
    </div>

    <!-- Notifications List -->
    <div v-else class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div
        v-for="(notification, index) in notifications"
        :key="notification.id"
        @click="handleNotificationClick(notification)"
        :class="[
          'flex items-start gap-3 p-3 transition-colors cursor-pointer',
          index !== notifications.length - 1 ? 'border-b border-gray-100 dark:border-gray-700' : '',
          !notification.read 
            ? 'bg-primary-50/30 dark:bg-primary-900/10 hover:bg-primary-50/50 dark:hover:bg-primary-900/20' 
            : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
        ]"
      >
        <!-- Icon -->
        <div :class="[
          'flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center',
          getIconClasses(notification.type)
        ]">
          <component :is="getIcon(notification.type)" class="w-4 h-4 stroke-1" stroke-width="1.5" />
        </div>

        <!-- Content -->
        <div class="flex-1 min-w-0">
          <div class="flex items-start justify-between gap-2">
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-1.5 mb-0.5">
                <h3 class="text-xs font-semibold text-gray-900 dark:text-gray-100">
                  {{ notification.title }}
                </h3>
                <!-- Unread indicator -->
                <div
                  v-if="!notification.read"
                  class="flex-shrink-0 w-1.5 h-1.5 bg-primary-500 rounded-full"
                ></div>
              </div>
              <p class="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                {{ notification.message }}
              </p>
              <p class="text-[10px] text-gray-500 dark:text-gray-500 mt-1">
                {{ formatTime(notification.createdAt) }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Load More Button -->
      <div v-if="notificationsStore.hasMore" class="p-3 border-t border-gray-100 dark:border-gray-700 text-center">
        <button
          @click="loadMoreNotifications"
          :disabled="notificationsStore.loading"
          class="px-3 py-1.5 text-xs font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ notificationsStore.loading ? 'Loading...' : 'Load more' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
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
    receipt_created: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
    receipt_refunded: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400',
    receipt_deleted: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400',
    item_created: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    item_updated: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400',
    item_deleted: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400',
    item_discount_applied: 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400',
    item_discount_removed: 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
    folder_created: 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400',
    folder_updated: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400',
    folder_deleted: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400',
    staff_created: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400',
    staff_updated: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400',
    staff_deleted: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400',
    department_created: 'bg-cyan-50 dark:bg-cyan-900/20 text-cyan-600 dark:text-cyan-400',
    department_updated: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400',
    department_deleted: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400',
    import_completed: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
    export_completed: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    swap_in_completed: 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400',
  }
  return classMap[type] || 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
}

const formatTime = (date: Date | any) => {
  if (!date) return 'Just now'
  
  const now = new Date()
  const notificationDate = date instanceof Date ? date : new Date(date)
  const diffInSeconds = Math.floor((now.getTime() - notificationDate.getTime()) / 1000)
  
  if (diffInSeconds < 60) return 'Just now'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minute${Math.floor(diffInSeconds / 60) > 1 ? 's' : ''} ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hour${Math.floor(diffInSeconds / 3600) > 1 ? 's' : ''} ago`
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

  // Navigate based on notification type and metadata
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

