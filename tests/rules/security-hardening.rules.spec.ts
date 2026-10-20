import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest'
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing'
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore'

const STORE = 'users/u1/stores/s1'

describe('firestore.rules: security hardening', () => {
  let testEnv: RulesTestEnvironment

  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: 'storv-ui-hardening',
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
      await setDoc(doc(db, STORE), { ownerId: 'u1', name: 'Ikeja' })
      await setDoc(doc(db, `${STORE}/members/cashier`), {
        authUid: 'cashier',
        status: 'active',
        permissions: {
          products: { view: true, create: false, edit: false, delete: false },
          receipts: { view: true, create: true, edit: false, delete: false, refund: false },
        },
      })
      await setDoc(doc(db, `${STORE}/receipts/r1`), {
        storeId: 's1',
        total: 100,
        status: 'completed',
      })
      await setDoc(doc(db, `${STORE}/customerAccounts/acc1`), {
        storeId: 's1',
        accountBalance: 5000,
        balanceLedger: [],
      })
    })
  })

  describe('two-factor sign-in', () => {
    // The rules emulator sets auth_time to the token's issue time; a session list that doesn't
    // contain it is a sign-in still waiting at the 2FA prompt.
    const pendingOwner = () =>
      testEnv.authenticatedContext('u1', { twoFactorEnabled: true, tfaSessions: [1] }).firestore()

    it('keeps a password-only sign-in out of business data', async () => {
      await assertFails(getDoc(doc(pendingOwner(), `${STORE}/receipts/r1`)))
      await assertFails(updateDoc(doc(pendingOwner(), STORE), { name: 'Hacked' }))
    })

    it('still lets it read its own profile, which shows the 2FA prompt', async () => {
      await assertSucceeds(getDoc(doc(pendingOwner(), 'users/u1')))
    })

    it('leaves accounts without 2FA alone', async () => {
      await assertSucceeds(
        getDoc(doc(testEnv.authenticatedContext('u1').firestore(), `${STORE}/receipts/r1`))
      )
    })
  })

  describe('money and stock are server-written', () => {
    const cashier = () => testEnv.authenticatedContext('cashier').firestore()

    it('a cashier cannot change a customer balance', async () => {
      await assertFails(
        updateDoc(doc(cashier(), `${STORE}/customerAccounts/acc1`), { accountBalance: 0 })
      )
      await assertFails(
        setDoc(doc(cashier(), `${STORE}/customerAccounts/acc2`), {
          storeId: 's1',
          accountBalance: 0,
        })
      )
    })

    it('nobody creates a receipt directly, not even the owner', async () => {
      await assertFails(setDoc(doc(cashier(), `${STORE}/receipts/r2`), { storeId: 's1', total: 1 }))
      await assertFails(
        setDoc(doc(testEnv.authenticatedContext('u1').firestore(), `${STORE}/receipts/r3`), {
          storeId: 's1',
          total: 1,
        })
      )
    })
  })

  describe('activity logs', () => {
    it('can only be written in the writer’s own name', async () => {
      const db = testEnv.authenticatedContext('cashier').firestore()
      const log = (userId: string, id: string) =>
        setDoc(doc(db, `${STORE}/activityLogs/${id}`), {
          userId,
          userDisplayName: 'x',
          action: 'updated',
          entityType: 'item',
          entityId: 'i1',
          entityName: 'x',
          storeId: 's1',
        })
      await assertFails(log('u1', 'blame-owner'))
      await assertSucceeds(log('cashier', 'own'))
    })
  })
})
