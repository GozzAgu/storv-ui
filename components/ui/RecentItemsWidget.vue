<script setup lang="ts">
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
import DashboardHoverTooltip from '~/components/ui/DashboardHoverTooltip.vue'

const { recentItems, removeRecentItem } = useRecentItems()
const router = useRouter()
const { sectionLabelClass, sublinkClass } = useDashboardSidebarChrome()

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

const handleRemove = (item: RecentItem) => {
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
 <div v-if="recentItems.filter(i => i.type === 'folder' || i.type === 'inventory').length > 0" class="space-y-px">
 <p :class="sectionLabelClass">
 Recent
 </p>
 <div class="max-h-40 space-y-px overflow-y-auto">
 <div
 v-for="item in recentItems.filter(i => i.type === 'folder' || i.type === 'inventory').slice(0, 5)"
 :key="`${item.type}-${item.id}`"
 :class="[sublinkClass, 'cursor-pointer']"
 role="button"
 tabindex="0"
 @click="handleItemClick(item)"
 @keydown.enter.prevent="handleItemClick(item)"
 @keydown.space.prevent="handleItemClick(item)"
 >
 <component
 :is="getIcon(item.type)"
 class="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 flex-shrink-0"
 />
 <div class="flex-1 min-w-0">
 <p class="text-[11px] font-medium text-gray-900 dark:text-gray-100 truncate">
 {{ item.name }}
 </p>
 <p class="text-[9px] text-gray-500 dark:text-gray-400">
 {{ getTypeLabel(item.type) }} • {{ formatTime(item.timestamp) }}
 </p>
 </div>
 <button
 type="button"
 class="group/remove relative opacity-0 transition-all group-hover:opacity-100 p-0.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
 aria-label="Remove from recent"
 @click.stop="handleRemove(item)"
 >
 <XMarkIcon class="w-2.5 h-2.5" />
 <DashboardHoverTooltip placement="bottom" named-group="remove">
 Remove from recent
 </DashboardHoverTooltip>
 </button>
 </div>
 </div>
 </div>
</template>
