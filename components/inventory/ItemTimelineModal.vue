<template>
  <Modal
    :model-value="modelValue"
    @update:model-value="(v: boolean) => emit('update:modelValue', v)"
    size="md"
  >
    <template #header>
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
          <ClockIcon class="w-6 h-6 text-primary-600 dark:text-primary-400" stroke-width="1.75" />
        </div>
        <div class="min-w-0 flex-1">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">
            Inventory Timeline
          </h3>
          <p class="text-sm text-gray-500 dark:text-gray-400 truncate">
            {{ itemDisplayName }}
          </p>
        </div>
      </div>
    </template>

    <div class="max-h-[calc(100vh-14rem)] overflow-y-auto">
      <div v-if="timeline.length === 0" class="py-8 text-center">
        <div class="w-14 h-14 mx-auto mb-3 rounded-xl bg-gray-100 dark:bg-gray-700/80 flex items-center justify-center">
          <ClockIcon class="w-7 h-7 text-gray-400 dark:text-gray-500" />
        </div>
        <p class="text-sm font-medium text-gray-700 dark:text-gray-300">No timeline events yet</p>
        <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Activity for this item will appear here</p>
      </div>

      <div v-else class="relative py-1">
        <!-- Timeline line -->
        <div
          class="absolute left-[15px] top-3 bottom-3 w-px bg-gray-200 dark:bg-gray-600"
          aria-hidden="true"
        />
        <ul class="space-y-0">
          <li
            v-for="(event, index) in timeline"
            :key="`${event.date.getTime()}-${event.type}-${index}`"
            class="relative flex gap-4 pb-5 last:pb-0"
          >
            <!-- Event icon -->
            <div
              :class="[
                'relative z-10 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border-2 border-white dark:border-gray-800 shadow-sm',
                getEventIconBg(event.type)
              ]"
            >
              <component
                :is="getEventIcon(event.type)"
                class="h-4 w-4"
                :class="getEventIconColor(event.type)"
                stroke-width="1.75"
              />
            </div>
            <!-- Event content -->
            <div class="flex-1 min-w-0 pt-0.5">
              <div class="flex flex-wrap items-baseline gap-2">
                <span class="text-[11px] font-medium text-gray-500 dark:text-gray-400 tabular-nums">
                  {{ formatTimelineDate(event.date) }}
                </span>
                <span class="text-gray-300 dark:text-gray-600">–</span>
                <p class="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {{ event.label }}
                </p>
              </div>
              <p class="text-xs text-gray-600 dark:text-gray-400 mt-0.5 leading-relaxed">
                {{ event.description }}
              </p>
              <div v-if="event.receiptId" class="mt-2">
                <NuxtLink
                  :to="`/dashboard/receipts?receipt=${event.receiptId}`"
                  class="text-xs font-medium text-primary-600 dark:text-primary-400 hover:underline"
                  @click="emit('update:modelValue', false)"
                >
                  View receipt
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
  if (!i) return '—'
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

function getEventIconBg(type: TimelineEventType): string {
  const map: Record<TimelineEventType, string> = {
    created: 'bg-blue-100 dark:bg-blue-900/40',
    assigned_to_folder: 'bg-slate-100 dark:bg-slate-700/60',
    discount_applied: 'bg-amber-100 dark:bg-amber-900/40',
    discount_removed: 'bg-gray-100 dark:bg-gray-700',
    sold: 'bg-green-100 dark:bg-green-900/40',
    returned: 'bg-amber-100 dark:bg-amber-900/40',
    transferred_in: 'bg-purple-100 dark:bg-purple-900/40',
    swap_in: 'bg-cyan-100 dark:bg-cyan-900/40',
    restocked: 'bg-emerald-100 dark:bg-emerald-900/40',
    maintenance: 'bg-orange-100 dark:bg-orange-900/40',
    updated: 'bg-gray-100 dark:bg-gray-700',
  }
  return map[type] || 'bg-gray-100 dark:bg-gray-700'
}

function getEventIconColor(type: TimelineEventType): string {
  const map: Record<TimelineEventType, string> = {
    created: 'text-blue-600 dark:text-blue-400',
    assigned_to_folder: 'text-slate-600 dark:text-slate-400',
    discount_applied: 'text-amber-600 dark:text-amber-400',
    discount_removed: 'text-gray-600 dark:text-gray-400',
    sold: 'text-green-600 dark:text-green-400',
    returned: 'text-amber-600 dark:text-amber-400',
    transferred_in: 'text-purple-600 dark:text-purple-400',
    swap_in: 'text-cyan-600 dark:text-cyan-400',
    restocked: 'text-emerald-600 dark:text-emerald-400',
    maintenance: 'text-orange-600 dark:text-orange-400',
    updated: 'text-gray-600 dark:text-gray-400',
  }
  return map[type] || 'text-gray-600 dark:text-gray-400'
}
</script>
