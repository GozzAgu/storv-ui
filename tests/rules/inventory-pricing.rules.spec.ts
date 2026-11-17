import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest'
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing'
import { addDoc, collection, doc, setDoc, updateDoc } from 'firebase/firestore'

const STORE = 'users/owner/stores/s1'

/**
 * Prices can be changed one item at a time from the app (rules) or many at once through
 * POST /api/inventory/bulk-price (Admin SDK). Both must allow the same people: the owner and
 * members granted products.edit.
 */
describe('firestore.rules: who can change product prices', () => {
  let testEnv: RulesTestEnvironment

  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: 'storv-ui-inventory-pricing',
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
      await setDoc(doc(db, 'users/owner'), { uid: 'owner', role: 'superAdmin' })
      await setDoc(doc(db, STORE), { ownerId: 'owner', storeId: 's1', name: 'Lagos' })
      await setDoc(doc(db, `${STORE}/members/manager`), {
        authUid: 'manager',
        status: 'active',
        permissions: { products: { view: true, create: false, edit: true, delete: false } },
      })
      await setDoc(doc(db, `${STORE}/members/cashier`), {
        authUid: 'cashier',
        status: 'active',
        permissions: { products: { view: true, create: false, edit: false, delete: false } },
      })
      await setDoc(doc(db, `${STORE}/inventoryFolders/acura`), { name: 'Acura', storeId: 's1' })
      await setDoc(doc(db, `${STORE}/inventoryItems/a1`), {
        name: 'Acura',
        brand: 'MDX',
        price: 15_000_000,
        unitCost: 8_000_000,
        folderId: 'acura',
        storeId: 's1',
      })
    })
  })

  const as = (uid: string) => testEnv.authenticatedContext(uid).firestore()
  const item = (uid: string) => doc(as(uid), `${STORE}/inventoryItems/a1`)
  const reprice = { price: 16_000_000, unitCost: 9_000_000, storeId: 's1' }

  it('lets the owner and products.edit members change a price', async () => {
    await assertSucceeds(updateDoc(item('owner'), reprice))
    await assertSucceeds(updateDoc(item('manager'), reprice))
  })

  it('refuses members without products.edit', async () => {
    await assertFails(updateDoc(item('cashier'), reprice))
  })

  it('refuses price-history entries written in someone else’s name', async () => {
    const history = (uid: string) => collection(as(uid), `${STORE}/inventoryAuditLogs`)
    const entry = { itemId: 'a1', field: 'price', storeId: 's1', previousValue: 1, newValue: 2 }
    await assertSucceeds(addDoc(history('manager'), { ...entry, userId: 'manager' }))
    await assertFails(addDoc(history('manager'), { ...entry, userId: 'owner' }))
  })
})
