<template>
  <Modal
    :model-value="modelValue"
    @update:model-value="(v: boolean) => emit('update:modelValue', v)"
    size="md"
  >
    <template #header>
      <div class="min-w-0 flex-1">
        <h3
          class="text-base font-semibold text-gray-900 dark:text-gray-100 truncate tracking-tight"
        >
          Receipt History
        </h3>
        <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400 truncate">
          Receipt #{{ receipt?.receiptNumber || '-' }} · {{ receipt?.customerName || '' }}
        </p>
      </div>
    </template>

    <div class="p-4 sm:p-5 max-h-[calc(100vh-14rem)] overflow-y-auto">
      <div v-if="timeline.length === 0" class="py-10 text-center">
        <div
          class="w-10 h-10 mx-auto rounded-full bg-gray-100 dark:bg-gray-700/80 flex items-center justify-center"
        >
          <ClockIcon class="w-5 h-5 text-gray-400 dark:text-gray-500" stroke-width="1.5" />
        </div>
        <p class="mt-3 text-sm font-medium text-gray-700 dark:text-gray-300">No events yet</p>
        <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
          Activity for this receipt will appear here
        </p>
      </div>

      <div v-else class="relative">
        <div
          class="absolute left-[11px] top-2 bottom-2 w-px bg-gray-200 dark:bg-gray-600"
          aria-hidden="true"
        />
        <ul class="space-y-0">
          <li
            v-for="(event, index) in timeline"
            :key="index"
            class="relative flex gap-3 pb-5 last:pb-0"
          >
            <div
              class="relative z-10 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700"
            >
              <component
                :is="getEventIcon(event.type)"
                class="h-3.5 w-3.5 text-gray-500 dark:text-gray-400"
                stroke-width="2"
              />
            </div>
            <div class="flex-1 min-w-0 pt-px">
              <p class="text-sm font-medium text-gray-900 dark:text-gray-100">
                {{ event.label }}
              </p>
              <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                {{ event.description }}
              </p>
              <span
                class="inline-block mt-1.5 text-[11px] text-gray-400 dark:text-gray-500 tabular-nums"
              >
                {{ formatDate(event.date) }}
              </span>
            </div>
          </li>
        </ul>
      </div>
    </div>
  </Modal>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ClockIcon, PlusCircleIcon, ArrowPathIcon } from '@heroicons/vue/24/outline'
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
</script>
