import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest'
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing'
import { Timestamp, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore'

const DAY = 86_400_000

describe('firestore.rules: view only past the plan (planTier)', () => {
  let testEnv: RulesTestEnvironment

  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: 'storv-ui-plan-tiers',
      firestore: { rules: readFileSync(resolve(process.cwd(), 'firestore.rules'), 'utf8') },
    })
  })

  afterAll(async () => {
    await testEnv.cleanup()
  })

  beforeEach(async () => {
    await testEnv.clearFirestore()
  })

  async function seed(owner: Record<string, unknown> = { subscription: 'storvv_micro' }) {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore()
      await setDoc(doc(db, 'users/u1'), { uid: 'u1', role: 'superAdmin', ...owner })
      await setDoc(doc(db, 'users/u1/stores/s1'), { ownerId: 'u1', name: 'Ikeja', planTier: 0 })
      await setDoc(doc(db, 'users/u1/stores/s2'), { ownerId: 'u1', name: 'Lekki', planTier: 1 })
      await setDoc(doc(db, 'users/u1/stores/s3'), { ownerId: 'u1', name: 'Old store' })
      for (const [uid, planTier] of [
        ['staff1', 0],
        ['staff3', 2],
      ] as const) {
        await setDoc(doc(db, `users/u1/stores/s1/members/${uid}`), {
          authUid: uid,
          storeId: 's1',
          status: 'active',
          role: 'staff',
          planTier,
        })
      }
    })
  }

  const sale = (uid: string, storeId: string, id = 'r1') =>
    setDoc(
      doc(
        testEnv.authenticatedContext(uid).firestore(),
        `users/u1/stores/${storeId}/receipts/${id}`
      ),
      {
        storeId,
        total: 1000,
        createdBy: uid,
      }
    )

  it('lets the owner sell in a store the plan covers, not in one past it', async () => {
    await seed()
    await assertSucceeds(sale('u1', 's1'))
    await assertFails(sale('u1', 's2'))
  })

  it('unlocks the moment the owner upgrades', async () => {
    await seed({ subscription: 'storvv_medium' })
    await assertSucceeds(sale('u1', 's2'))
  })

  it('treats a running trial as Enterprise, and an ended one as Micro', async () => {
    await seed({
      subscription: 'storvv_micro',
      trialEndsAt: Timestamp.fromMillis(Date.now() + 10 * DAY),
    })
    await assertSucceeds(sale('u1', 's2'))
    await seed({
      subscription: 'storvv_micro',
      trialEndsAt: Timestamp.fromMillis(Date.now() - DAY),
    })
    await assertFails(sale('u1', 's2', 'r2'))
  })

  it('leaves stores without a saved tier alone', async () => {
    await seed()
    await assertSucceeds(sale('u1', 's3'))
  })

  it('stops staff past the staff count, keeps the rest', async () => {
    await seed({ subscription: 'storvv_medium' })
    await assertSucceeds(sale('staff1', 's1'))
    await assertFails(sale('staff3', 's1', 'r2'))
    await seed({ subscription: 'storvv_enterprise' })
    await assertSucceeds(sale('staff3', 's1', 'r3'))
  })

  it('still lets everyone look', async () => {
    await seed()
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'users/u1/stores/s2/receipts/old'), {
        storeId: 's2',
        total: 500,
      })
    })
    await assertSucceeds(
      getDoc(doc(testEnv.authenticatedContext('u1').firestore(), 'users/u1/stores/s2/receipts/old'))
    )
  })

  it('does not let the owner change a tier, but other store edits still work', async () => {
    await seed()
    const db = testEnv.authenticatedContext('u1').firestore()
    await assertFails(updateDoc(doc(db, 'users/u1/stores/s2'), { planTier: 0 }))
    await assertSucceeds(updateDoc(doc(db, 'users/u1/stores/s2'), { name: 'Lekki Phase 1' }))
    await assertFails(updateDoc(doc(db, 'users/u1/stores/s1/members/staff3'), { planTier: 0 }))
    await assertSucceeds(updateDoc(doc(db, 'users/u1/stores/s1/members/staff3'), { role: 'staff' }))
    await assertFails(
      setDoc(doc(db, 'users/u1/stores/s4'), { ownerId: 'u1', name: 'New', planTier: 0 })
    )
    await assertSucceeds(setDoc(doc(db, 'users/u1/stores/s5'), { ownerId: 'u1', name: 'New' }))
  })
})
