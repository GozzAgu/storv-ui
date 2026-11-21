import { describe, expect, it } from 'vitest'
import { Timestamp } from 'firebase-admin/firestore'
import { buildItemOrigin, parseCreateSupplierReturn } from '~/server/utils/supplier-returns'
import { mapSupplierReturnDoc } from '~/stores/supplierReturns'
import { daysInStock, supplierReturnOriginFacts } from '~/utils/supplier-return-display'
import { demoSupplierReturns } from '~/utils/demo-supplier-returns'

describe('buildItemOrigin', () => {
  const createdAt = Timestamp.fromDate(new Date('2026-09-01T00:00:00Z'))

  it('defaults to added directly to stock', () => {
    expect(buildItemOrigin({ createdAt }, { addedByName: 'Ada' })).toEqual({
      kind: 'stock',
      addedAt: createdAt,
      addedByName: 'Ada',
    })
  })

  it('prefers the transfer: who received it and the sending branch', () => {
    const origin = buildItemOrigin(
      { createdAt, transferId: 'tr1', receivedByName: 'Kunle', originalDateIn: '2026-07-01' },
      { addedByName: 'Ada', transfer: { sourceStoreName: 'Port Harcourt' } }
    )
    expect(origin).toMatchObject({
      kind: 'transfer',
      addedByName: 'Kunle',
      fromBranchName: 'Port Harcourt',
      transferId: 'tr1',
    })
    expect(origin.originalAddedAt?.toDate().toISOString()).toBe('2026-07-01T00:00:00.000Z')
  })

  it('names the customer for trade-ins and swap-ins', () => {
    expect(
      buildItemOrigin(
        { createdAt, buyback: true, buybackId: 'b1' },
        { addedByName: null, buyback: { customerName: 'Pedro' } }
      )
    ).toMatchObject({ kind: 'buyback', customerName: 'Pedro', buybackId: 'b1' })
    expect(
      buildItemOrigin(
        { createdAt, swapIn: true, swapInReceiptId: 'r9' },
        { addedByName: null, swapInReceipt: { customerName: 'Jox' } }
      )
    ).toMatchObject({ kind: 'swap_in', customerName: 'Jox', swapInReceiptId: 'r9' })
  })

  it('falls back to dateIn and copes with no date', () => {
    expect(buildItemOrigin({ dateIn: '2026-01-02' }, { addedByName: null }).addedAt).toBeInstanceOf(
      Timestamp
    )
    expect(buildItemOrigin({}, { addedByName: null }).addedAt).toBeNull()
  })
})

describe('parseCreateSupplierReturn', () => {
  const base = { itemId: 'camry', supplierName: 'Apapa', defect: 'Cracked radiator' }

  it('defaults to one unit and trims text', () => {
    expect(parseCreateSupplierReturn({ ...base, supplierName: '  Apapa  ' })).toMatchObject({
      itemId: 'camry',
      quantity: 1,
      supplierName: 'Apapa',
      supplierReference: '',
      notes: '',
    })
  })

  it('refuses bad ids, quantities, and missing supplier or fault', () => {
    expect(() => parseCreateSupplierReturn({ ...base, itemId: '../x' })).toThrow()
    expect(() => parseCreateSupplierReturn({ ...base, quantity: 0 })).toThrow()
    expect(() => parseCreateSupplierReturn({ ...base, quantity: 1.5 })).toThrow()
    expect(() => parseCreateSupplierReturn({ ...base, supplierName: '' })).toThrow()
    expect(() => parseCreateSupplierReturn({ ...base, defect: 'no' })).toThrow()
  })
})

describe('supplier return display', () => {
  it('maps a stored doc, tolerating missing fields', () => {
    const row = mapSupplierReturnDoc('x', { status: 'bogus', item: { name: 'Camry' } })
    expect(row.status).toBe('ready')
    expect(row.item).toMatchObject({ name: 'Camry', quantity: 1, folderName: 'Inventory' })
    expect(row.costValue).toBeNull()
  })

  it('orders history oldest first', () => {
    const row = mapSupplierReturnDoc('x', {
      history: [
        { status: 'with_supplier', at: '2026-10-02T00:00:00Z', byName: 'B' },
        { status: 'ready', at: '2026-10-01T00:00:00Z', byName: 'A' },
      ],
    })
    expect(row.history.map((h) => h.status)).toEqual(['ready', 'with_supplier'])
  })

  it('describes where a transferred unit came from and when it was logged', () => {
    const transferred = demoSupplierReturns().find((r) => r.origin.kind === 'transfer')!
    const labels = supplierReturnOriginFacts(transferred).map((f) => f.label)
    expect(labels).toEqual([
      'Came in as',
      'From branch',
      'First stocked',
      'Received here',
      'Received by',
      'Category',
      'Logged defective',
    ])
    expect(daysInStock(transferred)).toBe('24 days')
  })
})

describe('inspection holds display', () => {
  it('maps a stored hold, tolerating missing fields', async () => {
    const { mapInspectionHoldDoc } = await import('~/stores/inspectionHolds')
    const hold = mapInspectionHoldDoc('h1', { status: 'odd', item: { name: 'iPhone' } })
    expect(hold.status).toBe('held')
    expect(hold.item).toMatchObject({ name: 'iPhone', quantity: 1, serial: false })
    expect(hold.sale.customerName).toBe('Walk-in Customer')
    expect(hold.supplierReturnId).toBeNull()
  })

  it('shows the customer return on a supplier return that came through inspection', () => {
    const row = {
      ...demoSupplierReturns()[0]!,
      customerReturn: {
        receiptId: 'r1',
        receiptNumber: 'REC-1',
        customerName: 'Oluku',
        complaint: 'Screen flickers',
        returnedAt: '2026-11-20T10:00:00Z',
      },
    }
    const facts = supplierReturnOriginFacts(row)
    expect(facts.find((f) => f.label === 'Customer return')?.value).toMatch(/^#REC-1 · Oluku · /)
    expect(facts.find((f) => f.label === 'Customer said')?.value).toBe('Screen flickers')
  })
})

describe('stock write-offs', () => {
  it('parses each source and enforces a reason and a note for lost stock', async () => {
    const { parseCreateWriteOff } = await import('~/server/utils/stock-write-offs')
    expect(
      parseCreateWriteOff({ source: 'inventory', itemId: 'a', quantity: 2, reason: 'damaged' })
    ).toMatchObject({ source: 'inventory', id: 'a', quantity: 2, reason: 'damaged', note: '' })
    expect(parseCreateWriteOff({ source: 'inspection', holdId: 'h1', reason: 'other' }).id).toBe(
      'h1'
    )
    expect(
      parseCreateWriteOff({ source: 'supplier_return', returnId: 'r1', reason: 'other' }).id
    ).toBe('r1')
    expect(() => parseCreateWriteOff({ source: 'inventory', itemId: 'a', reason: 'x' })).toThrow()
    expect(() =>
      parseCreateWriteOff({ source: 'inventory', itemId: 'a', reason: 'lost_stolen' })
    ).toThrow()
    expect(() => parseCreateWriteOff({ source: 'nope', itemId: 'a', reason: 'other' })).toThrow()
  })

  it('maps a stored write-off, tolerating missing fields', async () => {
    const { mapWriteOffDoc } = await import('~/stores/writeOffs')
    const row = mapWriteOffDoc('w1', { reason: 'odd', item: { name: 'Cable' } })
    expect(row).toMatchObject({
      source: 'inventory',
      reason: 'other',
      quantity: 1,
      costValue: null,
    })
    expect(row.item.name).toBe('Cable')
    expect(row.customerReturn).toBeNull()
  })
})

describe('sale status while a return is inspected', () => {
  it('reads Return pending until every held item is decided', async () => {
    const { getReceiptDisplayStatus } = await import('~/utils/receipt-status')
    expect(getReceiptDisplayStatus({ status: 'refunded', inspectionPending: true })).toEqual({
      label: 'Return pending',
      tone: 'warning',
    })
    expect(getReceiptDisplayStatus({ status: 'refunded' })).toEqual({
      label: 'Refunded',
      tone: 'error',
    })
    expect(getReceiptDisplayStatus({ status: 'completed', inspectionPending: true }).label).toBe(
      'Completed'
    )
  })
})

describe('stock removals', () => {
  const folder = {
    hasSerialNumbers: false,
    template: { fields: [{ name: 'quantity' }] },
    name: 'Cables',
  } as never

  it('works out how many units an edit takes off the count', async () => {
    const { countDrop, countReductionRecord } = await import('~/utils/stock-removal-records')
    const before = {
      id: 'usb',
      folderId: 'c',
      quantity: 10,
      unitCost: 2000,
      name: 'USB-C',
    } as never
    expect(countDrop(before, { quantity: 7 } as never, folder)).toBe(3)
    expect(countDrop(before, { quantity: 12 } as never, folder)).toBe(0)
    const rec = countReductionRecord(
      before,
      { ...(before as object), quantity: 7 } as never,
      folder,
      { reason: 'count_corrected', note: ' recount ' },
      { storeId: 's1', uid: 'u1', name: 'Ada' }
    )
    expect(rec).toMatchObject({
      kind: 'count_reduced',
      quantity: 3,
      before: 10,
      after: 7,
      costValue: 6000,
      note: 'recount',
      createdBy: 'u1',
      restoredAt: null,
    })
    expect(
      countReductionRecord(
        before,
        before,
        folder,
        { reason: 'other' },
        { storeId: 's', uid: 'u', name: 'n' }
      )
    ).toBeNull()
  })

  it('needs a note when the delete reason is Other', async () => {
    const { isDeleteWhyComplete } = await import('~/types/stock-removals')
    expect(isDeleteWhyComplete({ reason: 'duplicate' })).toBe(true)
    expect(isDeleteWhyComplete({ reason: 'other' })).toBe(false)
    expect(isDeleteWhyComplete({ reason: 'other', note: 'Moved to a bundle' })).toBe(true)
  })

  it('maps a stored removal, tolerating missing fields', async () => {
    const { mapStockRemovalDoc } = await import('~/stores/stockRemovals')
    const row = mapStockRemovalDoc('r1', { kind: 'odd', reason: 'odd', item: { name: 'X' } })
    expect(row).toMatchObject({ kind: 'deleted', reason: 'other', quantity: 1, restoredAt: null })
  })
})
