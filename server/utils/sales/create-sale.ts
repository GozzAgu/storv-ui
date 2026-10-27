import { createError } from 'h3'
import {
  FieldValue,
  Timestamp,
  type DocumentReference,
  type DocumentSnapshot,
  type Firestore,
} from 'firebase-admin/firestore'
import type { InventoryFolder, InventoryItem } from '~/stores/inventory'
import { planHasFeature } from '~/types/subscription'
import {
  getInventoryItemDisplayName,
  getInventoryItemField,
} from '~/composables/useInventoryItemDisplay'
import { getReceiptProductDetails } from '~/composables/useReceiptProductDetails'
import { normalizeEntityName, normalizeInventoryItemNamedFields } from '~/utils/capitalize-text'
import { resolveBulkStockFieldAndValueFromMap } from '~/utils/inventory-bulk-quantity'
import { hasSaleUnitPrice } from '~/utils/inventory-item-price'
import { resolveItemUnitCost } from '~/utils/inventory-item-cost'
import { folderHasSerialNumbers } from '~/utils/receipt-multi-folder'
import { computeBalanceDue, roundMoney } from '~/utils/receipt-balance'
import {
  SalePricingError,
  computeSaleTotals,
  priceSaleLine,
  splitPaymentsMatch,
  type PricedLine,
} from '~/utils/sale-pricing'
import {
  isSwapInPriceField,
  swapInCredit,
  swapInCreditField,
  swapInFormFields,
} from '~/utils/swap-in-credit'
import {
  actorCanApproveDiscounts,
  actorCanUseCategory,
  assertId,
  forbid,
  resolveStoreActor,
  type StoreActor,
} from './actor'
import { verifyApprovalPin } from './approval-pin'
import { logSaleActivity } from './records'

/** Most lines one sale may carry (each line is up to two writes in one transaction). */
export const MAX_SALE_LINES = 150
/** How old a sale saved offline on a till may be when it finally reaches the server. */
export const MAX_OFFLINE_AGE_MS = 72 * 60 * 60_000
const MAX_CLOCK_SKEW_MS = 5 * 60_000

export interface SaleLineRequest {
  itemId: string
  quantity: number
  /** Checkout discount per unit. */
  discountAmount?: number
}

export interface CreateSaleRequest {
  saleId: string
  /** True when a till is replaying a sale it saved while offline. */
  offlineReplay?: boolean
  /** When the till recorded the sale. Only honoured for an offline replay. */
  clientCreatedAt?: string
  /** The total the till showed the customer, for an offline replay (prices may change meanwhile). */
  clientTotal?: number
  source?: 'pos' | 'quick_sale'
  lines: SaleLineRequest[]
  customer?: { name?: string; email?: string; phone?: string; address?: string }
  payment?: { method?: string; split?: Array<{ method: string; amount: number }> }
  settlement?: 'paid_in_full' | 'balance_due'
  deposit?: number
  notes?: string
  discountReason?: string
  swapIn?: { folderId: string; fields: Record<string, unknown>; swapValue?: number }
  commission?: { amount?: number; owedToName?: string; owedToUid?: string }
  approval?: { approverUid: string; pin: string }
}

export interface CreatedSale {
  receiptId: string
  receipt: Record<string, unknown>
  /** False when this sale was already recorded (an offline retry). */
  created: boolean
  swapInItemId: string | null
  unpricedSwapInName: string | null
}

function bad(message: string, code = 'INVALID_SALE'): never {
  throw createError({ statusCode: 400, message, data: { code } })
}

function conflict(message: string, code: string): never {
  throw createError({ statusCode: 409, message, data: { code } })
}

function text(value: unknown, max: number): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : ''
}

function money(value: unknown, field: string): number {
  const n = Number(value ?? 0)
  if (!Number.isFinite(n) || n < 0 || n > 1e12) bad(`${field} is invalid`)
  return roundMoney(n)
}

const SWAP_FIELD_KEY = /^[A-Za-z][A-Za-z0-9_]{0,39}$/
/** Inventory fields only the server sets on a trade-in item. */
const RESERVED_ITEM_KEYS = new Set([
  'id',
  'folderId',
  'storeId',
  'createdAt',
  'updatedAt',
  'createdBy',
  'dateIn',
  'dateOut',
  'swapIn',
  'swapInReceiptId',
  'unitCost',
  'buyback',
  'buybackPrice',
  'pendingSaleReceiptId',
  'pendingSaleAt',
  'sellerLoanOutId',
  'sellerLoanPartyName',
  'sellerLoanPartyPhone',
  'sellerLoanOutAt',
  'discountedPrice',
  'originalPrice',
  'discountAmount',
  'discountPercentage',
  'allowedDepartments',
  'allowedStaff',
])

/** Only the category's own form fields, with plain values, end up on the trade-in item. */
function cleanSwapInFields(
  raw: Record<string, unknown>,
  allowed: Set<string>
): Record<string, string | number | boolean> {
  const out: Record<string, string | number | boolean> = {}
  for (const [key, value] of Object.entries(raw ?? {})) {
    if (!allowed.has(key) || !SWAP_FIELD_KEY.test(key) || RESERVED_ITEM_KEYS.has(key)) continue
    if (typeof value === 'string') {
      const v = value.trim().slice(0, 300)
      if (v) out[key] = v
    } else if (typeof value === 'number' && Number.isFinite(value)) {
      out[key] = value
    } else if (typeof value === 'boolean') {
      out[key] = value
    }
  }
  return out
}

/** When the sale happened: now, or the till's time for a sale queued offline (bounded). */
export function resolveSaleDate(clientCreatedAt: unknown, now: number): Date {
  if (clientCreatedAt === undefined || clientCreatedAt === null || clientCreatedAt === '') {
    return new Date(now)
  }
  const ms = Date.parse(String(clientCreatedAt))
  if (!Number.isFinite(ms)) bad('clientCreatedAt is invalid')
  if (ms > now + MAX_CLOCK_SKEW_MS) bad('This sale is dated in the future. Check the till’s clock.')
  if (ms < now - MAX_OFFLINE_AGE_MS) {
    bad(
      'This sale was saved offline more than 3 days ago and can no longer be recorded. Enter it again.',
      'OFFLINE_SALE_TOO_OLD'
    )
  }
  return new Date(Math.min(ms, now))
}

export function parseCreateSaleRequest(body: Record<string, unknown>): CreateSaleRequest {
  const saleId = assertId(body.saleId, 'saleId')
  const rawLines = Array.isArray(body.lines) ? body.lines : []
  if (rawLines.length === 0) bad('Add at least one product.')
  if (rawLines.length > MAX_SALE_LINES) {
    bad(`A sale can have at most ${MAX_SALE_LINES} lines. Split it into two sales.`)
  }
  const lines = rawLines.map((raw) => {
    const line = (raw ?? {}) as Record<string, unknown>
    const quantity = Number(line.quantity ?? 1)
    if (!Number.isFinite(quantity) || quantity < 1 || quantity > 100_000) {
      bad('Check the product quantities.')
    }
    return {
      itemId: assertId(line.itemId, 'itemId'),
      quantity: Math.floor(quantity),
      discountAmount: money(line.discountAmount, 'discountAmount'),
    }
  })
  if (new Set(lines.map((l) => l.itemId)).size !== lines.length) {
    bad('A product appears twice in this sale.')
  }

  const settlement = body.settlement === 'balance_due' ? 'balance_due' : 'paid_in_full'
  const payment = (body.payment ?? {}) as Record<string, unknown>
  const split = Array.isArray(payment.split)
    ? payment.split.slice(0, 10).map((raw) => {
        const p = (raw ?? {}) as Record<string, unknown>
        return { method: text(p.method, 60) || 'Cash', amount: money(p.amount, 'split amount') }
      })
    : undefined

  const swapRaw = body.swapIn as Record<string, unknown> | undefined
  const commissionRaw = body.commission as Record<string, unknown> | undefined
  const approvalRaw = body.approval as Record<string, unknown> | undefined
  const customer = (body.customer ?? {}) as Record<string, unknown>

  // Only a sale replayed from a till's offline queue may carry its own time and total; an online
  // sale is always dated now, so nobody can backdate a sale they are recording live.
  const offlineReplay = body.offlineReplay === true
  return {
    saleId,
    offlineReplay,
    clientCreatedAt:
      offlineReplay && typeof body.clientCreatedAt === 'string' ? body.clientCreatedAt : undefined,
    clientTotal:
      offlineReplay && body.clientTotal !== undefined && body.clientTotal !== null
        ? money(body.clientTotal, 'clientTotal')
        : undefined,
    source: body.source === 'quick_sale' ? 'quick_sale' : 'pos',
    lines,
    customer: {
      name: text(customer.name, 120),
      email: text(customer.email, 200).toLowerCase(),
      phone: text(customer.phone, 40),
      address: text(customer.address, 300),
    },
    payment: {
      method: text(payment.method, 60) || 'Cash',
      split: split?.length ? split : undefined,
    },
    settlement,
    deposit: money(body.deposit, 'deposit'),
    notes: text(body.notes, 1000),
    discountReason: text(body.discountReason, 500),
    swapIn: swapRaw
      ? {
          folderId: assertId(swapRaw.folderId, 'swapIn.folderId'),
          fields:
            swapRaw.fields && typeof swapRaw.fields === 'object'
              ? (swapRaw.fields as Record<string, unknown>)
              : {},
          swapValue: money(swapRaw.swapValue, 'swap value'),
        }
      : undefined,
    commission:
      commissionRaw && Number(commissionRaw.amount) > 0
        ? {
            amount: money(commissionRaw.amount, 'commission'),
            owedToName: text(commissionRaw.owedToName, 120),
            owedToUid: commissionRaw.owedToUid
              ? assertId(commissionRaw.owedToUid, 'commission.owedToUid')
              : undefined,
          }
        : undefined,
    approval: approvalRaw
      ? {
          approverUid: assertId(approvalRaw.approverUid, 'approverUid'),
          pin: text(approvalRaw.pin, 6),
        }
      : undefined,
  }
}

interface LoadedLine {
  request: SaleLineRequest
  snap: DocumentSnapshot
  item: InventoryItem
  folder: InventoryFolder | undefined
  serial: boolean
  priced: PricedLine
}

function priceLines(
  actor: StoreActor,
  input: CreateSaleRequest,
  itemSnaps: DocumentSnapshot[],
  folders: Map<string, InventoryFolder | undefined>,
  receiptId: string
): LoadedLine[] {
  return input.lines.map((request, i) => {
    const snap = itemSnaps[i]!
    if (!snap.exists) conflict('A product in this sale no longer exists.', 'ITEM_MISSING')
    const item = { id: snap.id, ...(snap.data() as Record<string, unknown>) } as InventoryItem
    const name = getInventoryItemDisplayName(item) || 'A product'
    if (item.storeId && item.storeId !== actor.storeId) {
      conflict(`${name} belongs to another branch.`, 'ITEM_OTHER_STORE')
    }
    const folder = folders.get(String(item.folderId || ''))
    if (!actorCanUseCategory(actor, folder)) {
      forbid(`You can’t sell from ${folder?.name || 'that category'}.`, 'CATEGORY_LOCKED')
    }
    const loan = String(item.sellerLoanOutId || '')
    if (loan.startsWith('trade~')) {
      conflict(`${name} is lent to a partner and can’t be sold here.`, 'ITEM_ON_PARTNER_LOAN')
    }
    const hold = String(item.pendingSaleReceiptId || '')
    if (hold && hold !== receiptId) {
      conflict(`${name} is held on another outstanding order.`, 'ITEM_HELD')
    }
    const serial = folderHasSerialNumbers(folder)
    if (serial && item.dateOut) conflict(`${name} has already been sold.`, 'ITEM_SOLD')
    if (!hasSaleUnitPrice(item)) {
      conflict(`${name} has no Unit Price. Set one in Inventory first.`, 'ITEM_NO_PRICE')
    }

    let priced: PricedLine
    try {
      priced = priceSaleLine({
        item,
        quantity: request.quantity,
        serial,
        discountPerUnit: request.discountAmount ?? 0,
      })
    } catch (err) {
      if (err instanceof SalePricingError) bad(err.message)
      throw err
    }
    return { request, snap, item, folder, serial, priced }
  })
}

/**
 * Approval is needed for a discount above the staff limit or a trade-in, unless the seller may
 * approve such things themselves. Checked before the transaction because a wrong PIN is recorded.
 */
async function requireApproval(
  db: Firestore,
  actor: StoreActor,
  approval: CreateSaleRequest['approval'],
  reason: string
): Promise<string> {
  if (actorCanApproveDiscounts(actor)) return actor.uid
  if (!approval) {
    throw createError({
      statusCode: 403,
      message: `${reason} A manager must approve it with their PIN.`,
      data: { code: 'APPROVAL_REQUIRED' },
    })
  }
  if (approval.approverUid === actor.uid) forbid('You can’t approve your own sale.')
  const approver = await resolveStoreActor(db, approval.approverUid, actor.ownerId, actor.storeId, {
    write: false,
  }).catch(() => null)
  if (!approver || !actorCanApproveDiscounts(approver)) {
    forbid('That person can’t approve discounts in this branch.', 'NOT_AN_APPROVER')
  }
  await verifyApprovalPin(db, actor.ownerId, approval.approverUid, approval.pin)
  return approval.approverUid
}

function approvalReasonFor(lines: LoadedLine[], hasSwapIn: boolean): string | null {
  if (lines.some((l) => l.priced.needsApproval)) return 'This sale has a discount above 10%.'
  if (hasSwapIn) return 'This sale takes a trade-in.'
  return null
}

/**
 * Records a sale. Prices, discounts, trade-in credit, totals, stock and who sold it are all
 * worked out here; the client only says what was sold and how it was paid. Safe to retry with
 * the same `saleId` (offline queue): the second call returns the first sale.
 */
export async function createSale(
  db: Firestore,
  actor: StoreActor,
  input: CreateSaleRequest,
  now = Date.now()
): Promise<CreatedSale> {
  if (!actor.isOwner && !actor.permissions.receipts.create) {
    forbid('You don’t have permission to record sales.')
  }
  if (input.commission && !actor.canManageCommissions) {
    forbid('Only the owner or a branch admin with commission access can add a commission.')
  }
  const isBalanceDue = input.settlement === 'balance_due'
  if (isBalanceDue && input.payment?.split) bad('Split payments can’t be used with a deposit.')
  if (input.swapIn && isBalanceDue) bad('A trade-in can’t be part of a balance-due order.')
  const saleDate = resolveSaleDate(input.clientCreatedAt, now)

  const store = actor.store
  const receiptRef = store.collection('receipts').doc(input.saleId)
  const itemRefs = input.lines.map((l) => store.collection('inventoryItems').doc(l.itemId))

  // Idempotent retry: a queued sale that already reached the server.
  const existing = await receiptRef.get()
  if (existing.exists) return alreadyRecorded(actor, existing)

  // Approval is decided from a first read; the transaction re-prices and refuses if it changed.
  const preItems = await db.getAll(...itemRefs)
  const preFolders = await loadFolders(db, store, preItems, input.swapIn?.folderId)
  const preLines = priceLines(actor, input, preItems, preFolders, input.saleId)
  const reason = approvalReasonFor(preLines, !!input.swapIn)
  const approvedBy = reason ? await requireApproval(db, actor, input.approval, reason) : null
  const v2 = await paymentsV2On()

  const result = await db.runTransaction(async (tx) => {
    // ---- reads (all of them before any write)
    const again = await tx.get(receiptRef)
    if (again.exists) return { done: alreadyRecorded(actor, again) }

    const [storeSnap, ownerSnap, ...itemSnaps] = await tx.getAll(
      store,
      db.collection('users').doc(actor.ownerId),
      ...itemRefs
    )
    const folderIds = new Set(
      itemSnaps.map((s) => String(s.data()?.folderId || '')).filter((id) => /^[\w-]+$/.test(id))
    )
    if (input.swapIn) folderIds.add(input.swapIn.folderId)
    const folderSnaps = folderIds.size
      ? await tx.getAll(...[...folderIds].map((id) => store.collection('inventoryFolders').doc(id)))
      : []
    const folders = new Map(
      folderSnaps.map((s) => [s.id, s.exists ? (s.data() as InventoryFolder) : undefined])
    )

    const lines = priceLines(actor, input, itemSnaps, folders, input.saleId)
    const nowReason = approvalReasonFor(lines, !!input.swapIn)
    if (nowReason && !approvedBy) {
      conflict('Prices changed while saving. Review the sale and try again.', 'PRICES_CHANGED')
    }

    // Bulk stock is checked per row; serial rows were checked in priceLines.
    for (const line of lines) {
      if (line.serial) continue
      const stock = resolveBulkStockFieldAndValueFromMap(
        line.snap.data() ?? {},
        line.folder?.template?.fields
      )
      if (!stock) {
        conflict(
          `${getInventoryItemDisplayName(line.item)} has no quantity field.`,
          'ITEM_NO_STOCK_FIELD'
        )
      }
      if (!isBalanceDue && stock.value < line.priced.quantity) {
        conflict(
          `Not enough ${getInventoryItemDisplayName(line.item)} in stock.`,
          'INSUFFICIENT_STOCK'
        )
      }
    }

    // Stock loans whose items are sold here lose those lines.
    const loanIds = isBalanceDue
      ? []
      : [
          ...new Set(
            lines
              .map((l) => String(l.item.sellerLoanOutId || ''))
              .filter((id) => id && /^[\w-]+$/.test(id))
          ),
        ]
    const loanSnaps = loanIds.length
      ? await tx.getAll(...loanIds.map((id) => store.collection('sellerLoanOuts').doc(id)))
      : []

    // Trade-in: credit comes from the category's cost field (or the swap value), never the client.
    let swapIn: {
      ref: DocumentReference
      data: Record<string, unknown>
      credit: number
      name: string
      unpriced: boolean
    } | null = null
    if (input.swapIn) {
      const folder = folders.get(input.swapIn.folderId)
      if (!folder) conflict('The trade-in category no longer exists.', 'SWAP_FOLDER_MISSING')
      if (!actorCanUseCategory(actor, folder)) {
        forbid(`You can’t add items to ${folder.name || 'that category'}.`, 'CATEGORY_LOCKED')
      }
      const formFields = swapInFormFields(folder)
      const fields = cleanSwapInFields(input.swapIn.fields, new Set(formFields.map((f) => f.name)))
      for (const field of formFields) {
        if (
          isSwapInPriceField(field) &&
          (fields[field.name] === undefined || fields[field.name] === '')
        ) {
          delete fields[field.name]
        }
      }
      // The credit field is often `unitCost` (a profit-tracking category's "Cost price"), which
      // cleanSwapInFields drops because the server sets the new item's cost itself. Read the
      // credit from what was entered, then store it as `unitCost` below.
      const creditField = swapInCreditField(formFields)
      const enteredCredit =
        creditField && formFields.some((f) => f.name === creditField)
          ? { [creditField]: input.swapIn.fields[creditField] }
          : {}
      const credit = swapInCredit(
        formFields,
        { ...fields, ...enteredCredit },
        input.swapIn.swapValue
      )
      if (credit <= 0) bad('Enter what you are giving the customer for the trade-in.')

      const serialNo = String(fields.serialNo ?? '').trim()
      if (serialNo) {
        const dup = await tx.get(
          store
            .collection('inventoryItems')
            .where('folderId', '==', input.swapIn.folderId)
            .where('serialNo', '==', serialNo)
            .limit(1)
        )
        if (!dup.empty) {
          conflict(
            `An item with serial number "${serialNo}" is already in stock.`,
            'SWAP_SERIAL_DUPLICATE'
          )
        }
      }

      normalizeInventoryItemNamedFields(fields as Record<string, unknown>)
      const ref = store.collection('inventoryItems').doc()
      const data: Record<string, unknown> = {
        ...fields,
        swapIn: true,
        unitCost: credit,
        swapInReceiptId: input.saleId,
        folderId: input.swapIn.folderId,
        storeId: actor.storeId,
        createdBy: actor.ownerId,
      }
      swapIn = {
        ref,
        data,
        credit,
        name: getInventoryItemDisplayName(data as InventoryItem) || 'Trade-in item',
        unpriced: !hasSaleUnitPrice(data),
      }
    }

    // ---- money
    const totals = computeSaleTotals(
      lines.map((l) => l.priced),
      swapIn?.credit ?? 0,
      input.commission?.amount ?? 0
    )
    if (swapIn && swapIn.credit > totals.subtotal) {
      bad('The trade-in is worth more than the items being bought.')
    }
    const anyCheckoutDiscount = lines.some((l) => l.priced.discountPerUnit > 0)
    if (anyCheckoutDiscount && !input.discountReason) bad('Give a reason for the discount.')
    const deposit = isBalanceDue ? input.deposit ?? 0 : 0
    if (isBalanceDue && deposit >= totals.total) {
      bad('The deposit covers the whole sale. Record it as paid in full instead.')
    }
    if (input.payment?.split && !splitPaymentsMatch(input.payment.split, totals.total)) {
      bad('The split payments don’t add up to the total.')
    }

    const storeData = storeSnap!.data() ?? {}
    const owner = ownerSnap!.data() ?? {}
    const customerName = normalizeEntityName(input.customer?.name || '') || 'Walk-in Customer'
    const folderList = [...new Set(lines.map((l) => String(l.item.folderId || '')).filter(Boolean))]
    const offline = input.clientCreatedAt !== undefined && saleDate.getTime() < now - 60_000
    // A price can change while a till is offline: keep the server's total, but say so.
    const priceChangedOffline =
      input.offlineReplay === true &&
      input.clientTotal !== undefined &&
      Math.abs(input.clientTotal - totals.total) >= 0.01

    const receipt: Record<string, unknown> = {
      receiptNumber: receiptNumberFor(input.saleId),
      customerName,
      customerEmail: input.customer?.email || '',
      ...(input.customer?.phone && { customerPhone: input.customer.phone }),
      ...(input.customer?.address && { customerAddress: input.customer.address }),
      date: Timestamp.fromDate(saleDate),
      items: lines.map((l) => receiptLine(l)),
      itemsCount: lines.reduce((n, l) => n + l.priced.quantity, 0),
      total: totals.total,
      paymentMethod: input.payment?.split ? 'Split Payment' : input.payment?.method || 'Cash',
      status: isBalanceDue ? 'balance_due' : 'completed',
      notes: input.source === 'quick_sale' && !input.notes ? 'Quick Sale' : input.notes || '',
      hasSerialNumbers: lines.some((l) => l.serial),
      folderId: folderList[0] || '',
      folderIds: folderList,
      itemIds: lines.map((l) => l.request.itemId),
      storeId: actor.storeId,
      storeBranchName: String(storeData.name || 'Store'),
      storeLogoUrl: String(storeData.logoUrl || owner.storeLogoUrl || ''),
      createdByUserName: actor.displayName,
      createdBy: actor.ownerId,
      actualCreator: actor.uid,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      source: input.source === 'quick_sale' ? 'quick_sale' : 'pos',
      ...(offline && { recordedOffline: true }),
      ...(priceChangedOffline && { priceChangedOffline: true, clientTotal: input.clientTotal }),
      ...(approvedBy && approvedBy !== actor.uid && { approvedBy }),
    }
    if (isBalanceDue) {
      Object.assign(
        receipt,
        v2
          ? { amountPaid: 0, balanceDue: totals.total, payments: [] }
          : {
              amountPaid: deposit,
              balanceDue: computeBalanceDue(totals.total, deposit),
              payments:
                deposit > 0
                  ? [
                      {
                        amount: deposit,
                        method: input.payment?.method || 'Cash',
                        paidAt: Timestamp.fromDate(saleDate),
                        recordedBy: actor.uid,
                      },
                    ]
                  : [],
            }
      )
    }
    if (v2) receipt.paymentsV2 = true
    if (input.payment?.split) receipt.splitPayments = input.payment.split
    if (anyCheckoutDiscount) receipt.discountReason = input.discountReason
    if (swapIn) {
      Object.assign(receipt, {
        isSwapIn: true,
        swapInFolderId: input.swapIn!.folderId,
        swapInItemId: swapIn.ref.id,
        swapInCredit: totals.swapInCredit,
      })
    }
    if (input.commission) {
      Object.assign(receipt, {
        commissionAmount: totals.commission,
        commissionStatus: 'owed',
        ...(input.commission.owedToName && { commissionOwedToName: input.commission.owedToName }),
        ...(input.commission.owedToUid && { commissionOwedToUid: input.commission.owedToUid }),
      })
    }

    // ---- writes
    tx.create(receiptRef, receipt)

    const soldAt = Timestamp.fromDate(saleDate)
    const clearLoan = {
      sellerLoanOutId: FieldValue.delete(),
      sellerLoanPartyName: FieldValue.delete(),
      sellerLoanPartyPhone: FieldValue.delete(),
      sellerLoanOutAt: FieldValue.delete(),
    }
    for (const line of lines) {
      if (isBalanceDue) {
        tx.update(line.snap.ref, {
          pendingSaleReceiptId: input.saleId,
          pendingSaleAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        })
        continue
      }
      const common = {
        pendingSaleReceiptId: FieldValue.delete(),
        pendingSaleAt: FieldValue.delete(),
        updatedAt: FieldValue.serverTimestamp(),
        ...(line.item.sellerLoanOutId ? clearLoan : {}),
      }
      if (line.serial) {
        tx.update(line.snap.ref, { ...common, dateOut: soldAt })
      } else {
        const stock = resolveBulkStockFieldAndValueFromMap(
          line.snap.data() ?? {},
          line.folder?.template?.fields
        )!
        tx.update(line.snap.ref, {
          ...common,
          [stock.fieldKey]: stock.value - line.priced.quantity,
          dateOut: FieldValue.delete(),
        })
      }
    }

    const soldByLoan = new Map<string, Set<string>>()
    for (const line of lines) {
      const loanId = String(line.item.sellerLoanOutId || '')
      if (!loanIds.includes(loanId)) continue
      if (!soldByLoan.has(loanId)) soldByLoan.set(loanId, new Set())
      soldByLoan.get(loanId)!.add(line.request.itemId)
    }
    for (const snap of loanSnaps) {
      const data = snap.data()
      if (!snap.exists || !data || data.status === 'returned' || data.status === 'sold') continue
      const sold = soldByLoan.get(snap.id)
      if (!sold) continue
      const rawLines = Array.isArray(data.lines)
        ? (data.lines as Array<{ inventoryItemId: string }>)
        : []
      const kept = rawLines.filter((l) => !sold.has(l.inventoryItemId))
      if (kept.length === rawLines.length) continue
      tx.update(snap.ref, {
        lines: kept,
        updatedAt: FieldValue.serverTimestamp(),
        ...(kept.length === 0 && { status: 'returned', returnedAt: FieldValue.serverTimestamp() }),
      })
    }

    if (swapIn) {
      tx.create(swapIn.ref, {
        ...swapIn.data,
        dateIn: soldAt,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      })
    }

    if (planHasFeature(actor.plan, 'activity_logs')) {
      const units = lines.reduce((n, l) => n + l.priced.quantity, 0)
      logSaleActivity(tx, actor, {
        action: 'created',
        entityType: 'receipt',
        entityId: input.saleId,
        entityName: `Sale ${receipt.receiptNumber}: ${units} item${units === 1 ? '' : 's'}${
          isBalanceDue ? ' held (balance due)' : ' sold'
        }${swapIn ? `, trade-in ${swapIn.name}` : ''}${
          approvedBy && approvedBy !== actor.uid ? ' (manager approved)' : ''
        }${offline ? ' (recorded offline)' : ''}${
          priceChangedOffline ? ' (price changed while offline)' : ''
        }`,
      })
    }

    return {
      done: {
        receiptId: input.saleId,
        receipt,
        created: true,
        swapInItemId: swapIn?.ref.id ?? null,
        unpricedSwapInName: swapIn?.unpriced ? swapIn.name : null,
      } satisfies CreatedSale,
    }
  })

  return result.done
}

/**
 * A short, readable receipt number from the sale's random ID, so two tills (or a till and its
 * own offline replay) can't produce the same number the way a clock-based one could.
 */
export function receiptNumberFor(saleId: string): string {
  return `REC-${saleId
    .replace(/[^A-Za-z0-9]/g, '')
    .slice(0, 8)
    .toUpperCase()}`
}

function receiptLine(line: LoadedLine): Record<string, unknown> {
  const { item, priced } = line
  const serialNo =
    getInventoryItemField(item, 'serialNo') ||
    getInventoryItemField(item, 'serialNumber') ||
    getInventoryItemField(item, 'serial')
  const unitCost = resolveItemUnitCost(item)
  return {
    itemId: line.request.itemId,
    folderId: item.folderId,
    quantity: priced.quantity,
    price: priced.finalPrice,
    itemName: getInventoryItemDisplayName(item) || 'Product',
    ...(unitCost !== undefined && { unitCost }),
    ...(serialNo && { serialNo }),
    ...(getInventoryItemField(item, 'brand') && { brand: getInventoryItemField(item, 'brand') }),
    ...(getInventoryItemField(item, 'model') && { model: getInventoryItemField(item, 'model') }),
    ...(getInventoryItemField(item, 'sku') && { sku: getInventoryItemField(item, 'sku') }),
    productDetails: getReceiptProductDetails(item),
    ...(priced.hasDiscount && {
      originalPrice: priced.originalPrice,
      hasDiscount: true,
      ...(priced.discountAmount !== undefined && { discountAmount: priced.discountAmount }),
      ...(priced.discountPercentage !== undefined && {
        discountPercentage: priced.discountPercentage,
      }),
    }),
  }
}

async function loadFolders(
  db: Firestore,
  store: DocumentReference,
  items: DocumentSnapshot[],
  swapFolderId?: string
): Promise<Map<string, InventoryFolder | undefined>> {
  const ids = new Set(
    items.map((s) => String(s.data()?.folderId || '')).filter((id) => /^[\w-]+$/.test(id))
  )
  if (swapFolderId) ids.add(swapFolderId)
  if (!ids.size) return new Map()
  const snaps = await db.getAll(
    ...[...ids].map((id) => store.collection('inventoryFolders').doc(id))
  )
  return new Map(snaps.map((s) => [s.id, s.exists ? (s.data() as InventoryFolder) : undefined]))
}

function alreadyRecorded(actor: StoreActor, snap: DocumentSnapshot): CreatedSale {
  const receipt = snap.data() ?? {}
  if (receipt.actualCreator !== actor.uid) {
    conflict('A different sale already uses this ID.', 'SALE_ID_TAKEN')
  }
  return {
    receiptId: snap.id,
    receipt,
    created: false,
    swapInItemId: (receipt.swapInItemId as string) || null,
    unpricedSwapInName: null,
  }
}

async function paymentsV2On(): Promise<boolean> {
  const { getPaymentsV2Gate } = await import('~/server/utils/payments/config')
  return (await getPaymentsV2Gate()).enabled
}
