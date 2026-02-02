import { computed, type Ref } from 'vue'
import type { Receipt } from '~/stores/receipts'
import { usePreferences } from '~/composables/usePreferences'

export type ReceiptTimelineEventType = 'created' | 'refunded'

export interface ReceiptTimelineEvent {
  type: ReceiptTimelineEventType
  label: string
  description: string
  date: Date
}

/**
 * Builds a chronological timeline of events for a receipt
 * from the receipt's fields (created, refunded).
 */
export function useReceiptTimeline(receipt: Ref<Receipt | null>) {
  const { formatCurrency } = usePreferences()

  const timeline = computed(() => {
    const r = receipt.value
    if (!r) return []

    const events: ReceiptTimelineEvent[] = []

    // 1. Created - always present
    const createdDate = r.date
      ? r.date instanceof Date
        ? r.date
        : typeof r.date?.toDate === 'function'
          ? r.date.toDate()
          : new Date(r.date)
      : r.createdAt
        ? r.createdAt instanceof Date
          ? r.createdAt
          : typeof r.createdAt?.toDate === 'function'
            ? r.createdAt.toDate()
            : new Date(r.createdAt)
        : new Date()

    const createdDescription = r.isSwapIn
      ? `Swap-in transaction for ${r.customerName}`
      : `Sale to ${r.customerName} • ${formatCurrency(r.total || 0)}`

    events.push({
      type: 'created',
      label: r.isSwapIn ? 'Swap-in received' : 'Receipt created',
      description: createdDescription,
      date: createdDate,
    })

    // 2. Refunded - when status is refunded
    if (r.status === 'refunded' && r.updatedAt) {
      const refundedDate =
        r.updatedAt instanceof Date
          ? r.updatedAt
          : typeof r.updatedAt?.toDate === 'function'
            ? r.updatedAt.toDate()
            : new Date(r.updatedAt)
      events.push({
        type: 'refunded',
        label: 'Refunded',
        description: 'All items returned to inventory',
        date: refundedDate,
      })
    }

    // Sort by date (oldest first)
    events.sort((a, b) => a.date.getTime() - b.date.getTime())

    return events
  })

  return { timeline }
}
