// @vitest-environment node
import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { deleteApp, initializeApp, type App } from 'firebase-admin/app'
import { getFirestore, type Firestore } from 'firebase-admin/firestore'
import { storeDocRef } from '~/server/utils/payments/audit-log'
import { PAYOUTS_COLLECTION } from '~/server/utils/payments/payout'
import {
  DECLINE_COOLDOWN_MS,
  getTradeProfile,
  inviteTradePartner,
  listTradeConnections,
  lookupTradeHandle,
  notifyTradeOwner,
  respondToConnection,
  saveTradeProfile,
  TRADE_HANDLES,
  TradeError,
  tradeKey,
  type TradeScope,
} from '~/server/utils/trade/partners'

async function expectCode(promise: Promise<unknown>, code: string) {
  const err = await promise.then(
    () => null,
    (e: unknown) => e
  )
  expect(err).toBeInstanceOf(TradeError)
  expect((err as TradeError).code).toBe(code)
}

describe.skipIf(!process.env.FIRESTORE_EMULATOR_HOST)('Trade partners (emulator)', () => {
  let app: App
  let db: Firestore

  beforeAll(() => {
    app = initializeApp({ projectId: 'storv-ui-test-trade' }, `trade-${randomUUID()}`)
    db = getFirestore(app)
  })

  afterAll(async () => {
    await deleteApp(app)
  })

  /** A store with a unique handle prefix so tests never collide. */
  async function store(name: string, opts: { slug?: string; payout?: boolean } = {}) {
    const scope: TradeScope = { ownerId: `owner-${randomUUID()}`, storeId: 's1' }
    await storeDocRef(db, scope.ownerId, scope.storeId).set({ ownerId: scope.ownerId, name })
    if (opts.slug) {
      await storeDocRef(db, scope.ownerId, scope.storeId)
        .collection('storefrontConfig')
        .doc('settings')
        .set({ slug: opts.slug })
      await db.collection('storefronts').doc(opts.slug).set({
        ownerUid: scope.ownerId,
        storeId: scope.storeId,
      })
    }
    if (opts.payout) {
      await db.collection(PAYOUTS_COLLECTION).doc(tradeKey(scope)).set({ connected: true })
    }
    return scope
  }

  const uniq = () => randomUUID().slice(0, 8)

  async function withHandle(name: string, opts: { payout?: boolean } = {}) {
    const scope = await store(name, opts)
    const handle = `${name.toLowerCase().replace(/\s+/g, '-')}-${uniq()}`
    await saveTradeProfile(db, scope, { handle, displayName: name })
    return { scope, handle }
  }

  describe('handles', () => {
    it('suggests the storefront slug, then claims and releases handles', async () => {
      const slug = `ikeja-${uniq()}`
      const a = await store('Ikeja Phone Hub', { slug })
      expect((await getTradeProfile(db, a)).suggestedHandle).toBe(slug)
      expect((await getTradeProfile(db, a)).handle).toBeNull()

      const first = `first-${uniq()}`
      const saved = await saveTradeProfile(db, a, { handle: `@${first}`, displayName: '  Ikeja  Hub ' })
      expect(saved).toMatchObject({ handle: first, displayName: 'Ikeja Hub' })

      const b = await store('Other')
      await expectCode(saveTradeProfile(db, b, { handle: first, displayName: '' }), 'HANDLE_TAKEN')

      const second = `second-${uniq()}`
      await saveTradeProfile(db, a, { handle: second, displayName: 'Ikeja Hub' })
      expect((await db.collection(TRADE_HANDLES).doc(first).get()).exists).toBe(false)
      await saveTradeProfile(db, b, { handle: first, displayName: 'Other' })
      expect((await getTradeProfile(db, b)).handle).toBe(first)
    })

    it("cannot take another store's storefront address, but can take its own", async () => {
      const slug = `shop-${uniq()}`
      const owner = await store('Shop', { slug })
      const other = await store('Copycat')
      await expectCode(saveTradeProfile(db, other, { handle: slug, displayName: '' }), 'HANDLE_TAKEN')
      await saveTradeProfile(db, owner, { handle: slug, displayName: '' })
      expect((await getTradeProfile(db, owner)).handle).toBe(slug)
    })

    it('rejects invalid and reserved handles', async () => {
      const a = await store('A')
      await expectCode(saveTradeProfile(db, a, { handle: 'x', displayName: '' }), 'INVALID_HANDLE')
      await expectCode(saveTradeProfile(db, a, { handle: 'storvv', displayName: '' }), 'INVALID_HANDLE')
    })
  })

  describe('connecting', () => {
    it('needs your own handle, a real handle and not yourself', async () => {
      const bare = await store('No Handle')
      const b = await withHandle('Kano Depot')
      await expectCode(inviteTradePartner(db, bare, b.handle), 'NO_HANDLE')
      const a = await withHandle('Lagos Shop')
      await expectCode(inviteTradePartner(db, a.scope, `missing-${uniq()}`), 'HANDLE_NOT_FOUND')
      await expectCode(inviteTradePartner(db, a.scope, a.handle), 'SELF')
    })

    it('request, idempotent resend, and accept by the recipient only', async () => {
      const a = await withHandle('Lagos Shop')
      const b = await withHandle('Kano Depot', { payout: true })

      const sent = await inviteTradePartner(db, a.scope, b.handle)
      expect(sent).toMatchObject({ relation: 'outgoing', changed: true })
      expect(sent.partner).toEqual({ handle: b.handle, displayName: 'Kano Depot', bankVerified: true })
      expect(sent.partnerScope).toEqual(b.scope)
      expect(await inviteTradePartner(db, a.scope, b.handle)).toMatchObject({ changed: false })

      expect((await lookupTradeHandle(db, a.scope, b.handle)).relation).toBe('outgoing')
      expect((await lookupTradeHandle(db, b.scope, a.handle)).relation).toBe('incoming')
      expect((await listTradeConnections(db, b.scope)).map((c) => c.state)).toEqual(['incoming'])

      await expectCode(respondToConnection(db, a.scope, sent.connectionId, 'accept'), 'INVALID_STATE')
      const accepted = await respondToConnection(db, b.scope, sent.connectionId, 'accept')
      expect(accepted.status).toBe('active')
      expect(accepted.partnerScope).toEqual(a.scope)

      const [mine] = await listTradeConnections(db, a.scope)
      expect(mine).toMatchObject({ state: 'active', partner: { handle: b.handle, bankVerified: true } })
      expect(mine!.sinceMs).toBeGreaterThan(0)
    })

    it('asking someone who already asked you accepts their request', async () => {
      const a = await withHandle('Lagos Shop')
      const b = await withHandle('Kano Depot')
      await inviteTradePartner(db, a.scope, b.handle)
      const back = await inviteTradePartner(db, b.scope, a.handle)
      expect(back).toMatchObject({ relation: 'active', changed: true })
    })

    it('a decline holds off the same requester for the cooldown', async () => {
      const a = await withHandle('Lagos Shop')
      const b = await withHandle('Kano Depot')
      const { connectionId } = await inviteTradePartner(db, a.scope, b.handle)
      await respondToConnection(db, b.scope, connectionId, 'decline')
      expect(await listTradeConnections(db, a.scope)).toEqual([])
      await expectCode(inviteTradePartner(db, a.scope, b.handle), 'NOT_ACCEPTING')
      const later = Date.now() + DECLINE_COOLDOWN_MS + 60_000
      expect(await inviteTradePartner(db, a.scope, b.handle, later)).toMatchObject({ relation: 'outgoing' })
    })

    it('the requester can cancel; either side can remove', async () => {
      const a = await withHandle('Lagos Shop')
      const b = await withHandle('Kano Depot')
      const { connectionId } = await inviteTradePartner(db, a.scope, b.handle)
      await expectCode(respondToConnection(db, b.scope, connectionId, 'cancel'), 'INVALID_STATE')
      await respondToConnection(db, a.scope, connectionId, 'cancel')
      expect(await listTradeConnections(db, b.scope)).toEqual([])

      await inviteTradePartner(db, a.scope, b.handle)
      await respondToConnection(db, b.scope, connectionId, 'accept')
      await respondToConnection(db, b.scope, connectionId, 'remove')
      expect(await listTradeConnections(db, a.scope)).toEqual([])
      expect((await lookupTradeHandle(db, a.scope, b.handle)).relation).toBe('none')
    })

    it('blocking hides the blocker and stops requests until they unblock', async () => {
      const a = await withHandle('Lagos Shop')
      const b = await withHandle('Kano Depot')
      const { connectionId } = await inviteTradePartner(db, a.scope, b.handle)
      await respondToConnection(db, b.scope, connectionId, 'block')

      expect(await listTradeConnections(db, a.scope)).toEqual([])
      expect((await listTradeConnections(db, b.scope)).map((c) => c.state)).toEqual(['blocked'])
      expect((await lookupTradeHandle(db, a.scope, b.handle)).relation).toBe('none')
      await expectCode(inviteTradePartner(db, a.scope, b.handle), 'NOT_ACCEPTING')
      await expectCode(respondToConnection(db, a.scope, connectionId, 'unblock'), 'INVALID_STATE')

      await respondToConnection(db, b.scope, connectionId, 'unblock')
      expect(await inviteTradePartner(db, a.scope, b.handle)).toMatchObject({ relation: 'outgoing' })
    })

    it('outsiders cannot act on a connection', async () => {
      const a = await withHandle('Lagos Shop')
      const b = await withHandle('Kano Depot')
      const c = await withHandle('Nosy Shop')
      const { connectionId } = await inviteTradePartner(db, a.scope, b.handle)
      await expectCode(respondToConnection(db, c.scope, connectionId, 'accept'), 'NOT_FOUND')
      await expectCode(respondToConnection(db, c.scope, 'nope~nope', 'remove'), 'NOT_FOUND')
    })

    it('writes the notification as a server-only trade entry for the owner', async () => {
      const b = await withHandle('Kano Depot')
      await notifyTradeOwner(db, b.scope, {
        type: 'trade_invite',
        title: 'Partner request',
        message: 'x',
        actorUid: 'someone',
        connectionId: 'c1',
      })
      const snap = await storeDocRef(db, b.scope.ownerId, b.scope.storeId).collection('notifications').get()
      expect(snap.docs[0]!.data()).toMatchObject({
        type: 'trade_invite',
        source: 'trade',
        recipientUids: [b.scope.ownerId],
        metadata: { connectionId: 'c1' },
      })
    })
  })
})
