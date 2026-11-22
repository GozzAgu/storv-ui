// @vitest-environment node
import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { deleteApp, initializeApp, type App } from 'firebase-admin/app'
import { getFirestore, type Firestore } from 'firebase-admin/firestore'
import { resolveStoreActor } from '~/server/utils/sales/actor'
import { createSale, parseCreateSaleRequest } from '~/server/utils/sales/create-sale'
import { refundSale } from '~/server/utils/sales/balance'
import { createStockLoan } from '~/server/utils/sales/stock-loans'
import { resolveInspectionHold } from '~/server/utils/inspection-holds'
import { createSupplierReturn } from '~/server/utils/supplier-returns'

const OWNER = 'ihOwner'
const STORE = 'ihStore'
const PRODUCTS_VIEW = { view: true, create: false, edit: false, delete: false }
const PRODUCTS_EDIT = { view: true, create: true, edit: true, delete: false }
const RECEIPTS = { view: true, create: true, edit: false, delete: false, refund: false }

describe.skipIf(!process.env.FIRESTORE_EMULATOR_HOST)('inspection holds (emulator)', () => {
  let app: App
  let db: Firestore

  const owner = () => db.collection('users').doc(OWNER)
  const store = () => owner().collection('stores').doc(STORE)
  const item = (id: string) => store().collection('inventoryItems').doc(id)
  const hold = (id: string) => store().collection('inspectionHolds').doc(id)
  const actor = (uid: string) => resolveStoreActor(db, uid, OWNER, STORE)
  const sell = async (lines: Array<{ itemId: string; quantity: number }>) =>
    createSale(
      db,
      await actor('cashier'),
      parseCreateSaleRequest({
        saleId: randomUUID().replace(/-/g, ''),
        lines,
        customer: { name: 'Oluku', phone: '08030000000' },
      })
    )
  const refund = async (receiptId: string, heldItemIds: string[], reason = 'Screen flickers') =>
    refundSale(db, await actor('refunder'), { receiptId, reason, heldItemIds })

  beforeAll(() => {
    app = initializeApp({ projectId: 'storv-ui-test-inspection' }, `ih-${randomUUID()}`)
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
    const member = (uid: string, extra: Record<string, unknown>) =>
      store()
        .collection('members')
        .doc(uid)
        .set({ authUid: uid, status: 'active', ...extra })
    await member('cashier', { permissions: { products: PRODUCTS_VIEW, receipts: RECEIPTS } })
    // Can refund at the till, but not decide what happens to stock.
    await member('refunder', {
      permissions: { products: PRODUCTS_VIEW, receipts: { ...RECEIPTS, refund: true } },
    })
    await member('manager', {
      permissions: { products: PRODUCTS_EDIT, receipts: { ...RECEIPTS, refund: true } },
    })
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
  })

  it('holds a serial unit off sale and restocks the rest of the refund', async () => {
    const sale = await sell([
      { itemId: 'iphone', quantity: 1 },
      { itemId: 'usb', quantity: 2 },
    ])
    const { inspectionHoldIds } = await refund(sale.receiptId, ['iphone'])
    expect(inspectionHoldIds).toEqual([`${sale.receiptId}_iphone`])

    const phone = (await item('iphone').get()).data()
    expect(phone?.dateOut).toBeUndefined()
    expect(phone?.soldPrice).toBeUndefined()
    expect(phone?.inspectionHoldId).toBe(inspectionHoldIds[0])
    expect((await item('usb').get()).data()?.quantity).toBe(10)

    const doc = (await hold(inspectionHoldIds[0]!).get()).data()!
    expect(doc).toMatchObject({
      status: 'held',
      complaint: 'Screen flickers',
      item: { name: 'iPhone 15', serial: true, quantity: 1, folderName: 'Phones' },
      sale: { receiptId: sale.receiptId, customerName: 'Oluku', amount: 900_000 },
    })
    const receipt = (await store().collection('receipts').doc(sale.receiptId).get()).data()
    expect(receipt?.status).toBe('refunded')
    expect(receipt?.inspectionHoldIds).toEqual(inspectionHoldIds)
  })

  it('a held unit cannot be sold, loaned or logged straight to the supplier', async () => {
    const sale = await sell([{ itemId: 'iphone', quantity: 1 }])
    await refund(sale.receiptId, ['iphone'])
    await expect(sell([{ itemId: 'iphone', quantity: 1 }])).rejects.toMatchObject({
      data: { code: 'ITEM_ON_INSPECTION' },
    })
    await expect(
      createStockLoan(db, await actor(OWNER), { partyName: 'Tunde', itemIds: ['iphone'] })
    ).rejects.toMatchObject({ statusCode: 409 })
    await expect(
      createSupplierReturn(db, await actor('manager'), {
        itemId: 'iphone',
        supplierName: 'Apapa',
        defect: 'Screen flickers',
      })
    ).rejects.toMatchObject({ data: { code: 'ITEM_ON_INSPECTION' } })
  })

  it('keeps held bulk units off the count until they go back on sale', async () => {
    const sale = await sell([{ itemId: 'usb', quantity: 3 }])
    const { inspectionHoldIds } = await refund(sale.receiptId, ['usb'])
    expect((await item('usb').get()).data()?.quantity).toBe(7)

    await resolveInspectionHold(db, await actor('manager'), {
      holdId: inspectionHoldIds[0],
      action: 'restock',
    })
    expect((await item('usb').get()).data()?.quantity).toBe(10)
    const doc = (await hold(inspectionHoldIds[0]!).get()).data()
    expect(doc?.status).toBe('restocked')
    expect(doc?.closedAt).toBeTruthy()
  })

  it('back on sale clears the flag so the unit can be sold again', async () => {
    const sale = await sell([{ itemId: 'iphone', quantity: 1 }])
    const { inspectionHoldIds } = await refund(sale.receiptId, ['iphone'])
    await resolveInspectionHold(db, await actor('manager'), {
      holdId: inspectionHoldIds[0],
      action: 'restock',
    })
    expect((await item('iphone').get()).data()?.inspectionHoldId).toBeUndefined()
    await expect(sell([{ itemId: 'iphone', quantity: 1 }])).resolves.toBeTruthy()
  })

  it('return to supplier removes the unit and links the customer return', async () => {
    const sale = await sell([{ itemId: 'iphone', quantity: 1 }])
    const { inspectionHoldIds } = await refund(sale.receiptId, ['iphone'])
    const result = await resolveInspectionHold(db, await actor('manager'), {
      holdId: inspectionHoldIds[0],
      action: 'supplier',
      supplierName: 'Ikeja Phone Imports',
      defect: 'Display fault confirmed on inspection',
    })
    expect(result.status).toBe('to_supplier')
    expect((await item('iphone').get()).exists).toBe(false)

    const ret = (
      await store().collection('supplierReturns').doc(result.supplierReturnId!).get()
    ).data()!
    expect(ret).toMatchObject({
      status: 'ready',
      supplierName: 'Ikeja Phone Imports',
      defect: 'Display fault confirmed on inspection',
      costValue: 700_000,
      item: { inventoryItemId: 'iphone', serial: true, inventoryAction: 'removed' },
      customerReturn: {
        holdId: inspectionHoldIds[0],
        receiptId: sale.receiptId,
        customerName: 'Oluku',
        complaint: 'Screen flickers',
      },
    })
    expect((await hold(inspectionHoldIds[0]!).get()).data()).toMatchObject({
      status: 'to_supplier',
      supplierReturnId: result.supplierReturnId,
    })
  })

  it('on Micro, a held unit can go back on sale but not to the supplier', async () => {
    const sale = await sell([{ itemId: 'iphone', quantity: 1 }])
    const { inspectionHoldIds } = await refund(sale.receiptId, ['iphone'])
    await owner().update({ subscription: 'storvv_micro' })
    const manager = await actor('manager')
    await expect(
      resolveInspectionHold(db, manager, {
        holdId: inspectionHoldIds[0],
        action: 'supplier',
        supplierName: 'Ikeja Phone Imports',
        defect: 'Display fault',
      })
    ).rejects.toMatchObject({ data: { code: 'PLAN_UPGRADE_REQUIRED' } })
    expect((await item('iphone').get()).data()?.inspectionHoldId).toBe(inspectionHoldIds[0])
    await resolveInspectionHold(db, manager, { holdId: inspectionHoldIds[0], action: 'restock' })
    expect((await item('iphone').get()).data()?.inspectionHoldId).toBeUndefined()
  })

  it('held bulk units sent to the supplier never come back into stock', async () => {
    const sale = await sell([{ itemId: 'usb', quantity: 2 }])
    const { inspectionHoldIds } = await refund(sale.receiptId, ['usb'])
    const result = await resolveInspectionHold(db, await actor('manager'), {
      holdId: inspectionHoldIds[0],
      action: 'supplier',
      supplierName: 'Cable Co',
      defect: 'Frayed at the plug',
    })
    expect((await item('usb').get()).data()?.quantity).toBe(8)
    const ret = (
      await store().collection('supplierReturns').doc(result.supplierReturnId!).get()
    ).data()
    expect(ret?.item).toMatchObject({ quantity: 2, inventoryAction: 'reduced' })
    expect(ret?.costValue).toBe(4_000)
  })

  it('needs a complaint, a line on the sale, and products access to decide', async () => {
    const sale = await sell([{ itemId: 'iphone', quantity: 1 }])
    await expect(refund(sale.receiptId, ['iphone'], '')).rejects.toMatchObject({
      data: { code: 'HOLD_REASON_REQUIRED' },
    })
    await expect(refund(sale.receiptId, ['usb'])).rejects.toMatchObject({
      data: { code: 'HELD_ITEM_NOT_ON_SALE' },
    })
    const { inspectionHoldIds } = await refund(sale.receiptId, ['iphone'])
    await expect(
      resolveInspectionHold(db, await actor('refunder'), {
        holdId: inspectionHoldIds[0],
        action: 'restock',
      })
    ).rejects.toMatchObject({ statusCode: 403 })
  })

  it('decides once, and a repeat refund holds nothing new', async () => {
    const sale = await sell([{ itemId: 'iphone', quantity: 1 }])
    const first = await refund(sale.receiptId, ['iphone'])
    const again = await refund(sale.receiptId, ['iphone'])
    expect(again.inspectionHoldIds).toEqual(first.inspectionHoldIds)
    const manager = await actor('manager')
    await resolveInspectionHold(db, manager, {
      holdId: first.inspectionHoldIds[0],
      action: 'restock',
    })
    await expect(
      resolveInspectionHold(db, manager, { holdId: first.inspectionHoldIds[0], action: 'restock' })
    ).rejects.toMatchObject({ data: { code: 'ALREADY_DECIDED' } })
  })

  it('the sale reads as pending until the last held item is decided', async () => {
    const sale = await sell([
      { itemId: 'iphone', quantity: 1 },
      { itemId: 'usb', quantity: 2 },
    ])
    const receipt = () => store().collection('receipts').doc(sale.receiptId).get()
    const { inspectionHoldIds } = await refund(sale.receiptId, ['iphone', 'usb'])
    expect((await receipt()).data()).toMatchObject({ status: 'refunded', inspectionPending: true })

    const manager = await actor('manager')
    await resolveInspectionHold(db, manager, { holdId: inspectionHoldIds[0], action: 'restock' })
    expect((await receipt()).data()?.inspectionPending).toBe(true)

    await resolveInspectionHold(db, manager, {
      holdId: inspectionHoldIds[1],
      action: 'supplier',
      supplierName: 'Cable Co',
      defect: 'Frayed',
    })
    expect((await receipt()).data()?.inspectionPending).toBeUndefined()
  })

  it('a refund with nothing held never reads as pending', async () => {
    const sale = await sell([{ itemId: 'usb', quantity: 1 }])
    await refund(sale.receiptId, [], 'Changed mind')
    const data = (await store().collection('receipts').doc(sale.receiptId).get()).data()
    expect(data?.status).toBe('refunded')
    expect(data?.inspectionPending).toBeUndefined()
  })
})
