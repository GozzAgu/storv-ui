import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest'
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing'
import { Timestamp, deleteDoc, doc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore'

const DAY = 86_400_000

describe('firestore.rules: free trial', () => {
  let testEnv: RulesTestEnvironment

  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: 'storv-ui-trial',
      firestore: { rules: readFileSync(resolve(process.cwd(), 'firestore.rules'), 'utf8') },
    })
  })

  afterAll(async () => {
    await testEnv.cleanup()
  })

  beforeEach(async () => {
    await testEnv.clearFirestore()
  })

  async function seedOwner(subscription: string, trialEndsAt?: Timestamp) {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore()
      await setDoc(doc(db, 'users/u1'), {
        uid: 'u1',
        role: 'superAdmin',
        subscription,
        hasCompletedOnboarding: true,
        hasCompletedTutorial: false,
        ...(trialEndsAt ? { trialEndsAt } : {}),
      })
      await setDoc(doc(db, 'users/u1/stores/s1'), { ownerId: 'u1', storeId: 's1', name: 'Ikeja' })
    })
  }

  const createTransfer = () =>
    setDoc(doc(testEnv.authenticatedContext('u1').firestore(), 'users/u1/storeTransfers/t1'), {
      createdBy: 'u1',
      fromStoreId: 's1',
      toStoreId: 's2',
    })

  it('treats a free account on a running trial as Enterprise', async () => {
    await seedOwner('storvv_micro', Timestamp.fromMillis(Date.now() + 30 * DAY))
    await assertSucceeds(createTransfer())
  })

  it('drops back to the free plan once the trial has ended', async () => {
    await seedOwner('storvv_micro', Timestamp.fromMillis(Date.now() - DAY))
    await assertFails(createTransfer())
  })

  it('ignores a trial date that is not a real timestamp', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'users/u1'), {
        uid: 'u1',
        role: 'superAdmin',
        subscription: 'storvv_micro',
        trialEndsAt: '2999-01-01T00:00:00.000Z',
      })
    })
    await assertFails(createTransfer())
  })

  it('does not let an owner start a trial on sign up', async () => {
    await assertFails(
      setDoc(doc(testEnv.authenticatedContext('u2').firestore(), 'users/u2'), {
        uid: 'u2',
        role: 'superAdmin',
        subscription: 'storvv_micro',
        hasCompletedOnboarding: false,
        hasCompletedTutorial: false,
        trialEndsAt: Timestamp.fromMillis(Date.now() + 3650 * DAY),
      })
    )
  })

  it('does not let an owner delete their account doc to reset the trial', async () => {
    await seedOwner('storvv_micro', Timestamp.fromMillis(Date.now() - DAY))
    await assertFails(deleteDoc(doc(testEnv.authenticatedContext('u1').firestore(), 'users/u1')))
  })

  it('only accepts the server clock as the new account date', async () => {
    const db = testEnv.authenticatedContext('u2').firestore()
    const base = {
      uid: 'u2',
      role: 'superAdmin',
      subscription: 'storvv_micro',
      hasCompletedOnboarding: false,
      hasCompletedTutorial: false,
    }
    await assertFails(
      setDoc(doc(db, 'users/u2'), { ...base, createdAt: Timestamp.fromMillis(Date.now()) })
    )
    await assertSucceeds(setDoc(doc(db, 'users/u2'), { ...base, createdAt: serverTimestamp() }))
  })

  it('does not let an owner move their own trial date', async () => {
    await seedOwner('storvv_micro', Timestamp.fromMillis(Date.now() + DAY))
    await assertFails(
      updateDoc(doc(testEnv.authenticatedContext('u1').firestore(), 'users/u1'), {
        trialEndsAt: Timestamp.fromMillis(Date.now() + 3650 * DAY),
      })
    )
  })
})
