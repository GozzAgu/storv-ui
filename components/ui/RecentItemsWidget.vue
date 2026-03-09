<script setup lang="ts">
import { computed } from 'vue'
import { useRecentItems, type RecentItem } from '~/composables/useRecentItems'
import { useRouter } from 'vue-router'
import {
  ClockIcon,
  ReceiptPercentIcon,
  UsersIcon,
  CubeIcon,
  FolderIcon,
  XMarkIcon,
} from '@heroicons/vue/24/outline'

const { recentItems, removeRecentItem } = useRecentItems()
const router = useRouter()

const getIcon = (type: RecentItem['type']) => {
  switch (type) {
    case 'receipt':
      return ReceiptPercentIcon
    case 'customer':
      return UsersIcon
    case 'inventory':
      return CubeIcon
    case 'folder':
      return FolderIcon
    default:
      return ClockIcon
  }
}

const getTypeLabel = (type: RecentItem['type']) => {
  switch (type) {
    case 'receipt':
      return 'Receipt'
    case 'customer':
      return 'Customer'
    case 'inventory':
      return 'Item'
    case 'folder':
      return 'Folder'
    default:
      return 'Item'
  }
}

const handleItemClick = (item: RecentItem) => {
  router.push(item.path)
}

const handleRemove = (e: Event, item: RecentItem) => {
  e.stopPropagation()
  removeRecentItem(item.id, item.type)
}

const formatTime = (timestamp: number) => {
  const now = Date.now()
  const diff = now - timestamp
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  return new Date(timestamp).toLocaleDateString()
}
</script>

<template>
  <div v-if="recentItems.filter(i => i.type === 'folder' || i.type === 'inventory').length > 0" class="space-y-2">
    <p class="px-3 py-1.5 text-[11px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">
      Recent
    </p>
    <div class="space-y-1 max-h-64 overflow-y-auto">
      <button
        v-for="item in recentItems.filter(i => i.type === 'folder' || i.type === 'inventory').slice(0, 5)"
        :key="`${item.type}-${item.id}`"
        @click="handleItemClick(item)"
        class="w-full px-3 py-2 text-left rounded-full hover:bg-gray-200/60 dark:hover:bg-gray-800/60 transition-colors group flex items-center gap-2"
      >
        <component
          :is="getIcon(item.type)"
          class="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0"
        />
        <div class="flex-1 min-w-0">
          <p class="text-xs font-medium text-gray-900 dark:text-gray-100 truncate">
            {{ item.name }}
          </p>
          <p class="text-[10px] text-gray-500 dark:text-gray-400">
            {{ getTypeLabel(item.type) }} • {{ formatTime(item.timestamp) }}
          </p>
        </div>
        <button
          @click="handleRemove($event, item)"
          class="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-all"
        >
          <XMarkIcon class="w-3 h-3" />
        </button>
      </button>
    </div>
  </div>
</template>
