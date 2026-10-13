import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest'
import {
  assertFails,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing'
import { deleteDoc, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore'

const PATHS = [
  'users/owner1/loyalty/settings',
  'users/owner1/loyaltyMembers/p_2348035465454',
  'users/owner1/loyaltyAwards/s1_r1',
  'users/owner1/loyaltyLedger/e1',
]

describe('firestore.rules: customer rewards are server-only', () => {
  let testEnv: RulesTestEnvironment

  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: 'storv-ui-test-loyalty',
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
      await setDoc(doc(db, 'users/owner1'), { uid: 'owner1', role: 'superAdmin' })
      await setDoc(doc(db, 'users/owner1/stores/s1'), { ownerId: 'owner1', name: 'Main' })
      await setDoc(doc(db, 'users/owner1/stores/s1/members/staff1'), { status: 'active' })
      for (const path of PATHS) await setDoc(doc(db, path), { points: 25 })
    })
  })

  for (const uid of ['owner1', 'staff1', 'stranger']) {
    it(`${uid} cannot read, create, edit or delete points from the app`, async () => {
      const db = testEnv.authenticatedContext(uid).firestore()
      for (const path of PATHS) {
        await assertFails(getDoc(doc(db, path)))
        await assertFails(setDoc(doc(db, `${path}-new`), { points: 1_000_000 }))
        await assertFails(updateDoc(doc(db, path), { points: 1_000_000 }))
        await assertFails(deleteDoc(doc(db, path)))
      }
    })
  }
})
