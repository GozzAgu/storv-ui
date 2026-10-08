import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, it, beforeAll, afterAll, beforeEach } from 'vitest'
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing'
import { deleteDoc, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore'

const STORE = 'users/owner1/stores/s1'
const SUMMARY = { status: 'awaiting_confirmation', totalKobo: 5000, version: 1 }

describe('firestore.rules: Payments V2', () => {
  let testEnv: RulesTestEnvironment

  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: 'storv-ui-test-payments-rules',
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
      await setDoc(doc(db, 'users/owner1'), {
        uid: 'owner1',
        role: 'superAdmin',
        subscription: 'storvv_micro',
      })
      await setDoc(doc(db, STORE), { ownerId: 'owner1', name: 'Main' })
      await setDoc(doc(db, `${STORE}/members/cashier1`), {
        authUid: 'cashier1',
        status: 'active',
        role: 'staff',
      })
      await setDoc(doc(db, `${STORE}/members/viewer1`), {
        authUid: 'viewer1',
        status: 'active',
        permissions: { payments: { view: true, confirm: false, refund: false } },
      })
      await setDoc(doc(db, `${STORE}/members/confirmer1`), {
        authUid: 'confirmer1',
        status: 'active',
        permissions: { payments: { view: false, confirm: true, refund: false } },
      })
      await setDoc(doc(db, `${STORE}/payments/p1`), {
        receiptId: 'r1',
        recordedBy: 'cashier1',
        status: 'awaiting_confirmation',
      })
      await setDoc(doc(db, `${STORE}/payments/p2`), {
        receiptId: 'r1',
        recordedBy: 'someoneElse',
        status: 'confirmed',
      })
      await setDoc(doc(db, `${STORE}/paymentEvents/000000000001`), { seq: 1, type: 'claimed' })
      await setDoc(doc(db, `${STORE}/paymentAudit/head`), { seq: 1, hash: 'x' })
      await setDoc(doc(db, `${STORE}/receipts/locked`), {
        storeId: 's1',
        status: 'balance_due',
        total: 50,
        amountPaid: 0,
        balanceDue: 50,
        payments: [],
        items: [{ itemId: 'i1', price: 50 }],
        customerName: 'Jane',
        notes: '',
        paymentSummary: SUMMARY,
      })
      await setDoc(doc(db, `${STORE}/receipts/legacy`), {
        storeId: 's1',
        status: 'balance_due',
        total: 50,
        amountPaid: 0,
        balanceDue: 50,
        payments: [],
        items: [],
      })
    })
  })

  const as = (uid: string) => testEnv.authenticatedContext(uid).firestore()

  describe('no client writes to payment state', () => {
    const serverOnlyDocs = [
      `${STORE}/payments/new`,
      `${STORE}/paymentEvents/000000000002`,
      `${STORE}/paymentAudit/head`,
      `${STORE}/paymentConfig/settings`,
      `${STORE}/tillCounts/t1`,
      'paymentLinksV2/l1',
      'paymentLinksV2/l1/attempts/stvp_1',
      'paymentLinkTokens/hash1',
      'paystackEvents/e1',
      'paymentAuditAnchors/a1',
    ]

    it.each(serverOnlyDocs)('owner cannot write %s', async (path) => {
      await assertFails(setDoc(doc(as('owner1'), path), { status: 'confirmed', amountKobo: 1 }))
    })

    it('nobody can edit or delete an existing payment or event', async () => {
      for (const uid of ['owner1', 'cashier1', 'confirmer1']) {
        await assertFails(updateDoc(doc(as(uid), `${STORE}/payments/p1`), { status: 'confirmed' }))
        await assertFails(deleteDoc(doc(as(uid), `${STORE}/payments/p1`)))
        await assertFails(
          updateDoc(doc(as(uid), `${STORE}/paymentEvents/000000000001`), { type: 'x' })
        )
        await assertFails(deleteDoc(doc(as(uid), `${STORE}/paymentEvents/000000000001`)))
      }
    })

    it('top-level payment collections are unreadable from clients', async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await setDoc(doc(context.firestore(), 'paymentLinkTokens/hash1'), { linkId: 'l1' })
      })
      await assertFails(getDoc(doc(as('owner1'), 'paymentLinkTokens/hash1')))
      await assertFails(
        getDoc(doc(testEnv.unauthenticatedContext().firestore(), 'paymentLinkTokens/hash1'))
      )
    })
  })

  describe('read access', () => {
    it('owner, payments.view and payments.confirm holders read all payments', async () => {
      for (const uid of ['owner1', 'viewer1', 'confirmer1']) {
        await assertSucceeds(getDoc(doc(as(uid), `${STORE}/payments/p2`)))
      }
    })

    it('a cashier reads only payments they recorded', async () => {
      await assertSucceeds(getDoc(doc(as('cashier1'), `${STORE}/payments/p1`)))
      await assertFails(getDoc(doc(as('cashier1'), `${STORE}/payments/p2`)))
    })

    it('strangers read nothing', async () => {
      await assertFails(getDoc(doc(as('stranger'), `${STORE}/payments/p1`)))
      await assertFails(getDoc(doc(as('stranger'), `${STORE}/paymentEvents/000000000001`)))
    })

    it('payment events: owner and viewers, not plain staff', async () => {
      await assertSucceeds(getDoc(doc(as('owner1'), `${STORE}/paymentEvents/000000000001`)))
      await assertSucceeds(getDoc(doc(as('viewer1'), `${STORE}/paymentEvents/000000000001`)))
      await assertFails(getDoc(doc(as('cashier1'), `${STORE}/paymentEvents/000000000001`)))
    })

    it('payment settings: any active member reads (to pick the flow), nobody writes', async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await setDoc(doc(context.firestore(), `${STORE}/paymentConfig/settings`), {
          cashConfirmation: 'each',
        })
      })
      await assertSucceeds(getDoc(doc(as('cashier1'), `${STORE}/paymentConfig/settings`)))
      await assertSucceeds(getDoc(doc(as('owner1'), `${STORE}/paymentConfig/settings`)))
      await assertFails(getDoc(doc(as('stranger'), `${STORE}/paymentConfig/settings`)))
      await assertFails(
        updateDoc(doc(as('owner1'), `${STORE}/paymentConfig/settings`), {
          cashConfirmation: 'end_of_day',
        })
      )
    })

    it('till counts: owner and payments viewers only', async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await setDoc(doc(context.firestore(), `${STORE}/tillCounts/t1`), { countedKobo: 100 })
      })
      await assertSucceeds(getDoc(doc(as('owner1'), `${STORE}/tillCounts/t1`)))
      await assertSucceeds(getDoc(doc(as('confirmer1'), `${STORE}/tillCounts/t1`)))
      await assertFails(getDoc(doc(as('cashier1'), `${STORE}/tillCounts/t1`)))
      await assertFails(deleteDoc(doc(as('owner1'), `${STORE}/tillCounts/t1`)))
    })

    it('chain head: owner only', async () => {
      await assertSucceeds(getDoc(doc(as('owner1'), `${STORE}/paymentAudit/head`)))
      await assertFails(getDoc(doc(as('viewer1'), `${STORE}/paymentAudit/head`)))
    })
  })

  describe('receipts', () => {
    it('clients cannot create a receipt with a paymentSummary', async () => {
      await assertFails(
        setDoc(doc(as('owner1'), `${STORE}/receipts/new`), {
          storeId: 's1',
          total: 10,
          paymentSummary: SUMMARY,
        })
      )
      await assertSucceeds(
        setDoc(doc(as('owner1'), `${STORE}/receipts/new`), { storeId: 's1', total: 10 })
      )
    })

    it('clients cannot write paymentSummary on any receipt', async () => {
      await assertFails(
        updateDoc(doc(as('owner1'), `${STORE}/receipts/legacy`), { paymentSummary: SUMMARY })
      )
      await assertFails(
        updateDoc(doc(as('owner1'), `${STORE}/receipts/locked`), {
          paymentSummary: { ...SUMMARY, status: 'paid' },
        })
      )
    })

    it.each([
      ['total', 1],
      ['items', []],
      ['customerName', 'Someone'],
      ['discountAmount', 40],
      ['deliveryFee', 0],
      ['currency', 'USD'],
      ['status', 'completed'],
      ['payments', [{ amount: 50 }]],
      ['amountPaid', 50],
    ])('once a payment exists, the owner cannot change %s', async (field, value) => {
      await assertFails(
        updateDoc(doc(as('owner1'), `${STORE}/receipts/locked`), { [field]: value })
      )
    })

    it('the old balance-payment carve-out is closed on V2 receipts', async () => {
      await assertFails(
        updateDoc(doc(as('cashier1'), `${STORE}/receipts/locked`), {
          amountPaid: 50,
          balanceDue: 0,
          status: 'completed',
        })
      )
    })

    it('notes stay editable, and V2 receipts cannot be deleted', async () => {
      await assertSucceeds(
        updateDoc(doc(as('owner1'), `${STORE}/receipts/locked`), { notes: 'Called customer' })
      )
      await assertFails(deleteDoc(doc(as('owner1'), `${STORE}/receipts/locked`)))
    })

    it('legacy receipts without V2 payments behave as before', async () => {
      await assertSucceeds(updateDoc(doc(as('owner1'), `${STORE}/receipts/legacy`), { total: 60 }))
      await assertSucceeds(
        updateDoc(doc(as('cashier1'), `${STORE}/receipts/legacy`), {
          amountPaid: 60,
          balanceDue: 0,
          status: 'completed',
        })
      )
    })
  })

  describe('payments permission grants are server-only', () => {
    it('the owner cannot grant payments access from the client', async () => {
      await assertFails(
        setDoc(doc(as('owner1'), `${STORE}/members/newStaff`), {
          authUid: 'newStaff',
          status: 'active',
          permissions: { payments: { view: true, confirm: true, refund: false } },
        })
      )
      await assertFails(
        updateDoc(doc(as('owner1'), `${STORE}/members/cashier1`), {
          permissions: { payments: { view: true, confirm: true, refund: true } },
        })
      )
      await assertFails(
        updateDoc(doc(as('owner1'), `${STORE}/members/confirmer1`), {
          'permissions.payments.confirm': false,
        })
      )
    })

    it('other permission edits still work when a payments grant exists', async () => {
      await assertSucceeds(
        setDoc(
          doc(as('owner1'), `${STORE}/members/confirmer1`),
          { permissions: { products: { view: true, create: true, edit: true, delete: false } } },
          { merge: true }
        )
      )
      await assertSucceeds(
        setDoc(doc(as('owner1'), `${STORE}/members/newStaff`), {
          authUid: 'newStaff',
          status: 'active',
          permissions: { products: { view: true, create: false, edit: false, delete: false } },
        })
      )
    })
  })

  describe('payment notifications are server-only', () => {
    const base = {
      title: 'x',
      message: 'x',
      userId: 'owner1',
      read: false,
      createdAt: new Date(),
    }

    it.each([
      'payment_awaiting_confirmation',
      'payment_rejected',
      'till_count_difference',
      'payout_changed',
      'payment_link_expired',
    ])(
      'a member cannot forge a %s notification',
      async (type) => {
        await assertFails(
          setDoc(doc(as('cashier1'), `${STORE}/notifications/n-${type}`), { ...base, type })
        )
      }
    )

    it('clients cannot claim the payments source or target recipients', async () => {
      await assertFails(
        setDoc(doc(as('cashier1'), `${STORE}/notifications/n1`), {
          ...base,
          type: 'receipt_created',
          source: 'payments_v2',
        })
      )
      await assertFails(
        setDoc(doc(as('owner1'), `${STORE}/notifications/n2`), {
          ...base,
          type: 'receipt_created',
          recipientUids: ['owner1'],
        })
      )
    })

    it('ordinary notifications still work', async () => {
      await assertSucceeds(
        setDoc(doc(as('cashier1'), `${STORE}/notifications/n3`), {
          ...base,
          type: 'receipt_created',
        })
      )
    })
  })
})
