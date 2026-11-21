// @vitest-environment node
import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { deleteApp, initializeApp, type App } from 'firebase-admin/app'
import { getFirestore, type Firestore } from 'firebase-admin/firestore'
import type { DecodedIdToken } from 'firebase-admin/auth'

const m = vi.hoisted(() => ({ db: null as unknown as Firestore }))
vi.mock('~/server/utils/firebase-admin', () => ({
  getAdminFirestore: () => m.db,
  // The staff lookup compares the login's creation time with the staff record's.
  getAdminAuth: () => ({
    getUser: async () => ({ metadata: { creationTime: new Date().toUTCString() } }),
  }),
}))

import {
  currentWhatsAppMonthKey,
  getWhatsAppAllowance,
  incrementWhatsAppUsage,
  resolveWhatsAppOwnerId,
} from '~/server/utils/whatsapp-usage'
import { STAFF_OWNER_CLAIM } from '~/server/utils/staff-login-target'

const OWNER = 'waOwner'
const STAFF = 'waStaff'
// Staff sign-ins carry the owner they work for as a custom claim.
const token = (uid: string, extra: Record<string, unknown> = {}) =>
  ({ uid, ...extra } as unknown as DecodedIdToken)

describe.skipIf(!process.env.FIRESTORE_EMULATOR_HOST)(
  'WhatsApp monthly allowance (emulator)',
  () => {
    let app: App

    beforeAll(() => {
      app = initializeApp({ projectId: 'storv-ui-test-whatsapp' }, `wa-${randomUUID()}`)
      m.db = getFirestore(app)
    })

    afterAll(async () => {
      await deleteApp(app)
    })

    beforeEach(async () => {
      await m.db.recursiveDelete(m.db.collection('users').doc(OWNER))
      await m.db
        .collection('users')
        .doc(OWNER)
        .set({ role: 'superAdmin', subscription: 'storvv_medium' })
      // Staff have no users/{uid} doc; they are found through their staff record.
      await m.db.doc(`users/${OWNER}/stores/s1/departments/d1/staff/${STAFF}`).set({
        authUid: STAFF,
        status: 'active',
      })
    })

    it('finds the business for the owner and for their staff', async () => {
      expect(await resolveWhatsAppOwnerId(token(OWNER))).toBe(OWNER)
      expect(await resolveWhatsAppOwnerId(token(STAFF, { [STAFF_OWNER_CLAIM]: OWNER }))).toBe(OWNER)
      expect(await resolveWhatsAppOwnerId(token('stranger'))).toBeNull()
    })

    it('caps Medium at 50 a month, shared by the owner and staff', async () => {
      const usage = m.db.doc(`users/${OWNER}/whatsappUsage/${currentWhatsAppMonthKey()}`)
      await usage.set({ count: 48 })

      await incrementWhatsAppUsage(OWNER, OWNER)
      await incrementWhatsAppUsage(OWNER, STAFF)
      const full = await getWhatsAppAllowance(OWNER)
      expect(full).toMatchObject({ plan: 'storvv_medium', limit: 50, count: 50 })

      await expect(incrementWhatsAppUsage(OWNER, STAFF)).rejects.toMatchObject({
        statusCode: 429,
        data: { code: 'WHATSAPP_LIMIT_REACHED', limit: 50 },
      })
      const data = (await usage.get()).data()
      expect(data?.count).toBe(50)
      expect(data?.bySender).toEqual({ [OWNER]: 1, [STAFF]: 1 })
    })

    it('keeps Enterprise unlimited and Micro at 10', async () => {
      await m.db.collection('users').doc(OWNER).update({ subscription: 'storvv_enterprise' })
      await m.db
        .doc(`users/${OWNER}/whatsappUsage/${currentWhatsAppMonthKey()}`)
        .set({ count: 500 })
      await expect(incrementWhatsAppUsage(OWNER, STAFF)).resolves.toMatchObject({
        count: 501,
        limit: -1,
      })

      await m.db.collection('users').doc(OWNER).update({ subscription: 'storvv_micro' })
      expect((await getWhatsAppAllowance(OWNER)).limit).toBe(10)
    })
  }
)
