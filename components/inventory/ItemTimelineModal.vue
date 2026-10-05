<template>
  <SDialog
    :open="modelValue"
    title="Inventory timeline"
    :description="itemDisplayName"
    size="md"
    @update:open="(v: boolean) => emit('update:modelValue', v)"
  >
    <SEmptyState
      v-if="timeline.length === 0"
      title="No events yet"
      description="Activity for this item will appear here."
    >
      <template #icon>
        <Clock :size="20" :stroke-width="1.75" />
      </template>
    </SEmptyState>

    <ol v-else class="s-timeline">
      <li
        v-for="(event, index) in timeline"
        :key="`${event.date.getTime()}-${event.type}-${index}`"
        class="s-timeline__item"
      >
        <span class="s-timeline__marker" aria-hidden="true">
          <component :is="getEventIcon(event.type)" :size="14" :stroke-width="2" />
        </span>
        <div class="s-timeline__body">
          <div class="s-timeline__head">
            <p class="s-timeline__title">{{ event.label }}</p>
            <time class="s-timeline__meta" :datetime="isoDate(event.date)">
              {{ formatTimelineDate(event.date) }}
            </time>
          </div>
          <p class="s-timeline__text">{{ event.description }}</p>
          <NuxtLink
            v-if="event.receiptId"
            :to="`/dashboard/receipts?receipt=${event.receiptId}`"
            class="s-link s-timeline__link"
            @click="emit('update:modelValue', false)"
          >
            View sale
            <ArrowRight :size="14" :stroke-width="2" aria-hidden="true" />
          </NuxtLink>
        </div>
      </li>
    </ol>
  </SDialog>
</template>

<script setup lang="ts">
import SDialog from '~/components/s/SDialog.vue'
import SEmptyState from '~/components/s/SEmptyState.vue'
import { computed } from 'vue'
import {
  ArrowLeftRight,
  ArrowRight,
  Clock,
  FolderClosed,
  Package,
  PencilLine,
  CirclePlus,
  Receipt,
  RefreshCw,
  Tag,
  Wrench,
} from '@lucide/vue'
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

function isoDate(date: Date) {
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString()
}

function formatTimelineDate(date: Date): string {
  try {
    const prefs = preferences.value
    const locale =
      prefs?.language === 'en'
        ? prefs?.region === 'GB'
          ? 'en-GB'
          : 'en-US'
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
  return (
    i.name || i.itemName || (i.brand && i.model ? `${i.brand} ${i.model}` : null) || 'Unnamed Item'
  )
})

function getEventIcon(type: TimelineEventType) {
  const icons: Record<TimelineEventType, any> = {
    created: CirclePlus,
    assigned_to_folder: FolderClosed,
    discount_applied: Tag,
    discount_removed: Tag,
    sold: Receipt,
    returned: RefreshCw,
    transferred_in: ArrowRight,
    swap_in: ArrowLeftRight,
    restocked: Package,
    maintenance: Wrench,
    updated: PencilLine,
  }
  return icons[type] || Clock
}
</script>
