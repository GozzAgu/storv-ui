<template>
 <Modal
 :model-value="modelValue"
 @update:model-value="(v: boolean) => emit('update:modelValue', v)"
 size="md"
 >
 <template #header>
 <div class="min-w-0 flex-1">
 <h3 class="text-base font-semibold text-gray-900 dark:text-gray-100 truncate tracking-tight">
 Inventory Timeline
 </h3>
 <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400 truncate">
 {{ itemDisplayName }}
 </p>
 </div>
 </template>

 <div class="p-4 sm:p-5 max-h-[calc(100vh-14rem)] overflow-y-auto">
 <div v-if="timeline.length === 0" class="py-10 text-center">
 <div class="w-10 h-10 mx-auto rounded-full bg-gray-100 dark:bg-gray-700/80 flex items-center justify-center">
 <ClockIcon class="w-5 h-5 text-gray-400 dark:text-gray-500" stroke-width="1.5" />
 </div>
 <p class="mt-3 text-sm font-medium text-gray-700 dark:text-gray-300">No events yet</p>
 <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">Activity for this item will appear here</p>
 </div>

 <div v-else class="relative">
 <div
 class="absolute left-[11px] top-2 bottom-2 w-px bg-gray-200 dark:bg-gray-600"
 aria-hidden="true"
 />
 <ul class="space-y-0">
 <li
 v-for="(event, index) in timeline"
 :key="`${event.date.getTime()}-${event.type}-${index}`"
 class="relative flex gap-3 pb-5 last:pb-0"
 >
 <div class="relative z-10 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700">
 <component
 :is="getEventIcon(event.type)"
 class="h-3.5 w-3.5 text-gray-500 dark:text-gray-400"
 stroke-width="2"
 />
 </div>
 <div class="flex-1 min-w-0 pt-px">
 <div class="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
 <p class="text-sm font-medium text-gray-900 dark:text-gray-100">
 {{ event.label }}
 </p>
 <span class="text-[11px] text-gray-400 dark:text-gray-500 tabular-nums">
 {{ formatTimelineDate(event.date) }}
 </span>
 </div>
 <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
 {{ event.description }}
 </p>
 <div v-if="event.receiptId" class="mt-2">
 <NuxtLink
 :to="`/dashboard/receipts?receipt=${event.receiptId}`"
 class="text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
 @click="emit('update:modelValue', false)"
 >
 View receipt →
 </NuxtLink>
 </div>
 </div>
 </li>
 </ul>
 </div>
 </div>
 </Modal>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
 ClockIcon,
 PlusCircleIcon,
 TagIcon,
 ReceiptPercentIcon,
 ArrowPathIcon,
 ArrowRightIcon,
 ArrowsRightLeftIcon,
 PencilSquareIcon,
 FolderIcon,
 CubeIcon,
 WrenchScrewdriverIcon,
} from '@heroicons/vue/24/outline'
import Modal from '~/components/ui/Modal.vue'
import { useItemTimeline, type TimelineEventType } from '~/composables/useItemTimeline'
import type { InventoryItem } from '~/stores/inventory'
import { usePreferences } from '~/composables/usePreferences'

const props = defineProps<{
 modelValue: boolean
 item: InventoryItem | null
 /** Folder (e.g. warehouse) name for "Assigned to [name]" timeline entry */
 folderName?: string | null
}>()

const emit = defineEmits<{
 'update:modelValue': [value: boolean]
}>()

const { preferences } = usePreferences()

const itemRef = computed(() => props.item)
const folderNameRef = computed(() => props.folderName ?? null)
const { timeline } = useItemTimeline(itemRef, folderNameRef)

function formatTimelineDate(date: Date): string {
 try {
 const prefs = preferences.value
 const locale = prefs?.language === 'en'
 ? (prefs?.region === 'GB' ? 'en-GB' : 'en-US')
 : prefs?.language ?? 'en-US'
 return date.toLocaleDateString(locale, {
 month: 'short',
 day: 'numeric',
 year: 'numeric',
 timeZone: prefs?.timezone ?? 'UTC',
 })
 } catch {
 return ''
 }
}

const itemDisplayName = computed(() => {
 const i = props.item
 if (!i) return '-'
 return i.name || i.itemName || (i.brand && i.model ? `${i.brand} ${i.model}` : null) || 'Unnamed Item'
})

function getEventIcon(type: TimelineEventType) {
 const icons: Record<TimelineEventType, any> = {
 created: PlusCircleIcon,
 assigned_to_folder: FolderIcon,
 discount_applied: TagIcon,
 discount_removed: TagIcon,
 sold: ReceiptPercentIcon,
 returned: ArrowPathIcon,
 transferred_in: ArrowRightIcon,
 swap_in: ArrowsRightLeftIcon,
 restocked: CubeIcon,
 maintenance: WrenchScrewdriverIcon,
 updated: PencilSquareIcon,
 }
 return icons[type] || ClockIcon
}
</script>
