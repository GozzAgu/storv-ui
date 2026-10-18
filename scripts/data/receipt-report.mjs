#!/usr/bin/env node
/**
 * READ-ONLY: find receipts by number and print their money and sync fields (no customer contact
 * details). Writes nothing.
 *
 * Usage:
 *   node --env-file=.env scripts/data/receipt-report.mjs REC-590514 [REC-716931 ...]
 *   node --env-file=.env scripts/data/receipt-report.mjs --zero-totals
 *     (every receipt saved with a total of 0 but priced item lines)
 */
import { readFileSync } from 'node:fs'
import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

function loadCredentials() {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)
  }
  const path = process.env.FIREBASE_SERVICE_ACCOUNT_PATH
  if (!path) {
    console.error('Set FIREBASE_SERVICE_ACCOUNT_PATH or FIREBASE_SERVICE_ACCOUNT_JSON')
    process.exit(2)
  }
  return JSON.parse(readFileSync(path, 'utf8'))
}

const iso = (v) =>
  v?.toDate ? v.toDate().toISOString() : v instanceof Date ? v.toISOString() : v ?? null

async function main() {
  const zeroTotals = process.argv.includes('--zero-totals')
  const numbers = process.argv.slice(2).filter((arg) => !arg.startsWith('--'))
  if (!numbers.length && !zeroTotals) {
    console.error('Pass one or more receipt numbers, or --zero-totals')
    process.exit(2)
  }
  initializeApp({ credential: cert(loadCredentials()) })
  const db = getFirestore()
  const owners = await db.collection('users').where('role', '==', 'superAdmin').get()
  const found = []
  for (const owner of owners.docs) {
    const stores = await owner.ref.collection('stores').get()
    for (const store of stores.docs) {
      const receipts = store.ref.collection('receipts')
      const snap = zeroTotals
        ? await receipts.where('total', '==', 0).get()
        : await receipts.where('receiptNumber', 'in', numbers).get()
      for (const doc of snap.docs) {
        const d = doc.data()
        const linesValue = (d.items || []).reduce(
          (sum, l) => sum + (Number(l.price) || 0) * (Number(l.quantity) || 0),
          0
        )
        if (zeroTotals && linesValue <= 0) continue
        found.push({
          ownerId: owner.id,
          storeId: store.id,
          receiptId: doc.id,
          receiptNumber: d.receiptNumber,
          total: d.total,
          itemsCount: d.itemsCount,
          items: (d.items || []).map((l) => ({
            itemId: l.itemId,
            quantity: l.quantity,
            price: l.price,
            priceType: typeof l.price,
            originalPrice: l.originalPrice,
            discountAmount: l.discountAmount,
            unitCost: l.unitCost,
          })),
          paymentMethod: d.paymentMethod,
          splitPayments: d.splitPayments,
          status: d.status,
          paymentsV2: d.paymentsV2 ?? null,
          paymentSummary: d.paymentSummary ? Object.keys(d.paymentSummary) : null,
          date: iso(d.date),
          createdAt: iso(d.createdAt),
          updatedAt: iso(d.updatedAt),
          createdBy: d.createdBy,
          actualCreator: d.actualCreator ?? null,
          source: d.source ?? d.channel ?? null,
          fieldNames: Object.keys(d).sort(),
        })
      }
    }
  }
  console.log(JSON.stringify(found, null, 2))
}

main().catch((err) => {
  console.error('Report failed:', err?.message || err)
  process.exit(1)
})
