<template>
  <div class="s-c s-notify" :class="`s-notify--${variant}`">
    <div class="s-notify__head">
      <h2 v-if="variant === 'dropdown'" class="s-notify__title">Notifications</h2>
      <STabs
        v-else
        v-model="activeTab"
        :tabs="tabs"
        label="Notification filters"
        class="s-notify__tabs"
      />
      <div class="s-notify__head-actions">
        <SButton
          v-if="unreadCount > 0"
          variant="ghost"
          size="sm"
          :disabled="notificationsStore.loading"
          @click="handleMarkAllAsRead"
        >
          <template #leading><CheckCheck :size="16" :stroke-width="2" aria-hidden="true" /></template>
          Mark all read
        </SButton>
        <NuxtLink
          v-if="variant === 'dropdown'"
          to="/dashboard/notifications"
          class="s-link s-notify__view-all"
          @click="emit('close')"
        >
          View all
        </NuxtLink>
      </div>
    </div>

    <div v-if="variant === 'dropdown'" class="s-notify__segment">
      <STabs v-model="activeTab" :tabs="tabs" label="Notification filters" block />
    </div>

    <div class="s-notify__body">
      <ul
        v-if="notificationsStore.loading && notifications.length === 0"
        class="s-list"
        aria-label="Loading notifications"
        aria-busy="true"
      >
        <li v-for="i in 4" :key="i" class="s-list__item s-notify__item" aria-hidden="true">
          <SSkeleton circle height="32px" />
          <div class="s-notify__content">
            <SSkeleton width="45%" height="14px" />
            <SSkeleton width="85%" height="12px" />
            <SSkeleton width="20%" height="12px" />
          </div>
        </li>
      </ul>

      <SEmptyState
        v-else-if="filteredNotifications.length === 0"
        :title="activeTab === 'inbox' ? 'No notifications yet' : 'No read notifications'"
        :description="
          activeTab === 'inbox'
            ? 'Sales, inventory, and team activity will show up here.'
            : 'Notifications you\'ve read will appear here.'
        "
      >
        <template #icon><Bell :size="24" :stroke-width="1.75" /></template>
      </SEmptyState>

      <ul v-else class="s-list">
        <li v-for="notification in filteredNotifications" :key="notification.id">
          <button
            type="button"
            class="s-list__item s-list__item--interactive s-notify__item"
            :class="{ 's-notify__item--unread': !notification.read }"
            @click="handleNotificationClick(notification)"
          >
            <span class="s-notify__icon" :class="`s-notify__icon--${getTone(notification)}`" aria-hidden="true">
              <component :is="getIcon(notification)" :size="16" :stroke-width="1.75" />
            </span>
            <span class="s-notify__content">
              <span class="s-notify__item-title">{{ notification.title }}</span>
              <span v-if="notification.message" class="s-notify__message">
                {{ formatMessageWithAccountCurrency(notification.message) }}
              </span>
              <span class="s-notify__time">{{ formatTime(notification.createdAt) }}</span>
            </span>
            <span v-if="!notification.read" class="s-notify__dot">
              <span class="ds-sr-only">Unread</span>
            </span>
          </button>
        </li>
      </ul>

      <div
        v-if="notificationsStore.hasMore && filteredNotifications.length > 0"
        class="s-notify__foot"
      >
        <SButton
          variant="ghost"
          size="sm"
          block
          :loading="notificationsStore.loading"
          @click="loadMoreNotifications"
        >
          Load more
        </SButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, type Component } from 'vue'
import {
  BadgeCheck,
  Bell,
  Building2,
  CheckCheck,
  FileDown,
  Network,
  Package,
  Receipt,
  Repeat,
  Store,
  Target,
  UserRound,
} from '@lucide/vue'
import SButton from '~/components/s/SButton.vue'
import SEmptyState from '~/components/s/SEmptyState.vue'
import SSkeleton from '~/components/s/SSkeleton.vue'
import STabs from '~/components/s/STabs.vue'
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

const tabs = computed(() => [
  { value: 'inbox', label: 'Inbox', count: unreadCount.value || undefined },
  { value: 'read', label: 'Read', count: readCount.value || undefined },
])

const filteredNotifications = computed(() => {
  if (activeTab.value === 'inbox') return notifications.value
  return notificationsStore.readNotifications
})

type Tone = 'accent' | 'success' | 'warning' | 'info' | 'neutral'

function getIcon(notification: Notification): Component {
  const type = notification.type || ''
  if (
    type.startsWith('payment_') ||
    type === 'till_count_difference' ||
    type === 'payout_changed'
  )
    return BadgeCheck
  if (type.startsWith('receipt')) return Receipt
  if (type.startsWith('item') || type.startsWith('folder')) return Package
  if (type.startsWith('staff')) return UserRound
  if (type.startsWith('department')) return Building2
  if (type.startsWith('lead')) return Target
  if (type === 'storefront_inquiry') return Store
  if (type.startsWith('trade_')) return Network
  if (type === 'swap_in_completed') return Repeat
  if (type === 'import_completed' || type === 'export_completed') return FileDown
  return Bell
}

function getTone(notification: Notification): Tone {
  const type = notification.type || ''
  if (
    type === 'payment_rejected' ||
    type === 'till_count_difference' ||
    type === 'payment_link_problem' ||
    type === 'payment_link_sale_cancelled' ||
    type === 'payout_changed'
  )
    return 'warning'
  if (type === 'payment_awaiting_confirmation') return 'accent'
  if (type === 'payment_received' || type === 'trade_accepted') return 'success'
  if (type === 'trade_invite') return 'accent'
  if (type.endsWith('_deleted') || type === 'receipt_refunded') return 'warning'
  if (type.startsWith('receipt') || type === 'lead_converted') return 'success'
  if (type.startsWith('lead') || type === 'storefront_inquiry') return 'accent'
  if (type.startsWith('item') || type.startsWith('folder')) return 'info'
  return 'neutral'
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
    notificationsStore.markAsRead(notification.id).catch((error: unknown) => {
      console.warn('Failed to mark notification as read:', error)
    })
  }

  const meta = notification.metadata
  if (meta) {
    if (notification.type === 'till_count_difference') {
      router.push('/dashboard/payments/till')
    } else if (notification.type === 'payout_changed') {
      router.push('/dashboard/payment-links')
    } else if (notification.type.startsWith('trade_')) {
      router.push('/dashboard/partners')
    } else if (
      (notification.type === 'payment_awaiting_confirmation' ||
        notification.type === 'payment_rejected' ||
        notification.type === 'payment_link_problem' ||
        notification.type === 'payment_received' ||
        notification.type === 'payment_link_sale_cancelled') &&
      meta.receiptId
    ) {
      router.push(`/dashboard/receipts?receipt=${encodeURIComponent(meta.receiptId)}`)
    } else if (meta.receiptId) {
      router.push(`/dashboard/receipts?highlight=${encodeURIComponent(meta.receiptId)}`)
    } else if (meta.leadId) {
      router.push(`/dashboard/leads/${meta.leadId}`)
    } else if (meta.inquiryId || notification.type === 'storefront_inquiry') {
      router.push('/dashboard/storefront')
    } else if (meta.folderId) router.push(`/dashboard/inventory/${meta.folderId}`)
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
