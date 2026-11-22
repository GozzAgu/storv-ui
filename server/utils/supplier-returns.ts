import { createError } from 'h3'
import {
  FieldValue,
  Timestamp,
  type DocumentReference,
  type Firestore,
  type Transaction,
} from 'firebase-admin/firestore'
import type { InventoryFolder, InventoryItem } from '~/stores/inventory'
import { planHasFeature } from '~/types/subscription'
import type {
  SupplierReturnOrigin,
  SupplierReturnOutcome,
  SupplierReturnStatus,
} from '~/types/supplier-returns'
import { RESTOCK_OUTCOMES, SUPPLIER_RETURN_OUTCOME_LABELS } from '~/types/supplier-returns'
import { getInventoryItemDisplayName } from '~/composables/useInventoryItemDisplay'
import { resolveBulkStockFieldAndValueFromMap } from '~/utils/inventory-bulk-quantity'
import { resolveItemUnitCost } from '~/utils/inventory-item-cost'
import { folderHasSerialNumbers } from '~/utils/receipt-multi-folder'
import { snapshotStockItemDetails } from '~/utils/stock-item-details'
import {
  actorCanUseCategory,
  assertId,
  forbid,
  staffName,
  type StoreActor,
} from '~/server/utils/sales/actor'
import { logSaleActivity } from '~/server/utils/sales/records'

/**
 * Supplier returns (see types/supplier-returns.ts).
 *
 * Stock that came in defective (or turned out faulty before it sold) is logged from inventory and
 * goes back to the supplier. Logging it takes it out of stock in the same transaction: a serial
 * unit's row is deleted, a bulk row loses the returned units. The return keeps a snapshot of the
 * item and of where it came from, so nothing about the unit is lost.
 *
 * Customer returns are different: they go through a refund on the sale and back into stock.
 */

const TEXT_MAX = 300

export const SUPPLIER_RETURNS_COLLECTION = 'supplierReturns'

/** Taking stock out is a products change: owners, and staff who can edit or delete products. */
export function canManageSupplierReturns(actor: StoreActor): boolean {
  return (
    actor.isOwner ||
    actor.permissions.products.edit === true ||
    actor.permissions.products.delete === true
  )
}

/**
 * Logging a new supplier return needs Medium or higher. Sending, settling and restocking returns
 * already open never do, so a downgrade can't strand money a supplier owes.
 */
export function assertSupplierReturnsPlan(actor: StoreActor): void {
  if (!planHasFeature(actor.plan, 'supplier_returns')) {
    forbid('Supplier returns need the Medium plan or higher.', 'PLAN_UPGRADE_REQUIRED')
  }
}

export function cleanText(value: unknown, max = TEXT_MAX): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : ''
}

export function conflict(message: string, code: string): never {
  throw createError({ statusCode: 409, message, data: { code } })
}

export function bad(message: string, code = 'INVALID_INPUT'): never {
  throw createError({ statusCode: 400, message, data: { code } })
}

export function toTimestamp(value: unknown): Timestamp | null {
  if (value instanceof Timestamp) return value
  if (value instanceof Date && !Number.isNaN(value.getTime())) return Timestamp.fromDate(value)
  if (typeof value === 'string' || typeof value === 'number') {
    const d = new Date(value)
    return Number.isNaN(d.getTime()) ? null : Timestamp.fromDate(d)
  }
  if (value && typeof value === 'object' && '_seconds' in value) {
    const s = Number((value as { _seconds: unknown })._seconds)
    return Number.isFinite(s) ? new Timestamp(s, 0) : null
  }
  return null
}

export function stripUndefined<T extends Record<string, unknown>>(value: T): T {
  return Object.fromEntries(Object.entries(value).filter(([, v]) => v !== undefined)) as T
}

/** Extra facts read alongside the item, used to describe where it came from. */
export interface OriginLookups {
  addedByName: string | null
  transfer?: { sourceStoreName?: unknown } | null
  buyback?: { customerName?: unknown } | null
  swapInReceipt?: { customerName?: unknown } | null
}

/**
 * How a unit entered this branch's stock, from the fields stock moves leave on it: a transfer
 * (`transferId`), a trade-in (`buyback`), a swap-in on a sale (`swapIn`), else added directly.
 * Dates stay Timestamps here; the client reads them as dates.
 */
export function buildItemOrigin(
  item: Partial<InventoryItem>,
  lookups: OriginLookups
): Omit<SupplierReturnOrigin, 'addedAt' | 'originalAddedAt'> & {
  addedAt: Timestamp | null
  originalAddedAt?: Timestamp | null
} {
  const addedAt = toTimestamp(item.createdAt) ?? toTimestamp(item.dateIn)
  if (item.transferId) {
    return {
      kind: 'transfer',
      addedAt,
      addedByName: cleanText(item.receivedByName, 80) || lookups.addedByName,
      transferId: String(item.transferId),
      fromBranchName: cleanText(lookups.transfer?.sourceStoreName, 80) || null,
      originalAddedAt: toTimestamp(item.originalDateIn),
    }
  }
  if (item.buyback || item.buybackId) {
    return {
      kind: 'buyback',
      addedAt,
      addedByName: lookups.addedByName,
      ...(item.buybackId && { buybackId: String(item.buybackId) }),
      customerName: cleanText(lookups.buyback?.customerName, 80) || null,
    }
  }
  if (item.swapIn || item.swapInReceiptId) {
    return {
      kind: 'swap_in',
      addedAt,
      addedByName: lookups.addedByName,
      ...(item.swapInReceiptId && { swapInReceiptId: String(item.swapInReceiptId) }),
      customerName: cleanText(lookups.swapInReceipt?.customerName, 80) || null,
    }
  }
  return { kind: 'stock', addedAt, addedByName: lookups.addedByName }
}

/** Display name for whoever created a stock row: the owner, or a staff member of this branch. */
async function readPersonName(
  tx: Transaction,
  actor: StoreActor,
  uid: string
): Promise<string | null> {
  if (!uid) return null
  if (uid === actor.ownerId) {
    const owner = await tx.get(actor.store.firestore.collection('users').doc(actor.ownerId))
    const data = owner.data() ?? {}
    return cleanText(data.name || data.email, 80) || 'Owner'
  }
  const member = await tx.get(actor.store.collection('members').doc(uid))
  const data = member.data()
  if (!data?.staffId || !data.departmentId) return null
  const staff = await tx.get(
    actor.store
      .collection('departments')
      .doc(String(data.departmentId))
      .collection('staff')
      .doc(String(data.staffId))
  )
  return staffName(staff.data())
}

async function getOptional(tx: Transaction, ref: DocumentReference | null) {
  if (!ref) return null
  const snap = await tx.get(ref)
  return snap.exists ? (snap.data() as Record<string, unknown>) : null
}

export interface CreateSupplierReturnInput {
  itemId: string
  quantity: number
  supplierName: string
  supplierReference: string
  defect: string
  notes: string
}

/** Validates the supplier, fault and quantity fields of a return. */
export function parseSupplierDetails(
  input: Record<string, unknown>
): Omit<CreateSupplierReturnInput, 'itemId'> {
  const quantity = input.quantity === undefined ? 1 : Number(input.quantity)
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 100_000) {
    bad('Enter how many units are going back.')
  }
  const supplierName = cleanText(input.supplierName, 120)
  if (!supplierName) bad('Enter the supplier.', 'SUPPLIER_REQUIRED')
  const defect = cleanText(input.defect)
  if (defect.length < 3) bad('Describe what is wrong with it.', 'DEFECT_REQUIRED')
  return {
    quantity,
    supplierName,
    supplierReference: cleanText(input.supplierReference, 60),
    defect,
    notes: cleanText(input.notes, 1000),
  }
}

/** Validates a "log a defective item" request body. */
export function parseCreateSupplierReturn(
  input: Record<string, unknown>
): CreateSupplierReturnInput {
  return { itemId: assertId(input.itemId, 'itemId'), ...parseSupplierDetails(input) }
}

/** Where an item came from, read inside the caller's transaction (reads only). */
export async function readItemOrigin(tx: Transaction, actor: StoreActor, item: InventoryItem) {
  const owner = actor.store.firestore.collection('users').doc(actor.ownerId)
  const [addedByName, transfer, buyback, swapInReceipt] = await Promise.all([
    readPersonName(tx, actor, String(item.createdBy || '')),
    getOptional(
      tx,
      item.transferId ? owner.collection('storeTransfers').doc(String(item.transferId)) : null
    ),
    getOptional(
      tx,
      item.buybackId ? actor.store.collection('customerBuybacks').doc(String(item.buybackId)) : null
    ),
    getOptional(
      tx,
      item.swapInReceiptId
        ? actor.store.collection('receipts').doc(String(item.swapInReceiptId))
        : null
    ),
  ])
  return buildItemOrigin(item, { addedByName, transfer, buyback, swapInReceipt })
}

/** A customer return that ended up going back to the supplier (from the inspection list). */
export interface CustomerReturnLink {
  holdId: string
  receiptId: string
  receiptNumber: string
  customerName: string
  complaint: string
  returnedAt: Timestamp | null
}

/** The stored supplier return document. Shared by direct logging and inspection outcomes. */
export function supplierReturnRecord(
  actor: StoreActor,
  args: {
    item: InventoryItem
    itemSnapshot: Record<string, unknown> | null
    folderName: string
    serial: boolean
    origin: ReturnType<typeof buildItemOrigin>
    input: Omit<CreateSupplierReturnInput, 'itemId'>
    customerReturn?: CustomerReturnLink
  }
): Record<string, unknown> {
  const { item, input, serial } = args
  const unitCost = resolveItemUnitCost(item) ?? null
  return {
    storeId: actor.storeId,
    status: 'ready' satisfies SupplierReturnStatus,
    item: {
      inventoryItemId: item.id,
      folderId: String(item.folderId || ''),
      folderName: cleanText(args.folderName, 80) || 'Inventory',
      name: getInventoryItemDisplayName(item) || 'Item',
      details: snapshotStockItemDetails(item),
      serial,
      quantity: input.quantity,
      unitCost,
      inventoryAction: serial ? 'removed' : 'reduced',
    },
    // Kept so the unit could be restored exactly if the supplier sends it back repaired.
    itemSnapshot: args.itemSnapshot,
    origin: args.origin,
    ...(args.customerReturn && { customerReturn: args.customerReturn }),
    defect: input.defect,
    supplierName: input.supplierName,
    supplierReference: input.supplierReference,
    outcome: null,
    notes: input.notes,
    costValue: unitCost === null ? null : Math.round(unitCost * input.quantity * 100) / 100,
    history: [
      stripUndefined({
        status: 'ready',
        at: Timestamp.now(),
        byName: actor.displayName,
        note: input.defect,
      }),
    ],
    createdAt: FieldValue.serverTimestamp(),
    createdBy: actor.uid,
    createdByName: actor.displayName,
    sentAt: null,
    closedAt: null,
    updatedAt: FieldValue.serverTimestamp(),
  }
}

/** Activity log entry for a new supplier return. */
export function logSupplierReturnCreated(
  tx: Transaction,
  actor: StoreActor,
  args: {
    returnId: string
    name: string
    folderName: string
    serial: boolean
    unitCost: number | null
    input: Omit<CreateSupplierReturnInput, 'itemId'>
    fromInspection?: string
  }
): void {
  if (!planHasFeature(actor.plan, 'activity_logs')) return
  const { input, serial, unitCost } = args
  logSaleActivity(tx, actor, {
    action: 'deleted',
    entityType: 'supplierReturn',
    entityId: args.returnId,
    entityName: `Returned to ${input.supplierName}: ${args.name}${
      serial ? '' : ` × ${input.quantity}`
    } (${input.defect})`,
    details: {
      facts: [
        { label: 'Item', value: args.name },
        { label: 'Category', value: args.folderName || 'Inventory' },
        ...(serial ? [] : [{ label: 'Units', value: String(input.quantity) }]),
        { label: 'Supplier', value: input.supplierName },
        { label: 'Fault', value: input.defect },
        ...(args.fromInspection ? [{ label: 'Customer return', value: args.fromInspection }] : []),
        ...(unitCost === null
          ? []
          : [
              {
                label: 'Cost',
                value: unitCost * input.quantity,
                money: true,
                tone: 'bad' as const,
              },
            ]),
      ],
      link: { label: 'Open returns', path: '/supplier-returns' },
    },
  })
}

/**
 * Logs a defective in-stock item as a supplier return and takes it out of stock. Refuses a unit
 * that isn't free to leave: sold, held on an order, out on a stock loan, or waiting for inspection
 * (those are decided from the inspection list).
 */
export async function createSupplierReturn(
  db: Firestore,
  actor: StoreActor,
  raw: Record<string, unknown>
): Promise<{ returnId: string }> {
  if (!canManageSupplierReturns(actor)) {
    forbid('You don’t have permission to take stock out for supplier returns.')
  }
  assertSupplierReturnsPlan(actor)
  const input = parseCreateSupplierReturn(raw)
  const itemRef = actor.store.collection('inventoryItems').doc(input.itemId)
  const returnRef = actor.store.collection(SUPPLIER_RETURNS_COLLECTION).doc()

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(itemRef)
    if (!snap.exists) conflict('This product no longer exists.', 'ITEM_MISSING')
    const item = { id: snap.id, ...(snap.data() as Record<string, unknown>) } as InventoryItem
    const name = getInventoryItemDisplayName(item) || 'This product'
    if (item.storeId && item.storeId !== actor.storeId) {
      conflict(`${name} belongs to another branch.`, 'ITEM_OTHER_STORE')
    }
    const folderRef = actor.store.collection('inventoryFolders').doc(String(item.folderId || '-'))
    const folder = (await tx.get(folderRef)).data() as InventoryFolder | undefined
    if (!actorCanUseCategory(actor, folder)) {
      forbid(`You can’t change stock in ${folder?.name || 'that category'}.`, 'CATEGORY_LOCKED')
    }
    if (item.inspectionHoldId) {
      conflict(
        `${name} is waiting for inspection. Decide what happens to it from the To inspect list.`,
        'ITEM_ON_INSPECTION'
      )
    }
    if (item.sellerLoanOutId) conflict(`${name} is out on a stock loan.`, 'ITEM_ON_LOAN')
    if (item.pendingSaleReceiptId) {
      conflict(`${name} is held on an outstanding order.`, 'ITEM_HELD')
    }

    const serial = folderHasSerialNumbers(folder)
    let stockUpdate: Record<string, unknown> | null = null
    if (serial) {
      if (item.dateOut) conflict(`${name} has already been sold.`, 'ITEM_SOLD')
      if (input.quantity !== 1) bad('A serial-numbered unit goes back one at a time.')
    } else {
      const stock = resolveBulkStockFieldAndValueFromMap(item, folder?.template?.fields)
      if (!stock) conflict(`${name} has no stock quantity to take from.`, 'NO_STOCK_FIELD')
      if (input.quantity > stock.value) {
        conflict(`Only ${stock.value} of ${name} in stock.`, 'INSUFFICIENT_STOCK')
      }
      stockUpdate = {
        [stock.fieldKey]: stock.value - input.quantity,
        updatedAt: FieldValue.serverTimestamp(),
      }
    }

    const origin = await readItemOrigin(tx, actor, item)
    const folderName = String(folder?.name || 'Inventory')

    // Writes only from here.
    tx.create(
      returnRef,
      supplierReturnRecord(actor, {
        item,
        itemSnapshot: snap.data() ?? null,
        folderName,
        serial,
        origin,
        input,
      })
    )
    if (serial) tx.delete(itemRef)
    else if (stockUpdate) tx.update(itemRef, stockUpdate)
    logSupplierReturnCreated(tx, actor, {
      returnId: returnRef.id,
      name,
      folderName,
      serial,
      unitCost: resolveItemUnitCost(item) ?? null,
      input,
    })
  })

  return { returnId: returnRef.id }
}

const OUTCOMES = Object.keys(SUPPLIER_RETURN_OUTCOME_LABELS) as SupplierReturnOutcome[]

/** Fields that describe a unit's past life (sold, held, lent, inspected): never restored. */
const RESTORE_DROP_KEYS = [
  'id',
  'dateOut',
  'soldPrice',
  'soldReceiptId',
  'listPriceAtSale',
  'priceChangedBy',
  'priceChangedByName',
  'pendingSaleReceiptId',
  'pendingSaleAt',
  'inspectionHoldId',
]
/** A replacement is a new unit: it didn't arrive by transfer, trade-in or swap. */
const REPLACEMENT_DROP_KEYS = [
  'transferId',
  'receivedBy',
  'receivedByName',
  'originalDateIn',
  'buyback',
  'buybackId',
  'buybackPrice',
  'swapIn',
  'swapInReceiptId',
]
const SERIAL_KEYS = ['serialNo', 'serialNumber', 'serial', 'imei', 'imei1', 'imeiNo', 'vin', 'VIN']

/** The field that holds the unit's serial / IMEI / VIN on a stored item, or `serialNo`. */
export function serialKeyOf(item: Record<string, unknown>): string {
  return SERIAL_KEYS.find((k) => typeof item[k] === 'string' && item[k] !== '') ?? 'serialNo'
}

/** The item as it should be restored to stock: sale, hold, loan and inspection traces removed. */
export function restoredItemData(
  snapshot: Record<string, unknown>,
  opts: { replacement: boolean; newSerial?: string }
): Record<string, unknown> {
  const out: Record<string, unknown> = { ...snapshot }
  for (const key of Object.keys(out)) {
    if (RESTORE_DROP_KEYS.includes(key) || key.startsWith('sellerLoan')) delete out[key]
  }
  if (opts.replacement) {
    for (const key of REPLACEMENT_DROP_KEYS) delete out[key]
    if (opts.newSerial) out[serialKeyOf(snapshot)] = opts.newSerial
  }
  return out
}

/**
 * Plans putting a repaired or replacement unit back in stock (reads only; `apply` writes).
 * - Repaired serial unit: restored under its old id, as it was before it went back.
 * - Replacement serial unit: a new row copied from the original with the new serial number.
 * - Bulk: units added back to the row (recreated from the snapshot if it was deleted since).
 */
async function planRestock(
  tx: Transaction,
  actor: StoreActor,
  ret: Record<string, unknown>,
  returnId: string,
  outcome: SupplierReturnOutcome,
  newSerialRaw: unknown
): Promise<{ apply: () => void; itemId: string; label: string }> {
  const item = (ret.item ?? {}) as Record<string, unknown>
  const snapshot = ret.itemSnapshot as Record<string, unknown> | null | undefined
  const name = String(item.name || 'Item')
  if (!snapshot || typeof snapshot !== 'object') {
    conflict(
      `There's no saved copy of ${name} to restore. Add it to inventory by hand.`,
      'NO_ITEM_SNAPSHOT'
    )
  }
  const serial = item.serial === true
  const quantity = Math.max(1, Math.floor(Number(item.quantity) || 1))
  const replacement = outcome === 'replacement'
  const folderRef = actor.store.collection('inventoryFolders').doc(String(item.folderId || '-'))
  const folder = (await tx.get(folderRef)).data() as InventoryFolder | undefined
  if (!folder)
    conflict(`The ${String(item.folderName || '')} category no longer exists.`, 'NO_FOLDER')
  const stamp = {
    storeId: actor.storeId,
    returnedFromSupplier: {
      returnId,
      supplierName: String(ret.supplierName || ''),
      outcome,
      at: Timestamp.now(),
    },
    updatedAt: FieldValue.serverTimestamp(),
  }

  if (serial) {
    let newSerial = ''
    if (replacement) {
      newSerial = cleanText(newSerialRaw, 80)
      if (!newSerial) bad('Enter the serial number of the replacement unit.', 'SERIAL_REQUIRED')
    }
    const itemRef = replacement
      ? actor.store.collection('inventoryItems').doc()
      : actor.store.collection('inventoryItems').doc(String(item.inventoryItemId || '-'))
    if (!replacement && (await tx.get(itemRef)).exists) {
      conflict(`${name} is already in inventory.`, 'ALREADY_IN_STOCK')
    }
    const data = {
      ...restoredItemData(snapshot, { replacement, newSerial }),
      ...stamp,
      ...(replacement && {
        createdAt: FieldValue.serverTimestamp(),
        createdBy: actor.uid,
      }),
    }
    return {
      itemId: itemRef.id,
      label: replacement ? `Replacement unit (${newSerial}) added to stock` : 'Back in stock',
      apply: () => tx.set(itemRef, data),
    }
  }

  const itemRef = actor.store.collection('inventoryItems').doc(String(item.inventoryItemId || '-'))
  const existing = await tx.get(itemRef)
  if (existing.exists) {
    const stock = resolveBulkStockFieldAndValueFromMap(
      existing.data() ?? {},
      folder.template?.fields
    )
    if (!stock) conflict(`${name} has no stock quantity to add back to.`, 'NO_STOCK_FIELD')
    return {
      itemId: itemRef.id,
      label: `${quantity} back in stock`,
      apply: () =>
        tx.update(itemRef, {
          [stock.fieldKey]: stock.value + quantity,
          updatedAt: FieldValue.serverTimestamp(),
        }),
    }
  }
  const stock = resolveBulkStockFieldAndValueFromMap(snapshot, folder.template?.fields)
  const data = {
    ...restoredItemData(snapshot, { replacement }),
    ...stamp,
    [stock?.fieldKey ?? 'quantity']: quantity,
  }
  return {
    itemId: itemRef.id,
    label: `${quantity} back in stock`,
    apply: () => tx.set(itemRef, data),
  }
}

/** Moves a return along: sent to the supplier, then resolved or rejected. Edits keep the status. */
export async function updateSupplierReturn(
  db: Firestore,
  actor: StoreActor,
  input: Record<string, unknown>
): Promise<{ status: SupplierReturnStatus }> {
  if (!canManageSupplierReturns(actor)) {
    forbid('You don’t have permission to manage supplier returns.')
  }
  const returnId = assertId(input.returnId, 'returnId')
  const action = String(input.action || '')
  const note = cleanText(input.note)
  const ref = actor.store.collection(SUPPLIER_RETURNS_COLLECTION).doc(returnId)

  return db.runTransaction(async (tx) => {
    const snap = await tx.get(ref)
    if (!snap.exists) throw createError({ statusCode: 404, message: 'Supplier return not found' })
    const current = snap.data() ?? {}
    const status = current.status as SupplierReturnStatus
    const closed = status === 'resolved' || status === 'rejected'

    const update: Record<string, unknown> = { updatedAt: FieldValue.serverTimestamp() }
    let next: SupplierReturnStatus = status
    let logLabel = ''
    let restock: Awaited<ReturnType<typeof planRestock>> | null = null

    if (action === 'send') {
      if (status !== 'ready')
        conflict('Only a return that is ready can be sent.', 'INVALID_TRANSITION')
      const supplierName =
        cleanText(input.supplierName, 120) || cleanText(current.supplierName, 120)
      if (!supplierName) bad('Enter the supplier.', 'SUPPLIER_REQUIRED')
      next = 'with_supplier'
      update.supplierName = supplierName
      if (input.supplierReference !== undefined) {
        update.supplierReference = cleanText(input.supplierReference, 60)
      }
      update.sentAt = FieldValue.serverTimestamp()
      logLabel = `Sent to ${supplierName}`
    } else if (action === 'resolve') {
      if (closed) conflict('This return is already closed.', 'INVALID_TRANSITION')
      const outcome = String(input.outcome || '') as SupplierReturnOutcome
      if (!OUTCOMES.includes(outcome)) bad('Choose what the supplier did.')
      next = 'resolved'
      update.outcome = outcome
      update.closedAt = FieldValue.serverTimestamp()
      logLabel = SUPPLIER_RETURN_OUTCOME_LABELS[outcome]
      // Repaired or replaced stock is physically back: it goes back on sale in the same step.
      if (RESTOCK_OUTCOMES.includes(outcome)) {
        restock = await planRestock(tx, actor, current, returnId, outcome, input.newSerial)
      }
    } else if (action === 'reject') {
      if (closed) conflict('This return is already closed.', 'INVALID_TRANSITION')
      next = 'rejected'
      update.outcome = null
      update.closedAt = FieldValue.serverTimestamp()
      logLabel = 'Rejected by supplier'
    } else if (action === 'restock') {
      // For returns closed as repaired or replaced before stock went back automatically.
      const outcome = current.outcome as SupplierReturnOutcome
      if (status !== 'resolved' || !RESTOCK_OUTCOMES.includes(outcome)) {
        conflict('Only a repaired or replaced return goes back into stock.', 'NOT_RESTOCKABLE')
      }
      if (current.restockedAt) conflict('This item is already back in stock.', 'ALREADY_RESTOCKED')
      restock = await planRestock(tx, actor, current, returnId, outcome, input.newSerial)
      logLabel = restock.label
    } else if (action === 'edit') {
      if (input.supplierName !== undefined) {
        const supplierName = cleanText(input.supplierName, 120)
        if (!supplierName) bad('Enter the supplier.', 'SUPPLIER_REQUIRED')
        update.supplierName = supplierName
      }
      if (input.supplierReference !== undefined) {
        update.supplierReference = cleanText(input.supplierReference, 60)
      }
      if (input.notes !== undefined) update.notes = cleanText(input.notes, 1000)
    } else {
      bad('Unknown action')
    }

    if (restock) {
      if (current.restockedAt) conflict('This item is already back in stock.', 'ALREADY_RESTOCKED')
      update.restockedAt = FieldValue.serverTimestamp()
      update.restockedItemId = restock.itemId
      restock.apply()
      if (action === 'resolve') logLabel = `${logLabel} · ${restock.label.toLowerCase()}`
    }

    const events: Record<string, unknown>[] = []
    if (next !== status) {
      events.push(
        stripUndefined({
          status: next,
          at: Timestamp.now(),
          byName: actor.displayName,
          note: note || undefined,
        })
      )
    }
    if (restock) {
      events.push({
        status: 'resolved',
        at: Timestamp.now(),
        byName: actor.displayName,
        note: restock.label,
      })
    }
    if (events.length) update.history = FieldValue.arrayUnion(...events)
    if (next !== status) update.status = next
    tx.update(ref, update)

    if (logLabel && planHasFeature(actor.plan, 'activity_logs')) {
      const item = (current.item ?? {}) as { name?: string }
      const supplier = String(update.supplierName || current.supplierName || '')
      logSaleActivity(tx, actor, {
        action: 'updated',
        entityType: 'supplierReturn',
        entityId: returnId,
        entityName: `Supplier return · ${item.name || 'Item'}: ${logLabel}`,
        details: {
          facts: [
            { label: 'Item', value: String(item.name || 'Item') },
            ...(supplier ? [{ label: 'Supplier', value: supplier }] : []),
            ...(note ? [{ label: 'Note', value: note }] : []),
          ],
          link: { label: 'Open returns', path: '/supplier-returns' },
        },
      })
    }
    return { status: next }
  })
}
