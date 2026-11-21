// @vitest-environment node
import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { deleteApp, initializeApp, type App } from 'firebase-admin/app'
import { Timestamp, getFirestore, type Firestore } from 'firebase-admin/firestore'
import { resolveStoreActor } from '~/server/utils/sales/actor'
import { removeCategoryItems, removeItems, restoreRemoval } from '~/server/utils/stock-removals'

const OWNER = 'rmOwner'
const STORE = 'rmStore'
const RECEIPTS = { view: true, create: true, edit: false, delete: false, refund: false }
const EDIT_ONLY = { view: true, create: true, edit: true, delete: false }
const FULL = { view: true, create: true, edit: true, delete: true }

describe.skipIf(!process.env.FIRESTORE_EMULATOR_HOST)('stock removals (emulator)', () => {
  let app: App
  let db: Firestore

  const owner = () => db.collection('users').doc(OWNER)
  const store = () => owner().collection('stores').doc(STORE)
  const item = (id: string) => store().collection('inventoryItems').doc(id)
  const removals = () => store().collection('stockRemovals')
  const actor = (uid: string) => resolveStoreActor(db, uid, OWNER, STORE)

  beforeAll(() => {
    app = initializeApp({ projectId: 'storv-ui-test-removals' }, `rm-${randomUUID()}`)
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
      .set({ name: 'Phones', hasSerialNumbers: true, template: { fields: [{ name: 'name' }] } })
    await store()
      .collection('inventoryFolders')
      .doc('cables')
      .set({ name: 'Cables', template: { fields: [{ name: 'name' }, { name: 'quantity' }] } })
    const add = (id: string, data: Record<string, unknown>) =>
      item(id).set({ storeId: STORE, createdAt: Timestamp.now(), ...data })
    await add('iphone', {
      folderId: 'phones',
      name: 'iPhone 15',
      serialNo: 'SN1',
      unitCost: 700_000,
    })
    await add('pixel', { folderId: 'phones', name: 'Pixel 8', serialNo: 'SN2', unitCost: 500_000 })
    await add('usb', { folderId: 'cables', name: 'USB-C', quantity: 10, unitCost: 2_000 })
    await add('sold', { folderId: 'phones', name: 'Sold phone', dateOut: Timestamp.now() })
    await add('loaned', { folderId: 'phones', name: 'Loaned phone', sellerLoanOutId: 'l1' })
    await add('held', { folderId: 'phones', name: 'Held phone', inspectionHoldId: 'h1' })
  })

  it('deletes a product and keeps a full record of it', async () => {
    await removeItems(db, await actor('manager'), {
      itemIds: ['iphone'],
      reason: 'duplicate',
      note: 'Added twice',
    })
    expect((await item('iphone').get()).exists).toBe(false)
    const [rec] = (await removals().get()).docs.map((d) => d.data())
    expect(rec).toMatchObject({
      kind: 'deleted',
      reason: 'duplicate',
      note: 'Added twice',
      quantity: 1,
      costValue: 700_000,
      item: { inventoryItemId: 'iphone', name: 'iPhone 15', folderName: 'Phones', serial: true },
      restoredAt: null,
      createdBy: 'manager',
    })
    expect(rec?.itemSnapshot?.serialNo).toBe('SN1')
  })

  it('records the units on hand when a quantity product is deleted, and bulk deletes in one go', async () => {
    const { removed } = await removeItems(db, await actor('manager'), {
      itemIds: ['usb', 'pixel'],
      reason: 'entered_by_mistake',
    })
    expect(removed).toBe(2)
    const recs = (await removals().get()).docs.map((d) => d.data())
    expect(recs.find((r) => r.item.inventoryItemId === 'usb')).toMatchObject({
      quantity: 10,
      costValue: 20_000,
    })
  })

  it('refuses units accounted for elsewhere, missing reasons and staff without delete', async () => {
    const manager = await actor('manager')
    for (const [id, code] of [
      ['sold', 'ITEM_SOLD'],
      ['loaned', 'ITEM_ON_LOAN'],
      ['held', 'ITEM_ON_INSPECTION'],
    ] as const) {
      await expect(
        removeItems(db, manager, { itemIds: [id], reason: 'entered_by_mistake' })
      ).rejects.toMatchObject({ data: { code } })
    }
    await expect(removeItems(db, manager, { itemIds: ['iphone'] })).rejects.toMatchObject({
      data: { code: 'REASON_REQUIRED' },
    })
    await expect(
      removeItems(db, manager, { itemIds: ['iphone'], reason: 'other' })
    ).rejects.toMatchObject({ data: { code: 'NOTE_REQUIRED' } })
    await expect(
      removeItems(db, await actor('editor'), { itemIds: ['iphone'], reason: 'duplicate' })
    ).rejects.toMatchObject({ statusCode: 403 })
    // A bad item in a bulk delete stops the whole batch: nothing half-deleted.
    await expect(
      removeItems(db, manager, { itemIds: ['iphone', 'sold'], reason: 'duplicate' })
    ).rejects.toMatchObject({ data: { code: 'ITEM_SOLD' } })
    expect((await item('iphone').get()).exists).toBe(true)
    expect((await removals().get()).size).toBe(0)
  })

  it('records every product when a category is deleted, sold ones included', async () => {
    const result = await removeCategoryItems(db, await actor(OWNER), { folderId: 'phones' })
    expect(result).toEqual({ removed: 5, remaining: false })
    const left = await store().collection('inventoryItems').where('folderId', '==', 'phones').get()
    expect(left.size).toBe(0)
    const recs = (await removals().get()).docs.map((d) => d.data())
    expect(recs).toHaveLength(5)
    expect(recs.every((r) => r.kind === 'category_deleted')).toBe(true)
    expect(recs.find((r) => r.item.inventoryItemId === 'sold')?.wasSold).toBe(true)
  })

  it('restores a deleted product exactly, once', async () => {
    const manager = await actor('manager')
    await removeItems(db, manager, { itemIds: ['iphone'], reason: 'entered_by_mistake' })
    const removalId = (await removals().get()).docs[0]!.id
    await restoreRemoval(db, manager, { removalId })
    const back = (await item('iphone').get()).data()
    expect(back).toMatchObject({
      name: 'iPhone 15',
      serialNo: 'SN1',
      restoredFromRemovalId: removalId,
    })
    expect((await removals().doc(removalId).get()).data()?.restoredAt).toBeTruthy()
    await expect(restoreRemoval(db, manager, { removalId })).rejects.toMatchObject({
      data: { code: 'ALREADY_RESTORED' },
    })
  })

  it('won’t restore into a deleted category or over an existing product', async () => {
    const manager = await actor('manager')
    await removeItems(db, manager, { itemIds: ['pixel'], reason: 'entered_by_mistake' })
    const removalId = (await removals().get()).docs[0]!.id
    await item('pixel').set({ folderId: 'phones', storeId: STORE, name: 'Re-added' })
    await expect(restoreRemoval(db, manager, { removalId })).rejects.toMatchObject({
      data: { code: 'ALREADY_IN_STOCK' },
    })
    await item('pixel').delete()
    await store().collection('inventoryFolders').doc('phones').delete()
    await expect(restoreRemoval(db, manager, { removalId })).rejects.toMatchObject({
      data: { code: 'NO_FOLDER' },
    })
  })
})
