// @vitest-environment node
import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { deleteApp, initializeApp, type App } from 'firebase-admin/app'
import { getFirestore, type Firestore } from 'firebase-admin/firestore'
import { storeDocRef } from '~/server/utils/payments/audit-log'
import {
  inviteTradePartner,
  respondToConnection,
  saveTradeProfile,
  TradeError,
  type TradeScope,
} from '~/server/utils/trade/partners'
import {
  closeTradeRequest,
  createTradeRequest,
  listTradeRequests,
  replyToTradeRequest,
  REQUEST_HISTORY_MS,
  REQUEST_TTL_MS,
  TRADE_REQUESTS,
  tradeTeamUids,
} from '~/server/utils/trade/requests'

async function expectCode(promise: Promise<unknown>, code: string) {
  const err = await promise.then(
    () => null,
    (e: unknown) => e
  )
  expect(err).toBeInstanceOf(TradeError)
  expect((err as TradeError).code).toBe(code)
}

describe.skipIf(!process.env.FIRESTORE_EMULATOR_HOST)('Trade stock requests (emulator)', () => {
  let app: App
  let db: Firestore

  beforeAll(() => {
    app = initializeApp({ projectId: 'storv-ui-test-trade' }, `trade-req-${randomUUID()}`)
    db = getFirestore(app)
  })

  afterAll(async () => {
    await deleteApp(app)
  })

  const uniq = () => randomUUID().slice(0, 8)

  async function shop(name: string, withHandle = true) {
    const scope: TradeScope = { ownerId: `owner-${randomUUID()}`, storeId: 's1' }
    await storeDocRef(db, scope.ownerId, scope.storeId).set({ ownerId: scope.ownerId, name })
    const handle = `${name.toLowerCase().replace(/\s+/g, '-')}-${uniq()}`
    if (withHandle) await saveTradeProfile(db, scope, { handle, displayName: name })
    return { scope, handle, uid: scope.ownerId }
  }

  async function partner(a: Awaited<ReturnType<typeof shop>>, b: Awaited<ReturnType<typeof shop>>) {
    const { connectionId } = await inviteTradePartner(db, a.scope, b.handle)
    await respondToConnection(db, b.scope, connectionId, 'accept')
    return connectionId
  }

  async function notifications(scope: TradeScope) {
    const snap = await storeDocRef(db, scope.ownerId, scope.storeId).collection('notifications').get()
    return snap.docs.map((d) => d.data())
  }

  describe('asking', () => {
    it('needs a handle and at least one partner', async () => {
      const bare = await shop('No Handle', false)
      await expectCode(createTradeRequest(db, bare.scope, bare.uid, { item: 'iPhone 15' }), 'NO_HANDLE')
      const lonely = await shop('Lonely Shop')
      await expectCode(createTradeRequest(db, lonely.scope, lonely.uid, { item: 'iPhone 15' }), 'NO_PARTNERS')
    })

    it('validates the item and quantity', async () => {
      const a = await shop('Lagos Shop')
      const b = await shop('Kano Depot')
      await partner(a, b)
      await expectCode(createTradeRequest(db, a.scope, a.uid, { item: ' x ' }), 'INVALID_INPUT')
      await expectCode(createTradeRequest(db, a.scope, a.uid, { item: 'Chargers', quantity: 0 }), 'INVALID_INPUT')
      await expectCode(createTradeRequest(db, a.scope, a.uid, { item: 'Chargers', quantity: 1.5 }), 'INVALID_INPUT')
      await expectCode(
        createTradeRequest(db, a.scope, a.uid, { item: 'Chargers', quantity: 100_001 }),
        'INVALID_INPUT'
      )
    })

    it('asks all partners by default, or only the named ones', async () => {
      const a = await shop('Lagos Shop')
      const b = await shop('Kano Depot')
      const c = await shop('Ikeja Hub')
      const stranger = await shop('Stranger')
      await partner(a, b)
      await partner(c, a)

      const all = await createTradeRequest(db, a.scope, a.uid, { item: 'iPhone 15 Pro Max', quantity: 2 })
      const stored = (await db.collection(TRADE_REQUESTS).doc(all.id).get()).data()!
      expect(stored.recipients).toHaveLength(2)
      expect(stored).toMatchObject({ status: 'open', quantity: 2, createdByUid: a.uid })
      expect(stored.categoryKind).toBeTruthy()

      const one = await createTradeRequest(db, a.scope, a.uid, { item: 'AirPods', to: [`@${c.handle}`] })
      expect((await db.collection(TRADE_REQUESTS).doc(one.id).get()).data()!.recipients).toHaveLength(1)

      await expectCode(
        createTradeRequest(db, a.scope, a.uid, { item: 'AirPods', to: [b.handle, stranger.handle] }),
        'NOT_PARTNER'
      )

      const note = (await notifications(c.scope)).find((n) => n.metadata?.requestId === all.id)
      expect(note).toMatchObject({ source: 'trade', recipientUids: [c.uid], metadata: { requestId: all.id } })
      expect(note!.message).toContain('2 × iPhone 15 Pro Max')
    })
  })

  describe('replying', () => {
    it('only recipients reply, and only the first "have" notifies the requester', async () => {
      const a = await shop('Lagos Shop')
      const b = await shop('Kano Depot')
      const outsider = await shop('Nosy Shop')
      await partner(a, b)
      const { id } = await createTradeRequest(db, a.scope, a.uid, { item: 'Samsung chargers', quantity: 20 })

      await expectCode(
        replyToTradeRequest(db, outsider.scope, outsider.uid, id, { status: 'have' }),
        'NOT_FOUND'
      )
      await expectCode(replyToTradeRequest(db, b.scope, b.uid, id, { status: 'maybe' }), 'INVALID_INPUT')
      await expectCode(
        replyToTradeRequest(db, b.scope, b.uid, id, { status: 'have', priceKobo: -1 }),
        'INVALID_INPUT'
      )

      await replyToTradeRequest(db, b.scope, b.uid, id, { status: 'dont_have' })
      expect((await notifications(a.scope)).filter((n) => n.type === 'trade_reply')).toHaveLength(0)

      const saved = await replyToTradeRequest(db, b.scope, b.uid, id, {
        status: 'have',
        priceKobo: 450_000,
        quantity: 20,
        note: '  sealed  ',
      })
      expect(saved).toEqual({ status: 'have', priceKobo: 450_000, quantity: 20, note: 'sealed' })
      await replyToTradeRequest(db, b.scope, b.uid, id, { status: 'have', priceKobo: 400_000, quantity: 20 })

      const replies = (await notifications(a.scope)).filter((n) => n.type === 'trade_reply')
      expect(replies).toHaveLength(1)
      expect(replies[0]).toMatchObject({ source: 'trade', metadata: { requestId: id } })
      expect(replies[0]!.message).toContain('₦4,500')
    })

    it('stops once the request closes, expires, or the partnership ends', async () => {
      const a = await shop('Lagos Shop')
      const b = await shop('Kano Depot')
      const connectionId = await partner(a, b)

      const closed = await createTradeRequest(db, a.scope, a.uid, { item: 'Pixel 8' })
      await expectCode(closeTradeRequest(db, b.scope, closed.id), 'NOT_FOUND')
      await closeTradeRequest(db, a.scope, closed.id)
      await closeTradeRequest(db, a.scope, closed.id)
      await expectCode(replyToTradeRequest(db, b.scope, b.uid, closed.id, { status: 'have' }), 'CLOSED')

      const now = Date.now()
      const old = await createTradeRequest(db, a.scope, a.uid, { item: 'Pixel 7' }, now)
      await expectCode(
        replyToTradeRequest(db, b.scope, b.uid, old.id, { status: 'have' }, now + REQUEST_TTL_MS + 1),
        'CLOSED'
      )

      const open = await createTradeRequest(db, a.scope, a.uid, { item: 'Pixel 6' })
      await respondToConnection(db, a.scope, connectionId, 'remove')
      await expectCode(replyToTradeRequest(db, b.scope, b.uid, open.id, { status: 'have' }), 'NOT_FOUND')
    })
  })

  describe('listing', () => {
    it('shows each side the right replies, states and history window', async () => {
      const a = await shop('Lagos Shop')
      const b = await shop('Kano Depot')
      const c = await shop('Ikeja Hub')
      await partner(a, b)
      await partner(a, c)
      const now = Date.now()
      const { id } = await createTradeRequest(db, a.scope, a.uid, { item: 'iPhone 15', quantity: 2 }, now)
      await replyToTradeRequest(db, c.scope, c.uid, id, { status: 'dont_have' }, now)
      await replyToTradeRequest(db, b.scope, b.uid, id, { status: 'have', priceKobo: 145_000_000 }, now)

      const mine = await listTradeRequests(db, a.scope, now)
      expect(mine.incoming).toEqual([])
      expect(mine.outgoing).toHaveLength(1)
      expect(mine.outgoing[0]).toMatchObject({
        id,
        state: 'open',
        recipientCount: 2,
        haveCount: 1,
        replyCount: 2,
      })
      expect(mine.outgoing[0]!.replies.map((r) => [r.partner.handle, r.status])).toEqual([
        [b.handle, 'have'],
        [c.handle, 'dont_have'],
      ])

      const theirs = await listTradeRequests(db, c.scope, now)
      expect(theirs.incoming).toHaveLength(1)
      expect(theirs.incoming[0]).toMatchObject({
        from: { handle: a.handle },
        myReply: { status: 'dont_have' },
        replies: [],
        recipientCount: 0,
        haveCount: 0,
        replyCount: 0,
      })

      expect((await listTradeRequests(db, a.scope, now + REQUEST_TTL_MS + 1)).outgoing[0]!.state).toBe('expired')
      const gone = now + REQUEST_TTL_MS + REQUEST_HISTORY_MS + 1
      expect((await listTradeRequests(db, a.scope, gone)).outgoing).toEqual([])
    })

    it('hides requests from a business that is no longer a partner', async () => {
      const a = await shop('Lagos Shop')
      const b = await shop('Kano Depot')
      const connectionId = await partner(a, b)
      await createTradeRequest(db, a.scope, a.uid, { item: 'iPad Air' })
      expect((await listTradeRequests(db, b.scope)).incoming).toHaveLength(1)
      await respondToConnection(db, b.scope, connectionId, 'block')
      expect((await listTradeRequests(db, b.scope)).incoming).toEqual([])
    })
  })

  it('the team is the owner plus active staff who can make sales', async () => {
    const a = await shop('Lagos Shop')
    const members = storeDocRef(db, a.scope.ownerId, a.scope.storeId).collection('members')
    await members.doc('seller').set({ status: 'active', role: 'staff' })
    await members.doc('left').set({ status: 'removed', role: 'staff' })
    await members.doc('viewer').set({
      status: 'active',
      role: 'staff',
      permissions: { receipts: { view: true, create: false, edit: false, refund: false, delete: false } },
    })
    expect(await tradeTeamUids(db, a.scope)).toEqual([a.uid, 'seller'])
  })
})
