// @vitest-environment node
// happy-dom's XHR drops the Authorization header, so request.auth is null in the Storage emulator.
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, it, beforeAll, afterAll } from 'vitest'
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing'
import { doc, setDoc } from 'firebase/firestore'

const PNG = { contentType: 'image/png' }

describe('storage.rules', () => {
  let testEnv: RulesTestEnvironment

  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      // Storage rules' firestore.get() reads the emulator's default project (.firebaserc), so the
      // seeded store doc must live there. Emulator only; never touches production.
      projectId: 'storv-ux',
      storage: {
        rules: readFileSync(resolve(process.cwd(), 'storage.rules'), 'utf8'),
      },
      firestore: {
        rules: readFileSync(resolve(process.cwd(), 'firestore.rules'), 'utf8'),
      },
    })
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'users/u1/stores/s1'), { ownerId: 'u1' })
    })
  })

  afterAll(async () => {
    await testEnv.cleanup()
  })

  it('allows user to write own profile image path', async () => {
    const ctx = testEnv.authenticatedContext('u1')
    const file = ctx.storage().ref('images/u1/profile/avatar.png')
    await assertSucceeds(file.putString('avatar-bytes', 'raw', PNG) as unknown as Promise<unknown>)
  })

  it('denies user writing another user profile image path', async () => {
    const ctx = testEnv.authenticatedContext('u2')
    const file = ctx.storage().ref('images/u1/profile/avatar.png')
    await assertFails(file.putString('avatar-bytes', 'raw', PNG) as unknown as Promise<unknown>)
  })

  it('denies non-image uploads to own image path', async () => {
    const ctx = testEnv.authenticatedContext('u1')
    const file = ctx.storage().ref('images/u1/profile/page.html')
    await assertFails(
      file.putString('<script>1</script>', 'raw', {
        contentType: 'text/html',
      }) as unknown as Promise<unknown>
    )
    await assertFails(
      file.putString('<svg/>', 'raw', {
        contentType: 'image/svg+xml',
      }) as unknown as Promise<unknown>
    )
  })

  it('denies uploads over 5 MB', async () => {
    const ctx = testEnv.authenticatedContext('u1')
    const file = ctx.storage().ref('images/u1/profile/huge.png')
    const tooBig = 'a'.repeat(5 * 1024 * 1024 + 1)
    await assertFails(file.putString(tooBig, 'raw', PNG) as unknown as Promise<unknown>)
  })

  it('applies the same limits to store asset paths', async () => {
    const ctx = testEnv.authenticatedContext('u1')
    await assertSucceeds(
      ctx
        .storage()
        .ref('stores/u1/s1/items/a.png')
        .putString('img', 'raw', PNG) as unknown as Promise<unknown>
    )
    await assertFails(
      ctx
        .storage()
        .ref('stores/u1/s1/items/a.pdf')
        .putString('pdf', 'raw', { contentType: 'application/pdf' }) as unknown as Promise<unknown>
    )
  })
})
