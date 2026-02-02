<template>
  <Modal
    :model-value="modelValue"
    @update:model-value="(v: boolean) => emit('update:modelValue', v)"
    size="md"
  >
    <template #header>
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-md bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
          <ClockIcon class="w-6 h-6 text-primary-600 dark:text-primary-400" />
        </div>
        <div class="min-w-0 flex-1">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">
            Receipt History
          </h3>
          <p class="text-sm text-gray-500 dark:text-gray-400 truncate">
            Receipt #{{ receipt?.receiptNumber || '—' }} • {{ receipt?.customerName || '' }}
          </p>
        </div>
      </div>
    </template>

    <div class="max-h-[calc(100vh-14rem)] overflow-y-auto">
      <div v-if="timeline.length === 0" class="py-8 text-center">
        <ClockIcon class="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
        <p class="text-sm text-gray-500 dark:text-gray-400">No timeline events yet</p>
      </div>

      <div v-else class="relative">
        <!-- Timeline line -->
        <div
          class="absolute left-4 top-2 bottom-2 w-0.5 bg-gray-200 dark:bg-gray-700"
          aria-hidden="true"
        />
        <ul class="space-y-0">
          <li
            v-for="(event, index) in timeline"
            :key="index"
            class="relative flex gap-4 pb-4 last:pb-0"
          >
            <!-- Event icon -->
            <div
              :class="[
                'relative z-10 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border-2 border-white dark:border-gray-800',
                getEventIconBg(event.type)
              ]"
            >
              <component
                :is="getEventIcon(event.type)"
                class="h-4 w-4"
                :class="getEventIconColor(event.type)"
              />
            </div>
            <!-- Event content -->
            <div class="flex-1 min-w-0 pt-0.5">
              <p class="text-sm font-medium text-gray-900 dark:text-gray-100">
                {{ event.label }}
              </p>
              <p class="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                {{ event.description }}
              </p>
              <div class="flex items-center gap-2 mt-1.5">
                <span class="text-[10px] text-gray-500 dark:text-gray-500">
                  {{ formatDate(event.date) }}
                </span>
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
  ArrowPathIcon,
} from '@heroicons/vue/24/outline'
import Modal from '~/components/ui/Modal.vue'
import { useReceiptTimeline, type ReceiptTimelineEventType } from '~/composables/useReceiptTimeline'
import type { Receipt } from '~/stores/receipts'
import { usePreferences } from '~/composables/usePreferences'

const props = defineProps<{
  modelValue: boolean
  receipt: Receipt | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const { formatDate } = usePreferences()

const receiptRef = computed(() => props.receipt)
const { timeline } = useReceiptTimeline(receiptRef)

function getEventIcon(type: ReceiptTimelineEventType) {
  const icons: Record<ReceiptTimelineEventType, any> = {
    created: PlusCircleIcon,
    refunded: ArrowPathIcon,
  }
  return icons[type] || ClockIcon
}

function getEventIconBg(type: ReceiptTimelineEventType): string {
  const map: Record<ReceiptTimelineEventType, string> = {
    created: 'bg-blue-100 dark:bg-blue-900/40',
    refunded: 'bg-amber-100 dark:bg-amber-900/40',
  }
  return map[type] || 'bg-gray-100 dark:bg-gray-700'
}

function getEventIconColor(type: ReceiptTimelineEventType): string {
  const map: Record<ReceiptTimelineEventType, string> = {
    created: 'text-blue-600 dark:text-blue-400',
    refunded: 'text-amber-600 dark:text-amber-400',
  }
  return map[type] || 'text-gray-600 dark:text-gray-400'
}
</script>
