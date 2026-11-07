<template>
  <SDialog
    :open="modelValue"
    size="md"
    title="Sale history"
    :description="`Receipt #${receipt?.receiptNumber || '-'}${
      receipt?.customerName ? ` · ${receipt.customerName}` : ''
    }`"
    @update:open="(v: boolean) => emit('update:modelValue', v)"
  >
    <SEmptyState
      v-if="timeline.length === 0"
      title="No events yet"
      description="Activity for this sale will appear here"
    >
      <template #icon>
        <ClockIcon :size="20" :stroke-width="1.75" />
      </template>
    </SEmptyState>

    <ul v-else class="s-receipt-timeline">
      <li v-for="(event, index) in timeline" :key="index" class="s-receipt-timeline__event">
        <span class="s-receipt-timeline__marker" aria-hidden="true">
          <component :is="getEventIcon(event.type)" :size="14" :stroke-width="2" />
        </span>
        <div class="s-receipt-timeline__body">
          <p class="s-receipt-timeline__label">{{ event.label }}</p>
          <p class="s-receipt-timeline__description">{{ event.description }}</p>
          <span class="s-receipt-timeline__time">{{ formatDate(event.date) }}</span>
        </div>
      </li>
    </ul>
  </SDialog>
</template>

<script setup lang="ts">
import SDialog from '~/components/s/SDialog.vue'
import SEmptyState from '~/components/s/SEmptyState.vue'
import { computed } from 'vue'
import { ClockIcon, PlusCircleIcon, ArrowPathIcon, PencilSquareIcon } from '~/utils/app-icons'
import { useReceiptTimeline, type ReceiptTimelineEventType } from '~/composables/useReceiptTimeline'
import type { Receipt } from '~/stores/receipts'
import { usePreferences } from '~/composables/usePreferences'
import { useReceiptEdits } from '~/composables/useReceiptEdits'
import { RECEIPT_EDIT_FIELD_LABELS, type ReceiptEditableField } from '~/utils/receipt-edit'

const props = defineProps<{
  modelValue: boolean
  receipt: Receipt | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const { formatDate } = usePreferences()

const receiptRef = computed(() => props.receipt)
const { timeline: baseTimeline } = useReceiptTimeline(receiptRef)
const { edits } = useReceiptEdits(
  computed(() => (props.modelValue && props.receipt?.edited ? props.receipt.id : null)),
  computed(() => props.receipt?.editCount)
)

/** Recorded edits slot into the sale's timeline by date. */
const timeline = computed(() =>
  [
    ...baseTimeline.value,
    ...edits.value
      .filter((e) => e.editedAt)
      .map((e) => ({
        type: 'edited' as const,
        label: `Edited by ${e.editedByName}`,
        description: [
          e.changes
            .map((c) => RECEIPT_EDIT_FIELD_LABELS[c.field as ReceiptEditableField] ?? c.field)
            .join(', '),
          e.reason && `“${e.reason}”`,
        ]
          .filter(Boolean)
          .join(' · '),
        date: e.editedAt as Date,
      })),
  ].sort((a, b) => a.date.getTime() - b.date.getTime())
)

function getEventIcon(type: ReceiptTimelineEventType | 'edited') {
  const icons: Record<ReceiptTimelineEventType | 'edited', any> = {
    created: PlusCircleIcon,
    refunded: ArrowPathIcon,
    edited: PencilSquareIcon,
  }
  return icons[type] || ClockIcon
}
</script>
