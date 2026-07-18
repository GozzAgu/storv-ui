import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, it, beforeAll, afterAll } from 'vitest'
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing'

describe('storage.rules', () => {
  let testEnv: RulesTestEnvironment

  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: 'storv-ui-test',
      storage: {
        rules: readFileSync(resolve(process.cwd(), 'storage.rules'), 'utf8'),
      },
      firestore: {
        rules: readFileSync(resolve(process.cwd(), 'firestore.rules'), 'utf8'),
      },
    })
  })

  afterAll(async () => {
    await testEnv.cleanup()
  })

  it('allows user to write own profile image path', async () => {
    const ctx = testEnv.authenticatedContext('u1')
    const file = ctx.storage().ref('images/u1/profile/avatar.png')
    await assertSucceeds(file.putString('avatar-bytes') as unknown as Promise<unknown>)
  })

  it('denies user writing another user profile image path', async () => {
    const ctx = testEnv.authenticatedContext('u2')
    const file = ctx.storage().ref('images/u1/profile/avatar.png')
    await assertFails(file.putString('avatar-bytes') as unknown as Promise<unknown>)
  })
})
