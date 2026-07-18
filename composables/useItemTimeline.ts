import { computed, type Ref } from 'vue'
import type { InventoryItem } from '~/stores/inventory'
import { useReceiptsStore } from '~/stores/receipts'
import { useStoresStore } from '~/stores/stores'

export type TimelineEventType =
  | 'created'
  | 'assigned_to_folder'
  | 'discount_applied'
  | 'discount_removed'
  | 'sold'
  | 'returned'
  | 'transferred_in'
  | 'swap_in'
  | 'restocked'
  | 'maintenance'
  | 'updated'

export interface TimelineEvent {
  type: TimelineEventType
  label: string
  description: string
  date: Date
  receiptId?: string
  receiptNumber?: string
  metadata?: Record<string, unknown>
}

/**
 * Builds a chronological timeline of events for an inventory item
 * from the item's fields and related receipts (sold, returned, restock, maintenance).
 */
export function useItemTimeline(item: Ref<InventoryItem | null>, folderName?: Ref<string | null>) {
  const receiptsStore = useReceiptsStore()
  const storesStore = useStoresStore()

  const timeline = computed(() => {
    const i = item.value
    if (!i) return []

    const events: TimelineEvent[] = []
    const createdAt = i.createdAt instanceof Date ? i.createdAt : new Date(i.createdAt)

    // 1. Created - always present
    events.push({
      type: 'created',
      label: 'Item added to inventory',
      description: 'Item was added to inventory',
      date: createdAt,
    })

    // 2. Assigned to folder (warehouse/location) - when folder name is provided
    const folder = folderName?.value?.trim()
    if (folder) {
      events.push({
        type: 'assigned_to_folder',
        label: 'Assigned to folder',
        description: folder,
        date: createdAt,
        metadata: { folderName: folder },
      })
    }

    // 3. Transferred in - from another store
    if (i.transferredAt) {
      const transferredAt =
        i.transferredAt instanceof Date ? i.transferredAt : new Date(i.transferredAt)
      const fromStore =
        storesStore.stores.find((s) => s.id === i.transferredFrom)?.name || i.transferredFrom
      events.push({
        type: 'transferred_in',
        label: 'Transferred in',
        description: `Received from ${fromStore || 'another store'}`,
        date: transferredAt,
        metadata: { fromStore: i.transferredFrom },
      })
    }

    // 4. Swap in - customer swapped/returned device
    if (i.swapIn && i.swapInReceiptId) {
      const swapReceipt = receiptsStore.receipts.find((r) => r.id === i.swapInReceiptId)
      const swapDate = swapReceipt?.date
        ? swapReceipt.date instanceof Date
          ? swapReceipt.date
          : new Date(swapReceipt.date)
        : createdAt
      events.push({
        type: 'swap_in',
        label: 'Swap-in received',
        description: swapReceipt
          ? `Customer swapped in via Receipt #${swapReceipt.receiptNumber}`
          : 'Customer swap-in',
        date: swapDate,
        receiptId: i.swapInReceiptId,
        receiptNumber: swapReceipt?.receiptNumber,
      })
    }

    // 5. Discount applied - item has discount fields
    if (i.discountPercentage !== undefined || i.discountAmount !== undefined) {
      const updatedAt = i.updatedAt
        ? i.updatedAt instanceof Date
          ? i.updatedAt
          : new Date(i.updatedAt)
        : createdAt
      const discountText =
        i.discountPercentage !== undefined
          ? `${i.discountPercentage}% off`
          : i.discountAmount !== undefined
          ? `$${i.discountAmount} off`
          : 'Discount applied'
      events.push({
        type: 'discount_applied',
        label: 'Discount applied',
        description: discountText,
        date: updatedAt,
        metadata: {
          originalPrice: i.originalPrice,
          discountedPrice: i.discountedPrice,
        },
      })
    }

    // 6. Sold - from item.dateOut and receipts (with units when available)
    const soldReceipt = receiptsStore.receipts.find(
      (r) => r.status === 'completed' && r.itemIds?.includes(i.id)
    )
    const soldQuantity = soldReceipt?.items?.find((ri) => ri.itemId === i.id)?.quantity ?? 1
    if (i.dateOut) {
      const dateOut = i.dateOut instanceof Date ? i.dateOut : new Date(i.dateOut)
      const unitsText = soldQuantity > 1 ? `${soldQuantity} units sold` : 'Item sold'
      events.push({
        type: 'sold',
        label: soldQuantity > 1 ? `${soldQuantity} units sold` : 'Sold',
        description: soldReceipt
          ? soldQuantity > 1
            ? `${soldQuantity} units sold via Receipt #${soldReceipt.receiptNumber} to ${soldReceipt.customerName}`
            : `Sold via Receipt #${soldReceipt.receiptNumber} to ${soldReceipt.customerName}`
          : unitsText,
        date: dateOut,
        receiptId: soldReceipt?.id,
        receiptNumber: soldReceipt?.receiptNumber,
        metadata: { total: soldReceipt?.total, quantity: soldQuantity },
      })
    }

    // 7. Returned - from refunded receipts
    const refundedReceipt = receiptsStore.receipts.find(
      (r) => r.status === 'refunded' && r.itemIds?.includes(i.id)
    )
    if (refundedReceipt) {
      const refundDate = refundedReceipt.updatedAt
        ? refundedReceipt.updatedAt instanceof Date
          ? refundedReceipt.updatedAt
          : new Date(refundedReceipt.updatedAt)
        : refundedReceipt.date instanceof Date
        ? refundedReceipt.date
        : new Date(refundedReceipt.date)
      events.push({
        type: 'returned',
        label: 'Returned',
        description: `Refunded via Receipt #${refundedReceipt.receiptNumber}`,
        date: refundDate,
        receiptId: refundedReceipt.id,
        receiptNumber: refundedReceipt.receiptNumber,
      })
    }

    // 8. Restocked - from item.restockHistory (optional)
    const restockHistory = (i as any).restockHistory as
      | Array<{ date: Date | string; quantity: number }>
      | undefined
    if (Array.isArray(restockHistory)) {
      for (const entry of restockHistory) {
        const d = entry.date instanceof Date ? entry.date : new Date(entry.date)
        if (!isNaN(d.getTime())) {
          events.push({
            type: 'restocked',
            label: 'Restocked',
            description: `${entry.quantity} units restocked`,
            date: d,
            metadata: { quantity: entry.quantity },
          })
        }
      }
    }

    // 9. Maintenance - from item.maintenanceHistory (optional)
    const maintenanceHistory = (i as any).maintenanceHistory as
      | Array<{ date: Date | string; note?: string }>
      | undefined
    if (Array.isArray(maintenanceHistory)) {
      for (const entry of maintenanceHistory) {
        const d = entry.date instanceof Date ? entry.date : new Date(entry.date)
        if (!isNaN(d.getTime())) {
          events.push({
            type: 'maintenance',
            label: 'Maintenance recorded',
            description: entry.note || 'Maintenance was recorded',
            date: d,
            metadata: { note: entry.note },
          })
        }
      }
    }

    // Sort by date (oldest first)
    events.sort((a, b) => a.date.getTime() - b.date.getTime())

    return events
  })

  return { timeline }
}
