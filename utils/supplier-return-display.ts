import type { InventoryItem } from '~/stores/inventory'
import type { Receipt } from '~/stores/receipts'
import type { InspectionDecision, InspectionHold } from '~/types/inspection-holds'
import type { CreateSupplierReturnBody, SupplierReturn } from '~/types/supplier-returns'
import { SUPPLIER_RETURN_ORIGIN_LABELS } from '~/types/supplier-returns'
import { getInventoryItemDisplayName } from '~/composables/useInventoryItemDisplay'
import { resolveItemUnitCost } from '~/utils/inventory-item-cost'
import { snapshotStockItemDetails } from '~/utils/stock-item-details'

/** Text for the "Where it came from" card. */
export interface OriginFact {
  label: string
  value: string
}

function day(isoDate: string | null | undefined): string | null {
  if (!isoDate) return null
  const d = new Date(isoDate)
  if (Number.isNaN(d.getTime())) return null
  return d.toLocaleDateString(undefined, { dateStyle: 'medium' })
}

/**
 * Where a returned unit came from, oldest first: how it entered stock, from whom, when and by
 * whom, its category, and when it was logged defective. Missing facts are left out.
 */
export function supplierReturnOriginFacts(row: SupplierReturn): OriginFact[] {
  const o = row.origin
  const facts: OriginFact[] = [
    { label: 'Came in as', value: SUPPLIER_RETURN_ORIGIN_LABELS[o.kind] },
  ]
  if (o.kind === 'transfer') {
    if (o.fromBranchName) facts.push({ label: 'From branch', value: o.fromBranchName })
    const first = day(o.originalAddedAt)
    if (first) facts.push({ label: 'First stocked', value: first })
  }
  if ((o.kind === 'buyback' || o.kind === 'swap_in') && o.customerName) {
    facts.push({ label: 'Bought from', value: o.customerName })
  }
  const added = day(o.addedAt)
  if (added) {
    facts.push({ label: o.kind === 'transfer' ? 'Received here' : 'Added to stock', value: added })
  }
  if (o.addedByName) {
    facts.push({ label: o.kind === 'transfer' ? 'Received by' : 'Added by', value: o.addedByName })
  }
  facts.push({ label: 'Category', value: row.item.folderName })
  if (row.customerReturn) {
    const cr = row.customerReturn
    const returned = day(cr.returnedAt)
    facts.push({
      label: 'Customer return',
      value: `#${cr.receiptNumber} · ${cr.customerName}${returned ? ` · ${returned}` : ''}`,
    })
    if (cr.complaint) facts.push({ label: 'Customer said', value: cr.complaint })
  }
  const logged = day(row.createdAt)
  if (logged) {
    facts.push({
      label: 'Logged defective',
      value: row.createdByName ? `${logged} · ${row.createdByName}` : logged,
    })
  }
  return facts
}

/** How long the unit was in stock before it was logged defective, e.g. "38 days". */
export function daysInStock(row: SupplierReturn): string | null {
  const from = row.origin.addedAt ? new Date(row.origin.addedAt).getTime() : NaN
  const to = row.createdAt ? new Date(row.createdAt).getTime() : NaN
  if (!Number.isFinite(from) || !Number.isFinite(to) || to < from) return null
  const days = Math.round((to - from) / 86_400_000)
  if (days === 0) return 'Same day'
  return days === 1 ? '1 day' : `${days} days`
}

/** What the dialog knows about the item being returned, passed alongside the request. */
export interface LogReturnContext {
  item: InventoryItem
  folderId: string
  folderName: string
  serial: boolean
}

/** Demo mode: the row the server would create for a logged return. */
export function demoReturnFromItem(
  body: CreateSupplierReturnBody,
  context: LogReturnContext
): SupplierReturn {
  const now = new Date().toISOString()
  const unitCost = resolveItemUnitCost(context.item) ?? null
  const addedAt = context.item.createdAt ? new Date(context.item.createdAt).toISOString() : null
  return {
    id: `local-${Date.now()}`,
    storeId: String(context.item.storeId || ''),
    status: 'ready',
    item: {
      inventoryItemId: context.item.id,
      folderId: context.folderId,
      folderName: context.folderName,
      name: getInventoryItemDisplayName(context.item) || 'Item',
      details: snapshotStockItemDetails(context.item),
      serial: context.serial,
      quantity: body.quantity,
      unitCost,
      inventoryAction: context.serial ? 'removed' : 'reduced',
    },
    origin: {
      kind: context.item.swapIn ? 'swap_in' : 'stock',
      addedAt,
      addedByName: 'You',
    },
    customerReturn: null,
    writeOffId: null,
    restockedAt: null,
    restockedItemId: null,
    defect: body.defect,
    supplierName: body.supplierName,
    supplierReference: body.supplierReference ?? '',
    outcome: null,
    notes: body.notes ?? '',
    costValue: unitCost === null ? null : unitCost * body.quantity,
    history: [{ status: 'ready', at: now, byName: 'You', note: body.defect }],
    createdAt: now,
    createdByName: 'You',
    sentAt: null,
    closedAt: null,
  }
}

/** Demo mode: the holds the server would create for a refund's "Needs checking" lines. */
export function demoHoldsFromReceipt(
  receipt: Receipt,
  heldItemIds: string[],
  complaint: string,
  folderName: (folderId: string) => string | undefined
): InspectionHold[] {
  const now = new Date().toISOString()
  const soldAt = receipt.date ? new Date(receipt.date as Date).toISOString() : null
  return (receipt.items || [])
    .filter((line) => line.itemId && heldItemIds.includes(line.itemId))
    .map((line) => {
      const folderId = line.folderId || receipt.folderId || ''
      return {
        id: `${receipt.id}_${line.itemId}`,
        storeId: receipt.storeId || '',
        status: 'held',
        item: {
          inventoryItemId: line.itemId,
          folderId,
          folderName: folderName(folderId) || 'Inventory',
          name: line.itemName || 'Item',
          details: line.serialNo ? { serialNumber: line.serialNo } : {},
          serial: !!line.serialNo,
          quantity: line.quantity || 1,
          unitCost: typeof line.unitCost === 'number' ? line.unitCost : null,
        },
        sale: {
          receiptId: receipt.id,
          receiptNumber: receipt.receiptNumber,
          customerName: receipt.customerName || 'Walk-in Customer',
          soldAt,
          amount: (line.price || 0) * (line.quantity || 1),
        },
        complaint,
        heldAt: now,
        heldByName: 'You',
        closedAt: null,
        closedByName: '',
        supplierReturnId: null,
      } satisfies InspectionHold
    })
}

/** Demo mode: the supplier return the server would create when a held item goes back. */
export function demoSupplierReturnFromHold(
  hold: InspectionHold,
  decision: Extract<InspectionDecision, { action: 'supplier' }>
): SupplierReturn {
  const now = new Date().toISOString()
  const unitCost = hold.item.unitCost
  return {
    id: `local-${Date.now()}`,
    storeId: hold.storeId,
    status: 'ready',
    item: {
      inventoryItemId: hold.item.inventoryItemId,
      folderId: hold.item.folderId,
      folderName: hold.item.folderName,
      name: hold.item.name,
      details: hold.item.details,
      serial: hold.item.serial,
      quantity: hold.item.quantity,
      unitCost,
      inventoryAction: hold.item.serial ? 'removed' : 'reduced',
    },
    origin: { kind: 'stock', addedAt: null, addedByName: null },
    customerReturn: {
      receiptId: hold.sale.receiptId,
      receiptNumber: hold.sale.receiptNumber,
      customerName: hold.sale.customerName,
      complaint: hold.complaint,
      returnedAt: hold.heldAt,
    },
    writeOffId: null,
    restockedAt: null,
    restockedItemId: null,
    defect: decision.defect,
    supplierName: decision.supplierName,
    supplierReference: decision.supplierReference ?? '',
    outcome: null,
    notes: decision.notes ?? '',
    costValue: unitCost === null ? null : unitCost * hold.item.quantity,
    history: [{ status: 'ready', at: now, byName: 'You', note: decision.defect }],
    createdAt: now,
    createdByName: 'You',
    sentAt: null,
    closedAt: null,
  }
}
