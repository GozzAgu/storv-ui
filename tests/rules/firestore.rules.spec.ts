import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, it, beforeAll, afterAll, beforeEach } from 'vitest'
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing'
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore'

describe('firestore.rules', () => {
  let testEnv: RulesTestEnvironment

  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: 'storv-ui-test',
      firestore: {
        rules: readFileSync(resolve(process.cwd(), 'firestore.rules'), 'utf8'),
      },
    })
  })

  afterAll(async () => {
    await testEnv.cleanup()
  })

  beforeEach(async () => {
    await testEnv.clearFirestore()
  })

  it('allows super admin to read own store doc', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'users/u1/stores/s1'), {
        ownerId: 'u1',
        createdBy: 'u1',
        name: 'Main store',
      })
    })

    const db = testEnv.authenticatedContext('u1').firestore()
    await assertSucceeds(getDoc(doc(db, 'users/u1/stores/s1')))
  })

  it('denies random user from reading another owner store doc', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'users/u1/stores/s1'), { ownerId: 'u1' })
    })

    const db = testEnv.authenticatedContext('u2').firestore()
    await assertFails(getDoc(doc(db, 'users/u1/stores/s1')))
  })

  it('denies unauthenticated read of store doc', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'users/u1/stores/s1'), { ownerId: 'u1' })
    })

    const db = testEnv.unauthenticatedContext().firestore()
    await assertFails(getDoc(doc(db, 'users/u1/stores/s1')))
  })

  it('allows owner to read own user doc', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'users/u1'), {
        uid: 'u1',
        email: 'a@b.com',
        name: 'Owner',
        role: 'superAdmin',
        subscription: 'storvv_micro',
        hasCompletedOnboarding: true,
        hasCompletedTutorial: false,
      })
    })

    const db = testEnv.authenticatedContext('u1').firestore()
    await assertSucceeds(getDoc(doc(db, 'users/u1')))
  })

  it('denies other users from reading owner user doc', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'users/u1'), {
        uid: 'u1',
        email: 'a@b.com',
        name: 'Owner',
        role: 'superAdmin',
        subscription: 'storvv_micro',
        hasCompletedOnboarding: true,
        hasCompletedTutorial: false,
      })
    })

    const db = testEnv.authenticatedContext('u2').firestore()
    await assertFails(getDoc(doc(db, 'users/u1')))
  })

  it('denies client updates to subscription field', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'users/u1'), {
        uid: 'u1',
        email: 'a@b.com',
        name: 'Owner',
        role: 'superAdmin',
        subscription: 'storvv_micro',
        hasCompletedOnboarding: true,
        hasCompletedTutorial: false,
      })
    })

    const db = testEnv.authenticatedContext('u1').firestore()
    await assertFails(
      setDoc(
        doc(db, 'users/u1'),
        { subscription: 'storvv_enterprise' },
        { merge: true }
      )
    )
  })

  it('allows staff to decrement bulk quantity during POS sale', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const adminDb = context.firestore()
      await setDoc(doc(adminDb, 'users/u1/stores/s1'), { ownerId: 'u1', storeId: 's1' })
      await setDoc(doc(adminDb, 'users/u1/stores/s1/members/staff1'), {
        authUid: 'staff1',
        role: 'staff',
        status: 'active',
        storeId: 's1',
      })
      await setDoc(doc(adminDb, 'users/u1/stores/s1/inventoryItems/item1'), {
        storeId: 's1',
        folderId: 'f1',
        name: 'Opulent Dubai',
        quantity: 10,
        createdBy: 'u1',
      })
    })

    const db = testEnv.authenticatedContext('staff1').firestore()
    await assertSucceeds(
      updateDoc(doc(db, 'users/u1/stores/s1/inventoryItems/item1'), {
        quantity: 7,
        updatedAt: serverTimestamp(),
      })
    )
  })

  it('denies staff from changing item price during sale-shaped update', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const adminDb = context.firestore()
      await setDoc(doc(adminDb, 'users/u1/stores/s1'), { ownerId: 'u1', storeId: 's1' })
      await setDoc(doc(adminDb, 'users/u1/stores/s1/members/staff1'), {
        authUid: 'staff1',
        role: 'staff',
        status: 'active',
        storeId: 's1',
      })
      await setDoc(doc(adminDb, 'users/u1/stores/s1/inventoryItems/item1'), {
        storeId: 's1',
        folderId: 'f1',
        name: 'Opulent Dubai',
        quantity: 10,
        price: 30000,
        createdBy: 'u1',
      })
    })

    const db = testEnv.authenticatedContext('staff1').firestore()
    await assertFails(
      updateDoc(doc(db, 'users/u1/stores/s1/inventoryItems/item1'), {
        quantity: 7,
        price: 1,
        updatedAt: serverTimestamp(),
      })
    )
  })

  it('allows staff to create a receipt for their store', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const adminDb = context.firestore()
      await setDoc(doc(adminDb, 'users/u1/stores/s1'), { ownerId: 'u1', storeId: 's1' })
      await setDoc(doc(adminDb, 'users/u1/stores/s1/members/staff1'), {
        authUid: 'staff1',
        role: 'staff',
        status: 'active',
        storeId: 's1',
      })
    })

    const db = testEnv.authenticatedContext('staff1').firestore()
    await assertSucceeds(
      setDoc(doc(db, 'users/u1/stores/s1/receipts/rec1'), {
        storeId: 's1',
        receiptNumber: 'REC-001',
        customerName: 'Walk-in Customer',
        total: 66000,
        status: 'completed',
        createdBy: 'u1',
        items: [],
        itemIds: [],
        folderId: 'f1',
      })
    )
  })
})
