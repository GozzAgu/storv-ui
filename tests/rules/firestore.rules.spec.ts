import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, it, beforeAll, afterAll, beforeEach } from 'vitest'
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing'
import { doc, getDoc, setDoc } from 'firebase/firestore'

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

  async function seedOwner(
    context: Parameters<RulesTestEnvironment['withSecurityRulesDisabled']>[0] extends (
      c: infer C
    ) => unknown
      ? C
      : never,
    userId: string,
    subscription: string
  ) {
    await setDoc(doc(context.firestore(), `users/${userId}`), {
      uid: userId,
      email: `${userId}@example.com`,
      name: 'Owner',
      role: 'superAdmin',
      subscription,
      hasCompletedOnboarding: true,
      hasCompletedTutorial: false,
    })
  }

  async function seedStore(
    context: Parameters<RulesTestEnvironment['withSecurityRulesDisabled']>[0] extends (
      c: infer C
    ) => unknown
      ? C
      : never,
    userId: string,
    storeId: string
  ) {
    await setDoc(doc(context.firestore(), `users/${userId}/stores/${storeId}`), {
      ownerId: userId,
      storeId,
      name: 'Main store',
    })
  }

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

  it('denies Micro plan from creating a sales lead', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await seedOwner(context, 'u1', 'storvv_micro')
      await seedStore(context, 'u1', 's1')
    })

    const db = testEnv.authenticatedContext('u1').firestore()
    await assertFails(
      setDoc(doc(db, 'users/u1/stores/s1/salesLeads/lead1'), {
        storeId: 's1',
        customerName: 'Jane Doe',
        productName: 'iPhone 15',
        source: 'walk_in',
        status: 'new',
        estimatedValue: 0,
        createdBy: 'u1',
      })
    )
  })

  it('allows Medium plan owner to create a sales lead', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await seedOwner(context, 'u1', 'storvv_medium')
      await seedStore(context, 'u1', 's1')
    })

    const db = testEnv.authenticatedContext('u1').firestore()
    await assertSucceeds(
      setDoc(doc(db, 'users/u1/stores/s1/salesLeads/lead1'), {
        storeId: 's1',
        customerName: 'Jane Doe',
        productName: 'iPhone 15',
        source: 'walk_in',
        status: 'new',
        estimatedValue: 0,
        createdBy: 'u1',
      })
    )
  })

  it('denies Micro plan from writing customer balance ledger docs', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await seedOwner(context, 'u1', 'storvv_micro')
      await seedStore(context, 'u1', 's1')
    })

    const db = testEnv.authenticatedContext('u1').firestore()
    await assertFails(
      setDoc(doc(db, 'users/u1/stores/s1/customerAccounts/cust1'), {
        storeId: 's1',
        customerId: 'cust1',
        balance: 0,
      })
    )
  })

  it('denies Micro plan from writing activity logs', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await seedOwner(context, 'u1', 'storvv_micro')
      await seedStore(context, 'u1', 's1')
    })

    const db = testEnv.authenticatedContext('u1').firestore()
    await assertFails(
      setDoc(doc(db, 'users/u1/stores/s1/activityLogs/log1'), {
        storeId: 's1',
        userId: 'u1',
        userDisplayName: 'Owner',
        action: 'created',
        entityType: 'item',
        entityId: 'item1',
        entityName: 'Widget',
      })
    )
  })

  it('denies Medium plan from creating store transfers', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await seedOwner(context, 'u1', 'storvv_medium')
      await seedStore(context, 'u1', 's1')
    })

    const db = testEnv.authenticatedContext('u1').firestore()
    await assertFails(
      setDoc(doc(db, 'users/u1/storeTransfers/t1'), {
        createdBy: 'u1',
        fromStoreId: 's1',
        toStoreId: 's2',
      })
    )
  })

  it('allows Enterprise plan owner to create store transfers', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await seedOwner(context, 'u1', 'storvv_enterprise')
      await seedStore(context, 'u1', 's1')
    })

    const db = testEnv.authenticatedContext('u1').firestore()
    await assertSucceeds(
      setDoc(doc(db, 'users/u1/storeTransfers/t1'), {
        createdBy: 'u1',
        fromStoreId: 's1',
        toStoreId: 's2',
      })
    )
  })
})
