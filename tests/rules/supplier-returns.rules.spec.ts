import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest'
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing'
import { deleteDoc, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore'

const STORE = 'users/u1/stores/s1'
const RETURN = `${STORE}/supplierReturns/r1_item1`
const HOLD = `${STORE}/inspectionHolds/r1_item1`
const HELD_ITEM = `${STORE}/inventoryItems/held`
const WRITE_OFF = `${STORE}/stockWriteOffs/w1`

describe('firestore.rules: supplier returns', () => {
  let testEnv: RulesTestEnvironment

  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: 'storv-ui-supplier-returns',
      firestore: { rules: readFileSync(resolve(process.cwd(), 'firestore.rules'), 'utf8') },
    })
  })

  afterAll(async () => {
    await testEnv.cleanup()
  })

  beforeEach(async () => {
    await testEnv.clearFirestore()
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore()
      await setDoc(doc(db, 'users/u1'), {
        uid: 'u1',
        role: 'superAdmin',
        subscription: 'storvv_enterprise',
      })
      await setDoc(doc(db, STORE), { ownerId: 'u1', name: 'Lagos' })
      const member = (uid: string, productsView: boolean) =>
        setDoc(doc(db, `${STORE}/members/${uid}`), {
          authUid: uid,
          status: 'active',
          permissions: {
            products: { view: productsView, create: false, edit: false, delete: false },
            receipts: { view: true, create: true, edit: false, delete: false, refund: true },
          },
        })
      await member('viewer', true)
      await member('noProducts', false)
      await setDoc(doc(db, RETURN), { storeId: 's1', status: 'ready' })
      await setDoc(doc(db, HOLD), { storeId: 's1', status: 'held' })
      await setDoc(doc(db, WRITE_OFF), { storeId: 's1', reason: 'damaged', costValue: 100 })
      await setDoc(doc(db, HELD_ITEM), {
        storeId: 's1',
        folderId: 'f1',
        name: 'iPhone',
        inspectionHoldId: 'r1_item1',
      })
      await setDoc(doc(db, `${STORE}/inventoryItems/free`), {
        storeId: 's1',
        folderId: 'f1',
        name: 'Case',
      })
    })
  })

  const as = (uid: string) => testEnv.authenticatedContext(uid).firestore()

  it('lets the owner and staff who can see products read returns', async () => {
    await assertSucceeds(getDoc(doc(as('u1'), RETURN)))
    await assertSucceeds(getDoc(doc(as('viewer'), RETURN)))
  })

  it('hides returns from staff without products access and from strangers', async () => {
    await assertFails(getDoc(doc(as('noProducts'), RETURN)))
    await assertFails(getDoc(doc(as('stranger'), RETURN)))
  })

  it('never accepts client writes, even from the owner', async () => {
    await assertFails(updateDoc(doc(as('u1'), RETURN), { status: 'resolved' }))
    await assertFails(setDoc(doc(as('u1'), `${STORE}/supplierReturns/new`), { storeId: 's1' }))
    await assertFails(deleteDoc(doc(as('u1'), RETURN)))
  })

  it('lets products viewers read holds, never write them', async () => {
    await assertSucceeds(getDoc(doc(as('viewer'), HOLD)))
    await assertFails(getDoc(doc(as('noProducts'), HOLD)))
    await assertFails(updateDoc(doc(as('u1'), HOLD), { status: 'restocked' }))
  })

  it('never lets a client set, clear or delete around an inspection hold', async () => {
    const ownerDb = as('u1')
    await assertFails(updateDoc(doc(ownerDb, HELD_ITEM), { inspectionHoldId: null }))
    await assertFails(deleteDoc(doc(ownerDb, HELD_ITEM)))
    await assertFails(
      updateDoc(doc(ownerDb, `${STORE}/inventoryItems/free`), { inspectionHoldId: 'x' })
    )
    await assertFails(
      setDoc(doc(ownerDb, `${STORE}/inventoryItems/new`), {
        storeId: 's1',
        folderId: 'f1',
        inspectionHoldId: 'x',
      })
    )
    // Ordinary edits to a held unit's details still work.
    await assertSucceeds(updateDoc(doc(ownerDb, HELD_ITEM), { name: 'iPhone 15' }))
  })

  it('lets products viewers read write-offs, and nobody write them from the client', async () => {
    await assertSucceeds(getDoc(doc(as('viewer'), WRITE_OFF)))
    await assertFails(getDoc(doc(as('noProducts'), WRITE_OFF)))
    await assertFails(updateDoc(doc(as('u1'), WRITE_OFF), { costValue: 0 }))
    await assertFails(deleteDoc(doc(as('u1'), WRITE_OFF)))
    await assertFails(setDoc(doc(as('u1'), `${STORE}/stockWriteOffs/new`), { storeId: 's1' }))
  })

  it('never lets the app delete inventory rows: deletes go through the server', async () => {
    await assertFails(deleteDoc(doc(as('u1'), `${STORE}/inventoryItems/free`)))
  })

  it('lets a products editor add a count-reduction record, and nothing else', async () => {
    const editorDb = testEnv.authenticatedContext('u1').firestore()
    const base = {
      storeId: 's1',
      kind: 'count_reduced',
      createdBy: 'u1',
      quantity: 3,
      restoredAt: null,
    }
    await assertSucceeds(setDoc(doc(editorDb, `${STORE}/stockRemovals/cr1`), base))
    await assertFails(
      setDoc(doc(editorDb, `${STORE}/stockRemovals/cr2`), { ...base, kind: 'deleted' })
    )
    await assertFails(
      setDoc(doc(editorDb, `${STORE}/stockRemovals/cr3`), { ...base, createdBy: 'someone-else' })
    )
    await assertFails(setDoc(doc(editorDb, `${STORE}/stockRemovals/cr4`), { ...base, quantity: 0 }))
    await assertFails(updateDoc(doc(editorDb, `${STORE}/stockRemovals/cr1`), { quantity: 1 }))
    await assertFails(deleteDoc(doc(editorDb, `${STORE}/stockRemovals/cr1`)))
    // Viewers without edit can read the log but not add to it.
    await assertSucceeds(getDoc(doc(as('viewer'), `${STORE}/stockRemovals/cr1`)))
    await assertFails(
      setDoc(doc(as('viewer'), `${STORE}/stockRemovals/cr5`), { ...base, createdBy: 'viewer' })
    )
  })
})
