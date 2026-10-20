// @vitest-environment node
import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { deleteApp, initializeApp, type App } from 'firebase-admin/app'
import { getFirestore, type Firestore } from 'firebase-admin/firestore'
import { resolveStoreActor } from '~/server/utils/sales/actor'
import { setApprovalPin, MAX_PIN_ATTEMPTS } from '~/server/utils/sales/approval-pin'
import {
  createSale,
  parseCreateSaleRequest,
  MAX_OFFLINE_AGE_MS,
} from '~/server/utils/sales/create-sale'
import { cancelBalanceDue, recordBalancePayment, refundSale } from '~/server/utils/sales/balance'
import { applyLedgerEntry } from '~/server/utils/sales/customer-ledger'
import { closeStockLoan, createStockLoan } from '~/server/utils/sales/stock-loans'

const OWNER = 'owner1'
const STORE = 's1'
const RECEIPTS = { view: true, create: true, edit: false, delete: false, refund: false }
const NO_PRODUCTS = { view: true, create: false, edit: false, delete: false }

describe.skipIf(!process.env.FIRESTORE_EMULATOR_HOST)('server sales (emulator)', () => {
  let app: App
  let db: Firestore

  const store = () => db.collection('users').doc(OWNER).collection('stores').doc(STORE)
  const item = (id: string) => store().collection('inventoryItems').doc(id)
  const actor = (uid: string) => resolveStoreActor(db, uid, OWNER, STORE)
  const sale = (body: Record<string, unknown>) =>
    parseCreateSaleRequest({ saleId: randomUUID().replace(/-/g, ''), ...body })

  beforeAll(() => {
    app = initializeApp({ projectId: 'storv-ui-test-sales' }, `sales-${randomUUID()}`)
    db = getFirestore(app)
  })

  afterAll(async () => {
    await deleteApp(app)
  })

  beforeEach(async () => {
    await db.recursiveDelete(db.collection('users').doc(OWNER))
    await db.collection('users').doc(OWNER).set({
      uid: OWNER,
      role: 'superAdmin',
      name: 'Ada Owner',
      subscription: 'storvv_enterprise',
    })
    await store().set({ ownerId: OWNER, name: 'Ikeja' })
    const member = (uid: string, extra: Record<string, unknown>) =>
      store()
        .collection('members')
        .doc(uid)
        .set({ authUid: uid, status: 'active', ...extra })
    await member('cashier', { permissions: { products: NO_PRODUCTS, receipts: RECEIPTS } })
    await member('manager', {
      permissions: { products: NO_PRODUCTS, receipts: { ...RECEIPTS, edit: true, refund: true } },
    })
    await member('refunder', {
      permissions: { products: NO_PRODUCTS, receipts: { ...RECEIPTS, refund: true } },
    })
    await store()
      .collection('inventoryFolders')
      .doc('phones')
      .set({
        name: 'Phones',
        hasSerialNumbers: true,
        template: {
          fields: [
            { name: 'name', label: 'Product', type: 'text' },
            { name: 'serialNo', label: 'Serial', type: 'text' },
            { name: 'costPrice', label: 'Cost Price', type: 'currency' },
            { name: 'price', label: 'Unit Price', type: 'currency' },
          ],
        },
      })
    await store()
      .collection('inventoryFolders')
      .doc('cables')
      .set({
        name: 'Cables',
        template: {
          fields: [
            { name: 'name', type: 'text' },
            { name: 'quantity', type: 'number' },
          ],
        },
      })
    await item('iphone').set({
      folderId: 'phones',
      storeId: STORE,
      name: 'iPhone 15',
      serialNo: 'SN1',
      price: 900_000,
    })
    await item('usb').set({
      folderId: 'cables',
      storeId: STORE,
      name: 'USB-C',
      price: 5_000,
      quantity: 10,
    })
    await item('noprice').set({ folderId: 'cables', storeId: STORE, name: 'Mystery', quantity: 3 })
  })

  describe('createSale', () => {
    it('prices from inventory and moves the stock, whatever the client claims', async () => {
      const input = sale({
        lines: [
          { itemId: 'iphone', quantity: 1 },
          { itemId: 'usb', quantity: 3 },
        ],
        total: 1_000,
        payment: { method: 'Cash' },
      })
      const result = await createSale(db, await actor('cashier'), input)
      expect(result.receipt.total).toBe(915_000)
      expect(result.receipt.actualCreator).toBe('cashier')
      expect((await item('iphone').get()).data()?.dateOut).toBeTruthy()
      expect((await item('usb').get()).data()?.quantity).toBe(7)
    })

    it('refuses to sell the same serial twice', async () => {
      const cashier = await actor('cashier')
      await createSale(db, cashier, sale({ lines: [{ itemId: 'iphone', quantity: 1 }] }))
      await expect(
        createSale(db, cashier, sale({ lines: [{ itemId: 'iphone', quantity: 1 }] }))
      ).rejects.toMatchObject({ data: { code: 'ITEM_SOLD' } })
    })

    it('records an offline retry once', async () => {
      const cashier = await actor('cashier')
      const input = sale({ lines: [{ itemId: 'usb', quantity: 2 }] })
      const first = await createSale(db, cashier, input)
      const again = await createSale(db, cashier, input)
      expect(again.created).toBe(false)
      expect(again.receiptId).toBe(first.receiptId)
      expect((await item('usb').get()).data()?.quantity).toBe(8)
    })

    it('refuses unpriced items and short stock', async () => {
      const cashier = await actor('cashier')
      await expect(
        createSale(db, cashier, sale({ lines: [{ itemId: 'noprice', quantity: 1 }] }))
      ).rejects.toMatchObject({ data: { code: 'ITEM_NO_PRICE' } })
      await expect(
        createSale(db, cashier, sale({ lines: [{ itemId: 'usb', quantity: 11 }] }))
      ).rejects.toMatchObject({ data: { code: 'INSUFFICIENT_STOCK' } })
    })

    it('needs a manager PIN for a discount above 10%, and locks after repeated wrong PINs', async () => {
      const cashier = await actor('cashier')
      const discounted = () =>
        sale({
          lines: [{ itemId: 'usb', quantity: 1, discountAmount: 1_000 }],
          discountReason: 'Loyal customer',
        })
      await expect(createSale(db, cashier, discounted())).rejects.toMatchObject({
        data: { code: 'APPROVAL_REQUIRED' },
      })
      await setApprovalPin(db, OWNER, 'manager', '4826')
      const approved = await createSale(db, cashier, {
        ...discounted(),
        approval: { approverUid: 'manager', pin: '4826' },
      })
      expect(approved.receipt.total).toBe(4_000)
      expect(approved.receipt.approvedBy).toBe('manager')

      for (let i = 0; i < MAX_PIN_ATTEMPTS; i++) {
        await expect(
          createSale(db, cashier, {
            ...discounted(),
            approval: { approverUid: 'manager', pin: '1111' },
          })
        ).rejects.toMatchObject({ data: { code: 'APPROVAL_PIN_WRONG' } })
      }
      await expect(
        createSale(db, cashier, {
          ...discounted(),
          approval: { approverUid: 'manager', pin: '4826' },
        })
      ).rejects.toMatchObject({ data: { code: 'APPROVAL_PIN_LOCKED' } })
    })

    it('lets a manager give a big discount without a PIN, but not approve their own as a cashier', async () => {
      const manager = await actor('manager')
      const result = await createSale(
        db,
        manager,
        sale({
          lines: [{ itemId: 'usb', quantity: 1, discountAmount: 2_500 }],
          discountReason: 'Damaged box',
        })
      )
      expect(result.receipt.total).toBe(2_500)
      await setApprovalPin(db, OWNER, 'cashier', '7391').catch(() => undefined)
      await expect(
        createSale(db, await actor('cashier'), {
          ...sale({
            lines: [{ itemId: 'usb', quantity: 1, discountAmount: 2_500 }],
            discountReason: 'x',
          }),
          approval: { approverUid: 'cashier', pin: '7391' },
        })
      ).rejects.toMatchObject({ statusCode: 403 })
    })

    it('credits a trade-in from its cost price, creates the item, and needs approval from a cashier', async () => {
      const cashier = await actor('cashier')
      const tradeIn = () =>
        sale({
          lines: [{ itemId: 'iphone', quantity: 1 }],
          swapIn: {
            folderId: 'phones',
            fields: {
              name: 'iPhone 12',
              serialNo: 'OLD1',
              costPrice: 300_000,
              unitCost: 1,
              swapIn: false,
            },
          },
        })
      await expect(createSale(db, cashier, tradeIn())).rejects.toMatchObject({
        data: { code: 'APPROVAL_REQUIRED' },
      })
      await setApprovalPin(db, OWNER, 'manager', '4826')
      const result = await createSale(db, cashier, {
        ...tradeIn(),
        approval: { approverUid: 'manager', pin: '4826' },
      })
      expect(result.receipt.swapInCredit).toBe(300_000)
      expect(result.receipt.total).toBe(600_000)
      const swapped = (await item(result.swapInItemId!).get()).data()
      expect(swapped).toMatchObject({
        swapIn: true,
        unitCost: 300_000,
        swapInReceiptId: result.receiptId,
      })
      expect(swapped?.price).toBeUndefined()
      expect(result.unpricedSwapInName).toMatch(/phone 12/i)
    })

    it('refuses a trade-in worth more than the sale', async () => {
      await expect(
        createSale(
          db,
          await actor('owner1'),
          sale({
            lines: [{ itemId: 'usb', quantity: 1 }],
            swapIn: { folderId: 'phones', fields: { name: 'Old phone', costPrice: 50_000 } },
          })
        )
      ).rejects.toMatchObject({ statusCode: 400 })
    })

    it('keeps commissions to the owner and admins with the commission extra', async () => {
      await expect(
        createSale(
          db,
          await actor('cashier'),
          sale({ lines: [{ itemId: 'usb', quantity: 1 }], commission: { amount: 500 } })
        )
      ).rejects.toMatchObject({ statusCode: 403 })
      const owned = await createSale(
        db,
        await actor(OWNER),
        sale({
          lines: [{ itemId: 'usb', quantity: 1 }],
          commission: { amount: 500, owedToName: 'Agent' },
        })
      )
      expect(owned.receipt).toMatchObject({
        total: 5_500,
        commissionAmount: 500,
        commissionStatus: 'owed',
      })
    })

    it('refuses offline sales older than three days and dates others when they happened', async () => {
      const cashier = await actor('cashier')
      const old = new Date(Date.now() - MAX_OFFLINE_AGE_MS - 60_000).toISOString()
      await expect(
        createSale(
          db,
          cashier,
          sale({ lines: [{ itemId: 'usb', quantity: 1 }], clientCreatedAt: old })
        )
      ).rejects.toMatchObject({ data: { code: 'OFFLINE_SALE_TOO_OLD' } })
      const hourAgo = new Date(Date.now() - 3_600_000).toISOString()
      const result = await createSale(
        db,
        cashier,
        sale({ lines: [{ itemId: 'usb', quantity: 1 }], clientCreatedAt: hourAgo })
      )
      expect(result.receipt.recordedOffline).toBe(true)
    })
  })

  describe('balance due, cancel and refund', () => {
    it('holds stock, takes payments under the cashier’s name, and releases stock when paid', async () => {
      const cashier = await actor('cashier')
      const held = await createSale(
        db,
        cashier,
        sale({
          lines: [{ itemId: 'iphone', quantity: 1 }],
          settlement: 'balance_due',
          deposit: 100_000,
        })
      )
      expect((await item('iphone').get()).data()).toMatchObject({
        pendingSaleReceiptId: held.receiptId,
      })
      await expect(
        recordBalancePayment(db, cashier, {
          receiptId: held.receiptId,
          amount: 900_000,
          method: 'Cash',
        })
      ).rejects.toMatchObject({ statusCode: 400 })
      const paid = await recordBalancePayment(db, cashier, {
        receiptId: held.receiptId,
        amount: 800_000,
        method: 'Transfer',
      })
      expect(paid.completed).toBe(true)
      const iphone = (await item('iphone').get()).data()
      expect(iphone?.dateOut).toBeTruthy()
      expect(iphone?.pendingSaleReceiptId).toBeUndefined()
      const receipt = (await store().collection('receipts').doc(held.receiptId).get()).data()
      expect(receipt?.payments.at(-1)).toMatchObject({ amount: 800_000, recordedBy: 'cashier' })
    })

    it('only lets the refund grant cancel an order, and frees its items', async () => {
      const held = await createSale(
        db,
        await actor('cashier'),
        sale({
          lines: [{ itemId: 'iphone', quantity: 1 }],
          settlement: 'balance_due',
          deposit: 50_000,
        })
      )
      await expect(
        cancelBalanceDue(db, await actor('cashier'), { receiptId: held.receiptId })
      ).rejects.toMatchObject({ statusCode: 403 })
      await cancelBalanceDue(db, await actor('refunder'), {
        receiptId: held.receiptId,
        reason: 'Changed mind',
      })
      expect((await item('iphone').get()).data()?.pendingSaleReceiptId).toBeUndefined()
    })

    it('returns stock on refund once', async () => {
      const sold = await createSale(
        db,
        await actor('cashier'),
        sale({ lines: [{ itemId: 'usb', quantity: 4 }] })
      )
      const refunder = await actor('refunder')
      await refundSale(db, refunder, { receiptId: sold.receiptId, reason: 'Faulty' })
      await refundSale(db, refunder, { receiptId: sold.receiptId, reason: 'Faulty' })
      expect((await item('usb').get()).data()?.quantity).toBe(10)
    })
  })

  describe('customer balances', () => {
    it('signs amounts by type, refuses overpayment, and keeps adjustments for managers', async () => {
      const cashier = await actor('cashier')
      const charged = await applyLedgerEntry(db, cashier, {
        customerName: 'Bola',
        phone: '08031234567',
        type: 'charge',
        amount: -20_000,
      })
      expect(charged.accountBalance).toBe(20_000)
      await expect(
        applyLedgerEntry(db, cashier, {
          customerName: 'Bola',
          phone: '08031234567',
          type: 'payment',
          amount: 25_000,
        })
      ).rejects.toMatchObject({ statusCode: 400 })
      await expect(
        applyLedgerEntry(db, cashier, {
          customerName: 'Bola',
          phone: '08031234567',
          type: 'adjustment',
          amount: -20_000,
        })
      ).rejects.toMatchObject({ statusCode: 403 })
      const paid = await applyLedgerEntry(db, cashier, {
        customerName: 'Bola',
        phone: '08031234567',
        type: 'payment',
        amount: 20_000,
      })
      expect(paid.accountBalance).toBe(0)
      expect(paid.entry.createdBy).toBe('cashier')
    })

    it('keeps the whole history of a long-standing account', async () => {
      const old = Array.from({ length: 60 }, (_, i) => ({
        id: `old${i}`,
        type: 'charge',
        amount: 100,
      }))
      await store().collection('customerAccounts').doc('phone:08030000000').set({
        contactKey: 'phone:08030000000',
        customerName: 'Tolu',
        accountBalance: 6_000,
        balanceLedger: old,
      })
      await applyLedgerEntry(db, await actor('cashier'), {
        customerName: 'Tolu',
        phone: '08030000000',
        type: 'payment',
        amount: 1_000,
      })
      const ledger = (
        await store().collection('customerAccounts').doc('phone:08030000000').get()
      ).data()?.balanceLedger
      expect(ledger).toHaveLength(61)
      expect(ledger[0].id).toBe('old0')
    })
  })

  describe('stock loans', () => {
    it('lends free items and only lets managers mark loaned stock as sold', async () => {
      const cashier = await actor('cashier')
      const { loanId } = await createStockLoan(db, cashier, {
        partyName: 'Reseller',
        itemIds: ['iphone'],
      })
      await expect(
        createStockLoan(db, cashier, { partyName: 'Other', itemIds: ['iphone'] })
      ).rejects.toMatchObject({
        statusCode: 409,
      })
      await expect(closeStockLoan(db, cashier, { loanId }, 'sold')).rejects.toMatchObject({
        statusCode: 403,
      })
      await closeStockLoan(db, await actor('manager'), { loanId }, 'sold')
      const iphone = (await item('iphone').get()).data()
      expect(iphone?.dateOut).toBeTruthy()
      expect(iphone?.sellerLoanOutId).toBeUndefined()
    })
  })
})
