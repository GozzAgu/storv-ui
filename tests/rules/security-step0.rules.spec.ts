import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, it, beforeAll, afterAll, beforeEach } from 'vitest'
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing'
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore'

const STAFF_PATH = 'users/owner1/stores/s1/departments/d1/staff/st1'

describe('firestore.rules: Step 0 security fixes', () => {
  let testEnv: RulesTestEnvironment

  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: 'storv-ui-test-security-step0',
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
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore()
      await setDoc(doc(db, 'users/owner1'), {
        uid: 'owner1',
        role: 'superAdmin',
        subscription: 'storvv_micro',
      })
      await setDoc(doc(db, 'users/owner1/stores/s1'), { ownerId: 'owner1', name: 'Main' })
      await setDoc(doc(db, STAFF_PATH), {
        authUid: 'staffUid',
        createdBy: 'owner1',
        name: 'Ada',
        permissions: { sales: true },
        mustChangePassword: true,
        photoURL: null,
      })
      await setDoc(doc(db, 'users/staffUid'), {
        uid: 'staffUid',
        role: 'superAdmin',
        subscription: 'storvv_micro',
        name: 'Ada',
      })
    })
  })

  describe('staff self-service', () => {
    it('denies staff re-pointing createdBy at their own workspace', async () => {
      const db = testEnv.authenticatedContext('staffUid').firestore()
      await assertFails(updateDoc(doc(db, STAFF_PATH), { createdBy: 'staffUid' }))
    })

    it('denies staff editing their own permissions or authUid', async () => {
      const db = testEnv.authenticatedContext('staffUid').firestore()
      await assertFails(updateDoc(doc(db, STAFF_PATH), { permissions: { admin: true } }))
      await assertFails(updateDoc(doc(db, STAFF_PATH), { authUid: 'someoneElse' }))
    })

    it('allows staff to update their own photo', async () => {
      const db = testEnv.authenticatedContext('staffUid').firestore()
      await assertSucceeds(
        updateDoc(doc(db, STAFF_PATH), { photoURL: 'https://example.com/a.png', updatedAt: 1 })
      )
    })

    it('allows staff to clear mustChangePassword but not set it', async () => {
      const db = testEnv.authenticatedContext('staffUid').firestore()
      await assertSucceeds(updateDoc(doc(db, STAFF_PATH), { mustChangePassword: false }))
      await assertFails(updateDoc(doc(db, STAFF_PATH), { mustChangePassword: true }))
    })

    it('lets staff read their own record and the owner read it, but not other users', async () => {
      await assertSucceeds(
        getDoc(doc(testEnv.authenticatedContext('staffUid').firestore(), STAFF_PATH))
      )
      await assertSucceeds(
        getDoc(doc(testEnv.authenticatedContext('owner1').firestore(), STAFF_PATH))
      )
      await assertFails(
        getDoc(doc(testEnv.authenticatedContext('stranger').firestore(), STAFF_PATH))
      )
    })

    it('still lets the owner edit staff permissions', async () => {
      const db = testEnv.authenticatedContext('owner1').firestore()
      await assertSucceeds(updateDoc(doc(db, STAFF_PATH), { permissions: { sales: false } }))
    })
  })

  describe('user document create', () => {
    it('allows a new owner on the free plan', async () => {
      const db = testEnv.authenticatedContext('newUser').firestore()
      await assertSucceeds(
        setDoc(doc(db, 'users/newUser'), {
          uid: 'newUser',
          name: 'New',
          role: 'superAdmin',
          subscription: 'storvv_micro',
        })
      )
    })

    it('denies self-assigning a paid plan at create', async () => {
      const db = testEnv.authenticatedContext('newUser').firestore()
      await assertFails(
        setDoc(doc(db, 'users/newUser'), {
          uid: 'newUser',
          role: 'superAdmin',
          subscription: 'storvv_enterprise',
        })
      )
    })

    it('denies self-assigning a non-owner role at create', async () => {
      const db = testEnv.authenticatedContext('newUser').firestore()
      await assertFails(
        setDoc(doc(db, 'users/newUser'), {
          uid: 'newUser',
          role: 'staff',
          subscription: 'storvv_micro',
        })
      )
    })
  })

  describe('fields added later', () => {
    it('denies adding a paid plan to a user doc created without one', async () => {
      const db = testEnv.authenticatedContext('newUser').firestore()
      await assertSucceeds(setDoc(doc(db, 'users/newUser'), { uid: 'newUser', name: 'New' }))
      await assertFails(updateDoc(doc(db, 'users/newUser'), { subscription: 'storvv_enterprise' }))
    })

    it('denies adding billing add-ons to a user doc', async () => {
      const db = testEnv.authenticatedContext('owner1').firestore()
      await assertFails(
        updateDoc(doc(db, 'users/owner1'), { subscriptionAddOns: { stores: 50, staff: 500 } })
      )
    })
  })

  describe('two-factor fields', () => {
    it('denies the client turning two-factor flags on or off', async () => {
      const db = testEnv.authenticatedContext('owner1').firestore()
      await assertFails(updateDoc(doc(db, 'users/owner1'), { twoFactorEnabled: false }))
      await assertFails(updateDoc(doc(db, 'users/owner1'), { twoFactorEnabled: true }))
      await assertFails(updateDoc(doc(db, 'users/owner1'), { twoFactorMethod: 'totp' }))
      await assertFails(updateDoc(doc(db, 'users/owner1'), { twoFactorEnabledAt: 1 }))
    })

    it('still allows normal profile edits', async () => {
      const db = testEnv.authenticatedContext('owner1').firestore()
      await assertSucceeds(updateDoc(doc(db, 'users/owner1'), { name: 'Renamed' }))
    })
  })
})
