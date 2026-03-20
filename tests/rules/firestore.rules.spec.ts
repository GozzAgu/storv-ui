import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, it, beforeAll, afterAll, beforeEach } from 'vitest'
import { initializeTestEnvironment, assertFails, assertSucceeds, type RulesTestEnvironment } from '@firebase/rules-unit-testing'
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

  it('allows super admin to read own store doc', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(
        doc(context.firestore(), 'users/u1/stores/s1'),
        { ownerId: 'u1', createdBy: 'u1', name: 'Main store' }
      )
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
})
