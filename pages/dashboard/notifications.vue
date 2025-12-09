<template>
  <div class="space-y-4 sm:space-y-5">
    <!-- Page Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100">Notifications</h1>
        <p class="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
          Track all activities and updates in your store
        </p>
      </div>
      <div class="flex items-center gap-3">
        <button
          v-if="unreadNotifications.length > 0"
          @click="handleMarkAllAsRead"
          :disabled="notificationsStore.loading"
          class="px-4 py-2 text-sm font-medium text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Mark all as read
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="notificationsStore.loading && notifications.length === 0" class="text-center py-12">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">Loading notifications...</p>
    </div>

    <!-- Empty State -->
    <Card v-else-if="notifications.length === 0">
      <div class="text-center py-12">
        <BellIcon class="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
        <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          No notifications yet
        </h3>
        <p class="text-sm text-gray-500 dark:text-gray-400">
          Your activity notifications will appear here
        </p>
      </div>
    </Card>

    <!-- Notifications List -->
    <div v-else class="space-y-3">
      <Card
        v-for="notification in notifications"
        :key="notification.id"
        padding="md"
        :extra-class="`transition-all duration-200 cursor-pointer hover:shadow-md ${!notification.read ? 'bg-primary-50/50 dark:bg-primary-900/10 border-primary-200 dark:border-primary-800' : ''}`"
        @click="handleNotificationClick(notification)"
      >
        <div class="flex items-start gap-4">
          <!-- Icon -->
          <div :class="[
            'flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center',
            getIconClasses(notification.type)
          ]">
            <component :is="getIcon(notification.type)" class="w-5 h-5" />
          </div>

          <!-- Content -->
          <div class="flex-1 min-w-0">
            <div class="flex items-start justify-between gap-2">
              <div class="flex-1 min-w-0">
                <h3 class="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {{ notification.title }}
                </h3>
                <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {{ notification.message }}
                </p>
                <p class="text-xs text-gray-500 dark:text-gray-500 mt-2">
                  {{ formatTime(notification.createdAt) }}
                </p>
              </div>
              
              <!-- Unread indicator -->
              <div
                v-if="!notification.read"
                class="flex-shrink-0 w-2 h-2 bg-primary-500 rounded-full mt-2"
              ></div>
            </div>
          </div>
        </div>
      </Card>

      <!-- Load More Button -->
      <div v-if="notificationsStore.hasMore" class="text-center pt-4">
        <button
          @click="loadMoreNotifications"
          :disabled="notificationsStore.loading"
          class="px-6 py-2 text-sm font-medium text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
import Card from '~/components/ui/Card.vue'
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
    receipt_created: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
    receipt_refunded: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400',
    receipt_deleted: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
    item_created: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    item_updated: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400',
    item_deleted: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
    item_discount_applied: 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400',
    item_discount_removed: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400',
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
  return classMap[type] || 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
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

