// @vitest-environment node
import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { deleteApp, initializeApp, type App } from 'firebase-admin/app'
import { getFirestore, type Firestore } from 'firebase-admin/firestore'
import { resolveStoreActor } from '~/server/utils/sales/actor'
import { createSale, parseCreateSaleRequest } from '~/server/utils/sales/create-sale'
import { refundSale } from '~/server/utils/sales/balance'
import { createWriteOff } from '~/server/utils/stock-write-offs'
import { createSupplierReturn, updateSupplierReturn } from '~/server/utils/supplier-returns'

const OWNER = 'woOwner'
const STORE = 'woStore'
const RECEIPTS = { view: true, create: true, edit: false, delete: false, refund: true }
const EDIT_ONLY = { view: true, create: true, edit: true, delete: false }
const FULL = { view: true, create: true, edit: true, delete: true }

describe.skipIf(!process.env.FIRESTORE_EMULATOR_HOST)('stock write-offs (emulator)', () => {
  let app: App
  let db: Firestore

  const owner = () => db.collection('users').doc(OWNER)
  const store = () => owner().collection('stores').doc(STORE)
  const item = (id: string) => store().collection('inventoryItems').doc(id)
  const writeOff = (id: string) => store().collection('stockWriteOffs').doc(id)
  const actor = (uid: string) => resolveStoreActor(db, uid, OWNER, STORE)
  const writeOffAs = async (uid: string, body: Record<string, unknown>) =>
    createWriteOff(db, await actor(uid), body)

  beforeAll(() => {
    app = initializeApp({ projectId: 'storv-ui-test-write-offs' }, `wo-${randomUUID()}`)
    db = getFirestore(app)
  })

  afterAll(async () => {
    await deleteApp(app)
  })

  beforeEach(async () => {
    await db.recursiveDelete(owner())
    await owner().set({
      uid: OWNER,
      role: 'superAdmin',
      name: 'Ada Owner',
      subscription: 'storvv_enterprise',
    })
    await store().set({ ownerId: OWNER, name: 'Lagos' })
    const member = (uid: string, products: typeof FULL) =>
      store()
        .collection('members')
        .doc(uid)
        .set({ authUid: uid, status: 'active', permissions: { products, receipts: RECEIPTS } })
    await member('editor', EDIT_ONLY)
    await member('manager', FULL)
    await store()
      .collection('inventoryFolders')
      .doc('phones')
      .set({
        name: 'Phones',
        hasSerialNumbers: true,
        template: {
          fields: [
            { name: 'name', type: 'text' },
            { name: 'serialNo', type: 'text' },
            { name: 'price', type: 'currency' },
          ],
        },
      })
    await store()
      .collection('inventoryFolders')
      .doc('cables')
      .set({
        name: 'Cables',
        template: {
          fields: [
            { name: 'name', type: 'text' },
            { name: 'quantity', type: 'number' },
          ],
        },
      })
    await item('iphone').set({
      folderId: 'phones',
      storeId: STORE,
      name: 'iPhone 15',
      serialNo: 'SN1',
      price: 900_000,
      unitCost: 700_000,
    })
    await item('usb').set({
      folderId: 'cables',
      storeId: STORE,
      name: 'USB-C',
      price: 5_000,
      unitCost: 2_000,
      quantity: 10,
    })
    await item('nocost').set({ folderId: 'cables', storeId: STORE, name: 'Mystery', quantity: 4 })
  })

  it('writes off an in-stock serial unit: removed, loss recorded at cost', async () => {
    const { writeOffId } = await writeOffAs('manager', {
      source: 'inventory',
      itemId: 'iphone',
      reason: 'damaged',
      note: 'Dropped during unpacking',
    })
    expect((await item('iphone').get()).exists).toBe(false)
    const doc = (await writeOff(writeOffId).get()).data()!
    expect(doc).toMatchObject({
      source: 'inventory',
      reason: 'damaged',
      note: 'Dropped during unpacking',
      quantity: 1,
      costValue: 700_000,
      inventoryAction: 'removed',
      item: { inventoryItemId: 'iphone', name: 'iPhone 15', serial: true },
    })
    expect(doc.itemSnapshot?.serialNo).toBe('SN1')
  })

  it('takes bulk units off the count, and logs a loss without a cost when none is set', async () => {
    const { writeOffId } = await writeOffAs('manager', {
      source: 'inventory',
      itemId: 'usb',
      quantity: 3,
      reason: 'expired',
    })
    expect((await item('usb').get()).data()?.quantity).toBe(7)
    expect((await writeOff(writeOffId).get()).data()).toMatchObject({
      quantity: 3,
      costValue: 6_000,
      inventoryAction: 'reduced',
    })
    const noCost = await writeOffAs('manager', {
      source: 'inventory',
      itemId: 'nocost',
      quantity: 1,
      reason: 'damaged',
    })
    expect((await writeOff(noCost.writeOffId).get()).data()?.costValue).toBeNull()
  })

  it('writes off a held customer return and closes the hold', async () => {
    const sale = await createSale(
      db,
      await actor('manager'),
      parseCreateSaleRequest({
        saleId: randomUUID().replace(/-/g, ''),
        lines: [{ itemId: 'iphone', quantity: 1 }],
        customer: { name: 'Oluku' },
      })
    )
    const { inspectionHoldIds } = await refundSale(db, await actor('manager'), {
      receiptId: sale.receiptId,
      reason: 'Cracked screen',
      heldItemIds: ['iphone'],
    })
    const { writeOffId } = await writeOffAs('manager', {
      source: 'inspection',
      holdId: inspectionHoldIds[0],
      reason: 'customer_damage',
    })
    expect((await item('iphone').get()).exists).toBe(false)
    expect((await writeOff(writeOffId).get()).data()).toMatchObject({
      source: 'inspection',
      costValue: 700_000,
      customerReturn: { customerName: 'Oluku', complaint: 'Cracked screen' },
    })
    const hold = (
      await store().collection('inspectionHolds').doc(inspectionHoldIds[0]!).get()
    ).data()
    expect(hold).toMatchObject({ status: 'written_off', writeOffId })
    // Its only held item is decided, so the sale no longer reads as pending.
    const receipt = (await store().collection('receipts').doc(sale.receiptId).get()).data()
    expect(receipt?.inspectionPending).toBeUndefined()
  })

  it('writes off a rejected supplier return once, without touching stock again', async () => {
    const { returnId } = await createSupplierReturn(db, await actor('manager'), {
      itemId: 'usb',
      quantity: 2,
      supplierName: 'Cable Co',
      defect: 'Frayed',
    })
    expect((await item('usb').get()).data()?.quantity).toBe(8)
    // Only rejected claims can be written off.
    await expect(
      writeOffAs('manager', { source: 'supplier_return', returnId, reason: 'supplier_rejected' })
    ).rejects.toMatchObject({ data: { code: 'NOT_REJECTED' } })
    await updateSupplierReturn(db, await actor('manager'), { returnId, action: 'reject' })
    const { writeOffId } = await writeOffAs('manager', {
      source: 'supplier_return',
      returnId,
      reason: 'supplier_rejected',
    })
    expect((await item('usb').get()).data()?.quantity).toBe(8)
    expect((await writeOff(writeOffId).get()).data()).toMatchObject({
      inventoryAction: 'already_out',
      costValue: 4_000,
      supplierReturn: { returnId, supplierName: 'Cable Co' },
    })
    const ret = (await store().collection('supplierReturns').doc(returnId).get()).data()
    expect(ret?.writeOffId).toBe(writeOffId)
    await expect(
      writeOffAs('manager', { source: 'supplier_return', returnId, reason: 'supplier_rejected' })
    ).rejects.toMatchObject({ data: { code: 'ALREADY_WRITTEN_OFF' } })
  })

  it('needs products delete, a reason, and a note for lost stock', async () => {
    await expect(
      writeOffAs('editor', { source: 'inventory', itemId: 'iphone', reason: 'damaged' })
    ).rejects.toMatchObject({ statusCode: 403 })
    await expect(
      writeOffAs('manager', { source: 'inventory', itemId: 'iphone', reason: 'gone' })
    ).rejects.toMatchObject({ data: { code: 'REASON_REQUIRED' } })
    await expect(
      writeOffAs('manager', { source: 'inventory', itemId: 'iphone', reason: 'lost_stolen' })
    ).rejects.toMatchObject({ data: { code: 'NOTE_REQUIRED' } })
    await expect(
      writeOffAs('manager', { source: 'inventory', itemId: 'usb', quantity: 11, reason: 'damaged' })
    ).rejects.toMatchObject({ data: { code: 'INSUFFICIENT_STOCK' } })
    expect((await item('iphone').get()).exists).toBe(true)
    expect((await store().collection('stockWriteOffs').get()).size).toBe(0)
  })

  it('refuses a sold unit or one held for inspection', async () => {
    await item('iphone').update({ inspectionHoldId: 'h1' })
    await expect(
      writeOffAs('manager', { source: 'inventory', itemId: 'iphone', reason: 'damaged' })
    ).rejects.toMatchObject({ data: { code: 'ITEM_ON_INSPECTION' } })
    await item('iphone').update({ inspectionHoldId: null, dateOut: new Date() })
    await expect(
      writeOffAs('manager', { source: 'inventory', itemId: 'iphone', reason: 'damaged' })
    ).rejects.toMatchObject({ data: { code: 'ITEM_SOLD' } })
  })
})
