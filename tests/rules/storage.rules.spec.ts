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

const WEBP = { contentType: 'image/webp' }

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
    const file = ctx.storage().ref('images/u1/profile/avatar.webp')
    await assertSucceeds(file.putString('avatar-bytes', 'raw', WEBP) as unknown as Promise<unknown>)
  })

  it('denies user writing another user profile image path', async () => {
    const ctx = testEnv.authenticatedContext('u2')
    const file = ctx.storage().ref('images/u1/profile/avatar.webp')
    await assertFails(file.putString('avatar-bytes', 'raw', WEBP) as unknown as Promise<unknown>)
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

  it('denies images that are not WebP', async () => {
    const ctx = testEnv.authenticatedContext('u1')
    for (const contentType of ['image/jpeg', 'image/png', 'image/gif']) {
      const file = ctx.storage().ref('images/u1/profile/avatar.img')
      await assertFails(
        file.putString('img', 'raw', { contentType }) as unknown as Promise<unknown>
      )
    }
  })

  it('allows 30 KB and denies anything bigger', async () => {
    const ctx = testEnv.authenticatedContext('u1')
    const file = ctx.storage().ref('images/u1/profile/edge.webp')
    await assertSucceeds(
      file.putString('a'.repeat(30 * 1024), 'raw', WEBP) as unknown as Promise<unknown>
    )
    const big = ctx.storage().ref('images/u1/profile/big.webp')
    await assertFails(
      big.putString('a'.repeat(30 * 1024 + 1), 'raw', WEBP) as unknown as Promise<unknown>
    )
  })

  it('applies the same limits to store asset paths', async () => {
    const ctx = testEnv.authenticatedContext('u1')
    await assertSucceeds(
      ctx
        .storage()
        .ref('stores/u1/s1/items/a.webp')
        .putString('img', 'raw', WEBP) as unknown as Promise<unknown>
    )
    await assertFails(
      ctx
        .storage()
        .ref('stores/u1/s1/items/a.pdf')
        .putString('pdf', 'raw', { contentType: 'application/pdf' }) as unknown as Promise<unknown>
    )
    await assertFails(
      ctx
        .storage()
        .ref('stores/u1/s1/items/b.webp')
        .putString('a'.repeat(30 * 1024 + 1), 'raw', WEBP) as unknown as Promise<unknown>
    )
  })

  describe('payment proofs', () => {
    const PROOFS = 'paymentProofs/u1/s1'
    const put = (uid: string, path: string, contentType = 'image/webp', body = 'proof-bytes') =>
      testEnv
        .authenticatedContext(uid)
        .storage()
        .ref(path)
        .putString(body, 'raw', { contentType }) as unknown as Promise<unknown>

    beforeAll(async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const db = context.firestore()
        await setDoc(doc(db, 'users/u1/stores/s1/members/cashier'), {
          authUid: 'cashier',
          status: 'active',
        })
        await setDoc(doc(db, 'users/u1/stores/s1/members/checker'), {
          authUid: 'checker',
          status: 'active',
        })
        await setDoc(doc(db, 'users/u1/stores/s1/payments/p-await'), {
          recordedBy: 'cashier',
          status: 'awaiting_confirmation',
        })
        // Never uploaded to, so a failure there is the rule under test, not "already exists".
        await setDoc(doc(db, 'users/u1/stores/s1/payments/p-fresh'), {
          recordedBy: 'cashier',
          status: 'awaiting_confirmation',
        })
        await setDoc(doc(db, 'users/u1/stores/s1/payments/p-edge'), {
          recordedBy: 'cashier',
          status: 'awaiting_confirmation',
        })
        await setDoc(doc(db, 'users/u1/stores/s1/payments/p-done'), {
          recordedBy: 'cashier',
          status: 'confirmed',
        })
      })
    })

    it('the recorder uploads a proof while the payment awaits confirmation', async () => {
      await assertSucceeds(put('cashier', `${PROOFS}/p-await/proof.webp`))
      await assertSucceeds(put('cashier', `${PROOFS}/p-await/proof.pdf`, 'application/pdf'))
    })

    it('nobody else uploads, and not after the decision', async () => {
      await assertFails(put('checker', `${PROOFS}/p-fresh/proof.webp`))
      await assertFails(put('u1', `${PROOFS}/p-fresh/proof.webp`))
      await assertFails(put('stranger', `${PROOFS}/p-fresh/proof.webp`))
      await assertFails(put('cashier', `${PROOFS}/p-done/proof.webp`))
      await assertFails(put('cashier', `${PROOFS}/p-missing/proof.webp`))
    })

    it('fixed file names only', async () => {
      await assertFails(put('cashier', `${PROOFS}/p-fresh/evil.html`, 'text/html'))
      await assertFails(put('cashier', `${PROOFS}/p-fresh/evil.webp`))
    })

    it('photos are WebP only; the type must match the name', async () => {
      await assertFails(put('cashier', `${PROOFS}/p-fresh/proof.jpg`, 'image/jpeg'))
      await assertFails(put('cashier', `${PROOFS}/p-fresh/proof.png`, 'image/png'))
      await assertFails(put('cashier', `${PROOFS}/p-fresh/proof.webp`, 'image/svg+xml'))
      await assertFails(put('cashier', `${PROOFS}/p-fresh/proof.webp`, 'application/pdf'))
    })

    it('photos 30 KB at most, PDFs 5 MB at most', async () => {
      await assertSucceeds(
        put('cashier', `${PROOFS}/p-edge/proof.webp`, 'image/webp', 'a'.repeat(30 * 1024))
      )
      await assertFails(
        put('cashier', `${PROOFS}/p-fresh/proof.webp`, 'image/webp', 'a'.repeat(30 * 1024 + 1))
      )
      await assertFails(
        put(
          'cashier',
          `${PROOFS}/p-fresh/proof.pdf`,
          'application/pdf',
          'a'.repeat(5 * 1024 * 1024 + 1)
        )
      )
    })

    it('no overwrite of an existing proof', async () => {
      await assertFails(put('cashier', `${PROOFS}/p-await/proof.webp`))
    })

    it('no client reads or deletes, even for the owner and the recorder', async () => {
      for (const uid of ['u1', 'cashier', 'checker']) {
        const ref = testEnv.authenticatedContext(uid).storage().ref(`${PROOFS}/p-await/proof.webp`)
        await assertFails(ref.getDownloadURL() as unknown as Promise<unknown>)
        await assertFails(ref.delete() as unknown as Promise<unknown>)
      }
    })
  })
})
