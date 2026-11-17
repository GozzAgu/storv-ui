import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { deleteApp, initializeApp, type App } from 'firebase-admin/app'
import { getFirestore, type Firestore } from 'firebase-admin/firestore'
import { resolveStoreActor } from '~/server/utils/sales/actor'
import { runBulkPriceUpdate } from '~/server/utils/inventory/bulk-price'

const OWNER = 'owner1'
const STORE = 'lagos'
const PRODUCTS_EDIT = { view: true, create: false, edit: true, delete: false }

describe.skipIf(!process.env.FIRESTORE_EMULATOR_HOST)('bulk price update (emulator)', () => {
  let app: App
  let db: Firestore

  const store = () => db.collection('users').doc(OWNER).collection('stores').doc(STORE)
  const items = () => store().collection('inventoryItems')
  const run = async (uid: string, body: Record<string, unknown>) =>
    runBulkPriceUpdate(db, await resolveStoreActor(db, uid, OWNER, STORE), body)
  const errorOf = (p: Promise<unknown>) =>
    p.then(
      () => null,
      (e: { statusCode?: number; message?: string }) => ({ status: e.statusCode, message: e.message })
    )

  beforeAll(() => {
    app = initializeApp({ projectId: 'storv-ui-test-bulk-price' }, `bulk-price-${randomUUID()}`)
    db = getFirestore(app)
  })

  afterAll(async () => {
    await deleteApp(app)
  })

  beforeEach(async () => {
    await db.recursiveDelete(db.collection('users').doc(OWNER))
    await db.collection('users').doc(OWNER).set({ uid: OWNER, subscription: 'storvv_enterprise' })
    await store().set({ ownerId: OWNER, name: 'Lagos' })
    await store()
      .collection('inventoryFolders')
      .doc('acura')
      .set({ name: 'Acura', hasSerialNumbers: true, allowedDepartments: ['sales'] })
    await store().collection('inventoryFolders').doc('cables').set({ name: 'Cables' })
    const members = store().collection('members')
    await members.doc('manager').set({
      authUid: 'manager',
      status: 'active',
      departmentId: 'sales',
      permissions: { products: PRODUCTS_EDIT },
    })
    await members.doc('cashier').set({ authUid: 'cashier', status: 'active', departmentId: 'sales' })
    await members.doc('warehouse').set({
      authUid: 'warehouse',
      status: 'active',
      departmentId: 'warehouse',
      permissions: { products: PRODUCTS_EDIT },
    })
    const acura = (id: string, extra: Record<string, unknown> = {}) =>
      items()
        .doc(id)
        .set({
          name: 'Acura',
          brand: 'MDX',
          serialNo: id,
          price: 15_000_000,
          unitCost: 8_000_000,
          folderId: 'acura',
          storeId: STORE,
          ...extra,
        })
    await acura('a1', { dateOut: '2026-10-19' })
    await acura('a2')
    await acura('a3')
    await acura('a4', { sellerLoanOutId: 'loan1' })
    await items().doc('c1').set({ name: 'Cable', price: 500, folderId: 'cables', storeId: STORE })
  })

  it('updates unsold items, leaves sold/loaned ones, and writes history and an activity log', async () => {
    const result = await run(OWNER, {
      folderId: 'acura',
      itemIds: ['a1', 'a2', 'a3', 'a4', 'c1'],
      unitPrice: { mode: 'set', value: 16_500_000 },
      costPrice: { mode: 'percent', value: 10 },
    })
    expect(result.updated).toBe(2)
    expect(result.skipped).toEqual({ sold: 1, on_loan: 1, not_found: 1 })

    const after = Object.fromEntries((await items().get()).docs.map((d) => [d.id, d.data()]))
    expect(after.a2).toMatchObject({ price: 16_500_000, unitCost: 8_800_000 })
    expect(after.a3).toMatchObject({ price: 16_500_000, unitCost: 8_800_000 })
    expect(after.a1).toMatchObject({ price: 15_000_000, unitCost: 8_000_000 })
    expect(after.a4).toMatchObject({ price: 15_000_000 })
    // An item from another category is never touched, even if its id is sent.
    expect(after.c1).toMatchObject({ price: 500 })

    const history = await store().collection('inventoryAuditLogs').get()
    expect(history.size).toBe(4)
    expect(history.docs.map((d) => d.data().userId)).toEqual(Array(4).fill(OWNER))
    const logs = await store().collection('activityLogs').get()
    expect(logs.size).toBe(1)
    expect(logs.docs[0]!.data()).toMatchObject({
      action: 'updated',
      entityType: 'items_batch',
      source: 'server',
    })
    expect(logs.docs[0]!.data().entityName).toMatch(/unit price and cost price of 2 products/)
  })

  it('sets a different price per item (Excel import) and still skips sold ones', async () => {
    const result = await run(OWNER, {
      folderId: 'acura',
      updates: [
        { itemId: 'a1', unitPrice: 1 },
        { itemId: 'a2', unitPrice: 16_000_000 },
        { itemId: 'a3', costPrice: 9_000_000 },
      ],
    })
    expect(result.updated).toBe(2)
    expect(result.skipped).toEqual({ sold: 1 })
    const after = Object.fromEntries((await items().get()).docs.map((d) => [d.id, d.data()]))
    expect(after.a1).toMatchObject({ price: 15_000_000 })
    expect(after.a2).toMatchObject({ price: 16_000_000, unitCost: 8_000_000 })
    expect(after.a3).toMatchObject({ price: 15_000_000, unitCost: 9_000_000 })
    const logs = await store().collection('activityLogs').get()
    expect(logs.docs[0]!.data().entityName).toMatch(/from an Excel import/)
  })

  it('lets a products.edit member in the category do it', async () => {
    const result = await run('manager', {
      folderId: 'acura',
      itemIds: ['a2'],
      unitPrice: { mode: 'percent', value: -10 },
    })
    expect(result.updated).toBe(1)
    expect((await items().doc('a2').get()).data()?.price).toBe(13_500_000)
  })

  it('refuses members without products.edit and members locked out of the category', async () => {
    const body = { folderId: 'acura', itemIds: ['a2'], unitPrice: { mode: 'set', value: 1 } }
    expect(await errorOf(run('cashier', body))).toMatchObject({ status: 403 })
    expect(await errorOf(run('warehouse', body))).toMatchObject({ status: 403 })
    expect(await errorOf(run('stranger', body))).toMatchObject({ status: 404 })
    expect((await items().doc('a2').get()).data()?.price).toBe(15_000_000)
  })

  it('answers 404 for a category that does not exist', async () => {
    expect(
      await errorOf(
        run(OWNER, { folderId: 'nope', itemIds: ['a2'], unitPrice: { mode: 'set', value: 1 } })
      )
    ).toMatchObject({ status: 404 })
  })
})
