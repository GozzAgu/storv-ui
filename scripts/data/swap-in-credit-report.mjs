#!/usr/bin/env node
/**
 * READ-ONLY: swap-in sales whose credit included the device's resale price. Until the fix, the
 * swap credit was the sum of every money field on the swap-in form (Unit Price + Cost Price),
 * and that sum was also saved as the swapped-in item's unitCost.
 *
 * For each swap-in receipt it reads the swapped-in item: if its saved unitCost equals the credit
 * and it has a resale price, the credit was over by that price. Prints counts and IDs only.
 *
 * Usage:
 *   node --env-file=.env scripts/data/swap-in-credit-report.mjs
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

const iso = (v) => (v?.toDate ? v.toDate().toISOString() : v ?? null)

initializeApp({ credential: cert(loadCredentials()) })
const db = getFirestore()
const report = { swapInSales: 0, overCredited: 0, totalOverCredit: 0, sales: [] }
const owners = await db.collection('users').where('role', '==', 'superAdmin').get()

for (const owner of owners.docs) {
  const stores = await owner.ref.collection('stores').get()
  for (const store of stores.docs) {
    const receipts = await store.ref.collection('receipts').where('isSwapIn', '==', true).get()
    for (const receipt of receipts.docs) {
      report.swapInSales++
      const r = receipt.data()
      if (!r.swapInItemId) continue
      const item = (await store.ref.collection('inventoryItems').doc(r.swapInItemId).get()).data()
      if (!item) continue
      const credit = Number(r.swapInCredit) || 0
      const resale = Number(item.price) || 0
      const savedCost = Number(item.unitCost) || 0
      if (resale > 0 && savedCost === credit && credit > resale) {
        report.overCredited++
        report.totalOverCredit += resale
        report.sales.push({
          ownerId: owner.id,
          storeId: store.id,
          receiptNumber: r.receiptNumber,
          receiptId: receipt.id,
          swapInItemId: r.swapInItemId,
          date: iso(r.date),
          creditGiven: credit,
          creditShouldBe: credit - resale,
          totalCharged: r.total,
          totalShouldBe: (Number(r.total) || 0) + resale,
        })
      }
    }
  }
}

console.log(JSON.stringify(report, null, 2))
