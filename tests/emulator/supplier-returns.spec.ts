// @vitest-environment node
import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { deleteApp, initializeApp, type App } from 'firebase-admin/app'
import { Timestamp, getFirestore, type Firestore } from 'firebase-admin/firestore'
import { resolveStoreActor } from '~/server/utils/sales/actor'
import { createSupplierReturn, updateSupplierReturn } from '~/server/utils/supplier-returns'

const OWNER = 'srOwner'
const STORE = 'srStore'
const RECEIPTS = { view: true, create: true, edit: false, delete: false, refund: true }
const VIEW_PRODUCTS = { view: true, create: false, edit: false, delete: false }
const EDIT_PRODUCTS = { view: true, create: true, edit: true, delete: false }

describe.skipIf(!process.env.FIRESTORE_EMULATOR_HOST)('supplier returns (emulator)', () => {
  let app: App
  let db: Firestore

  const owner = () => db.collection('users').doc(OWNER)
  const store = () => owner().collection('stores').doc(STORE)
  const item = (id: string) => store().collection('inventoryItems').doc(id)
  const ret = (id: string) => store().collection('supplierReturns').doc(id)
  const ret_ = (id: string) => ret(id).get()
  const actor = (uid: string) => resolveStoreActor(db, uid, OWNER, STORE)
  const log = async (uid: string, body: Record<string, unknown>) =>
    createSupplierReturn(db, await actor(uid), {
      supplierName: 'Apapa Auto Imports',
      defect: 'Arrived with a cracked radiator',
      ...body,
    })

  beforeAll(() => {
    app = initializeApp({ projectId: 'storv-ui-test-supplier-returns' }, `sr-${randomUUID()}`)
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
    // A cashier who can refund sales but not change products.
    await member('cashier', { permissions: { products: VIEW_PRODUCTS, receipts: RECEIPTS } })
    await member('stocker', {
      staffId: 'st1',
      departmentId: 'd1',
      permissions: { products: EDIT_PRODUCTS, receipts: RECEIPTS },
    })
    await store()
      .collection('departments')
      .doc('d1')
      .collection('staff')
      .doc('st1')
      .set({ firstName: 'Folu', lastName: 'Osho' })

    await store()
      .collection('inventoryFolders')
      .doc('cars')
      .set({
        name: 'Sedan',
        hasSerialNumbers: true,
        template: {
          fields: [
            { name: 'name', label: 'Product', type: 'text' },
            { name: 'serialNo', label: 'Serial', type: 'text' },
            { name: 'price', label: 'Unit Price', type: 'currency' },
          ],
        },
      })
    await store()
      .collection('inventoryFolders')
      .doc('tyres')
      .set({
        name: 'Tyres',
        template: {
          fields: [
            { name: 'name', type: 'text' },
            { name: 'quantity', type: 'number' },
          ],
        },
      })
    await item('camry').set({
      folderId: 'cars',
      storeId: STORE,
      name: 'Toyota Camry',
      serialNo: 'VIN123',
      price: 20_000_000,
      unitCost: 18_000_000,
      createdBy: 'stocker',
      createdAt: Timestamp.fromDate(new Date('2026-09-01T10:00:00Z')),
    })
    await item('civic').set({
      folderId: 'cars',
      storeId: STORE,
      name: 'Honda Civic',
      serialNo: 'VIN999',
      price: 9_000_000,
      createdBy: OWNER,
      transferId: 'tr1',
      receivedByName: 'Kunle',
      originalDateIn: Timestamp.fromDate(new Date('2026-07-01T10:00:00Z')),
      createdAt: Timestamp.fromDate(new Date('2026-08-15T10:00:00Z')),
    })
    await owner().collection('storeTransfers').doc('tr1').set({ sourceStoreName: 'Port Harcourt' })
    await item('sold').set({
      folderId: 'cars',
      storeId: STORE,
      name: 'Sold car',
      price: 1,
      dateOut: Timestamp.now(),
    })
    await item('loaned').set({
      folderId: 'cars',
      storeId: STORE,
      name: 'Loaned car',
      price: 1,
      sellerLoanOutId: 'loan1',
    })
    await item('tyre').set({
      folderId: 'tyres',
      storeId: STORE,
      name: 'Tyre 26"',
      price: 20_000,
      unitCost: 15_000,
      quantity: 10,
    })
  })

  it('takes a defective serial unit out of inventory and records where it came from', async () => {
    const { returnId } = await log('stocker', {
      itemId: 'camry',
      supplierReference: 'INV-88',
      notes: 'Found on delivery inspection',
    })
    expect((await item('camry').get()).exists).toBe(false)

    const doc = (await ret(returnId).get()).data()!
    expect(doc).toMatchObject({
      status: 'ready',
      defect: 'Arrived with a cracked radiator',
      supplierName: 'Apapa Auto Imports',
      supplierReference: 'INV-88',
      notes: 'Found on delivery inspection',
      costValue: 18_000_000,
      createdByName: 'Folu Osho',
    })
    expect(doc.item).toMatchObject({
      inventoryItemId: 'camry',
      folderName: 'Sedan',
      name: 'Toyota Camry',
      serial: true,
      quantity: 1,
      unitCost: 18_000_000,
      inventoryAction: 'removed',
    })
    expect(doc.origin).toMatchObject({ kind: 'stock', addedByName: 'Folu Osho' })
    expect((doc.origin.addedAt as Timestamp).toDate().toISOString()).toBe(
      '2026-09-01T10:00:00.000Z'
    )
    expect(doc.itemSnapshot?.serialNo).toBe('VIN123')
    expect(doc.sale).toBeUndefined()
    expect(doc.history).toHaveLength(1)
  })

  it('records a transferred unit’s source branch and first stock date', async () => {
    const { returnId } = await log(OWNER, { itemId: 'civic' })
    const origin = (await ret(returnId).get()).data()?.origin
    expect(origin).toMatchObject({
      kind: 'transfer',
      fromBranchName: 'Port Harcourt',
      addedByName: 'Kunle',
      transferId: 'tr1',
    })
    expect((origin.originalAddedAt as Timestamp).toDate().toISOString()).toBe(
      '2026-07-01T10:00:00.000Z'
    )
  })

  it('takes some units off a bulk row without deleting it', async () => {
    const { returnId } = await log('stocker', { itemId: 'tyre', quantity: 3 })
    expect((await item('tyre').get()).data()?.quantity).toBe(7)
    const doc = (await ret(returnId).get()).data()
    expect(doc?.item).toMatchObject({ quantity: 3, inventoryAction: 'reduced', serial: false })
    expect(doc?.costValue).toBe(45_000)
  })

  it('refuses units that are not free to leave, or more than are in stock', async () => {
    await expect(log('stocker', { itemId: 'sold' })).rejects.toMatchObject({
      statusCode: 409,
      data: { code: 'ITEM_SOLD' },
    })
    await expect(log('stocker', { itemId: 'loaned' })).rejects.toMatchObject({
      data: { code: 'ITEM_ON_LOAN' },
    })
    await expect(log('stocker', { itemId: 'tyre', quantity: 11 })).rejects.toMatchObject({
      data: { code: 'INSUFFICIENT_STOCK' },
    })
    await expect(log('stocker', { itemId: 'camry', quantity: 2 })).rejects.toMatchObject({
      statusCode: 400,
    })
    expect((await item('tyre').get()).data()?.quantity).toBe(10)
    expect((await item('camry').get()).exists).toBe(true)
    expect((await store().collection('supplierReturns').get()).size).toBe(0)
  })

  it('needs a supplier, a fault description, and products access', async () => {
    await expect(log('stocker', { itemId: 'camry', supplierName: ' ' })).rejects.toMatchObject({
      data: { code: 'SUPPLIER_REQUIRED' },
    })
    await expect(log('stocker', { itemId: 'camry', defect: 'x' })).rejects.toMatchObject({
      data: { code: 'DEFECT_REQUIRED' },
    })
    // Refunding sales doesn't let you take stock out.
    await expect(log('cashier', { itemId: 'camry' })).rejects.toMatchObject({ statusCode: 403 })
    expect((await item('camry').get()).exists).toBe(true)
  })

  it('on Micro, refuses new returns but still lets open ones be settled', async () => {
    const { returnId } = await log('stocker', { itemId: 'camry' })
    await owner().update({ subscription: 'storvv_micro' })
    await expect(log('stocker', { itemId: 'civic' })).rejects.toMatchObject({
      statusCode: 403,
      data: { code: 'PLAN_UPGRADE_REQUIRED' },
    })
    expect((await item('civic').get()).exists).toBe(true)
    const stocker = await actor('stocker')
    await updateSupplierReturn(db, stocker, { returnId, action: 'send' })
    await updateSupplierReturn(db, stocker, { returnId, action: 'resolve', outcome: 'refund' })
    expect((await ret(returnId).get()).data()?.status).toBe('resolved')
  })

  it('a unit can only be returned once', async () => {
    await log('stocker', { itemId: 'camry' })
    await expect(log('stocker', { itemId: 'camry' })).rejects.toMatchObject({
      data: { code: 'ITEM_MISSING' },
    })
  })

  describe('updateSupplierReturn', () => {
    it('sends, then resolves, keeping a history', async () => {
      const { returnId: id } = await log('stocker', { itemId: 'camry' })
      const stocker = await actor('stocker')
      await updateSupplierReturn(db, stocker, {
        returnId: id,
        action: 'send',
        supplierReference: 'RMA-1',
      })
      await updateSupplierReturn(db, stocker, {
        returnId: id,
        action: 'resolve',
        outcome: 'credit_note',
        note: 'CN-114',
      })
      const doc = (await ret(id).get()).data()!
      expect(doc).toMatchObject({
        status: 'resolved',
        outcome: 'credit_note',
        supplierName: 'Apapa Auto Imports',
        supplierReference: 'RMA-1',
      })
      expect(doc.sentAt).toBeTruthy()
      expect(doc.closedAt).toBeTruthy()
      expect(doc.history.map((h: { status: string }) => h.status)).toEqual([
        'ready',
        'with_supplier',
        'resolved',
      ])
      expect(doc.history[2].note).toBe('CN-114')
    })

    it('refuses invalid moves and people without products access', async () => {
      const { returnId: id } = await log('stocker', { itemId: 'camry' })
      await expect(
        updateSupplierReturn(db, await actor('cashier'), { returnId: id, action: 'reject' })
      ).rejects.toMatchObject({ statusCode: 403 })
      const stocker = await actor('stocker')
      await expect(
        updateSupplierReturn(db, stocker, { returnId: id, action: 'edit', supplierName: ' ' })
      ).rejects.toMatchObject({ statusCode: 400 })
      await updateSupplierReturn(db, stocker, { returnId: id, action: 'reject', note: 'Wear' })
      await expect(
        updateSupplierReturn(db, stocker, { returnId: id, action: 'resolve', outcome: 'refund' })
      ).rejects.toMatchObject({ statusCode: 409 })
      await expect(
        updateSupplierReturn(db, stocker, { returnId: id, action: 'send' })
      ).rejects.toMatchObject({ statusCode: 409 })
    })
  })

  describe('back in stock after repair or replacement', () => {
    async function closeAs(itemId: string, outcome: string, extra: Record<string, unknown> = {}) {
      const stocker = await actor('stocker')
      const { returnId } = await log('stocker', {
        itemId,
        ...(itemId === 'tyre' && { quantity: 3 }),
      })
      await updateSupplierReturn(db, stocker, { returnId, action: 'send' })
      await updateSupplierReturn(db, stocker, { returnId, action: 'resolve', outcome, ...extra })
      return returnId
    }

    it('repaired: the same unit comes back under its old id, free to sell', async () => {
      const returnId = await closeAs('camry', 'repaired')
      const back = (await item('camry').get()).data()
      expect(back).toMatchObject({
        name: 'Toyota Camry',
        serialNo: 'VIN123',
        unitCost: 18_000_000,
        storeId: STORE,
        returnedFromSupplier: { returnId, supplierName: 'Apapa Auto Imports', outcome: 'repaired' },
      })
      expect(back?.dateOut).toBeUndefined()
      const ret = (await ret_(returnId)).data()!
      expect(ret.restockedAt).toBeTruthy()
      expect(ret.restockedItemId).toBe('camry')
      expect(ret.history.at(-1).note).toBe('Back in stock')
    })

    it('replacement: a new unit with the new serial, origin cleared', async () => {
      await expect(closeAs('civic', 'replacement')).rejects.toMatchObject({
        data: { code: 'SERIAL_REQUIRED' },
      })
      // The failed close left the return open; close it properly.
      const open = (await store().collection('supplierReturns').get()).docs[0]!
      await updateSupplierReturn(db, await actor('stocker'), {
        returnId: open.id,
        action: 'resolve',
        outcome: 'replacement',
        newSerial: 'VIN-NEW-1',
      })
      const restockedId = (await ret_(open.id)).data()?.restockedItemId
      expect(restockedId).not.toBe('civic')
      const unit = (await item(restockedId).get()).data()
      expect(unit).toMatchObject({
        name: 'Honda Civic',
        serialNo: 'VIN-NEW-1',
        createdBy: 'stocker',
      })
      expect(unit?.transferId).toBeUndefined()
      expect((await item('civic').get()).exists).toBe(false)
    })

    it('bulk: units are added back to the row', async () => {
      await closeAs('tyre', 'repaired')
      expect((await item('tyre').get()).data()?.quantity).toBe(10)
    })

    it('refunds and credit notes leave stock out', async () => {
      await closeAs('camry', 'credit_note')
      expect((await item('camry').get()).exists).toBe(false)
    })

    it('puts an older repaired return back in stock once', async () => {
      const stocker = await actor('stocker')
      const returnId = await closeAs('camry', 'credit_note')
      await expect(
        updateSupplierReturn(db, stocker, { returnId, action: 'restock' })
      ).rejects.toMatchObject({ data: { code: 'NOT_RESTOCKABLE' } })
      // A return closed as repaired before restocking existed: no restockedAt yet.
      await store().collection('supplierReturns').doc(returnId).update({ outcome: 'repaired' })
      await updateSupplierReturn(db, stocker, { returnId, action: 'restock' })
      expect((await item('camry').get()).exists).toBe(true)
      await expect(
        updateSupplierReturn(db, stocker, { returnId, action: 'restock' })
      ).rejects.toMatchObject({ data: { code: 'ALREADY_RESTOCKED' } })
    })

    it('refuses to restore a unit that is already back in inventory', async () => {
      const stocker = await actor('stocker')
      const { returnId } = await log('stocker', { itemId: 'camry' })
      await item('camry').set({ folderId: 'cars', storeId: STORE, name: 'Re-added by hand' })
      await expect(
        updateSupplierReturn(db, stocker, { returnId, action: 'resolve', outcome: 'repaired' })
      ).rejects.toMatchObject({ data: { code: 'ALREADY_IN_STOCK' } })
      expect((await ret_(returnId)).data()?.status).toBe('ready')
    })
  })
})
