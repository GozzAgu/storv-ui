#!/usr/bin/env node
/**
 * READ-ONLY: serial items marked sold in the last N days that no receipt mentions. A New sale
 * marks stock sold before it saves the receipt, so a failed save can leave items like this.
 * Quantity (bulk) items cannot be checked this way: their count just went down.
 *
 * Prints counts and document IDs only. Writes nothing.
 *
 * Usage:
 *   node --env-file=.env scripts/data/sold-without-receipt-report.mjs [days=3]
 */
import { readFileSync } from 'node:fs'
import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore, Timestamp } from 'firebase-admin/firestore'

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

async function main() {
  const days = Number(process.argv[2] || 3)
  initializeApp({ credential: cert(loadCredentials()) })
  const db = getFirestore()
  const since = Timestamp.fromMillis(Date.now() - days * 86_400_000)
  // Receipts a little older than the window still cover items sold inside it.
  const receiptsSince = Timestamp.fromMillis(since.toMillis() - 86_400_000)

  const report = { days, storesChecked: 0, soldInWindow: 0, withoutReceipt: 0, stores: [] }
  const owners = await db.collection('users').where('role', '==', 'superAdmin').get()

  for (const owner of owners.docs) {
    const stores = await owner.ref.collection('stores').get()
    for (const store of stores.docs) {
      report.storesChecked++
      const [sold, receipts] = await Promise.all([
        store.ref.collection('inventoryItems').where('dateOut', '>=', since).get(),
        store.ref.collection('receipts').where('createdAt', '>=', receiptsSince).get(),
      ])
      if (sold.empty) continue
      report.soldInWindow += sold.size

      const onReceipts = new Set()
      for (const receipt of receipts.docs) {
        const data = receipt.data()
        for (const id of data.itemIds || []) onReceipts.add(id)
        for (const line of data.items || []) if (line?.itemId) onReceipts.add(line.itemId)
      }
      const missing = sold.docs.filter((item) => !onReceipts.has(item.id))
      if (missing.length === 0) continue
      report.withoutReceipt += missing.length
      report.stores.push({
        ownerId: owner.id,
        storeId: store.id,
        itemIds: missing.map((item) => item.id),
        markedSoldAt: missing.map((item) => item.data().dateOut?.toDate?.().toISOString() ?? null),
      })
    }
  }

  console.log(JSON.stringify(report, null, 2))
}

main().catch((err) => {
  console.error('Report failed:', err?.message || err)
  process.exit(1)
})
