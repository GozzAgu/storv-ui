import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { deleteApp, initializeApp, type App } from 'firebase-admin/app'
import { getFirestore, type Firestore } from 'firebase-admin/firestore'
import { runTransferAction } from '~/server/utils/transfers/service'

const OWNER = 'owner1'
const LAGOS = 'lagos'
const PH = 'ph'
const TRANSFERS_FULL = { view: true, create: true, edit: true, delete: false }

describe.skipIf(!process.env.FIRESTORE_EMULATOR_HOST)('stock transfers (emulator)', () => {
  let app: App
  let db: Firestore

  const owner = () => db.collection('users').doc(OWNER)
  const branch = (id: string) => owner().collection('stores').doc(id)
  const items = (id: string) => branch(id).collection('inventoryItems')
  const transferDoc = (id: string) => owner().collection('storeTransfers').doc(id)
  const act = (uid: string, transferId: string, action: string, extra = {}) =>
    runTransferAction(db, uid, { ownerUserId: OWNER, transferId, action, ...extra })

  async function requestTransfer(
    id: string,
    lines: Array<{ itemId: string; quantity: number; itemName: string }>,
    serial: boolean
  ) {
    await transferDoc(id).set({
      sourceStoreId: LAGOS,
      destinationStoreId: PH,
      sourceStoreName: 'Lagos',
      destinationStoreName: 'Port Harcourt',
      folderId: serial ? 'phones' : 'cables',
      destinationFolderId: serial ? 'phones' : 'cables',
      hasSerialNumbers: serial,
      items: lines,
      itemsCount: lines.length,
      status: 'pending_approval',
      createdBy: 'lagosManager',
    })
  }

  beforeAll(() => {
    app = initializeApp({ projectId: 'storv-ui-test-transfers' }, `transfers-${randomUUID()}`)
    db = getFirestore(app)
  })

  afterAll(async () => {
    await deleteApp(app)
  })

  beforeEach(async () => {
    await db.recursiveDelete(owner())
    await owner().set({ uid: OWNER, role: 'superAdmin', subscription: 'storvv_enterprise' })
    for (const id of [LAGOS, PH]) {
      await branch(id).set({ ownerId: OWNER, name: id })
      await branch(id)
        .collection('inventoryFolders')
        .doc('phones')
        .set({ name: 'Phones', hasSerialNumbers: true })
      await branch(id)
        .collection('inventoryFolders')
        .doc('cables')
        .set({ name: 'Cables', hasSerialNumbers: false })
    }
    // Sending branch: a manager who runs transfers. Receiving branch: an admin without the
    // transfers extra, who can still approve what arrives in their own branch.
    await branch(LAGOS)
      .collection('members')
      .doc('lagosManager')
      .set({
        authUid: 'lagosManager',
        status: 'active',
        permissions: { multiStoreSync: TRANSFERS_FULL },
      })
    await branch(PH).collection('members').doc('phAdmin').set({
      authUid: 'phAdmin',
      status: 'active',
      admin: true,
      adminGrants: {},
    })
    await branch(PH)
      .collection('members')
      .doc('phCashier')
      .set({ authUid: 'phCashier', status: 'active' })

    await items(LAGOS)
      .doc('iphone')
      .set({ name: 'iPhone 13', serialNo: 'SN1', folderId: 'phones', storeId: LAGOS })
    await items(LAGOS)
      .doc('cable')
      .set({ name: 'USB-C cable', folderId: 'cables', storeId: LAGOS, quantity: 10, Quantity: 10 })
    await items(PH)
      .doc('cable-ph')
      .set({ name: 'USB-C cable', folderId: 'cables', storeId: PH, quantity: 2, Quantity: 2 })
  })

  it('moves nothing into the receiving branch until its admin approves', async () => {
    await requestTransfer('t1', [{ itemId: 'iphone', quantity: 1, itemName: 'iPhone 13' }], true)

    // The receiving admin can't dispatch someone else's stock; the sender's manager can.
    await expect(act('phAdmin', 't1', 'dispatch')).rejects.toMatchObject({ statusCode: 403 })
    await act('lagosManager', 't1', 'dispatch')
    expect((await transferDoc('t1').get()).data()?.status).toBe('in_transit')
    expect((await items(LAGOS).doc('iphone').get()).exists).toBe(true)

    // The receiving branch's approvers hear about it.
    const feed = await branch(PH).collection('notifications').get()
    expect(feed.docs.map((d) => d.data().type)).toEqual(['transfer_awaiting_receipt'])
    expect(feed.docs[0]!.data().recipientUids).toEqual([OWNER, 'phAdmin'])

    // Only the receiving branch's admin (or the owner) can accept the stock.
    await expect(act('lagosManager', 't1', 'receive')).rejects.toMatchObject({ statusCode: 403 })
    await expect(act('phCashier', 't1', 'receive')).rejects.toMatchObject({ statusCode: 403 })

    const result = await act('phAdmin', 't1', 'receive')
    expect(result).toEqual({ status: 'completed', moved: 1, skipped: [] })
    expect((await items(LAGOS).doc('iphone').get()).exists).toBe(false)
    const arrived = await items(PH).where('serialNo', '==', 'SN1').get()
    expect(arrived.docs[0]?.data()).toMatchObject({
      folderId: 'phones',
      storeId: PH,
      transferredFrom: LAGOS,
    })
    expect((await transferDoc('t1').get()).data()).toMatchObject({
      status: 'completed',
      receivedBy: 'phAdmin',
    })

    // Approving twice does nothing.
    await expect(act('phAdmin', 't1', 'receive')).rejects.toMatchObject({ statusCode: 409 })
  })

  it('merges bulk stock and reports lines that could no longer move', async () => {
    await requestTransfer(
      't2',
      [
        { itemId: 'cable', quantity: 4, itemName: 'USB-C cable' },
        { itemId: 'gone', quantity: 1, itemName: 'Charger' },
      ],
      false
    )
    await act('lagosManager', 't2', 'dispatch')
    const result = await act(OWNER, 't2', 'receive')

    expect(result.status).toBe('partial')
    expect(result.moved).toBe(1)
    expect(result.skipped).toEqual(['Charger is no longer in the sending branch'])
    expect((await items(LAGOS).doc('cable').get()).data()?.quantity).toBe(6)
    expect((await items(PH).doc('cable-ph').get()).data()?.quantity).toBe(6)
  })

  it('rejecting needs a reason and leaves the stock with the sender', async () => {
    await requestTransfer('t3', [{ itemId: 'cable', quantity: 3, itemName: 'USB-C cable' }], false)
    await act('lagosManager', 't3', 'dispatch')

    await expect(act('phAdmin', 't3', 'reject')).rejects.toMatchObject({ statusCode: 400 })
    await act('phAdmin', 't3', 'reject', { reason: 'Box arrived crushed' })

    expect((await transferDoc('t3').get()).data()).toMatchObject({
      status: 'rejected',
      rejectionReason: 'Box arrived crushed',
    })
    expect((await items(LAGOS).doc('cable').get()).data()?.quantity).toBe(10)
    expect((await items(PH).doc('cable-ph').get()).data()?.quantity).toBe(2)
    const senderFeed = await branch(LAGOS).collection('notifications').get()
    expect(senderFeed.docs.map((d) => d.data().type)).toEqual(['transfer_rejected'])
  })

  it('hides transfers from people outside both branches', async () => {
    await requestTransfer('t4', [{ itemId: 'cable', quantity: 1, itemName: 'USB-C cable' }], false)
    await expect(act('stranger', 't4', 'cancel')).rejects.toMatchObject({ statusCode: 404 })
  })
})
